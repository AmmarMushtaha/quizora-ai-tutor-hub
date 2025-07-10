import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle, 
  Calendar, 
  Coins, 
  Search, 
  ArrowLeft,
  Trash2,
  Eye,
  Brain,
  FileText,
  Mic,
  Map,
  Edit
} from "lucide-react";
import Logo from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";

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
  content: string;
  response: string;
  credits_used: number;
  created_at: string;
  duration_minutes?: number;
  pages_count?: number;
  word_count?: number;
}

const History = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [aiRequests, setAIRequests] = useState<AIRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'conversations' | 'requests'>('conversations');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Load conversations
      const { data: conversationsData } = await supabase
        .from("conversation_history")
        .select("*")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false });

      if (conversationsData) setConversations(conversationsData as any);

      // Load AI requests
      const { data: requestsData } = await supabase
        .from("ai_requests")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (requestsData) setAIRequests(requestsData);

    } catch (error: any) {
      console.error("Error loading history:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from("conversation_history")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;

      setConversations(conversations.filter(conv => conv.id !== conversationId));
      
      toast({
        title: "تم الحذف",
        description: "تم حذف المحادثة بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في حذف المحادثة",
        variant: "destructive",
      });
    }
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'text_question': return Brain;
      case 'image_question': return FileText;
      case 'audio_summary': return Mic;
      case 'mind_map': return Map;
      case 'chat_explanation': return MessageCircle;
      case 'research_paper': return Edit;
      case 'text_editing': return Edit;
      default: return Brain;
    }
  };

  const getRequestTypeName = (type: string) => {
    switch (type) {
      case 'text_question': return 'سؤال نصي';
      case 'image_question': return 'سؤال صورة';
      case 'audio_summary': return 'تلخيص صوتي';
      case 'mind_map': return 'خريطة ذهنية';
      case 'chat_explanation': return 'شرح ذكي';
      case 'research_paper': return 'بحث أكاديمي';
      case 'text_editing': return 'تحرير نص';
      default: return type;
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRequests = aiRequests.filter(req => 
    req.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getRequestTypeName(req.request_type).includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Logo size="sm" />
              <div>
                <h1 className="text-xl font-bold">سجل النشاط</h1>
                <p className="text-sm text-muted-foreground">تاريخ محادثاتك وطلباتك</p>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 w-64"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <Button
            variant={activeTab === 'conversations' ? 'default' : 'outline'}
            onClick={() => setActiveTab('conversations')}
            className="flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            المحادثات ({conversations.length})
          </Button>
          <Button
            variant={activeTab === 'requests' ? 'default' : 'outline'}
            onClick={() => setActiveTab('requests')}
            className="flex items-center gap-2"
          >
            <Brain className="w-4 h-4" />
            طلبات الذكاء الاصطناعي ({aiRequests.length})
          </Button>
        </div>

        {/* Conversations Tab */}
        {activeTab === 'conversations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">سجل المحادثات</h2>
              <p className="text-muted-foreground">
                {filteredConversations.length} محادثة
              </p>
            </div>

            {filteredConversations.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">لا توجد محادثات</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? "لم يتم العثور على محادثات مطابقة للبحث" : "لم تبدأ أي محادثة بعد"}
                  </p>
                  <Button onClick={() => navigate("/tools/smart-tutor")}>
                    ابدأ محادثة جديدة
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredConversations.map((conversation) => (
                  <Card key={conversation.id} className="glass-card hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{conversation.title}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(conversation.updated_at).toLocaleDateString('ar-SA')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Coins className="w-4 h-4 text-yellow-500" />
                              {conversation.total_credits_used} كريدت
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              {conversation.messages.length} رسالة
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            عرض
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => deleteConversation(conversation.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">طلبات الذكاء الاصطناعي</h2>
              <p className="text-muted-foreground">
                {filteredRequests.length} طلب
              </p>
            </div>

            {filteredRequests.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="text-center py-12">
                  <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">لا توجد طلبات</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? "لم يتم العثور على طلبات مطابقة للبحث" : "لم تستخدم أدوات الذكاء الاصطناعي بعد"}
                  </p>
                  <Button onClick={() => navigate("/dashboard")}>
                    استكشف الأدوات
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredRequests.map((request) => {
                  const IconComponent = getRequestTypeIcon(request.request_type);
                  return (
                    <Card key={request.id} className="glass-card hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <IconComponent className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">
                                  {getRequestTypeName(request.request_type)}
                                </Badge>
                                <Badge variant="secondary">
                                  <Coins className="w-3 h-3 mr-1" />
                                  {request.credits_used}
                                </Badge>
                              </div>
                              <CardDescription className="text-foreground">
                                {request.content ? (
                                  request.content.length > 100 
                                    ? `${request.content.substring(0, 100)}...`
                                    : request.content
                                ) : (
                                  <span className="text-muted-foreground">
                                    {request.request_type === 'audio_summary' && request.duration_minutes && 
                                      `تلخيص محاضرة ${request.duration_minutes} دقيقة`
                                    }
                                    {request.request_type === 'research_paper' && request.pages_count && 
                                      `بحث أكاديمي ${request.pages_count} صفحة`
                                    }
                                    {request.request_type === 'text_editing' && request.word_count && 
                                      `تحرير نص ${request.word_count} كلمة`
                                    }
                                    {request.request_type === 'image_question' && 
                                      'حل أسئلة من صورة'
                                    }
                                    {request.request_type === 'mind_map' && 
                                      'إنشاء خريطة ذهنية'
                                    }
                                  </span>
                                )}
                              </CardDescription>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(request.created_at).toLocaleDateString('ar-SA')}
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            عرض التفاصيل
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardHeader className="text-center">
              <MessageCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <CardTitle>إجمالي المحادثات</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold">{conversations.length}</div>
              <p className="text-muted-foreground">محادثة</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="text-center">
              <Brain className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <CardTitle>طلبات الذكاء الاصطناعي</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold">{aiRequests.length}</div>
              <p className="text-muted-foreground">طلب</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="text-center">
              <Coins className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <CardTitle>إجمالي الكريدت المستخدم</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold">
                {conversations.reduce((sum, conv) => sum + conv.total_credits_used, 0) +
                 aiRequests.reduce((sum, req) => sum + req.credits_used, 0)}
              </div>
              <p className="text-muted-foreground">كريدت</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default History;