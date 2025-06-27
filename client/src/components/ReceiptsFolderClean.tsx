import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Archive, 
  Calendar,
  MessageCircle,
  Lightbulb,
  FileText,
  Target,
  CheckSquare,
  Heart
} from 'lucide-react';

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

export function ReceiptsFolderClean() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const { toast } = useToast();

  // Predefined folder types that auto-categorize content
  const folderTypes = [
    { id: 'all', name: 'All Receipts', color: 'gray', icon: Archive },
    { id: 'conversation', name: 'Conversations', color: 'blue', icon: MessageCircle },
    { id: 'idea', name: 'Ideas', color: 'purple', icon: Lightbulb },
    { id: 'script', name: 'Scripts', color: 'green', icon: FileText },
    { id: 'task', name: 'Tasks', color: 'orange', icon: CheckSquare },
    { id: 'decision', name: 'Decisions', color: 'red', icon: Target },
    { id: 'commitment', name: 'Commitments', color: 'pink', icon: Heart }
  ];

  // Fetch all receipts
  const { data: allReceipts = [], isLoading } = useQuery({
    queryKey: ['/api/receipts'],
    queryFn: async () => {
      const response = await fetch('/api/receipts');
      if (!response.ok) throw new Error('Failed to fetch receipts');
      return response.json();
    }
  });

  // Filter receipts based on selected folder and search term
  const filteredReceipts = allReceipts
    .filter((receipt: Receipt) => {
      // Filter by folder type
      if (selectedFolder !== 'all' && receipt.type !== selectedFolder) {
        return false;
      }
      // Filter by search term
      if (searchTerm && !receipt.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !receipt.content.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a: Receipt, b: Receipt) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Get count for each folder type
  const getFolderCount = (type: string) => {
    if (type === 'all') return allReceipts.length;
    return allReceipts.filter((receipt: Receipt) => receipt.type === type).length;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    const folder = folderTypes.find(f => f.id === type);
    return folder ? `bg-${folder.color}-100 text-${folder.color}-800` : 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full max-w-4xl mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="flex gap-4">
            <div className="w-64 space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="flex-1 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
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

      {/* Folders and Content */}
      <div className="flex gap-4">
        {/* Folder Sidebar */}
        <div className="w-64 space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground mb-4">FOLDERS</h3>
          {folderTypes.map((folder) => {
            const Icon = folder.icon;
            const count = getFolderCount(folder.id);
            return (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  selectedFolder === folder.id
                    ? `bg-${folder.color}-50 text-${folder.color}-700 border border-${folder.color}-200`
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Icon className={`h-4 w-4 ${selectedFolder === folder.id ? `text-${folder.color}-500` : 'text-gray-400'}`} />
                <span className="text-sm font-medium flex-1">{folder.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search receipts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Content */}
          {filteredReceipts.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {selectedFolder === 'all' ? 'No receipts yet' : `No ${folderTypes.find(f => f.id === selectedFolder)?.name.toLowerCase()} yet`}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedFolder === 'conversation' 
                  ? 'Start chatting with Bonita to automatically create conversation receipts'
                  : 'Your receipts will appear here as you interact with Bonita'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReceipts.map((receipt: Receipt) => (
                <Card key={receipt.id} className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg leading-tight">{receipt.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(receipt.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(receipt.type)}>
                          {receipt.type}
                        </Badge>
                        <Badge className={getPriorityColor(receipt.priority)}>
                          {receipt.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {receipt.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}