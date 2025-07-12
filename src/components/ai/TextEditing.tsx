import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Send, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const TextEditing = () => {
  const [originalText, setOriginalText] = useState('');
  const [editedText, setEditedText] = useState('');
  const [editType, setEditType] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const selectedEditType = editTypes.find(type => type.value === editType);
      const mockEditedText = `تم تطبيق "${selectedEditType?.label}" على النص التالي:

النص الأصلي:
"${originalText}"

النص المُحرر:
هذا نص محرر ومحسن بناءً على طلبك. تم تطبيق التعديلات اللازمة لتحسين الجودة والوضوح والأسلوب. النص الآن أكثر وضوحاً وسهولة في القراءة مع الحفاظ على المعنى الأصلي.

التحسينات المطبقة:
• تصحيح الأخطاء النحوية والإملائية
• تحسين تدفق الجمل
• استخدام مفردات أكثر دقة
• تنظيم أفضل للأفكار
• توضيح المعاني الغامضة

النص النهائي جاهز للاستخدام ويحقق الغرض المطلوب بفعالية أكبر.`;
      
      setEditedText(mockEditedText);
      
      // Calculate word count
      const wordCount = originalText.split(/\s+/).length;
      
      // Deduct credits
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc('deduct_credits', {
          p_user_id: user.id,
          p_credits_to_deduct: 8,
          p_request_type: 'text_editing',
          p_content: originalText,
          p_response: mockEditedText,
          p_word_count: wordCount
        });
      }
      
      toast.success('تم تحرير النص بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء تحرير النص');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!editedText) return;
    
    try {
      await navigator.clipboard.writeText(editedText);
      setCopied(true);
      toast.success('تم نسخ النص');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('فشل في نسخ النص');
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

        {editedText && (
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-primary">النص المُحرر:</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="w-4 h-4 ml-2 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 ml-2" />
                )}
                {copied ? 'تم النسخ' : 'نسخ'}
              </Button>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg border max-h-96 overflow-y-auto">
              <div className="whitespace-pre-line leading-relaxed">
                {editedText}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TextEditing;