import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  FileText, 
  Mic, 
  Map, 
  MessageCircle, 
  Edit, 
  Calendar, 
  Coins, 
  Eye,
  Clock,
  Download,
  Copy,
  Image as ImageIcon,
  Play,
  Book
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIRequest {
  id: string;
  request_type: string;
  prompt: string | null;
  response: string | null;
  credits_used: number;
  created_at: string;
}

interface AIRequestCardProps {
  request: AIRequest;
}

export function AIRequestCard({ request }: AIRequestCardProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'text_question': return Brain;
      case 'image_question': return ImageIcon;
      case 'audio_summary': return Mic;
      case 'mind_map': return Map;
      case 'chat_explanation': return MessageCircle;
      case 'research_paper': return FileText;
      case 'text_editing': return Edit;
      case 'book_creator': return Book;
      default: return Brain;
    }
  };

  const getToolId = (type: string) => {
    switch (type) {
      case 'text_question': return 'text-question';
      case 'image_question': return 'image-question';
      case 'audio_summary': return 'audio-summary';
      case 'mind_map': return 'mind-map';
      case 'chat_explanation': return 'chat-tutor';
      case 'research_paper': return 'research-paper';
      case 'text_editing': return 'text-editing';
      case 'book_creator': return 'book-creator';
      default: return 'text-question';
    }
  };

  const canResume = (type: string) => {
    // الأدوات التي يمكن استئناف العمل فيها
    return ['mind_map', 'research_paper', 'text_editing', 'chat_explanation'].includes(type);
  };

  const handleResume = () => {
    const toolId = getToolId(request.request_type);
    navigate('/dashboard', { 
      state: { 
        resumeTool: toolId,
        resumePrompt: request.prompt,
        resumeResponse: request.response
      } 
    });
  };

  const getRequestTypeName = (type: string) => {
    switch (type) {
      case 'text_question': return 'سؤال نصي';
      case 'image_question': return 'سؤال صورة';
      case 'audio_summary': return 'تلخيص صوتي';
      case 'mind_map': return 'خريطة ذهنية';
      case 'chat_explanation': return 'شرح ذكي';
      case 'research_paper': return 'بحث أكاديمي';
      case 'text_editing': return 'تحرير نص';
      case 'book_creator': return 'إنشاء كتاب';
      default: return type;
    }
  };

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'text_question': return 'bg-blue-500/10 text-blue-500';
      case 'image_question': return 'bg-green-500/10 text-green-500';
      case 'audio_summary': return 'bg-purple-500/10 text-purple-500';
      case 'mind_map': return 'bg-orange-500/10 text-orange-500';
      case 'chat_explanation': return 'bg-cyan-500/10 text-cyan-500';
      case 'research_paper': return 'bg-red-500/10 text-red-500';
      case 'text_editing': return 'bg-yellow-500/10 text-yellow-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'منذ أقل من ساعة';
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    if (diffInHours < 48) return 'أمس';
    
    return date.toLocaleDateString('ar-SA', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const copyResponse = () => {
    if (request.response) {
      navigator.clipboard.writeText(request.response);
      toast({
        title: "تم النسخ",
        description: "تم نسخ الرد",
      });
    }
  };

  const getContentPreview = () => {
    if (request.prompt) {
      return request.prompt.length > 150 
        ? `${request.prompt.substring(0, 150)}...`
        : request.prompt;
    }
    return 'طلب ذكاء اصطناعي';
  };

  const IconComponent = getRequestTypeIcon(request.request_type);

  return (
    <Card className="group hover:shadow-md transition-all duration-200 bg-card border border-border/50">
      <CardHeader className="p-3 md:p-4">
        <div className="flex items-start gap-2 md:gap-3">
          <div className={`p-2 md:p-2.5 rounded-lg shrink-0 ${getRequestTypeColor(request.request_type)}`}>
            <IconComponent className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs font-medium">
                {getRequestTypeName(request.request_type)}
              </Badge>
              
              <Badge variant="outline" className="gap-1 text-xs">
                <Coins className="w-2.5 h-2.5 text-yellow-500" />
                {request.credits_used}
              </Badge>
              
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(request.created_at)}
              </span>
            </div>
            
            <CardDescription className="text-xs md:text-sm text-foreground/80 line-clamp-2">
              {getContentPreview()}
            </CardDescription>
          </div>
          
          <div className="flex gap-1.5 shrink-0">
            {canResume(request.request_type) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleResume}
                className="h-7 w-7 p-0 md:h-8 md:w-auto md:px-2"
                title="استكمال"
              >
                <Play className="w-3.5 h-3.5" />
              </Button>
            )}
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 md:h-8 md:w-auto md:px-2">
                  <Eye className="w-3.5 h-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[85vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <IconComponent className="w-4 h-4 text-primary" />
                    {getRequestTypeName(request.request_type)}
                  </DialogTitle>
                </DialogHeader>
                
                <ScrollArea className="h-[50vh] md:h-[60vh] mt-3">
                  <div className="space-y-4 pr-3">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">تفاصيل الطلب:</h4>
                      <div className="bg-muted/50 p-3 rounded-lg text-sm">
                        <p className="whitespace-pre-wrap">{request.prompt || getContentPreview()}</p>
                      </div>
                    </div>

                    {request.response && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">الرد:</h4>
                        <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg text-sm">
                          <p className="whitespace-pre-wrap">{request.response}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                <div className="flex gap-2 pt-3 border-t">
                  {request.response && (
                    <Button variant="outline" onClick={copyResponse} size="sm" className="flex-1">
                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                      نسخ
                    </Button>
                  )}
                  {canResume(request.request_type) && (
                    <Button onClick={handleResume} size="sm" className="flex-1">
                      <Play className="w-3.5 h-3.5 mr-1.5" />
                      استكمال
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}