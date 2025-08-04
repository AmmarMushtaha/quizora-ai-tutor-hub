import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseWithRetry } from '@/lib/supabase-with-retry';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  credits: number;
  total_credits_used: number;
  role: string;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;

      const { data: profileData, error: profileError } = await supabaseWithRetry
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('خطأ في جلب بيانات الملف الشخصي:', profileError);
        throw new Error('فشل في تحميل البيانات');
      }

      if (profileData) {
        return profileData;
      }

      // إنشاء ملف شخصي جديد إذا لم يوجد
      const { data: newProfile, error: createError } = await supabaseWithRetry
        .from('profiles')
        .insert({
          user_id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email || '',
          credits: 100 // رصيد ابتدائي
        })
        .select()
        .single();

      if (createError) {
        console.error('خطأ في إنشاء الملف الشخصي:', createError);
        throw new Error('فشل في إنشاء الملف الشخصي');
      }

      return newProfile;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error('المستخدم غير مسجل الدخول');

      const { data, error } = await supabaseWithRetry
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('خطأ في تحديث الملف الشخصي:', error);
        throw new Error('فشل في تحديث البيانات');
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', user?.id], data);
      toast.success('تم تحديث البيانات بنجاح');
    },
    onError: (error) => {
      toast.error('حدث خطأ في التحديث');
      console.error('Profile update error:', error);
    }
  });

  const refreshCredits = () => {
    queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
  };

  return {
    profile,
    isLoading,
    error,
    refetch,
    updateProfile: updateProfile.mutate,
    isUpdating: updateProfile.isPending,
    refreshCredits
  };
};