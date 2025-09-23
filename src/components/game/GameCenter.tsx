import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CandyCrushGame from './CandyCrushGame';
import { LanovaFoodQuiz } from './LanovaFoodQuiz';
import { useAuth } from '@/hooks/useAuth';
import { useGameUser } from '@/hooks/useGameUser';
import { AuthModal } from '../auth/AuthModal';

export const GameCenter = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user } = useAuth();
  const { gameUser } = useGameUser();

  const handleGameSelect = (gameId: string) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setSelectedGame(gameId);
  };

  if (selectedGame === 'candy-crush') {
    return (
      <div className="space-y-4">
        <Button 
          onClick={() => setSelectedGame(null)} 
          variant="outline"
        >
          ← Back to Games
        </Button>
        <CandyCrushGame />
      </div>
    );
  }

  if (selectedGame === 'lanova-quiz') {
    return (
      <div className="space-y-4">
        <Button 
          onClick={() => setSelectedGame(null)} 
          variant="outline"
        >
          ← Back to Games
        </Button>
        <LanovaFoodQuiz />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">🎮 Game Center</h2>
          <p className="text-muted-foreground">
            Play games, earn coins, and redeem them for delicious food!
          </p>
          {gameUser && (
            <Badge variant="secondary" className="mt-2">
              💰 {gameUser.coin_balance} coins | 
              Daily limit: {gameUser.daily_coin_limit - gameUser.coins_earned_today} remaining
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                onClick={() => handleGameSelect('candy-crush')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🍬 Candy Crush
                <Badge variant="outline">Available</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Match 3 or more candies to earn points and coins! The classic puzzle game with a reward twist.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Coins per 200 points:</span>
                  <span className="font-semibold">1 🪙</span>
                </div>
                <div className="flex justify-between">
                  <span>Max coins per game:</span>
                  <span className="font-semibold">25 🪙</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                onClick={() => handleGameSelect('lanova-quiz')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏆 Lanova Food Quiz
                <Badge variant="outline">Available</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Test your knowledge about Lanova Restaurant's menu and Middle Eastern cuisine to earn coins!
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Coins per quiz:</span>
                  <span className="font-semibold">Up to 25 🪙</span>
                </div>
                <div className="flex justify-between">
                  <span>Play directly:</span>
                  <span className="font-semibold">Integrated game</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎯 Memory Match
                <Badge variant="secondary">Coming Soon</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Test your memory with card matching games. Perfect memory = perfect rewards!
              </p>
              <div className="space-y-2 text-sm opacity-60">
                <div className="flex justify-between">
                  <span>Perfect round bonus:</span>
                  <span className="font-semibold">25 🪙</span>
                </div>
                <div className="flex justify-between">
                  <span>Bonus rounds:</span>
                  <span className="font-semibold">Up to 35 🪙</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {!user && (
          <Card className="bg-accent/20 border-primary/20">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Ready to start earning coins? 🪙</h3>
              <p className="text-muted-foreground mb-4">
                Create an account to save your progress, earn coins, and redeem them for real food!
              </p>
              <Button onClick={() => setAuthModalOpen(true)} size="lg">
                Create Account & Play
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  );
};