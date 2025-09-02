import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import AITable from '@/components/ui/ai-table';
import { 
  Copy, 
  Check, 
  Download, 
  Share2, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Eye,
  Type,
  Palette,
  Maximize2,
  BookOpen,
  Languages,
  RotateCcw,
  MessageSquare,
  Table as TableIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface AIResponseProps {
  response: string;
  model: string;
  type: 'text' | 'image' | 'research' | 'editing' | 'mindmap';
  isLoading?: boolean;
  originalQuery?: string;
}

const AIResponse = ({ response, model, type, isLoading = false, originalQuery }: AIResponseProps) => {
  const [copied, setCopied] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState('normal');
  const [theme, setTheme] = useState('default');
  const [showActions, setShowActions] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);
  const textRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // تأثير Gemini - fade in مع وميض مؤقت
  useEffect(() => {
    if (!response || isLoading) {
      setIsVisible(false);
      setIsPulsing(true);
      return;
    }
    
    // إعادة تعيين الحالة
    setIsVisible(false);
    setIsPulsing(true);
    setShowActions(false);
    
    // إظهار النص مع fade-in
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    
    // إيقاف الوميض بعد ثانيتين
    const pulseTimer = setTimeout(() => {
      setIsPulsing(false);
      setShowActions(true);
    }, 2500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(pulseTimer);
    };
  }, [response, isLoading]);

  // دالة تحليل الجداول من النص
  const parseTablesFromText = (text: string) => {
    const lines = text.split('\n');
    const tables = [];
    let currentTable = null;
    let tableStartIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // البحث عن بداية جدول (خط يحتوي على عدة | أو فواصل)
      if (line.includes('|') && line.split('|').length >= 3) {
        if (!currentTable) {
          // بداية جدول جديد
          currentTable = {
            headers: [],
            rows: [],
            startIndex: i,
            endIndex: i
          };
          tableStartIndex = i;
          
          // استخراج العناوين
          const headers = line.split('|').map(h => h.trim()).filter(h => h);
          currentTable.headers = headers;
        } else {
          // استمرار الجدول
          const row = line.split('|').map(c => c.trim()).filter(c => c);
          if (row.length === currentTable.headers.length) {
            currentTable.rows.push(row);
            currentTable.endIndex = i;
          }
        }
      }
      // البحث عن جدول بالفواصل
      else if (line.includes(',') && line.split(',').length >= 2 && 
               (line.toLowerCase().includes('الاسم') || 
                line.toLowerCase().includes('العنوان') ||
                line.toLowerCase().includes('البيانات') ||
                i === 0 || lines[i-1]?.includes(','))) {
        
        if (!currentTable) {
          currentTable = {
            headers: [],
            rows: [],
            startIndex: i,
            endIndex: i
          };
          tableStartIndex = i;
          
          const headers = line.split(',').map(h => h.trim());
          currentTable.headers = headers;
        } else {
          const row = line.split(',').map(c => c.trim());
          if (row.length === currentTable.headers.length) {
            currentTable.rows.push(row);
            currentTable.endIndex = i;
          }
        }
      }
      // نهاية الجدول أو خط فاصل
      else if (currentTable && (line === '' || line.match(/^[-=+\s]*$/))) {
        if (currentTable.rows.length > 0) {
          // تحديد نوع الجدول
          let tableType = 'data';
          if (currentTable.headers.some(h => h.includes('ترتيب') || h.includes('رقم'))) {
            tableType = 'ranking';
          } else if (currentTable.headers.length > 2 && currentTable.headers.some(h => h.includes('مقارنة'))) {
            tableType = 'comparison';
          } else if (currentTable.headers.some(h => h.includes('تقدم') || h.includes('نسبة') || h.includes('%'))) {
            tableType = 'progress';
          }

          tables.push({
            headers: currentTable.headers,
            rows: currentTable.rows,
            type: tableType,
            startIndex: currentTable.startIndex,
            endIndex: currentTable.endIndex
          });
        }
        currentTable = null;
      }
    }

    // إضافة الجدول الأخير إذا كان موجود
    if (currentTable && currentTable.rows.length > 0) {
      let tableType = 'data';
      if (currentTable.headers.some(h => h.includes('ترتيب') || h.includes('رقم'))) {
        tableType = 'ranking';
      } else if (currentTable.headers.length > 2 && currentTable.headers.some(h => h.includes('مقارنة'))) {
        tableType = 'comparison';
      } else if (currentTable.headers.some(h => h.includes('تقدم') || h.includes('نسبة') || h.includes('%'))) {
        tableType = 'progress';
      }

      tables.push({
        headers: currentTable.headers,
        rows: currentTable.rows,
        type: tableType,
        startIndex: currentTable.startIndex,
        endIndex: currentTable.endIndex
      });
    }

    return tables;
  };

  const formatText = (text: string) => {
    if (!text || typeof text !== 'string') {
      return <p className="text-muted-foreground">لا توجد استجابة متاحة</p>;
    }

    const tables = parseTablesFromText(text);
    const lines = text.split('\n');
    const elements = [];
    let processedLines = new Set();

    // معالجة الجداول
    tables.forEach((table) => {
      for (let i = table.startIndex; i <= table.endIndex; i++) {
        processedLines.add(i);
      }
    });

    let currentTableIndex = 0;
    
    lines.forEach((line, index) => {
      // تخطي الأسطر الفارغة أو التي تحتوي على أحرف غريبة فقط
      if (!line || line.trim() === '' || /^[\s\*\-\_]+$/.test(line.trim())) {
        return;
      }

      // إضافة الجداول
      if (processedLines.has(index)) {
        if (currentTableIndex < tables.length && tables[currentTableIndex].startIndex === index) {
          const table = tables[currentTableIndex];
          elements.push(
            <div key={`table-${currentTableIndex}`} className="my-6">
              <AITable 
                data={{
                  headers: table.headers,
                  rows: table.rows,
                  type: table.type
                }}
              />
            </div>
          );
          currentTableIndex++;
        }
        return;
      }

      const cleanLine = line.trim();
      
      // عناوين
      if (cleanLine.startsWith('#')) {
        const level = (cleanLine.match(/^#+/) || ['#'])[0].length;
        const title = cleanLine.replace(/^#+\s*/, '').trim();
        if (title) {
          elements.push(
            <h2 
              key={`heading-${index}`} 
              className={`font-bold mb-4 mt-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent ${
                level === 1 ? 'text-2xl' : level === 2 ? 'text-xl' : 'text-lg'
              }`}
            >
              {title}
            </h2>
          );
        }
      }
      // نقاط
      else if (cleanLine.match(/^[-•*]\s/)) {
        const content = cleanLine.replace(/^[-•*]\s*/, '').trim();
        if (content) {
          elements.push(
            <div key={`bullet-${index}`} className="flex items-start gap-3 mb-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border-r-2 border-primary/30">
              <div className="p-1.5 rounded-full bg-gradient-to-br from-primary to-secondary mt-0.5 flex-shrink-0">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="leading-relaxed flex-1">{content}</span>
            </div>
          );
        }
      }
      // نص عادي
      else if (cleanLine && !cleanLine.match(/^[\*\-\_\s]+$/)) {
        elements.push(
          <p key={`text-${index}`} className="leading-relaxed mb-4 text-justify">
            {cleanLine}
          </p>
        );
      }
    });

    // إذا لم تكن هناك عناصر، أظهر النص الخام
    if (elements.length === 0) {
      return (
        <div className="whitespace-pre-wrap leading-relaxed">
          {text}
        </div>
      );
    }

    return elements;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      toast.success('تم نسخ النص بنجاح');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('فشل في نسخ النص');
    }
  };

  const downloadAsText = () => {
    const blob = new Blob([response], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-response-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('تم تحميل الملف');
  };

  const shareResponse = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'إجابة الذكاء الاصطناعي',
          text: response
        });
      } catch {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const readAloud = () => {
    if ('speechSynthesis' in window) {
      if (isReading) {
        speechSynthesis.cancel();
        setIsReading(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(response);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.8;
      utterance.onend = () => setIsReading(false);
      
      speechRef.current = utterance;
      speechSynthesis.speak(utterance);
      setIsReading(true);
    } else {
      toast.error('المتصفح لا يدعم القراءة الصوتية');
    }
  };

  const getTypeIcon = () => {
    // التحقق من وجود جداول في النص
    const hasTable = response.includes('|') || (response.includes(',') && response.split('\n').some(line => line.split(',').length >= 3));
    
    switch (type) {
      case 'image': return <Eye className="w-4 h-4" />;
      case 'research': return <BookOpen className="w-4 h-4" />;
      case 'editing': return <Type className="w-4 h-4" />;
      case 'mindmap': return <MessageSquare className="w-4 h-4" />;
      default: return hasTable ? <TableIcon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />;
    }
  };

  const getTypeLabel = () => {
    // التحقق من وجود جداول في النص
    const hasTable = response.includes('|') || (response.includes(',') && response.split('\n').some(line => line.split(',').length >= 3));
    
    switch (type) {
      case 'image': return 'تحليل صورة';
      case 'research': return 'بحث أكاديمي';
      case 'editing': return 'تحرير نص';
      case 'mindmap': return 'خريطة ذهنية';
      default: return hasTable ? 'إجابة مع جداول' : 'إجابة نصية';
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      case 'xlarge': return 'text-xl';
      default: return 'text-base';
    }
  };

  const getThemeClass = () => {
    switch (theme) {
      case 'dark': return 'bg-gray-900 text-white';
      case 'warm': return 'bg-amber-50 text-amber-900';
      case 'cool': return 'bg-blue-50 text-blue-900';
      default: return 'bg-background text-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card className="card-glow mt-6 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="animate-pulse w-6 h-6 bg-primary/20 rounded" />
            <div className="animate-pulse h-4 bg-primary/20 rounded w-32" />
          </div>
          <div className="space-y-3">
            <div className="animate-pulse h-4 bg-primary/10 rounded w-full" />
            <div className="animate-pulse h-4 bg-primary/10 rounded w-4/5" />
            <div className="animate-pulse h-4 bg-primary/10 rounded w-3/4" />
          </div>
        </div>
      </Card>
    );
  }

  if (!response) return null;

  // التحقق من صحة البيانات
  if (typeof response !== 'string') {
    console.error('Invalid response type:', typeof response);
    return (
      <Card className="card-glow mt-6 border-red-200">
        <div className="p-4 text-red-600">
          خطأ في تنسيق الاستجابة
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="card-glow mt-6 overflow-hidden border-0 bg-gradient-to-br from-background via-background to-primary/5">
        {/* Header */}
        <div className="border-b border-border/50 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10 backdrop-blur-sm">
                {getTypeIcon()}
              </div>
              <div className="flex flex-col gap-1">
                <Badge variant="secondary" className="gap-2 bg-gradient-to-r from-primary/20 to-secondary/20 border-0">
                  <Sparkles className="w-3 h-3" />
                  {getTypeLabel()}
                </Badge>
                <Badge variant="outline" className="text-xs border-primary/20 bg-primary/5">
                  {model}
                </Badge>
              </div>
            </div>
            
            {showActions && (
              <div className="flex items-center gap-1">
                {/* Font Size */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFontSize(fontSize === 'normal' ? 'large' : fontSize === 'large' ? 'xlarge' : 'normal')}
                  className="h-8 w-8 p-0 hover:bg-primary/10 rounded-full"
                >
                  <Type className="w-4 h-4" />
                </Button>
                
                {/* Theme */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === 'default' ? 'dark' : theme === 'dark' ? 'warm' : 'default')}
                  className="h-8 w-8 p-0 hover:bg-primary/10 rounded-full"
                >
                  <Palette className="w-4 h-4" />
                </Button>
                
                {/* Fullscreen */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullscreen(true)}
                  className="h-8 w-8 p-0 hover:bg-primary/10 rounded-full"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className={`transition-all duration-300 ${getThemeClass()}`}>
          <div 
            ref={textRef}
            className={`p-6 ${getFontSizeClass()} leading-relaxed ${
              isVisible ? 'animate-fade-in' : 'opacity-0'
            } ${isPulsing ? 'animate-pulse' : ''}`}
          >
            {isVisible && formatText(response)}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="border-t border-border/50 p-4 bg-gradient-to-r from-secondary/10 to-primary/5 backdrop-blur-sm">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="gap-2 hover:bg-primary/10 border-primary/20 hover:border-primary/40 transition-all duration-200"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'تم النسخ' : 'نسخ'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadAsText}
                  className="gap-2 hover:bg-primary/10 border-primary/20 hover:border-primary/40 transition-all duration-200"
                >
                  <Download className="w-4 h-4" />
                  تحميل
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareResponse}
                  className="gap-2 hover:bg-primary/10 border-primary/20 hover:border-primary/40 transition-all duration-200"
                >
                  <Share2 className="w-4 h-4" />
                  مشاركة
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={readAloud}
                  className="gap-2 hover:bg-primary/10 border-primary/20 hover:border-primary/40 transition-all duration-200"
                >
                  {isReading ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  {isReading ? 'إيقاف' : 'قراءة'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">عرض كامل</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullscreen(false)}
              >
                ✕
              </Button>
            </div>
            <div className={`overflow-y-auto max-h-[calc(90vh-80px)] ${getThemeClass()}`}>
              <div className={`p-6 ${getFontSizeClass()}`}>
                {formatText(response)}
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default AIResponse;