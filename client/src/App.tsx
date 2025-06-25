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

function AppRoute() {
  const isMobile = useIsMobile();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const savedUserId = localStorage.getItem('userId');
    const savedUsername = localStorage.getItem('username');
    
    if (savedUserId && savedUsername) {
      setUser({ id: parseInt(savedUserId), username: savedUsername });
    }
    setIsLoading(false);
  }, []);

  const handleAuthenticated = (authenticatedUser: any) => {
    setUser(authenticatedUser);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthenticated={handleAuthenticated} />;
  }

  // Prevent component switching during hot reloads
  const [layoutType] = useState(() => isMobile ? 'mobile' : 'desktop');
  
  return layoutType === 'mobile' ? <MobileHome /> : <Home />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/app" component={AppRoute} />
      <Route path="/admin" component={Admin} />
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
