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

  const downloadPDF = () => {
    if (!bookData) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    pdf.setFont('helvetica');
    
    // Title page with gradient-like background
    pdf.setFillColor(99, 102, 241);
    pdf.rect(0, 0, pageWidth, 80, 'F');
    
    pdf.setFontSize(28);
    pdf.setTextColor(255, 255, 255);
    
    const titleLines = pdf.splitTextToSize(bookData.title, contentWidth);
    let yPosition = 40;
    
    titleLines.forEach((line: string) => {
      const textWidth = pdf.getTextWidth(line);
      pdf.text(line, (pageWidth - textWidth) / 2, yPosition);
      yPosition += 14;
    });
    
    // Author
    pdf.setFontSize(18);
    pdf.setTextColor(44, 62, 80);
    yPosition = 110;
    const authorText = language === 'arabic' ? `تأليف: ${bookData.author}` : `By: ${bookData.author}`;
    const authorWidth = pdf.getTextWidth(authorText);
    pdf.text(authorText, (pageWidth - authorWidth) / 2, yPosition);
    
    // Decorative elements
    pdf.setDrawColor(99, 102, 241);
    pdf.setLineWidth(2);
    pdf.line(margin + 30, yPosition + 15, pageWidth - margin - 30, yPosition + 15);
    
    // Date
    pdf.setFontSize(12);
    pdf.setTextColor(127, 140, 141);
    yPosition += 40;
    const dateText = new Date().toLocaleDateString(language === 'arabic' ? 'ar-SA' : 'en-US');
    const dateWidth = pdf.getTextWidth(dateText);
    pdf.text(dateText, (pageWidth - dateWidth) / 2, yPosition);
    
    // Table of contents
    pdf.addPage();
    pdf.setFillColor(249, 250, 251);
    pdf.rect(0, 0, pageWidth, 50, 'F');
    
    pdf.setFontSize(24);
    pdf.setTextColor(99, 102, 241);
    const tocTitle = language === 'arabic' ? 'فهرس المحتويات' : 'Table of Contents';
    const tocTitleWidth = pdf.getTextWidth(tocTitle);
    pdf.text(tocTitle, (pageWidth - tocTitleWidth) / 2, 35);
    
    yPosition = 70;
    pdf.setFontSize(12);
    pdf.setTextColor(55, 65, 81);
    
    bookData.tableOfContents.forEach((item, index) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 30;
      }
      
      // Chapter number circle
      pdf.setFillColor(99, 102, 241);
      pdf.circle(margin + 5, yPosition - 3, 4, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text(String(index + 1), margin + 3.5, yPosition - 1);
      
      pdf.setTextColor(55, 65, 81);
      pdf.setFontSize(12);
      
      const dots = '.'.repeat(Math.max(5, 35 - item.title.length));
      const line = `${item.title} ${dots} ${item.page}`;
      
      pdf.text(line, margin + 15, yPosition, { maxWidth: contentWidth - 15 });
      yPosition += 12;
    });
    
    // Content pages
    bookData.pages.forEach((page, pageIndex) => {
      pdf.addPage();
      
      // Page header
      pdf.setFillColor(99, 102, 241);
      pdf.rect(0, 0, pageWidth, 8, 'F');
      
      // Page title
      pdf.setFontSize(20);
      pdf.setTextColor(99, 102, 241);
      const pageTitleWidth = pdf.getTextWidth(page.title);
      pdf.text(page.title, (pageWidth - pageTitleWidth) / 2, 25);
      
      // Decorative line
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.5);
      pdf.line(margin, 32, pageWidth - margin, 32);
      
      yPosition = 45;
      
      // Add image if exists
      if (page.imageUrl && page.imageUrl.startsWith('data:image')) {
        try {
          pdf.addImage(page.imageUrl, 'PNG', margin, yPosition, contentWidth, 60);
          yPosition += 70;
        } catch (e) {
          console.log('Could not add image to PDF');
        }
      }
      
      // Page content
      pdf.setFontSize(11);
      pdf.setTextColor(55, 65, 81);
      
      const contentLines = pdf.splitTextToSize(page.content, contentWidth);
      contentLines.forEach((line: string) => {
        if (yPosition > pageHeight - 25) {
          pdf.addPage();
          pdf.setFillColor(99, 102, 241);
          pdf.rect(0, 0, pageWidth, 8, 'F');
          yPosition = 25;
        }
        
        pdf.text(line, margin, yPosition, { maxWidth: contentWidth });
        yPosition += 6;
      });
      
      // Page number
      pdf.setFontSize(10);
      pdf.setTextColor(156, 163, 175);
      const pageNumberText = `${pageIndex + 1}`;
      const pageNumWidth = pdf.getTextWidth(pageNumberText);
      pdf.text(pageNumberText, (pageWidth - pageNumWidth) / 2, pageHeight - 10);
    });
    
    pdf.save(`${bookData.title}.pdf`);
    
    toast({
      title: "تم التحميل",
      description: `تم تحميل كتاب "${bookData.title}" بصيغة PDF`,
    });
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
