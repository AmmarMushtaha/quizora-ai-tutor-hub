-- Add database indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_credits ON public.profiles(credits);
CREATE INDEX IF NOT EXISTS idx_ai_requests_user_id ON public.ai_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_requests_created_at ON public.ai_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON public.subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_conversation_history_user_id ON public.conversation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_history_created_at ON public.conversation_history(created_at DESC);