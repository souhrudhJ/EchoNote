import { Upload, Sparkles, Download, FileText, CheckCircle2, Video } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import heroIllustration from "@/assets/hero-illustration.png";
import heroDark from "@/assets/hero-dark.png";

interface LandingPageProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploadProgress: number;
  isUploading: boolean;
}

export const LandingPage = ({ onFileSelect, uploadProgress, isUploading }: LandingPageProps) => {
  const features = [
    {
      icon: FileText,
      title: "Accurate Transcription",
      description: "High-accuracy speech-to-text using Whisper AI"
    },
    {
      icon: Sparkles,
      title: "AI Summaries",
      description: "Intelligent chapter summaries powered by Gemini"
    },
    {
      icon: Download,
      title: "Export Options",
      description: "Download as JSON chapters or SRT subtitles"
    }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e);
  };

  return (
    <div className="min-h-[calc(100vh-100px)] relative py-12 overflow-hidden">
      {/* Hero Illustration Background - Light Mode */}
      <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-0 transition-opacity duration-500">
        <img 
          src={heroIllustration} 
          alt="EchoNote Background Light" 
          className="w-full h-full object-cover mix-blend-multiply"
        />
      </div>
      
      {/* Hero Illustration Background - Dark Mode */}
      <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-30 transition-opacity duration-500">
        <img 
          src={heroDark} 
          alt="EchoNote Background Dark" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto w-full space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-primary via-purple-600 to-primary/80 bg-clip-text text-transparent leading-tight">
            Transform Your Lectures
          </h1>
          <p className="text-xl text-primary/70 dark:text-primary/60 max-w-2xl mx-auto font-medium">
            Upload your lecture videos and let AI create searchable transcripts and intelligent chapter summaries automatically.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="p-6 text-center space-y-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-primary/20 dark:border-primary/40 hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center mx-auto shadow-glow">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-lg text-primary">{feature.title}</h3>
                <p className="text-sm text-primary/70 dark:text-primary/60">{feature.description}</p>
              </Card>
            );
          })}
        </div>

        {/* Upload CTA */}
        <div className="text-center pt-8">
          <Card className="p-8 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-2 border-primary/30 dark:border-primary/50 shadow-2xl max-w-2xl mx-auto transition-all duration-500">
            <input
              type="file"
              id="landing-file-upload"
              className="hidden"
              accept="video/mp4,video/avi,video/mov,video/mkv,video/webm"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            
            <label
              htmlFor="landing-file-upload"
              className={`${isUploading ? 'cursor-default' : 'cursor-pointer'} flex flex-col items-center gap-6`}
            >
              <div className={`w-24 h-24 rounded-full gradient-primary flex items-center justify-center shadow-glow ${
                isUploading ? 'animate-pulse' : ''
              }`}>
                {isUploading ? (
                  <Video className="w-12 h-12 text-white animate-pulse" />
                ) : (
                  <Upload className="w-12 h-12 text-white" />
                )}
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  {isUploading ? "Uploading..." : "Get Started Now"}
                </h3>
                <p className="text-foreground/80 dark:text-foreground/70 text-lg font-medium">
                  {isUploading
                    ? `${uploadProgress}% complete`
                    : "Drag & drop your lecture video or click to browse"}
                </p>
                {!isUploading && (
                  <p className="text-sm text-muted-foreground">
                    Supports MP4, AVI, MOV, MKV, WEBM
                  </p>
                )}
              </div>

              {!isUploading && (
                <Button 
                  onClick={() => document.getElementById('landing-file-upload')?.click()}
                  className="gradient-primary hover:opacity-90 text-white px-8 py-6 text-lg shadow-glow"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Your First Lecture
                </Button>
              )}
            </label>

            {isUploading && (
              <div className="mt-6">
                <div className="w-full bg-primary/10 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full gradient-primary transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

