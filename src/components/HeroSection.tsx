import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, Zap, Brain, BookOpen } from "lucide-react";
import Logo from "./Logo";

const HeroSection = () => {
  const [typedText, setTypedText] = useState("");
  const fullText = "حل الامتحانات بالذكاء الاصطناعي في ثوانٍ";

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const features = [
    { icon: Brain, text: "حل الأسئلة فورياً" },
    { icon: BookOpen, text: "تلخيص المحاضرات" },
    { icon: Sparkles, text: "خرائط ذهنية" },
    { icon: Zap, text: "بحوث أكاديمية" }
  ];

  return (
    <section id="home" className="min-h-screen flex items-center justify-center pt-16 relative overflow-hidden">
      {/* خلفية متحركة */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-accent/10 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-primary/5 rounded-full blur-lg animate-float" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* الشعار الكبير */}
          <div className="flex justify-center mb-8">
            <Logo size="lg" animated={true} />
          </div>

          {/* العنوان الرئيسي */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-gradient">منصة التعليم</span>
            <br />
            <span className="text-foreground">بالذكاء الاصطناعي</span>
          </h1>

          {/* النص المتحرك */}
          <div className="text-xl md:text-2xl text-muted-foreground mb-8 h-8">
            <span className="typing-effect">{typedText}</span>
          </div>

          {/* الوصف */}
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            منصة Quizora تساعدك على النجاح الأكاديمي من خلال حلول ذكية ومتطورة. 
            احصل على إجابات فورية، ملخصات دقيقة، وخرائط ذهنية مخصصة لدراستك.
          </p>

          {/* الميزات السريعة */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card-glow text-center interactive-hover"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <feature.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">{feature.text}</p>
              </div>
            ))}
          </div>

          {/* أزرار العمل */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button className="btn-glow text-lg px-8 py-4 group">
              ابدأ مجاناً الآن
              <ArrowLeft className="mr-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" className="text-lg px-8 py-4 bg-background/50 backdrop-blur-sm">
              شاهد العرض التوضيحي
            </Button>
          </div>

          {/* إحصائيات */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-border">
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient mb-2">10K+</div>
              <div className="text-muted-foreground">طالب نشط</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient mb-2">50K+</div>
              <div className="text-muted-foreground">سؤال محلول</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient mb-2">99%</div>
              <div className="text-muted-foreground">معدل الرضا</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;