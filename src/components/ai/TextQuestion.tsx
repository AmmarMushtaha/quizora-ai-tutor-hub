import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
      // Simulate AI response for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockAnswer = `هذا مثال على إجابة للسؤال: "${question}". يمكنني مساعدتك في فهم هذا الموضوع بشكل أفضل من خلال تقديم معلومات مفصلة ومفيدة.`;
      
      setAnswer(mockAnswer);
      
      // Deduct credits
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc('deduct_credits', {
          p_user_id: user.id,
          p_credits_to_deduct: 5,
          p_request_type: 'text_question',
          p_content: question,
          p_response: mockAnswer,
          p_word_count: question.split(' ').length
        });
      }
      
      toast.success('تم الحصول على الإجابة بنجاح');
    } catch (error) {
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

        {answer && (
          <div className="mt-6 p-4 bg-secondary/50 rounded-lg border">
            <h3 className="font-semibold mb-2 text-primary">الإجابة:</h3>
            <p className="leading-relaxed">{answer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TextQuestion;