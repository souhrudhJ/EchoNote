import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const LectureCardSkeleton = () => {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-16 h-16 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </Card>
  );
};

export const ChapterCardSkeleton = () => {
  return (
    <Card className="p-6 border-l-4">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <div className="space-y-2 pt-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    </Card>
  );
};

export const VideoPlayerSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-video w-full" />
    </Card>
  );
};

