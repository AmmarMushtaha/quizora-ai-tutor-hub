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
      color: 'text-blue-500',
      component: TextQuestion
    },
    {
      id: 'image-question',
      icon: Image,
      title: 'سؤال مع صورة',
      description: 'ارفق صورة واطرح سؤالاً حولها',
      credits: 15,
      color: 'text-green-500',
      component: ImageQuestion
    },
    {
      id: 'audio-summary',
      icon: Mic,
      title: 'تلخيص الملفات الصوتية',
      description: 'احصل على ملخص للمحاضرات والاجتماعات',
      credits: 20,
      color: 'text-purple-500',
      component: AudioSummary
    },
    {
      id: 'mind-map',
      icon: Network,
      title: 'إنشاء خريطة ذهنية',
      description: 'نظم أفكارك في خريطة ذهنية تفاعلية',
      credits: 10,
      color: 'text-orange-500',
      component: MindMap
    },
    {
      id: 'research-paper',
      icon: BookOpen,
      title: 'كتابة بحث أكاديمي',
      description: 'احصل على بحث أكاديمي متكامل',
      credits: 50,
      color: 'text-red-500',
      component: ResearchPaper
    },
    {
      id: 'text-editing',
      icon: Edit,
      title: 'تحرير النصوص',
      description: 'حسن وصحح النصوص والمقالات',
      credits: 8,
      color: 'text-indigo-500',
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
    <div className="min-h-screen bg-background">
      {/* الشريط العلوي */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Brain className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gradient">كويزورا</h1>
                <p className="text-sm text-muted-foreground">منصة الذكاء الاصطناعي التعليمية</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <CreditCard className="w-4 h-4 ml-2" />
                {profile?.credits || 0} نقطة
              </Badge>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate('/profile')}
                >
                  <User className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate('/history')}
                >
                  <History className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => supabase.auth.signOut()}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">مرحباً، {profile?.full_name || 'المستخدم'}</h2>
          <p className="text-muted-foreground">اختر إحدى الأدوات الذكية لبدء العمل</p>
        </div>

        <Tabs defaultValue="workspace" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tools">نظرة عامة</TabsTrigger>
            <TabsTrigger value="workspace">مساحة العمل</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tools" className="space-y-6">
            {/* شبكة الأدوات */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiFeatures.map((feature) => (
                <Card key={feature.title} className="card-glow interactive-hover">
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <feature.icon className={`w-8 h-8 ${feature.color}`} />
                      </div>
                    </div>
                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Badge variant="outline" className="mb-4">
                      {feature.credits} نقطة
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* إحصائيات سريعة */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="card-glow">
                <CardContent className="text-center py-6">
                  <CreditCard className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{profile?.credits || 0}</p>
                  <p className="text-muted-foreground">النقاط المتبقية</p>
                </CardContent>
              </Card>
              
              <Card className="card-glow">
                <CardContent className="text-center py-6">
                  <Brain className="w-8 h-8 text-accent mx-auto mb-2" />
                  <p className="text-2xl font-bold">{profile?.total_credits_used || 0}</p>
                  <p className="text-muted-foreground">إجمالي النقاط المستخدمة</p>
                </CardContent>
              </Card>
              
              <Card className="card-glow">
                <CardContent className="text-center py-6">
                  <MessageSquare className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-muted-foreground">المحادثات النشطة</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="workspace" className="space-y-6">
            <Tabs defaultValue="text-question" className="w-full">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                {aiFeatures.map((feature) => (
                  <TabsTrigger 
                    key={feature.id} 
                    value={feature.id}
                    className="text-xs"
                    disabled={!profile || profile.credits < feature.credits}
                  >
                    <feature.icon className="w-4 h-4 ml-1" />
                    {feature.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {aiFeatures.map((feature) => (
                <TabsContent key={feature.id} value={feature.id}>
                  {profile && profile.credits >= feature.credits ? (
                    <feature.component />
                  ) : (
                    <Card className="card-glow">
                      <CardContent className="text-center py-12">
                        <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">نقاط غير كافية</h3>
                        <p className="text-muted-foreground mb-4">
                          تحتاج إلى {feature.credits} نقطة لاستخدام هذه الأداة
                        </p>
                        <Button 
                          variant="outline"
                          onClick={() => navigate('/profile')}
                        >
                          شراء نقاط إضافية
                        </Button>
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