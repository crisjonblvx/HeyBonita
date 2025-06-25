import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, MessageSquare, Image, FileText, TrendingUp, AlertCircle } from 'lucide-react';

interface AnalyticsMetrics {
  totalUsers: number;
  dailyActiveUsers: Array<{ date: string; users: number }>;
  eventCounts: Array<{ eventType: string; count: number }>;
  topUsers: Array<{ userId: number; eventCount: number }>;
  period: string;
}

interface SupportTicket {
  id: number;
  userId?: number;
  email: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
}

export default function Admin() {
  const [selectedPeriod, setSelectedPeriod] = useState(7);

  // Fetch analytics metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<AnalyticsMetrics>({
    queryKey: ['/api/analytics/metrics', selectedPeriod],
    queryFn: () => fetch(`/api/analytics/metrics?days=${selectedPeriod}`).then(res => res.json()),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch support tickets
  const { data: tickets, isLoading: ticketsLoading } = useQuery<SupportTicket[]>({
    queryKey: ['/api/support/tickets'],
    queryFn: () => fetch('/api/support/tickets').then(res => res.json()),
    refetchInterval: 60000, // Refresh every minute
  });

  if (metricsLoading || ticketsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const openTickets = tickets?.filter(t => t.status === 'open') || [];
  const highPriorityTickets = tickets?.filter(t => t.priority === 'high' || t.priority === 'urgent') || [];

  // Get event counts for visualization
  const eventData = metrics?.eventCounts?.map(event => ({
    name: event.eventType.replace('_', ' ').toUpperCase(),
    count: event.count
  })) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Hey Bonita Analytics & Support</p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30].map(days => (
            <Button
              key={days}
              variant={selectedPeriod === days ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(days)}
            >
              {days} days
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chat Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.eventCounts?.find(e => e.eventType === 'chat_sent')?.count || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images Generated</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.eventCounts?.find(e => e.eventType === 'image_generated')?.count || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{openTickets.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics?.dailyActiveUsers || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Support Tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Support Tickets
            {highPriorityTickets.length > 0 && (
              <Badge variant="destructive">{highPriorityTickets.length} High Priority</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tickets?.slice(0, 10).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">#{ticket.id}</span>
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status}
                    </Badge>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <h4 className="font-medium">{ticket.subject}</h4>
                  <p className="text-sm text-muted-foreground">{ticket.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>
            ))}
            {(!tickets || tickets.length === 0) && (
              <p className="text-center text-muted-foreground py-8">No support tickets yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Users */}
      {metrics?.topUsers && metrics.topUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.topUsers.map((user, index) => (
                <div key={user.userId} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">User #{user.userId}</span>
                  <Badge variant="secondary">{user.eventCount} actions</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}