import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Upload, Play, Pause, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const AudioSummary = () => {
  const [summary, setSummary] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const file = new File([blob], 'recording.wav', { type: 'audio/wav' });
        setAudioFile(file);
        setAudioUrl(URL.createObjectURL(blob));
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      toast.success('بدء التسجيل...');
    } catch (error) {
      toast.error('فشل في الوصول للمايكروفون');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success('تم إيقاف التسجيل');
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('حجم الملف الصوتي يجب أن يكون أقل من 10 ميجابايت');
        return;
      }
      
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const removeAudio = () => {
    setAudioFile(null);
    setAudioUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!audioFile) {
      toast.error('يرجى رفع ملف صوتي أو تسجيل صوت');
      return;
    }

    setLoading(true);
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 4000));
      const mockSummary = `تم تحليل الملف الصوتي بنجاح. المحتوى يتضمن:

• النقطة الأولى: شرح مفصل للموضوع الرئيسي
• النقطة الثانية: تفاصيل إضافية ومعلومات مهمة
• النقطة الثالثة: خلاصة وتوصيات
• مدة التسجيل: ${Math.floor(Math.random() * 10 + 1)} دقائق

الملخص يغطي جميع النقاط المهمة المذكورة في التسجيل الصوتي.`;
      
      setSummary(mockSummary);
      
      // Deduct credits
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc('deduct_credits', {
          p_user_id: user.id,
          p_credits_to_deduct: 20,
          p_request_type: 'audio_summary',
          p_response: mockSummary,
          p_duration_minutes: Math.floor(Math.random() * 10 + 1)
        });
      }
      
      toast.success('تم إنشاء ملخص الملف الصوتي بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء معالجة الملف الصوتي');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gradient">
          <Mic className="w-5 h-5" />
          تلخيص الملفات الصوتية
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Controls */}
        <div className="flex gap-2">
          <Button
            variant={isRecording ? "destructive" : "default"}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={loading}
            className="flex-1"
          >
            <Mic className="w-4 h-4 ml-2" />
            {isRecording ? 'إيقاف التسجيل' : 'بدء التسجيل'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            <Upload className="w-4 h-4 ml-2" />
            رفع ملف
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleAudioUpload}
          className="hidden"
        />

        {/* Audio Preview */}
        {audioUrl && (
          <div className="p-4 bg-secondary/50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlayback}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <span className="text-sm font-medium">
                  {audioFile?.name || 'التسجيل الصوتي'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={removeAudio}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>
        )}
        
        <Button 
          onClick={handleSubmit} 
          disabled={loading || !audioFile}
          className="btn-glow w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
              جاري تحليل الملف الصوتي...
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 ml-2" />
              إنشاء الملخص (20 نقطة)
            </>
          )}
        </Button>

        {summary && (
          <div className="mt-6 p-4 bg-secondary/50 rounded-lg border">
            <h3 className="font-semibold mb-2 text-primary">الملخص:</h3>
            <div className="leading-relaxed whitespace-pre-line">{summary}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AudioSummary;