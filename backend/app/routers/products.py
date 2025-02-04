from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/products", tags=["products"])

@router.post("/", response_model=schemas.Product)
async def create_product(
    product: schemas.ProductCreate,
    db: AsyncSession = Depends(get_db)
):
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product

@router.get("/search", response_model=schemas.ProductResponse)
async def search_products(
    query: str,
    page: int = 1,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    skip = (page - 1) * limit
    
    # Create search query
    search_query = select(models.Product).where(
        or_(
            models.Product.code.ilike(f"%{query}%"),
            models.Product.name.ilike(f"%{query}%")
        )
    )
    
    # Get total count
    result = await db.execute(select(models.Product).where(search_query.whereclause))
    total = len(result.scalars().all())
    
    # Get paginated results
    result = await db.execute(search_query.offset(skip).limit(limit))
    products = result.scalars().all()
    
    return {
        "total": total,
        "items": products
    }

@router.get("/{product_id}", response_model=schemas.Product)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.Product).filter(models.Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product

@router.put("/{product_id}", response_model=schemas.Product)
async def update_product(
    product_id: int,
    product: schemas.ProductCreate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.Product).filter(models.Product.id == product_id)
    )
    db_product = result.scalar_one_or_none()
    
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in product.model_dump().items():
        setattr(db_product, key, value)
    
    await db.commit()
    await db.refresh(db_product)
    return db_product
