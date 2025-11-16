import React, { useEffect, useRef } from "react";
import { useAppDispatch } from "@/store/hooks";
import { updateNodeStatus } from "@/store/roadmap/slice";
import type { RoadmapNode, RoadmapNodeStatus } from "@/store/roadmap/types";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Search, BookOpen, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NodeContextMenuProps {
  node: RoadmapNode;
  x: number;
  y: number;
  onClose: () => void;
}

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({ node, x, y, onClose }) => {
  const dispatch = useAppDispatch();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleExplore = () => {
    // Open explore in new tab with pre-filled topic
    const exploreUrl = `/explore?topic=${encodeURIComponent(node.title)}`;
    window.open(exploreUrl, "_blank");
    onClose();
  };

  const handleThread = () => {
    // Open thread creation in new tab
    const threadUrl = `/threads/new?topic=${encodeURIComponent(node.title)}&roadmap_node=${node.public_id}`;
    window.open(threadUrl, "_blank");
    onClose();
  };

  const handleStatusChange = async (status: RoadmapNodeStatus) => {
    await dispatch(updateNodeStatus({ nodeId: node.public_id, status }));
    onClose();
  };

  // Adjust menu position to keep it on screen
  const menuStyle = {
    position: "fixed" as const,
    left: Math.min(x, window.innerWidth - 300),
    top: Math.min(y, window.innerHeight - 400),
    zIndex: 1000,
  };

  const statusOptions = [
    {
      label: "Not Started",
      value: 0 as RoadmapNodeStatus,
      icon: XCircle,
      color: "text-muted-foreground",
    },
    {
      label: "In Progress",
      value: 1 as RoadmapNodeStatus,
      icon: Loader2,
      color: "text-blue-500",
    },
    {
      label: "Completed",
      value: 2 as RoadmapNodeStatus,
      icon: CheckCircle2,
      color: "text-green-500",
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        style={menuStyle}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
      >
        <Card className="w-72 overflow-hidden shadow-lg">
          {/* Header */}
          <div className="bg-muted/50 p-4">
            <h3 className="font-semibold line-clamp-2">{node.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {node.description}
            </p>
          </div>

          <Separator />

          {/* Learning Actions */}
          <div className="p-2">
            <div className="mb-2 px-2 text-xs font-medium text-muted-foreground">
              Learn
            </div>
            <button
              onClick={handleExplore}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <Search className="h-4 w-4 text-blue-500" />
              <div className="flex-1 text-left">
                <div className="font-medium">Explore this topic</div>
                <div className="text-xs text-muted-foreground">
                  Chat with AI to learn more
                </div>
              </div>
            </button>

            <button
              onClick={handleThread}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <BookOpen className="h-4 w-4 text-purple-500" />
              <div className="flex-1 text-left">
                <div className="font-medium">Create learning thread</div>
                <div className="text-xs text-muted-foreground">
                  Structured learning content
                </div>
              </div>
            </button>
          </div>

          <Separator />

          {/* Status Actions */}
          <div className="p-2">
            <div className="mb-2 px-2 text-xs font-medium text-muted-foreground">
              Update Status
            </div>
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isCurrentStatus = node.status === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => handleStatusChange(option.value)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted ${
                    isCurrentStatus ? "bg-muted" : ""
                  }`}
                >
                  <Icon className={`h-4 w-4 ${option.color}`} />
                  <span className="flex-1 text-left">{option.label}</span>
                  {isCurrentStatus && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default NodeContextMenu;
