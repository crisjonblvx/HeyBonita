import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from './LanguageProvider';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  FileText, 
  MessageSquare, 
  Lightbulb, 
  Target, 
  Clock, 
  Calendar,
  Tag,
  Search,
  Plus,
  Edit,
  Trash2,
  Star,
  CheckCircle,
  AlertCircle,
  Archive,
  Mic,
  Play,
  Pause
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Receipt {
  id: number;
  userId: number;
  receiptType: 'conversation' | 'idea' | 'script' | 'task' | 'decision' | 'voice_note' | 'commitment';
  projectName?: string;
  title: string;
  content: string;
  tags?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'active' | 'completed' | 'dropped' | 'archived';
  voiceNoteUrl?: string;
  metadata?: any;
  reminderDate?: Date;
  completedAt?: Date;
  createdAt: Date;
}

interface Project {
  id: number;
  userId: number;
  projectName: string;
  description?: string;
  color: string;
  isActive: boolean;
  lastActivityAt: Date;
  createdAt: Date;
}

interface DroppedIdea {
  id: number;
  userId: number;
  ideaText: string;
  context?: string;
  projectId?: number;
  isRediscovered: boolean;
  priority: string;
  createdAt: Date;
  rediscoveredAt?: Date;
}

interface Commitment {
  id: number;
  userId: number;
  commitmentText: string;
  dueDate?: Date;
  projectId?: number;
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
  remindersSent: number;
  completedAt?: Date;
  createdAt: Date;
}

export function ReceiptsFolder() {
  const [activeReceiptTab, setActiveReceiptTab] = useState<'all' | 'conversations' | 'ideas' | 'scripts' | 'tasks' | 'decisions' | 'voice_notes' | 'commitments'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showNewReceiptDialog, setShowNewReceiptDialog] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form states
  const [newReceipt, setNewReceipt] = useState({
    receiptType: 'conversation' as Receipt['receiptType'],
    projectName: '',
    title: '',
    content: '',
    tags: '',
    priority: 'medium' as Receipt['priority'],
    reminderDate: ''
  });

  const [newProject, setNewProject] = useState({
    projectName: '',
    description: '',
    color: 'blue'
  });

  // Fetch receipts
  const { data: receipts = [], isLoading: receiptsLoading } = useQuery<Receipt[]>({
    queryKey: ['/api/receipts', activeReceiptTab, selectedProject, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeReceiptTab !== 'all') params.append('type', activeReceiptTab);
      if (selectedProject) params.append('project', selectedProject);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/receipts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch receipts');
      return response.json();
    }
  });

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      return response.json();
    }
  });

  // Fetch dropped ideas
  const { data: droppedIdeas = [] } = useQuery<DroppedIdea[]>({
    queryKey: ['/api/dropped-ideas'],
    queryFn: async () => {
      const response = await fetch('/api/dropped-ideas');
      if (!response.ok) throw new Error('Failed to fetch dropped ideas');
      return response.json();
    }
  });

  // Fetch commitments
  const { data: commitments = [] } = useQuery<Commitment[]>({
    queryKey: ['/api/commitments'],
    queryFn: async () => {
      const response = await fetch('/api/commitments');
      if (!response.ok) throw new Error('Failed to fetch commitments');
      return response.json();
    }
  });

  // Create receipt mutation
  const createReceiptMutation = useMutation({
    mutationFn: async (receiptData: any) => {
      const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receiptData)
      });
      if (!response.ok) throw new Error('Failed to create receipt');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
      setShowNewReceiptDialog(false);
      setNewReceipt({
        receiptType: 'conversation',
        projectName: '',
        title: '',
        content: '',
        tags: '',
        priority: 'medium',
        reminderDate: ''
      });
      toast({
        title: "Receipt Created",
        description: "Your receipt has been saved to the folder.",
      });
    }
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      if (!response.ok) throw new Error('Failed to create project');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setShowNewProjectDialog(false);
      setNewProject({ projectName: '', description: '', color: 'blue' });
      toast({
        title: "Project Created",
        description: "New project folder created for organizing conversations.",
      });
    }
  });

  // Update receipt mutation
  const updateReceiptMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await fetch(`/api/receipts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update receipt');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
      setEditingReceipt(null);
      toast({
        title: "Receipt Updated",
        description: "Changes have been saved.",
      });
    }
  });

  const handleCreateReceipt = () => {
    const receiptData = {
      ...newReceipt,
      tags: newReceipt.tags ? newReceipt.tags.split(',').map(t => t.trim()) : [],
      reminderDate: newReceipt.reminderDate ? new Date(newReceipt.reminderDate) : null
    };
    createReceiptMutation.mutate(receiptData);
  };

  const handleCreateProject = () => {
    createProjectMutation.mutate(newProject);
  };

  const getReceiptIcon = (type: Receipt['receiptType']) => {
    switch (type) {
      case 'conversation': return <MessageSquare className="h-4 w-4" />;
      case 'idea': return <Lightbulb className="h-4 w-4" />;
      case 'script': return <FileText className="h-4 w-4" />;
      case 'task': return <Target className="h-4 w-4" />;
      case 'decision': return <CheckCircle className="h-4 w-4" />;
      case 'voice_note': return <Mic className="h-4 w-4" />;
      case 'commitment': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: Receipt['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = receipt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = !selectedProject || receipt.projectName === selectedProject;
    return matchesSearch && matchesProject;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📁 Receipts Folder</h1>
          <p className="text-muted-foreground mt-1">
            Track conversations, ideas, scripts, tasks, and commitments with Bonita
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Project name"
                  value={newProject.projectName}
                  onChange={(e) => setNewProject({...newProject, projectName: e.target.value})}
                />
                <Textarea
                  placeholder="Project description (optional)"
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                />
                <Select 
                  value={newProject.color} 
                  onValueChange={(value) => setNewProject({...newProject, color: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Project color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="yellow">Yellow</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleCreateProject} 
                  disabled={!newProject.projectName || createProjectMutation.isPending}
                  className="w-full"
                >
                  {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showNewReceiptDialog} onOpenChange={setShowNewReceiptDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Receipt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Receipt</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Select 
                    value={newReceipt.receiptType} 
                    onValueChange={(value) => setNewReceipt({...newReceipt, receiptType: value as Receipt['receiptType']})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Receipt type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conversation">💬 Conversation</SelectItem>
                      <SelectItem value="idea">🧠 Idea</SelectItem>
                      <SelectItem value="script">📝 Script</SelectItem>
                      <SelectItem value="task">🎯 Task</SelectItem>
                      <SelectItem value="decision">✅ Decision</SelectItem>
                      <SelectItem value="voice_note">🎤 Voice Note</SelectItem>
                      <SelectItem value="commitment">🧾 Commitment</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={newReceipt.priority} 
                    onValueChange={(value) => setNewReceipt({...newReceipt, priority: value as Receipt['priority']})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Input
                  placeholder="Project name (optional)"
                  value={newReceipt.projectName}
                  onChange={(e) => setNewReceipt({...newReceipt, projectName: e.target.value})}
                />
                
                <Input
                  placeholder="Receipt title"
                  value={newReceipt.title}
                  onChange={(e) => setNewReceipt({...newReceipt, title: e.target.value})}
                />
                
                <Textarea
                  placeholder="Content/Details"
                  value={newReceipt.content}
                  onChange={(e) => setNewReceipt({...newReceipt, content: e.target.value})}
                  rows={4}
                />
                
                <Input
                  placeholder="Tags (comma separated)"
                  value={newReceipt.tags}
                  onChange={(e) => setNewReceipt({...newReceipt, tags: e.target.value})}
                />
                
                <Input
                  type="datetime-local"
                  placeholder="Reminder date (optional)"
                  value={newReceipt.reminderDate}
                  onChange={(e) => setNewReceipt({...newReceipt, reminderDate: e.target.value})}
                />
                
                <Button 
                  onClick={handleCreateReceipt} 
                  disabled={!newReceipt.title || !newReceipt.content || createReceiptMutation.isPending}
                  className="w-full"
                >
                  {createReceiptMutation.isPending ? 'Creating...' : 'Create Receipt'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search receipts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.projectName}>
                {project.projectName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeReceiptTab} onValueChange={(value) => setActiveReceiptTab(value as any)}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="conversations">💬 Convos</TabsTrigger>
          <TabsTrigger value="ideas">🧠 Ideas</TabsTrigger>
          <TabsTrigger value="scripts">📝 Scripts</TabsTrigger>
          <TabsTrigger value="tasks">🎯 Tasks</TabsTrigger>
          <TabsTrigger value="decisions">✅ Decisions</TabsTrigger>
          <TabsTrigger value="voice_notes">🎤 Voice</TabsTrigger>
          <TabsTrigger value="commitments">🧾 Receipts</TabsTrigger>
        </TabsList>

        <TabsContent value={activeReceiptTab} className="space-y-4">
          {receiptsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading receipts...</p>
              </div>
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No receipts found</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your conversations, ideas, and commitments with Bonita
              </p>
              <Button onClick={() => setShowNewReceiptDialog(true)}>
                Create your first receipt
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredReceipts.map((receipt) => (
                <Card key={receipt.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getReceiptIcon(receipt.receiptType)}
                        <CardTitle className="text-lg">{receipt.title}</CardTitle>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(receipt.priority)}`} />
                      </div>
                      <div className="flex items-center gap-2">
                        {receipt.projectName && (
                          <Badge variant="secondary">{receipt.projectName}</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {receipt.receiptType}
                        </Badge>
                        {receipt.reminderDate && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(receipt.reminderDate), 'MMM dd')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {receipt.content}
                    </p>
                    {receipt.tags && receipt.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {receipt.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{format(new Date(receipt.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingReceipt(receipt)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        {receipt.voiceNoteUrl && (
                          <Button variant="ghost" size="sm">
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Special sections for dropped ideas and commitments */}
      {droppedIdeas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              💡 Dropped Ideas (Ready to Rediscover)
            </CardTitle>
            <CardDescription>
              Ideas you mentioned but might have forgotten about
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {droppedIdeas.slice(0, 3).map((idea) => (
                <div key={idea.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{idea.ideaText}</p>
                    {idea.context && <p className="text-sm text-muted-foreground">{idea.context}</p>}
                  </div>
                  <Button variant="outline" size="sm">
                    Rediscover
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue commitments */}
      {commitments.filter(c => c.status === 'overdue').length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="h-5 w-5" />
              🧾 Bonita's Loving Accountability Corner
            </CardTitle>
            <CardDescription className="text-orange-600">
              "You said you wanted to do these things, remember?" 😂
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {commitments.filter(c => c.status === 'overdue').slice(0, 3).map((commitment) => (
                <div key={commitment.id} className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-white">
                  <div>
                    <p className="font-medium">{commitment.commitmentText}</p>
                    {commitment.dueDate && (
                      <p className="text-sm text-muted-foreground">
                        Due: {format(new Date(commitment.dueDate), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    Mark Complete
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}