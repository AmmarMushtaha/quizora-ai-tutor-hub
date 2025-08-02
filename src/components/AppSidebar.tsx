import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Brain, 
  Home, 
  CreditCard, 
  History, 
  User, 
  Settings, 
  LogOut,
  Crown,
  Zap,
  Star,
  Gift
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AppSidebarProps {
  profile?: any;
  onRefreshCredits?: () => void;
}

const menuItems = [
  { title: "لوحة التحكم", url: "/dashboard", icon: Home },
  { title: "الملف الشخصي", url: "/profile", icon: User },
  { title: "السجل", url: "/history", icon: History },
  { title: "الإعدادات", url: "/settings", icon: Settings },
];

export function AppSidebar({ profile, onRefreshCredits }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const isExpanded = menuItems.some((i) => isActive(i.url));
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  // تحديد إذا كان المستخدم مشترك
  const isSubscriber = profile?.credits > 100; // يمكن تعديل هذا الشرط حسب منطق الاشتراك
  const hasActiveSubscription = profile?.subscription_status === 'active'; // مثال آخر

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const getCreditsStatus = () => {
    if (!profile?.credits) return { color: "text-destructive", bg: "bg-destructive/10", status: "منتهي" };
    if (profile.credits < 20) return { color: "text-orange-500", bg: "bg-orange-500/10", status: "منخفض" };
    if (profile.credits < 100) return { color: "text-yellow-500", bg: "bg-yellow-500/10", status: "محدود" };
    return { color: "text-green-500", bg: "bg-green-500/10", status: "جيد" };
  };

  const creditsStatus = getCreditsStatus();

  return (
    <Sidebar
      className={`${collapsed ? "w-14" : "w-60"} transition-all duration-300 border-r bg-card/50 backdrop-blur-sm`}
    >
      <SidebarContent className="p-4">
        {/* شعار التطبيق */}
        <div className={`flex items-center gap-3 mb-8 ${collapsed ? 'justify-center' : ''}`}>
          <div className="relative">
            <Brain className="w-8 h-8 text-primary animate-pulse" />
            <div className="absolute inset-0 w-8 h-8 bg-primary/20 rounded-full animate-ping"></div>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                كويزورا
              </h1>
              <p className="text-xs text-muted-foreground">منصة الذكاء الاصطناعي</p>
            </div>
          )}
        </div>

        {/* معلومات المستخدم المحسنة */}
        {!collapsed && profile && (
          <div className={`mb-6 p-4 rounded-xl border transition-all duration-300 ${
            isSubscriber 
              ? 'bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border-primary/20 shadow-lg shadow-primary/10' 
              : 'bg-muted/50 border-border/50'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isSubscriber 
                  ? 'bg-gradient-to-br from-primary to-accent' 
                  : 'bg-muted'
              }`}>
                {isSubscriber ? (
                  <Crown className="w-5 h-5 text-white" />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${
                  isSubscriber ? 'text-primary' : 'text-foreground'
                }`}>
                  {profile.full_name || 'المستخدم'}
                </p>
                {isSubscriber && (
                  <Badge className="bg-gradient-to-r from-primary to-accent text-white text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    مشترك مميز
                  </Badge>
                )}
              </div>
            </div>
            
            {/* عرض الكريدت المحسن */}
            <div className={`p-3 rounded-lg ${creditsStatus.bg} border border-current/20`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">الرصيد الحالي</span>
                <Badge variant="outline" className={`${creditsStatus.color} border-current/30 text-xs`}>
                  {creditsStatus.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className={`w-4 h-4 ${creditsStatus.color}`} />
                <span className={`font-bold text-lg ${creditsStatus.color}`}>
                  {profile.credits || 0}
                </span>
                <span className="text-sm text-muted-foreground">نقطة</span>
              </div>
              
              {/* شريط التقدم */}
              <div className="mt-2 w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    isSubscriber 
                      ? 'bg-gradient-to-r from-primary to-accent' 
                      : 'bg-current'
                  }`}
                  style={{ 
                    width: `${Math.min((profile.credits || 0) / 1000 * 100, 100)}%` 
                  }}
                ></div>
              </div>
              
              {/* تنبيهات الرصيد */}
              {profile.credits < 20 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                  <Zap className="w-3 h-3" />
                  <span>رصيد منخفض - قم بإعادة الشحن</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* القائمة الرئيسية */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-medium text-muted-foreground mb-2">
            {!collapsed && "القائمة الرئيسية"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
                        ${getNavCls({ isActive })}
                        ${collapsed ? 'justify-center' : ''}
                      `}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* أزرار سريعة */}
        {!collapsed && (
          <div className="mt-6 space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
              onClick={onRefreshCredits}
            >
              <Gift className="w-4 h-4" />
              تحديث الرصيد
            </Button>
          </div>
        )}

        {/* زر تسجيل الخروج */}
        <div className={`mt-auto pt-4 ${collapsed ? 'flex justify-center' : ''}`}>
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            className={`${
              collapsed 
                ? 'w-10 h-10' 
                : 'w-full justify-start gap-2'
            } text-destructive hover:bg-destructive/10 hover:text-destructive`}
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>تسجيل الخروج</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}