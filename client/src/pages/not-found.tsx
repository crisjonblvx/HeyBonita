import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-muted-foreground mb-6">Page not found</p>
        <Button onClick={() => setLocation('/')}>
          Go Home
        </Button>
      </div>
    </div>
  );
}