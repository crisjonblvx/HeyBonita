import React, { useState, useEffect } from 'react';
import { Loader2, Heart, Music, Sparkles } from 'lucide-react';
import bonitaLogo from '@assets/Bonita logo 1_1750814378446.png';

interface BonitaLoadingSpinnerProps {
  message?: string;
  subMessage?: string;
}

const loadingMessages = [
  "Bonita's getting ready to drop some wisdom...",
  "Tuning into your vibe...",
  "Channeling that auntie energy...",
  "Warming up the mic...",
  "Getting the tea ready...",
  "Adjusting the crown...",
  "Checking the wisdom vault...",
  "Blessing this conversation..."
];

const encouragementMessages = [
  "You got this, honey!",
  "Keep your head up!",
  "Success is coming!",
  "Stay focused, baby!",
  "Trust the process!",
  "Your time is now!",
  "Believe in yourself!",
  "Good things coming!"
];

export default function BonitaLoadingSpinner({ 
  message = "Getting things ready...", 
  subMessage 
}: BonitaLoadingSpinnerProps) {
  const [currentMessage, setCurrentMessage] = useState(loadingMessages[0]);
  const [encouragement, setEncouragement] = useState('');
  const [showHeart, setShowHeart] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState(1);

  useEffect(() => {
    // Rotate loading messages
    const messageInterval = setInterval(() => {
      setCurrentMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
    }, 2000);

    // Show encouragement occasionally
    const encouragementInterval = setInterval(() => {
      setEncouragement(encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)]);
      setShowHeart(true);
      
      setTimeout(() => {
        setEncouragement('');
        setShowHeart(false);
      }, 1500);
    }, 4000);

    // Sparkle effect
    const sparkleInterval = setInterval(() => {
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 800);
    }, 3000);

    // Pulse intensity variation
    const pulseInterval = setInterval(() => {
      setPulseIntensity(Math.random() * 0.5 + 0.75);
    }, 1500);

    return () => {
      clearInterval(messageInterval);
      clearInterval(encouragementInterval);
      clearInterval(sparkleInterval);
      clearInterval(pulseInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative overflow-hidden">
        
        {/* Sparkles background effect */}
        {showSparkles && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <Sparkles
                key={i}
                className={`absolute text-yellow-400 animate-ping`}
                style={{
                  left: `${20 + (i * 12)}%`,
                  top: `${15 + (i % 3) * 25}%`,
                  animationDelay: `${i * 0.2}s`,
                  fontSize: `${12 + (i % 3) * 4}px`
                }}
              />
            ))}
          </div>
        )}

        {/* Bonita Avatar with pulsing effect */}
        <div className="relative mb-6">
          <div 
            className="relative mx-auto w-24 h-24 rounded-full overflow-hidden border-4 border-purple-500 dark:border-purple-400 shadow-lg"
            style={{
              transform: `scale(${pulseIntensity})`,
              transition: 'transform 1.5s ease-in-out'
            }}
          >
            <img 
              src={bonitaLogo} 
              alt="Bonita" 
              className="w-full h-full object-cover animate-pulse"
            />
          </div>
          
          {/* Floating heart */}
          {showHeart && (
            <Heart 
              className="absolute -top-2 -right-2 text-red-500 animate-bounce fill-current"
              size={20}
            />
          )}
          
          {/* Music note floating */}
          <Music 
            className="absolute -bottom-1 -left-1 text-purple-500 dark:text-purple-400 animate-bounce"
            size={16}
            style={{ animationDelay: '0.5s' }}
          />
        </div>

        {/* Main loading spinner */}
        <div className="relative mb-4">
          <Loader2 className="animate-spin text-purple-600 dark:text-purple-400 mx-auto mb-4" size={32} />
          
          {/* Rotating ring around spinner */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
            <div className="w-12 h-12 mx-auto border-2 border-transparent border-t-pink-500 rounded-full"></div>
          </div>
        </div>

        {/* Main message */}
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          {message}
        </h3>

        {/* Rotating subtitle */}
        <p className="text-sm text-purple-600 dark:text-purple-400 mb-3 h-5 transition-all duration-500">
          {currentMessage}
        </p>

        {/* Sub message if provided */}
        {subMessage && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
            {subMessage}
          </p>
        )}

        {/* Encouragement message */}
        {encouragement && (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-3 mb-4 border border-purple-200 dark:border-purple-700 animate-in slide-in-from-bottom-2 duration-300">
            <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
              💜 {encouragement}
            </p>
          </div>
        )}

        {/* Progress dots */}
        <div className="flex justify-center space-x-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
        </div>

        {/* Bottom wave decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-pulse"></div>
      </div>
    </div>
  );
}