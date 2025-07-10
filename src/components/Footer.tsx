import { Heart, Mail, Phone, MapPin } from "lucide-react";
import Logo from "./Logo";

const Footer = () => {
  const footerLinks = {
    platform: [
      { name: "حول Quizora", href: "#about" },
      { name: "الميزات", href: "#features" },
      { name: "الباقات", href: "#pricing" },
      { name: "التحديثات", href: "#updates" }
    ],
    support: [
      { name: "مركز المساعدة", href: "#help" },
      { name: "الأسئلة الشائعة", href: "#faq" },
      { name: "تواصل معنا", href: "#contact" },
      { name: "الدعم الفني", href: "#support" }
    ],
    legal: [
      { name: "شروط الخدمة", href: "#terms" },
      { name: "سياسة الخصوصية", href: "#privacy" },
      { name: "سياسة الاسترداد", href: "#refund" },
      { name: "اتفاقية المستخدم", href: "#agreement" }
    ]
  };

  return (
    <footer className="bg-gradient-to-t from-card to-background border-t border-border">
      <div className="container mx-auto px-4 py-12">
        {/* القسم الرئيسي */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* معلومات الشركة */}
          <div className="lg:col-span-1">
            <Logo size="sm" animated={false} />
            <p className="text-muted-foreground mt-4 leading-relaxed">
              منصة Quizora هي الحل الأمثل للطلاب في رحلتهم الأكاديمية، 
              حيث نوفر أدوات ذكية ومتطورة لضمان التفوق والنجاح.
            </p>
            
            {/* معلومات التواصل */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                support@quizora.com
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" />
                +966 50 123 4567
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                الرياض، المملكة العربية السعودية
              </div>
            </div>
          </div>

          {/* روابط المنصة */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">المنصة</h3>
            <ul className="space-y-3">
              {footerLinks.platform.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* الدعم */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">الدعم</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* القانونية */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">القانونية</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* خط الفصل */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* حقوق النشر */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>© 2024 Quizora. جميع الحقوق محفوظة</span>
            </div>

            {/* رسالة المطور */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>صُمم بـ</span>
              <Heart className="w-4 h-4 text-red-500 animate-pulse" />
              <span>للطلاب العرب</span>
            </div>
          </div>

          {/* معلومات إضافية */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Quizora هي علامة تجارية مسجلة. يستخدم الموقع تقنيات الذكاء الاصطناعي المتطورة لخدمة الطلاب.
              <br />
              للحصول على أفضل تجربة، يُنصح باستخدام أحدث إصدارات المتصفحات.
            </p>
          </div>
        </div>
      </div>

      {/* تأثير الخلفية */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </footer>
  );
};

export default Footer;