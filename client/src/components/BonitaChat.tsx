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
import { playAudio, stopAudio, isAudioPlaying } from '@/lib/audioController';
import { AchievementToast } from '@/components/Gamification';
import { JoyRiverButtons } from '@/components/JoyRiverButtons';
import { trackEvent } from '@/lib/analytics';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface BonitaChatProps {
  userId: number;
  toneMode: 'sweet-nurturing' | 'tough-love';
  responseMode: 'quick' | 'detailed';
  voiceMode: 'text-to-speech' | 'speech-to-speech';
}

export function BonitaChat({ userId, toneMode, responseMode, voiceMode }: BonitaChatProps) {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUsingElevenLabs, setIsUsingElevenLabs] = useState(false);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Add global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Check if this is an abort error that we can safely ignore
      if (event.reason?.name === 'AbortError' || event.reason?.message?.includes('aborted')) {
        event.preventDefault(); // Prevent the error from being logged to console
        return;
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  // Fetch chat history
  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ['/api/chat', userId],
    queryFn: async () => {
      const response = await fetch(`/api/chat/${userId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!userId,
    staleTime: 0,
    retry: 3,
    retryDelay: 1000
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
            responseMode: responseMode,
            language: language,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return { ...data, originalMessage: messageText };
      } finally {
        setIsGeneratingResponse(false);
        abortControllerRef.current = null;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/achievements', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/receipts', userId] });
      setMessage('');
      
      // Auto-create receipt for meaningful conversations
      if (data.content && data.content.length > 50) {
        const conversationTitle = data.content.substring(0, 60).replace(/[^\w\s]/g, '').trim() + '...';
        
        // Create receipt entry for this conversation
        fetch('/api/receipts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'conversation',
            title: conversationTitle,
            content: `User: ${data.originalMessage}\n\nBonita: ${data.content}`,
            priority: 'medium'
          }),
          credentials: 'include'
        }).catch(err => console.log('Receipt creation error:', err));
      }
      
      // Show gamification rewards
      if (data.gamification) {
        const { pointsEarned, newAchievements, levelUp, newLevel } = data.gamification;
        
        if (newAchievements.length > 0 || levelUp || pointsEarned > 0) {
          toast({
            title: "Rewards Earned!",
            description: (
              <AchievementToast
                achievements={newAchievements}
                points={pointsEarned}
                levelUp={levelUp}
                newLevel={newLevel}
              />
            ),
            duration: 5000,
          });
        }
      }
      
      // Auto-speak response in speech-to-speech mode with mobile optimization
      if (voiceMode === 'speech-to-speech' && data && data.content) {
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const delay = isMobile ? 800 : 500; // Longer delay for mobile
        
        setTimeout(() => {
          speakMessage(data.content);
        }, delay);
      } else if (voiceMode === 'text-to-speech' && data && data.content) {
        // For text-to-speech mode, only speak if user manually triggers it
        // This prevents automatic speech in text-to-speech mode
      }
    },
    onError: (error: any) => {
      // Check if this is an abort error (user stopped the request)
      if (error.name === 'AbortError' || error.message?.includes('aborted') || error.code === 20) {
        // Don't show error toast for user-initiated stops - they already see the "Stopped" message
        return;
      } else {
        console.error('Send message error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          error: error
        });
        toast({
          title: "Error",
          description: error.message || "Failed to send message. Please try again.",
          variant: "destructive",
        });
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
    // Check for Web Speech API support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice Not Available",
        description: "Speech recognition isn't supported in this browser. Open this app in Chrome, Safari, or Edge to use voice features.",
        variant: "destructive",
      });
      return;
    }

    // Check for microphone permissions
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
        if (result.state === 'denied') {
          toast({
            title: "Microphone Access Denied",
            description: "Please enable microphone permissions in your browser settings to use voice input.",
            variant: "destructive",
          });
          return;
        }
      });
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Enhanced settings for better reliability
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      // Set language based on current locale
      const languageMap: Record<string, string> = {
        'en': 'en-US',
        'es': 'es-ES',
        'pt': 'pt-BR',
        'fr': 'fr-FR'
      };
      recognition.lang = languageMap[language] || 'en-US';

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        if (voiceMode === 'speech-to-speech') {
          stopSpeaking();
        }
      };
      
      recognition.onresult = (event: any) => {
        try {
          if (event.results && event.results.length > 0) {
            const transcript = event.results[0][0].transcript.trim();
            console.log('Speech transcript:', transcript);
            
            if (transcript) {
              setMessage(transcript);
              
              // Auto-send in speech-to-speech mode
              if (autoSend || voiceMode === 'speech-to-speech') {
                const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                const delay = isMobile ? 500 : 200;
                
                setTimeout(() => {
                  if (transcript.trim()) {
                    sendMessageMutation.mutate(transcript);
                  }
                }, delay);
              }
            }
          }
        } catch (error) {
          console.error('Error processing speech result:', error);
          toast({
            title: "Speech Processing Error",
            description: "Failed to process your speech. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsListening(false);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error, event);
        const wasListening = isListening; // Capture state before changing it
        setIsListening(false);
        
        // Only show toast errors when user was actively trying to use speech recognition
        if (!wasListening) {
          return; // Don't show errors if user wasn't actively using speech
        }
        
        let errorMessage = "Voice recognition failed. Please try again.";
        let title = "Voice Recognition Error";
        
        switch(event.error) {
          case 'not-allowed':
            title = "Microphone Access Denied";
            errorMessage = "Please enable microphone permissions in your browser settings and refresh the page.";
            break;
          case 'no-speech':
            title = "No Speech Detected";
            errorMessage = "Please speak clearly into your microphone and try again.";
            break;
          case 'network':
            title = "Voice Service Unavailable";
            errorMessage = "Speech recognition service is temporarily unavailable. Please try typing your message instead.";
            break;
          case 'audio-capture':
            title = "Microphone Error";
            errorMessage = "Unable to access your microphone. Please check your device settings.";
            break;
          case 'aborted':
            // Don't show error for user-cancelled recognition
            return;
          case 'service-not-allowed':
            title = "Service Not Available";
            errorMessage = "Speech recognition service is not available. Please try again later.";
            break;
        }
        
        toast({
          title,
          description: errorMessage,
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };

      // Start recognition with error handling
      recognition.start();
      
      // Auto-stop after 25 seconds to give users time to collect thoughts
      setTimeout(() => {
        if (isListening) {
          try {
            recognition.stop();
          } catch (e) {
            console.warn('Error stopping recognition:', e);
          }
        }
      }, 25000);
      
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      setIsListening(false);
      toast({
        title: "Voice Setup Error",
        description: "Unable to initialize voice recording. Please check your browser and microphone settings.",
        variant: "destructive",
      });
    }
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
        
        // Store reference to current audio for stopping
        currentAudioRef.current = audio;
        
        audio.onended = () => {
          setIsSpeaking(false);
          setIsUsingElevenLabs(false);
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
        };
        
        audio.onerror = () => {
          setIsSpeaking(false);
          setIsUsingElevenLabs(false);
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
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

  // Apply speech personality corrections for browser TTS
  const applyBrowserSpeechCorrections = (text: string): string => {
    let corrected = text;
    
    // Pronunciation aids for browser TTS
    const corrections = {
      "Chile": "Childe", // Pronounced like "child" with soft d
      "2025": "Twenty Twenty-five",
      "aight": "alright",
      "preciate": "appreciate",
      "fixin' to": "about to",
      "gonna": "going to",
      "nah": "no",
      "boo": "boo", // Keep endearing terms
      "sugar": "sugar"
    };
    
    for (const [term, replacement] of Object.entries(corrections)) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      corrected = corrected.replace(regex, replacement);
    }
    
    return corrected;
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
    
    // Apply pronunciation corrections for browser TTS
    const correctedText = applyBrowserSpeechCorrections(text);
    const utterance = new SpeechSynthesisUtterance(correctedText);
    
    // Configure voice for Bonita's personality - faster speech
    utterance.rate = 1.1; // Increased from 0.85 for faster speech
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
    // Stop global audio controller
    stopAudio();
    
    // Stop current ElevenLabs audio if playing
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    
    // Stop browser TTS as fallback
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsUsingElevenLabs(false);
  };

  const stopGeneration = () => {
    // Stop text generation by aborting the request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Reset generation state
    setIsGeneratingResponse(false);
    
    // Stop all speech immediately
    setIsSpeaking(false);
    setIsUsingElevenLabs(false);
    
    // Cancel browser speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Stop any playing audio elements
    stopAudio();
    
    // Stop current ElevenLabs audio if playing
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    
    // Stop any HTML5 audio elements that might be playing
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    
    toast({
      title: "Stopped",
      description: "Bonita's response was stopped.",
    });
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

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">Chat Unavailable</h3>
            <p className="text-sm max-w-md mx-auto">
              Unable to load chat history. Please try refreshing the page.
            </p>
          </div>
          <Button 
            onClick={() => queryClient.refetchQueries({ queryKey: ['/api/chat', userId] })}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
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
            <div className="text-muted-foreground">
              <p>{t('chatSubtitle')}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {voiceMode === 'speech-to-speech' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    {t('speechToSpeechMode')}
                  </span>
                )}
                {isSpeaking && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Volume2 className="w-3 h-3 mr-1" />
                    Speaking...
                  </span>
                )}
                {isGeneratingResponse && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    <div className="w-3 h-3 mr-1 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Bonita is thinking...
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              size="icon" 
              variant={(isSpeaking || isGeneratingResponse) ? "destructive" : "outline"}
              onClick={(isSpeaking || isGeneratingResponse) ? stopGeneration : () => {}}
              className={(isSpeaking || isGeneratingResponse) ? "animate-pulse" : ""}
              title={(isSpeaking || isGeneratingResponse) ? "Stop Processing" : "Audio Ready"}
            >
              {(isSpeaking || isGeneratingResponse) ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
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
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
            {/* Welcome message */}
            <div className="flex items-start space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src="/images/bonita-logo-alpha.png" />
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
                    <AvatarImage src="/images/bonita-logo-alpha.png" />
                    <AvatarFallback>B</AvatarFallback>
                  </Avatar>
                )}
                <div className={`chat-bubble rounded-2xl px-4 py-3 relative group ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <p>{msg.content.replace('[JOY_RIVER_BUTTONS]', '').replace(/\[Response was cut short - would you like me to continue\?\]/g, '')}</p>
                  {msg.role === 'assistant' && msg.content.includes('[JOY_RIVER_BUTTONS]') && (
                    <JoyRiverButtons 
                      onButtonClick={(action) => {
                        trackEvent('joy_river_button_click', { action }, userId);
                      }}
                    />
                  )}
                  {msg.role === 'assistant' && msg.content.includes('[Response was cut short - would you like me to continue?]') && (
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const continueMessage = "Please continue your previous response.";
                          setMessage(continueMessage);
                          sendMessageMutation.mutate(continueMessage);
                        }}
                        className="text-xs"
                      >
                        Continue Response
                      </Button>
                    </div>
                  )}
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
                        onClick={() => speakMessage(msg.content.replace('[JOY_RIVER_BUTTONS]', ''))}
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
                voiceMode === 'speech-to-speech' ? 'bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800' : ''
              }`}
              onClick={() => {
                // Add haptic feedback for mobile
                if ('vibrate' in navigator) {
                  navigator.vibrate(50);
                }
                startVoiceRecording(voiceMode === 'speech-to-speech');
              }}
              disabled={isListening || sendMessageMutation.isPending}
              title={voiceMode === 'speech-to-speech' ? t('voiceChat') : "Voice Input"}
            >
              <Mic className={`h-4 w-4 ${
                isListening ? 'animate-pulse text-red-500' : 
                voiceMode === 'speech-to-speech' ? 'text-green-600' : ''
              }`} />
            </Button>
          </div>
          {(isGeneratingResponse || sendMessageMutation.isPending) ? (
            <Button 
              onClick={stopGeneration}
              variant="destructive"
              className="animate-pulse"
              title="Stop Bonita's response"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="glow"
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
