import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Heart, Zap, Brain } from 'lucide-react';
import { useEmotion, useVoiceEmotionAnalyzer, EmotionIndicator, EmotionButton } from './EmotionAdaptiveUI';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onTranscription: (text: string, emotion?: any) => void;
  onRecordingComplete?: (audioBlob: Blob, transcription: string, emotion?: any) => void;
  maxDuration?: number;
  className?: string;
}

export default function EmotionAwareVoiceRecorder({
  onTranscription,
  onRecordingComplete,
  maxDuration = 25000,
  className = ''
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [confidence, setConfidence] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  const { currentEmotion, uiAdaptation } = useEmotion();
  const { analyzeEmotion } = useVoiceEmotionAnalyzer();
  const { toast } = useToast();

  // Audio level monitoring
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setAudioLevel(Math.min(100, (average / 128) * 100));

    animationRef.current = requestAnimationFrame(monitorAudioLevel);
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      
      streamRef.current = stream;

      // Set up audio context for level monitoring
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: BlobPart[] = [];
      mediaRecorder.addEventListener('dataavailable', (event) => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener('stop', async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        if (transcription) {
          setIsProcessing(true);
          
          // Analyze emotion from voice
          const emotionData = await analyzeEmotion(audioBlob, transcription);
          
          onRecordingComplete?.(audioBlob, transcription, emotionData);
          setIsProcessing(false);
        }
      });

      // Set up speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            const confidence = event.results[i][0].confidence;

            if (event.results[i].isFinal) {
              finalTranscript += transcript;
              setConfidence(confidence || 0.8);
            } else {
              interimTranscript += transcript;
            }
          }

          const fullTranscript = finalTranscript || interimTranscript;
          setTranscription(fullTranscript);
          
          if (finalTranscript) {
            onTranscription(finalTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error !== 'no-speech') {
            toast({
              title: 'Voice Recognition',
              description: 'Having trouble hearing you. Please try speaking more clearly.',
              variant: 'default'
            });
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      setTranscription('');
      setConfidence(0);

      // Start monitoring
      monitorAudioLevel();

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 100;
        });
      }, 100);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Recording Error',
        description: 'Unable to access microphone. Please check permissions.',
        variant: 'destructive'
      });
    }
  }, [analyzeEmotion, maxDuration, monitorAudioLevel, onRecordingComplete, onTranscription, toast, transcription]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsRecording(false);
    setAudioLevel(0);
  }, [isRecording]);

  // Get recording button style based on emotion
  const getRecordingButtonStyle = () => {
    if (!uiAdaptation) return {};

    const [primary, secondary, accent] = uiAdaptation.uiElements.colors;
    
    if (isRecording) {
      return {
        backgroundColor: accent,
        borderColor: accent,
        boxShadow: `0 0 20px ${accent}40`
      };
    }

    return {
      backgroundColor: primary,
      borderColor: primary
    };
  };

  // Get emotion-based visual effects
  const getEmotionEffects = () => {
    if (!currentEmotion) return null;

    const effects = {
      happy: { icon: Heart, color: '#FFD700', animation: 'bounce' },
      excited: { icon: Zap, color: '#FF9800', animation: 'pulse' },
      calm: { icon: Volume2, color: '#81C784', animation: 'fade' },
      anxious: { icon: Brain, color: '#E8F5E8', animation: 'gentle' },
      confident: { icon: Zap, color: '#2196F3', animation: 'strong' }
    };

    const effect = effects[currentEmotion.primary as keyof typeof effects];
    if (!effect) return null;

    const Icon = effect.icon;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute -top-2 -right-2"
      >
        <Icon 
          className="w-4 h-4" 
          style={{ color: effect.color }}
        />
      </motion.div>
    );
  };

  const progress = (recordingTime / maxDuration) * 100;
  const timeLeft = Math.max(0, (maxDuration - recordingTime) / 1000);

  return (
    <Card className={`emotion-voice-recorder ${className}`}>
      <CardContent className="p-6 space-y-4">
        {/* Emotion Indicator */}
        <div className="flex justify-between items-center">
          <EmotionIndicator />
          {isProcessing && (
            <Badge variant="secondary" className="animate-pulse">
              <Brain className="w-3 h-3 mr-1" />
              Analyzing emotion...
            </Badge>
          )}
        </div>

        {/* Recording Visualization */}
        <div className="relative flex flex-col items-center space-y-4">
          {/* Audio Level Visualization */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center space-x-1"
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-current rounded-full"
                    style={{
                      height: `${Math.max(4, (audioLevel / 100) * 20 * (1 + Math.sin((Date.now() / 100) + i)))}px`,
                      opacity: audioLevel > (i * 20) ? 1 : 0.3
                    }}
                    animate={{
                      scaleY: audioLevel > (i * 20) ? 1.5 : 1
                    }}
                    transition={{ duration: 0.1 }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recording Button */}
          <div className="relative">
            <EmotionButton
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              variant="primary"
              className="w-16 h-16 rounded-full p-0 relative overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {isRecording ? (
                  <motion.div
                    key="recording"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center justify-center"
                  >
                    <div className="w-4 h-4 bg-white rounded-sm" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Mic className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pulse effect while recording */}
              {isRecording && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-white"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.7, 0, 0.7]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </EmotionButton>

            {getEmotionEffects()}
          </div>

          {/* Timer and Progress */}
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-2"
            >
              <Progress value={progress} className="h-1" />
              <div className="text-center text-sm text-muted-foreground">
                {timeLeft.toFixed(1)}s remaining
              </div>
            </motion.div>
          )}
        </div>

        {/* Transcription Preview */}
        <AnimatePresence>
          {transcription && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-muted rounded-lg"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Live Transcription
                </span>
                {confidence > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {Math.round(confidence * 100)}% confident
                  </Badge>
                )}
              </div>
              <p className="text-sm italic">"{transcription}"</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        <div className="text-center text-xs text-muted-foreground">
          {isRecording 
            ? "Speaking... Bonita is listening and analyzing your tone"
            : "Tap to start voice recording with emotion recognition"
          }
        </div>
      </CardContent>
    </Card>
  );
}