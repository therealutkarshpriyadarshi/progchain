import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createRoadmapStream } from "@/store/roadmap/slice";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";

interface CreateRoadmapModalProps {
  open: boolean;
  onClose: () => void;
}

const CreateRoadmapModal: React.FC<CreateRoadmapModalProps> = ({ open, onClose }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { creating } = useAppSelector((state) => state.roadmap);
  const [topic, setTopic] = useState("");
  const [generationStatus, setGenerationStatus] = useState("");

  const handleCreate = async () => {
    if (!topic.trim()) return;

    setGenerationStatus("Generating roadmap...");

    const result = await dispatch(createRoadmapStream({ topic: topic.trim() }));

    if (createRoadmapStream.fulfilled.match(result)) {
      const roadmapId = result.payload.roadmap.public_id;
      setTopic("");
      setGenerationStatus("");
      onClose();
      navigate(`/roadmap/${roadmapId}`);
    } else {
      setGenerationStatus("");
    }
  };

  const handleClose = () => {
    if (!creating) {
      setTopic("");
      setGenerationStatus("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Learning Roadmap
          </DialogTitle>
          <DialogDescription>
            Enter a topic and we'll generate a comprehensive learning path with AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              placeholder="e.g., React, Python, Machine Learning..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !creating) {
                  handleCreate();
                }
              }}
              disabled={creating}
              autoFocus
            />
          </div>

          {/* Generation Status */}
          {creating && generationStatus && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium">{generationStatus}</p>
                <p className="text-xs text-muted-foreground">
                  This may take a few moments...
                </p>
              </div>
            </div>
          )}

          {/* Examples */}
          {!creating && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Try these examples:
              </p>
              <div className="flex flex-wrap gap-2">
                {["React", "Python Backend", "System Design", "TypeScript"].map((example) => (
                  <button
                    key={example}
                    onClick={() => setTopic(example)}
                    className="rounded-full border bg-muted/50 px-3 py-1 text-xs hover:bg-muted transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !topic.trim()}
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Roadmap
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoadmapModal;
