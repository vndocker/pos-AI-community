from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime
from typing import List
from .. import models, schemas
from ..database import get_db
from fastapi.responses import HTMLResponse
from jinja2 import Environment, PackageLoader, select_autoescape

router = APIRouter(prefix="/invoices", tags=["invoices"])

# Setup Jinja2 template environment
env = Environment(
    loader=PackageLoader("app", "templates"),
    autoescape=select_autoescape(['html', 'xml'])
)

@router.post("/", response_model=schemas.Invoice)
async def create_invoice(
    invoice: schemas.InvoiceCreate,
    db: AsyncSession = Depends(get_db)
):
    # Generate invoice number (format: INV-YYYYMMDD-XXXX)
    today = datetime.now()
    count_result = await db.execute(
        select(models.Invoice).filter(
            models.Invoice.invoice_number.like(f"INV-{today.strftime('%Y%m%d')}%")
        )
    )
    today_invoices = len(count_result.scalars().all())
    invoice_number = f"INV-{today.strftime('%Y%m%d')}-{str(today_invoices + 1).zfill(4)}"
    
    # Create invoice
    db_invoice = models.Invoice(invoice_number=invoice_number)
    db.add(db_invoice)
    await db.flush()  # Get invoice ID
    
    total_amount = 0
    
    # Process each item
    for item in invoice.items:
        # Get product
        result = await db.execute(
            select(models.Product).filter(models.Product.id == item.product_id)
        )
        product = result.scalar_one_or_none()
        
        if product is None:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for product {product.name}"
            )
        
        # Create invoice item
        total_price = item.quantity * item.unit_price
        db_item = models.InvoiceItem(
            invoice_id=db_invoice.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=total_price
        )
        db.add(db_item)
        
        # Update product quantity
        product.quantity -= item.quantity
        
        # Create inventory record
        inventory_record = models.InventoryRecord(
            product_id=product.id,
            quantity_change=-item.quantity,
            notes=f"Sale invoice #{invoice_number}"
        )
        db.add(inventory_record)
        
        total_amount += total_price
    
    db_invoice.total_amount = total_amount
    await db.commit()
    await db.refresh(db_invoice)
    
    return db_invoice

@router.get("/{invoice_id}", response_model=schemas.Invoice)
async def get_invoice(
    invoice_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.Invoice)
        .filter(models.Invoice.id == invoice_id)
        .options(
            selectinload(models.Invoice.items).selectinload(models.InvoiceItem.product)
        )
    )
    invoice = result.scalar_one_or_none()
    
    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return invoice

@router.get("/print/{invoice_id}", response_class=HTMLResponse)
async def print_invoice(
    invoice_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(models.Invoice)
        .filter(models.Invoice.id == invoice_id)
        .options(
            selectinload(models.Invoice.items).selectinload(models.InvoiceItem.product)
        )
    )
    invoice = result.scalar_one_or_none()
    
    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    template = env.get_template("invoice_template.html")
    return template.render(invoice=invoice)

@router.get("/", response_model=schemas.InvoiceResponse)
async def list_invoices(
    page: int = 1,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    skip = (page - 1) * limit
    
    # Get total count
    count_result = await db.execute(select(models.Invoice))
    total = len(count_result.scalars().all())
    
    # Get paginated results
    result = await db.execute(
        select(models.Invoice)
        .options(
            selectinload(models.Invoice.items).selectinload(models.InvoiceItem.product)
        )
        .order_by(models.Invoice.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    invoices = result.scalars().all()
    
    return {
        "total": total,
        "items": invoices
    }
