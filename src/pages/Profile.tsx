import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Calendar, 
  Coins, 
  Edit2, 
  Save, 
  ArrowLeft,
  Shield,
  Crown,
  Activity
} from "lucide-react";
import Logo from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  credits: number;
  total_credits_used: number;
  role: string;
  created_at: string;
}

interface Subscription {
  plan_name: string;
  end_date: string;
  status: string;
  credits_included: number;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
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
      setEditedName(profileData.full_name || "");

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
      console.error("Error loading profile:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: editedName })
        .eq("user_id", profile.user_id);

      if (error) throw error;

      setProfile({ ...profile, full_name: editedName });
      setEditing(false);
      
      toast({
        title: "تم التحديث",
        description: "تم تحديث الملف الشخصي بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحديث البيانات",
        variant: "destructive",
      });
    }
  };

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
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Logo size="sm" />
              <div>
                <h1 className="text-xl font-bold">الملف الشخصي</h1>
                <p className="text-sm text-muted-foreground">إدارة معلوماتك الشخصية</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="glass-card">
              <CardHeader className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {profile.full_name?.charAt(0) || profile.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{profile.full_name}</CardTitle>
                <CardDescription>{profile.email}</CardDescription>
                <div className="flex justify-center mt-2">
                  <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                    {profile.role === 'admin' ? (
                      <><Crown className="w-3 h-3 mr-1" />مسؤول</>
                    ) : (
                      <><Shield className="w-3 h-3 mr-1" />مستخدم</>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">الكريدت المتبقي</span>
                    </div>
                    <span className="font-bold text-lg">{profile.credits}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">إجمالي الاستخدام</span>
                    </div>
                    <span className="font-bold">{profile.total_credits_used}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">عضو منذ</span>
                    </div>
                    <span className="text-sm">{new Date(profile.created_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>المعلومات الشخصية</CardTitle>
                    <CardDescription>إدارة بياناتك الأساسية</CardDescription>
                  </div>
                  {!editing ? (
                    <Button variant="outline" onClick={() => setEditing(true)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      تعديل
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setEditing(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={handleSaveProfile}>
                        <Save className="w-4 h-4 mr-2" />
                        حفظ
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">الاسم الكامل</Label>
                    {editing ? (
                      <Input
                        id="fullName"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        placeholder="أدخل اسمك الكامل"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{profile.full_name || "غير محدد"}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.email}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Information */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>معلومات الاشتراك</CardTitle>
                <CardDescription>تفاصيل باقتك الحالية</CardDescription>
              </CardHeader>
              <CardContent>
                {subscription ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">الباقة الحالية</span>
                      <Badge variant="default">{subscription.plan_name}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">الكريدت في الباقة</span>
                      <span className="font-medium">{subscription.credits_included}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">حالة الاشتراك</span>
                      <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                        {subscription.status === 'active' ? 'نشط' : 'منتهي'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">ينتهي في</span>
                      <span className="font-medium">
                        {subscriptionDaysLeft > 0 
                          ? `${subscriptionDaysLeft} يوم`
                          : "منتهي"
                        }
                      </span>
                    </div>
                    <Separator />
                    <div className="flex gap-2">
                      <Button onClick={() => navigate("/pricing")} className="flex-1">
                        ترقية الاشتراك
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">لا يوجد اشتراك نشط</p>
                    <Button onClick={() => navigate("/pricing")}>
                      اختر باقة
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>إعدادات الحساب</CardTitle>
                <CardDescription>إجراءات الحساب والأمان</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" onClick={() => navigate("/history")}>
                    عرض سجل المحادثات
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/contact")}>
                    تواصل مع الدعم
                  </Button>
                </div>
                <Separator />
                <div className="flex justify-center">
                  <Button 
                    variant="destructive" 
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate("/");
                    }}
                  >
                    تسجيل الخروج
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;