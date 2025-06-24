import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLanguage } from './LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mic, Send, History, Volume2, VolumeX, MessageCircle, Square } from 'lucide-react';
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
  const [speechToSpeechMode, setSpeechToSpeechMode] = useState(false);
  const [isUsingElevenLabs, setIsUsingElevenLabs] = useState(false);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
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

  // Send message mutation with abort controller
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      // Create abort controller for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsGeneratingResponse(true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageText,
            userId: userId,
            toneMode: toneMode,
            language: language,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } finally {
        setIsGeneratingResponse(false);
        abortControllerRef.current = null;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat', userId] });
      setMessage('');
      // Automatically speak Bonita's response with ElevenLabs
      if (data && data.content) {
        setTimeout(() => speakMessage(data.content), 500); // Small delay for better UX
      }
    },
    onError: (error: any) => {
      if (error.name === 'AbortError') {
        toast({
          title: "Response Stopped",
          description: "Bonita's response was stopped.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
        console.error('Send message error:', error);
      }
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startVoiceRecording = (autoSend = false) => {
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
    
    // Set up multilingual recognition - try current language first, then auto-detect
    const currentLang = language === 'en' ? 'en-US' : 
                       language === 'es' ? 'es-ES' : 
                       language === 'pt' ? 'pt-BR' : 'fr-FR';
    recognition.lang = currentLang;

    recognition.onstart = () => {
      setIsListening(true);
      if (speechToSpeechMode) {
        // Stop any ongoing speech when starting to listen
        stopSpeaking();
      }
    };
    
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
      
      // Auto-send in speech-to-speech mode
      if (autoSend || speechToSpeechMode) {
        setTimeout(() => {
          // Trigger message send
          sendMessageMutation.mutate({
            userId,
            message: transcript.trim(),
            language,
            toneMode,
          });
        }, 100);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      toast({
        title: "Voice Recognition Error",
        description: "Voice recognition failed. Please try again.",
        variant: "destructive",
      });
      setIsListening(false);
    };

    recognition.start();
  };

  // ElevenLabs speech functionality with fallback to browser TTS
  const speakMessage = async (text: string) => {
    setIsSpeaking(true);
    
    try {
      // Try ElevenLabs first for high-quality speech
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          toneMode,
          language,
        }),
      });

      if (response.ok) {
        setIsUsingElevenLabs(true);
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsSpeaking(false);
          setIsUsingElevenLabs(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = () => {
          setIsSpeaking(false);
          setIsUsingElevenLabs(false);
          URL.revokeObjectURL(audioUrl);
          // Fallback to browser TTS
          fallbackToWebSpeech(text);
        };

        await audio.play();
      } else {
        // Fallback to browser TTS if ElevenLabs fails
        fallbackToWebSpeech(text);
      }
    } catch (error) {
      console.error('ElevenLabs speech error:', error);
      // Fallback to browser TTS
      fallbackToWebSpeech(text);
    }
  };

  // Fallback to browser TTS
  const fallbackToWebSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setIsSpeaking(false);
      toast({
        title: "Speech Not Available",
        description: "Speech synthesis is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    setIsUsingElevenLabs(false);
    
    // Stop any current speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice for Bonita's personality
    utterance.rate = 0.85;
    utterance.pitch = 0.9;
    utterance.volume = 0.8;
    
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
    // Stop ElevenLabs audio if playing
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    
    // Stop browser TTS as fallback
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsUsingElevenLabs(false);
  };

  const stopResponse = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGeneratingResponse(false);
    }
  };

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/chat/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat', userId] });
      toast({
        title: "History Cleared",
        description: "Chat history has been cleared successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear chat history. Please try again.",
        variant: "destructive",
      });
    },
  });

  const clearHistory = () => {
    clearHistoryMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Chat Header */}
      <div className="p-6 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t('chatHeader')}</h2>
            <p className="text-muted-foreground">
              {t('chatSubtitle')}
              {speechToSpeechMode && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  {t('speechToSpeechMode')}
                </span>
              )}
              {isSpeaking && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <Volume2 className="w-3 h-3 mr-1" />
                  Speaking...
                </span>
              )}
              {isGeneratingResponse && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <div className="w-3 h-3 mr-1 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Bonita is thinking...
                </span>
              )}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              size="icon" 
              variant={speechToSpeechMode ? "default" : "outline"}
              onClick={() => setSpeechToSpeechMode(!speechToSpeechMode)}
              className={speechToSpeechMode ? "bg-green-600 hover:bg-green-700" : ""}
              title={t('speechToSpeechMode')}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant={isSpeaking ? "default" : "outline"}
              onClick={isSpeaking ? stopSpeaking : () => {}}
              className={isSpeaking ? "animate-pulse" : ""}
              title={isSpeaking ? t('stopSpeaking') : t('voiceChat')}
            >
              {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button 
              variant="outline" 
              onClick={clearHistory}
              disabled={clearHistoryMutation.isPending}
            >
              <History className="mr-2 h-4 w-4" />
              {clearHistoryMutation.isPending ? "Clearing..." : t('clearHistory')}
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-6">
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
                        title={t('speakMessage')}
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
      </div>

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
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                speechToSpeechMode ? 'bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800' : ''
              }`}
              onClick={() => startVoiceRecording(speechToSpeechMode)}
              disabled={isListening}
              title={speechToSpeechMode ? t('voiceChat') : "Voice Input"}
            >
              <Mic className={`h-4 w-4 ${
                isListening ? 'animate-pulse text-red-500' : 
                speechToSpeechMode ? 'text-green-600' : ''
              }`} />
            </Button>
          </div>
          {isGeneratingResponse ? (
            <Button 
              onClick={stopResponse}
              variant="destructive"
              className="animate-pulse"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="glow"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
