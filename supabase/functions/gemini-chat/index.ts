import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, sessionId, answerType = 'detailed' } = await req.json();
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('messages array is required');
    }

    console.log('Chat request:', { messagesCount: messages.length, sessionId, answerType });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header to identify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token or user not found');
    }

    console.log('User authenticated:', user.id);

    // Create system prompt based on answer type
    let systemPrompt = `أنت معلم ذكي ومساعد تعليمي متخصص. مهمتك هي مساعدة الطلاب في التعلم وفهم المفاهيم المختلفة.

خصائصك:
- تتحدث العربية بطلاقة
- تشرح المفاهيم بطريقة واضحة ومبسطة
- تقدم أمثلة عملية وتطبيقية
- تشجع على التفكير النقدي
- تتكيف مع مستوى الطالب
- تستخدم أساليب تعليمية متنوعة`;

    if (answerType === 'concise') {
      systemPrompt += `

نمط الإجابة: مختصر
- قدم إجابات مختصرة ومباشرة
- ركز على النقاط الأساسية فقط
- تجنب التفاصيل الزائدة
- استخدم نقاط أو قوائم عند الإمكان`;
    } else {
      systemPrompt += `

نمط الإجابة: مفصل مع شرح
- قدم شرحاً مفصلاً وشاملاً
- اشرح الأسباب والمفاهيم الأساسية
- قدم أمثلة متنوعة وتطبيقات عملية
- اربط المعلومات ببعضها البعض
- أضف نصائح إضافية مفيدة`;
    }

    // Format messages for Lovable AI (OpenAI-compatible format)
    const formattedMessages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    messages.forEach((msg: any) => {
      if (msg.type === 'user') {
        formattedMessages.push({ role: 'user', content: msg.content });
      } else if (msg.type === 'assistant') {
        formattedMessages.push({ role: 'assistant', content: msg.content });
      }
    });

    console.log('Sending to Lovable AI:', { messagesCount: formattedMessages.length });

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: formattedMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'تم تجاوز الحد المسموح، يرجى المحاولة لاحقاً' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'يرجى إضافة رصيد للحساب' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Lovable AI response received');

    const generatedResponse = data.choices?.[0]?.message?.content;

    if (!generatedResponse) {
      throw new Error('Invalid response from Lovable AI');
    }

    // Calculate credits based on response length
    const responseLength = generatedResponse.length;
    const calculatedCredits = Math.min(Math.max(Math.ceil(responseLength / 150), 1), 10);

    console.log('Response stats:', { 
      responseLength, 
      calculatedCredits,
      answerType 
    });

    // Save conversation to database
    const conversationData = [
      {
        user_id: user.id,
        session_id: sessionId,
        message_type: 'user',
        content: messages[messages.length - 1].content,
        credits_used: 0
      },
      {
        user_id: user.id, 
        session_id: sessionId,
        message_type: 'assistant',
        content: generatedResponse,
        credits_used: calculatedCredits
      }
    ];

    const { error: insertError } = await supabase
      .from('conversation_history')
      .insert(conversationData);

    if (insertError) {
      console.error('Database insert error:', insertError);
    }

    console.log('Chat response completed successfully');

    return new Response(
      JSON.stringify({ 
        response: generatedResponse,
        answerType,
        creditsUsed: calculatedCredits,
        responseLength
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in gemini-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: 'Failed to process chat request'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
