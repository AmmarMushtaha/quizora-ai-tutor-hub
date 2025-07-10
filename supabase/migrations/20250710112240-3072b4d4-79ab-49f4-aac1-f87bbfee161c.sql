-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled');

-- Create AI request types enum
CREATE TYPE public.ai_request_type AS ENUM (
  'text_question', 
  'image_question', 
  'audio_summary', 
  'mind_map', 
  'chat_explanation', 
  'research_paper', 
  'text_editing'
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  credits INTEGER NOT NULL DEFAULT 0,
  total_credits_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_name TEXT NOT NULL,
  credits_included INTEGER NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI requests table
CREATE TABLE public.ai_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  request_type ai_request_type NOT NULL,
  content TEXT,
  image_url TEXT,
  audio_url TEXT,
  response TEXT,
  credits_used INTEGER NOT NULL,
  duration_minutes INTEGER, -- for audio summaries
  pages_count INTEGER, -- for research papers
  word_count INTEGER, -- for text editing
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation history table
CREATE TABLE public.conversation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  total_credits_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_history ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create policies for AI requests
CREATE POLICY "Users can view their own AI requests" 
ON public.ai_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI requests" 
ON public.ai_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all AI requests" 
ON public.ai_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create policies for conversation history
CREATE POLICY "Users can manage their own conversations" 
ON public.conversation_history 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations" 
ON public.conversation_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversation_history_updated_at
BEFORE UPDATE ON public.conversation_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Give free trial credits (100 credits for 1 week trial)
  INSERT INTO public.subscriptions (
    user_id, 
    plan_name, 
    credits_included, 
    price, 
    end_date
  )
  VALUES (
    NEW.id,
    'تجربة مجانية',
    100,
    0.00,
    now() + interval '7 days'
  );
  
  -- Add the trial credits to user's profile
  UPDATE public.profiles 
  SET credits = 100 
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to deduct credits
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_credits_to_deduct INTEGER,
  p_request_type ai_request_type,
  p_content TEXT DEFAULT NULL,
  p_response TEXT DEFAULT NULL,
  p_duration_minutes INTEGER DEFAULT NULL,
  p_pages_count INTEGER DEFAULT NULL,
  p_word_count INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT credits INTO current_credits 
  FROM public.profiles 
  WHERE user_id = p_user_id;
  
  -- Check if user has enough credits
  IF current_credits < p_credits_to_deduct THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits
  UPDATE public.profiles 
  SET 
    credits = credits - p_credits_to_deduct,
    total_credits_used = total_credits_used + p_credits_to_deduct
  WHERE user_id = p_user_id;
  
  -- Log the AI request
  INSERT INTO public.ai_requests (
    user_id,
    request_type,
    content,
    response,
    credits_used,
    duration_minutes,
    pages_count,
    word_count
  )
  VALUES (
    p_user_id,
    p_request_type,
    p_content,
    p_response,
    p_credits_to_deduct,
    p_duration_minutes,
    p_pages_count,
    p_word_count
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;