import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AIResponse from './AIResponse';

const MindMap = () => {
  const [topic, setTopic] = useState('');
  const [mindMap, setMindMap] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!topic.trim()) {
      toast.error('يرجى إدخال الموضوع');
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
          p_user_id: user.id,
          p_credits_to_deduct: 25,
          p_request_type: 'research_paper',
          p_content: topic,
          p_word_count: topic.split(' ').length
        });

      if (deductError || !deductResult) {
        toast.error('رصيدك غير كافي أو حدث خطأ في خصم النقاط');
        return;
      }

      // استدعاء Gemini API لإنشاء الخريطة الذهنية
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('gemini-mindmap', {
        body: { 
          topic: topic
        }
      });

      if (aiError) {
        console.error('AI Error:', aiError);
        toast.error('حدث خطأ في إنشاء الخريطة الذهنية');
        return;
      }

      if (aiResponse.error) {
        toast.error(aiResponse.error);
        return;
      }

      // عرض الاستجابة الخام من Gemini
      const displayText = aiResponse.rawResponse || JSON.stringify(aiResponse.mindmap, null, 2);
      setMindMap(displayText);
      
      // تحديث قاعدة البيانات بالاستجابة
      await supabase
        .rpc('deduct_credits', {
          p_user_id: user.id,
          p_credits_to_deduct: 0,
          p_request_type: 'mind_map',
          p_content: topic,
          p_response: displayText,
          p_word_count: topic.split(' ').length
        });
      
      toast.success('تم إنشاء الخريطة الذهنية بنجاح');
    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ أثناء إنشاء الخريطة الذهنية');
    } finally {
      setLoading(false);
    }
  };


  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gradient">
          <Network className="w-5 h-5" />
          إنشاء خريطة ذهنية
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="أدخل الموضوع الذي تريد إنشاء خريطة ذهنية له..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="min-h-[100px] resize-none"
          disabled={loading}
        />
        
        <Button 
          onClick={handleSubmit} 
          disabled={loading || !topic.trim()}
          className="btn-glow w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
              جاري إنشاء الخريطة الذهنية...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 ml-2" />
              إنشاء الخريطة الذهنية (25 نقطة)
            </>
          )}
        </Button>

        <AIResponse
          response={mindMap}
          model="Gemini 2.0 Flash"
          type="mindmap"
          isLoading={loading}
          originalQuery={topic}
        />
      </CardContent>
    </Card>
  );
};

export default MindMap;