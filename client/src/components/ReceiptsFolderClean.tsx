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
  Clock,
  Folder,
  FolderOpen,
  MoreVertical,
  Edit,
  Trash,
  Archive,
  Move
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
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [newReceipt, setNewReceipt] = useState({
    type: 'conversation' as Receipt['type'],
    title: '',
    content: '',
    priority: 'medium' as Receipt['priority'],
    folderId: null as number | null
  });
  const [newFolder, setNewFolder] = useState({
    name: '',
    description: '',
    color: 'blue'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch receipts
  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ['/api/receipts', selectedFolderId],
    queryFn: async () => {
      const url = selectedFolderId 
        ? `/api/receipts?folderId=${selectedFolderId}`
        : '/api/receipts';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch receipts');
      return response.json();
    }
  });

  // Fetch folders
  const { data: folders = [] } = useQuery({
    queryKey: ['/api/receipt-folders'],
    queryFn: async () => {
      const response = await fetch('/api/receipt-folders');
      if (!response.ok) throw new Error('Failed to fetch folders');
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
        priority: 'medium',
        folderId: null
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

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (folder: typeof newFolder) => {
      const response = await fetch('/api/receipt-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folder)
      });
      if (!response.ok) throw new Error('Failed to create folder');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/receipt-folders'] });
      setShowNewFolderDialog(false);
      setNewFolder({
        name: '',
        description: '',
        color: 'blue'
      });
      toast({ title: "Folder created successfully!" });
    },
    onError: () => {
      toast({ 
        title: "Error creating folder",
        description: "Please try again",
        variant: "destructive"
      });
    }
  });

  const handleCreateReceipt = () => {
    if (!newReceipt.title.trim()) return;
    createReceiptMutation.mutate(newReceipt);
  };

  const handleCreateFolder = () => {
    if (!newFolder.name.trim()) return;
    createFolderMutation.mutate(newFolder);
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

      {/* Folders and Actions Bar */}
      <div className="flex gap-4">
        {/* Folder Sidebar */}
        <div className="w-64 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Folders</h3>
            <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Plus className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={newFolder.name}
                      onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                      placeholder="Folder name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Color</label>
                    <select
                      value={newFolder.color}
                      onChange={(e) => setNewFolder({ ...newFolder, color: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="purple">Purple</option>
                      <option value="red">Red</option>
                      <option value="orange">Orange</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      value={newFolder.description}
                      onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>
                  <Button onClick={handleCreateFolder} className="w-full">
                    Create Folder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* All Receipts */}
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`w-full flex items-center gap-2 p-2 rounded text-left hover:bg-gray-100 dark:hover:bg-gray-800 ${
              selectedFolderId === null ? 'bg-blue-100 dark:bg-blue-900' : ''
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            <span className="text-sm">All Receipts</span>
            <span className="ml-auto text-xs text-muted-foreground">{receipts.length}</span>
          </button>
          
          {/* Folder List */}
          {folders.map((folder: ReceiptFolder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolderId(folder.id)}
              className={`w-full flex items-center gap-2 p-2 rounded text-left hover:bg-gray-100 dark:hover:bg-gray-800 ${
                selectedFolderId === folder.id ? 'bg-blue-100 dark:bg-blue-900' : ''
              }`}
            >
              <Folder className={`h-4 w-4 text-${folder.color}-500`} />
              <span className="text-sm">{folder.name}</span>
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
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
      </div>
    </div>
  );
}