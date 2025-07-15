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
    const { topic } = await req.json();
    
    if (!topic) {
      throw new Error('الرجاء إدخال موضوع الخريطة الذهنية');
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('مفتاح Gemini API غير موجود');
    }

    const systemPrompt = `أنت خبير في إنشاء الخرائط الذهنية. قم بإنشاء خريطة ذهنية شاملة باللغة العربية للموضوع المعطى.
قدم الخريطة الذهنية بتنسيق JSON مع الهيكل التالي:
{
  "title": "العنوان الرئيسي",
  "branches": [
    {
      "title": "الفرع الأول",
      "color": "#color",
      "subbranches": [
        {
          "title": "الفرع الفرعي",
          "description": "وصف مختصر"
        }
      ]
    }
  ]
}

استخدم ألوان مختلفة لكل فرع رئيسي وقدم محتوى غني ومفيد.`;

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
              text: `${systemPrompt}\n\nالموضوع: ${topic}`
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API Error:', errorData);
      throw new Error('حدث خطأ في إنشاء الخريطة الذهنية');
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('لم يتم إنشاء الخريطة الذهنية');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    
    // محاولة استخراج JSON من الاستجابة
    let mindmapData;
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        mindmapData = JSON.parse(jsonMatch[0]);
      } else {
        // إنشاء خريطة ذهنية أساسية إذا لم يتم تحليل JSON
        mindmapData = {
          title: topic,
          branches: [
            {
              title: "المفاهيم الأساسية",
              color: "#3b82f6",
              subbranches: [
                { title: "تعريف", description: "تعريف الموضوع" },
                { title: "خصائص", description: "الخصائص الرئيسية" }
              ]
            }
          ]
        };
      }
    } catch (parseError) {
      // إنشاء خريطة ذهنية أساسية في حالة الخطأ
      mindmapData = {
        title: topic,
        branches: [
          {
            title: "المفاهيم الأساسية",
            color: "#3b82f6",
            subbranches: [
              { title: "تعريف", description: "تعريف الموضوع" },
              { title: "خصائص", description: "الخصائص الرئيسية" }
            ]
          }
        ]
      };
    }

    return new Response(
      JSON.stringify({ 
        mindmap: mindmapData,
        rawResponse: generatedText,
        model: 'Gemini 2.0 Flash'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in gemini-mindmap function:', error);
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