"""Initial schema — countries, geo entities, generation & validation tables.

Revision ID: 0001_initial
Revises:
Create Date: 2026-09-07
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    op.create_table(
        "countries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(2), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("support_level", sa.String(32), nullable=False, server_default="planned"),
        sa.Column("default_locale", sa.String(16), nullable=False, server_default="en"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_countries_code", "countries", ["code"])

    op.create_table(
        "dataset_sources",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(256), nullable=False),
        sa.Column("source", sa.String(512), nullable=False),
        sa.Column("license", sa.String(128), nullable=False),
        sa.Column("version", sa.String(64)),
        sa.Column("coverage", sa.String(256)),
        sa.Column("download_date", sa.DateTime(timezone=True)),
        sa.Column("attribution_requirements", sa.Text()),
        sa.Column("redistribution_permissions", sa.Text()),
        sa.Column("metadata_json", postgresql.JSONB()),
    )

    op.create_table(
        "regions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("country_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("countries.id")),
        sa.Column("code", sa.String(32), nullable=False),
        sa.Column("name", sa.String(256), nullable=False),
        sa.UniqueConstraint("country_id", "code", name="uq_region_country_code"),
    )
    op.create_index("ix_regions_country_id", "regions", ["country_id"])

    op.create_table(
        "cities",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("country_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("countries.id")),
        sa.Column("region_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("regions.id")),
        sa.Column("name", sa.String(256), nullable=False),
        sa.Column("latitude", sa.Float()),
        sa.Column("longitude", sa.Float()),
    )
    op.create_index("ix_cities_country_id", "cities", ["country_id"])
    op.create_index("ix_cities_name", "cities", ["name"])

    op.create_table(
        "postal_codes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("country_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("countries.id")),
        sa.Column("city_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cities.id")),
        sa.Column("code", sa.String(32), nullable=False),
        sa.Column("latitude", sa.Float()),
        sa.Column("longitude", sa.Float()),
        sa.UniqueConstraint("country_id", "code", name="uq_postal_country_code"),
    )
    op.create_index("ix_postal_codes_code", "postal_codes", ["code"])

    op.create_table(
        "generated_batches",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("country_code", sa.String(2), nullable=False),
        sa.Column("requested_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_generated_batches_country_code", "generated_batches", ["country_code"])

    op.create_table(
        "generated_addresses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("batch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("generated_batches.id")),
        sa.Column("country_code", sa.String(2), nullable=False),
        sa.Column("formatted_address", sa.Text(), nullable=False),
        sa.Column("components_json", postgresql.JSONB(), nullable=False),
        sa.Column("latitude", sa.Float()),
        sa.Column("longitude", sa.Float()),
        sa.Column("format_valid", sa.Boolean()),
        sa.Column("postal_valid", sa.Boolean()),
        sa.Column("geographic_valid", sa.Boolean()),
        sa.Column("geocoded", sa.Boolean()),
        sa.Column("map_verified", sa.Boolean()),
        sa.Column("deliverability_verified", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_generated_addresses_country_code", "generated_addresses", ["country_code"])

    op.create_table(
        "validation_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("country_code", sa.String(2), nullable=False),
        sa.Column("address_hash", sa.String(64)),
        sa.Column("result_json", postgresql.JSONB(), nullable=False),
        sa.Column("persisted_raw", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.create_table(
        "geocoding_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("provider", sa.String(64), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("query_hash", sa.String(64)),
        sa.Column("latitude", sa.Float()),
        sa.Column("longitude", sa.Float()),
        sa.Column("formatted_address", sa.Text()),
        sa.Column("provider_reference", sa.String(128)),
        sa.Column("payload_json", postgresql.JSONB()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_geocoding_results_query_hash", "geocoding_results", ["query_hash"])


def downgrade() -> None:
    op.drop_table("geocoding_results")
    op.drop_table("validation_results")
    op.drop_table("generated_addresses")
    op.drop_table("generated_batches")
    op.drop_table("postal_codes")
    op.drop_table("cities")
    op.drop_table("regions")
    op.drop_table("dataset_sources")
    op.drop_table("countries")
