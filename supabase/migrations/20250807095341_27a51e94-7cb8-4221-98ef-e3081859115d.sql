-- Create conversation_history table for chat sessions
CREATE TABLE IF NOT EXISTS public.conversation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant')),
  content TEXT NOT NULL,
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.conversation_history ENABLE ROW LEVEL SECURITY;

-- Create policies for conversation_history
CREATE POLICY "Users can view their own conversations" 
ON public.conversation_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" 
ON public.conversation_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_conversation_history_user_session 
ON public.conversation_history(user_id, session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_conversation_history_session 
ON public.conversation_history(session_id, created_at);