import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import AIResponse from "@/components/ai/AIResponse";
import { 
  MessageCircle, 
  Calendar, 
  Coins, 
  Eye,
  Trash2,
  Clock,
  User,
  Bot,
  Copy,
  Share,
  Play
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConversationMessage {
  id: string;
  message_type: string;
  content: string;
  created_at: string;
  credits_used: number;
}

interface Conversation {
  id: string;
  session_id: string;
  title: string;
  total_credits_used: number;
  created_at: string;
  updated_at: string;
  messages: ConversationMessage[];
  message_count: number;
}

interface ConversationCardProps {
  conversation: Conversation;
  onDelete: (sessionId: string) => Promise<void>;
  onContinue?: (sessionId: string) => void;
}

export function ConversationCard({ conversation, onDelete, onContinue }: ConversationCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(conversation.session_id);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue(conversation.session_id);
    }
  };

  const copyContent = () => {
    const content = conversation.messages
      .map(msg => `${msg.message_type === 'user' ? 'المستخدم' : 'الذكاء الاصطناعي'}: ${msg.content}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(content);
    toast({
      title: "تم النسخ",
      description: "تم نسخ محتوى المحادثة",
    });
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

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-card/50 to-card border border-border/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {conversation.title}
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-accent" />
                <span>{formatDate(conversation.updated_at)}</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-blue-500" />
                <span>{conversation.message_count} رسالة</span>
              </div>
              
              <Badge variant="secondary" className="gap-1.5">
                <Coins className="w-3 h-3 text-yellow-500" />
                {conversation.total_credits_used} كريدت
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onContinue && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleContinue}
                className="hover:bg-primary/10 hover:text-primary"
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
                    <MessageCircle className="w-5 h-5 text-primary" />
                    {conversation.title}
                  </DialogTitle>
                </DialogHeader>
                
                <ScrollArea className="h-[60vh] mt-4">
                  <div className="space-y-4 pr-4">
                    {conversation.messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 ${
                          message.message_type === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div className={`flex gap-3 max-w-[80%] ${
                          message.message_type === 'user' ? 'flex-row-reverse' : 'flex-row'
                        }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            message.message_type === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-accent text-accent-foreground'
                          }`}>
                            {message.message_type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                          </div>
                          
                          <div className={`p-4 rounded-xl ${
                            message.message_type === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}>
                            {message.message_type === 'assistant' ? (
                              <AIResponse 
                                response={message.content} 
                                model="gemini" 
                                type={(() => {
                                  // كشف أكثر دقة لنوع المحتوى
                                  const content = message.content.toLowerCase();
                                  
                                  // كشف الخرائط الذهنية بناءً على هيكل JSON
                                  if ((content.includes('"branches"') || content.includes('"branch"')) && 
                                      (content.includes('"title"') || content.includes('"name"'))) {
                                    return "mindmap";
                                  }
                                  
                                  // كشف الجداول - سيتم معالجتها كنص
                                  if (content.includes('|') && content.includes('---')) {
                                    return "text";
                                  }
                                  
                                  return "text";
                                })()}
                                isLoading={false}
                              />
                            ) : (
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={copyContent} className="flex-1">
                    <Copy className="w-4 h-4 mr-2" />
                    نسخ المحادثة
                  </Button>
                  {onContinue && (
                    <Button onClick={handleContinue} className="flex-1">
                      <Play className="w-4 h-4 mr-2" />
                      استكمال المحادثة
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDelete}
              disabled={isDeleting}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {conversation.messages.length > 0 && (
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <p className="line-clamp-2">
              <span className="font-medium">آخر رسالة:</span>{" "}
              {conversation.messages[conversation.messages.length - 1]?.content?.slice(0, 150) + 
               (conversation.messages[conversation.messages.length - 1]?.content?.length > 150 ? '...' : '') || 'لا يوجد محتوى'}
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}