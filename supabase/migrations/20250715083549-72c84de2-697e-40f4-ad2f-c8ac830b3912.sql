-- إصلاح مشكلة infinite recursion في policies لجدول profiles
-- إنشاء دالة آمنة للتحقق من دور المستخدم
CREATE OR REPLACE FUNCTION public.check_user_role(user_id_param uuid, required_role user_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = user_id_param AND role = required_role
  );
$$;

-- حذف policies القديمة المعطلة
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- إنشاء policies جديدة آمنة
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.check_user_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- إصلاح policies لجدول ai_requests
DROP POLICY IF EXISTS "Admins can view all AI requests" ON public.ai_requests;

CREATE POLICY "Admins can view all AI requests" 
ON public.ai_requests 
FOR SELECT 
USING (public.check_user_role(auth.uid(), 'admin'::user_role));

-- إصلاح policies لجدول conversation_history
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversation_history;

CREATE POLICY "Admins can view all conversations" 
ON public.conversation_history 
FOR SELECT 
USING (public.check_user_role(auth.uid(), 'admin'::user_role));

-- إصلاح policies لجدول subscriptions
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;

CREATE POLICY "Admins can view all subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (public.check_user_role(auth.uid(), 'admin'::user_role));

-- إضافة policy لتحديث الملف الشخصي للمسؤولين
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (public.check_user_role(auth.uid(), 'admin'::user_role));