import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadRoadmaps, deleteRoadmap } from "@/store/roadmap/slice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Map, Calendar } from "lucide-react";
import CreateRoadmapModal from "./CreateRoadmapModal";
import { useNavigate } from "react-router-dom";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const RoadmapDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { roadmaps, loading } = useAppSelector((state) => state.roadmap);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(loadRoadmaps());
  }, [dispatch]);

  const handleDelete = async (roadmapId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this roadmap?")) {
      setDeletingId(roadmapId);
      await dispatch(deleteRoadmap(roadmapId));
      setDeletingId(null);
    }
  };

  const handleOpenRoadmap = (roadmapId: string) => {
    navigate(`/roadmap/${roadmapId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Learning Roadmaps</h1>
            <p className="mt-2 text-muted-foreground">
              Track your progress on personalized learning paths
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            size="lg"
            className="gap-2"
          >
            <Plus className="h-5 w-5" />
            Create Roadmap
          </Button>
        </div>

        {/* Loading State */}
        {loading && roadmaps.length === 0 && (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="mt-4 text-muted-foreground">Loading roadmaps...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && roadmaps.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-12"
          >
            <Map className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No roadmaps yet</h3>
            <p className="mt-2 text-center text-muted-foreground">
              Create your first learning roadmap to get started on your journey
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="mt-6 gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Your First Roadmap
            </Button>
          </motion.div>
        )}

        {/* Roadmaps Grid */}
        {roadmaps.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {roadmaps.map((roadmap) => {
              const progressPercentage =
                roadmap.total_nodes > 0
                  ? (roadmap.completed_nodes / roadmap.total_nodes) * 100
                  : 0;

              return (
                <motion.div key={roadmap.public_id} variants={cardVariants}>
                  <Card
                    className="group cursor-pointer transition-all hover:shadow-lg"
                    onClick={() => handleOpenRoadmap(roadmap.public_id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="line-clamp-2 text-xl">
                            {roadmap.title}
                          </CardTitle>
                          {roadmap.description && (
                            <CardDescription className="mt-2 line-clamp-2">
                              {roadmap.description}
                            </CardDescription>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDelete(roadmap.public_id, e)}
                          disabled={deletingId === roadmap.public_id}
                        >
                          {deletingId === roadmap.public_id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent"></div>
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold">
                            {roadmap.completed_nodes}/{roadmap.total_nodes} nodes
                          </span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                        <div className="text-right text-xs text-muted-foreground">
                          {progressPercentage.toFixed(0)}% complete
                        </div>
                      </div>

                      {/* Last Updated */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Updated {formatDate(roadmap.updated_at)}</span>
                      </div>
                    </CardContent>

                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenRoadmap(roadmap.public_id);
                        }}
                      >
                        <Map className="h-4 w-4" />
                        View Roadmap
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Create Modal */}
      <CreateRoadmapModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default RoadmapDashboard;
