export type RoadmapNodeStatus = 0 | 1 | 2; // 0=Not Started, 1=In Progress, 2=Completed

export type RoadmapNode = {
  public_id: string;
  roadmap_id: string;
  title: string;
  description: string;
  status: RoadmapNodeStatus;
  parent_node_id: string | null;
  position: number;
  difficulty: number | null; // 0=Beginner, 1=Intermediate, 2=Advanced
  created_at: string;
  updated_at: string;
};

export type Roadmap = {
  public_id: string;
  title: string;
  description: string | null;
  total_nodes: number;
  completed_nodes: number;
  created_at: string;
  updated_at: string;
};

export type RoadmapWithNodes = {
  roadmap: Roadmap;
  nodes: RoadmapNode[];
};

export type CreateRoadmapRequest = {
  topic: string;
  model?: string;
};

export type UpdateNodeStatusRequest = {
  nodeId: string;
  status: RoadmapNodeStatus;
};

export type RoadmapProgressStats = {
  roadmap_id: string;
  title: string;
  total_nodes: number;
  completed_nodes: number;
  in_progress_nodes: number;
  not_started_nodes: number;
  progress_percentage: number;
  difficulty_breakdown: {
    beginner: {
      total: number;
      completed: number;
      percentage: number;
    };
    intermediate: {
      total: number;
      completed: number;
      percentage: number;
    };
    advanced: {
      total: number;
      completed: number;
      percentage: number;
    };
  };
};
