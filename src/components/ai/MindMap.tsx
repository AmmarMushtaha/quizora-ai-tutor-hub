import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, Send, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
          p_credits_to_deduct: 10,
          p_request_type: 'mind_map',
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

  const downloadMindMap = () => {
    if (!mindMap) return;
    
    const element = document.createElement('a');
    const file = new Blob([mindMap], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `mind-map-${topic.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('تم تحميل الخريطة الذهنية');
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
              إنشاء الخريطة الذهنية (10 نقاط)
            </>
          )}
        </Button>

        {mindMap && (
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-primary">الخريطة الذهنية:</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadMindMap}
              >
                <Download className="w-4 h-4 ml-2" />
                تحميل
              </Button>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg border font-mono text-sm whitespace-pre-line">
              {mindMap}
            </div>
            <div className="text-xs text-muted-foreground">
              مدعوم بـ Gemini 2.0 Flash
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MindMap;