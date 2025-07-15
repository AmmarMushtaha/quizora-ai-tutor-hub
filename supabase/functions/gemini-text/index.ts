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

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('مفتاح Gemini API غير موجود');
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nالسؤال: ${prompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API Error:', errorData);
      throw new Error('حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي');
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('لم يتم الحصول على إجابة من الذكاء الاصطناعي');
    }

    const generatedText = data.candidates[0].content.parts[0].text;

    return new Response(
      JSON.stringify({ 
        response: generatedText,
        model: 'Gemini 2.0 Flash'
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