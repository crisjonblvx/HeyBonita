import React from 'react';
import { Link, useLocation } from 'wouter';
import { MessageSquare, Image, Video, User, LogOut, ThumbsUp, ThumbsDown, Bug, Lightbulb, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { FeedbackWidget } from './FeedbackWidget';

export function LeftSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/auth'; // Fallback redirect
    }
  };

  const navigation = [
    { name: 'Chat', href: '/app', icon: MessageSquare },
    { name: 'Images', href: '/app/images', icon: Image },
    { name: 'Scripts', href: '/app/scripts', icon: Video },
    { name: 'Profile', href: '/app/profile', icon: User },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col justify-between z-50">
      {/* Navigation Items */}
      <div className="flex flex-col items-center py-4 space-y-4">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href === '/app' && location === '/');
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className="w-10 h-10 p-0 rounded-lg"
                title={item.name}
              >
                <Icon className="h-5 w-5" />
              </Button>
            </Link>
          );
        })}
      </div>

      {/* Bottom Section with Feedback and Logout */}
      <div className="flex flex-col items-center pb-4 space-y-4">
        {/* Feedback Widget - Vertical Stack */}
        <div className="flex flex-col space-y-2">
          <FeedbackWidget 
            type="like" 
            className="w-10 h-10 p-0 rounded-lg" 
            icon={<ThumbsUp className="h-4 w-4" />}
          />
          <FeedbackWidget 
            type="dislike" 
            className="w-10 h-10 p-0 rounded-lg" 
            icon={<ThumbsDown className="h-4 w-4" />}
          />
          <FeedbackWidget 
            type="bug" 
            className="w-10 h-10 p-0 rounded-lg" 
            icon={<Bug className="h-4 w-4" />}
          />
          <FeedbackWidget 
            type="suggestion" 
            className="w-10 h-10 p-0 rounded-lg" 
            icon={<Lightbulb className="h-4 w-4" />}
          />
          <FeedbackWidget 
            type="general" 
            className="w-10 h-10 p-0 rounded-lg" 
            icon={<MessageCircle className="h-4 w-4" />}
          />
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