from db import Base, TimestampMixin, PublicIDMixin, with_session
from sqlalchemy import (
    Column,
    String,
    Integer,
    ForeignKey,
    CheckConstraint,
    Index,
    select,
    func
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import relationship, selectinload
from pydantic import BaseModel, Field
from enum import IntEnum
from typing import Optional


class RoadmapNodeStatus(IntEnum):
    """Status of a roadmap node"""
    NOT_STARTED = 0
    IN_PROGRESS = 1
    COMPLETED = 2


class RoadmapNodeCreate(BaseModel):
    """Schema for creating a roadmap node"""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=500)
    difficulty: Optional[int] = Field(None, ge=0, le=2)
    parent_node_id: Optional[str] = None
    position: int = Field(default=0, ge=0)


class Roadmap(Base, TimestampMixin, PublicIDMixin):
    """Top-level learning roadmap container"""
    __tablename__ = "roadmaps"

    title = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    total_nodes = Column(Integer, nullable=False, default=0)
    completed_nodes = Column(Integer, nullable=False, default=0)

    nodes = relationship(
        "RoadmapNode",
        back_populates="roadmap",
        cascade="all, delete-orphan",
        order_by="RoadmapNode.position"
    )

    __table_args__ = (
        Index('idx_roadmap_updated', 'updated_at', 'public_id'),
    )

    @classmethod
    @with_session()
    async def create(cls, session: AsyncSession, title: str, description: Optional[str] = None) -> "Roadmap":
        """Create a new roadmap"""
        roadmap = cls(
            title=title,
            description=description,
            public_id=cls.generate_public_id()
        )
        session.add(roadmap)
        return roadmap

    @classmethod
    @with_session()
    async def get_by_public_id(cls, session: AsyncSession, public_id: str) -> Optional["Roadmap"]:
        """Get roadmap by public ID with all nodes loaded"""
        query = (
            select(cls)
            .where(cls.public_id == public_id)
            .options(selectinload(cls.nodes))
        )
        result = await session.execute(query)
        return result.scalar_one_or_none()

    @classmethod
    @with_session()
    async def get_all(cls, session: AsyncSession) -> list["Roadmap"]:
        """Get all roadmaps ordered by most recently updated"""
        query = select(cls).order_by(cls.updated_at.desc())
        result = await session.execute(query)
        return list(result.scalars().all())

    @classmethod
    @with_session()
    async def update_progress(cls, session: AsyncSession, roadmap_id: str) -> None:
        """Recalculate and update roadmap progress"""
        roadmap = await cls.get_by_public_id(session, roadmap_id)
        if not roadmap:
            return

        total = len(roadmap.nodes)
        completed = sum(1 for node in roadmap.nodes if node.status == RoadmapNodeStatus.COMPLETED)

        roadmap.total_nodes = total
        roadmap.completed_nodes = completed
        await session.commit()

    @classmethod
    @with_session()
    async def delete_roadmap(cls, session: AsyncSession, public_id: str) -> bool:
        """Delete a roadmap and all its nodes"""
        roadmap = await cls.get_by_public_id(session, public_id)
        if not roadmap:
            return False

        await session.delete(roadmap)
        await session.commit()
        return True


class RoadmapNode(Base, TimestampMixin, PublicIDMixin):
    """Individual node in the learning roadmap tree"""
    __tablename__ = "roadmap_nodes"

    # Core fields
    roadmap_id = Column(
        String,
        ForeignKey("roadmaps.public_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(
        Integer,
        nullable=False,
        default=RoadmapNodeStatus.NOT_STARTED
    )

    # Tree structure
    parent_node_id = Column(
        String,
        ForeignKey("roadmap_nodes.public_id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    position = Column(Integer, nullable=False, default=0)
    difficulty = Column(Integer, nullable=True)  # 0=Easy, 1=Medium, 2=Hard

    # Relationships
    roadmap = relationship("Roadmap", back_populates="nodes")
    parent = relationship(
        "RoadmapNode",
        remote_side="RoadmapNode.public_id",
        backref="children"
    )

    __table_args__ = (
        CheckConstraint(
            f'status >= {RoadmapNodeStatus.NOT_STARTED} AND status <= {RoadmapNodeStatus.COMPLETED}',
            name='check_valid_status'
        ),
        CheckConstraint(
            'difficulty IS NULL OR (difficulty >= 0 AND difficulty <= 2)',
            name='check_valid_difficulty'
        ),
        Index('idx_node_roadmap_position', 'roadmap_id', 'position'),
        Index('idx_node_parent', 'parent_node_id'),
    )

    @classmethod
    @with_session()
    async def create(
        cls,
        session: AsyncSession,
        roadmap_id: str,
        title: str,
        description: str,
        parent_node_id: Optional[str] = None,
        position: int = 0,
        difficulty: Optional[int] = None
    ) -> "RoadmapNode":
        """Create a new roadmap node"""
        node = cls(
            roadmap_id=roadmap_id,
            title=title,
            description=description,
            parent_node_id=parent_node_id,
            position=position,
            difficulty=difficulty,
            public_id=cls.generate_public_id()
        )
        session.add(node)
        return node

    @classmethod
    @with_session()
    async def batch_create(
        cls,
        session: AsyncSession,
        roadmap_id: str,
        nodes: list[dict]
    ) -> list["RoadmapNode"]:
        """Create multiple nodes in batch"""
        created_nodes = []
        for node_data in nodes:
            node = cls(
                roadmap_id=roadmap_id,
                title=node_data['title'],
                description=node_data['description'],
                parent_node_id=node_data.get('parent_node_id'),
                position=node_data.get('position', 0),
                difficulty=node_data.get('difficulty'),
                public_id=cls.generate_public_id()
            )
            session.add(node)
            created_nodes.append(node)

        await session.flush()
        return created_nodes

    @classmethod
    @with_session()
    async def update_status(
        cls,
        session: AsyncSession,
        node_id: str,
        status: int
    ) -> Optional["RoadmapNode"]:
        """Update node status"""
        node = await cls.get_by_public_id(session, node_id)
        if not node:
            return None

        node.status = status
        await session.commit()

        # Update roadmap progress
        await Roadmap.update_progress(session, node.roadmap_id)

        return node

    @classmethod
    @with_session()
    async def get_by_public_id(cls, session: AsyncSession, public_id: str) -> Optional["RoadmapNode"]:
        """Get node by public ID"""
        query = select(cls).where(cls.public_id == public_id)
        result = await session.execute(query)
        return result.scalar_one_or_none()

    @classmethod
    @with_session()
    async def get_children(cls, session: AsyncSession, node_id: str) -> list["RoadmapNode"]:
        """Get all children of a node"""
        query = (
            select(cls)
            .where(cls.parent_node_id == node_id)
            .order_by(cls.position)
        )
        result = await session.execute(query)
        return list(result.scalars().all())
