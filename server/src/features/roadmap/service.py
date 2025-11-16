from loguru import logger
from typing import Optional
from .models import Roadmap, RoadmapNode, RoadmapNodeStatus
from .generator import generate_roadmap
from config.models import Model


class RoadmapService:
    """Service layer for roadmap operations"""

    @staticmethod
    async def create_roadmap(topic: str, model_name: str = Model.GPT_4O_MINI.value) -> dict:
        """
        Create a new roadmap with AI-generated structure.

        Args:
            topic: The learning topic
            model_name: AI model to use for generation

        Returns:
            dict: Roadmap data with nodes

        Raises:
            ValueError: If creation fails
        """
        try:
            logger.info(f"Creating roadmap for topic: {topic}")

            # Generate roadmap using AI
            roadmap, nodes = await generate_roadmap(topic, model_name)

            logger.info(f"Created roadmap {roadmap.public_id} with {len(nodes)} nodes")

            return {
                "roadmap": roadmap.to_dict(),
                "nodes": [node.to_dict() for node in nodes]
            }

        except Exception as e:
            logger.error(f"Failed to create roadmap: {e}")
            raise ValueError(f"Failed to create roadmap: {str(e)}")

    @staticmethod
    async def get_roadmap(roadmap_id: str) -> Optional[dict]:
        """
        Get a roadmap with all its nodes.

        Args:
            roadmap_id: The roadmap public ID

        Returns:
            dict: Roadmap data with nodes, or None if not found
        """
        roadmap = await Roadmap.get_by_public_id(roadmap_id)
        if not roadmap:
            return None

        # Build hierarchical structure
        nodes_data = [node.to_dict() for node in roadmap.nodes]

        return {
            "roadmap": roadmap.to_dict(),
            "nodes": nodes_data
        }

    @staticmethod
    async def list_roadmaps() -> list[dict]:
        """
        Get all roadmaps ordered by most recent.

        Returns:
            list: List of roadmap summaries
        """
        roadmaps = await Roadmap.get_all()
        return [
            {
                "public_id": r.public_id,
                "title": r.title,
                "description": r.description,
                "total_nodes": r.total_nodes,
                "completed_nodes": r.completed_nodes,
                "progress_percentage": (r.completed_nodes / r.total_nodes * 100) if r.total_nodes > 0 else 0,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None
            }
            for r in roadmaps
        ]

    @staticmethod
    async def delete_roadmap(roadmap_id: str) -> bool:
        """
        Delete a roadmap and all its nodes.

        Args:
            roadmap_id: The roadmap public ID

        Returns:
            bool: True if deleted, False if not found
        """
        try:
            success = await Roadmap.delete_roadmap(roadmap_id)
            if success:
                logger.info(f"Deleted roadmap: {roadmap_id}")
            return success
        except Exception as e:
            logger.error(f"Failed to delete roadmap {roadmap_id}: {e}")
            raise

    @staticmethod
    async def update_node_status(node_id: str, status: int) -> Optional[dict]:
        """
        Update a node's status and recalculate roadmap progress.

        Args:
            node_id: The node public ID
            status: New status (0=Not Started, 1=In Progress, 2=Completed)

        Returns:
            dict: Updated node data, or None if not found
        """
        if status not in [RoadmapNodeStatus.NOT_STARTED, RoadmapNodeStatus.IN_PROGRESS, RoadmapNodeStatus.COMPLETED]:
            raise ValueError(f"Invalid status: {status}")

        node = await RoadmapNode.update_status(node_id, status)
        if not node:
            return None

        logger.info(f"Updated node {node_id} status to {status}")

        return node.to_dict()

    @staticmethod
    async def get_node(node_id: str) -> Optional[dict]:
        """
        Get a single node by ID.

        Args:
            node_id: The node public ID

        Returns:
            dict: Node data, or None if not found
        """
        node = await RoadmapNode.get_by_public_id(node_id)
        if not node:
            return None

        return node.to_dict()

    @staticmethod
    async def get_node_children(node_id: str) -> list[dict]:
        """
        Get all children of a node.

        Args:
            node_id: The parent node public ID

        Returns:
            list: List of child nodes
        """
        children = await RoadmapNode.get_children(node_id)
        return [child.to_dict() for child in children]

    @staticmethod
    async def get_roadmap_progress(roadmap_id: str) -> Optional[dict]:
        """
        Get detailed progress information for a roadmap.

        Args:
            roadmap_id: The roadmap public ID

        Returns:
            dict: Progress statistics
        """
        roadmap = await Roadmap.get_by_public_id(roadmap_id)
        if not roadmap:
            return None

        # Calculate statistics
        total = len(roadmap.nodes)
        completed = sum(1 for node in roadmap.nodes if node.status == RoadmapNodeStatus.COMPLETED)
        in_progress = sum(1 for node in roadmap.nodes if node.status == RoadmapNodeStatus.IN_PROGRESS)
        not_started = sum(1 for node in roadmap.nodes if node.status == RoadmapNodeStatus.NOT_STARTED)

        # Difficulty breakdown
        beginner_total = sum(1 for node in roadmap.nodes if node.difficulty == 0)
        beginner_completed = sum(1 for node in roadmap.nodes if node.difficulty == 0 and node.status == RoadmapNodeStatus.COMPLETED)

        intermediate_total = sum(1 for node in roadmap.nodes if node.difficulty == 1)
        intermediate_completed = sum(1 for node in roadmap.nodes if node.difficulty == 1 and node.status == RoadmapNodeStatus.COMPLETED)

        advanced_total = sum(1 for node in roadmap.nodes if node.difficulty == 2)
        advanced_completed = sum(1 for node in roadmap.nodes if node.difficulty == 2 and node.status == RoadmapNodeStatus.COMPLETED)

        return {
            "roadmap_id": roadmap.public_id,
            "title": roadmap.title,
            "total_nodes": total,
            "completed_nodes": completed,
            "in_progress_nodes": in_progress,
            "not_started_nodes": not_started,
            "progress_percentage": (completed / total * 100) if total > 0 else 0,
            "difficulty_breakdown": {
                "beginner": {
                    "total": beginner_total,
                    "completed": beginner_completed,
                    "percentage": (beginner_completed / beginner_total * 100) if beginner_total > 0 else 0
                },
                "intermediate": {
                    "total": intermediate_total,
                    "completed": intermediate_completed,
                    "percentage": (intermediate_completed / intermediate_total * 100) if intermediate_total > 0 else 0
                },
                "advanced": {
                    "total": advanced_total,
                    "completed": advanced_completed,
                    "percentage": (advanced_completed / advanced_total * 100) if advanced_total > 0 else 0
                }
            }
        }
