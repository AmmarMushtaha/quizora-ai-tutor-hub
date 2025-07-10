import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, User, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkSession();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "تم إنشاء الحساب بنجاح!",
        description: "يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.",
      });
    } catch (error: any) {
      setError(error.message === "User already registered" 
        ? "هذا البريد الإلكتروني مسجل مسبقاً" 
        : error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate("/dashboard");
    } catch (error: any) {
      setError(error.message === "Invalid login credentials" 
        ? "بيانات الدخول غير صحيحة" 
        : error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="md" />
          <h1 className="text-2xl font-bold text-foreground mt-4">مرحباً بك في Quizora</h1>
          <p className="text-muted-foreground mt-2">منصة التعلم الذكي بالذكاء الاصطناعي</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-center">تسجيل الدخول إلى حسابك</CardTitle>
            <CardDescription className="text-center">
              استخدم بياناتك للوصول إلى جميع الميزات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="signup">إنشاء حساب</TabsTrigger>
              </TabsList>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="البريد الإلكتروني"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pr-10"
                        required
                        dir="ltr"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="كلمة المرور"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                        required
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full btn-glow" disabled={loading}>
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    تسجيل الدخول
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="الاسم الكامل"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pr-10"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="البريد الإلكتروني"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pr-10"
                        required
                        dir="ltr"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="كلمة المرور (8 أحرف على الأقل)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                        required
                        minLength={8}
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full btn-glow" disabled={loading}>
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    إنشاء حساب جديد
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    بإنشاء حساب، ستحصل على تجربة مجانية لمدة أسبوع مع 100 كريدت مجاني!
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground">
            العودة للصفحة الرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;