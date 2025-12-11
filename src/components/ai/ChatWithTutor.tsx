import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, 
  Loader2, 
  MessageSquare, 
  Bot, 
  User, 
  RefreshCw,
  BookOpen,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  creditsUsed?: number;
}

interface ChatWithTutorProps {
  sessionId?: string;
}

const ChatWithTutor = ({ sessionId: providedSessionId }: ChatWithTutorProps) => {
  const { user } = useAuth();
  const { profile, refreshCredits } = useProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => providedSessionId || uuidv4());
  const [answerType, setAnswerType] = useState<'concise' | 'detailed'>('detailed');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history on component mount
  useEffect(() => {
    loadConversationHistory();
  }, [sessionId, user]);

  const loadConversationHistory = async () => {
    if (!user) return;

    try {
      const query = supabase
        .from('conversation_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      
      const { data, error } = await query;

      if (error) {
        console.error('خطأ في تحميل تاريخ المحادثة:', error);
        return;
      }

      if (data && data.length > 0) {
        const loadedMessages: Message[] = data.map((item: any) => ({
          id: item.id,
          type: item.message_type,
          content: item.content,
          timestamp: new Date(item.created_at),
          creditsUsed: item.credits_used
        }));
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('خطأ في تحميل المحادثة:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentMessage.trim()) return;
    
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    // Check minimum credits (at least 1 credit needed)
    if (!profile || profile.credits < 1) {
      toast.error('تحتاج إلى نقطة واحدة على الأقل لإرسال رسالة');
      return;
    }

    setIsLoading(true);

    try {
      // Add user message to UI immediately
      const userMessage: Message = {
        id: uuidv4(),
        type: 'user',
        content: currentMessage,
        timestamp: new Date()
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      const currentMessageText = currentMessage;
      setCurrentMessage('');

      // Prepare messages for API (convert to expected format)
      const apiMessages = updatedMessages.map(msg => ({
        type: msg.type,
        content: msg.content
      }));

      // Call chat API
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          messages: apiMessages,
          sessionId,
          answerType
        }
      });

      if (error) {
        console.error('Chat API error:', error);
        toast.error('حدث خطأ في الاتصال بالمعلم الذكي');
        setMessages(messages); // Revert messages
        return;
      }

      if (!data?.response) {
        toast.error('لم يتم الحصول على رد من المعلم');
        setMessages(messages); // Revert messages
        return;
      }

      const creditsUsed = data.creditsUsed || 1;

      // Check if user has enough credits for the actual response
      if (profile.credits < creditsUsed) {
        toast.error(`الإجابة تحتاج ${creditsUsed} نقاط وليس لديك رصيد كافٍ`);
        setMessages(messages); // Revert messages
        return;
      }

      // Deduct the actual credits used
      const { data: creditResult, error: creditError } = await supabase.rpc('deduct_credits', {
        user_uuid: user.id,
        amount: creditsUsed
      });

      if (creditError || !creditResult) {
        toast.error('فشل في خصم النقاط');
        setMessages(messages); // Revert messages
        return;
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: uuidv4(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        creditsUsed: creditsUsed
      };

      setMessages(prev => [...prev, assistantMessage]);
      refreshCredits();
      
      toast.success(`تم استخدام ${creditsUsed} ${creditsUsed === 1 ? 'نقطة' : 'نقاط'} (${data.responseLength || 0} حرف)`);

    } catch (error) {
      console.error('Error in chat:', error);
      toast.error('حدث خطأ غير متوقع');
      setMessages(messages); // Revert on error
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    // Generate new session ID for new conversation
    window.location.reload();
  };

  const getMinCreditsNeeded = () => 1; // Minimum 1 credit needed

  return (
    <Card className="w-full max-w-4xl mx-auto h-[600px] flex flex-col overflow-hidden">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">المعلم الذكي</CardTitle>
              <p className="text-sm text-muted-foreground">محادثة تفاعلية مع معلم ذكاء اصطناعي</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={startNewConversation}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              محادثة جديدة
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">نوع الإجابة:</label>
            <Select
              value={answerType}
              onValueChange={(value: 'concise' | 'detailed') => setAnswerType(value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    مختصرة
                  </div>
                </SelectItem>
                <SelectItem value="detailed">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    مفصلة
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Badge 
            variant="secondary" 
            className="gap-1"
          >
            <MessageSquare className="w-3 h-3" />
            النقاط حسب طول الإجابة (1-10 نقاط)
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4 max-h-[400px]">
          <div className="space-y-4 pb-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">مرحباً! أنا معلمك الذكي</p>
                <p className="text-sm">اطرح أي سؤال تريد التعلم عنه وسأساعدك في فهمه</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 mb-4 ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.type === 'assistant' && (
                    <Avatar className="w-8 h-8 bg-gradient-to-br from-primary to-accent flex-shrink-0">
                      <AvatarFallback className="text-white">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-3 word-wrap break-words ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed overflow-wrap-anywhere">
                      {message.content}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                      <span>{message.timestamp.toLocaleTimeString('ar-SA')}</span>
                      {message.creditsUsed && (
                        <Badge variant="outline" className="text-xs">
                          {message.creditsUsed} نقاط
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {message.type === 'user' && (
                    <Avatar className="w-8 h-8 bg-secondary flex-shrink-0">
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <Separator className="flex-shrink-0" />

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-4 flex-shrink-0">
          <div className="flex gap-2">
            <Textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="اكتب سؤالك أو استفسارك هنا..."
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              disabled={isLoading || !currentMessage.trim() || !profile || profile.credits < getMinCreditsNeeded()}
              className="px-4 h-[60px]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {profile && profile.credits < getMinCreditsNeeded() && (
            <p className="text-sm text-destructive mt-2">
              تحتاج إلى نقطة واحدة على الأقل لإرسال رسالة
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default ChatWithTutor;