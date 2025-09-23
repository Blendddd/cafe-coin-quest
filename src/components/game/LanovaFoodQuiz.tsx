import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useGameUser } from '@/hooks/useGameUser';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: 'menu' | 'culture' | 'ingredients';
}

const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "What is the main ingredient in traditional hummus?",
    options: ["Lentils", "Chickpeas", "Black beans", "White beans"],
    correctAnswer: 1,
    category: "ingredients"
  },
  {
    id: 2,
    question: "Which Middle Eastern spice blend contains sumac, thyme, and sesame seeds?",
    options: ["Baharat", "Za'atar", "Ras el hanout", "Dukkah"],
    correctAnswer: 1,
    category: "ingredients"
  },
  {
    id: 3,
    question: "What type of bread is traditionally used for shawarma wraps?",
    options: ["Naan", "Pita", "Lavash", "Focaccia"],
    correctAnswer: 2,
    category: "menu"
  },
  {
    id: 4,
    question: "Which dish is known as the 'national dish' of Lebanon?",
    options: ["Falafel", "Tabbouleh", "Kibbeh", "Fattoush"],
    correctAnswer: 1,
    category: "culture"
  },
  {
    id: 5,
    question: "What is the main protein in traditional kebabs?",
    options: ["Chicken", "Lamb", "Beef", "All of the above"],
    correctAnswer: 3,
    category: "menu"
  },
  {
    id: 6,
    question: "Which herb is essential in making authentic tabbouleh?",
    options: ["Mint", "Cilantro", "Parsley", "Dill"],
    correctAnswer: 2,
    category: "ingredients"
  },
  {
    id: 7,
    question: "What does 'Lanova' represent in Middle Eastern hospitality?",
    options: ["Fast service", "Generous portions", "Traditional cooking", "Warm welcome & quality food"],
    correctAnswer: 3,
    category: "culture"
  },
  {
    id: 8,
    question: "Which sauce is commonly served with falafel?",
    options: ["Tzatziki", "Tahini", "Chimichurri", "Pesto"],
    correctAnswer: 1,
    category: "menu"
  },
  {
    id: 9,
    question: "What type of cheese is traditionally used in manakish?",
    options: ["Feta", "Mozzarella", "Akkawi", "Halloumi"],
    correctAnswer: 2,
    category: "ingredients"
  },
  {
    id: 10,
    question: "Which cooking method gives shawarma its distinctive flavor?",
    options: ["Grilling", "Vertical rotisserie", "Pan frying", "Baking"],
    correctAnswer: 1,
    category: "menu"
  }
];

export const LanovaFoodQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameStarted, setGameStarted] = useState(false);
  
  const { gameUser, awardCoins } = useGameUser();
  const { toast } = useToast();

  const resetGame = useCallback(() => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setGameComplete(false);
    setShowResult(false);
    setTimeLeft(30);
    setGameStarted(false);
  }, []);

  const startGame = useCallback(() => {
    setGameStarted(true);
    // Start timer countdown
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleTimeUp = useCallback(() => {
    if (!gameComplete) {
      setShowResult(true);
      setTimeout(() => {
        if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
          setCurrentQuestion(prev => prev + 1);
          setSelectedAnswer(null);
          setShowResult(false);
          setTimeLeft(30);
        } else {
          completeQuiz();
        }
      }, 2000);
    }
  }, [currentQuestion, gameComplete]);

  const handleAnswerSelect = useCallback((answerIndex: number) => {
    if (selectedAnswer !== null || showResult) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    if (answerIndex === QUIZ_QUESTIONS[currentQuestion].correctAnswer) {
      setScore(prev => prev + 1);
    }
    
    setTimeout(() => {
      if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setTimeLeft(30);
      } else {
        completeQuiz();
      }
    }, 1500);
  }, [selectedAnswer, showResult, currentQuestion]);

  const completeQuiz = useCallback(async () => {
    setGameComplete(true);
    const finalScore = score + (selectedAnswer === QUIZ_QUESTIONS[currentQuestion]?.correctAnswer ? 1 : 0);
    
    if (gameUser) {
      try {
        const result = await awardCoins('lanova-food-quiz', finalScore * 100);
        if (result.success) {
          toast({
            title: "Quiz Complete! 🎉",
            description: `You answered ${finalScore}/${QUIZ_QUESTIONS.length} correctly and earned ${result.coins_awarded} coins!`,
          });
        } else {
          toast({
            title: "Quiz Complete!",
            description: `You answered ${finalScore}/${QUIZ_QUESTIONS.length} correctly!`,
            variant: "default",
          });
        }
      } catch (error) {
        toast({
          title: "Quiz Complete!",
          description: `You answered ${finalScore}/${QUIZ_QUESTIONS.length} correctly!`,
          variant: "default",
        });
      }
    }
  }, [score, selectedAnswer, currentQuestion, gameUser, awardCoins, toast]);

  if (!gameStarted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">🏆 Lanova Food Quiz</CardTitle>
          <p className="text-muted-foreground">
            Test your knowledge about Middle Eastern cuisine and Lanova Restaurant!
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="text-2xl">❓</div>
              <div className="text-sm font-medium">{QUIZ_QUESTIONS.length} Questions</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">⏰</div>
              <div className="text-sm font-medium">30 sec per question</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">🪙</div>
              <div className="text-sm font-medium">Up to 25 coins</div>
            </div>
          </div>
          
          {gameUser && (
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <Badge variant="secondary">
                Current balance: {gameUser.coin_balance} coins | 
                Daily remaining: {gameUser.daily_coin_limit - gameUser.coins_earned_today}
              </Badge>
            </div>
          )}
          
          <Button onClick={startGame} size="lg" className="w-full">
            Start Quiz 🚀
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (gameComplete) {
    const finalScore = score;
    const coinsEarned = Math.min(finalScore * 2.5, 25); // Up to 25 coins for perfect score
    
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">🎉 Quiz Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-4">
            <div className="text-6xl">🏆</div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                You scored {finalScore} out of {QUIZ_QUESTIONS.length}!
              </h3>
              <p className="text-muted-foreground">
                {finalScore >= 8 ? "Excellent! You're a Middle Eastern cuisine expert!" :
                 finalScore >= 6 ? "Great job! You know your way around Middle Eastern food!" :
                 finalScore >= 4 ? "Good effort! Keep learning about Middle Eastern cuisine!" :
                 "Don't give up! Try again to improve your knowledge!"}
              </p>
            </div>
            
            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                🪙 {Math.floor(coinsEarned)} Coins Earned!
              </div>
            </div>
          </div>
          
          <Button onClick={resetGame} size="lg" className="w-full">
            Play Again 🔄
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentQ = QUIZ_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <Badge variant="outline">
            Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
          </Badge>
          <Badge variant={timeLeft <= 10 ? "destructive" : "secondary"}>
            ⏰ {timeLeft}s
          </Badge>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">{currentQ.question}</h3>
          <Badge variant="outline" className="mb-4">
            {currentQ.category === 'menu' ? '🍽️ Menu' : 
             currentQ.category === 'culture' ? '🌍 Culture' : 
             '🌿 Ingredients'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {currentQ.options.map((option, index) => (
            <Button
              key={index}
              variant={
                showResult
                  ? index === currentQ.correctAnswer
                    ? "default"
                    : selectedAnswer === index
                    ? "destructive"
                    : "outline"
                  : selectedAnswer === index
                  ? "secondary"
                  : "outline"
              }
              onClick={() => handleAnswerSelect(index)}
              disabled={showResult}
              className="justify-start h-auto p-4 text-wrap"
            >
              <span className="font-medium mr-3">
                {String.fromCharCode(65 + index)}.
              </span>
              {option}
              {showResult && index === currentQ.correctAnswer && " ✓"}
              {showResult && selectedAnswer === index && index !== currentQ.correctAnswer && " ✗"}
            </Button>
          ))}
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          Score: {score}/{currentQuestion + (showResult && selectedAnswer === currentQ.correctAnswer ? 1 : 0)}
        </div>
      </CardContent>
    </Card>
  );
};