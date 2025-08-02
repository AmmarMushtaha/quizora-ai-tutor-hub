-- Add RLS policy to allow admins to insert subscriptions
CREATE POLICY "Admins can insert subscriptions" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (check_user_role(auth.uid(), 'admin'::user_role));