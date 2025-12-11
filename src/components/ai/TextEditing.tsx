import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AIResponse from './AIResponse';

const TextEditing = () => {
  const [originalText, setOriginalText] = useState('');
  const [editedText, setEditedText] = useState('');
  const [editType, setEditType] = useState('');
  const [loading, setLoading] = useState(false);
  

  const editTypes = [
    { value: 'grammar', label: 'تصحيح القواعد والإملاء' },
    { value: 'style', label: 'تحسين الأسلوب' },
    { value: 'clarity', label: 'توضيح المعنى' },
    { value: 'formal', label: 'تحويل إلى أسلوب رسمي' },
    { value: 'simple', label: 'تبسيط اللغة' },
    { value: 'academic', label: 'تحويل إلى أسلوب أكاديمي' },
    { value: 'creative', label: 'تحسين الإبداعية' },
    { value: 'summary', label: 'تلخيص النص' },
  ];

  const handleSubmit = async () => {
    if (!originalText.trim() || !editType) {
      toast.error('يرجى إدخال النص واختيار نوع التحرير');
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
      const wordCount = originalText.split(/\s+/).length;
      const { data: deductResult, error: deductError } = await supabase
        .rpc('deduct_credits', {
          user_uuid: user.id,
          amount: 8
        });

      if (deductError || !deductResult) {
        toast.error('رصيدك غير كافي أو حدث خطأ في خصم النقاط');
        return;
      }

      const selectedEditType = editTypes.find(type => type.value === editType);
      const editPrompt = `قم بتحرير النص التالي وتطبيق "${selectedEditType?.label}":

النص الأصلي:
"${originalText}"

يرجى تقديم النص المُحرر والمُحسن مع شرح التحسينات المطبقة.`;

      // استدعاء Gemini API
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('gemini-text', {
        body: { 
          prompt: editPrompt,
          type: 'text_editing'
        }
      });

      if (aiError) {
        console.error('AI Error:', aiError);
        toast.error('حدث خطأ في تحرير النص');
        return;
      }

      if (aiResponse.error) {
        toast.error(aiResponse.error);
        return;
      }

      setEditedText(aiResponse.response);
      
      // تسجيل الطلب في قاعدة البيانات
      await supabase.from('ai_requests').insert({
        user_id: user.id,
        request_type: 'text_editing',
        prompt: originalText,
        response: aiResponse.response,
        credits_used: 8
      });
      
      toast.success('تم تحرير النص بنجاح');
    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ أثناء تحرير النص');
    } finally {
      setLoading(false);
    }
  };


  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gradient">
          <Edit className="w-5 h-5" />
          تحرير وتحسين النصوص
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="أدخل النص الذي تريد تحريره وتحسينه..."
          value={originalText}
          onChange={(e) => setOriginalText(e.target.value)}
          className="min-h-[120px] resize-none"
          disabled={loading}
        />
        
        <Select value={editType} onValueChange={setEditType} disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder="اختر نوع التحرير المطلوب" />
          </SelectTrigger>
          <SelectContent>
            {editTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button 
          onClick={handleSubmit} 
          disabled={loading || !originalText.trim() || !editType}
          className="btn-glow w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
              جاري تحرير النص...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 ml-2" />
              تحرير النص (8 نقاط)
            </>
          )}
        </Button>

        <AIResponse
          response={editedText}
          model="Gemini 2.0 Flash"
          type="editing"
          isLoading={loading}
          originalQuery={originalText}
        />
      </CardContent>
    </Card>
  );
};

export default TextEditing;