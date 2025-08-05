import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  MessageCircle, 
  Brain, 
  Coins, 
  TrendingUp,
  Calendar,
  Activity,
  BarChart3
} from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  total_credits_used: number;
  created_at: string;
  updated_at: string;
  messages: any[];
}

interface AIRequest {
  id: string;
  request_type: string;
  credits_used: number;
  created_at: string;
}

interface HistoryStatsProps {
  conversations: Conversation[];
  aiRequests: AIRequest[];
}

export function HistoryStats({ conversations, aiRequests }: HistoryStatsProps) {
  const totalCreditsUsed = 
    conversations.reduce((sum, conv) => sum + conv.total_credits_used, 0) +
    aiRequests.reduce((sum, req) => sum + req.credits_used, 0);

  const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);

  // Calculate this month's activity
  const thisMonth = new Date();
  thisMonth.setDate(1);
  
  const thisMonthRequests = aiRequests.filter(req => 
    new Date(req.created_at) >= thisMonth
  ).length;
  
  const thisMonthConversations = conversations.filter(conv => 
    new Date(conv.updated_at) >= thisMonth
  ).length;

  // Calculate request type distribution
  const requestTypeStats = aiRequests.reduce((acc, req) => {
    acc[req.request_type] = (acc[req.request_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topRequestType = Object.entries(requestTypeStats)
    .sort(([,a], [,b]) => b - a)[0];

  const getRequestTypeName = (type: string) => {
    switch (type) {
      case 'text_question': return 'الأسئلة النصية';
      case 'image_question': return 'أسئلة الصور';
      case 'audio_summary': return 'التلخيص الصوتي';
      case 'mind_map': return 'الخرائط الذهنية';
      case 'chat_explanation': return 'الشرح الذكي';
      case 'research_paper': return 'البحوث الأكاديمية';
      case 'text_editing': return 'تحرير النصوص';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-600/10 border-blue-200/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي المحادثات
            </CardTitle>
            <MessageCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversations.length}</div>
            <p className="text-xs text-muted-foreground">
              {thisMonthConversations} هذا الشهر
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-600/10 border-purple-200/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              طلبات الذكاء الاصطناعي
            </CardTitle>
            <Brain className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              {thisMonthRequests} هذا الشهر
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/5 to-yellow-600/10 border-yellow-200/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي الكريدت المستخدم
            </CardTitle>
            <Coins className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCreditsUsed}</div>
            <p className="text-xs text-muted-foreground">
              كريدت مستهلك
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-green-600/10 border-green-200/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي الرسائل
            </CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              رسالة متبادلة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Overview */}
        <Card className="bg-gradient-to-br from-card/50 to-card border border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              نظرة عامة على النشاط
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>المحادثات</span>
                <span>{conversations.length}</span>
              </div>
              <Progress value={Math.min((conversations.length / 50) * 100, 100)} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>طلبات الذكاء الاصطناعي</span>
                <span>{aiRequests.length}</span>
              </div>
              <Progress value={Math.min((aiRequests.length / 100) * 100, 100)} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>الكريدت المستخدم</span>
                <span>{totalCreditsUsed}</span>
              </div>
              <Progress value={Math.min((totalCreditsUsed / 1000) * 100, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Top Request Types */}
        <Card className="bg-gradient-to-br from-card/50 to-card border border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              أكثر الأدوات استخداماً
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(requestTypeStats)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([type, count]) => (
                <div key={type} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{getRequestTypeName(type)}</span>
                    <span>{count} مرة</span>
                  </div>
                  <Progress 
                    value={(count / Math.max(...Object.values(requestTypeStats))) * 100} 
                    className="h-2" 
                  />
                </div>
              ))
            }
            
            {Object.keys(requestTypeStats).length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                لم تستخدم أي أدوات بعد
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Activity */}
      <Card className="bg-gradient-to-br from-card/50 to-card border border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            النشاط الشهري
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">{thisMonthConversations}</div>
              <p className="text-sm text-muted-foreground">محادثة هذا الشهر</p>
            </div>
            
            <div className="text-center p-4 bg-accent/5 rounded-lg">
              <div className="text-2xl font-bold text-accent">{thisMonthRequests}</div>
              <p className="text-sm text-muted-foreground">طلب ذكاء اصطناعي</p>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">
                {topRequestType ? getRequestTypeName(topRequestType[0]) : 'لا يوجد'}
              </div>
              <p className="text-sm text-muted-foreground">الأداة الأكثر استخداماً</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}