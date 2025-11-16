from loguru import logger
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional
import json

from .service import RoadmapService
from .generator import RoadmapGenerator
from config.models import Model

router = APIRouter(
    prefix="/roadmap",
    tags=["roadmap"],
)


class CreateRoadmapRequest(BaseModel):
    """Request to create a new roadmap"""
    topic: str = Field(..., min_length=1, max_length=200, description="The topic to create a roadmap for")
    model: Optional[str] = Field(default=Model.GPT_4O_MINI.value, description="AI model to use")


class UpdateNodeStatusRequest(BaseModel):
    """Request to update a node's status"""
    status: int = Field(..., ge=0, le=2, description="0=Not Started, 1=In Progress, 2=Completed")


@router.post("/create")
async def create_roadmap(request: CreateRoadmapRequest):
    """
    Create a new learning roadmap with AI-generated structure.

    This endpoint generates a comprehensive learning path with hierarchical topics.
    Returns the complete roadmap with all nodes.
    """
    try:
        logger.info(f"Creating roadmap for topic: {request.topic}")
        result = await RoadmapService.create_roadmap(request.topic, request.model)
        return result
    except ValueError as e:
        logger.error(f"Validation error creating roadmap: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating roadmap: {e}")
        raise HTTPException(status_code=500, detail="Failed to create roadmap")


@router.post("/create-stream")
async def create_roadmap_stream(request: CreateRoadmapRequest):
    """
    Create a new roadmap with streaming response for real-time generation feedback.

    This is useful for showing progress to the user as the AI generates the roadmap.
    """
    async def roadmap_stream():
        try:
            # Stream the generation process
            yield f"data: {json.dumps({'status': 'generating', 'message': 'Generating roadmap structure...'})}\n\n"

            generator = RoadmapGenerator(request.topic, request.model)
            roadmap_data = await generator.generate()

            yield f"data: {json.dumps({'status': 'creating', 'message': 'Creating database records...'})}\n\n"

            roadmap, nodes = await generator.create_roadmap_with_nodes()

            result = {
                "status": "complete",
                "roadmap": roadmap.to_dict(),
                "nodes": [node.to_dict() for node in nodes]
            }

            yield f"data: {json.dumps(result)}\n\n"

        except Exception as e:
            logger.error(f"Error in roadmap stream: {e}")
            error_msg = json.dumps({"status": "error", "error": str(e)})
            yield f"data: {error_msg}\n\n"

    return StreamingResponse(
        roadmap_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@router.get("/list")
async def list_roadmaps():
    """
    Get all roadmaps ordered by most recently updated.

    Returns a list of roadmap summaries with progress information.
    """
    try:
        roadmaps = await RoadmapService.list_roadmaps()
        return {"roadmaps": roadmaps}
    except Exception as e:
        logger.error(f"Error listing roadmaps: {e}")
        raise HTTPException(status_code=500, detail="Failed to list roadmaps")


@router.get("/{roadmap_id}")
async def get_roadmap(roadmap_id: str):
    """
    Get a specific roadmap with all its nodes.

    Returns the complete roadmap structure including all nodes and their relationships.
    """
    try:
        result = await RoadmapService.get_roadmap(roadmap_id)
        if not result:
            raise HTTPException(status_code=404, detail="Roadmap not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting roadmap {roadmap_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get roadmap")


@router.delete("/{roadmap_id}")
async def delete_roadmap(roadmap_id: str):
    """
    Delete a roadmap and all its nodes.

    This operation is permanent and cannot be undone.
    """
    try:
        success = await RoadmapService.delete_roadmap(roadmap_id)
        if not success:
            raise HTTPException(status_code=404, detail="Roadmap not found")
        return {"message": "Roadmap deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting roadmap {roadmap_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete roadmap")


@router.get("/{roadmap_id}/progress")
async def get_roadmap_progress(roadmap_id: str):
    """
    Get detailed progress statistics for a roadmap.

    Returns completion percentages overall and broken down by difficulty level.
    """
    try:
        progress = await RoadmapService.get_roadmap_progress(roadmap_id)
        if not progress:
            raise HTTPException(status_code=404, detail="Roadmap not found")
        return progress
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting roadmap progress {roadmap_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get roadmap progress")


@router.patch("/node/{node_id}/status")
async def update_node_status(node_id: str, request: UpdateNodeStatusRequest):
    """
    Update a node's completion status.

    Status values:
    - 0: Not Started
    - 1: In Progress
    - 2: Completed

    This automatically updates the roadmap's overall progress.
    """
    try:
        result = await RoadmapService.update_node_status(node_id, request.status)
        if not result:
            raise HTTPException(status_code=404, detail="Node not found")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating node status {node_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update node status")


@router.get("/node/{node_id}")
async def get_node(node_id: str):
    """
    Get a specific node by ID.

    Returns the node details including title, description, status, and difficulty.
    """
    try:
        node = await RoadmapService.get_node(node_id)
        if not node:
            raise HTTPException(status_code=404, detail="Node not found")
        return node
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting node {node_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get node")


@router.get("/node/{node_id}/children")
async def get_node_children(node_id: str):
    """
    Get all children of a specific node.

    Returns a list of child nodes ordered by position.
    """
    try:
        children = await RoadmapService.get_node_children(node_id)
        return {"children": children}
    except Exception as e:
        logger.error(f"Error getting node children {node_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get node children")
