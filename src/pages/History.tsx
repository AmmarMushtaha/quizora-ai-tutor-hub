import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConversationCard } from "@/components/history/ConversationCard";
import { AIRequestCard } from "@/components/history/AIRequestCard";
import { HistoryStats } from "@/components/history/HistoryStats";
import { HistoryFilters } from "@/components/history/HistoryFilters";
import { 
  MessageCircle, 
  Brain,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";

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
  image_url?: string;
  audio_url?: string;
}

const History = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [aiRequests, setAIRequests] = useState<AIRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>("desc");
  const [activeTab, setActiveTab] = useState<'overview' | 'conversations' | 'requests'>('overview');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, refetch: refetchProfile } = useProfile();

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

  // Enhanced filtering and sorting logic
  const filteredAndSortedData = useMemo(() => {
    const filterByDate = (date: string) => {
      const now = new Date();
      const itemDate = new Date(date);
      
      switch (dateFilter) {
        case 'today':
          return itemDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return itemDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return itemDate >= monthAgo;
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          return itemDate >= yearAgo;
        default:
          return true;
      }
    };

    // Filter conversations
    const filteredConversations = conversations.filter(conv => {
      const matchesSearch = conv.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = filterByDate(conv.updated_at);
      return matchesSearch && matchesDate;
    });

    // Filter AI requests
    const filteredRequests = aiRequests.filter(req => {
      const matchesSearch = 
        req.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.request_type.includes(searchTerm.toLowerCase());
      const matchesDate = filterByDate(req.created_at);
      const matchesType = typeFilter === 'all' || req.request_type === typeFilter;
      return matchesSearch && matchesDate && matchesType;
    });

    // Sort conversations
    const sortedConversations = [...filteredConversations].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case 'credits':
          comparison = a.total_credits_used - b.total_credits_used;
          break;
        case 'messages':
          comparison = a.messages.length - b.messages.length;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title, 'ar');
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Sort AI requests
    const sortedRequests = [...filteredRequests].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'credits':
          comparison = a.credits_used - b.credits_used;
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return {
      conversations: sortedConversations,
      requests: sortedRequests
    };
  }, [conversations, aiRequests, searchTerm, dateFilter, typeFilter, sortBy, sortOrder]);

  const activeFiltersCount = [
    searchTerm !== "",
    dateFilter !== "all",
    typeFilter !== "all"
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("all");
    setTypeFilter("all");
    setSortBy("date");
    setSortOrder("desc");
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar profile={profile} onRefreshCredits={refetchProfile} />
          <SidebarInset>
            <div className="flex items-center gap-4 p-4 border-b">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar profile={profile} onRefreshCredits={refetchProfile} />
        <SidebarInset>
          {/* Header */}
          <header className="flex items-center gap-4 p-4 border-b bg-card/50 backdrop-blur-sm">
            <SidebarTrigger />
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  سجل النشاط
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                </h1>
                <p className="text-sm text-muted-foreground">
                  تاريخ شامل لكل محادثاتك وطلباتك
                </p>
              </div>
            </div>
            
            <div className="mr-auto flex items-center gap-3">
              <Badge variant="outline" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                {conversations.length + aiRequests.length} إجمالي العناصر
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                العودة للوحة التحكم
              </Button>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {/* Filters */}
            <HistoryFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
              onClearFilters={clearFilters}
              activeFiltersCount={activeFiltersCount}
            />

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  نظرة عامة
                </TabsTrigger>
                <TabsTrigger value="conversations" className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  المحادثات ({filteredAndSortedData.conversations.length})
                </TabsTrigger>
                <TabsTrigger value="requests" className="gap-2">
                  <Brain className="w-4 h-4" />
                  طلبات الذكاء الاصطناعي ({filteredAndSortedData.requests.length})
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold">{conversations.length}</div>
                      <div className="text-sm text-muted-foreground">محادثة</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Brain className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold">{aiRequests.length}</div>
                      <div className="text-sm text-muted-foreground">طلب AI</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Conversations Tab */}
              <TabsContent value="conversations" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">سجل المحادثات</h2>
                  <Badge variant="secondary">
                    {filteredAndSortedData.conversations.length} محادثة
                  </Badge>
                </div>

                {filteredAndSortedData.conversations.length === 0 ? (
                  <Card className="bg-muted/30">
                    <CardContent className="text-center py-12">
                      <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">لا توجد محادثات</h3>
                      <p className="text-muted-foreground mb-6">
                        {searchTerm || dateFilter !== 'all' 
                          ? "لم يتم العثور على محادثات مطابقة للفلاتر المحددة" 
                          : "لم تبدأ أي محادثة بعد. ابدأ محادثتك الأولى الآن!"
                        }
                      </p>
                      <Button onClick={() => navigate("/dashboard")} className="gap-2">
                        <Sparkles className="w-4 h-4" />
                        ابدأ محادثة جديدة
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {filteredAndSortedData.conversations.map((conversation) => (
                      <ConversationCard
                        key={conversation.id}
                        conversation={conversation}
                        onDelete={deleteConversation}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* AI Requests Tab */}
              <TabsContent value="requests" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">طلبات الذكاء الاصطناعي</h2>
                  <Badge variant="secondary">
                    {filteredAndSortedData.requests.length} طلب
                  </Badge>
                </div>

                {filteredAndSortedData.requests.length === 0 ? (
                  <Card className="bg-muted/30">
                    <CardContent className="text-center py-12">
                      <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">لا توجد طلبات</h3>
                      <p className="text-muted-foreground mb-6">
                        {searchTerm || dateFilter !== 'all' || typeFilter !== 'all'
                          ? "لم يتم العثور على طلبات مطابقة للفلاتر المحددة"
                          : "لم تستخدم أدوات الذكاء الاصطناعي بعد. استكشف الأدوات المتاحة!"
                        }
                      </p>
                      <Button onClick={() => navigate("/dashboard")} className="gap-2">
                        <Brain className="w-4 h-4" />
                        استكشف الأدوات
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {filteredAndSortedData.requests.map((request) => (
                      <AIRequestCard key={request.id} request={request} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default History;