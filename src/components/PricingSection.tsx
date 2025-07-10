import { Check, Crown, Gift, Zap } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PricingSection = () => {
  const plans = [
    {
      name: "التجربة المجانية",
      price: "مجاناً",
      originalPrice: null,
      credits: "100",
      duration: "أسبوع واحد",
      icon: Gift,
      color: "text-green-500",
      bgGradient: "from-green-500/20 to-green-600/10",
      borderColor: "border-green-500/30",
      features: [
        "جميع الميزات متاحة",
        "100 كريدت للتجربة",
        "دعم فني محدود",
        "حفظ المحادثات",
      ],
      isPopular: false,
      buttonText: "ابدأ التجربة المجانية"
    },
    {
      name: "الباقة الأساسية",
      price: "$20",
      originalPrice: null,
      credits: "2,000",
      duration: "شهرياً",
      icon: Zap,
      color: "text-blue-500",
      bgGradient: "from-blue-500/20 to-blue-600/10",
      borderColor: "border-blue-500/30",
      features: [
        "جميع الميزات",
        "2,000 كريدت شهرياً",
        "دعم فني 24/7",
        "حفظ غير محدود",
        "تصدير النتائج",
      ],
      isPopular: false,
      buttonText: "اختر الباقة الأساسية"
    },
    {
      name: "الباقة المتقدمة",
      price: "$39",
      originalPrice: null,
      credits: "5,000",
      bonusCredits: "1,000",
      duration: "شهرياً",
      icon: Crown,
      color: "text-purple-500",
      bgGradient: "from-purple-500/20 to-purple-600/10",
      borderColor: "border-purple-500/30",
      features: [
        "جميع ميزات الأساسية",
        "4,000 كريدت + 1,000 هدية",
        "أولوية في الدعم الفني",
        "ميزات حصرية جديدة",
        "تقارير تحليلية مفصلة",
        "مشاركة مع الفريق",
      ],
      isPopular: true,
      buttonText: "اختر الباقة المتقدمة"
    },
    {
      name: "الباقة الاحترافية",
      price: "$99",
      originalPrice: null,
      credits: "12,000",
      bonusCredits: "2,000",
      duration: "شهرياً",
      icon: Crown,
      color: "text-amber-500",
      bgGradient: "from-amber-500/20 to-amber-600/10",
      borderColor: "border-amber-500/30",
      features: [
        "جميع ميزات المتقدمة",
        "10,000 كريدت + 2,000 هدية",
        "دعم فني مخصص",
        "ميزات تجريبية حصرية",
        "تكامل مع منصات التعلم",
        "تخصيص كامل للواجهة",
        "تقارير متقدمة وإحصائيات",
        "إدارة فرق متعددة",
      ],
      isPopular: false,
      buttonText: "اختر الباقة الاحترافية"
    }
  ];

  return (
    <section id="pricing" className="py-20 relative">
      <div className="container mx-auto px-4">
        {/* العنوان */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-gradient">باقات مرنة</span> تناسب احتياجاتك
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            اختر الباقة المناسبة لك وابدأ رحلة التفوق الأكاديمي مع نظام الكريدت المرن
          </p>
        </div>

        {/* شبكة الباقات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`card-glow interactive-hover relative overflow-hidden ${
                plan.isPopular ? 'ring-2 ring-primary/50 animate-pulse-glow' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* شارة الأكثر شعبية */}
              {plan.isPopular && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                    الأكثر شعبية
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                {/* أيقونة الباقة */}
                <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${plan.bgGradient} rounded-2xl flex items-center justify-center border ${plan.borderColor}`}>
                  <plan.icon className={`w-8 h-8 ${plan.color}`} />
                </div>

                {/* اسم الباقة */}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>

                {/* السعر */}
                <div className="mb-4">
                  <div className="text-3xl font-bold text-gradient mb-1">
                    {plan.price}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {plan.duration}
                  </div>
                </div>

                {/* الكريدت */}
                <div className="text-center mb-4">
                  <div className="text-lg font-semibold text-foreground">
                    {plan.credits} كريدت
                  </div>
                  {plan.bonusCredits && (
                    <div className="text-sm text-green-500 font-medium">
                      + {plan.bonusCredits} كريدت هدية
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* قائمة الميزات */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* زر الاشتراك */}
                <Button 
                  className={`w-full ${
                    plan.isPopular 
                      ? 'btn-glow' 
                      : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                  }`}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>

              {/* تأثير الخلفية للباقة الشائعة */}
              {plan.isPopular && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
              )}
            </Card>
          ))}
        </div>

        {/* معلومات إضافية */}
        <div className="mt-16 text-center">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 text-gradient">نظام الكريدت</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
                <h4 className="font-semibold mb-2">مرونة في الاستخدام</h4>
                <p className="text-sm text-muted-foreground">استخدم الكريدت حسب احتياجاتك دون قيود</p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-accent/5 to-transparent border border-accent/10">
                <h4 className="font-semibold mb-2">عدم انتهاء الصلاحية</h4>
                <p className="text-sm text-muted-foreground">الكريدت لا ينتهي صلاحيته طوال فترة الاشتراك</p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
                <h4 className="font-semibold mb-2">شفافية كاملة</h4>
                <p className="text-sm text-muted-foreground">تتبع استخدامك للكريدت بوضوح</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;