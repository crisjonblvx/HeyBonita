import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import MobileHome from "@/pages/mobile-home";
import Admin from "@/pages/simple-admin";
import Auth from "@/pages/auth";
import NotFound from "@/pages/not-found";
import { FeedbackWidget } from "@/components/FeedbackWidget";

function AppRoute() {
  const isMobile = useIsMobile();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // Always call hooks in the same order
  const [layoutType] = useState(() => isMobile ? 'mobile' : 'desktop');

  useEffect(() => {
    console.log('App.tsx: Checking authentication status...');
    // Check authentication status via server session
    fetch('/api/auth/status', { credentials: 'include' })
      .then(res => {
        console.log('App.tsx: Auth status response:', res.status, res.headers.get('content-type'));
        return res.json();
      })
      .then(data => {
        console.log('App.tsx: Auth status data:', data);
        if (data.authenticated && data.user) {
          console.log('App.tsx: User authenticated, setting user:', data.user.username);
          setUser(data.user);
        } else {
          console.log('App.tsx: User not authenticated');
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('App.tsx: Auth status check failed:', error);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <>
      {layoutType === 'mobile' ? <MobileHome /> : <Home />}
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/admin" component={Admin} />
      <Route path="/app" component={AppRoute} />
      <Route path="/landing" component={Landing} />
      <Route path="/" component={Landing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
