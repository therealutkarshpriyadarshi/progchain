import React from "react";
import { Handle, Position } from "@xyflow/react";
import type { RoadmapNode as RoadmapNodeType } from "@/store/roadmap/types";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoadmapNodeProps {
  data: {
    node: RoadmapNodeType;
  };
}

const difficultyColors = {
  0: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", // Beginner
  1: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", // Intermediate
  2: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", // Advanced
};

const difficultyLabels = {
  0: "Beginner",
  1: "Intermediate",
  2: "Advanced",
};

const statusIcons = {
  0: Circle, // Not Started
  1: Loader2, // In Progress
  2: CheckCircle2, // Completed
};

const statusColors = {
  0: "text-muted-foreground", // Not Started
  1: "text-blue-500", // In Progress
  2: "text-green-500", // Completed
};

const RoadmapNode: React.FC<RoadmapNodeProps> = ({ data }) => {
  const { node } = data;
  const StatusIcon = statusIcons[node.status];

  return (
    <div
      className={cn(
        "group relative rounded-lg border-2 bg-card p-4 shadow-md transition-all hover:shadow-lg",
        node.status === 2 && "border-green-500",
        node.status === 1 && "border-blue-500",
        node.status === 0 && "border-border"
      )}
      style={{ width: 280, minHeight: 120 }}
    >
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary"
        style={{ width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary"
        style={{ width: 8, height: 8 }}
      />

      {/* Status Icon */}
      <div className="absolute -right-2 -top-2">
        <div className="rounded-full bg-background p-1 shadow-sm">
          <StatusIcon
            className={cn(
              "h-5 w-5",
              statusColors[node.status],
              node.status === 1 && "animate-spin"
            )}
          />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        {/* Title */}
        <h3 className="font-semibold leading-tight line-clamp-2">{node.title}</h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {node.description}
        </p>

        {/* Difficulty Badge */}
        {node.difficulty !== null && (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                difficultyColors[node.difficulty as 0 | 1 | 2]
              )}
            >
              {difficultyLabels[node.difficulty as 0 | 1 | 2]}
            </span>
          </div>
        )}
      </div>

      {/* Hover indicator */}
      <div className="absolute inset-0 rounded-lg ring-2 ring-primary opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
};

export default RoadmapNode;
