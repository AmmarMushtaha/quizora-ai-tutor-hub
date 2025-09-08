import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Download, Loader2, FileText, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
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
    setGenerationProgress('بدء إنشاء الكتاب...');

    try {
      // Generate table of contents first
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

      if (tocError) throw tocError;

      const tableOfContents = tocData.tableOfContents;
      
      // Generate pages content
      const pages: BookPage[] = [];
      
      for (let i = 0; i < tableOfContents.length; i++) {
        const chapter = tableOfContents[i];
        setGenerationProgress(`إنشاء ${chapter.title} (${i + 1}/${tableOfContents.length})...`);
        
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

        if (pageError) throw pageError;

        pages.push({
          pageNumber: chapter.page,
          title: chapter.title,
          content: pageData.content
        });
      }

      // Deduct credits
      const { data: deductData, error: deductError } = await supabase.rpc('deduct_credits', {
        p_user_id: profile.user_id,
        p_credits_to_deduct: requiredCredits,
        p_request_type: 'research_paper',
        p_content: `كتاب: ${bookTitle} - ${pageCount} صفحة`,
        p_response: `تم إنشاء كتاب "${bookTitle}" بنجاح`
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
      setGenerationProgress('تم إنشاء الكتاب بنجاح!');
      
      await refreshCredits();
      
      toast({
        title: "نجح إنشاء الكتاب",
        description: `تم إنشاء كتاب "${bookTitle}" بنجاح`,
      });

    } catch (error) {
      console.error('Error generating book:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الكتاب. الرجاء المحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
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

              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <CreditCard className="w-5 h-5" />
                  <span className="font-medium">تكلفة إنشاء الكتاب</span>
                </div>
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                  سيتم خصم {calculateCredits()} كريدت (3 كريدت لكل صفحة)
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                  رصيدك الحالي: {profile?.credits || 0} كريدت
                </p>
              </div>

              {generationProgress && (
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{generationProgress}</span>
                  </div>
                </div>
              )}

              <Button 
                onClick={generateBook} 
                disabled={isGenerating || !profile || profile.credits < calculateCredits()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جارٍ الإنشاء...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 mr-2" />
                    إنشاء الكتاب
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
                  تم إنشاء الكتاب بنجاح! 🎉
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  كتاب "{bookData.title}" جاهز للتحميل
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  فهرس الكتاب
                </h4>
                <div className="space-y-2">
                  {bookData.tableOfContents.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-sm text-gray-500">صفحة {item.page}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={downloadPDF}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  تحميل PDF
                </Button>
                
                <Button 
                  onClick={resetForm}
                  variant="outline"
                  className="flex-1"
                >
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