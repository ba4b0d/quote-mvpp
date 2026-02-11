"""SQLite database for quote-mvpp v2."""

from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
from typing import Generator, Optional
import os

# Create database directory
os.makedirs('./data', exist_ok=True)

DATABASE_URL = "sqlite:///./data/quote.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Material(Base):
    """Material model."""
    __tablename__ = "materials"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price_per_kg = Column(Float, nullable=False)
    density_g_cm3 = Column(Float, default=1.24)
    waste_pct = Column(Float, default=0.05)
    color = Column(String)
    notes = Column(Text)
    is_public = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    title_fa = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Quote(Base):
    """Quote model."""
    __tablename__ = "quotes"
    
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(String, nullable=False)
    volume_cm3 = Column(Float)
    material_grams = Column(Float)
    print_time_minutes = Column(Float)
    total_cost = Column(Float)
    file_name = Column(String)
    file_size = Column(String)
    options = Column(Text)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)


class Settings(Base):
    """Settings model."""
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False)
    value = Column(Text, nullable=False)  # JSON value
    description = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class StaffUser(Base):
    """Staff user model."""
    __tablename__ = "staff_users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="staff")  # admin, staff
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_materials(db: Session):
    """Seed default materials."""
    default_materials = [
        {"name": "PLA Black", "price_per_kg": 1650000, "color": "Black", "density_g_cm3": 1.24},
        {"name": "PLA Orange", "price_per_kg": 1650000, "color": "Orange", "density_g_cm3": 1.24},
        {"name": "PLA Gray", "price_per_kg": 1650000, "color": "Gray", "density_g_cm3": 1.24},
        {"name": "PLA Red", "price_per_kg": 1650000, "color": "Red", "density_g_cm3": 1.24},
        {"name": "PLA White", "price_per_kg": 1650000, "color": "White", "density_g_cm3": 1.24},
        {"name": "PLA Silk Gold", "price_per_kg": 1750000, "color": "Gold Black", "density_g_cm3": 1.24},
        {"name": "PETG Black", "price_per_kg": 1750000, "color": "Black", "density_g_cm3": 1.24},
        {"name": "TPU (95A)", "price_per_kg": 2480000, "color": "Black", "density_g_cm3": 1.24},
        {"name": "WOOD Walnut", "price_per_kg": 1750000, "color": "Walnut", "density_g_cm3": 1.24},
    ]
    
    for mat in default_materials:
        existing = db.query(Material).filter(Material.name == mat["name"]).first()
        if not existing:
            db.add(Material(**mat))
    
    db.commit()


def seed_settings(db: Session):
    """Seed default settings."""
    default_settings = [
        {"key": "electricity_rate_per_kwh", "value": "812", "description": "Electricity rate per kWh in IRT"},
        {"key": "overhead_pct", "value": "0.3", "description": "Overhead percentage"},
        {"key": "markup_pct", "value": "2.0", "description": "Markup percentage"},
        {"key": "coloring_cost_per_hour", "value": "150000", "description": "Labor cost per hour in IRT"},
        {"key": "default_layer_height", "value": "0.2", "description": "Default layer height in mm"},
        {"key": "default_infill_pct", "value": "0.2", "description": "Default infill percentage"},
    ]
    
    for setting in default_settings:
        existing = db.query(Settings).filter(Settings.key == setting["key"]).first()
        if not existing:
            db.add(Settings(**setting))
    
    db.commit()
