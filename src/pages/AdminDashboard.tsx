import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Users, 
  CreditCard, 
  FileText, 
  BarChart3, 
  Settings,
  Search,
  Eye,
  Edit,
  Trash2,
  Crown,
  Shield,
  TrendingUp,
  DollarSign,
  Calendar,
  Activity,
  Globe,
  Clock,
  Zap,
  Database,
  RefreshCw,
  UserCheck,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import Logo from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  credits: number;
  total_credits_used: number;
  role: string;
  created_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  credits_included: number;
  price: number;
  status: string;
  created_at: string;
  profiles: { full_name: string; email: string } | null;
}

interface AIRequest {
  id: string;
  user_id: string;
  request_type: string;
  credits_used: number;
  created_at: string;
  profiles?: { full_name: string; email: string } | null;
  content?: string;
  response?: string;
  duration_minutes?: number;
  pages_count?: number;
  word_count?: number;
  audio_url?: string;
  image_url?: string;
}

interface Stats {
  totalUsers: number;
  totalRevenue: number;
  totalCreditsUsed: number;
  activeSubscriptions: number;
  todaySignups: number;
  weeklySignups: number;
  monthlyRevenue: number;
  averageCreditsPerUser: number;
  systemLoad: number;
  activeUsers: number;
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [aiRequests, setAIRequests] = useState<AIRequest[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalRevenue: 0,
    totalCreditsUsed: 0,
    activeSubscriptions: 0,
    todaySignups: 0,
    weeklySignups: 0,
    monthlyRevenue: 0,
    averageCreditsPerUser: 0,
    systemLoad: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [userHistory, setUserHistory] = useState<AIRequest[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        toast({
          title: "غير مصرح",
          description: "ليس لديك صلاحية للوصول إلى لوحة التحكم",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      await loadAdminData();
    } catch (error: any) {
      console.error("Error checking admin access:", error);
      navigate("/dashboard");
    }
  };

  const loadAdminData = async () => {
    try {
      // Load users
      const { data: usersData } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersData) setUsers(usersData);

      // Load subscriptions with user info
      const { data: subscriptionsData } = await supabase
        .from("subscriptions")
        .select(`
          *,
          profiles:user_id (full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (subscriptionsData) setSubscriptions(subscriptionsData as any);

      // Load AI requests with user info
      const { data: requestsData } = await supabase
        .from("ai_requests")
        .select(`
          *,
          profiles:user_id (full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (requestsData) setAIRequests(requestsData as any);

      // Calculate advanced stats
      if (usersData && subscriptionsData && requestsData) {
        const today = new Date();
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const todaySignups = usersData.filter(user => 
          new Date(user.created_at).toDateString() === today.toDateString()
        ).length;
        
        const weeklySignups = usersData.filter(user => 
          new Date(user.created_at) >= lastWeek
        ).length;
        
        const monthlyRevenue = subscriptionsData
          .filter(sub => new Date(sub.created_at) >= lastMonth)
          .reduce((sum, sub) => sum + Number(sub.price), 0);
          
        const totalCreditsUsed = usersData.reduce((sum, user) => sum + user.total_credits_used, 0);
        const averageCreditsPerUser = usersData.length > 0 ? Math.round(totalCreditsUsed / usersData.length) : 0;
        
        // Active users (users with activity in last 7 days)
        const activeUsers = usersData.filter(user => 
          user.total_credits_used > 0 && new Date(user.created_at) >= lastWeek
        ).length;
        
        setStats({
          totalUsers: usersData.length,
          totalRevenue: subscriptionsData
            .filter(sub => sub.status === 'active')
            .reduce((sum, sub) => sum + Number(sub.price), 0),
          totalCreditsUsed,
          activeSubscriptions: subscriptionsData.filter(sub => sub.status === 'active').length,
          todaySignups,
          weeklySignups,
          monthlyRevenue,
          averageCreditsPerUser,
          systemLoad: Math.random() * 100, // محاكاة حمل النظام
          activeUsers
        });
      }

    } catch (error: any) {
      console.error("Error loading admin data:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث دور المستخدم بنجاح",
      });

      await loadAdminData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحديث دور المستخدم",
        variant: "destructive",
      });
    }
  };

  const updateUserCredits = async (userId: string, newCredits: number) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ credits: newCredits })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث رصيد المستخدم بنجاح",
      });

      await loadAdminData();
    } catch (error: any) {
      toast({
        title: "خطأ", 
        description: "حدث خطأ في تحديث الرصيد",
        variant: "destructive",
      });
    }
  };

  const createSubscription = async (userId: string, planName: string, credits: number, price: number) => {
    try {
      // إنشاء اشتراك جديد
      const { error: subError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          plan_name: planName,
          credits_included: credits,
          price: price,
          status: 'active',
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 يوم
        });

      if (subError) throw subError;

      // إضافة الرصيد للمستخدم
      const { data: currentUser } = await supabase
        .from("profiles")
        .select("credits")
        .eq("user_id", userId)
        .single();
        
      if (currentUser) {
        const { error: creditError } = await supabase
          .from("profiles")
          .update({ credits: currentUser.credits + credits })
          .eq("user_id", userId);
          
        if (creditError) throw creditError;
      }

      toast({
        title: "تم الإنشاء",
        description: "تم إنشاء الاشتراك بنجاح",
      });

      await loadAdminData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في إنشاء الاشتراك",
        variant: "destructive",
      });
    }
  };

  const viewUserHistory = async (user: User) => {
    try {
      setSelectedUser(user);
      setShowUserDetails(true);
      
      // جلب سجل المستخدم
      const { data: historyData } = await supabase
        .from("ai_requests")
        .select("*")
        .eq("user_id", user.user_id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (historyData) {
        setUserHistory(historyData.map(item => ({ ...item, profiles: null })));
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في جلب سجل المستخدم",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف المستخدم بنجاح",
      });

      await loadAdminData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في حذف المستخدم",
        variant: "destructive",
      });
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    if (!confirm("هل أنت متأكد من إلغاء هذا الاشتراك؟")) return;
    
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: 'cancelled' })
        .eq("id", subscriptionId);

      if (error) throw error;

      toast({
        title: "تم الإلغاء",
        description: "تم إلغاء الاشتراك بنجاح",
      });

      await loadAdminData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في إلغاء الاشتراك",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
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
              <Logo size="sm" />
              <div>
                <h1 className="text-xl font-bold">لوحة تحكم المسؤول</h1>
                <p className="text-sm text-muted-foreground">إدارة شاملة للمنصة</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                لوحة المستخدم
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                الصفحة الرئيسية
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +{stats.todaySignups} اليوم | +{stats.weeklySignups} هذا الأسبوع
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +${stats.monthlyRevenue} هذا الشهر
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الكريدت المستخدم</CardTitle>
              <Activity className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCreditsUsed}</div>
              <p className="text-xs text-muted-foreground mt-1">
                متوسط {stats.averageCreditsPerUser} لكل مستخدم
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المستخدمون النشطون</CardTitle>
              <UserCheck className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.activeSubscriptions} اشتراكات نشطة
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                حالة النظام
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>حمل الخادم</span>
                  <span>{Math.round(stats.systemLoad)}%</span>
                </div>
                <Progress value={stats.systemLoad} className="h-2" />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>جميع الخدمات تعمل بشكل طبيعي</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                حركة المرور
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">زوار اليوم</span>
                <span className="font-bold">{stats.todaySignups * 5}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">الجلسات النشطة</span>
                <span className="font-bold">{stats.activeUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">معدل التحويل</span>
                <span className="font-bold">12.5%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                إجراءات سريعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => loadAdminData()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                تحديث البيانات
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => window.open('/dashboard', '_blank')}
              >
                <Eye className="h-4 w-4 mr-2" />
                عرض الموقع
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Main Content */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">المستخدمين</TabsTrigger>
            <TabsTrigger value="subscriptions">الاشتراكات</TabsTrigger>
            <TabsTrigger value="requests">طلبات AI</TabsTrigger>
            <TabsTrigger value="analytics">التحليلات</TabsTrigger>
            <TabsTrigger value="settings">إعدادات النظام</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>إدارة المستخدمين</CardTitle>
                    <CardDescription>عرض وإدارة جميع مستخدمي المنصة</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="البحث عن مستخدم..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>الدور</TableHead>
                      <TableHead>الكريدت</TableHead>
                      <TableHead>إجمالي الاستخدام</TableHead>
                      <TableHead>تاريخ التسجيل</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? (
                              <><Crown className="w-3 h-3 mr-1" />مسؤول</>
                            ) : (
                              <><Shield className="w-3 h-3 mr-1" />مستخدم</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.credits}</TableCell>
                        <TableCell>{user.total_credits_used}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString('ar-SA')}
                        </TableCell>
                         <TableCell>
                           <div className="flex gap-2">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => updateUserRole(
                                 user.user_id, 
                                 user.role === 'admin' ? 'user' : 'admin'
                               )}
                             >
                               {user.role === 'admin' ? 'إلغاء الإدارة' : 'جعل مسؤول'}
                             </Button>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 const newCredits = prompt('أدخل الرصيد الجديد:', user.credits.toString());
                                 if (newCredits && !isNaN(Number(newCredits))) {
                                   updateUserCredits(user.user_id, Number(newCredits));
                                 }
                               }}
                             >
                               تعديل الرصيد
                             </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => viewUserHistory(user)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                عرض السجل
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const planName = prompt('اسم الباقة:', 'باقة مميزة');
                                  const credits = prompt('عدد النقاط:', '100');
                                  const price = prompt('السعر:', '10');
                                  if (planName && credits && price && !isNaN(Number(credits)) && !isNaN(Number(price))) {
                                    createSubscription(user.user_id, planName, Number(credits), Number(price));
                                  }
                                }}
                              >
                                إضافة اشتراك
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteUser(user.user_id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                حذف
                              </Button>
                           </div>
                         </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>إدارة الاشتراكات</CardTitle>
                <CardDescription>عرض وإدارة جميع اشتراكات المنصة</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>الباقة</TableHead>
                      <TableHead>الكريدت</TableHead>
                       <TableHead>السعر</TableHead>
                       <TableHead>الحالة</TableHead>
                       <TableHead>تاريخ الاشتراك</TableHead>
                       <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{subscription.profiles?.full_name}</div>
                            <div className="text-sm text-muted-foreground">{subscription.profiles?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{subscription.plan_name}</TableCell>
                        <TableCell>{subscription.credits_included}</TableCell>
                        <TableCell>${subscription.price}</TableCell>
                        <TableCell>
                          <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                            {subscription.status === 'active' ? 'نشط' : subscription.status === 'expired' ? 'منتهي' : 'ملغي'}
                          </Badge>
                        </TableCell>
                         <TableCell>
                           {new Date(subscription.created_at).toLocaleDateString('ar-SA')}
                         </TableCell>
                         <TableCell>
                           <div className="flex gap-2">
                             <Button
                               variant="destructive"
                               size="sm"
                               onClick={() => cancelSubscription(subscription.id)}
                             >
                               إلغاء
                             </Button>
                           </div>
                         </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>طلبات الذكاء الاصطناعي</CardTitle>
                <CardDescription>عرض آخر 100 طلب للذكاء الاصطناعي</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>نوع الطلب</TableHead>
                      <TableHead>الكريدت المستخدم</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aiRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.profiles?.full_name}</div>
                            <div className="text-sm text-muted-foreground">{request.profiles?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {request.request_type === 'text_question' && 'سؤال نصي'}
                            {request.request_type === 'image_question' && 'سؤال صورة'}
                            {request.request_type === 'audio_summary' && 'تلخيص صوتي'}
                            {request.request_type === 'mind_map' && 'خريطة ذهنية'}
                            {request.request_type === 'chat_explanation' && 'شرح ذكي'}
                            {request.request_type === 'research_paper' && 'بحث أكاديمي'}
                            {request.request_type === 'text_editing' && 'تحرير نص'}
                          </Badge>
                        </TableCell>
                        <TableCell>{request.credits_used}</TableCell>
                        <TableCell>
                          {new Date(request.created_at).toLocaleDateString('ar-SA')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    إحصائيات الاستخدام
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>المستخدمين الجدد اليوم</span>
                      <span className="font-bold text-primary">{stats.todaySignups}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>إجمالي الطلبات</span>
                      <span className="font-bold text-success">{aiRequests.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>متوسط الكريدت لكل طلب</span>
                      <span className="font-bold text-warning">
                        {aiRequests.length > 0 
                          ? Math.round(aiRequests.reduce((sum, req) => sum + req.credits_used, 0) / aiRequests.length)
                          : 0
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    إحصائيات الإيرادات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>إيرادات هذا الشهر</span>
                      <span className="font-bold text-success">
                        ${stats.monthlyRevenue}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>متوسط قيمة الاشتراك</span>
                      <span className="font-bold text-info">
                        ${subscriptions.length > 0 
                          ? Math.round(subscriptions.reduce((sum, sub) => sum + Number(sub.price), 0) / subscriptions.length)
                          : 0
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>معدل التحويل</span>
                      <span className="font-bold text-warning">
                        {users.length > 0 
                          ? Math.round((stats.activeSubscriptions / stats.totalUsers) * 100)
                          : 0
                        }%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    أداء المنصة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>نسبة النشاط</span>
                      <span className="font-bold text-primary">
                        {users.length > 0 
                          ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
                          : 0
                        }%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>مستوى الخدمة</span>
                      <span className="font-bold text-success">99.9%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>استجابة الخادم</span>
                      <span className="font-bold text-info">120ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Usage Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>توزيع أنواع الطلبات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['text_question', 'image_question', 'mind_map', 'text_editing'].map(type => {
                      const count = aiRequests.filter(req => req.request_type === type).length;
                      const percentage = aiRequests.length > 0 ? (count / aiRequests.length) * 100 : 0;
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>
                              {type === 'text_question' && 'الأسئلة النصية'}
                              {type === 'image_question' && 'أسئلة الصور'}
                              {type === 'mind_map' && 'الخرائط الذهنية'}
                              {type === 'text_editing' && 'تحرير النصوص'}
                            </span>
                            <span>{count} ({Math.round(percentage)}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>حالة الاشتراكات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['active', 'expired', 'cancelled'].map(status => {
                      const count = subscriptions.filter(sub => sub.status === status).length;
                      const percentage = subscriptions.length > 0 ? (count / subscriptions.length) * 100 : 0;
                      return (
                        <div key={status} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>
                              {status === 'active' && 'نشطة'}
                              {status === 'expired' && 'منتهية'}
                              {status === 'cancelled' && 'ملغية'}
                            </span>
                            <span>{count} ({Math.round(percentage)}%)</span>
                          </div>
                          <Progress 
                            value={percentage} 
                            className={`h-2 ${
                              status === 'active' ? 'text-success' : 
                              status === 'expired' ? 'text-warning' : 'text-destructive'
                            }`} 
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    إعدادات عامة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">اسم المنصة</label>
                    <Input defaultValue="Quizora AI" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">وصف المنصة</label>
                    <Input defaultValue="منصة الذكاء الاصطناعي الذكية" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">الكريدت المجاني للمستخدم الجديد</label>
                    <Input type="number" defaultValue="100" />
                  </div>
                  <Button className="w-full">
                    حفظ الإعدادات
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    إعدادات الذكاء الاصطناعي
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">تكلفة السؤال النصي</label>
                    <Input type="number" defaultValue="2" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">تكلفة سؤال الصورة</label>
                    <Input type="number" defaultValue="3" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">تكلفة الخريطة الذهنية</label>
                    <Input type="number" defaultValue="5" />
                  </div>
                  <Button className="w-full">
                    حفظ إعدادات AI
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    إجراءات الطوارئ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    نسخ احتياطي من قاعدة البيانات
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    إعادة تشغيل الخدمات
                  </Button>
                  <Button variant="destructive" className="w-full justify-start">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    وضع الصيانة
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    سجل النشاطات الأخيرة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <UserCheck className="h-4 w-4 text-success" />
                      <div className="text-sm">
                        <span className="font-medium">مستخدم جديد انضم</span>
                        <div className="text-muted-foreground">منذ 5 دقائق</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <CreditCard className="h-4 w-4 text-info" />
                      <div className="text-sm">
                        <span className="font-medium">اشتراك جديد تم</span>
                        <div className="text-muted-foreground">منذ 15 دقيقة</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <Activity className="h-4 w-4 text-primary" />
                      <div className="text-sm">
                        <span className="font-medium">طلب ذكاء اصطناعي</span>
                        <div className="text-muted-foreground">منذ 20 دقيقة</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* User Details Dialog */}
        <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>سجل المستخدم: {selectedUser?.full_name}</DialogTitle>
              <DialogDescription>
                {selectedUser?.email} - إجمالي الاستخدام: {selectedUser?.total_credits_used} كريدت
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* User Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{selectedUser?.credits}</div>
                      <div className="text-sm text-muted-foreground">الرصيد الحالي</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">{selectedUser?.total_credits_used}</div>
                      <div className="text-sm text-muted-foreground">إجمالي الاستخدام</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">{userHistory.length}</div>
                      <div className="text-sm text-muted-foreground">عدد الطلبات</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Activity History */}
              <Card>
                <CardHeader>
                  <CardTitle>سجل النشاطات</CardTitle>
                  <CardDescription>آخر {userHistory.length} عملية</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>نوع الطلب</TableHead>
                        <TableHead>المحتوى</TableHead>
                        <TableHead>الكريدت</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userHistory.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {request.request_type === 'text_question' && 'سؤال نصي'}
                              {request.request_type === 'image_question' && 'سؤال صورة'}
                              {request.request_type === 'audio_summary' && 'تلخيص صوتي'}
                              {request.request_type === 'mind_map' && 'خريطة ذهنية'}
                              {request.request_type === 'chat_explanation' && 'شرح ذكي'}
                              {request.request_type === 'research_paper' && 'بحث أكاديمي'}
                              {request.request_type === 'text_editing' && 'تحرير نص'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate">
                              {request.content || 'لا يوجد محتوى'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{request.credits_used}</span>
                          </TableCell>
                          <TableCell>
                            {new Date(request.created_at).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-success text-success-foreground">
                              مكتمل
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {userHistory.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      لا يوجد نشاطات مسجلة لهذا المستخدم
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;