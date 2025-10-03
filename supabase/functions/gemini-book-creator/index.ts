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

// Retry function for API calls
const retryApiCall = async (apiCall: () => Promise<Response>, maxRetries = 3, delayMs = 2000): Promise<Response> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await apiCall();
      
      // If successful, return immediately
      if (response.ok) {
        return response;
      }
      
      // Check if it's a retryable error
      const responseClone = response.clone();
      try {
        const data = await responseClone.json();
        
        // Don't retry for authentication/permission errors
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          return response;
        }
      } catch (e) {
        // If we can't parse the response, still retry for 5xx errors
      }
      
      // Retry for server errors (5xx) and rate limits (429, 503)
      if (attempt === maxRetries) {
        return response;
      }
      
      console.log(`API call attempt ${attempt} failed (status: ${response.status}), retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`API call attempt ${attempt} failed with error: ${error.message}, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw new Error('Max retries exceeded');
};

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
${language === 'arabic' ? `
أنت كاتب محترف متخصص في إنشاء الكتب باللغة العربية. أريدك أن تنشئ فهرساً احترافياً ومنظماً لكتاب.

معلومات الكتاب:
- العنوان: ${bookTitle}
- الموضوع: ${topic}
- عدد الصفحات المطلوب: ${pageCount}
- المؤلف: ${authorName}

اكتب فهرساً مفصلاً وشاملاً للكتاب باللغة العربية يغطي الموضوع بشكل كامل ومنطقي.

قم بإنشاء ${Math.ceil(pageCount / 3)} فصول رئيسية موزعة على ${pageCount} صفحة بحيث:
- الفصل الأول يبدأ من الصفحة 1
- كل فصل يأخذ حوالي 2-4 صفحات حسب عدد الصفحات الإجمالي
- الفصل الأخير ينتهي في الصفحة ${pageCount}

أعطني النتيجة في هذا التنسيق JSON بالضبط:
{
  "tableOfContents": [
    {
      "page": 1,
      "title": "مقدمة الكتاب"
    },
    {
      "page": 3,
      "title": "الفصل الأول: [عنوان الفصل]"
    }
  ]
}

تأكد من أن:
- جميع العناوين باللغة العربية
- العناوين مناسبة ومعبرة عن محتوى الفصل
- التوزيع دقيق على ${pageCount} صفحة تماماً
- الترتيب منطقي ومتدرج من البسيط للمعقد
` : `
You are a professional writer specializing in creating books in English. Create a professional and organized table of contents for a book.

Book Information:
- Title: ${bookTitle}
- Topic: ${topic}
- Required Pages: ${pageCount}
- Author: ${authorName}

Write a detailed and comprehensive table of contents in English that covers the topic completely and logically.

Create ${Math.ceil(pageCount / 3)} main chapters distributed across ${pageCount} pages where:
- First chapter starts at page 1
- Each chapter takes about 2-4 pages based on total page count
- Last chapter ends at page ${pageCount}

Provide the result in this exact JSON format:
{
  "tableOfContents": [
    {
      "page": 1,
      "title": "Introduction"
    },
    {
      "page": 3,
      "title": "Chapter 1: [Chapter Title]"
    }
  ]
}

Make sure that:
- All titles are in English
- Titles are appropriate and expressive of chapter content
- Distribution is exact across ${pageCount} pages
- Logical order from simple to complex
`}
`;
    } else if (action === 'generate_page') {
      // Generate content for a specific chapter
      prompt = `
${language === 'arabic' ? `
أنت كاتب محترف متخصص في كتابة المحتوى التعليمي والثقافي باللغة العربية.

معلومات الكتاب:
- عنوان الكتاب: ${bookTitle}
- الموضوع العام: ${topic}
- عنوان الفصل: ${chapterTitle}
- رقم الفصل: ${chapterNumber} من ${totalChapters}
- المؤلف: ${authorName}

اكتب محتوى شاملاً ومفصلاً لهذا الفصل باللغة العربية الفصحى. يجب أن يكون المحتوى:
1. احترافياً ومنظماً بأسلوب أكاديمي
2. مفصلاً وشاملاً (حوالي 1000-1500 كلمة عربية)
3. تعليمياً ومفيداً للقارئ العربي
4. متدرجاً من البسيط إلى المعقد
5. يحتوي على أمثلة عملية من البيئة العربية
6. مكتوباً بأسلوب جذاب وواضح باللغة العربية

تأكد من أن المحتوى:
- باللغة العربية الفصحى بدون أي كلمات إنجليزية
- يتناسب مع عنوان الفصل
- يربط بين المفاهيم والأفكار بأسلوب عربي
- يقدم قيمة حقيقية للقارئ العربي
- مكتوب بطريقة سهلة الفهم

اكتب المحتوى فقط باللغة العربية دون إضافة عناوين جانبية أو تنسيقات إضافية.
` : `
You are a professional writer specializing in educational and cultural content in English.

Book Information:
- Book Title: ${bookTitle}
- General Topic: ${topic}
- Chapter Title: ${chapterTitle}
- Chapter Number: ${chapterNumber} of ${totalChapters}
- Author: ${authorName}

Write comprehensive and detailed content for this chapter in English. The content should be:
1. Professional and organized in academic style
2. Detailed and comprehensive (about 1000-1500 English words)
3. Educational and useful for English readers
4. Progressive from simple to complex
5. Contains practical examples from English context
6. Written in engaging and clear English style

Make sure the content:
- Is in clear English without any Arabic words
- Matches the chapter title
- Connects concepts and ideas in English style
- Provides real value for English readers
- Written in an easy-to-understand manner

Write only the content in English without additional headings or formatting.
`}
`;
    }

    console.log(`Making API call for action: ${action}`);
    
    const response = await retryApiCall(() => 
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
      ),
      3, // max retries
      3000 // delay between retries (3 seconds)
    );

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API Error:', data);
      
      // Handle specific error cases
      if (data.error?.code === 503 || data.error?.message?.includes('overloaded')) {
        return new Response(JSON.stringify({ 
          error: language === 'arabic' ? 
            'الخدمة مشغولة حالياً، يرجى المحاولة مرة أخرى خلال دقائق قليلة' :
            'Service is currently busy, please try again in a few minutes',
          code: 'SERVICE_OVERLOADED',
          retryable: true
        }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Handle quota exceeded
      if (data.error?.code === 429 || data.error?.message?.includes('quota')) {
        return new Response(JSON.stringify({ 
          error: language === 'arabic' ? 
            'تم تجاوز الحد المسموح للاستخدام، يرجى المحاولة لاحقاً' :
            'Usage quota exceeded, please try again later',
          code: 'QUOTA_EXCEEDED',
          retryable: true
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
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
            model: 'gemini-2.5-flash'
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
        const chaptersCount = Math.max(3, Math.ceil(pageCount / 3));
        const pagesPerChapter = Math.ceil(pageCount / chaptersCount);
        
        for (let i = 0; i < chaptersCount; i++) {
          const pageNum = Math.min(i * pagesPerChapter + 1, pageCount);
          fallbackToc.push({
            page: pageNum,
            title: language === 'arabic' ? 
              `الفصل ${i + 1}: ${topic} - الجزء ${i + 1}` :
              `Chapter ${i + 1}: ${topic} - Part ${i + 1}`
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
      // Return content for page
      return new Response(JSON.stringify({
        content: generatedText.trim(),
        model: 'gemini-2.5-flash'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in gemini-book-creator function:', error);
    
    // Determine language from request for error messages
    let errorLanguage = 'english';
    try {
      const body = await req.json();
      errorLanguage = body.language || 'english';
    } catch {}
    
    return new Response(JSON.stringify({ 
      error: errorLanguage === 'arabic' ? 
        'حدث خطأ أثناء إنشاء الكتاب، يرجى المحاولة مرة أخرى' :
        'An error occurred while generating the book, please try again',
      details: error.message,
      code: 'GENERATION_ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});