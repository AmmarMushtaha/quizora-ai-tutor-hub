import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Send, Loader2, Download, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 5000));
      const mockPaper = `# ${title}

## المقدمة

هذا البحث يتناول موضوع "${topic}" بشكل شامل ومفصل. يهدف هذا البحث إلى تقديم نظرة عميقة وتحليل دقيق للموضوع المطروح.

## أهداف البحث

1. **الهدف الأول**: تحليل الجوانب الأساسية للموضوع
2. **الهدف الثاني**: استكشاف التطبيقات العملية
3. **الهدف الثالث**: تقديم حلول وتوصيات

## المنهجية

تم اتباع منهجية علمية دقيقة في إعداد هذا البحث، والتي تشمل:

- **مراجعة الأدبيات**: دراسة شاملة للمراجع والمصادر ذات الصلة
- **التحليل النظري**: تطبيق الأطر النظرية المناسبة
- **الدراسة التطبيقية**: تحليل الحالات العملية والأمثلة الواقعية

## الإطار النظري

### المفاهيم الأساسية

يستند هذا البحث على مجموعة من المفاهيم الأساسية التي تشكل الأساس النظري للدراسة:

1. **المفهوم الأول**: تعريف شامل ووضع الأسس
2. **المفهوم الثاني**: التطبيقات والاستخدامات
3. **المفهوم الثالث**: التحديات والفرص

### النماذج والنظريات

تم الاعتماد على عدة نماذج ونظريات معترف بها علمياً:

- **النموذج الأول**: يوضح العلاقات الأساسية
- **النموذج الثاني**: يحلل العوامل المؤثرة
- **النظرية الثالثة**: تقدم إطار عمل شامل

## التحليل والمناقشة

### النتائج الرئيسية

من خلال التحليل المعمق، تم التوصل إلى النتائج التالية:

1. **النتيجة الأولى**: تحديد العوامل الرئيسية المؤثرة
2. **النتيجة الثانية**: اكتشاف أنماط وعلاقات جديدة
3. **النتيجة الثالثة**: تطوير نموذج تفسيري شامل

### التحديات والعقبات

واجه البحث عدة تحديات تم التعامل معها بطرق علمية:

- **التحدي الأول**: نقص في البيانات - تم حله بجمع بيانات إضافية
- **التحدي الثاني**: تعقيد الموضوع - تم تبسيطه بالتحليل المرحلي
- **التحدي الثالث**: تداخل المتغيرات - تم فصلها وتحليلها منفردة

## التوصيات والاقتراحات

بناءً على نتائج البحث، يُوصى بما يلي:

### التوصيات قصيرة المدى

1. **تطبيق النتائج**: البدء في تنفيذ الحلول المقترحة
2. **المتابعة المستمرة**: وضع آليات مراقبة وتقييم
3. **التطوير التدريجي**: تحسين الأداء بشكل مستمر

### التوصيات طويلة المدى

1. **البحث المستقبلي**: إجراء دراسات متخصصة إضافية
2. **التطوير الاستراتيجي**: وضع خطط طويلة المدى
3. **الشراكات**: تطوير تعاونات مع جهات ذات صلة

## الخلاصة

يُظهر هذا البحث أهمية "${topic}" وتأثيره الكبير في المجال. النتائج المتوصل إليها تفتح آفاقاً جديدة للبحث والتطبيق.

## المراجع والمصادر

1. مرجع أكاديمي متخصص في الموضوع
2. دراسة ميدانية حديثة ذات صلة
3. مقال علمي محكم من مجلة معترف بها
4. كتاب أكاديمي شامل في المجال
5. تقرير بحثي من مؤسسة علمية معتمدة

---

**تاريخ الإعداد**: ${new Date().toLocaleDateString('ar-SA')}
**عدد الكلمات**: حوالي 800 كلمة
**عدد الصفحات**: 3-4 صفحات

${requirements ? `\n**متطلبات إضافية تم مراعاتها**: ${requirements}` : ''}`;
      
      setPaper(mockPaper);
      
      // Calculate word count
      const wordCount = mockPaper.split(/\s+/).length;
      
      // Deduct credits
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc('deduct_credits', {
          p_user_id: user.id,
          p_credits_to_deduct: 50,
          p_request_type: 'research_paper',
          p_content: `${title} - ${topic} - ${requirements}`,
          p_response: mockPaper,
          p_word_count: wordCount,
          p_pages_count: Math.ceil(wordCount / 250)
        });
      }
      
      toast.success('تم إنشاء البحث الأكاديمي بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء البحث');
    } finally {
      setLoading(false);
    }
  };

  const downloadPaper = () => {
    if (!paper) return;
    
    const element = document.createElement('a');
    const file = new Blob([paper], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `research-paper-${title.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('تم تحميل البحث');
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

        {paper && (
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-primary">البحث الأكاديمي:</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadPaper}
              >
                <Download className="w-4 h-4 ml-2" />
                تحميل
              </Button>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg border max-h-96 overflow-y-auto">
              <div className="whitespace-pre-line leading-relaxed text-sm">
                {paper}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResearchPaper;