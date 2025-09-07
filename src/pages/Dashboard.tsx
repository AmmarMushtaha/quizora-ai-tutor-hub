import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
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
  BookOpen,
  Menu,
  Crown,
  Book
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { AppSidebar } from '@/components/AppSidebar';
import SubscriptionAlerts from '@/components/SubscriptionAlerts';

// Lazy load AI components for better performance
const TextQuestion = React.lazy(() => import('@/components/ai/TextQuestion'));
const ImageQuestion = React.lazy(() => import('@/components/ai/ImageQuestion'));
const AudioSummary = React.lazy(() => import('@/components/ai/AudioSummary'));
const MindMap = React.lazy(() => import('@/components/ai/MindMap'));
const ResearchPaper = React.lazy(() => import('@/components/ai/ResearchPaper'));
const TextEditing = React.lazy(() => import('@/components/ai/TextEditing'));
const ChatWithTutor = React.lazy(() => import('@/components/ai/ChatWithTutor'));
const BookCreator = React.lazy(() => import('@/components/ai/BookCreator'));

const Dashboard = () => {
  const { user } = useAuth();
  const { profile, isLoading, error, refreshCredits } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for session ID from navigation state or URL params
  const sessionId = location.state?.sessionId || new URLSearchParams(location.search).get('sessionId');
  const [activeTab, setActiveTab] = React.useState(sessionId ? 'workspace' : 'workspace');
  const [activeComponent, setActiveComponent] = React.useState(sessionId ? 'chat-tutor' : null);

  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  React.useEffect(() => {
    if (sessionId) {
      setActiveTab('workspace');
      setActiveComponent('chat-tutor');
    }
  }, [sessionId]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">حدث خطأ في تحميل البيانات</p>
            <Button onClick={() => window.location.reload()}>
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      id: 'book-creator',
      icon: Book,
      title: 'إنشاء كتاب احترافي',
      description: 'أنشئ كتاباً كاملاً مع فهرس وصفحات منظمة',
      credits: 30,
      gradient: 'from-purple-500 to-purple-600',
      component: BookCreator
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
    {
      id: 'chat-tutor',
      icon: MessageSquare,
      title: 'المعلم الذكي',
      description: 'محادثة تفاعلية مع معلم ذكاء اصطناعي',
      credits: 2,
      gradient: 'from-teal-500 to-teal-600',
      component: ChatWithTutor
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
        <div className="w-60 md:w-64 border-r border-border bg-card">
          <div className="p-4 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <header className="bg-card/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </header>
          <main className="flex-1 container mx-auto px-2 md:px-4 py-4 md:py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-4 md:p-6">
                  <Skeleton className="h-12 w-12 md:h-16 md:w-16 rounded-2xl mx-auto mb-4" />
                  <Skeleton className="h-4 md:h-6 w-3/4 mx-auto mb-2" />
                  <Skeleton className="h-3 md:h-4 w-full mb-4" />
                  <Skeleton className="h-6 md:h-8 w-16 md:w-20 mx-auto" />
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background to-muted/20">
      <AppSidebar profile={profile} onRefreshCredits={refreshCredits} />
      
      <div className="flex-1 flex flex-col">
        {/* الشريط العلوي المحسن */}
        <header className="bg-card/80 backdrop-blur-lg border-b border-border/50 sticky top-0 z-50">
          <div className="container mx-auto px-2 md:px-4 py-3 md:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-4">
                <SidebarTrigger className="hover:bg-primary/10 hover:text-primary transition-all duration-300" />
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="relative lg:hidden">
                    <Brain className="w-6 h-6 md:w-8 md:h-8 text-primary animate-pulse" />
                    <div className="absolute inset-0 w-6 h-6 md:w-8 md:h-8 bg-primary/20 rounded-full animate-ping"></div>
                  </div>
                  <div className="hidden lg:block">
                    <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      كويزورا
                    </h1>
                    <p className="text-xs text-muted-foreground">منصة الذكاء الاصطناعي التعليمية</p>
                  </div>
                </div>
              </div>
                
              <div className="flex items-center gap-2 md:gap-4">
                {/* عرض الرصيد المحسن للمستخدمين المشتركين */}
                <div className="relative">
                  <Badge 
                    variant="secondary" 
                    className={`text-sm md:text-lg px-3 md:px-6 py-2 md:py-3 transition-all duration-300 ${
                      profile?.credits > 100
                        ? 'bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 hover:from-primary/20 hover:to-accent/20 ring-2 ring-primary/20'
                        : 'bg-muted/50 border-border/50 hover:bg-muted/70'
                    }`}
                  >
                    <CreditCard className={`w-4 h-4 md:w-5 md:h-5 ml-1 md:ml-2 ${
                      profile?.credits > 100 ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <span className="font-bold">{profile?.credits || 0}</span>
                    <span className="mr-1 hidden sm:inline">نقطة</span>
                  </Badge>
                  {profile && profile.credits < 10 && (
                    <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                
                <div className="hidden md:flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary/10 hover:text-primary transition-all duration-300"
                    onClick={() => navigate('/profile')}
                  >
                    <User className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-accent/10 hover:text-accent transition-all duration-300"
                    onClick={() => navigate('/history')}
                  >
                    <History className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </div>
              </div>
              </div>
            </div>
          </header>

        {/* المحتوى الرئيسي المحسن */}
        <main className="flex-1 container mx-auto px-2 md:px-4 py-4 md:py-8 overflow-auto">
            {/* تنبيهات الاشتراك الذكية */}
            <SubscriptionAlerts profile={profile} />
            
            <div className="mb-8 md:mb-12 text-center">
              <div className="relative inline-block">
                <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-4 ${
                  profile?.credits > 100
                    ? 'bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent'
                    : 'text-foreground'
                }`}>
                  مرحباً، {profile?.full_name || 'المستخدم'}
                  {profile?.credits > 100 && (
                    <Badge className="ml-2 md:ml-3 bg-gradient-to-r from-primary to-accent text-white text-xs md:text-sm">
                      <Crown className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                      <span className="hidden sm:inline">مشترك مميز</span>
                      <span className="sm:hidden">مميز</span>
                    </Badge>
                  )}
                </h2>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 md:w-24 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></div>
              </div>
              <p className="text-muted-foreground text-sm md:text-lg mt-4 md:mt-6 max-w-2xl mx-auto px-4">
                استخدم أدوات الذكاء الاصطناعي المتقدمة لتحسين تعلمك وإنتاجيتك
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tools">نظرة عامة</TabsTrigger>
                <TabsTrigger value="workspace">مساحة العمل</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tools" className="space-y-4 md:space-y-6">
                {/* شبكة الأدوات المحسنة */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                  {aiFeatures.map((feature, index) => (
                    <Card 
                      key={feature.title} 
                      className={`group relative overflow-hidden backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 ${
                        profile?.credits >= feature.credits
                          ? 'bg-card/50'
                          : 'bg-muted/30 opacity-60'
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                      
                      <CardHeader className="text-center relative z-10">
                        <div className="flex justify-center mb-6">
                          <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.gradient} p-0.5 group-hover:scale-110 transition-transform duration-300`}>
                            <div className="w-full h-full bg-card rounded-2xl flex items-center justify-center">
                              <feature.icon className={`w-10 h-10 transition-colors duration-300 ${
                                profile?.credits >= feature.credits
                                  ? 'text-primary group-hover:text-white'
                                  : 'text-muted-foreground'
                              }`} />
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
                          className={`px-4 py-2 transition-all duration-300 ${
                            profile?.credits >= feature.credits
                              ? `bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent border-primary/20 group-hover:border-primary/40`
                              : 'text-muted-foreground border-muted'
                          }`}
                        >
                          <CreditCard className="w-4 h-4 ml-1" />
                          {feature.credits} نقطة
                        </Badge>
                        {profile?.credits < feature.credits && (
                          <p className="text-xs text-destructive mt-2">
                            تحتاج {feature.credits - (profile?.credits || 0)} نقطة إضافية
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* إحصائيات سريعة محسنة */}
                <div className="mt-8 md:mt-12">
                  <h3 className="text-xl md:text-2xl font-bold text-center mb-6 md:mb-8">إحصائياتك</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                      profile?.credits > 100
                        ? 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:border-primary/40 hover:shadow-primary/20'
                        : 'bg-gradient-to-br from-muted/5 to-muted/10 border-border/20'
                    }`}>
                      <CardContent className="text-center py-8 relative z-10">
                        <div className="relative mb-4">
                          <CreditCard className={`w-12 h-12 mx-auto group-hover:scale-110 transition-transform duration-300 ${
                            profile?.credits > 100 ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                          {profile?.credits > 100 && (
                            <div className="absolute inset-0 w-12 h-12 bg-primary/20 rounded-full animate-pulse mx-auto"></div>
                          )}
                        </div>
                        <p className={`text-3xl font-bold mb-2 ${
                          profile?.credits > 100 ? 'text-primary' : 'text-foreground'
                        }`}>{profile?.credits || 0}</p>
                        <p className="text-muted-foreground font-medium">النقاط المتبقية</p>
                        {profile && profile.credits < 10 && (
                          <Badge variant="destructive" className="mt-2 text-xs">
                            نقاط منخفضة
                          </Badge>
                        )}
                        {profile && profile.credits > 100 && (
                          <Badge className="mt-2 text-xs bg-gradient-to-r from-primary to-accent text-white">
                            رصيد ممتاز
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
                          {aiFeatures.filter(f => (profile?.credits || 0) >= f.credits).length}
                        </p>
                        <p className="text-muted-foreground font-medium">الأدوات المتاحة</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
                <TabsContent value="workspace" className="space-y-6 md:space-y-8">
                <div className="text-center mb-6 md:mb-8">
                  <h3 className="text-xl md:text-2xl font-bold mb-2">مساحة العمل</h3>
                  <p className="text-sm md:text-base text-muted-foreground">اختر الأداة التي تريد استخدامها</p>
                </div>
                
                <Tabs value={activeComponent || "text-question"} onValueChange={setActiveComponent} className="w-full">
                  <div className="mb-4 md:mb-6">
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1 md:gap-2 h-auto bg-muted/30 p-1 md:p-2">
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
                            className={`text-xs px-2 py-0.5 ${
                              profile?.credits >= feature.credits
                                ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                : 'bg-destructive/10 text-destructive border-destructive/20'
                            }`}
                          >
                             {feature.id === 'book-creator' ? '3/صفحة' : feature.credits}
                          </Badge>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                  
                  {aiFeatures.map((feature) => (
                    <TabsContent key={feature.id} value={feature.id} className="mt-6">
                      {profile && (feature.id === 'book-creator' ? profile.credits >= 9 : profile.credits >= feature.credits) ? (
                        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
                          <React.Suspense fallback={
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                              <span className="mr-2">جاري التحميل...</span>
                            </div>
                          }>
                            {feature.id === 'chat-tutor' && sessionId ? (
                              <feature.component sessionId={sessionId} />
                            ) : (
                              <feature.component />
                            )}
                          </React.Suspense>
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
                               {feature.id === 'book-creator' ? (
                                 <>
                                   تحتاج إلى <span className="font-bold text-primary">3 نقاط لكل صفحة</span> لإنشاء كتاب.
                                   رصيدك الحالي: <span className="font-bold">{profile?.credits || 0} نقطة</span>
                                 </>
                               ) : (
                                 <>
                                   تحتاج إلى <span className="font-bold text-primary">{feature.credits} نقطة</span> لاستخدام هذه الأداة.
                                   رصيدك الحالي: <span className="font-bold">{profile?.credits || 0} نقطة</span>
                                 </>
                               )}
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
                                onClick={() => window.open('/#pricing', '_blank')}
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
    </div>
  );
};

export default Dashboard;