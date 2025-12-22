import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, type = 'text_question' } = await req.json();
    
    if (!prompt) {
      throw new Error('الرجاء إدخال نص السؤال');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // إعداد السياق حسب نوع الطلب
    let systemPrompt = '';
    switch (type) {
      case 'text_question':
        systemPrompt = 'أنت مساعد ذكي يجيب على الأسئلة باللغة العربية بشكل مفصل ومفيد. قدم إجابات دقيقة وشاملة.';
        break;
      case 'text_editing':
        systemPrompt = 'أنت خبير في تحرير النصوص العربية. ساعد في تحسين النص وتصحيح الأخطاء النحوية والإملائية.';
        break;
      case 'research_paper':
        systemPrompt = 'أنت خبير أكاديمي. ساعد في كتابة بحث أكاديمي متكامل باللغة العربية مع المراجع والهيكل المناسب.';
        break;
      default:
        systemPrompt = 'أنت مساعد ذكي باللغة العربية. قدم إجابات مفيدة ودقيقة.';
    }

    console.log('Calling Lovable AI Gateway...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI Error:', response.status, errorText);
      
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
      throw new Error('حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي');
    }

    const data = await response.json();
    console.log('Lovable AI Response received');
    
    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error('لم يتم الحصول على إجابة من الذكاء الاصطناعي');
    }

    return new Response(
      JSON.stringify({ 
        response: generatedText,
        model: 'Gemini 2.5 Flash'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in gemini-text function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'حدث خطأ غير متوقع'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
