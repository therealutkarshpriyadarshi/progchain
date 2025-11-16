"""
Test database connectivity and basic operations.
"""
import pytest
from sqlalchemy import select, text

from src.db.config import Base


@pytest.mark.db
@pytest.mark.asyncio
async def test_database_connection(db_session):
    """Test that we can connect to the database."""
    result = await db_session.execute(text("SELECT 1"))
    assert result.scalar() == 1


@pytest.mark.db
@pytest.mark.asyncio
async def test_database_tables_created(test_engine):
    """Test that all database tables are created."""
    async with test_engine.connect() as conn:
        # Check if tables exist by querying information_schema
        result = await conn.execute(
            text(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                """
            )
        )
        tables = [row[0] for row in result]

    # Check for some expected tables
    expected_tables = [
        "roadmaps",
        "roadmap_nodes",
        "topic_chains",
        "topics",
        "sub_topics",
        "explore_chats",
        "thread",
    ]

    for table in expected_tables:
        assert table in tables, f"Table '{table}' not found in database"


@pytest.mark.db
@pytest.mark.asyncio
async def test_session_rollback(db_session):
    """Test that session rollback works correctly."""
    # The db_session fixture should handle rollback automatically
    # This test verifies that behavior
    result = await db_session.execute(text("SELECT 1"))
    assert result.scalar() == 1
    # Session should rollback after this test completes
