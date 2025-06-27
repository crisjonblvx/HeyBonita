import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  MessageCircle, 
  Image, 
  Video, 
  Mic,
  Heart,
  Star,
  Check,
  Mail,
  ArrowRight,
  Sparkles,
  Globe,
  Volume2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function Landing() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      // Store email for future notifications
      await apiRequest('POST', '/api/waitlist', {
        body: JSON.stringify({ email: email.trim() }),
        headers: { 'Content-Type': 'application/json' }
      });

      toast({
        title: "Welcome to the waitlist!",
        description: "We'll notify you about updates and premium features.",
      });
      
      // Navigate to deployed app
      setTimeout(() => {
        window.location.href = 'https://hey-bonita.replit.app/app';
      }, 1500);
    } catch (error) {
      console.error('Waitlist signup error:', error);
      // Allow access even if waitlist fails
      setLocation('/app');
    } finally {
      setIsSubmitting(false);
    }
  };

  const skipToApp = () => {
    window.location.href = 'https://hey-bonita.replit.app/app';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Access Banner */}
      <div className="bg-primary text-primary-foreground py-3">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <span className="text-sm font-medium">Ready to chat with Bonita? Access the app now!</span>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={skipToApp}
              className="text-primary"
            >
              Launch Bonita <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img 
              src="/images/bonita-logo-alpha.png" 
              alt="Bonita AI" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold">Bonita AI</h1>
              <p className="text-xs text-muted-foreground">Your Digital Bronx Auntie</p>
            </div>
          </div>
          <Button variant="ghost" onClick={skipToApp}>
            Try App <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Badge variant="secondary" className="mb-4">
          <Sparkles className="w-3 h-3 mr-1" />
          Now in Beta
        </Badge>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
          Meet Bonita
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Your Digital Bronx Auntie who gives you real talk, creates stunning images, 
          and helps you write viral video scripts. All with authentic culture and wisdom.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button size="lg" onClick={skipToApp} className="text-lg px-8">
            Try Bonita Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
            Learn More
          </Button>
        </div>

        {/* Hero Image */}
        <div className="relative max-w-4xl mx-auto">
          <div className="aspect-video bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-2xl border border-border/50 flex items-center justify-center">
            <div className="text-center">
              <img 
                src="/images/bonita-logo-alpha.png" 
                alt="Bonita AI Character" 
                className="w-48 h-48 mx-auto mb-6 object-contain"
              />
              <p className="text-muted-foreground text-lg">Meet your Digital Bronx Auntie with authentic personality</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Makes Bonita Special</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            More than just AI - she's got personality, culture, and the wisdom of a Bronx auntie who's seen it all.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <MessageCircle className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Real Talk Conversations</CardTitle>
              <CardDescription>
                Get authentic advice in English, Spanish, Portuguese, or French. Sweet nurturing or tough love - your choice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4" />
                <span>4 Languages</span>
                <Volume2 className="h-4 w-4" />
                <span>Voice Chat</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <Image className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Custom Image Creation</CardTitle>
              <CardDescription>
                Generate stunning visuals with DALL-E 3 technology. Perfect for social media, presentations, or personal projects.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4" />
                <span>DALL-E 3 Powered</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <Video className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Viral Video Scripts</CardTitle>
              <CardDescription>
                Create engaging scripts for TikTok, Instagram, YouTube, and more. Bonita knows what makes content pop.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mic className="h-4 w-4" />
                <span>Platform Optimized</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30 rounded-3xl mx-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Coming Soon: Premium Features</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join our waitlist to be the first to access premium features and get early-bird pricing.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          <Card className="relative">
            <CardHeader>
              <CardTitle className="flex items-center">
                Free Access
                <Badge variant="secondary" className="ml-2">Current</Badge>
              </CardTitle>
              <CardDescription>Perfect for getting started with Bonita</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>5 chats per day</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>2 images per day</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>1 video script per day</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>All 4 languages</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative border-primary/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                Premium Membership
                <Badge className="ml-2">Coming Soon</Badge>
              </CardTitle>
              <CardDescription>For creators and professionals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>Unlimited conversations</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>Unlimited image generation</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>Advanced video script templates</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>Priority voice processing</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>Export & save conversations</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span>Early access to new features</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Signup */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Join the Waitlist</CardTitle>
            <CardDescription>
              Be the first to know when premium features launch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                We'll only email you about Bonita updates. No spam, ever.
              </p>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Meet Your Digital Auntie?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start chatting with Bonita today. She's got the wisdom, the culture, and the tools to help you succeed.
          </p>
          <Button size="lg" onClick={skipToApp} className="text-lg px-12">
            Start Chatting Free <MessageCircle className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src="/images/bonita-logo-alpha.png" 
              alt="Bonita AI" 
              className="w-10 h-10 object-contain"
            />
            <span className="text-lg font-semibold">Bonita AI</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Your Digital Bronx Auntie - Built with love and authentic culture
          </p>
          <Button variant="ghost" size="sm" onClick={() => window.open('mailto:cj@heybonita.ai?subject=Bonita AI Inquiry', '_blank')}>
            <Mail className="mr-2 h-4 w-4" />
            Contact Us
          </Button>
        </div>
      </footer>
    </div>
  );
}