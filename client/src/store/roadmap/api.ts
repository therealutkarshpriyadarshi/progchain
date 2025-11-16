import axios from "axios";
import type {
  CreateRoadmapRequest,
  Roadmap,
  RoadmapWithNodes,
  RoadmapProgressStats,
  RoadmapNode,
  UpdateNodeStatusRequest,
} from "./types";
import { postStream } from "@/api/stream";

const API_BASE_URL = "http://localhost:8000/roadmap";

/**
 * Create a new roadmap
 */
export const createRoadmap = async (
  request: CreateRoadmapRequest
): Promise<RoadmapWithNodes> => {
  const response = await axios.post(`${API_BASE_URL}/create`, request);
  return response.data;
};

/**
 * Create a new roadmap with streaming response
 * Yields progress updates as the roadmap is generated
 */
export const createRoadmapStream = async function* (
  request: CreateRoadmapRequest
) {
  const url = `${API_BASE_URL}/create-stream`;
  for await (const data of postStream(url, request)) {
    yield data;
  }
};

/**
 * Get all roadmaps
 */
export const listRoadmaps = async (): Promise<Roadmap[]> => {
  const response = await axios.get(`${API_BASE_URL}/list`);
  return response.data.roadmaps;
};

/**
 * Get a specific roadmap with all its nodes
 */
export const getRoadmap = async (
  roadmapId: string
): Promise<RoadmapWithNodes> => {
  const response = await axios.get(`${API_BASE_URL}/${roadmapId}`);
  return response.data;
};

/**
 * Delete a roadmap
 */
export const deleteRoadmap = async (roadmapId: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/${roadmapId}`);
};

/**
 * Get roadmap progress statistics
 */
export const getRoadmapProgress = async (
  roadmapId: string
): Promise<RoadmapProgressStats> => {
  const response = await axios.get(`${API_BASE_URL}/${roadmapId}/progress`);
  return response.data;
};

/**
 * Update a node's status
 */
export const updateNodeStatus = async (
  request: UpdateNodeStatusRequest
): Promise<RoadmapNode> => {
  const response = await axios.patch(
    `${API_BASE_URL}/node/${request.nodeId}/status`,
    { status: request.status }
  );
  return response.data;
};

/**
 * Get a specific node
 */
export const getNode = async (nodeId: string): Promise<RoadmapNode> => {
  const response = await axios.get(`${API_BASE_URL}/node/${nodeId}`);
  return response.data;
};

/**
 * Get all children of a node
 */
export const getNodeChildren = async (
  nodeId: string
): Promise<RoadmapNode[]> => {
  const response = await axios.get(`${API_BASE_URL}/node/${nodeId}/children`);
  return response.data.children;
};
