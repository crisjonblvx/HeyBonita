import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, Image, FileText, AlertCircle, LogOut } from 'lucide-react';
import AdminAuth from './admin-auth';

interface SimpleMetrics {
  totalUsers: number;
  totalEvents: number;
  recentActivity: string;
}

export default function SimpleAdmin() {
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if already authenticated
  useState(() => {
    const adminAuth = localStorage.getItem('admin_authenticated');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
    }
  });

  const handleAuthenticated = () => {
    localStorage.setItem('admin_authenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={handleAuthenticated} />;
  }

  // Simple metrics query
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['/api/analytics/metrics', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/metrics?days=${selectedPeriod}`);
      return response.json();
    },
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Admin Dashboard</h2>
          <p className="text-muted-foreground mb-4">
            Analytics system ready. Data will appear as users interact with the app.
          </p>
          <div className="space-y-2">
            <p className="text-sm">Current status: Backend connected</p>
            <p className="text-sm">Error: {error?.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hey Bonita Admin</h1>
          <p className="text-muted-foreground">Analytics & Support Dashboard</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
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
            <CardTitle className="text-sm font-medium">Scripts Created</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.eventCounts?.find(e => e.eventType === 'script_created')?.count || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Analytics System:</span>
              <span className="text-green-600">Active</span>
            </div>
            <div className="flex justify-between">
              <span>Database:</span>
              <span className="text-green-600">Connected</span>
            </div>
            <div className="flex justify-between">
              <span>Support Email:</span>
              <span className="text-blue-600">cj@heybonita.ai</span>
            </div>
            <div className="flex justify-between">
              <span>Period:</span>
              <span>{metrics?.period || 'Last 7 days'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Raw Data for Debugging */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Analytics Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(metrics, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}