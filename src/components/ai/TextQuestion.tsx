import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AIResponse from './AIResponse';

const TextQuestion = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim()) {
      toast.error('يرجى إدخال سؤالك');
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
          amount: 5
        });

      if (deductError || !deductResult) {
        toast.error('رصيدك غير كافي أو حدث خطأ في خصم النقاط');
        return;
      }

      // استدعاء Gemini API
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('gemini-text', {
        body: { 
          prompt: question,
          type: 'text_question'
        }
      });

      if (aiError) {
        console.error('AI Error:', aiError);
        toast.error('حدث خطأ في الحصول على الإجابة');
        return;
      }

      if (aiResponse.error) {
        toast.error(aiResponse.error);
        return;
      }

      setAnswer(aiResponse.response);
      
      // تسجيل الطلب في قاعدة البيانات
      await supabase.from('ai_requests').insert({
        user_id: user.id,
        request_type: 'text_question',
        prompt: question,
        response: aiResponse.response,
        credits_used: 5
      });

      toast.success('تم الحصول على الإجابة بنجاح');
    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ أثناء معالجة السؤال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gradient">
          <MessageSquare className="w-5 h-5" />
          طرح سؤال نصي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="اطرح سؤالك هنا..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="min-h-[100px] resize-none"
          disabled={loading}
        />
        
        <Button 
          onClick={handleSubmit} 
          disabled={loading || !question.trim()}
          className="btn-glow w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
              جاري المعالجة...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 ml-2" />
              إرسال السؤال (5 نقاط)
            </>
          )}
        </Button>

        <AIResponse
          response={answer}
          model="Gemini 2.0 Flash"
          type="text"
          isLoading={loading}
          originalQuery={question}
        />
      </CardContent>
    </Card>
  );
};

export default TextQuestion;