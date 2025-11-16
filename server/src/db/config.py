import logging
import os

from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.declarative import declarative_base

from contextlib import asynccontextmanager
from dotenv import load_dotenv


# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Get database URL from environment variable with fallback
ASYNC_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://progchain:progchain@localhost:5432/progchain"
)

# Create engine with appropriate pool settings for PostgreSQL
engine_kwargs = {
    "echo": os.getenv("ENVIRONMENT", "development") == "development",
    "pool_pre_ping": True,  # Enable connection health checks
    "pool_size": 10,  # Default connection pool size
    "max_overflow": 20,  # Max connections that can be created beyond pool_size
}

async_engine = create_async_engine(ASYNC_DATABASE_URL, **engine_kwargs)

AsyncSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=async_engine,
    class_=AsyncSession
)
Base = declarative_base()


@asynccontextmanager
async def db_session():
    """
    Robust asynchronous context manager for handling database sessions.

    This function yields an AsyncSession and ensures that the session is
    properly committed if everything goes well, or rolled back if an error occurs.
    Additionally, it automatically refreshes and detaches objects before commit
    to ensure they're usable outside the session.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            for obj in session.identity_map.values():
                await session.refresh(obj)
            session.expunge_all()
            await session.commit()
        except Exception as error:
            logger.exception("Error during DB session; rolling back.")
            await session.rollback()
            raise error
        finally:
            await session.close()


async def init_db():
    """
    Asynchronously initialize the database by creating all tables defined in Base.
    """
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
