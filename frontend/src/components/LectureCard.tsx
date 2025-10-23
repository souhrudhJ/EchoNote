import { Video, FileText, CheckCircle2, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LectureCardProps {
  title: string;
  status: "uploaded" | "transcribed" | "complete";
  duration?: string;
  date?: string;
  isActive?: boolean;
  onClick?: () => void;
}

const statusConfig = {
  uploaded: {
    icon: Video,
    label: "Uploaded",
    color: "bg-info/10 text-info border-info/20",
  },
  transcribed: {
    icon: FileText,
    label: "Transcribed",
    color: "bg-warning/10 text-warning border-warning/20",
  },
  complete: {
    icon: CheckCircle2,
    label: "Complete",
    color: "bg-success/10 text-success border-success/20",
  },
};

export const LectureCard = ({
  title,
  status,
  duration = "0:00",
  date = "Today",
  isActive,
  onClick,
}: LectureCardProps) => {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card
      onClick={onClick}
      className={`p-4 cursor-pointer transition-all duration-500 hover:shadow-xl hover:scale-[1.02] ${
        isActive ? "ring-2 ring-primary shadow-glow gradient-primary text-white" : "bg-gradient-to-br from-white to-primary/5 dark:from-gray-800 dark:to-gray-900 hover:from-primary/5 hover:to-primary/10 dark:hover:from-gray-700 dark:hover:to-gray-800"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-16 h-16 rounded-lg ${isActive ? 'bg-white/20' : 'gradient-primary'} flex items-center justify-center flex-shrink-0 shadow-md`}>
          <Video className={`w-8 h-8 ${isActive ? 'text-white' : 'text-white'}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-sm mb-2 truncate ${isActive ? 'text-white' : 'text-foreground'}`}>{title}</h3>
          
          <div className={`flex items-center gap-2 text-xs mb-2 ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>
            <Clock className="w-3 h-3" />
            <span>{duration}</span>
            <span>•</span>
            <span>{date}</span>
          </div>
          
          <Badge
            variant="outline"
            className={`${isActive ? 'bg-white/20 text-white border-white/30' : config.color} border text-xs`}
          >
            <StatusIcon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </div>
    </Card>
  );
};
