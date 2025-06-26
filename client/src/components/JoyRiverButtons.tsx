import React from 'react';
import { Button } from "@/components/ui/button";
import { ExternalLink, Youtube, Instagram, Globe } from 'lucide-react';

interface JoyRiverButtonsProps {
  onButtonClick?: (action: string) => void;
}

export function JoyRiverButtons({ onButtonClick }: JoyRiverButtonsProps) {
  const handleClick = (action: string, url: string) => {
    if (onButtonClick) {
      onButtonClick(action);
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleClick('watch_podcast', 'https://www.youtube.com/@TheCouchwithJoyFriends')}
        className="flex items-center gap-2"
      >
        <Youtube className="w-4 h-4" />
        Watch Podcast
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleClick('follow_joy', 'https://www.instagram.com/joyriver_/')}
        className="flex items-center gap-2"
      >
        <Instagram className="w-4 h-4" />
        Follow Joy
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleClick('visit_site', 'https://www.creativeenergy.life/')}
        className="flex items-center gap-2"
      >
        <Globe className="w-4 h-4" />
        Visit Site
      </Button>
    </div>
  );
}