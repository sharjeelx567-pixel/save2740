'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Trophy,
  Sparkles,
  Target,
  TrendingUp,
  Share2,
  ChevronRight,
  Zap,
  Gift,
  Flame,
} from 'lucide-react';
import { PlanCompletionData } from '@/lib/types/save2740';

interface PlanCompletedCelebrationProps {
  completionData: PlanCompletionData;
  onRestart?: () => void;
  onCreateNew?: () => void;
}

export function PlanCompletedCelebration({
  completionData,
  onRestart,
  onCreateNew,
}: PlanCompletedCelebrationProps) {
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Save2740 Plan Completed!',
          text: `I just completed my "${completionData.planName}" plan and saved $${(completionData.totalSaved / 100).toFixed(2)}! 🎉`,
          url: window.location.href,
        });
      } else {
        // Copy to clipboard fallback
        await navigator.clipboard.writeText(
          `I just completed my "${completionData.planName}" plan and saved $${(completionData.totalSaved / 100).toFixed(2)}! 🎉`
        );
        toast({
          title: 'Copied',
          description: 'Achievement copied to clipboard',
        });
      }
    } catch (error) {
      toast({
        title: 'Share failed',
        description: 'Unable to share',
        variant: 'destructive',
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Celebration Card */}
      <Card className="p-6 bg-gradient-to-b from-yellow-50 to-orange-50 border-yellow-200">
        <div className="text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <div>
            <h2 className="text-3xl font-bold text-orange-900 mb-2">Plan Completed!</h2>
            <p className="text-lg text-orange-700 font-semibold">{completionData.planName}</p>
          </div>

          {/* Main Stats */}
          <div className="bg-white rounded-lg p-6 space-y-3">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Saved</p>
              <p className="text-4xl font-bold text-green-600">
                ${(completionData.totalSaved / 100).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mt-1">of ${(completionData.targetAmount / 100).toFixed(2)} target</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t">
              <div className="text-center">
                <p className="text-xs text-gray-600">Days to Complete</p>
                <p className="text-2xl font-bold text-blue-600">{completionData.daysToComplete}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600">Total Contributions</p>
                <p className="text-2xl font-bold text-blue-600">{completionData.totalContributions}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-center gap-2 text-orange-600">
                <Flame className="w-5 h-5" />
                <span className="font-bold text-lg">Longest Streak: {completionData.longestStreak} days</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Achievements */}
      {completionData.achievements.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-bold">Achievements Unlocked</h3>
          </div>

          <div className="space-y-3">
            {completionData.achievements.map((achievement, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
              >
                <span className="text-3xl">{achievement.badge}</span>
                <div className="flex-1">
                  <p className="font-semibold">{achievement.title}</p>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Suggestions for Next Plan */}
      {completionData.nextPlanSuggestions && completionData.nextPlanSuggestions.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-brand-green" />
            <h3 className="text-lg font-bold">What's Next?</h3>
          </div>

          <div className="space-y-3">
            {completionData.nextPlanSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={onCreateNew}
                className="w-full text-left p-3 border rounded-lg hover:bg-green-50 hover:border-green-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{suggestion.name}</p>
                    <p className="text-sm text-gray-600">{suggestion.reason}</p>
                    <p className="text-sm font-bold text-brand-green mt-1">
                      ${(suggestion.suggestedAmount / 100).toFixed(2)} target
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button onClick={onCreateNew} className="w-full bg-brand-green hover:bg-brand-green/90">
          <Target className="mr-2 h-4 w-4" />
          Create New Plan
        </Button>

        <Button onClick={onRestart} variant="outline" className="w-full">
          <Zap className="mr-2 h-4 w-4" />
          Restart This Plan
        </Button>

        <Button
          onClick={handleShare}
          disabled={sharing}
          variant="outline"
          className="w-full"
        >
          <Share2 className="mr-2 h-4 w-4" />
          {sharing ? 'Sharing...' : 'Share Achievement'}
        </Button>
      </div>

      {/* Celebration Message */}
      <Alert className="bg-green-50 border-green-200">
        <Gift className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700">
          Bonus: You've earned 500 Save2740 points! Check your rewards section.
        </AlertDescription>
      </Alert>
    </div>
  );
}
