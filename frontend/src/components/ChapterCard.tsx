import { Star, Clock, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ChapterCardProps {
  title: string;
  startTime: string;
  endTime: string;
  /** raw start time in seconds (optional) used for seeking */
  startSeconds?: number;
  /** raw end time in seconds (optional) used for download */
  endSeconds?: number;
  importance: number;
  summary: string;
  keyPoints: string[];
  /** called when user clicks the card to seek the player */
  onSeek?: (seconds: number) => void;
  /** called when user clicks download clip */
  onDownload?: (start: number, end?: number, title?: string) => void;
}

const getImportanceConfig = (importance: number) => {
  if (importance > 0.8) {
    return {
      color: "border-l-destructive",
      badge: "bg-destructive/10 text-destructive border-destructive/20",
      label: "High",
    };
  } else if (importance > 0.6) {
    return {
      color: "border-l-warning",
      badge: "bg-warning/10 text-warning border-warning/20",
      label: "Medium",
    };
  }
  return {
    color: "border-l-success",
    badge: "bg-success/10 text-success border-success/20",
    label: "Normal",
  };
};

export const ChapterCard = ({
  title,
  startTime,
  endTime,
  startSeconds,
  endSeconds,
  importance,
  summary,
  keyPoints,
  onSeek,
  onDownload,
}: ChapterCardProps) => {
  const config = getImportanceConfig(importance);
  const isImportant = importance > 0.8;

  return (
    <Card
      onClick={() => startSeconds != null && onSeek?.(startSeconds)}
      tabIndex={startSeconds != null ? 0 : -1}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && startSeconds != null) {
          onSeek?.(startSeconds);
        }
      }}
      className={`p-6 border-l-4 ${config.color} transition-all duration-500 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-white to-primary/5 dark:from-gray-800 dark:to-gray-900 ${startSeconds != null ? 'cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          {title}
          {isImportant && <Star className="w-5 h-5 text-warning fill-warning" />}
        </h3>
        <div className="flex items-center gap-2">
          {/* Download clip button */}
          {startSeconds != null && (
            <Button
              size="sm"
              className="gap-2 gradient-primary hover:opacity-90"
              onClick={(e) => {
                e.stopPropagation();
                onDownload?.(startSeconds, endSeconds, title);
              }}
            >
              Download Clip
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="font-mono">
            {startTime} - {endTime}
          </span>
        </div>
        
        <Badge variant="outline" className={`${config.badge} border text-xs`}>
          {config.label} Importance
        </Badge>
      </div>

      <p className="text-foreground leading-relaxed mb-4">{summary}</p>

      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Key Points:</p>
        <ul className="space-y-2">
          {keyPoints.map((point, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
};
