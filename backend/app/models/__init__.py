"""SQLAlchemy models — core geographic & audit entities."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Country(Base):
    __tablename__ = "countries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(2), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    support_level: Mapped[str] = mapped_column(String(32), nullable=False, default="planned")
    default_locale: Mapped[str] = mapped_column(String(16), nullable=False, default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class DatasetSource(Base):
    __tablename__ = "dataset_sources"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    source: Mapped[str] = mapped_column(String(512), nullable=False)
    license: Mapped[str] = mapped_column(String(128), nullable=False)
    version: Mapped[str | None] = mapped_column(String(64))
    coverage: Mapped[str | None] = mapped_column(String(256))
    download_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    attribution_requirements: Mapped[str | None] = mapped_column(Text)
    redistribution_permissions: Mapped[str | None] = mapped_column(Text)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB)


class Region(Base):
    __tablename__ = "regions"
    __table_args__ = (UniqueConstraint("country_id", "code", name="uq_region_country_code"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    country_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("countries.id"), index=True)
    code: Mapped[str] = mapped_column(String(32), nullable=False)
    name: Mapped[str] = mapped_column(String(256), nullable=False)


class City(Base):
    __tablename__ = "cities"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    country_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("countries.id"), index=True)
    region_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("regions.id"), index=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)


class PostalCode(Base):
    __tablename__ = "postal_codes"
    __table_args__ = (UniqueConstraint("country_id", "code", name="uq_postal_country_code"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    country_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("countries.id"), index=True)
    city_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cities.id"), index=True)
    code: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)


class GeneratedBatch(Base):
    __tablename__ = "generated_batches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    country_code: Mapped[str] = mapped_column(String(2), nullable=False, index=True)
    requested_count: Mapped[int] = mapped_column(nullable=False, default=1)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    addresses: Mapped[list["GeneratedAddressRecord"]] = relationship(back_populates="batch")


class GeneratedAddressRecord(Base):
    __tablename__ = "generated_addresses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("generated_batches.id"), index=True)
    country_code: Mapped[str] = mapped_column(String(2), nullable=False, index=True)
    formatted_address: Mapped[str] = mapped_column(Text, nullable=False)
    components_json: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    format_valid: Mapped[bool | None] = mapped_column(Boolean)
    postal_valid: Mapped[bool | None] = mapped_column(Boolean)
    geographic_valid: Mapped[bool | None] = mapped_column(Boolean)
    geocoded: Mapped[bool | None] = mapped_column(Boolean)
    map_verified: Mapped[bool | None] = mapped_column(Boolean)
    deliverability_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    batch: Mapped[GeneratedBatch | None] = relationship(back_populates="addresses")


class ValidationResultRecord(Base):
    """Optional persistence — disabled by default for privacy."""

    __tablename__ = "validation_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    country_code: Mapped[str] = mapped_column(String(2), nullable=False, index=True)
    # Raw address omitted by default; store hash only if user opts into history
    address_hash: Mapped[str | None] = mapped_column(String(64))
    result_json: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    persisted_raw: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class GeocodingResultRecord(Base):
    __tablename__ = "geocoding_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    query_hash: Mapped[str | None] = mapped_column(String(64), index=True)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    formatted_address: Mapped[str | None] = mapped_column(Text)
    provider_reference: Mapped[str | None] = mapped_column(String(128))
    payload_json: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
