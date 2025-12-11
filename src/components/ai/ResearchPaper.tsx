import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AIResponse from './AIResponse';

const ResearchPaper = () => {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [requirements, setRequirements] = useState('');
  const [paper, setPaper] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !topic.trim()) {
      toast.error('يرجى إدخال العنوان والموضوع');
      return;
    }

    setLoading(true);
    try {
      // الحصول على المستخدم الحالي
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return;
      }

      // خصم النقاط أولاً
      const { data: deductResult, error: deductError } = await supabase
        .rpc('deduct_credits', {
          user_uuid: user.id,
          amount: 50
        });

      if (deductError || !deductResult) {
        toast.error('رصيدك غير كافي أو حدث خطأ في خصم النقاط');
        return;
      }

      // إنشاء البحث بالذكاء الاصطناعي
      const researchPrompt = `اكتب بحثاً أكاديمياً متكاملاً باللغة العربية بالمواصفات التالية:

العنوان: ${title}
الموضوع: ${topic}
${requirements ? `متطلبات إضافية: ${requirements}` : ''}

يجب أن يحتوي البحث على:
- مقدمة شاملة
- أهداف واضحة
- منهجية البحث
- إطار نظري متكامل
- تحليل ومناقشة
- نتائج وتوصيات
- خلاصة
- قائمة مراجع

يجب أن يكون البحث أكاديمياً ومتقناً ومنسقاً بشكل احترافي.`;

      // استدعاء Gemini API
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('gemini-text', {
        body: { 
          prompt: researchPrompt,
          type: 'research_paper'
        }
      });

      if (aiError) {
        console.error('AI Error:', aiError);
        toast.error('حدث خطأ في إنشاء البحث');
        return;
      }

      if (aiResponse.error) {
        toast.error(aiResponse.error);
        return;
      }

      setPaper(aiResponse.response);
      
      // تسجيل الطلب في قاعدة البيانات
      await supabase.from('ai_requests').insert({
        user_id: user.id,
        request_type: 'research_paper',
        prompt: `${title} - ${topic}`,
        response: aiResponse.response,
        credits_used: 50
      });
      
      toast.success('تم إنشاء البحث الأكاديمي بنجاح');
    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ أثناء إنشاء البحث');
    } finally {
      setLoading(false);
    }
  };


  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gradient">
          <BookOpen className="w-5 h-5" />
          كتابة بحث أكاديمي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="عنوان البحث..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
        />
        
        <Textarea
          placeholder="موضوع البحث والتفاصيل..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="min-h-[100px] resize-none"
          disabled={loading}
        />
        
        <Textarea
          placeholder="متطلبات خاصة أو تفاصيل إضافية (اختياري)..."
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          className="min-h-[80px] resize-none"
          disabled={loading}
        />
        
        <Button 
          onClick={handleSubmit} 
          disabled={loading || !title.trim() || !topic.trim()}
          className="btn-glow w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
              جاري كتابة البحث...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 ml-2" />
              إنشاء البحث الأكاديمي (50 نقطة)
            </>
          )}
        </Button>

        <AIResponse
          response={paper}
          model="Gemini 2.0 Flash"
          type="research"
          isLoading={loading}
          originalQuery={`${title} - ${topic}`}
        />
      </CardContent>
    </Card>
  );
};

export default ResearchPaper;