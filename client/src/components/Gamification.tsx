import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, Star, Flame, Target, Zap, Award, Gift } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { User, Achievement } from '@shared/schema';

interface GamificationProps {
  userId: number;
  user: User;
}

interface LevelInfo {
  currentLevel: number;
  currentPoints: number;
  pointsForNextLevel: number;
  progressPercent: number;
}

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 17000];

function calculateLevelInfo(points: number): LevelInfo {
  let currentLevel = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      currentLevel = i + 1;
      break;
    }
  }

  const nextLevelThreshold = LEVEL_THRESHOLDS[currentLevel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const prevLevelThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const pointsForNextLevel = nextLevelThreshold - points;
  const levelProgress = points - prevLevelThreshold;
  const levelRange = nextLevelThreshold - prevLevelThreshold;
  const progressPercent = currentLevel >= LEVEL_THRESHOLDS.length ? 100 : (levelProgress / levelRange) * 100;

  return {
    currentLevel,
    currentPoints: points,
    pointsForNextLevel: currentLevel >= LEVEL_THRESHOLDS.length ? 0 : pointsForNextLevel,
    progressPercent,
  };
}

function getLevelTitle(level: number): string {
  const titles = [
    "Newcomer", "Friend", "Regular", "Favorite", "Family", 
    "VIP", "Legend", "Icon", "Master", "Bonita's Twin"
  ];
  return titles[Math.min(level - 1, titles.length - 1)] || "Ultimate";
}

export function GamificationPanel({ userId, user }: GamificationProps) {
  const [showAchievements, setShowAchievements] = useState(false);
  
  const { data: achievements = [] } = useQuery({
    queryKey: ['/api/achievements', userId],
    enabled: !!userId,
  });

  const levelInfo = calculateLevelInfo(user.points || 0);
  const recentAchievements = achievements.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Level & Progress */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-purple-800 dark:text-purple-300">
                  Level {levelInfo.currentLevel}
                </CardTitle>
                <CardDescription className="text-purple-600 dark:text-purple-400">
                  {getLevelTitle(levelInfo.currentLevel)}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
              {levelInfo.currentPoints} pts
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress to next level</span>
              {levelInfo.pointsForNextLevel > 0 && (
                <span className="text-muted-foreground">{levelInfo.pointsForNextLevel} more points</span>
              )}
            </div>
            <Progress value={levelInfo.progressPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                  {user.streak || 0}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-500">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {achievements.length}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-500">Achievements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Your Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Chats</span>
              <Badge variant="outline">{user.totalChats || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Images Created</span>
              <Badge variant="outline">{user.totalImages || 0}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Scripts Written</span>
              <Badge variant="outline">{user.totalScripts || 0}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
              <Trophy className="h-4 w-4" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentAchievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center space-x-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Award className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 truncate">
                      {achievement.title}
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-500">
                      +{achievement.points} points
                    </p>
                  </div>
                </div>
              ))}
              {achievements.length > 3 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAchievements(true)}
                  className="w-full text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/50"
                >
                  View All Achievements ({achievements.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements Modal */}
      <Dialog open={showAchievements} onOpenChange={setShowAchievements}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Your Achievements
            </DialogTitle>
            <DialogDescription>
              All the milestones you've unlocked with Bonita!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Gift className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium">{achievement.title}</h4>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="secondary">+{achievement.points} points</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {achievements.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Start chatting with Bonita to unlock your first achievement!
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AchievementToast({ achievements, points, levelUp, newLevel }: { 
  achievements: Achievement[]; 
  points: number;
  levelUp?: boolean;
  newLevel?: number;
}) {
  if (achievements.length === 0 && !levelUp) return null;

  return (
    <div className="space-y-2">
      {levelUp && newLevel && (
        <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-lg border border-purple-200 dark:border-purple-700">
          <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <div>
            <p className="font-medium text-purple-800 dark:text-purple-300">Level Up!</p>
            <p className="text-sm text-purple-600 dark:text-purple-400">
              You're now Level {newLevel} - {getLevelTitle(newLevel)}!
            </p>
          </div>
        </div>
      )}
      
      {achievements.map((achievement) => (
        <div key={achievement.id} className="flex items-center space-x-2 p-3 bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900 dark:to-amber-900 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-300">{achievement.title}</p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              {achievement.description} (+{achievement.points} points)
            </p>
          </div>
        </div>
      ))}
      
      {points > 0 && achievements.length === 0 && !levelUp && (
        <div className="flex items-center space-x-2 p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-700 dark:text-green-300">+{points} points earned!</p>
        </div>
      )}
    </div>
  );
}