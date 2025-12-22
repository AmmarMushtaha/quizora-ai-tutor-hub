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
  title: string | null;
  total_credits_used: number;
  created_at: string;
  updated_at: string;
  messages: ConversationMessage[];
  message_count: number;
}

interface ConversationCardProps {
  conversation: Conversation;
  onDelete: (id: string) => Promise<void>;
  onContinue?: (id: string) => void;
}

export function ConversationCard({ conversation, onDelete, onContinue }: ConversationCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(conversation.id);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue(conversation.id);
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
    <Card className="group hover:shadow-md transition-all duration-200 bg-card border border-border/50">
      <CardHeader className="p-3 md:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 space-y-1.5">
            <CardTitle className="text-sm md:text-base line-clamp-2">
              {conversation.title}
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(conversation.updated_at)}
              </span>
              
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {conversation.message_count}
              </span>
              
              <Badge variant="secondary" className="gap-1 text-xs py-0">
                <Coins className="w-2.5 h-2.5 text-yellow-500" />
                {conversation.total_credits_used}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-1 shrink-0">
            {onContinue && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleContinue}
                className="h-7 w-7 p-0"
              >
                <Play className="w-3.5 h-3.5" />
              </Button>
            )}

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Eye className="w-3.5 h-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[85vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    <span className="truncate">{conversation.title}</span>
                  </DialogTitle>
                </DialogHeader>
                
                <ScrollArea className="h-[50vh] md:h-[60vh] mt-3">
                  <div className="space-y-3 pr-3">
                    {conversation.messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex gap-2 ${
                          message.message_type === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div className={`flex gap-2 max-w-[85%] ${
                          message.message_type === 'user' ? 'flex-row-reverse' : 'flex-row'
                        }`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            message.message_type === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}>
                            {message.message_type === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                          </div>
                          
                          <div className={`p-2.5 rounded-lg text-sm ${
                            message.message_type === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}>
                            {message.message_type === 'assistant' ? (
                              <AIResponse 
                                response={message.content} 
                                model="gemini" 
                                type="text"
                                isLoading={false}
                              />
                            ) : (
                              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="flex gap-2 pt-3 border-t">
                  <Button variant="outline" onClick={copyContent} size="sm" className="flex-1">
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    نسخ
                  </Button>
                  {onContinue && (
                    <Button onClick={handleContinue} size="sm" className="flex-1">
                      <Play className="w-3.5 h-3.5 mr-1.5" />
                      استكمال
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {conversation.messages.length > 0 && (
        <CardContent className="pt-0 px-3 pb-3 md:px-4 md:pb-4">
          <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg line-clamp-2">
            {conversation.messages[conversation.messages.length - 1]?.content?.slice(0, 100) + 
             (conversation.messages[conversation.messages.length - 1]?.content?.length > 100 ? '...' : '') || 'لا يوجد محتوى'}
          </div>
        </CardContent>
      )}
    </Card>
  );
}