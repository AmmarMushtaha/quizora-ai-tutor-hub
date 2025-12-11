import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Download, Loader2, FileText, CreditCard, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { Progress } from '@/components/ui/progress';
import jsPDF from 'jspdf';

interface BookPage {
  pageNumber: number;
  title: string;
  content: string;
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [generationProgress, setGenerationProgress] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  
  const { profile, refreshCredits } = useProfile();
  const { toast } = useToast();

  const calculateCredits = () => pageCount * 3;

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
        description: `تحتاج إلى ${requiredCredits} كريدت لإنشاء كتاب بـ ${pageCount} صفحة`,
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setProgressPercent(0);
    setGenerationProgress('بدء إنشاء الكتاب...');
    setCurrentStep('التحضير');

    try {
      // Generate table of contents first
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

      console.log('TOC Response:', { tocData, tocError });

      // Check for errors in the response data first (from edge function)
      if (tocData?.error) {
        console.error('Edge function returned error:', tocData);
        throw new Error(tocData.error || 'فشل في إنشاء فهرس الكتاب');
      }

      // Then check for invocation errors
      if (tocError) {
        console.error('Function invocation error:', tocError);
        throw new Error(tocError.message || 'فشل في الاتصال بالخادم');
      }

      // Verify we have the required data
      if (!tocData?.tableOfContents || !Array.isArray(tocData.tableOfContents)) {
        console.error('Invalid TOC response:', tocData);
        throw new Error('لم يتم استلام فهرس صحيح من الخادم');
      }

      const tableOfContents = tocData.tableOfContents;
      
      setProgressPercent(20);
      setCurrentStep('إنشاء المحتوى');
      
      // Generate pages content with better progress tracking
      const pages: BookPage[] = [];
      const totalChapters = tableOfContents.length;
      
      for (let i = 0; i < tableOfContents.length; i++) {
        const chapter = tableOfContents[i];
        const chapterProgress = 20 + ((i / totalChapters) * 70);
        setProgressPercent(Math.round(chapterProgress));
        setGenerationProgress(`إنشاء الفصل ${i + 1} من ${totalChapters}: ${chapter.title}...`);
        
        // Add small delay between requests to avoid rate limiting
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
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

        console.log(`Chapter ${i + 1} Response:`, { pageData, pageError });

        // Check for errors in the response data first (from edge function)
        if (pageData?.error) {
          console.error(`Edge function returned error for chapter ${i + 1}:`, pageData);
          throw new Error(pageData.error || `فشل في إنشاء الفصل ${i + 1}`);
        }

        // Then check for invocation errors
        if (pageError) {
          console.error(`Function invocation error for chapter ${i + 1}:`, pageError);
          throw new Error(pageError.message || `فشل في الاتصال بالخادم للفصل ${i + 1}`);
        }

        // Verify we have the required content
        if (!pageData?.content) {
          console.error(`No content received for chapter ${i + 1}:`, pageData);
          throw new Error(`لم يتم استلام محتوى الفصل ${i + 1}`);
        }

        pages.push({
          pageNumber: chapter.page,
          title: chapter.title,
          content: pageData.content
        });
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

    } catch (error) {
      console.error('Error generating book:', error);
      
      let errorMessage = "فشل في إنشاء الكتاب. الرجاء المحاولة مرة أخرى";
      
      // Handle specific error types
      if (error.message.includes('⏰')) {
        errorMessage = error.message.replace(' ⏰', '');
      } else if (error.message.includes('overloaded') || error.message.includes('busy')) {
        errorMessage = "الخدمة مشغولة حالياً، يرجى المحاولة مرة أخرى خلال دقائق قليلة";
      } else if (error.message.includes('quota')) {
        errorMessage = "تم تجاوز الحد المسموح للاستخدام، يرجى المحاولة لاحقاً";
      }
      
      toast({
        title: "خطأ",
        description: errorMessage,
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
    
    // Configure fonts
    pdf.setFont('helvetica');
    
    // Title page
    pdf.setFontSize(24);
    pdf.setTextColor(44, 62, 80); // Dark blue title
    
    const titleLines = pdf.splitTextToSize(bookData.title, contentWidth);
    let yPosition = 60;
    
    titleLines.forEach((line: string) => {
      const textWidth = pdf.getTextWidth(line);
      pdf.text(line, (pageWidth - textWidth) / 2, yPosition);
      yPosition += 12;
    });
    
    // Author
    pdf.setFontSize(16);
    pdf.setTextColor(52, 73, 94); // Slightly lighter
    yPosition += 30;
    const authorText = language === 'arabic' ? `تأليف: ${bookData.author}` : `By: ${bookData.author}`;
    const authorWidth = pdf.getTextWidth(authorText);
    pdf.text(authorText, (pageWidth - authorWidth) / 2, yPosition);
    
    // Date
    pdf.setFontSize(12);
    pdf.setTextColor(127, 140, 141);
    yPosition += 20;
    const dateText = new Date().toLocaleDateString(language === 'arabic' ? 'ar-SA' : 'en-US');
    const dateWidth = pdf.getTextWidth(dateText);
    pdf.text(dateText, (pageWidth - dateWidth) / 2, yPosition);
    
    // Reset color for content
    pdf.setTextColor(0, 0, 0);
    
    // Table of contents
    pdf.addPage();
    pdf.setFontSize(20);
    pdf.setTextColor(44, 62, 80);
    const tocTitle = language === 'arabic' ? 'الفهرس' : 'Table of Contents';
    const tocTitleWidth = pdf.getTextWidth(tocTitle);
    pdf.text(tocTitle, (pageWidth - tocTitleWidth) / 2, 30);
    
    yPosition = 50;
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    
    bookData.tableOfContents.forEach((item, index) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 30;
      }
      
      const dots = '.'.repeat(Math.max(5, 40 - item.title.length));
      const line = `${item.title} ${dots} ${item.page}`;
      
      if (language === 'arabic') {
        pdf.text(line, pageWidth - margin, yPosition, { align: 'right', maxWidth: contentWidth });
      } else {
        pdf.text(line, margin, yPosition, { maxWidth: contentWidth });
      }
      yPosition += 10;
    });
    
    // Content pages
    bookData.pages.forEach((page, pageIndex) => {
      pdf.addPage();
      
      // Page title
      pdf.setFontSize(18);
      pdf.setTextColor(44, 62, 80);
      const pageTitleWidth = pdf.getTextWidth(page.title);
      pdf.text(page.title, (pageWidth - pageTitleWidth) / 2, 30);
      
      // Decorative line under title
      pdf.setDrawColor(149, 165, 166);
      pdf.setLineWidth(0.5);
      pdf.line(margin, 35, pageWidth - margin, 35);
      
      // Page content
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      yPosition = 50;
      
      const contentLines = pdf.splitTextToSize(page.content, contentWidth);
      contentLines.forEach((line: string) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 25;
        }
        
        if (language === 'arabic') {
          pdf.text(line, pageWidth - margin, yPosition, { align: 'right', maxWidth: contentWidth });
        } else {
          pdf.text(line, margin, yPosition, { maxWidth: contentWidth });
        }
        yPosition += 6;
      });
      
      // Page number
      pdf.setFontSize(10);
      pdf.setTextColor(127, 140, 141);
      const pageNumberText = `${page.pageNumber}`;
      const pageNumWidth = pdf.getTextWidth(pageNumberText);
      pdf.text(pageNumberText, (pageWidth - pageNumWidth) / 2, pageHeight - 10);
    });
    
    // Save PDF
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
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-purple-800 dark:text-purple-200">
            <BookOpen className="w-6 h-6" />
            إنشاء كتاب احترافي
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
                  <Label htmlFor="pageCount">عدد الصفحات</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="pageCount"
                      type="number"
                      min="5"
                      max="100"
                      value={pageCount}
                      onChange={(e) => setPageCount(Math.max(5, Math.min(100, parseInt(e.target.value) || 5)))}
                      disabled={isGenerating}
                      className="flex-1"
                    />
                    <Select value={pageCount.toString()} onValueChange={(value) => setPageCount(parseInt(value))}>
                      <SelectTrigger disabled={isGenerating} className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 15, 20, 25, 30, 40, 50, 75, 100].map((count) => (
                          <SelectItem key={count} value={count.toString()}>
                            {count}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-muted-foreground">من 5 إلى 100 صفحة</p>
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
                  <p className="text-sm text-muted-foreground">اختر لغة محتوى الكتاب</p>
                </div>
              </div>

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
                    (3 كريدت × {pageCount} صفحة)
                  </p>
                  <div className="flex justify-between items-center pt-2 border-t border-yellow-200 dark:border-yellow-700">
                    <span className="text-sm text-yellow-600 dark:text-yellow-400">رصيدك الحالي:</span>
                    <span className="font-semibold text-yellow-800 dark:text-yellow-200">
                      {profile?.credits || 0} كريدت
                    </span>
                  </div>
                </div>
              </div>

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
                  
                  <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-700 dark:text-amber-300">
                        <p className="font-medium mb-1">يُرجى الانتظار...</p>
                        <p>عملية إنشاء الكتاب قد تستغرق عدة دقائق حسب عدد الصفحات. لا تغلق هذه الصفحة.</p>
                      </div>
                    </div>
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
                      <p>تحتاج إلى {calculateCredits() - (profile?.credits || 0)} كريدت إضافي لإنشاء هذا الكتاب.</p>
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
                  كتاب "{bookData.title}" جاهز للتحميل
                </p>
                <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>📄 {bookData.pages.length} فصل</span>
                  <span>•</span>
                  <span>✍️ {bookData.author}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border shadow-sm">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <FileText className="w-5 h-5" />
                  فهرس الكتاب
                </h4>
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
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
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">صفحة {item.page}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={downloadPDF}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-6 shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  تحميل الكتاب PDF
                </Button>
                
                <Button 
                  onClick={resetForm}
                  variant="outline"
                  className="font-semibold py-6 border-2"
                  size="lg"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  إنشاء كتاب جديد
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