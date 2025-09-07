import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TableOfContentsItem {
  page: number;
  title: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, bookTitle, topic, pageCount, language, authorName, chapterTitle, chapterNumber, totalChapters } = await req.json();
    
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    let prompt = '';
    
    if (action === 'generate_toc') {
      // Generate table of contents
      prompt = `
أنت كاتب محترف متخصص في إنشاء الكتب. أريدك أن تنشئ فهرساً احترافياً ومنظماً لكتاب.

معلومات الكتاب:
- العنوان: ${bookTitle}
- الموضوع: ${topic}
- عدد الصفحات المطلوب: ${pageCount}
- المؤلف: ${authorName}
- اللغة: ${language === 'arabic' ? 'العربية' : 'الإنجليزية'}

اكتب فهرساً مفصلاً وشاملاً للكتاب يغطي الموضوع بشكل كامل ومنطقي. يجب أن يحتوي الفهرس على:
1. مقدمة
2. فصول رئيسية تغطي جميع جوانب الموضوع
3. خاتمة
4. مراجع (إذا لزم الأمر)

قم بتوزيع الفصول على ${pageCount} صفحة بشكل متوازن ومنطقي.

أعطني النتيجة في هذا التنسيق JSON بالضبط:
{
  "tableOfContents": [
    {
      "page": 1,
      "title": "عنوان الفصل الأول"
    },
    {
      "page": 3,
      "title": "عنوان الفصل الثاني"
    }
  ]
}

تأكد من أن:
- العناوين مناسبة ومعبرة عن محتوى الفصل
- التوزيع متوازن على عدد الصفحات المحدد
- الترتيب منطقي ومتدرج
- يغطي جميع جوانب الموضوع المطلوب
`;
    } else if (action === 'generate_page') {
      // Generate content for a specific chapter
      prompt = `
أنت كاتب محترف متخصص في كتابة المحتوى التعليمي والثقافي.

معلومات الكتاب:
- عنوان الكتاب: ${bookTitle}
- الموضوع العام: ${topic}
- عنوان الفصل: ${chapterTitle}
- رقم الفصل: ${chapterNumber} من ${totalChapters}
- المؤلف: ${authorName}
- اللغة: ${language === 'arabic' ? 'العربية' : 'الإنجليزية'}

اكتب محتوى شاملاً ومفصلاً لهذا الفصل. يجب أن يكون المحتوى:
1. احترافياً ومنظماً
2. مفصلاً وشاملاً (حوالي 800-1200 كلمة)
3. تعليمياً ومفيداً
4. متدرجاً من البسيط إلى المعقد
5. يحتوي على أمثلة عملية إذا كان ذلك مناسباً
6. مكتوباً بأسلوب جذاب وواضح

تأكد من أن المحتوى:
- يتناسب مع عنوان الفصل
- يربط بين المفاهيم والأفكار
- يقدم قيمة حقيقية للقارئ
- مكتوب بطريقة سهلة الفهم

اكتب المحتوى فقط دون إضافة عناوين جانبية أو تنسيقات إضافية.
`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API Error:', data);
      throw new Error(`Gemini API error: ${data.error?.message || 'Unknown error'}`);
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!generatedText) {
      throw new Error('No text generated from Gemini API');
    }

    if (action === 'generate_toc') {
      // Parse JSON response for table of contents
      try {
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonData = JSON.parse(jsonMatch[0]);
          return new Response(JSON.stringify({
            tableOfContents: jsonData.tableOfContents,
            model: 'gemini-1.5-flash'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          throw new Error('Could not parse JSON from response');
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        // Fallback: create a simple table of contents
        const fallbackToc: TableOfContentsItem[] = [];
        const chaptersCount = Math.max(3, Math.floor(pageCount / 5));
        const pagesPerChapter = Math.floor(pageCount / chaptersCount);
        
        for (let i = 0; i < chaptersCount; i++) {
          fallbackToc.push({
            page: i * pagesPerChapter + 1,
            title: `الفصل ${i + 1}: ${topic} - الجزء ${i + 1}`
          });
        }
        
        return new Response(JSON.stringify({
          tableOfContents: fallbackToc,
          model: 'gemini-1.5-flash'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Return content for page
      return new Response(JSON.stringify({
        content: generatedText.trim(),
        model: 'gemini-1.5-flash'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in gemini-book-creator function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'An error occurred while generating book content'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});