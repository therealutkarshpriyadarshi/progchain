import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import type {
  Roadmap,
  RoadmapNode,
  RoadmapWithNodes,
  CreateRoadmapRequest,
  UpdateNodeStatusRequest,
  RoadmapProgressStats,
} from "./types";
import * as api from "./api";

interface RoadmapState {
  // List of all roadmaps
  roadmaps: Roadmap[];

  // Currently selected roadmap
  currentRoadmap: Roadmap | null;
  currentNodes: RoadmapNode[];

  // Progress stats
  currentProgress: RoadmapProgressStats | null;

  // UI state
  loading: boolean;
  creating: boolean;
  error: string | null;
  selectedNodeId: string | null;
}

const initialState: RoadmapState = {
  roadmaps: [],
  currentRoadmap: null,
  currentNodes: [],
  currentProgress: null,
  loading: false,
  creating: false,
  error: null,
  selectedNodeId: null,
};

/**
 * Create a new roadmap
 */
export const createRoadmap = createAsyncThunk(
  "roadmap/create",
  async (request: CreateRoadmapRequest, { rejectWithValue }) => {
    try {
      const result = await api.createRoadmap(request);
      return result;
    } catch (error) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Failed to create roadmap");
    }
  }
);

/**
 * Create a roadmap with streaming (for real-time feedback)
 */
export const createRoadmapStream = createAsyncThunk(
  "roadmap/createStream",
  async (request: CreateRoadmapRequest, { dispatch, rejectWithValue }) => {
    try {
      let lastData: any = null;

      for await (const data of api.createRoadmapStream(request)) {
        if (data.status === "generating") {
          dispatch(roadmapSlice.actions.setGenerating(true));
        } else if (data.status === "creating") {
          dispatch(roadmapSlice.actions.setGenerating(true));
        } else if (data.status === "complete") {
          lastData = data;
        } else if (data.status === "error") {
          throw new Error(data.error);
        }
      }

      return lastData as RoadmapWithNodes;
    } catch (error) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Failed to create roadmap");
    }
  }
);

/**
 * Load all roadmaps
 */
export const loadRoadmaps = createAsyncThunk(
  "roadmap/loadAll",
  async (_, { rejectWithValue }) => {
    try {
      const roadmaps = await api.listRoadmaps();
      return roadmaps;
    } catch (error) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Failed to load roadmaps");
    }
  }
);

/**
 * Load a specific roadmap
 */
export const loadRoadmap = createAsyncThunk(
  "roadmap/load",
  async (roadmapId: string, { rejectWithValue }) => {
    try {
      const result = await api.getRoadmap(roadmapId);
      return result;
    } catch (error) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Failed to load roadmap");
    }
  }
);

/**
 * Delete a roadmap
 */
export const deleteRoadmap = createAsyncThunk(
  "roadmap/delete",
  async (roadmapId: string, { rejectWithValue }) => {
    try {
      await api.deleteRoadmap(roadmapId);
      return roadmapId;
    } catch (error) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Failed to delete roadmap");
    }
  }
);

/**
 * Update node status
 */
export const updateNodeStatus = createAsyncThunk(
  "roadmap/updateNodeStatus",
  async (request: UpdateNodeStatusRequest, { rejectWithValue }) => {
    try {
      const updatedNode = await api.updateNodeStatus(request);
      return updatedNode;
    } catch (error) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Failed to update node status");
    }
  }
);

/**
 * Load roadmap progress
 */
export const loadRoadmapProgress = createAsyncThunk(
  "roadmap/loadProgress",
  async (roadmapId: string, { rejectWithValue }) => {
    try {
      const progress = await api.getRoadmapProgress(roadmapId);
      return progress;
    } catch (error) {
      if (error instanceof Error) return rejectWithValue(error.message);
      return rejectWithValue("Failed to load progress");
    }
  }
);

const roadmapSlice = createSlice({
  name: "roadmap",
  initialState,
  reducers: {
    setGenerating: (state, action: PayloadAction<boolean>) => {
      state.creating = action.payload;
    },
    setSelectedNode: (state, action: PayloadAction<string | null>) => {
      state.selectedNodeId = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentRoadmap: (state) => {
      state.currentRoadmap = null;
      state.currentNodes = [];
      state.currentProgress = null;
      state.selectedNodeId = null;
    },
  },
  extraReducers: (builder) => {
    // Create roadmap
    builder
      .addCase(createRoadmap.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createRoadmap.fulfilled, (state, action) => {
        state.creating = false;
        state.currentRoadmap = action.payload.roadmap;
        state.currentNodes = action.payload.nodes;
        state.roadmaps.unshift(action.payload.roadmap);
      })
      .addCase(createRoadmap.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string;
      });

    // Create roadmap stream
    builder
      .addCase(createRoadmapStream.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createRoadmapStream.fulfilled, (state, action) => {
        state.creating = false;
        state.currentRoadmap = action.payload.roadmap;
        state.currentNodes = action.payload.nodes;
        state.roadmaps.unshift(action.payload.roadmap);
      })
      .addCase(createRoadmapStream.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string;
      });

    // Load all roadmaps
    builder
      .addCase(loadRoadmaps.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadRoadmaps.fulfilled, (state, action) => {
        state.loading = false;
        state.roadmaps = action.payload;
      })
      .addCase(loadRoadmaps.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Load specific roadmap
    builder
      .addCase(loadRoadmap.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadRoadmap.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRoadmap = action.payload.roadmap;
        state.currentNodes = action.payload.nodes;
      })
      .addCase(loadRoadmap.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete roadmap
    builder
      .addCase(deleteRoadmap.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRoadmap.fulfilled, (state, action) => {
        state.loading = false;
        state.roadmaps = state.roadmaps.filter(
          (r) => r.public_id !== action.payload
        );
        if (state.currentRoadmap?.public_id === action.payload) {
          state.currentRoadmap = null;
          state.currentNodes = [];
          state.currentProgress = null;
        }
      })
      .addCase(deleteRoadmap.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update node status
    builder
      .addCase(updateNodeStatus.pending, (state) => {
        state.error = null;
      })
      .addCase(updateNodeStatus.fulfilled, (state, action) => {
        // Update the node in currentNodes
        const index = state.currentNodes.findIndex(
          (n) => n.public_id === action.payload.public_id
        );
        if (index !== -1) {
          state.currentNodes[index] = action.payload;
        }

        // Update roadmap completion count (will be refreshed from backend)
        if (state.currentRoadmap) {
          const completedCount = state.currentNodes.filter(
            (n) => n.status === 2
          ).length;
          state.currentRoadmap.completed_nodes = completedCount;
        }
      })
      .addCase(updateNodeStatus.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Load progress
    builder
      .addCase(loadRoadmapProgress.pending, (state) => {
        state.error = null;
      })
      .addCase(loadRoadmapProgress.fulfilled, (state, action) => {
        state.currentProgress = action.payload;
      })
      .addCase(loadRoadmapProgress.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { setGenerating, setSelectedNode, clearError, clearCurrentRoadmap } =
  roadmapSlice.actions;

export default roadmapSlice.reducer;
