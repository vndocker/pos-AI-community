from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), index=True, nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    inventory_records = relationship("InventoryRecord", back_populates="product")
    invoice_items = relationship("InvoiceItem", back_populates="product")

class InventoryRecord(Base):
    __tablename__ = "inventory_records"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity_change = Column(Integer, nullable=False)  # Positive for in, negative for out
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    product = relationship("Product", back_populates="inventory_records")

class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, index=True)
    total_amount = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    items = relationship("InvoiceItem", back_populates="invoice")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    
    invoice = relationship("Invoice", back_populates="items")
    product = relationship("Product", back_populates="invoice_items")
