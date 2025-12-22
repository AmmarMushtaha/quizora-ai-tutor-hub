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
    <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-card/50 to-card border border-border/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${getRequestTypeColor(request.request_type)}`}>
            <IconComponent className="w-6 h-6" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="font-medium">
                {getRequestTypeName(request.request_type)}
              </Badge>
              
              <Badge variant="outline" className="gap-1.5">
                <Coins className="w-3 h-3 text-yellow-500" />
                {request.credits_used} كريدت
              </Badge>
              
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-accent" />
                <span>{formatDate(request.created_at)}</span>
              </div>
            </div>
            
            <CardDescription className="text-foreground/80 leading-relaxed">
              {getContentPreview()}
            </CardDescription>
          </div>
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {canResume(request.request_type) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResume}
                className="hover:bg-primary/10 hover:text-primary"
                title="استكمال"
              >
                <Play className="w-4 h-4" />
              </Button>
            )}
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="hover:bg-primary/10">
                  <Eye className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <IconComponent className="w-5 h-5 text-primary" />
                    {getRequestTypeName(request.request_type)}
                  </DialogTitle>
                </DialogHeader>
                
                <ScrollArea className="h-[60vh] mt-4">
                  <div className="space-y-6 pr-4">
                    {/* Request details */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground">تفاصيل الطلب:</h4>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="whitespace-pre-wrap">{request.prompt || getContentPreview()}</p>
                      </div>
                    </div>

                    {/* Response */}
                    {request.response && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground">الرد:</h4>
                        <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                          <p className="whitespace-pre-wrap leading-relaxed">{request.response}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                <div className="flex gap-2 pt-4 border-t">
                  {request.response && (
                    <Button variant="outline" onClick={copyResponse} className="flex-1">
                      <Copy className="w-4 h-4 mr-2" />
                      نسخ الرد
                    </Button>
                  )}
                  {canResume(request.request_type) && (
                    <Button onClick={handleResume} className="flex-1">
                      <Play className="w-4 h-4 mr-2" />
                      استكمال العمل
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