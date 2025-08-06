import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
  MessageSquare
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
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState('normal');
  const [theme, setTheme] = useState('default');
  const [showActions, setShowActions] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // تأثير الكتابة التدريجي
  useEffect(() => {
    if (!response || isLoading) return;

    setIsTyping(true);
    setDisplayedText('');
    
    let index = 0;
    const typeSpeed = response.length > 1000 ? 20 : 50; // سرعة الكتابة

    const timer = setInterval(() => {
      if (index < response.length) {
        setDisplayedText(response.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        setShowActions(true);
        clearInterval(timer);
      }
    }, typeSpeed);

    return () => clearInterval(timer);
  }, [response, isLoading]);

  const formatText = (text: string) => {
    // تنسيق النص بطريقة متقدمة
    return text
      .split('\n')
      .map((line, index) => {
        // عناوين
        if (line.startsWith('#')) {
          const level = line.match(/^#+/)?.[0].length || 1;
          const title = line.replace(/^#+\s*/, '');
          return (
            <h2 
              key={index} 
              className={`font-bold text-gradient mb-4 mt-6 ${
                level === 1 ? 'text-2xl' : level === 2 ? 'text-xl' : 'text-lg'
              }`}
            >
              {title}
            </h2>
          );
        }
        
        // نقاط
        if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
          return (
            <div key={index} className="flex items-start gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
              <span className="leading-relaxed">{line.replace(/^[-•]\s*/, '')}</span>
            </div>
          );
        }
        
        // نص عادي
        if (line.trim()) {
          return (
            <p key={index} className="leading-relaxed mb-4 text-justify">
              {line}
            </p>
          );
        }
        
        return <div key={index} className="h-2" />;
      });
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
    switch (type) {
      case 'image': return <Eye className="w-4 h-4" />;
      case 'research': return <BookOpen className="w-4 h-4" />;
      case 'editing': return <Type className="w-4 h-4" />;
      case 'mindmap': return <MessageSquare className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'image': return 'تحليل صورة';
      case 'research': return 'بحث أكاديمي';
      case 'editing': return 'تحرير نص';
      case 'mindmap': return 'خريطة ذهنية';
      default: return 'إجابة نصية';
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

  return (
    <>
      <Card className="card-glow mt-6 overflow-hidden">
        {/* Header */}
        <div className="border-b bg-gradient-to-r from-primary/5 to-secondary/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getTypeIcon()}
              <Badge variant="secondary" className="gap-1">
                {getTypeLabel()}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {model}
              </Badge>
            </div>
            
            {showActions && (
              <div className="flex items-center gap-1">
                {/* Font Size */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFontSize(fontSize === 'normal' ? 'large' : fontSize === 'large' ? 'xlarge' : 'normal')}
                  className="h-8 w-8 p-0"
                >
                  <Type className="w-4 h-4" />
                </Button>
                
                {/* Theme */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === 'default' ? 'dark' : theme === 'dark' ? 'warm' : 'default')}
                  className="h-8 w-8 p-0"
                >
                  <Palette className="w-4 h-4" />
                </Button>
                
                {/* Fullscreen */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullscreen(true)}
                  className="h-8 w-8 p-0"
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
            className={`p-6 ${getFontSizeClass()} leading-relaxed`}
          >
            {formatText(displayedText)}
            
            {isTyping && (
              <span className="inline-block w-2 h-6 bg-primary animate-pulse ml-1" />
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="border-t p-4 bg-secondary/20">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'تم النسخ' : 'نسخ'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadAsText}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  تحميل
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareResponse}
                  className="gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  مشاركة
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={readAloud}
                  className="gap-2"
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