import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Bug, 
  Lightbulb,
  Star,
  X,
  Send
} from 'lucide-react';

interface FeedbackWidgetProps {
  userId: number;
  page?: string;
}

type FeedbackType = 'like' | 'dislike' | 'bug' | 'suggestion' | 'general';

export function FeedbackWidget({ userId, page = 'unknown' }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState<number>(0);
  const { toast } = useToast();

  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: {
      feedbackType: FeedbackType;
      feedbackText?: string;
      rating?: number;
      page: string;
      userAgent: string;
    }) => {
      const response = await apiRequest('POST', '/api/feedback', feedbackData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We'll use it to improve Bonita.",
      });
      setIsOpen(false);
      setSelectedType(null);
      setFeedbackText('');
      setRating(0);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleQuickFeedback = (type: FeedbackType) => {
    if (type === 'like' || type === 'dislike') {
      // For like/dislike, submit immediately
      submitFeedbackMutation.mutate({
        feedbackType: type,
        page,
        userAgent: navigator.userAgent,
      });
    } else {
      // For other types, open detailed form
      setSelectedType(type);
      setIsOpen(true);
    }
  };

  const handleDetailedSubmit = () => {
    if (!selectedType) return;

    submitFeedbackMutation.mutate({
      feedbackType: selectedType,
      feedbackText: feedbackText.trim() || undefined,
      rating: rating > 0 ? rating : undefined,
      page,
      userAgent: navigator.userAgent,
    });
  };

  const feedbackTypes = [
    { type: 'like' as FeedbackType, icon: ThumbsUp, label: 'Like', color: 'text-green-600' },
    { type: 'dislike' as FeedbackType, icon: ThumbsDown, label: 'Dislike', color: 'text-red-600' },
    { type: 'bug' as FeedbackType, icon: Bug, label: 'Report Bug', color: 'text-orange-600' },
    { type: 'suggestion' as FeedbackType, icon: Lightbulb, label: 'Suggestion', color: 'text-blue-600' },
    { type: 'general' as FeedbackType, icon: MessageSquare, label: 'General', color: 'text-gray-600' },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <div className="flex flex-col gap-2">
          {/* Quick feedback buttons */}
          <div className="flex gap-2">
            {feedbackTypes.map(({ type, icon: Icon, label, color }) => (
              <Button
                key={type}
                size="sm"
                variant="outline"
                onClick={() => handleQuickFeedback(type)}
                className={`${color} hover:bg-muted transition-all duration-200 shadow-lg`}
                disabled={submitFeedbackMutation.isPending}
                title={`Quick ${label}`}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <Card className="w-80 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                {selectedType === 'bug' && 'Report a Bug'}
                {selectedType === 'suggestion' && 'Share a Suggestion'}
                {selectedType === 'general' && 'General Feedback'}
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsOpen(false);
                  setSelectedType(null);
                  setFeedbackText('');
                  setRating(0);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Rating stars for suggestions */}
            {selectedType === 'suggestion' && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Rate this feature idea:</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      size="sm"
                      variant="ghost"
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Textarea
              placeholder={
                selectedType === 'bug'
                  ? 'Describe what happened and what you expected...'
                  : selectedType === 'suggestion'
                  ? 'Tell us about your idea...'
                  : 'Share your thoughts...'
              }
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="min-h-[80px] mb-4"
            />

            <div className="flex gap-2">
              <Button
                onClick={handleDetailedSubmit}
                disabled={submitFeedbackMutation.isPending}
                className="flex-1"
              >
                {submitFeedbackMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Submit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}