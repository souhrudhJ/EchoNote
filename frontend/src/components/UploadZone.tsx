import { Upload, Video, FileVideo } from "lucide-react";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

interface UploadZoneProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploadProgress: number;
  isUploading: boolean;
}

export const UploadZone = ({ onFileSelect, uploadProgress, isUploading }: UploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setFileName(file.name);
      // Create a synthetic event to pass to onFileSelect
      const input = document.getElementById('file-upload') as HTMLInputElement;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
    onFileSelect(e);
  };

  return (
    <Card className="overflow-hidden shadow-xl border-2 border-primary/20 dark:border-primary/40 transition-all duration-500">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-500 ${
          isDragging
            ? "border-primary bg-gradient-to-br from-primary/20 to-purple-200/50 dark:from-primary/30 dark:to-purple-900/50 scale-[1.02]"
            : isUploading
            ? "border-primary/50 bg-gradient-to-br from-primary/10 to-purple-100/30 dark:from-primary/20 dark:to-purple-800/30"
            : "border-primary/30 bg-gradient-to-br from-white to-primary/5 dark:from-gray-800 dark:to-gray-900 hover:border-primary hover:from-primary/10 hover:to-purple-100/40 dark:hover:from-primary/20 dark:hover:to-purple-800/40"
        }`}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept="video/mp4,video/avi,video/mov,video/mkv,video/webm"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        
        <label
          htmlFor="file-upload"
          className={`${isUploading ? 'cursor-default' : 'cursor-pointer'} flex flex-col items-center gap-4`}
        >
          <div className={`w-24 h-24 rounded-full gradient-primary flex items-center justify-center shadow-glow ${
            isUploading ? 'animate-pulse' : ''
          }`}>
            {isUploading ? (
              <FileVideo className="w-12 h-12 text-white animate-pulse" />
            ) : (
              <Upload className="w-12 h-12 text-white" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              {isUploading ? "Uploading..." : "Upload Lecture Video"}
            </h3>
            <p className="text-muted-foreground">
              {isUploading && fileName
                ? fileName
                : "Drag & drop your video here or click to browse"}
            </p>
            {!isUploading && (
              <p className="text-sm text-muted-foreground">
                Supports MP4, AVI, MOV, MKV, WEBM
              </p>
            )}
          </div>
        </label>

        {isUploading && (
          <div className="mt-6 max-w-md mx-auto space-y-2">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {uploadProgress}% complete
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
