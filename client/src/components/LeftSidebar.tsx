import React from 'react';
import { MessageSquare, Image, Video, User, LogOut, ThumbsUp, ThumbsDown, Bug, Lightbulb, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LeftSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function LeftSidebar({ activeTab, setActiveTab }: LeftSidebarProps) {
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/auth';
    }
  };

  const navigation = [
    { name: 'Chat', tab: 'chat', icon: MessageSquare },
    { name: 'Images', tab: 'image', icon: Image },
    { name: 'Scripts', tab: 'video', icon: Video },
    { name: 'Profile', tab: 'profile', icon: User },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col justify-between z-50">
      {/* Navigation Items */}
      <div className="flex flex-col items-center py-4 space-y-4">
        {navigation.map((item) => {
          const isActive = activeTab === item.tab;
          const Icon = item.icon;
          
          return (
            <Button
              key={item.name}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className="w-10 h-10 p-0 rounded-lg"
              title={item.name}
              onClick={() => setActiveTab(item.tab)}
            >
              <Icon className="h-5 w-5" />
            </Button>
          );
        })}
      </div>

      {/* Bottom Section with Feedback and Logout */}
      <div className="flex flex-col items-center pb-4 space-y-4">
        {/* Feedback Buttons - Vertical Stack */}
        <div className="flex flex-col space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0 rounded-lg"
            title="Like"
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0 rounded-lg"
            title="Dislike"
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0 rounded-lg"
            title="Report Bug"
          >
            <Bug className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0 rounded-lg"
            title="Suggestion"
          >
            <Lightbulb className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-10 h-10 p-0 rounded-lg"
            title="General Feedback"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-10 h-10 p-0 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
          title="Logout"
        >
          <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
        </Button>
      </div>
    </div>
  );
}