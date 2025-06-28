import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmotionAnalysis {
  primary: EmotionType;
  secondary?: EmotionType;
  confidence: number;
  intensity: number;
  valence: number;
  arousal: number;
}

type EmotionType = 
  | 'happy' 
  | 'sad' 
  | 'angry' 
  | 'frustrated' 
  | 'excited' 
  | 'calm' 
  | 'anxious' 
  | 'confident' 
  | 'tired' 
  | 'neutral';

interface UIAdaptation {
  theme: 'supportive' | 'energetic' | 'calming' | 'professional' | 'empathetic';
  responseStyle: 'gentle' | 'enthusiastic' | 'measured' | 'direct' | 'compassionate';
  uiElements: {
    colors: string[];
    animations: 'minimal' | 'subtle' | 'dynamic';
    spacing: 'compact' | 'comfortable' | 'spacious';
    fontWeight: 'light' | 'normal' | 'medium';
  };
  bonitaPersonality: {
    tone: 'sweet-nurturing' | 'tough-love' | 'balanced';
    empathy: number;
    supportiveness: number;
  };
}

interface EmotionContextType {
  currentEmotion: EmotionAnalysis | null;
  uiAdaptation: UIAdaptation | null;
  updateEmotion: (emotion: EmotionAnalysis) => void;
  resetToDefault: () => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
}

const EmotionContext = createContext<EmotionContextType | undefined>(undefined);

export function useEmotion() {
  const context = useContext(EmotionContext);
  if (!context) {
    throw new Error('useEmotion must be used within an EmotionProvider');
  }
  return context;
}

// Default UI adaptation
const defaultAdaptation: UIAdaptation = {
  theme: 'professional',
  responseStyle: 'direct',
  uiElements: {
    colors: ['#3F51B5', '#009688', '#FF9800'],
    animations: 'subtle',
    spacing: 'comfortable',
    fontWeight: 'normal'
  },
  bonitaPersonality: {
    tone: 'balanced',
    empathy: 0.6,
    supportiveness: 0.6
  }
};

interface EmotionProviderProps {
  children: ReactNode;
}

export function EmotionProvider({ children }: EmotionProviderProps) {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionAnalysis | null>(null);
  const [uiAdaptation, setUiAdaptation] = useState<UIAdaptation>(defaultAdaptation);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const updateEmotion = (emotion: EmotionAnalysis) => {
    setCurrentEmotion(emotion);
    const adaptation = generateUIAdaptation(emotion);
    setUiAdaptation(adaptation);
    applyUIAdaptation(adaptation);
  };

  const resetToDefault = () => {
    setCurrentEmotion(null);
    setUiAdaptation(defaultAdaptation);
    applyUIAdaptation(defaultAdaptation);
  };

  const applyUIAdaptation = (adaptation: UIAdaptation) => {
    const root = document.documentElement;
    
    // Apply color scheme
    const [primary, secondary, accent] = adaptation.uiElements.colors;
    root.style.setProperty('--emotion-primary', primary);
    root.style.setProperty('--emotion-secondary', secondary);
    root.style.setProperty('--emotion-accent', accent);
    
    // Apply spacing
    const spacingMap = {
      compact: '0.75rem',
      comfortable: '1rem',
      spacious: '1.5rem'
    };
    root.style.setProperty('--emotion-spacing', spacingMap[adaptation.uiElements.spacing]);
    
    // Apply font weight
    const fontWeightMap = {
      light: '300',
      normal: '400',
      medium: '500'
    };
    root.style.setProperty('--emotion-font-weight', fontWeightMap[adaptation.uiElements.fontWeight]);
  };

  const value: EmotionContextType = {
    currentEmotion,
    uiAdaptation,
    updateEmotion,
    resetToDefault,
    isAnalyzing,
    setIsAnalyzing
  };

  return (
    <EmotionContext.Provider value={value}>
      {children}
    </EmotionContext.Provider>
  );
}

// UI Adaptation generator (client-side version)
function generateUIAdaptation(emotion: EmotionAnalysis): UIAdaptation {
  const adaptations: Record<EmotionType, UIAdaptation> = {
    happy: {
      theme: 'energetic',
      responseStyle: 'enthusiastic',
      uiElements: {
        colors: ['#FFD700', '#FF6B6B', '#4ECDC4'],
        animations: 'dynamic',
        spacing: 'comfortable',
        fontWeight: 'medium'
      },
      bonitaPersonality: { tone: 'balanced', empathy: 0.7, supportiveness: 0.8 }
    },
    sad: {
      theme: 'supportive',
      responseStyle: 'compassionate',
      uiElements: {
        colors: ['#B19CD9', '#C8E6C9', '#F8BBD9'],
        animations: 'subtle',
        spacing: 'spacious',
        fontWeight: 'light'
      },
      bonitaPersonality: { tone: 'sweet-nurturing', empathy: 0.9, supportiveness: 0.9 }
    },
    angry: {
      theme: 'calming',
      responseStyle: 'measured',
      uiElements: {
        colors: ['#81C784', '#90CAF9', '#FFCDD2'],
        animations: 'minimal',
        spacing: 'spacious',
        fontWeight: 'light'
      },
      bonitaPersonality: { tone: 'sweet-nurturing', empathy: 0.8, supportiveness: 0.7 }
    },
    frustrated: {
      theme: 'supportive',
      responseStyle: 'gentle',
      uiElements: {
        colors: ['#A5D6A7', '#BBDEFB', '#F5F5F5'],
        animations: 'subtle',
        spacing: 'comfortable',
        fontWeight: 'normal'
      },
      bonitaPersonality: { tone: 'sweet-nurturing', empathy: 0.8, supportiveness: 0.8 }
    },
    excited: {
      theme: 'energetic',
      responseStyle: 'enthusiastic',
      uiElements: {
        colors: ['#FF9800', '#E91E63', '#9C27B0'],
        animations: 'dynamic',
        spacing: 'compact',
        fontWeight: 'medium'
      },
      bonitaPersonality: { tone: 'balanced', empathy: 0.6, supportiveness: 0.7 }
    },
    anxious: {
      theme: 'calming',
      responseStyle: 'gentle',
      uiElements: {
        colors: ['#E8F5E8', '#E3F2FD', '#FFF3E0'],
        animations: 'minimal',
        spacing: 'spacious',
        fontWeight: 'light'
      },
      bonitaPersonality: { tone: 'sweet-nurturing', empathy: 0.9, supportiveness: 0.9 }
    },
    confident: {
      theme: 'professional',
      responseStyle: 'direct',
      uiElements: {
        colors: ['#2196F3', '#4CAF50', '#FF5722'],
        animations: 'subtle',
        spacing: 'comfortable',
        fontWeight: 'medium'
      },
      bonitaPersonality: { tone: 'balanced', empathy: 0.6, supportiveness: 0.6 }
    },
    tired: {
      theme: 'calming',
      responseStyle: 'gentle',
      uiElements: {
        colors: ['#E1BEE7', '#C5E1A5', '#DCEDC8'],
        animations: 'minimal',
        spacing: 'spacious',
        fontWeight: 'light'
      },
      bonitaPersonality: { tone: 'sweet-nurturing', empathy: 0.7, supportiveness: 0.8 }
    },
    calm: {
      theme: 'professional',
      responseStyle: 'measured',
      uiElements: {
        colors: ['#607D8B', '#9E9E9E', '#BCAAA4'],
        animations: 'subtle',
        spacing: 'comfortable',
        fontWeight: 'normal'
      },
      bonitaPersonality: { tone: 'balanced', empathy: 0.6, supportiveness: 0.6 }
    },
    neutral: defaultAdaptation
  };

  return adaptations[emotion.primary] || defaultAdaptation;
}

// Emotion indicator component
interface EmotionIndicatorProps {
  className?: string;
}

export function EmotionIndicator({ className = '' }: EmotionIndicatorProps) {
  const { currentEmotion, isAnalyzing } = useEmotion();

  if (!currentEmotion && !isAnalyzing) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${className}`}
        style={{
          background: `linear-gradient(45deg, ${currentEmotion?.primary === 'happy' ? '#FFD700' : 
                      currentEmotion?.primary === 'sad' ? '#B19CD9' :
                      currentEmotion?.primary === 'angry' ? '#81C784' :
                      currentEmotion?.primary === 'excited' ? '#FF9800' :
                      currentEmotion?.primary === 'anxious' ? '#E8F5E8' :
                      '#607D8B'}20, transparent)`,
          border: `1px solid ${currentEmotion?.primary === 'happy' ? '#FFD700' : 
                               currentEmotion?.primary === 'sad' ? '#B19CD9' :
                               currentEmotion?.primary === 'angry' ? '#81C784' :
                               currentEmotion?.primary === 'excited' ? '#FF9800' :
                               currentEmotion?.primary === 'anxious' ? '#E8F5E8' :
                               '#607D8B'}40`
        }}
      >
        {isAnalyzing ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-3 h-3 border border-current border-t-transparent rounded-full"
            />
            <span>Analyzing emotion...</span>
          </>
        ) : currentEmotion ? (
          <>
            <div className="w-2 h-2 rounded-full bg-current opacity-70" />
            <span>{getEmotionLabel(currentEmotion.primary)}</span>
            <span className="opacity-60">({Math.round(currentEmotion.confidence * 100)}%)</span>
          </>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}

// Adaptive container component
interface AdaptiveContainerProps {
  children: ReactNode;
  className?: string;
}

export function AdaptiveContainer({ children, className = '' }: AdaptiveContainerProps) {
  const { uiAdaptation } = useEmotion();

  const getAnimationVariants = () => {
    switch (uiAdaptation?.uiElements.animations) {
      case 'dynamic':
        return {
          initial: { opacity: 0, y: 20, scale: 0.95 },
          animate: { opacity: 1, y: 0, scale: 1 },
          transition: { duration: 0.3, ease: "easeOut" }
        };
      case 'subtle':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.4 }
        };
      case 'minimal':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.2 }
        };
    }
  };

  return (
    <motion.div
      {...getAnimationVariants()}
      className={`emotion-adaptive-container ${className}`}
      style={{
        padding: `var(--emotion-spacing, 1rem)`,
        fontWeight: `var(--emotion-font-weight, 400)`
      }}
    >
      {children}
    </motion.div>
  );
}

// Emotion-aware button component
interface EmotionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'supportive';
  className?: string;
  disabled?: boolean;
}

export function EmotionButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '',
  disabled = false 
}: EmotionButtonProps) {
  const { uiAdaptation } = useEmotion();

  const getButtonStyle = () => {
    if (!uiAdaptation) return {};

    const [primary, secondary, accent] = uiAdaptation.uiElements.colors;
    
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: primary,
          color: 'white',
          border: `2px solid ${primary}`
        };
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          color: primary,
          border: `2px solid ${primary}`
        };
      case 'supportive':
        return {
          backgroundColor: `${secondary}20`,
          color: secondary,
          border: `2px solid ${secondary}40`
        };
      default:
        return {};
    }
  };

  const getHoverAnimation = () => {
    switch (uiAdaptation?.uiElements.animations) {
      case 'dynamic':
        return { scale: 1.05, y: -2 };
      case 'subtle':
        return { scale: 1.02 };
      case 'minimal':
      default:
        return { opacity: 0.9 };
    }
  };

  return (
    <motion.button
      whileHover={disabled ? {} : getHoverAnimation()}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      style={getButtonStyle()}
    >
      {children}
    </motion.button>
  );
}

// Emotion response message component
interface EmotionMessageProps {
  children: ReactNode;
  sender: 'user' | 'bonita';
  emotion?: EmotionType;
}

export function EmotionMessage({ children, sender, emotion }: EmotionMessageProps) {
  const { uiAdaptation } = useEmotion();

  const getMessageStyle = () => {
    if (sender === 'user') {
      return {
        backgroundColor: 'var(--emotion-primary, #3F51B5)',
        color: 'white'
      };
    }

    if (!uiAdaptation) return {};

    // Bonita's message style adapts to user's emotion
    const [primary, secondary, accent] = uiAdaptation.uiElements.colors;
    
    return {
      backgroundColor: `${secondary}15`,
      border: `1px solid ${secondary}30`,
      color: 'var(--foreground)'
    };
  };

  return (
    <AdaptiveContainer>
      <motion.div
        initial={{ opacity: 0, x: sender === 'user' ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`max-w-[80%] p-3 rounded-lg ${
          sender === 'user' ? 'ml-auto' : 'mr-auto'
        }`}
        style={getMessageStyle()}
      >
        {children}
      </motion.div>
    </AdaptiveContainer>
  );
}

// Helper functions
function getEmotionLabel(emotion: EmotionType): string {
  const labels: Record<EmotionType, string> = {
    happy: '😊 Happy',
    sad: '😢 Sad',
    angry: '😠 Angry',
    frustrated: '😤 Frustrated',
    excited: '🤩 Excited',
    calm: '😌 Calm',
    anxious: '😰 Anxious',
    confident: '😎 Confident',
    tired: '😴 Tired',
    neutral: '😐 Neutral'
  };
  
  return labels[emotion] || '😐 Neutral';
}

// Voice emotion analyzer hook
export function useVoiceEmotionAnalyzer() {
  const { updateEmotion, setIsAnalyzing } = useEmotion();

  const analyzeEmotion = async (audioBlob: Blob, transcription?: string) => {
    setIsAnalyzing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      if (transcription) {
        formData.append('transcription', transcription);
      }

      const response = await fetch('/api/voice/analyze-emotion', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const emotionData = await response.json();
        updateEmotion(emotionData.emotion);
        return emotionData;
      }
    } catch (error) {
      console.error('Error analyzing emotion:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzeEmotion };
}