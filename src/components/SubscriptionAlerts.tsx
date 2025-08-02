import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Zap, 
  CreditCard, 
  Crown, 
  TrendingDown, 
  Calendar,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubscriptionAlertsProps {
  profile?: any;
  onDismiss?: (alertType: string) => void;
}

export const SubscriptionAlerts = ({ profile, onDismiss }: SubscriptionAlertsProps) => {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleDismiss = (alertType: string) => {
    setDismissedAlerts(prev => [...prev, alertType]);
    onDismiss?.(alertType);
  };

  if (!profile) return null;

  const alerts = [];

  // تنبيه الرصيد المنخفض
  if (profile.credits <= 0 && !dismissedAlerts.includes('no-credits')) {
    alerts.push({
      id: 'no-credits',
      type: 'destructive',
      icon: AlertTriangle,
      title: 'نفد رصيدك!',
      description: 'لا يمكنك استخدام أي من الأدوات. قم بشراء باقة جديدة للمتابعة.',
      action: (
        <Button size="sm" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          <CreditCard className="w-4 h-4 mr-2" />
          شراء باقة الآن
        </Button>
      ),
      showProgress: false,
      critical: true
    });
  } else if (profile.credits < 20 && !dismissedAlerts.includes('low-credits')) {
    alerts.push({
      id: 'low-credits',
      type: 'warning',
      icon: Zap,
      title: 'رصيد منخفض',
      description: `لديك ${profile.credits} نقطة فقط. قم بإعادة شحن رصيدك لتجنب انقطاع الخدمة.`,
      action: (
        <Button size="sm" variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
          <CreditCard className="w-4 h-4 mr-2" />
          إعادة الشحن
        </Button>
      ),
      showProgress: true,
      progressValue: (profile.credits / 100) * 100,
      critical: false
    });
  }

  // تنبيه اقتراب انتهاء الاشتراك (إذا كان لدينا تاريخ انتهاء)
  if (profile.subscription_end && !dismissedAlerts.includes('subscription-expiring')) {
    const endDate = new Date(profile.subscription_end);
    const today = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 7 && daysLeft > 0) {
      alerts.push({
        id: 'subscription-expiring',
        type: 'warning',
        icon: Calendar,
        title: 'اشتراكك ينتهي قريباً',
        description: `سينتهي اشتراكك خلال ${daysLeft} أيام. جدد اشتراكك للاستمرار في الاستفادة من الميزات المتقدمة.`,
        action: (
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Crown className="w-4 h-4 mr-2" />
            تجديد الاشتراك
          </Button>
        ),
        showProgress: false,
        critical: false
      });
    }
  }

  // تنبيه الاستخدام المكثف
  if (profile.total_credits_used > 1000 && !dismissedAlerts.includes('heavy-usage')) {
    alerts.push({
      id: 'heavy-usage',
      type: 'info',
      icon: TrendingDown,
      title: 'استخدام مكثف',
      description: `لقد استخدمت ${profile.total_credits_used} نقطة هذا الشهر. فكر في الترقية لباقة أكبر.`,
      action: (
        <Button size="sm" variant="outline">
          <Crown className="w-4 h-4 mr-2" />
          ترقية الباقة
        </Button>
      ),
      showProgress: false,
      critical: false
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      {alerts.map((alert) => (
        <Alert 
          key={alert.id}
          className={`relative animate-fade-in ${
            alert.type === 'destructive' 
              ? 'border-destructive/50 bg-destructive/5' 
              : alert.type === 'warning'
              ? 'border-orange-500/50 bg-orange-500/5'
              : 'border-blue-500/50 bg-blue-500/5'
          } ${alert.critical ? 'ring-2 ring-destructive/20 animate-pulse' : ''}`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              alert.type === 'destructive' 
                ? 'bg-destructive/10' 
                : alert.type === 'warning'
                ? 'bg-orange-500/10'
                : 'bg-blue-500/10'
            }`}>
              <alert.icon className={`w-5 h-5 ${
                alert.type === 'destructive' 
                  ? 'text-destructive' 
                  : alert.type === 'warning'
                  ? 'text-orange-500'
                  : 'text-blue-500'
              }`} />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <AlertTitle className="flex items-center gap-2">
                  {alert.title}
                  {alert.critical && (
                    <Badge variant="destructive" className="text-xs animate-pulse">
                      عاجل
                    </Badge>
                  )}
                </AlertTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => handleDismiss(alert.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <AlertDescription className="text-sm text-muted-foreground">
                {alert.description}
              </AlertDescription>
              
              {alert.showProgress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>الرصيد المتبقي</span>
                    <span>{profile.credits} / 100 نقطة</span>
                  </div>
                  <Progress 
                    value={alert.progressValue} 
                    className={`h-2 ${
                      alert.progressValue < 20 ? 'bg-destructive/20' : 'bg-muted'
                    }`}
                  />
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                {alert.action}
                {!alert.critical && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDismiss(alert.id)}
                  >
                    تجاهل
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
};

export default SubscriptionAlerts;