import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  FileText, 
  Mic, 
  Map, 
  MessageCircle, 
  Edit, 
  Coins, 
  Calendar,
  LogOut,
  Settings,
  History,
  TrendingUp
} from "lucide-react";
import Logo from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  credits: number;
  total_credits_used: number;
  role: string;
}

interface Subscription {
  plan_name: string;
  end_date: string;
  status: string;
  credits_included: number;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Get current subscription
      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (subscriptionData) setSubscription(subscriptionData);

    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const aiTools = [
    {
      title: "حل الأسئلة النصية",
      description: "حل أي سؤال فوراً باستخدام النص",
      icon: Brain,
      credits: "2 كريدت",
      color: "bg-blue-500",
      route: "/tools/text-questions"
    },
    {
      title: "حل أسئلة الصور",
      description: "حل أسئلة ورقة الامتحان من الصور",
      icon: FileText,
      credits: "8 كريدت",
      color: "bg-green-500",
      route: "/tools/image-questions"
    },
    {
      title: "تلخيص المحاضرات",
      description: "تلخيص المحاضرات الصوتية بدقة عالية",
      icon: Mic,
      credits: "35 كريدت/15 دقيقة",
      color: "bg-purple-500",
      route: "/tools/audio-summary"
    },
    {
      title: "الخرائط الذهنية",
      description: "إنشاء خرائط ذهنية للدروس المعقدة",
      icon: Map,
      credits: "20 كريدت",
      color: "bg-orange-500",
      route: "/tools/mind-maps"
    },
    {
      title: "الروبوت الذكي",
      description: "شرح الدروس بطريقة مبسطة",
      icon: MessageCircle,
      credits: "5-10 كريدت",
      color: "bg-pink-500",
      route: "/tools/smart-tutor"
    },
    {
      title: "كتابة الأبحاث",
      description: "إنشاء بحوث أكاديمية مخصصة",
      icon: Edit,
      credits: "7-20 كريدت/صفحة",
      color: "bg-indigo-500",
      route: "/tools/research-papers"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const subscriptionDaysLeft = subscription 
    ? Math.ceil((new Date(subscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="sm" />
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium">{profile.full_name}</p>
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">{profile.credits} كريدت</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => navigate("/profile")}>
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">مرحباً، {profile.full_name}</h1>
          <p className="text-muted-foreground">ابدأ رحلتك التعليمية مع أدوات الذكاء الاصطناعي المتطورة</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الكريدت المتبقي</CardTitle>
              <Coins className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.credits}</div>
              <Progress 
                value={(profile.credits / (subscription?.credits_included || 100)) * 100} 
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الاشتراك الحالي</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscription?.plan_name || "لا يوجد"}</div>
              {subscription && (
                <p className="text-xs text-muted-foreground">
                  {subscriptionDaysLeft > 0 
                    ? `${subscriptionDaysLeft} يوم متبقي`
                    : "منتهي الصلاحية"
                  }
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الاستخدام</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.total_credits_used}</div>
              <p className="text-xs text-muted-foreground">كريدت مستخدم</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Tools Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">أدوات الذكاء الاصطناعي</h2>
            <Button variant="outline" onClick={() => navigate("/history")}>
              <History className="w-4 h-4 mr-2" />
              سجل المحادثات
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiTools.map((tool, index) => (
              <Card key={index} className="glass-card hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigate(tool.route)}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${tool.color} text-white group-hover:scale-110 transition-transform`}>
                      <tool.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tool.title}</CardTitle>
                      <Badge variant="secondary">{tool.credits}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{tool.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>الاشتراكات والباقات</CardTitle>
              <CardDescription>
                اطلع على الباقات المتاحة وقم بترقية اشتراكك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/pricing")} className="w-full">
                عرض الباقات
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>المساعدة والدعم</CardTitle>
              <CardDescription>
                تحتاج مساعدة؟ تواصل مع فريق الدعم الفني
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate("/contact")} className="w-full">
                تواصل معنا
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;