import { Camera, FileText, Headphones, GitBranch, MessageCircle, FileEdit, Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FeaturesSection = () => {
  const features = [
    {
      icon: FileText,
      title: "حل الأسئلة النصية",
      description: "احصل على إجابات فورية ودقيقة لأي سؤال أكاديمي باستخدام الذكاء الاصطناعي",
      credits: "2 كريدت",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: Camera,
      title: "حل أوراق الامتحان",
      description: "التقط صورة لورقة الامتحان واحصل على الحلول الكاملة والشرح التفصيلي",
      credits: "8 كريدت",
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      icon: Headphones,
      title: "تلخيص المحاضرات الصوتية",
      description: "تلخيص المحاضرات الصوتية بدقة عالية مع النقاط الرئيسية والتفاصيل المهمة",
      credits: "35 كريدت / 15 دقيقة",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      icon: GitBranch,
      title: "الخرائط الذهنية",
      description: "إنشاء خرائط ذهنية تفاعلية للدروس المعقدة بطريقة بصرية منظمة",
      credits: "20 كريدت",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      icon: MessageCircle,
      title: "الروبوت الذكي",
      description: "شرح الدروس المعقدة بطريقة مبسطة مع إمكانية الحصول على إجابات فورية أو شرح تفصيلي",
      credits: "5-10 كريدت",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10"
    },
    {
      icon: FileEdit,
      title: "البحوث الأكاديمية",
      description: "إنشاء بحوث أكاديمية مخصصة باسم الطالب مع إمكانية التعديل والتحسين",
      credits: "7-20 كريدت",
      color: "text-pink-500",
      bgColor: "bg-pink-500/10"
    }
  ];

  return (
    <section id="features" className="py-20 relative">
      <div className="container mx-auto px-4">
        {/* العنوان */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-gradient">ميزات متطورة</span> لتفوقك الأكاديمي
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            اكتشف مجموعة شاملة من الأدوات الذكية المصممة خصيصاً لمساعدتك في رحلتك التعليمية
          </p>
        </div>

        {/* شبكة الميزات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="card-glow interactive-hover group relative overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                {/* أيقونة الميزة */}
                <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>

                {/* العنوان والوصف */}
                <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {feature.description}
                </p>

                {/* شارة الكريدت */}
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    {feature.credits}
                  </Badge>
                </div>

                {/* تأثير الخلفية */}
                <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-gradient-to-tl from-primary/5 to-accent/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* قسم المزايا الإضافية */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold mb-8 text-gradient">مزايا إضافية</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
              <h4 className="font-semibold mb-2">محتوى مرئي ومكتوب</h4>
              <p className="text-sm text-muted-foreground">محتوى مساند للمناهج الدراسية</p>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-accent/5 to-transparent border border-accent/10">
              <h4 className="font-semibold mb-2">تأثيرات كتابة</h4>
              <p className="text-sm text-muted-foreground">على جميع الأدوات والمكونات</p>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
              <h4 className="font-semibold mb-2">سجل محفوظ</h4>
              <p className="text-sm text-muted-foreground">جميع المحادثات محفوظة محلياً</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;