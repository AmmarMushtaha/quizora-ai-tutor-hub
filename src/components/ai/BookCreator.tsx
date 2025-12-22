import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Download, Loader2, FileText, CreditCard, AlertCircle, CheckCircle2, Clock, Image, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [currentPreviewPage, setCurrentPreviewPage] = useState(0);
  
  const { profile, refreshCredits } = useProfile();
  const { toast } = useToast();

  const calculateCredits = () => {
    const baseCredits = pageCount * 3;
    const imageCredits = generateImages ? Math.ceil(pageCount / 3) * 2 : 0;
    return baseCredits + imageCredits;
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
      // Create a hidden container for rendering
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '595px'; // A4 width in pixels at 72 DPI
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
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2);

      // Helper function to render a page
      const renderPage = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
        // Wait for fonts to load
        await document.fonts.ready;
        
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: pageWidth,
          logging: false
        });
        return canvas;
      };

      // Create cover page
      const coverDiv = document.createElement('div');
      coverDiv.innerHTML = `
        <div style="
          width: ${pageWidth}px;
          height: ${pageHeight}px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            font-size: 42px;
            margin: 0 0 30px 0;
            font-weight: 700;
            line-height: 1.3;
          ">${bookData.title}</h1>
          <div style="
            width: 100px;
            height: 4px;
            background: rgba(255,255,255,0.6);
            margin: 20px 0;
            border-radius: 2px;
          "></div>
          <p style="
            color: rgba(255,255,255,0.9);
            font-size: 24px;
            margin: 20px 0;
          ">${bookData.author}</p>
          <p style="
            color: rgba(255,255,255,0.7);
            font-size: 16px;
          ">${new Date().toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}</p>
        </div>
      `;
      container.appendChild(coverDiv);
      
      setCurrentStep('جاري إنشاء صفحة الغلاف...');
      const coverCanvas = await renderPage(coverDiv);
      pdf.addImage(coverCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageWidth, pageHeight);

      // Create table of contents page
      const tocDiv = document.createElement('div');
      tocDiv.innerHTML = `
        <div style="
          width: ${pageWidth}px;
          min-height: ${pageHeight}px;
          background: white;
          padding: 60px ${margin}px;
          direction: ${isArabic ? 'rtl' : 'ltr'};
          font-family: 'Tajawal', 'Arial', sans-serif;
        ">
          <h2 style="
            text-align: center;
            color: #667eea;
            font-size: 32px;
            margin-bottom: 40px;
            padding-bottom: 15px;
            border-bottom: 3px solid #667eea;
          ">${isArabic ? 'فهرس المحتويات' : 'Table of Contents'}</h2>
          ${bookData.tableOfContents.map((item, index) => `
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 15px 0;
              border-bottom: 1px dashed #e0e0e0;
              font-size: 18px;
            ">
              <span style="color: #667eea; font-weight: 600;">${index + 1}. ${item.title}</span>
              <span style="color: #888;">${item.page}</span>
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

      // Create chapter pages
      for (let i = 0; i < bookData.pages.length; i++) {
        const page = bookData.pages[i];
        setCurrentStep(`جاري إنشاء الفصل ${i + 1} من ${bookData.pages.length}...`);
        setProgressPercent(Math.round(((i + 1) / bookData.pages.length) * 100));

        const chapterDiv = document.createElement('div');
        chapterDiv.innerHTML = `
          <div style="
            width: ${pageWidth}px;
            min-height: ${pageHeight}px;
            background: white;
            padding: 50px ${margin}px;
            direction: ${isArabic ? 'rtl' : 'ltr'};
            font-family: 'Tajawal', 'Arial', sans-serif;
          ">
            <div style="
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #667eea;
            ">
              <span style="
                background: #667eea;
                color: white;
                padding: 8px 20px;
                border-radius: 20px;
                font-size: 14px;
              ">${isArabic ? 'الفصل' : 'Chapter'} ${i + 1}</span>
              <h2 style="
                color: #1a1a2e;
                font-size: 28px;
                margin: 20px 0 0 0;
                font-weight: 700;
              ">${page.title}</h2>
            </div>
            ${page.imageUrl ? `
              <div style="text-align: center; margin: 20px 0;">
                <img src="${page.imageUrl}" style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);" />
              </div>
            ` : ''}
            <div style="
              font-size: 16px;
              line-height: 2;
              color: #333;
              text-align: justify;
            ">${page.content.replace(/\n/g, '<br/>')}</div>
          </div>
        `;
        container.innerHTML = '';
        container.appendChild(chapterDiv);

        pdf.addPage();
        const chapterCanvas = await renderPage(chapterDiv);
        pdf.addImage(chapterCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageWidth, pageHeight);
      }

      // Clean up
      document.body.removeChild(container);

      // Save the PDF
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
    setCurrentPreviewPage(0);
  };

  // Book Preview Component
  const BookPreview = () => {
    if (!bookData) return null;

    const currentPage = bookData.pages[currentPreviewPage];

    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 flex items-center justify-between">
            <h3 className="font-bold text-lg">{bookData.title}</h3>
            <Button variant="ghost" size="sm" onClick={() => setPreviewMode(false)} className="text-white hover:bg-white/20">
              إغلاق
            </Button>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]" style={{ direction: language === 'arabic' ? 'rtl' : 'ltr' }}>
            {/* Chapter image */}
            {currentPage?.imageUrl && (
              <div className="mb-6 rounded-xl overflow-hidden shadow-lg">
                <img src={currentPage.imageUrl} alt={currentPage.title} className="w-full h-48 object-cover" />
              </div>
            )}

            {/* Chapter title */}
            <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-300 mb-6 text-center border-b-2 border-purple-200 dark:border-purple-700 pb-4">
              {currentPage?.title}
            </h2>

            {/* Chapter content */}
            <div className="prose prose-lg dark:prose-invert max-w-none leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {currentPage?.content}
            </div>
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
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-6 shadow-lg hover:shadow-xl transition-all"
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
              <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
                  تم إنشاء الكتاب بنجاح! 🎉
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  كتاب "{bookData.title}" جاهز
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

              {/* Table of Contents */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border shadow-sm">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <FileText className="w-5 h-5" />
                  فهرس الكتاب
                </h4>
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {bookData.tableOfContents.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center py-3 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-semibold">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{item.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={() => setPreviewMode(true)}
                  variant="outline"
                  className="font-semibold py-6 border-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                  size="lg"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  معاينة الكتاب
                </Button>
                
                <Button 
                  onClick={downloadPDF}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-6 shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  تحميل PDF
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
