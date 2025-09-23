import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGameUser } from '@/hooks/useGameUser';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Trophy } from 'lucide-react';

export const LanovaQuizGame = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [communicationTimeout, setCommunicationTimeout] = useState<NodeJS.Timeout | null>(null);
  const { gameUser, awardCoins } = useGameUser();
  const { toast } = useToast();

  const handleMessage = useCallback(async (event: MessageEvent) => {
    // Debug: Log all messages received
    console.log('🎯 Received message from:', event.origin);
    console.log('🎯 Message data:', event.data);
    
    // Clear timeout if we receive any message
    if (communicationTimeout) {
      clearTimeout(communicationTimeout);
      setCommunicationTimeout(null);
    }

    try {
      const data = event.data;
      console.log('🎯 Processing quiz message:', data);
      
      if (data.type === 'QUIZ_COMPLETED' && data.score !== undefined) {
        console.log('🎯 Quiz completed with score:', data.score);
        setLastScore(data.score);
        setGameStarted(false);
        
        if (gameUser) {
          console.log('🎯 Awarding coins for user:', gameUser.id);
          // Award coins based on score (max 25 coins for perfect score)
          const result = await awardCoins('lanova-quiz', data.score);
          console.log('🎯 Award coins result:', result);
          
          if (result?.success) {
            toast({
              title: "🎉 Quiz Completed!",
              description: `You earned ${result.coins_awarded} coins! New balance: ${result.new_balance}`,
            });
          } else {
            toast({
              title: "Game Complete",
              description: result?.error || "Quiz completed but couldn't award coins",
              variant: "destructive",
            });
          }
        } else {
          console.log('🎯 No gameUser found when trying to award coins');
        }
      } else if (data.type === 'QUIZ_STARTED') {
        setGameStarted(true);
        console.log('🎯 Quiz game started');
        
        // Set a timeout to detect if the quiz doesn't send completion message
        const timeout = setTimeout(() => {
          console.log('🎯 Quiz communication timeout - external quiz may not be sending messages');
          toast({
            title: "⚠️ Communication Issue",
            description: "Quiz may not be communicating properly. Try refreshing or playing again.",
            variant: "destructive",
          });
        }, 300000); // 5 minutes timeout
        
        setCommunicationTimeout(timeout);
      } else {
        console.log('🎯 Unknown message type or missing score:', data);
      }
    } catch (error) {
      console.error('🎯 Error handling quiz message:', error);
    }
  }, [gameUser, awardCoins, toast, communicationTimeout]);

  useEffect(() => {
    console.log('🎯 Setting up message listener for Lanova Quiz');
    window.addEventListener('message', handleMessage);
    
    return () => {
      console.log('🎯 Removing message listener for Lanova Quiz');
      window.removeEventListener('message', handleMessage);
      if (communicationTimeout) {
        clearTimeout(communicationTimeout);
      }
    };
  }, [handleMessage, communicationTimeout]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    
    // Send user info to the iframe if available
    if (iframeRef.current && gameUser) {
      const userInfo = {
        type: 'USER_INFO',
        userId: gameUser.id,
        displayName: gameUser.display_name || 'Player',
        coinBalance: gameUser.coin_balance
      };
      
      console.log('🎯 Sending user info to iframe:', userInfo);
      iframeRef.current.contentWindow?.postMessage(userInfo, '*');
    }
  }, [gameUser]);

  const handlePlayAgain = useCallback(() => {
    setIsLoading(true);
    setGameStarted(false);
    setLastScore(null);
    setIframeKey(prev => prev + 1);
    
    if (communicationTimeout) {
      clearTimeout(communicationTimeout);
      setCommunicationTimeout(null);
    }
    
    console.log('🎯 Reloading quiz for new game');
    toast({
      title: "🔄 Quiz Reloaded",
      description: "Starting a new quiz session!",
    });
  }, [communicationTimeout, toast]);

  const handleManualScoreEntry = useCallback(async () => {
    if (!gameUser) return;
    
    // Ask user for score if external communication fails
    const scoreInput = prompt("Enter your quiz score (0-100):");
    if (scoreInput && !isNaN(Number(scoreInput))) {
      const score = Math.max(0, Math.min(100, Number(scoreInput)));
      console.log('🎯 Manual score entry:', score);
      
      const result = await awardCoins('lanova-quiz', score);
      if (result?.success) {
        toast({
          title: "🎉 Score Recorded!",
          description: `You earned ${result.coins_awarded} coins! New balance: ${result.new_balance}`,
        });
        setLastScore(score);
      } else {
        toast({
          title: "Error",
          description: result?.error || "Failed to record score",
          variant: "destructive",
        });
      }
    }
  }, [gameUser, awardCoins, toast]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              🏆 Lanova Food Quiz
              <Badge variant="outline">Playing</Badge>
            </span>
            {gameUser && (
              <Badge variant="secondary">
                💰 {gameUser.coin_balance} coins
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Test your knowledge about Lanova Restaurant's menu and Middle Eastern cuisine!
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Coins per quiz:</span>
            <span className="font-semibold">Up to 25 🪙</span>
          </div>

          {gameUser && (
            <div className="text-xs text-muted-foreground">
              Daily coins remaining: {gameUser.daily_coin_limit - gameUser.coins_earned_today}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading quiz...</span>
            </div>
          </div>
        )}
        
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src="https://lanova-play-redeem.lovable.app/"
          className="w-full h-[600px] border rounded-lg shadow-sm"
          title="Lanova Food Quiz"
          onLoad={handleIframeLoad}
          allow="fullscreen"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>

      <div className="flex flex-col gap-4">
        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={handlePlayAgain}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Play Again
          </Button>
          
          {!gameStarted && !isLoading && (
            <Button 
              onClick={handleManualScoreEntry}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Trophy className="h-4 w-4" />
              Manual Score Entry
            </Button>
          )}
        </div>

        {/* Status cards */}
        {lastScore !== null && (
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                🎉 Last Quiz Score: {lastScore}/100
              </p>
            </CardContent>
          </Card>
        )}

        {!gameStarted && !isLoading && lastScore === null && (
          <Card className="bg-accent/20 border-primary/20">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                💡 Your quiz results will be automatically saved to your account when you complete the game!
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                If the quiz doesn't communicate properly, you can use "Manual Score Entry" as a backup.
              </p>
            </CardContent>
          </Card>
        )}

        {gameStarted && (
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-4 text-center">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                🎮 Quiz in progress... Good luck!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};