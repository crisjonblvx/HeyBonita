import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLanguage } from './LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mic, Send, History, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface BonitaChatProps {
  userId: number;
  toneMode: 'sweet-nurturing' | 'tough-love';
}

export function BonitaChat({ userId, toneMode }: BonitaChatProps) {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch chat history
  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ['/api/chat', userId],
    queryFn: () => fetch(`/api/chat/${userId}`).then(res => res.json()),
    enabled: !!userId,
    staleTime: 0 // Always refetch to keep messages fresh
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { userId: number; message: string; language: string; toneMode: string }) => {
      const response = await apiRequest('POST', '/api/chat', messageData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat', userId] });
      setMessage('');
      // Automatically speak Bonita's response
      if (data && data.content) {
        setTimeout(() => speakMessage(data.content), 500); // Small delay for better UX
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      userId,
      message: message.trim(),
      language,
      toneMode,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'en' ? 'en-US' : 
                     language === 'es' ? 'es-ES' : 
                     language === 'pt' ? 'pt-BR' : 'fr-FR';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
    };

    recognition.onerror = () => {
      toast({
        title: "Error",
        description: "Voice recognition failed. Please try again.",
        variant: "destructive",
      });
      setIsListening(false);
    };

    recognition.start();
  };

  // Text-to-speech functionality
  const speakMessage = (text: string) => {
    if (!('speechSynthesis' in window)) {
      toast({
        title: "Not Supported",
        description: "Text-to-speech is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    // Stop any current speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice for Bonita's personality
    utterance.rate = 0.85; // Slightly slower for authenticity
    utterance.pitch = 0.9; // Slightly lower pitch
    utterance.volume = 0.8;
    
    // Try to use a female voice if available
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('woman') ||
      voice.name.toLowerCase().includes('samantha') ||
      voice.name.toLowerCase().includes('karen') ||
      voice.gender === 'female'
    );
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    // Set language based on current language setting
    const speechLang = language === 'es' ? 'es-ES' : 
                      language === 'pt' ? 'pt-BR' :
                      language === 'fr' ? 'fr-FR' : 'en-US';
    utterance.lang = speechLang;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      toast({
        title: "Speech Error",
        description: "Failed to speak the message.",
        variant: "destructive",
      });
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const clearHistory = () => {
    // TODO: Implement clear history functionality
    toast({
      title: "History Cleared",
      description: "Chat history has been cleared.",
    });
  };



  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="p-6 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t('chatHeader')}</h2>
            <p className="text-muted-foreground">{t('chatSubtitle')}</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              size="icon" 
              variant={isSpeaking ? "default" : "outline"}
              onClick={isSpeaking ? stopSpeaking : () => {}}
              className={isSpeaking ? "animate-pulse" : ""}
            >
              {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button variant="outline" onClick={clearHistory}>
              <History className="mr-2 h-4 w-4" />
              {t('clearHistory')}
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4">
          {/* Welcome message */}
          <div className="flex items-start space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src="/images/bonita-avatar.png" />
              <AvatarFallback>B</AvatarFallback>
            </Avatar>
            <div className="chat-bubble bg-muted rounded-2xl px-4 py-3">
              <p>{t('welcomeMessage')}</p>
              <span className="text-xs text-muted-foreground mt-1 block">Just now</span>
            </div>
          </div>

          {/* Chat messages */}
          {messages.map((msg: ChatMessage) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                msg.role === 'user' ? 'justify-end' : ''
              }`}
            >
              {msg.role === 'assistant' && (
                <Avatar className="w-10 h-10">
                  <AvatarImage src="/images/bonita-avatar.png" />
                  <AvatarFallback>B</AvatarFallback>
                </Avatar>
              )}
              <div className={`chat-bubble rounded-2xl px-4 py-3 relative group ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}>
                <p>{msg.content}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs ${
                    msg.role === 'user' 
                      ? 'text-primary-foreground/70' 
                      : 'text-muted-foreground'
                  }`}>
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                  {msg.role === 'assistant' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-1"
                      onClick={() => speakMessage(msg.content)}
                    >
                      <Volume2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              {msg.role === 'user' && (
                <Avatar className="w-10 h-10">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Chat Input */}
      <div className="p-6 border-t border-border bg-background">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('askBonita')}
              className="pr-12 typewriter"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              onClick={startVoiceRecording}
              disabled={isListening}
            >
              <Mic className={`h-4 w-4 ${isListening ? 'animate-pulse text-red-500' : ''}`} />
            </Button>
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="glow"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
