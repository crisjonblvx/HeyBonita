import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mic, MicOff, Send, Square, Volume2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { ChatMessage } from '@shared/schema';
import bonitaLogo from '@assets/Bonita logo 1 alpha_1750814378445.png';

interface BonitaChatProps {
  voiceMode: 'text-to-speech' | 'speech-to-speech' | 'off';
  userId: number;
  toneMode: string;
  responseMode: string;
  onResponseModeChange: (mode: string) => void;
}

export default function BonitaChat({ voiceMode, userId, toneMode, responseMode }: BonitaChatProps) {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ['/api/messages'],
  }) as { data: ChatMessage[] };

  // Show greeting if no messages
  const shouldShowGreeting = Array.isArray(messages) && messages.length === 0;

  // Auto-speak greeting on load
  useEffect(() => {
    if (shouldShowGreeting && (voiceMode === 'speech-to-speech' || voiceMode === 'text-to-speech')) {
      const greetingText = `Hey there! I'm Bonita, your Digital Bronx Auntie! Ready to chat, create some fire content, or get real talk about whatever's on your mind? I'm here to help you level up. What's good?`;
      setTimeout(() => {
        handleAutoSpeech(greetingText);
      }, 1000);
    }
  }, [shouldShowGreeting, voiceMode]);

  // Create greeting message for display
  const greetingMessage = {
    id: 'greeting',
    role: 'assistant' as const,
    content: `Hey there! I'm Bonita, your Digital Bronx Auntie! 🎤 

Ready to chat, create some fire content, or get real talk about whatever's on your mind? I'm here to help you level up - whether that's brainstorming video scripts, generating images, or just having a conversation with someone who gets it.

What's good? Drop me a message and let's get this started! 💫`,
    createdAt: new Date(),
    userId: userId
  };

  // Handle auto-speech with ElevenLabs only - mobile optimized
  const handleAutoSpeech = async (content: string) => {
    console.log('🎤 Starting ElevenLabs speech generation');
    setIsSpeaking(true);
    
    try {
      const response = await fetch('/api/elevenlabs/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Essential for session cookies on mobile
        body: JSON.stringify({
          text: content,
          toneMode: toneMode || 'sweet-nurturing',
          language: language || 'en'
        })
      });

      if (!response.ok) {
        console.error(`ElevenLabs API failed: ${response.status}`);
        setIsSpeaking(false);
        return; // Fail silently - no fallback UI
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      // Mobile-specific audio settings
      audio.preload = 'auto';
      audio.playsInline = true;
      
      audio.onplay = () => {
        console.log('🎤 ElevenLabs audio started playing');
        setIsSpeaking(true);
      };
      
      audio.onended = () => {
        console.log('🎤 ElevenLabs audio finished');
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };
      
      audio.onerror = (e) => {
        console.error('🎤 ElevenLabs audio playback error:', e);
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };

      // Mobile audio handling - trigger within user interaction context
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        console.log('🎤 Mobile device detected - playing audio immediately');
        // For mobile, we need to play immediately within the user interaction context
        await audio.play();
      } else {
        // Desktop - can play normally
        await audio.play();
      }
      
    } catch (error) {
      console.error('ElevenLabs speech error:', error);
      setIsSpeaking(false);
      // No toast notification - fail silently
    }
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      console.log('🚀 sendMessageMutation.mutationFn called with:', content);
      setIsGeneratingResponse(true);
      
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();
      
      console.log('🚀 About to fetch /api/chat');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Essential for session cookies on mobile
        body: JSON.stringify({ 
          message: content,
          language: language,
          toneMode: toneMode || 'sweet-nurturing',
          responseMode: responseMode || 'detailed'
        }),
        signal: abortControllerRef.current.signal,
      });
      
      console.log('🚀 Fetch response received:', response.status, response.ok);
      
      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🚀 Response data received:', data);
      return data;
    },
    onSuccess: async (data) => {
      setMessage('');
      setIsGeneratingResponse(false);
      abortControllerRef.current = null;
      
      // Invalidate messages to refresh
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      
      // Auto-speak response for both voice modes using ElevenLabs
      if ((voiceMode === 'speech-to-speech' || voiceMode === 'text-to-speech') && data && data.content) {
        handleAutoSpeech(data.content);
      }
    },
    onError: (error: any) => {
      setIsGeneratingResponse(false);
      abortControllerRef.current = null;
      
      if (error.name === 'AbortError') {
        console.log('Request was cancelled by user');
        return;
      }
      
      console.error('🚨 Chat error:', error);
      console.error('🚨 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Stop generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGeneratingResponse(false);
    }
    
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsSpeaking(false);
    }
  };

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

    setIsListening(true);
    
    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      console.log('🎤 Speech Recognition available:', !!SpeechRecognition);
      console.log('🎤 webkitSpeechRecognition:', !!(window as any).webkitSpeechRecognition);
      console.log('🎤 SpeechRecognition:', !!(window as any).SpeechRecognition);
      
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-BR' : language === 'fr' ? 'fr-FR' : 'en-US';
      recognition.maxAlternatives = 3;
      
      console.log('🎤 Recognition configured:', {
        continuous: recognition.continuous,
        interimResults: recognition.interimResults,
        lang: recognition.lang,
        maxAlternatives: recognition.maxAlternatives
      });
      
      recognition.onresult = (event: any) => {
        const results = Array.from(event.results);
        
        // Get final result
        const finalResults = results.filter((result: any) => result.isFinal);
        if (finalResults.length > 0) {
          const result = finalResults[finalResults.length - 1] as any;
          let transcript = result[0]?.transcript || '';
          
          // Use highest confidence alternative if available
          if (result.length > 1) {
            let bestTranscript = transcript;
            let bestConfidence = result[0]?.confidence || 0;
            
            for (let i = 1; i < result.length; i++) {
              const altConfidence = result[i]?.confidence || 0;
              if (altConfidence > bestConfidence) {
                bestTranscript = result[i]?.transcript || bestTranscript;
                bestConfidence = altConfidence;
              }
            }
            transcript = bestTranscript;
          }
          
          console.log('🎤 Speech recognition result:', transcript);
          setMessage(transcript);
          
          if (autoSend && transcript.trim()) {
            console.log('🎤 Auto-sending message:', transcript.trim());
            // Create a dummy audio element to maintain user interaction context for mobile
            const dummyAudio = new Audio();
            dummyAudio.muted = true;
            dummyAudio.play().catch(() => {}); // This maintains the user gesture context
            
            // Immediate send for mobile compatibility
            sendMessageMutation.mutate(transcript.trim());
          }
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error !== 'aborted') {
          toast({
            title: "Voice Input Error",
            description: "Could not process voice input. Please try again.",
            variant: "destructive",
          });
        }
      };
      
      recognition.onend = () => {
        console.log('🎤 Speech recognition ended');
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('🎤 Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'no-speech') {
          toast({
            title: "No Speech Detected",
            description: "I didn't hear anything. Please try speaking again.",
            variant: "destructive",
          });
        } else if (event.error === 'network') {
          toast({
            title: "Network Error",
            description: "Speech recognition failed due to network issues. Please try again.",
            variant: "destructive",
          });
        }
      };
      
      recognition.start();
      
      // Auto-stop after 25 seconds
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

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {/* Show greeting if no messages */}
        {shouldShowGreeting && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={bonitaLogo} alt="Bonita" />
              </Avatar>
              <Card className="p-3 bg-card">
                <div className="whitespace-pre-wrap text-sm">{greetingMessage.content}</div>
                {isSpeaking && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Volume2 className="w-3 h-3 animate-pulse" />
                    <span>Speaking...</span>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
        
        {/* Regular messages */}
        {Array.isArray(messages) && messages.map((msg: ChatMessage) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <Avatar className="w-8 h-8 flex-shrink-0">
                {msg.role === 'assistant' ? (
                  <AvatarImage src={bonitaLogo} alt="Bonita" />
                ) : (
                  <AvatarFallback>You</AvatarFallback>
                )}
              </Avatar>
              <Card className={`p-3 ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card'
              }`}>
                <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
              </Card>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isGeneratingResponse && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={bonitaLogo} alt="Bonita" />
              </Avatar>
              <Card className="p-3 bg-card">
                <div className="flex items-center gap-2">
                  <div className="animate-pulse">Bonita is thinking...</div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleStopGeneration}
                    className="h-6 px-2"
                  >
                    <Square className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[60px] resize-none"
              disabled={isGeneratingResponse}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            {/* Voice input buttons */}
            {voiceMode === 'speech-to-speech' && (
              <Button
                size="icon"
                variant={isListening ? "destructive" : "outline"}
                onClick={() => startVoiceRecording(true)}
                disabled={isGeneratingResponse || isSpeaking}
                className="h-[60px]"
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
            )}
            
            {voiceMode === 'text-to-speech' && (
              <Button
                size="icon"
                variant="outline"
                onClick={() => startVoiceRecording(false)}
                disabled={isGeneratingResponse || isSpeaking}
                className="h-[30px]"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}
            
            {/* Send button */}
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!message.trim() || isGeneratingResponse}
              className={voiceMode === 'speech-to-speech' ? "h-[60px]" : "h-[30px]"}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Speaking indicator - clean version without manual controls */}
        {isSpeaking && (
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>Bonita is speaking...</span>
          </div>
        )}
      </div>
    </div>
  );
}