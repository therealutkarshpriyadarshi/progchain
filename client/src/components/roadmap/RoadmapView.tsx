import React, { useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadRoadmap, loadRoadmapProgress, clearCurrentRoadmap } from "@/store/roadmap/slice";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, BarChart3 } from "lucide-react";
import RoadmapTree from "./RoadmapTree";
import { motion } from "framer-motion";

const RoadmapView: React.FC = () => {
  const { roadmapId } = useParams<{ roadmapId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentRoadmap, currentNodes, currentProgress, loading } = useAppSelector(
    (state) => state.roadmap
  );

  useEffect(() => {
    if (roadmapId) {
      dispatch(loadRoadmap(roadmapId));
      dispatch(loadRoadmapProgress(roadmapId));
    }

    return () => {
      dispatch(clearCurrentRoadmap());
    };
  }, [roadmapId, dispatch]);

  const progressPercentage = useMemo(() => {
    if (!currentRoadmap) return 0;
    return currentRoadmap.total_nodes > 0
      ? (currentRoadmap.completed_nodes / currentRoadmap.total_nodes) * 100
      : 0;
  }, [currentRoadmap]);

  const handleBack = useCallback(() => {
    navigate("/roadmap");
  }, [navigate]);

  if (loading && !currentRoadmap) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading roadmap...</p>
        </div>
      </div>
    );
  }

  if (!currentRoadmap) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Roadmap not found</p>
          <Button onClick={handleBack} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b bg-card/50 backdrop-blur-sm"
      >
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{currentRoadmap.title}</h1>
                {currentRoadmap.description && (
                  <p className="text-sm text-muted-foreground">
                    {currentRoadmap.description}
                  </p>
                )}
              </div>
            </div>

            {/* Progress Stats */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Progress</div>
                <div className="text-lg font-semibold">
                  {currentRoadmap.completed_nodes}/{currentRoadmap.total_nodes} nodes
                </div>
              </div>
              <div className="w-32">
                <Progress value={progressPercentage} className="h-2" />
                <div className="mt-1 text-center text-xs text-muted-foreground">
                  {progressPercentage.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          {currentProgress && (
            <div className="mt-4 flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-muted"></div>
                <span className="text-muted-foreground">
                  Not Started: {currentProgress.not_started_nodes}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                <span className="text-muted-foreground">
                  In Progress: {currentProgress.in_progress_nodes}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-muted-foreground">
                  Completed: {currentProgress.completed_nodes}
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Tree View */}
      <div className="flex-1 overflow-hidden">
        <RoadmapTree nodes={currentNodes} roadmapId={currentRoadmap.public_id} />
      </div>
    </div>
  );
};

export default RoadmapView;
