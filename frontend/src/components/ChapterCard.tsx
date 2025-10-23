import { Star, Clock, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ChapterCardProps {
  title: string;
  startTime: string;
  endTime: string;
  importance: number;
  summary: string;
  keyPoints: string[];
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
  importance,
  summary,
  keyPoints,
}: ChapterCardProps) => {
  const config = getImportanceConfig(importance);
  const isImportant = importance > 0.8;

  return (
    <Card className={`p-6 border-l-4 ${config.color} transition-all duration-500 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-white to-primary/5 dark:from-gray-800 dark:to-gray-900`}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          {title}
          {isImportant && <Star className="w-5 h-5 text-warning fill-warning" />}
        </h3>
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
