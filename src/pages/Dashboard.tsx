import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  MessageSquare, 
  Image, 
  Mic, 
  Network, 
  FileText, 
  Edit,
  CreditCard,
  History,
  User,
  LogOut,
  BookOpen
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import TextQuestion from '@/components/ai/TextQuestion';
import ImageQuestion from '@/components/ai/ImageQuestion';
import AudioSummary from '@/components/ai/AudioSummary';
import MindMap from '@/components/ai/MindMap';
import ResearchPaper from '@/components/ai/ResearchPaper';
import TextEditing from '@/components/ai/TextEditing';

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('خطأ في جلب بيانات الملف الشخصي:', profileError);
        toast.error('حدث خطأ في تحميل البيانات');
      } else if (profileData) {
        setProfile(profileData);
      } else {
        // إنشاء ملف شخصي جديد إذا لم يوجد
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.email || '',
            credits: 100 // رصيد ابتدائي
          })
          .select()
          .single();
          
        if (createError) {
          console.error('خطأ في إنشاء الملف الشخصي:', createError);
        } else {
          setProfile(newProfile);
        }
      }
    } catch (error) {
      console.error('خطأ في التحقق من المستخدم:', error);
    } finally {
      setLoading(false);
    }
  };

  const aiFeatures = [
    {
      id: 'text-question',
      icon: MessageSquare,
      title: 'طرح سؤال نصي',
      description: 'اطرح أي سؤال واحصل على إجابة مفصلة',
      credits: 5,
      gradient: 'from-blue-500 to-blue-600',
      component: TextQuestion
    },
    {
      id: 'image-question',
      icon: Image,
      title: 'سؤال مع صورة',
      description: 'ارفق صورة واطرح سؤالاً حولها',
      credits: 15,
      gradient: 'from-green-500 to-green-600',
      component: ImageQuestion
    },
    {
      id: 'audio-summary',
      icon: Mic,
      title: 'تلخيص الملفات الصوتية',
      description: 'احصل على ملخص للمحاضرات والاجتماعات',
      credits: 20,
      gradient: 'from-purple-500 to-purple-600',
      component: AudioSummary
    },
    {
      id: 'mind-map',
      icon: Network,
      title: 'إنشاء خريطة ذهنية',
      description: 'نظم أفكارك في خريطة ذهنية تفاعلية',
      credits: 10,
      gradient: 'from-orange-500 to-orange-600',
      component: MindMap
    },
    {
      id: 'research-paper',
      icon: BookOpen,
      title: 'كتابة بحث أكاديمي',
      description: 'احصل على بحث أكاديمي متكامل',
      credits: 50,
      gradient: 'from-red-500 to-red-600',
      component: ResearchPaper
    },
    {
      id: 'text-editing',
      icon: Edit,
      title: 'تحرير النصوص',
      description: 'حسن وصحح النصوص والمقالات',
      credits: 8,
      gradient: 'from-indigo-500 to-indigo-600',
      component: TextEditing
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* الشريط العلوي المحسن */}
      <header className="bg-card/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Brain className="w-10 h-10 text-primary animate-pulse" />
                <div className="absolute inset-0 w-10 h-10 bg-primary/20 rounded-full animate-ping"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  كويزورا
                </h1>
                <p className="text-sm text-muted-foreground">منصة الذكاء الاصطناعي التعليمية</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Badge 
                  variant="secondary" 
                  className="text-lg px-6 py-3 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 hover:from-primary/20 hover:to-accent/20 transition-all duration-300"
                >
                  <CreditCard className="w-5 h-5 ml-2 text-primary" />
                  <span className="font-bold">{profile?.credits || 0}</span>
                  <span className="mr-1">نقطة</span>
                </Badge>
                {profile && profile.credits < 10 && (
                  <div className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-primary/10 hover:text-primary transition-all duration-300"
                  onClick={() => navigate('/profile')}
                >
                  <User className="w-5 h-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-accent/10 hover:text-accent transition-all duration-300"
                  onClick={() => navigate('/history')}
                >
                  <History className="w-5 h-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
                  onClick={() => supabase.auth.signOut()}
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي المحسن */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-12 text-center">
          <div className="relative inline-block">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              مرحباً، {profile?.full_name || 'المستخدم'}
            </h2>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
          </div>
          <p className="text-muted-foreground text-lg mt-6 max-w-2xl mx-auto">
            استخدم أدوات الذكاء الاصطناعي المتقدمة لتحسين تعلمك وإنتاجيتك
          </p>
        </div>

        <Tabs defaultValue="workspace" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tools">نظرة عامة</TabsTrigger>
            <TabsTrigger value="workspace">مساحة العمل</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tools" className="space-y-6">
            {/* شبكة الأدوات المحسنة */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {aiFeatures.map((feature, index) => (
                <Card 
                  key={feature.title} 
                  className="group relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                  
                  <CardHeader className="text-center relative z-10">
                    <div className="flex justify-center mb-6">
                      <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.gradient} p-0.5 group-hover:scale-110 transition-transform duration-300`}>
                        <div className="w-full h-full bg-card rounded-2xl flex items-center justify-center">
                          <feature.icon className="w-10 h-10 text-primary group-hover:text-white transition-colors duration-300" />
                        </div>
                      </div>
                    </div>
                    <CardTitle className="text-xl mb-3 group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </CardTitle>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </CardHeader>
                  <CardContent className="text-center relative z-10">
                    <Badge 
                      variant="outline" 
                      className={`px-4 py-2 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent border-primary/20 group-hover:border-primary/40 transition-all duration-300`}
                    >
                      <CreditCard className="w-4 h-4 ml-1" />
                      {feature.credits} نقطة
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* إحصائيات سريعة محسنة */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-center mb-8">إحصائياتك</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="group relative overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
                  <CardContent className="text-center py-8 relative z-10">
                    <div className="relative mb-4">
                      <CreditCard className="w-12 h-12 text-primary mx-auto group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 w-12 h-12 bg-primary/20 rounded-full animate-pulse mx-auto"></div>
                    </div>
                    <p className="text-3xl font-bold text-primary mb-2">{profile?.credits || 0}</p>
                    <p className="text-muted-foreground font-medium">النقاط المتبقية</p>
                    {profile && profile.credits < 10 && (
                      <Badge variant="destructive" className="mt-2 text-xs">
                        نقاط منخفضة
                      </Badge>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="group relative overflow-hidden bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-lg hover:shadow-accent/20">
                  <CardContent className="text-center py-8 relative z-10">
                    <div className="relative mb-4">
                      <Brain className="w-12 h-12 text-accent mx-auto group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <p className="text-3xl font-bold text-accent mb-2">{profile?.total_credits_used || 0}</p>
                    <p className="text-muted-foreground font-medium">إجمالي النقاط المستخدمة</p>
                  </CardContent>
                </Card>
                
                <Card className="group relative overflow-hidden bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
                  <CardContent className="text-center py-8 relative z-10">
                    <div className="relative mb-4">
                      <MessageSquare className="w-12 h-12 text-green-500 mx-auto group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <p className="text-3xl font-bold text-green-500 mb-2">
                      {aiFeatures.length}
                    </p>
                    <p className="text-muted-foreground font-medium">الأدوات المتاحة</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="workspace" className="space-y-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">مساحة العمل</h3>
              <p className="text-muted-foreground">اختر الأداة التي تريد استخدامها</p>
            </div>
            
            <Tabs defaultValue="text-question" className="w-full">
              <div className="mb-6">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 h-auto bg-muted/30 p-2">
                  {aiFeatures.map((feature) => (
                    <TabsTrigger 
                      key={feature.id} 
                      value={feature.id}
                      className="flex flex-col gap-2 p-4 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                      disabled={!profile || profile.credits < feature.credits}
                    >
                      <feature.icon className="w-5 h-5" />
                      <span className="hidden lg:inline">{feature.title}</span>
                      <span className="lg:hidden text-xs">{feature.title.split(' ')[0]}</span>
                      <Badge 
                        variant="secondary" 
                        className="text-xs px-2 py-0.5"
                      >
                        {feature.credits}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              
              {aiFeatures.map((feature) => (
                <TabsContent key={feature.id} value={feature.id} className="mt-6">
                  {profile && profile.credits >= feature.credits ? (
                    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
                      <feature.component />
                    </div>
                  ) : (
                    <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
                      <CardContent className="text-center py-16">
                        <div className="relative mb-6">
                          <CreditCard className="w-20 h-20 text-destructive/60 mx-auto" />
                          <div className="absolute inset-0 w-20 h-20 bg-destructive/10 rounded-full animate-pulse mx-auto"></div>
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-destructive">نقاط غير كافية</h3>
                        <p className="text-muted-foreground mb-6 text-lg max-w-md mx-auto">
                          تحتاج إلى <span className="font-bold text-primary">{feature.credits} نقطة</span> لاستخدام هذه الأداة.
                          رصيدك الحالي: <span className="font-bold">{profile?.credits || 0} نقطة</span>
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button 
                            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                            onClick={() => navigate('/profile')}
                          >
                            <CreditCard className="w-4 h-4 ml-2" />
                            شراء نقاط إضافية
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => navigate('/pricing')}
                          >
                            عرض الباقات
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;