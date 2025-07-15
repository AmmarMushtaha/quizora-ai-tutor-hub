import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image, Upload, Send, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ImageQuestion = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!image || !question.trim()) {
      toast.error('يرجى إرفاق صورة وإدخال سؤالك');
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
          p_credits_to_deduct: 15,
          p_request_type: 'image_question',
          p_content: question,
          p_word_count: question.split(' ').length
        });

      if (deductError || !deductResult) {
        toast.error('رصيدك غير كافي أو حدث خطأ في خصم النقاط');
        return;
      }

      // تحويل الصورة إلى base64
      const base64Image = imagePreview;

      // استدعاء Gemini Vision API
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('gemini-vision', {
        body: { 
          prompt: question,
          image: base64Image,
          mimeType: image.type || 'image/jpeg'
        }
      });

      if (aiError) {
        console.error('AI Error:', aiError);
        toast.error('حدث خطأ في تحليل الصورة');
        return;
      }

      if (aiResponse.error) {
        toast.error(aiResponse.error);
        return;
      }

      setAnswer(aiResponse.response);
      
      // تحديث قاعدة البيانات بالاستجابة
      await supabase
        .rpc('deduct_credits', {
          p_user_id: user.id,
          p_credits_to_deduct: 0,
          p_request_type: 'image_question',
          p_content: question,
          p_response: aiResponse.response,
          p_word_count: question.split(' ').length
        });
      
      toast.success('تم تحليل الصورة والحصول على الإجابة بنجاح');
    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ أثناء تحليل الصورة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gradient">
          <Image className="w-5 h-5" />
          سؤال مع صورة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Image Upload */}
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          {imagePreview ? (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-w-full max-h-48 mx-auto rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2"
                onClick={removeImage}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div 
              className="cursor-pointer hover:bg-secondary/50 transition-colors rounded-lg p-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground mb-1">اضغط لرفع صورة</p>
              <p className="text-sm text-muted-foreground">أو اسحب الصورة هنا</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        <Textarea
          placeholder="اطرح سؤالك حول الصورة..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="min-h-[100px] resize-none"
          disabled={loading}
        />
        
        <Button 
          onClick={handleSubmit} 
          disabled={loading || !image || !question.trim()}
          className="btn-glow w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
              جاري تحليل الصورة...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 ml-2" />
              تحليل الصورة (15 نقطة)
            </>
          )}
        </Button>

        {answer && (
          <div className="mt-6 p-4 bg-secondary/50 rounded-lg border">
            <h3 className="font-semibold mb-2 text-primary">التحليل:</h3>
            <p className="leading-relaxed whitespace-pre-wrap">{answer}</p>
            <div className="mt-2 text-xs text-muted-foreground">
              مدعوم بـ Gemini 2.0 Flash Vision
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageQuestion;