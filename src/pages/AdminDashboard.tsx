import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Activity
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
  profiles: { full_name: string; email: string } | null;
}

interface Stats {
  totalUsers: number;
  totalRevenue: number;
  totalCreditsUsed: number;
  activeSubscriptions: number;
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [aiRequests, setAIRequests] = useState<AIRequest[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalRevenue: 0,
    totalCreditsUsed: 0,
    activeSubscriptions: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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

      // Calculate stats
      if (usersData && subscriptionsData && requestsData) {
        setStats({
          totalUsers: usersData.length,
          totalRevenue: subscriptionsData
            .filter(sub => sub.status === 'active')
            .reduce((sum, sub) => sum + Number(sub.price), 0),
          totalCreditsUsed: usersData.reduce((sum, user) => sum + user.total_credits_used, 0),
          activeSubscriptions: subscriptionsData.filter(sub => sub.status === 'active').length
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الكريدت المستخدم</CardTitle>
              <Activity className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCreditsUsed}</div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الاشتراكات النشطة</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">المستخدمين</TabsTrigger>
            <TabsTrigger value="subscriptions">الاشتراكات</TabsTrigger>
            <TabsTrigger value="requests">طلبات الذكاء الاصطناعي</TabsTrigger>
            <TabsTrigger value="analytics">التحليلات</TabsTrigger>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>إحصائيات الاستخدام</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>المستخدمين الجدد اليوم</span>
                      <span className="font-bold">
                        {users.filter(u => new Date(u.created_at).toDateString() === new Date().toDateString()).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>إجمالي الطلبات</span>
                      <span className="font-bold">{aiRequests.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>متوسط الكريدت لكل طلب</span>
                      <span className="font-bold">
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
                  <CardTitle>إحصائيات الإيرادات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>إيرادات هذا الشهر</span>
                      <span className="font-bold">
                        ${subscriptions
                          .filter(sub => 
                            new Date(sub.created_at).getMonth() === new Date().getMonth() &&
                            new Date(sub.created_at).getFullYear() === new Date().getFullYear()
                          )
                          .reduce((sum, sub) => sum + Number(sub.price), 0)
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>متوسط قيمة الاشتراك</span>
                      <span className="font-bold">
                        ${subscriptions.length > 0 
                          ? Math.round(subscriptions.reduce((sum, sub) => sum + Number(sub.price), 0) / subscriptions.length)
                          : 0
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>معدل التحويل</span>
                      <span className="font-bold">
                        {users.length > 0 
                          ? Math.round((stats.activeSubscriptions / stats.totalUsers) * 100)
                          : 0
                        }%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;