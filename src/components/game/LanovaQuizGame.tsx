import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGameUser } from '@/hooks/useGameUser';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export const LanovaQuizGame = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const { gameUser, awardCoins } = useGameUser();
  const { toast } = useToast();

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Debug: Log all messages received
      console.log('🎯 Received message from:', event.origin);
      console.log('🎯 Message data:', event.data);
      
      // Accept messages from any origin for debugging
      // if (event.origin !== 'https://lanova-play-redeem.lovable.app') {
      //   console.log('Message rejected - wrong origin:', event.origin);
      //   return;
      // }

      try {
        const data = event.data;
        console.log('🎯 Processing quiz message:', data);
        
        if (data.type === 'QUIZ_COMPLETED' && data.score !== undefined) {
          console.log('🎯 Quiz completed with score:', data.score);
          
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
        } else {
          console.log('🎯 Unknown message type or missing score:', data);
        }
      } catch (error) {
        console.error('🎯 Error handling quiz message:', error);
      }
    };

    // Debug: Log that we're setting up the message listener
    console.log('🎯 Setting up message listener for Lanova Quiz');
    window.addEventListener('message', handleMessage);
    
    return () => {
      console.log('🎯 Removing message listener for Lanova Quiz');
      window.removeEventListener('message', handleMessage);
    };
  }, [gameUser, awardCoins, toast]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    
    // Send user info to the iframe if available
    if (iframeRef.current && gameUser) {
      const userInfo = {
        type: 'USER_INFO',
        userId: gameUser.id,
        displayName: gameUser.display_name || 'Player',
        coinBalance: gameUser.coin_balance
      };
      
      iframeRef.current.contentWindow?.postMessage(userInfo, 'https://lanova-play-redeem.lovable.app');
    }
  };

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
          ref={iframeRef}
          src="https://lanova-play-redeem.lovable.app/"
          className="w-full h-[600px] border rounded-lg shadow-sm"
          title="Lanova Food Quiz"
          onLoad={handleIframeLoad}
          allow="fullscreen"
        />
      </div>

      {!gameStarted && !isLoading && (
        <Card className="bg-accent/20 border-primary/20">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              💡 Your quiz results will be automatically saved to your account when you complete the game!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};