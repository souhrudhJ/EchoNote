import React, { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Play } from "lucide-react";

interface VideoPlayerProps {
  videoUrl?: string;
  /** Seek player to this many seconds when changed */
  seekTo?: number | null;
  /** Optional callback invoked after seek completes */
  onSeeked?: () => void;
  /** Receive underlying video element ref (optional) */
  onVideoRef?: (el: HTMLVideoElement | null) => void;
}

export const VideoPlayer = ({ videoUrl, seekTo = null, onSeeked, onVideoRef }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (onVideoRef) onVideoRef(videoRef.current);
  }, [onVideoRef]);

  // When seekTo changes, attempt to set currentTime (after metadata loaded)
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (seekTo == null) return;

    const trySeek = () => {
      // clamp seek to duration if available
      const t = Math.min(seekTo, isFinite(vid.duration) ? vid.duration : seekTo);
      try {
        vid.currentTime = t;
        // Optionally pause or play — keep current playback state. Not forcing play.
        if (onSeeked) onSeeked();
      } catch (err) {
        // Some browsers throw if trying to set currentTime before it's ready; ignore and wait for loadedmetadata
      }
    };

    if (isFinite(vid.duration) && vid.readyState >= 1) {
      trySeek();
    } else {
      const onLoaded = () => {
        trySeek();
        vid.removeEventListener("loadedmetadata", onLoaded);
      };
      vid.addEventListener("loadedmetadata", onLoaded);
    }
  }, [seekTo]);

  return (
    <Card className="overflow-hidden shadow-2xl hover:shadow-glow transition-all duration-500 border-2 border-primary/20 dark:border-primary/40">
      <div className="aspect-video bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 dark:from-gray-800 dark:via-gray-900 dark:to-black flex items-center justify-center relative group transition-all duration-500">
        {videoUrl ? (
          <video
            ref={videoRef}
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
