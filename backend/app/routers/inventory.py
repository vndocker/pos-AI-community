from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/inventory", tags=["inventory"])

@router.post("/record", response_model=schemas.InventoryRecord)
async def create_inventory_record(
    record: schemas.InventoryRecordCreate,
    db: AsyncSession = Depends(get_db)
):
    # Verify product exists
    result = await db.execute(
        select(models.Product).filter(models.Product.id == record.product_id)
    )
    product = result.scalar_one_or_none()
    
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Create inventory record
    db_record = models.InventoryRecord(**record.model_dump())
    db.add(db_record)
    
    # Update product quantity
    product.quantity += record.quantity_change
    
    if product.quantity < 0:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    await db.commit()
    await db.refresh(db_record)
    return db_record

@router.get("/history/{product_id}", response_model=schemas.InventoryResponse)
async def get_inventory_history(
    product_id: int,
    page: int = 1,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    skip = (page - 1) * limit
    
    # Verify product exists
    product_result = await db.execute(
        select(models.Product).filter(models.Product.id == product_id)
    )
    if product_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get total count
    count_result = await db.execute(
        select(models.InventoryRecord)
        .filter(models.InventoryRecord.product_id == product_id)
    )
    total = len(count_result.scalars().all())
    
    # Get paginated results
    result = await db.execute(
        select(models.InventoryRecord)
        .filter(models.InventoryRecord.product_id == product_id)
        .options(selectinload(models.InventoryRecord.product))
        .order_by(models.InventoryRecord.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    records = result.scalars().all()
    
    return {
        "total": total,
        "items": records
    }

@router.get("/low-stock", response_model=List[schemas.Product])
async def get_low_stock_products(
    threshold: int = 10,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.Product)
        .filter(models.Product.quantity <= threshold)
        .order_by(models.Product.quantity)
    )
    products = result.scalars().all()
    return products
