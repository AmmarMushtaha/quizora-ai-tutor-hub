import { Mail, MessageCircle, Phone, MapPin, Clock, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ContactSection = () => {
  const contactInfo = [
    {
      icon: Mail,
      title: "البريد الإلكتروني",
      value: "support@quizora.com",
      description: "نرد خلال 24 ساعة"
    },
    {
      icon: MessageCircle,
      title: "الدردشة المباشرة",
      value: "متاح الآن",
      description: "دعم فوري ومباشر"
    },
    {
      icon: Phone,
      title: "الهاتف",
      value: "+966 50 123 4567",
      description: "من الأحد إلى الخميس"
    },
    {
      icon: Clock,
      title: "ساعات العمل",
      value: "24/7",
      description: "خدمة متواصلة"
    }
  ];

  return (
    <section id="contact" className="py-20 relative">
      <div className="container mx-auto px-4">
        {/* العنوان */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-gradient">تواصل معنا</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            هل لديك أسئلة أو تحتاج مساعدة؟ فريقنا جاهز لمساعدتك في أي وقت
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* معلومات التواصل */}
          <div className="space-y-8">
            <h3 className="text-2xl font-bold mb-6">طرق التواصل</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {contactInfo.map((info, index) => (
                <Card key={index} className="card-glow interactive-hover">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <info.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-2">{info.title}</h4>
                    <p className="text-lg font-medium text-primary mb-1">{info.value}</p>
                    <p className="text-sm text-muted-foreground">{info.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* معلومات إضافية */}
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-6 border border-primary/10">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                عنواننا
              </h4>
              <p className="text-muted-foreground">
                المملكة العربية السعودية<br />
                الرياض، حي التقنية<br />
                مجمع الملك عبدالعزيز للعلوم والتقنية
              </p>
            </div>
          </div>

          {/* نموذج التواصل */}
          <div>
            <Card className="card-glow">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">أرسل لنا رسالة</h3>
                
                <form className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">الاسم</label>
                      <Input 
                        placeholder="اسمك الكامل" 
                        className="bg-background/50 border-border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
                      <Input 
                        type="email" 
                        placeholder="email@example.com" 
                        className="bg-background/50 border-border"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">الموضوع</label>
                    <Input 
                      placeholder="موضوع الرسالة" 
                      className="bg-background/50 border-border"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">الرسالة</label>
                    <Textarea 
                      placeholder="اكتب رسالتك هنا..."
                      rows={5}
                      className="bg-background/50 border-border resize-none"
                    />
                  </div>
                  
                  <Button className="btn-glow w-full text-lg group">
                    إرسال الرسالة
                    <Send className="mr-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </form>
                
                <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm text-green-600 text-center">
                    ✓ نضمن الرد على جميع الرسائل خلال 24 ساعة
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* الأسئلة الشائعة */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-center mb-12 text-gradient">الأسئلة الشائعة</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
              <h4 className="font-semibold mb-2">كيف يعمل نظام الكريدت؟</h4>
              <p className="text-sm text-muted-foreground">كل ميزة لها تكلفة محددة بالكريدت، ويمكنك استخدامها حسب احتياجاتك.</p>
            </div>
            
            <div className="p-6 rounded-xl bg-gradient-to-br from-accent/5 to-transparent border border-accent/10">
              <h4 className="font-semibold mb-2">هل يمكنني إلغاء الاشتراك؟</h4>
              <p className="text-sm text-muted-foreground">نعم، يمكنك إلغاء الاشتراك في أي وقت من لوحة التحكم.</p>
            </div>
            
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
              <h4 className="font-semibold mb-2">هل البيانات آمنة؟</h4>
              <p className="text-sm text-muted-foreground">نعم، نستخدم أحدث تقنيات التشفير لحماية بياناتك.</p>
            </div>
            
            <div className="p-6 rounded-xl bg-gradient-to-br from-accent/5 to-transparent border border-accent/10">
              <h4 className="font-semibold mb-2">متى تتم إضافة الكريدت؟</h4>
              <p className="text-sm text-muted-foreground">يتم إضافة الكريدت فوراً بعد تأكيد الدفع.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;