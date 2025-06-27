import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from './LanguageProvider';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { 
  FileText, 
  Plus,
  Search,
  Calendar,
  Target,
  MessageSquare,
  Lightbulb,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Receipt {
  id: number;
  userId: number;
  type: 'conversation' | 'idea' | 'script' | 'task' | 'decision' | 'commitment';
  title: string;
  content: string;
  projectId?: number;
  folderId?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isArchived: boolean;
  createdAt: Date;
}

interface ReceiptFolder {
  id: number;
  userId: number;
  name: string;
  description?: string;
  color: string;
  archived: boolean;
  createdAt: Date;
}

interface Project {
  id: number;
  userId: number;
  name: string;
  description?: string;
  color: string;
  isArchived: boolean;
  createdAt: Date;
}

export function ReceiptsFolderClean() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newReceipt, setNewReceipt] = useState({
    type: 'conversation' as Receipt['type'],
    title: '',
    content: '',
    priority: 'medium' as Receipt['priority']
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch receipts
  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ['/api/receipts'],
    queryFn: async () => {
      const response = await fetch('/api/receipts');
      if (!response.ok) throw new Error('Failed to fetch receipts');
      return response.json();
    }
  });

  // Create receipt mutation
  const createReceiptMutation = useMutation({
    mutationFn: async (receipt: typeof newReceipt) => {
      const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receipt)
      });
      if (!response.ok) throw new Error('Failed to create receipt');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
      setShowNewDialog(false);
      setNewReceipt({
        type: 'conversation',
        title: '',
        content: '',
        priority: 'medium'
      });
      toast({ title: "Receipt created successfully!" });
    },
    onError: () => {
      toast({ 
        title: "Error creating receipt",
        description: "Please try again",
        variant: "destructive"
      });
    }
  });

  const handleCreateReceipt = () => {
    if (!newReceipt.title.trim()) return;
    createReceiptMutation.mutate(newReceipt);
  };

  const getTypeIcon = (type: Receipt['type']) => {
    switch (type) {
      case 'conversation': return <MessageSquare className="h-4 w-4" />;
      case 'idea': return <Lightbulb className="h-4 w-4" />;
      case 'script': return <FileText className="h-4 w-4" />;
      case 'task': return <Target className="h-4 w-4" />;
      case 'decision': return <CheckCircle className="h-4 w-4" />;
      case 'commitment': return <Calendar className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: Receipt['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const filteredReceipts = receipts.filter((receipt: Receipt) =>
    receipt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          Loading receipts...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Receipts Folder</h1>
        <p className="text-muted-foreground">
          Track your conversations, ideas, and commitments with Bonita
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search receipts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              New Receipt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Receipt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  value={newReceipt.type}
                  onChange={(e) => setNewReceipt({...newReceipt, type: e.target.value as Receipt['type']})}
                  className="w-full mt-1 p-2 border border-border rounded-md bg-background"
                >
                  <option value="conversation">💬 Conversation</option>
                  <option value="idea">💡 Idea</option>
                  <option value="script">📝 Script</option>
                  <option value="task">🎯 Task</option>
                  <option value="decision">✅ Decision</option>
                  <option value="commitment">📅 Commitment</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Enter title..."
                  value={newReceipt.title}
                  onChange={(e) => setNewReceipt({...newReceipt, title: e.target.value})}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Content</label>
                <textarea
                  placeholder="Enter content..."
                  value={newReceipt.content}
                  onChange={(e) => setNewReceipt({...newReceipt, content: e.target.value})}
                  rows={3}
                  className="w-full mt-1 p-2 border border-border rounded-md bg-background resize-none"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select
                  value={newReceipt.priority}
                  onChange={(e) => setNewReceipt({...newReceipt, priority: e.target.value as Receipt['priority']})}
                  className="w-full mt-1 p-2 border border-border rounded-md bg-background"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <Button 
                onClick={handleCreateReceipt} 
                disabled={!newReceipt.title.trim() || createReceiptMutation.isPending}
                className="w-full"
              >
                {createReceiptMutation.isPending ? 'Creating...' : 'Create Receipt'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty State or Receipts List */}
      {filteredReceipts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">No receipts found</h3>
            <p className="text-muted-foreground max-w-md">
              Start tracking your conversations, ideas, and commitments with Bonita
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredReceipts.map((receipt: Receipt) => (
            <Card key={receipt.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-muted rounded-lg">
                      {getTypeIcon(receipt.type)}
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-base">{receipt.title}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className={getPriorityColor(receipt.priority)}>
                          {receipt.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {format(new Date(receipt.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              {receipt.content && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {receipt.content}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}