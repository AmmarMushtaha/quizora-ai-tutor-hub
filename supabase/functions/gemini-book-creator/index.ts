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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, bookTitle, topic, pageCount, language, authorName, chapterTitle, chapterNumber, totalChapters } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';
    
    if (action === 'generate_toc') {
      systemPrompt = language === 'arabic' 
        ? `أنت كاتب عربي محترف. مهمتك إنشاء فهرس كتاب منظم ومرتب. يجب أن تكتب بالعربية الفصحى فقط. لا تستخدم أي كلمات إنجليزية. ستعطيني النتيجة بتنسيق JSON فقط.`
        : `You are a professional English book writer. Your task is to create an organized book table of contents. Write in clear English only. Return result in JSON format only.`;

      userPrompt = language === 'arabic' 
        ? `أنشئ فهرساً لكتاب بالمعلومات التالية:
- عنوان الكتاب: ${bookTitle}
- الموضوع: ${topic}
- عدد الفصول: ${Math.ceil(pageCount / 3)} فصل
- المؤلف: ${authorName}

أعطني النتيجة بتنسيق JSON التالي فقط بدون أي نص إضافي:
{
  "tableOfContents": [
    {"page": 1, "title": "المقدمة"},
    {"page": 3, "title": "الفصل الأول: [عنوان مناسب]"},
    {"page": 6, "title": "الفصل الثاني: [عنوان مناسب]"}
  ]
}

تأكد أن كل العناوين باللغة العربية فقط ومناسبة للموضوع.`
        : `Create a table of contents for a book with:
- Book Title: ${bookTitle}
- Topic: ${topic}
- Number of chapters: ${Math.ceil(pageCount / 3)} chapters
- Author: ${authorName}

Return result in this JSON format only without any additional text:
{
  "tableOfContents": [
    {"page": 1, "title": "Introduction"},
    {"page": 3, "title": "Chapter 1: [appropriate title]"},
    {"page": 6, "title": "Chapter 2: [appropriate title]"}
  ]
}

Make sure all titles are in English only and relevant to the topic.`;

    } else if (action === 'generate_page') {
      systemPrompt = language === 'arabic'
        ? `أنت كاتب محترف متخصص في الكتابة التعليمية باللغة العربية الفصحى. اكتب محتوى تعليمي عالي الجودة ومنسق بشكل جميل. استخدم اللغة العربية الفصحى فقط. لا تستخدم أي كلمات إنجليزية. اكتب بأسلوب واضح وجذاب.`
        : `You are a professional educational content writer. Write high-quality, beautifully formatted educational content in clear English. Use engaging and clear writing style.`;

      userPrompt = language === 'arabic'
        ? `اكتب محتوى الفصل التالي من كتاب "${bookTitle}":

عنوان الفصل: ${chapterTitle}
رقم الفصل: ${chapterNumber} من ${totalChapters}
الموضوع العام: ${topic}

اكتب محتوى تعليمي شامل ومفصل (1000-1500 كلمة) باللغة العربية الفصحى فقط.

**قواعد التنسيق المهمة:**
- استخدم **نص عريض** للعناوين الفرعية والنقاط المهمة
- استخدم القوائم النقطية (-) لتنظيم المعلومات
- استخدم الأرقام (1. 2. 3.) للخطوات المتسلسلة
- اترك مسافة بين الفقرات
- اجعل الفقرات متوسطة الطول (3-5 جمل)

اجعل المحتوى:
- منظماً ومتسلسلاً مع فقرات واضحة
- غنياً بالمعلومات المفيدة
- يحتوي على أمثلة عملية
- سهل القراءة والفهم
- مُنسقاً بشكل جميل وواضح`
        : `Write content for the following chapter from the book "${bookTitle}":

Chapter Title: ${chapterTitle}
Chapter Number: ${chapterNumber} of ${totalChapters}
General Topic: ${topic}

Write comprehensive educational content (1000-1500 words) in clear English.

**Important Formatting Rules:**
- Use **bold text** for subheadings and important points
- Use bullet points (-) to organize information
- Use numbers (1. 2. 3.) for sequential steps
- Leave space between paragraphs
- Keep paragraphs medium length (3-5 sentences)

Make the content:
- Organized and sequential with clear paragraphs
- Rich with useful information
- Contains practical examples
- Easy to read and understand
- Beautifully formatted and clear`;

    } else if (action === 'generate_image') {
      // Generate illustration for a chapter - NO TEXT IN IMAGES
      const imagePrompt = `Create a beautiful, professional illustration for a book chapter about "${chapterTitle}" in a book titled "${bookTitle}". 

CRITICAL REQUIREMENTS:
- DO NOT include ANY text, letters, words, numbers, or typography in the image
- NO labels, NO captions, NO watermarks, NO titles
- ONLY visual elements, icons, and graphics
- Clean, modern flat design style with vibrant colors
- Professional and educational aesthetic
- Suitable for a digital book illustration
- Abstract or symbolic representation of the concept
- High quality, visually appealing artwork`;

      console.log('Generating image for chapter:', chapterTitle);

      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image',
          messages: [
            { role: 'user', content: imagePrompt }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error('Image generation error:', imageResponse.status, errorText);
        return new Response(JSON.stringify({ 
          imageUrl: null,
          error: 'Failed to generate image'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const imageData = await imageResponse.json();
      const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      return new Response(JSON.stringify({ 
        imageUrl: imageUrl || null,
        model: 'gemini-2.5-flash-image'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Calling Lovable AI for action: ${action}`);
    
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
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI Error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: language === 'arabic' ? 'تم تجاوز الحد المسموح، يرجى المحاولة لاحقاً' : 'Rate limit exceeded, please try again later',
          code: 'RATE_LIMIT',
          retryable: true
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: language === 'arabic' ? 'يرجى إضافة رصيد للحساب' : 'Please add credits to your account',
          code: 'PAYMENT_REQUIRED',
          retryable: false
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || '';
    
    if (!generatedText) {
      throw new Error('No text generated');
    }

    console.log('Lovable AI response received for:', action);

    if (action === 'generate_toc') {
      try {
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonData = JSON.parse(jsonMatch[0]);
          return new Response(JSON.stringify({
            tableOfContents: jsonData.tableOfContents,
            model: 'gemini-2.5-flash'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          throw new Error('Could not parse JSON from response');
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        // Fallback TOC
        const fallbackToc: TableOfContentsItem[] = [];
        const chaptersCount = Math.max(3, Math.ceil(pageCount / 3));
        const pagesPerChapter = Math.ceil(pageCount / chaptersCount);
        
        for (let i = 0; i < chaptersCount; i++) {
          const pageNum = Math.min(i * pagesPerChapter + 1, pageCount);
          fallbackToc.push({
            page: pageNum,
            title: language === 'arabic' 
              ? `الفصل ${i + 1}: ${topic} - الجزء ${i + 1}` 
              : `Chapter ${i + 1}: ${topic} - Part ${i + 1}`
          });
        }
        
        return new Response(JSON.stringify({
          tableOfContents: fallbackToc,
          model: 'gemini-2.5-flash'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      return new Response(JSON.stringify({
        content: generatedText.trim(),
        model: 'gemini-2.5-flash'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in gemini-book-creator function:', error);
    
    return new Response(JSON.stringify({ 
      error: 'حدث خطأ أثناء إنشاء الكتاب، يرجى المحاولة مرة أخرى',
      details: error.message,
      code: 'GENERATION_ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
