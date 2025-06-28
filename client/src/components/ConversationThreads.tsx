import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, MessageCircle, Archive, Search, MoreVertical, Trash2, Edit } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: number;
  title: string;
  description?: string;
  messageCount: number;
  lastMessageAt: string;
  isArchived: boolean;
  createdAt: string;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export default function ConversationThreads() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ['/api/conversations'],
  });

  // Fetch messages for selected conversation
  const { data: conversationData } = useQuery({
    queryKey: ['/api/conversations', selectedConversation],
    enabled: !!selectedConversation,
  });

  // Create new conversation
  const createConversationMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string }) => {
      return await apiRequest('/api/conversations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setShowNewConversationDialog(false);
      setNewConversationTitle('');
      toast({ title: 'Conversation created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create conversation', variant: 'destructive' });
    },
  });

  // Archive conversation
  const archiveConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      return await apiRequest(`/api/conversations/${conversationId}/archive`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      toast({ title: 'Conversation archived' });
    },
  });

  // Delete conversation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      return await apiRequest(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setSelectedConversation(null);
      toast({ title: 'Conversation deleted' });
    },
  });

  const filteredConversations = conversations.filter((conv: Conversation) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex h-full">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r bg-background p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <Dialog open={showNewConversationDialog} onOpenChange={setShowNewConversationDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Conversation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Conversation title"
                  value={newConversationTitle}
                  onChange={(e) => setNewConversationTitle(e.target.value)}
                />
                <Button
                  onClick={() => createConversationMutation.mutate({ title: newConversationTitle })}
                  disabled={!newConversationTitle.trim() || createConversationMutation.isPending}
                  className="w-full"
                >
                  Create Conversation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Conversations List */}
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-2">
            {filteredConversations.map((conversation: Conversation) => (
              <Card
                key={conversation.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  selectedConversation === conversation.id ? 'bg-accent' : ''
                }`}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">
                        {conversation.title}
                      </h3>
                      {conversation.description && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {conversation.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {conversation.messageCount}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(conversation.lastMessageAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {conversation.isArchived && (
                        <Archive className="h-3 w-3 text-muted-foreground" />
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Show context menu
                        }}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Conversation Header */}
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold">
                    {conversationData?.conversation?.title || 'Loading...'}
                  </h1>
                  {conversationData?.conversation?.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {conversationData.conversation.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => archiveConversationMutation.mutate(selectedConversation)}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteConversationMutation.mutate(selectedConversation)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {conversationData?.messages?.map((message: Message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button>Send</Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-2">Select a Conversation</h2>
              <p className="text-muted-foreground">
                Choose a conversation from the sidebar to view messages, or create a new one.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}