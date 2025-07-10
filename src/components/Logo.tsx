import { Brain, Sparkles } from "lucide-react";

const Logo = ({ size = "md", animated = true }: { size?: "sm" | "md" | "lg", animated?: boolean }) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12", 
    lg: "h-16 w-16"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl"
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${animated ? "logo-animate logo-glow" : ""}`}>
        <div className={`${sizeClasses[size]} bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center relative overflow-hidden`}>
          <Brain className="w-2/3 h-2/3 text-white z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 animate-pulse" />
        </div>
        {animated && (
          <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-accent animate-pulse" />
        )}
      </div>
      
      <div className="flex flex-col">
        <h1 className={`${textSizeClasses[size]} font-bold text-gradient tracking-tight`}>
          Quizora
        </h1>
        <p className="text-xs text-muted-foreground -mt-1">منصة التعلم الذكي</p>
      </div>
    </div>
  );
};

export default Logo;