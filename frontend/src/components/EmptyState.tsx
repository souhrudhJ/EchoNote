import { GraduationCap, Upload, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import heroIllustration from "@/assets/hero-illustration.png";

interface EmptyStateProps {
  title: string;
  description: string;
  showIllustration?: boolean;
  showSteps?: boolean;
}

export const EmptyState = ({ 
  title, 
  description, 
  showIllustration = false,
  showSteps = false 
}: EmptyStateProps) => {
  return (
    <Card className="p-12 text-center shadow-2xl bg-gradient-to-br from-white via-purple-50/30 to-primary/10 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 border-2 border-primary/20 dark:border-primary/40 transition-all duration-500">
      <div className="max-w-lg mx-auto space-y-6">
        {showIllustration ? (
          <div className="mb-6">
            <img 
              src={heroIllustration} 
              alt="EchoNote Illustration" 
              className="w-full max-w-md mx-auto object-contain"
            />
          </div>
        ) : (
          <div className="w-28 h-28 rounded-full gradient-primary flex items-center justify-center mx-auto shadow-glow">
            <GraduationCap className="w-14 h-14 text-white" />
          </div>
        )}
        
        <div>
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">{title}</h2>
          <p className="text-primary/70 text-lg">{description}</p>
        </div>

        {showSteps && (
          <div className="pt-8 border-t-2 border-primary/10">
            <p className="text-base text-primary/70 mb-8 font-semibold">Simple 3-step process</p>
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex flex-col items-center gap-3 flex-1 max-w-[140px]">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-info to-blue-500 flex items-center justify-center shadow-lg">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <span className="text-sm text-center font-bold text-primary">Upload Video</span>
              </div>
              
              <div className="text-primary text-2xl font-bold">→</div>
              
              <div className="flex flex-col items-center gap-3 flex-1 max-w-[140px]">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-warning to-orange-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <span className="text-sm text-center font-bold text-primary">Transcribe</span>
              </div>
              
              <div className="text-primary text-2xl font-bold">→</div>
              
              <div className="flex flex-col items-center gap-3 flex-1 max-w-[140px]">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-success to-emerald-600 flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <span className="text-sm text-center font-bold text-primary">Get Summaries</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

