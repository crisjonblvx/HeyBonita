import { useState, memo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useLanguage } from './LanguageProvider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { Card, CardContent } from '@/components/ui/card';
import { 
  Image, 
  Download, 
  RefreshCw, 
  Share2, 
  Wand2, 
  User, 
  Briefcase, 
  Home, 
  Palette,
  Mic
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GeneratedImage {
  id: number;
  prompt: string;
  imageUrl: string;
  createdAt: string;
}

interface ImageGeneratorProps {
  userId: number;
}

const presetPrompts = {
  portrait: "Professional headshot of a confident person, studio lighting, high quality",
  business: "Modern business professional in corporate setting, clean background",
  lifestyle: "Casual lifestyle photo, natural lighting, authentic moment",
  creative: "Artistic and creative composition, vibrant colors, unique perspective"
};

const ImageGenerator = memo(function ImageGenerator({ userId }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const { language, t } = useLanguage();
  const { toast } = useToast();

  console.log('ImageGenerator rendered with userId:', userId);

  // Fetch generated images with normal caching
  const { data: images = [], isError, error } = useQuery({
    queryKey: ['/api/images'],
    enabled: !!userId,
    retry: 2,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    refetchInterval: false,
    onError: (error: any) => {
      console.error('Error fetching images:', error);
    },
  });

  // Filter out expired images
  const validImages = Array.isArray(images) ? images.filter((image: GeneratedImage) => {
    const now = new Date();
    const createdAt = new Date(image.createdAt);
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24; // Only show images less than 24 hours old
  }) : [];

  // Generate image mutation
  const queryClient = useQueryClient();
  
  const generateImageMutation = useMutation({
    mutationFn: async (imageData: { userId: number; prompt: string; language: string }) => {
      try {
        const response = await fetch('/api/images/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(imageData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Image generation error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/images'] });
      queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}`] });
      
      if (data && data.imageUrl) {
        setCurrentImage(data.imageUrl);
        toast({
          title: "Image Generated!",
          description: "Your image is ready!",
        });
      }
      setPrompt('');
    },
    onError: (error: any) => {
      console.error('Image generation error:', error);
      let errorMessage = "Failed to generate image. Please try again.";
      
      if (error?.message?.includes('rate limit')) {
        errorMessage = "Rate limit reached. Please wait a moment before trying again.";
      } else if (error?.message?.includes('network')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error?.message?.includes('database')) {
        errorMessage = "Database temporarily unavailable. Your image was generated but not saved.";
      }
      
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleGenerateImage = () => {
    if (!prompt.trim()) return;

    generateImageMutation.mutate({
      userId,
      prompt: prompt.trim(),
      language,
    });
  };

  const handlePresetClick = (presetKey: keyof typeof presetPrompts) => {
    setPrompt(presetPrompts[presetKey]);
  };

  const handleSurpriseMe = () => {
    const surprisePrompts = [
      "A magical forest with glowing mushrooms and fairy lights",
      "Futuristic cityscape at sunset with flying cars",
      "Cozy coffee shop on a rainy day, warm lighting",
      "Majestic mountain landscape with aurora borealis",
      "Underwater coral reef with tropical fish",
      "Steampunk robot in a Victorian library"
    ];
    const randomPrompt = surprisePrompts[Math.floor(Math.random() * surprisePrompts.length)];
    setPrompt(randomPrompt);
  };

  const downloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bonita-generated-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Image downloaded successfully!",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Error",
        description: "Failed to download image.",
        variant: "destructive",
      });
    }
  };

  const shareImage = async (imageUrl: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Generated by Bonita AI',
          url: imageUrl,
        });
      } else {
        await navigator.clipboard.writeText(imageUrl);
        toast({
          title: "Success",
          description: "Image URL copied to clipboard!",
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      // Fallback to manual copy
      try {
        await navigator.clipboard.writeText(imageUrl);
        toast({
          title: "Success",
          description: "Image URL copied to clipboard!",
        });
      } catch (clipboardError) {
        toast({
          title: "Error",
          description: "Failed to share image.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - Hidden on mobile, shown on desktop */}
      <div className="hidden md:block p-6 border-b border-border bg-background flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t('imageHeader')}</h2>
            <p className="text-muted-foreground">{t('imageSubtitle')}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              handleSurpriseMe();
              toast({
                title: "Surprise Prompt Selected!",
                description: "Random creative prompt loaded - click Generate Image to create it.",
              });
            }}
            disabled={generateImageMutation.isPending}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            {t('surpriseMe')}
          </Button>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden p-4 border-b border-border bg-background flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Generate Images</h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              handleSurpriseMe();
              toast({
                title: "Surprise Prompt Selected!",
                description: "Random creative prompt loaded - click Generate Image to create it.",
              });
            }}
            disabled={generateImageMutation.isPending}
          >
            <Wand2 className="mr-2 h-3 w-3" />
            Surprise
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          {/* Preset Prompts */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">{t('quickPresets')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                className="p-4 border-2 border-border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200 flex flex-col items-center space-y-2"
                onClick={() => {
                  console.log('Portrait preset clicked');
                  handlePresetClick('portrait');
                  toast({
                    title: "Preset Selected",
                    description: "Portrait preset loaded!",
                  });
                }}
              >
                <User className="h-6 w-6" />
                <span className="text-sm font-medium">{t('portrait')}</span>
              </div>
              <div
                className="p-4 border-2 border-border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200 flex flex-col items-center space-y-2"
                onClick={() => {
                  console.log('Business preset clicked');
                  handlePresetClick('business');
                  toast({
                    title: "Preset Selected",
                    description: "Business preset loaded!",
                  });
                }}
              >
                <Briefcase className="h-6 w-6" />
                <span className="text-sm font-medium">{t('business')}</span>
              </div>
              <div
                className="p-4 border-2 border-border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200 flex flex-col items-center space-y-2"
                onClick={() => {
                  console.log('Lifestyle preset clicked');
                  handlePresetClick('lifestyle');
                  toast({
                    title: "Preset Selected",
                    description: "Lifestyle preset loaded!",
                  });
                }}
              >
                <Home className="h-6 w-6" />
                <span className="text-sm font-medium">{t('lifestyle')}</span>
              </div>
              <div
                className="p-4 border-2 border-border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200 flex flex-col items-center space-y-2"
                onClick={() => {
                  console.log('Creative preset clicked');
                  handlePresetClick('creative');
                  toast({
                    title: "Preset Selected",
                    description: "Creative preset loaded!",
                  });
                }}
              >
                <Palette className="h-6 w-6" />
                <span className="text-sm font-medium">{t('creative')}</span>
              </div>
            </div>
          </div>

          {/* Generated Image Display */}
          <div className="mb-8">
            <Card>
              <CardContent className="p-8 text-center">
                {currentImage ? (
                  <>
                    <img 
                      src={currentImage} 
                      alt="Generated Image" 
                      className="mx-auto rounded-xl shadow-lg max-w-full h-auto mb-4"
                    />
                    <div className="flex justify-center space-x-3">
                      <Button onClick={() => downloadImage(currentImage)}>
                        <Download className="mr-2 h-4 w-4" />
                        {t('download')}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          if (prompt.trim()) {
                            handleGenerateImage();
                          } else {
                            toast({
                              title: "No prompt",
                              description: "Enter a prompt to remix the image.",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={generateImageMutation.isPending}
                      >
                        <RefreshCw className={`mr-2 h-4 w-4 ${generateImageMutation.isPending ? 'animate-spin' : ''}`} />
                        {t('remix')}
                      </Button>
                      <Button variant="outline" onClick={() => shareImage(currentImage)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        {t('share')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="py-16">
                    <Image className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {generateImageMutation.isPending 
                        ? "Generating your image..." 
                        : "Your generated image will appear here"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Prompt Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('describeImage')}
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A beautiful sunset over the city skyline with warm golden light..."
                rows={3}
                className="resize-none"
              />
            </div>
            
            <div className="flex space-x-3">
              <Button 
                onClick={handleGenerateImage}
                disabled={!prompt.trim() || generateImageMutation.isPending}
                className="flex-1"
              >
                {generateImageMutation.isPending ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Image className="mr-2 h-4 w-4" />
                )}
                {t('generateImage')}
              </Button>
              <Button size="icon" variant="outline">
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Images Created Section */}
          {validImages.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Images Created ({validImages.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {validImages.slice(0, 9).map((image: GeneratedImage) => (
                  <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square relative">
                      <img 
                        src={image.imageUrl} 
                        alt={image.prompt}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setCurrentImage(image.imageUrl)}
                        onError={(e) => {
                          console.log('Image load error:', image.imageUrl);
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMiA4VjE2TTggMTJIMTYiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHN2Zz4K';
                          e.currentTarget.alt = 'Image unavailable';
                        }}
                      />
                      <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
                        <div className="flex space-x-1">
                          <button
                            className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              downloadImage(image.imageUrl).catch(err => console.error('Download failed:', err));
                            }}
                          >
                            <Download className="h-3 w-3" />
                          </button>
                          <button
                            className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white rounded flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              shareImage(image.imageUrl).catch(err => console.error('Share failed:', err));
                            }}
                          >
                            <Share2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {image.prompt}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(image.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export { ImageGenerator };
