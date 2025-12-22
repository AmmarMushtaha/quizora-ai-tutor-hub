import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Download, Loader2, FileText, CreditCard, AlertCircle, CheckCircle2, Clock, Image, Eye, ChevronLeft, ChevronRight, Edit3, Trash2, Plus, Palette, X, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface BookPage {
  pageNumber: number;
  title: string;
  content: string;
  imageUrl?: string;
}

interface BookData {
  title: string;
  author: string;
  tableOfContents: Array<{ page: number; title: string }>;
  pages: BookPage[];
}

interface BookColors {
  primary: string;
  secondary: string;
  accent: string;
  textColor: string;
  backgroundColor: string;
}

const defaultColors: BookColors = {
  primary: '#667eea',
  secondary: '#764ba2',
  accent: '#f093fb',
  textColor: '#1a1a2e',
  backgroundColor: '#ffffff'
};

const colorPresets = [
  { name: 'بنفسجي', colors: { primary: '#667eea', secondary: '#764ba2', accent: '#f093fb', textColor: '#1a1a2e', backgroundColor: '#ffffff' } },
  { name: 'أخضر', colors: { primary: '#10b981', secondary: '#059669', accent: '#34d399', textColor: '#064e3b', backgroundColor: '#ffffff' } },
  { name: 'أزرق', colors: { primary: '#3b82f6', secondary: '#1d4ed8', accent: '#60a5fa', textColor: '#1e3a8a', backgroundColor: '#ffffff' } },
  { name: 'برتقالي', colors: { primary: '#f97316', secondary: '#ea580c', accent: '#fb923c', textColor: '#7c2d12', backgroundColor: '#ffffff' } },
  { name: 'وردي', colors: { primary: '#ec4899', secondary: '#db2777', accent: '#f472b6', textColor: '#831843', backgroundColor: '#ffffff' } },
  { name: 'ذهبي', colors: { primary: '#d97706', secondary: '#b45309', accent: '#fbbf24', textColor: '#78350f', backgroundColor: '#ffffff' } },
];

const BookCreator = () => {
  const [bookTitle, setBookTitle] = useState('');
  const [bookTopic, setBookTopic] = useState('');
  const [pageCount, setPageCount] = useState(10);
  const [authorName, setAuthorName] = useState('');
  const [language, setLanguage] = useState('arabic');
  const [generateImages, setGenerateImages] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [generationProgress, setGenerationProgress] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPreviewPage, setCurrentPreviewPage] = useState(0);
  const [bookColors, setBookColors] = useState<BookColors>(defaultColors);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editingChapter, setEditingChapter] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  
  const { profile, refreshCredits } = useProfile();
  const { toast } = useToast();

  const calculateCredits = () => {
    const baseCredits = pageCount * 3;
    const imageCredits = generateImages ? Math.ceil(pageCount / 3) * 2 : 0;
    return baseCredits + imageCredits;
  };

  const formatContentForPDF = (content: string): string => {
    // تحويل النص إلى HTML منسق
    let formatted = content;
    
    // تحويل القوائم
    formatted = formatted.replace(/^[-•]\s*(.+)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, '<ul style="margin: 10px 0; padding-right: 20px;">$&</ul>');
    
    // تحويل الأرقام إلى قوائم مرقمة
    formatted = formatted.replace(/^\d+[.-]\s*(.+)$/gm, '<li>$1</li>');
    
    // تحويل العناوين الفرعية (النص بين علامتي **)
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: 700; color: inherit;">$1</strong>');
    
    // تحويل النص المائل
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // تحويل الفقرات
    formatted = formatted.split('\n\n').map(p => 
      p.trim() ? `<p style="margin: 12px 0; text-indent: 20px;">${p}</p>` : ''
    ).join('');
    
    // إضافة فواصل الأسطر
    formatted = formatted.replace(/\n/g, '<br/>');
    
    return formatted;
  };

  const generateBook = async () => {
    if (!bookTitle || !bookTopic || !authorName) {
      toast({
        title: "خطأ",
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    const requiredCredits = calculateCredits();
    if (!profile || profile.credits < requiredCredits) {
      toast({
        title: "رصيد غير كافي",
        description: `تحتاج إلى ${requiredCredits} كريدت لإنشاء هذا الكتاب`,
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setProgressPercent(0);
    setGenerationProgress('بدء إنشاء الكتاب...');
    setCurrentStep('التحضير');

    try {
      // Generate table of contents
      setProgressPercent(10);
      setCurrentStep('إنشاء الفهرس');
      setGenerationProgress('إنشاء فهرس الكتاب...');
      
      const { data: tocData, error: tocError } = await supabase.functions.invoke('gemini-book-creator', {
        body: {
          action: 'generate_toc',
          bookTitle,
          topic: bookTopic,
          pageCount,
          language,
          authorName
        }
      });

      if (tocData?.error || tocError) {
        throw new Error(tocData?.error || tocError?.message || 'فشل في إنشاء فهرس الكتاب');
      }

      if (!tocData?.tableOfContents || !Array.isArray(tocData.tableOfContents)) {
        throw new Error('لم يتم استلام فهرس صحيح');
      }

      const tableOfContents = tocData.tableOfContents;
      
      setProgressPercent(20);
      setCurrentStep('إنشاء المحتوى');
      
      const pages: BookPage[] = [];
      const totalChapters = tableOfContents.length;
      
      for (let i = 0; i < tableOfContents.length; i++) {
        const chapter = tableOfContents[i];
        const chapterProgress = 20 + ((i / totalChapters) * (generateImages ? 50 : 70));
        setProgressPercent(Math.round(chapterProgress));
        setGenerationProgress(`إنشاء الفصل ${i + 1} من ${totalChapters}: ${chapter.title}...`);
        
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const { data: pageData, error: pageError } = await supabase.functions.invoke('gemini-book-creator', {
          body: {
            action: 'generate_page',
            bookTitle,
            topic: bookTopic,
            chapterTitle: chapter.title,
            chapterNumber: i + 1,
            totalChapters: tableOfContents.length,
            language,
            authorName
          }
        });

        if (pageData?.error || pageError) {
          throw new Error(pageData?.error || pageError?.message || `فشل في إنشاء الفصل ${i + 1}`);
        }

        if (!pageData?.content) {
          throw new Error(`لم يتم استلام محتوى الفصل ${i + 1}`);
        }

        pages.push({
          pageNumber: chapter.page,
          title: chapter.title,
          content: pageData.content,
          imageUrl: undefined
        });
      }

      // Generate images if enabled
      if (generateImages) {
        setCurrentStep('إنشاء الرسومات');
        for (let i = 0; i < pages.length; i++) {
          const imageProgress = 70 + ((i / pages.length) * 25);
          setProgressPercent(Math.round(imageProgress));
          setGenerationProgress(`إنشاء رسم للفصل ${i + 1}...`);

          try {
            const { data: imageData } = await supabase.functions.invoke('gemini-book-creator', {
              body: {
                action: 'generate_image',
                bookTitle,
                chapterTitle: pages[i].title,
                language
              }
            });

            if (imageData?.imageUrl) {
              pages[i].imageUrl = imageData.imageUrl;
            }
          } catch (imgError) {
            console.log('Image generation skipped for chapter', i + 1);
          }

          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setProgressPercent(95);
      setCurrentStep('الإنهاء');
      setGenerationProgress('حفظ الكتاب...');

      // Deduct credits
      const { data: deductData, error: deductError } = await supabase.rpc('deduct_credits', {
        user_uuid: profile.user_id,
        amount: requiredCredits
      });

      if (deductError || !deductData) {
        throw new Error('فشل في خصم الكريدتس');
      }

      const finalBookData: BookData = {
        title: bookTitle,
        author: authorName,
        tableOfContents,
        pages
      };

      setBookData(finalBookData);
      setProgressPercent(100);
      setCurrentStep('مكتمل');
      setGenerationProgress('تم إنشاء الكتاب بنجاح!');
      
      await refreshCredits();
      
      toast({
        title: "نجح إنشاء الكتاب",
        description: `تم إنشاء كتاب "${bookTitle}" بنجاح`,
      });

    } catch (error: any) {
      console.error('Error generating book:', error);
      
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء الكتاب",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      if (!bookData) {
        setProgressPercent(0);
        setCurrentStep('');
      }
    }
  };

  const downloadPDF = async () => {
    if (!bookData) return;

    setIsGenerating(true);
    setCurrentStep('جاري إنشاء ملف PDF...');

    try {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '595px';
      container.style.background = 'white';
      document.body.appendChild(container);

      const isArabic = language === 'arabic';
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pageWidth = 595;
      const pageHeight = 842;
      const margin = 50;

      const renderPage = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
        await document.fonts.ready;
        
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: bookColors.backgroundColor,
          width: pageWidth,
          logging: false
        });
        return canvas;
      };

      // Cover page
      const coverDiv = document.createElement('div');
      coverDiv.innerHTML = `
        <div style="
          width: ${pageWidth}px;
          height: ${pageHeight}px;
          background: linear-gradient(135deg, ${bookColors.primary} 0%, ${bookColors.secondary} 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 60px;
          direction: ${isArabic ? 'rtl' : 'ltr'};
          font-family: 'Tajawal', 'Arial', sans-serif;
        ">
          <h1 style="
            color: white;
            font-size: 48px;
            margin: 0 0 40px 0;
            font-weight: 700;
            line-height: 1.4;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
          ">${bookData.title}</h1>
          <div style="
            width: 120px;
            height: 4px;
            background: rgba(255,255,255,0.8);
            margin: 30px 0;
            border-radius: 2px;
          "></div>
          <p style="
            color: rgba(255,255,255,0.95);
            font-size: 28px;
            margin: 30px 0;
            font-weight: 500;
          ">${bookData.author}</p>
          <p style="
            color: rgba(255,255,255,0.8);
            font-size: 18px;
            margin-top: 40px;
          ">${new Date().toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}</p>
        </div>
      `;
      container.appendChild(coverDiv);
      
      setCurrentStep('جاري إنشاء صفحة الغلاف...');
      const coverCanvas = await renderPage(coverDiv);
      pdf.addImage(coverCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageWidth, pageHeight);

      // Table of contents
      const tocDiv = document.createElement('div');
      tocDiv.innerHTML = `
        <div style="
          width: ${pageWidth}px;
          min-height: ${pageHeight}px;
          background: ${bookColors.backgroundColor};
          padding: 70px ${margin}px;
          direction: ${isArabic ? 'rtl' : 'ltr'};
          font-family: 'Tajawal', 'Arial', sans-serif;
        ">
          <h2 style="
            text-align: center;
            color: ${bookColors.primary};
            font-size: 36px;
            margin-bottom: 50px;
            padding-bottom: 20px;
            border-bottom: 4px solid ${bookColors.primary};
            font-weight: 700;
          ">${isArabic ? 'فهرس المحتويات' : 'Table of Contents'}</h2>
          ${bookData.tableOfContents.map((item, index) => `
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 18px 10px;
              border-bottom: 2px dashed ${bookColors.primary}30;
              font-size: 20px;
              margin: 8px 0;
            ">
              <span style="color: ${bookColors.textColor}; font-weight: 600;">
                <span style="
                  display: inline-block;
                  width: 32px;
                  height: 32px;
                  background: ${bookColors.primary};
                  color: white;
                  border-radius: 50%;
                  text-align: center;
                  line-height: 32px;
                  margin-left: 12px;
                  font-size: 16px;
                ">${index + 1}</span>
                ${item.title}
              </span>
              <span style="color: ${bookColors.primary}; font-weight: 700;">${item.page}</span>
            </div>
          `).join('')}
        </div>
      `;
      container.innerHTML = '';
      container.appendChild(tocDiv);
      
      setCurrentStep('جاري إنشاء فهرس المحتويات...');
      pdf.addPage();
      const tocCanvas = await renderPage(tocDiv);
      pdf.addImage(tocCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageWidth, pageHeight);

      // Chapter pages
      for (let i = 0; i < bookData.pages.length; i++) {
        const page = bookData.pages[i];
        setCurrentStep(`جاري إنشاء الفصل ${i + 1} من ${bookData.pages.length}...`);
        setProgressPercent(Math.round(((i + 1) / bookData.pages.length) * 100));

        const formattedContent = formatContentForPDF(page.content);

        const chapterDiv = document.createElement('div');
        chapterDiv.innerHTML = `
          <div style="
            width: ${pageWidth}px;
            min-height: ${pageHeight}px;
            background: ${bookColors.backgroundColor};
            padding: 50px ${margin}px;
            direction: ${isArabic ? 'rtl' : 'ltr'};
            font-family: 'Tajawal', 'Arial', sans-serif;
          ">
            <div style="
              text-align: center;
              margin-bottom: 35px;
              padding-bottom: 25px;
              border-bottom: 3px solid ${bookColors.primary};
            ">
              <span style="
                background: linear-gradient(135deg, ${bookColors.primary}, ${bookColors.secondary});
                color: white;
                padding: 10px 28px;
                border-radius: 25px;
                font-size: 16px;
                font-weight: 600;
              ">${isArabic ? 'الفصل' : 'Chapter'} ${i + 1}</span>
              <h2 style="
                color: ${bookColors.textColor};
                font-size: 30px;
                margin: 25px 0 0 0;
                font-weight: 700;
                line-height: 1.4;
              ">${page.title}</h2>
            </div>
            ${page.imageUrl ? `
              <div style="text-align: center; margin: 25px 0;">
                <img src="${page.imageUrl}" style="
                  max-width: 90%;
                  max-height: 280px;
                  border-radius: 12px;
                  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                " />
              </div>
            ` : ''}
            <div style="
              font-size: 18px;
              line-height: 2.2;
              color: ${bookColors.textColor};
              text-align: justify;
            ">${formattedContent}</div>
          </div>
        `;
        container.innerHTML = '';
        container.appendChild(chapterDiv);

        pdf.addPage();
        const chapterCanvas = await renderPage(chapterDiv);
        pdf.addImage(chapterCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageWidth, pageHeight);
      }

      document.body.removeChild(container);
      pdf.save(`${bookData.title}.pdf`);

      toast({
        title: "تم التحميل بنجاح",
        description: `تم تحميل كتاب "${bookData.title}" بصيغة PDF`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء ملف PDF",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setCurrentStep('');
      setProgressPercent(100);
    }
  };

  const resetForm = () => {
    setBookTitle('');
    setBookTopic('');
    setPageCount(10);
    setAuthorName('');
    setBookData(null);
    setGenerationProgress('');
    setProgressPercent(0);
    setCurrentStep('');
    setPreviewMode(false);
    setEditMode(false);
    setCurrentPreviewPage(0);
    setBookColors(defaultColors);
  };

  const startEditChapter = (index: number) => {
    if (!bookData) return;
    setEditingChapter(index);
    setEditedContent(bookData.pages[index].content);
    setEditedTitle(bookData.pages[index].title);
  };

  const saveChapterEdit = () => {
    if (!bookData || editingChapter === null) return;
    
    const updatedPages = [...bookData.pages];
    updatedPages[editingChapter] = {
      ...updatedPages[editingChapter],
      title: editedTitle,
      content: editedContent
    };

    const updatedToc = [...bookData.tableOfContents];
    updatedToc[editingChapter] = {
      ...updatedToc[editingChapter],
      title: editedTitle
    };

    setBookData({
      ...bookData,
      pages: updatedPages,
      tableOfContents: updatedToc
    });

    setEditingChapter(null);
    toast({ title: "تم الحفظ", description: "تم حفظ التعديلات بنجاح" });
  };

  const removeChapterImage = (index: number) => {
    if (!bookData) return;
    
    const updatedPages = [...bookData.pages];
    updatedPages[index] = { ...updatedPages[index], imageUrl: undefined };
    setBookData({ ...bookData, pages: updatedPages });
    
    toast({ title: "تم الحذف", description: "تم حذف الصورة بنجاح" });
  };

  const regenerateChapterImage = async (index: number) => {
    if (!bookData) return;
    
    setIsGenerating(true);
    setCurrentStep('جاري إنشاء صورة جديدة...');

    try {
      const { data: imageData } = await supabase.functions.invoke('gemini-book-creator', {
        body: {
          action: 'generate_image',
          bookTitle: bookData.title,
          chapterTitle: bookData.pages[index].title,
          language
        }
      });

      if (imageData?.imageUrl) {
        const updatedPages = [...bookData.pages];
        updatedPages[index] = { ...updatedPages[index], imageUrl: imageData.imageUrl };
        setBookData({ ...bookData, pages: updatedPages });
        toast({ title: "تم الإنشاء", description: "تم إنشاء صورة جديدة بنجاح" });
      }
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في إنشاء الصورة", variant: "destructive" });
    } finally {
      setIsGenerating(false);
      setCurrentStep('');
    }
  };

  // Color Picker Modal
  const ColorPickerModal = () => (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-xl text-gray-800 dark:text-white flex items-center gap-2">
            <Palette className="w-6 h-6" />
            تخصيص ألوان الكتاب
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setShowColorPicker(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">اختر من الألوان الجاهزة:</p>
          <div className="grid grid-cols-3 gap-3">
            {colorPresets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setBookColors(preset.colors)}
                className={`p-3 rounded-xl border-2 transition-all ${
                  bookColors.primary === preset.colors.primary 
                    ? 'border-primary ring-2 ring-primary/30' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex gap-1 mb-2">
                  <div className="w-6 h-6 rounded-full" style={{ background: preset.colors.primary }} />
                  <div className="w-6 h-6 rounded-full" style={{ background: preset.colors.secondary }} />
                </div>
                <span className="text-sm font-medium">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">أو خصص الألوان يدوياً:</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">اللون الأساسي</Label>
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="color" 
                  value={bookColors.primary}
                  onChange={(e) => setBookColors({...bookColors, primary: e.target.value})}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <Input 
                  value={bookColors.primary} 
                  onChange={(e) => setBookColors({...bookColors, primary: e.target.value})}
                  className="h-10"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">اللون الثانوي</Label>
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="color" 
                  value={bookColors.secondary}
                  onChange={(e) => setBookColors({...bookColors, secondary: e.target.value})}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <Input 
                  value={bookColors.secondary} 
                  onChange={(e) => setBookColors({...bookColors, secondary: e.target.value})}
                  className="h-10"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">لون النص</Label>
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="color" 
                  value={bookColors.textColor}
                  onChange={(e) => setBookColors({...bookColors, textColor: e.target.value})}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <Input 
                  value={bookColors.textColor} 
                  onChange={(e) => setBookColors({...bookColors, textColor: e.target.value})}
                  className="h-10"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">لون الخلفية</Label>
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="color" 
                  value={bookColors.backgroundColor}
                  onChange={(e) => setBookColors({...bookColors, backgroundColor: e.target.value})}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <Input 
                  value={bookColors.backgroundColor} 
                  onChange={(e) => setBookColors({...bookColors, backgroundColor: e.target.value})}
                  className="h-10"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl" style={{ 
          background: `linear-gradient(135deg, ${bookColors.primary}, ${bookColors.secondary})` 
        }}>
          <p className="text-white text-center font-bold">معاينة الألوان</p>
        </div>

        <Button 
          onClick={() => setShowColorPicker(false)} 
          className="w-full mt-4"
          style={{ background: `linear-gradient(135deg, ${bookColors.primary}, ${bookColors.secondary})` }}
        >
          حفظ الألوان
        </Button>
      </div>
    </div>
  );

  // Chapter Editor Modal
  const ChapterEditorModal = () => {
    if (editingChapter === null || !bookData) return null;

    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between" style={{ 
            background: `linear-gradient(135deg, ${bookColors.primary}, ${bookColors.secondary})` 
          }}>
            <h3 className="font-bold text-lg text-white">تعديل الفصل {editingChapter + 1}</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={saveChapterEdit} className="text-white hover:bg-white/20">
                <Save className="w-4 h-4 ml-1" />
                حفظ
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditingChapter(null)} className="text-white hover:bg-white/20">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)] space-y-4" style={{ direction: language === 'arabic' ? 'rtl' : 'ltr' }}>
            <div>
              <Label>عنوان الفصل</Label>
              <Input 
                value={editedTitle} 
                onChange={(e) => setEditedTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            {bookData.pages[editingChapter]?.imageUrl && (
              <div className="relative">
                <Label>صورة الفصل</Label>
                <div className="mt-2 relative rounded-xl overflow-hidden">
                  <img 
                    src={bookData.pages[editingChapter].imageUrl} 
                    alt="Chapter illustration"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => removeChapterImage(editingChapter)}
                    >
                      <Trash2 className="w-4 h-4 ml-1" />
                      حذف
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => regenerateChapterImage(editingChapter)}
                      disabled={isGenerating}
                    >
                      <Plus className="w-4 h-4 ml-1" />
                      صورة جديدة
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!bookData.pages[editingChapter]?.imageUrl && (
              <Button 
                variant="outline" 
                onClick={() => regenerateChapterImage(editingChapter)}
                disabled={isGenerating}
                className="w-full"
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة صورة للفصل
              </Button>
            )}

            <div>
              <Label>محتوى الفصل</Label>
              <Textarea 
                value={editedContent} 
                onChange={(e) => setEditedContent(e.target.value)}
                className="mt-1 min-h-[300px] leading-relaxed"
                style={{ direction: language === 'arabic' ? 'rtl' : 'ltr' }}
              />
              <p className="text-xs text-gray-500 mt-2">
                نصائح التنسيق: استخدم ** للنص العريض، * للنص المائل، - للقوائم
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Book Preview/Editor Component
  const BookPreview = () => {
    if (!bookData) return null;

    const currentPage = bookData.pages[currentPreviewPage];

    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="text-white p-4 flex items-center justify-between" style={{ 
            background: `linear-gradient(135deg, ${bookColors.primary}, ${bookColors.secondary})` 
          }}>
            <h3 className="font-bold text-lg">{bookData.title}</h3>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => startEditChapter(currentPreviewPage)}
                className="text-white hover:bg-white/20"
              >
                <Edit3 className="w-4 h-4 ml-1" />
                تعديل
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setPreviewMode(false)} className="text-white hover:bg-white/20">
                إغلاق
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]" style={{ direction: language === 'arabic' ? 'rtl' : 'ltr' }}>
            {/* Chapter image */}
            {currentPage?.imageUrl && (
              <div className="mb-6 rounded-xl overflow-hidden shadow-lg relative group">
                <img src={currentPage.imageUrl} alt={currentPage.title} className="w-full h-56 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => removeChapterImage(currentPreviewPage)}
                  >
                    <Trash2 className="w-4 h-4 ml-1" />
                    حذف
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => regenerateChapterImage(currentPreviewPage)}
                    disabled={isGenerating}
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    صورة جديدة
                  </Button>
                </div>
              </div>
            )}

            {!currentPage?.imageUrl && (
              <Button 
                variant="outline" 
                onClick={() => regenerateChapterImage(currentPreviewPage)}
                disabled={isGenerating}
                className="w-full mb-6"
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة صورة للفصل
              </Button>
            )}

            {/* Chapter title */}
            <h2 className="text-2xl font-bold mb-6 text-center pb-4" style={{ 
              color: bookColors.primary,
              borderBottom: `3px solid ${bookColors.primary}30`
            }}>
              {currentPage?.title}
            </h2>

            {/* Chapter content - formatted */}
            <div 
              className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
              style={{ lineHeight: '2.2' }}
              dangerouslySetInnerHTML={{ __html: formatContentForPDF(currentPage?.content || '') }}
            />
          </div>

          {/* Navigation */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 flex items-center justify-between border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentPreviewPage(Math.max(0, currentPreviewPage - 1))}
              disabled={currentPreviewPage === 0}
            >
              <ChevronRight className="w-4 h-4 ml-1" />
              السابق
            </Button>
            
            <span className="text-sm text-gray-600 dark:text-gray-400">
              الفصل {currentPreviewPage + 1} من {bookData.pages.length}
            </span>
            
            <Button
              variant="outline"
              onClick={() => setCurrentPreviewPage(Math.min(bookData.pages.length - 1, currentPreviewPage + 1))}
              disabled={currentPreviewPage === bookData.pages.length - 1}
            >
              التالي
              <ChevronLeft className="w-4 h-4 mr-1" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {previewMode && <BookPreview />}
      {showColorPicker && <ColorPickerModal />}
      {editingChapter !== null && <ChapterEditorModal />}
      
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-purple-800 dark:text-purple-200">
            <BookOpen className="w-6 h-6" />
            إنشاء كتاب رقمي احترافي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!bookData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bookTitle">عنوان الكتاب *</Label>
                  <Input
                    id="bookTitle"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    placeholder="أدخل عنوان الكتاب"
                    disabled={isGenerating}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="authorName">اسم المؤلف *</Label>
                  <Input
                    id="authorName"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="أدخل اسم المؤلف"
                    disabled={isGenerating}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bookTopic">موضوع الكتاب *</Label>
                <Textarea
                  id="bookTopic"
                  value={bookTopic}
                  onChange={(e) => setBookTopic(e.target.value)}
                  placeholder="اكتب وصفاً مفصلاً لموضوع الكتاب والمواضيع التي تريد تغطيتها..."
                  className="min-h-[100px]"
                  disabled={isGenerating}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pageCount">عدد الفصول</Label>
                  <Select value={pageCount.toString()} onValueChange={(value) => setPageCount(parseInt(value))}>
                    <SelectTrigger disabled={isGenerating}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 15, 20, 25, 30].map((count) => (
                        <SelectItem key={count} value={count.toString()}>
                          {count} فصل
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">لغة الكتاب</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger disabled={isGenerating}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arabic">العربية 🇸🇦</SelectItem>
                      <SelectItem value="english">English 🇺🇸</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Color customization */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-200">ألوان الكتاب</p>
                    <div className="flex gap-1 mt-1">
                      <div className="w-5 h-5 rounded-full border-2 border-white shadow" style={{ background: bookColors.primary }} />
                      <div className="w-5 h-5 rounded-full border-2 border-white shadow" style={{ background: bookColors.secondary }} />
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowColorPicker(true)} disabled={isGenerating}>
                  تخصيص
                </Button>
              </div>

              {/* Image generation toggle */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 rounded-xl border border-pink-200 dark:border-pink-800">
                <div className="flex items-center gap-3">
                  <Image className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  <div>
                    <p className="font-medium text-pink-800 dark:text-pink-200">إضافة رسومات توضيحية</p>
                    <p className="text-sm text-pink-600 dark:text-pink-400">رسم جميل لكل فصل من الكتاب</p>
                  </div>
                </div>
                <Switch
                  checked={generateImages}
                  onCheckedChange={setGenerateImages}
                  disabled={isGenerating}
                />
              </div>

              {/* Credits info */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 p-5 rounded-xl border border-yellow-200 dark:border-yellow-800 shadow-sm">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 mb-3">
                  <CreditCard className="w-5 h-5" />
                  <span className="font-semibold">تكلفة إنشاء الكتاب</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-700 dark:text-yellow-300">التكلفة الإجمالية:</span>
                    <span className="font-bold text-xl text-yellow-800 dark:text-yellow-200">
                      {calculateCredits()} كريدت
                    </span>
                  </div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    ({pageCount} فصل × 3 كريدت{generateImages ? ` + رسومات` : ''})
                  </p>
                  <div className="flex justify-between items-center pt-2 border-t border-yellow-200 dark:border-yellow-700">
                    <span className="text-sm text-yellow-600 dark:text-yellow-400">رصيدك الحالي:</span>
                    <span className="font-semibold text-yellow-800 dark:text-yellow-200">
                      {profile?.credits || 0} كريدت
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress */}
              {generationProgress && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
                        <span className="font-semibold text-blue-800 dark:text-blue-200">{currentStep}</span>
                      </div>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {progressPercent}%
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-2 mb-3" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {generationProgress}
                    </p>
                  </div>
                </div>
              )}

              <Button 
                onClick={generateBook} 
                disabled={isGenerating || !profile || profile.credits < calculateCredits()}
                className="w-full text-white font-semibold py-6 shadow-lg hover:shadow-xl transition-all"
                style={{ background: `linear-gradient(135deg, ${bookColors.primary}, ${bookColors.secondary})` }}
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    جارٍ الإنشاء... ({progressPercent}%)
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5 mr-2" />
                    إنشاء الكتاب الآن
                  </>
                )}
              </Button>
              
              {!isGenerating && profile && profile.credits < calculateCredits() && (
                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-700 dark:text-red-300">
                      <p className="font-medium">رصيد غير كافٍ</p>
                      <p>تحتاج إلى {calculateCredits() - (profile?.credits || 0)} كريدت إضافي.</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              <div className="text-center p-6 rounded-xl border" style={{ 
                background: `linear-gradient(135deg, ${bookColors.primary}10, ${bookColors.secondary}10)`,
                borderColor: `${bookColors.primary}30`
              }}>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: `${bookColors.primary}20` }}>
                  <CheckCircle2 className="w-8 h-8" style={{ color: bookColors.primary }} />
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: bookColors.primary }}>
                  تم إنشاء الكتاب بنجاح! 🎉
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  كتاب "{bookData.title}" جاهز للتعديل والتحميل
                </p>
                <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>📄 {bookData.pages.length} فصل</span>
                  <span>•</span>
                  <span>✍️ {bookData.author}</span>
                  {bookData.pages.some(p => p.imageUrl) && (
                    <>
                      <span>•</span>
                      <span>🖼️ مع رسومات</span>
                    </>
                  )}
                </div>
              </div>

              {/* Table of Contents with edit buttons */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border shadow-sm">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: bookColors.primary }}>
                  <FileText className="w-5 h-5" />
                  فهرس الكتاب
                </h4>
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {bookData.tableOfContents.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center py-3 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: bookColors.primary }}>
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{item.title}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => startEditChapter(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color customization for result */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5" style={{ color: bookColors.primary }} />
                  <span className="font-medium">ألوان الكتاب</span>
                  <div className="flex gap-1">
                    <div className="w-5 h-5 rounded-full border-2 border-white shadow" style={{ background: bookColors.primary }} />
                    <div className="w-5 h-5 rounded-full border-2 border-white shadow" style={{ background: bookColors.secondary }} />
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowColorPicker(true)}>
                  تغيير
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={() => setPreviewMode(true)}
                  variant="outline"
                  className="font-semibold py-6 border-2"
                  style={{ borderColor: bookColors.primary, color: bookColors.primary }}
                  size="lg"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  معاينة وتعديل
                </Button>
                
                <Button 
                  onClick={downloadPDF}
                  className="text-white font-semibold py-6 shadow-lg hover:shadow-xl transition-all"
                  style={{ background: `linear-gradient(135deg, ${bookColors.primary}, ${bookColors.secondary})` }}
                  size="lg"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {currentStep}
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      تحميل PDF
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={resetForm}
                  variant="outline"
                  className="font-semibold py-6 border-2"
                  size="lg"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  كتاب جديد
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookCreator;
