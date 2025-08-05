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
      ? "bg-sidebar-accent text-sidebar-primary font-medium border-r-2 border-sidebar-primary" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground";

  // تحديد إذا كان المستخدم مشترك
  const isSubscriber = profile?.credits > 100;
  const hasActiveSubscription = profile?.subscription_status === 'active';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const getCreditsStatus = () => {
    if (!profile?.credits) return { color: "text-destructive", bg: "bg-destructive/10", status: "منتهي" };
    if (profile.credits < 20) return { color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950", status: "منخفض" };
    if (profile.credits < 100) return { color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950", status: "محدود" };
    return { color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950", status: "جيد" };
  };

  const creditsStatus = getCreditsStatus();

  return (
    <Sidebar
      side="left"
      className={`${collapsed ? "w-14 md:w-16" : "w-60 md:w-64"} transition-all duration-300 bg-sidebar border-l border-sidebar-border`}
    >
      <SidebarContent className="p-3 md:p-4">
        {/* شعار التطبيق */}
        <div className={`flex items-center gap-3 mb-6 md:mb-8 ${collapsed ? 'justify-center' : ''}`}>
          <div className="relative">
            <Brain className="w-7 h-7 md:w-8 md:h-8 text-sidebar-primary animate-pulse" />
            <div className="absolute inset-0 w-7 h-7 md:w-8 md:h-8 bg-sidebar-primary/20 rounded-full animate-ping"></div>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-sidebar-primary to-primary bg-clip-text text-transparent">
                كويزورا
              </h1>
              <p className="text-xs text-sidebar-foreground/70">منصة الذكاء الاصطناعي</p>
            </div>
          )}
        </div>

        {/* معلومات المستخدم المحسنة */}
        {!collapsed && profile && (
          <div className={`mb-4 md:mb-6 p-3 md:p-4 rounded-lg md:rounded-xl border transition-all duration-300 ${
            isSubscriber 
              ? 'bg-gradient-to-br from-sidebar-primary/5 via-primary/5 to-sidebar-primary/5 border-sidebar-primary/20 shadow-md' 
              : 'bg-sidebar-accent/50 border-sidebar-border'
          }`}>
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                isSubscriber 
                  ? 'bg-gradient-to-br from-sidebar-primary to-primary' 
                  : 'bg-sidebar-accent'
              }`}>
                {isSubscriber ? (
                  <Crown className="w-4 h-4 md:w-5 md:h-5 text-white" />
                ) : (
                  <User className="w-4 h-4 md:w-5 md:h-5 text-sidebar-foreground/70" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm md:text-base font-medium truncate ${
                  isSubscriber ? 'text-sidebar-primary' : 'text-sidebar-foreground'
                }`}>
                  {profile.full_name || 'المستخدم'}
                </p>
                {isSubscriber && (
                  <Badge className="bg-gradient-to-r from-sidebar-primary to-primary text-white text-xs mt-1">
                    <Crown className="w-3 h-3 mr-1" />
                    مشترك مميز
                  </Badge>
                )}
              </div>
            </div>
            
            {/* عرض الكريدت المحسن */}
            <div className={`p-2 md:p-3 rounded-lg ${creditsStatus.bg} border border-current/20`}>
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <span className="text-xs md:text-sm font-medium text-sidebar-foreground">الرصيد الحالي</span>
                <Badge variant="outline" className={`${creditsStatus.color} border-current/30 text-xs`}>
                  {creditsStatus.status}
                </Badge>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <CreditCard className={`w-3 h-3 md:w-4 md:h-4 ${creditsStatus.color}`} />
                <span className={`font-bold text-base md:text-lg ${creditsStatus.color}`}>
                  {profile.credits || 0}
                </span>
                <span className="text-xs md:text-sm text-sidebar-foreground/70">نقطة</span>
              </div>
              
              {/* شريط التقدم */}
              <div className="mt-1 md:mt-2 w-full bg-sidebar-accent rounded-full h-1.5 md:h-2">
                <div 
                  className={`h-1.5 md:h-2 rounded-full transition-all duration-500 ${
                    isSubscriber 
                      ? 'bg-gradient-to-r from-sidebar-primary to-primary' 
                      : 'bg-current'
                  }`}
                  style={{ 
                    width: `${Math.min((profile.credits || 0) / 1000 * 100, 100)}%` 
                  }}
                ></div>
              </div>
              
              {/* تنبيهات الرصيد */}
              {profile.credits < 20 && (
                <div className="mt-1 md:mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <Zap className="w-3 h-3" />
                  <span className="hidden sm:inline">رصيد منخفض - قم بإعادة الشحن</span>
                  <span className="sm:hidden">رصيد منخفض</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* القائمة الرئيسية */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs md:text-sm font-medium text-sidebar-foreground/70 mb-2">
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
                        flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg transition-all duration-200 text-sm md:text-base
                        ${getNavCls({ isActive })}
                        ${collapsed ? 'justify-center' : ''}
                      `}
                    >
                      <item.icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
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
          <div className="mt-4 md:mt-6 space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start gap-2 text-xs md:text-sm hover:bg-sidebar-primary/10 hover:text-sidebar-primary hover:border-sidebar-primary/30"
              onClick={onRefreshCredits}
            >
              <Gift className="w-3 h-3 md:w-4 md:h-4" />
              تحديث الرصيد
            </Button>
          </div>
        )}

        {/* زر تسجيل الخروج */}
        <div className={`mt-auto pt-3 md:pt-4 ${collapsed ? 'flex justify-center' : ''}`}>
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            className={`${
              collapsed 
                ? 'w-8 h-8 md:w-10 md:h-10' 
                : 'w-full justify-start gap-2 text-xs md:text-sm'
            } text-destructive hover:bg-destructive/10 hover:text-destructive`}
            onClick={handleSignOut}
          >
            <LogOut className="w-3 h-3 md:w-4 md:h-4" />
            {!collapsed && <span>تسجيل الخروج</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}