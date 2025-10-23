import { Card } from "@/components/ui/card";
import { Play, Maximize2, Volume2 } from "lucide-react";

interface VideoPlayerProps {
  videoUrl?: string;
}

export const VideoPlayer = ({ videoUrl }: VideoPlayerProps) => {
  return (
    <Card className="overflow-hidden shadow-2xl hover:shadow-glow transition-all duration-500 border-2 border-primary/20 dark:border-primary/40">
      <div className="aspect-video bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 dark:from-gray-800 dark:via-gray-900 dark:to-black flex items-center justify-center relative group transition-all duration-500">
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            className="w-full h-full bg-black"
            controlsList="nodownload"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="text-center text-white space-y-4">
            <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto shadow-xl">
              <Play className="w-12 h-12 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold">No video selected</p>
              <p className="text-base mt-2 text-white/80">Upload a lecture to get started</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
