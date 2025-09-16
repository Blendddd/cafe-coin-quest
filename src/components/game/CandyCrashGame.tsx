import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGameUser } from '@/hooks/useGameUser';
import { useToast } from '@/hooks/use-toast';
import candyRed from '@/assets/candy-red.png';
import candyBlue from '@/assets/candy-blue.png';
import candyGreen from '@/assets/candy-green.png';
import candyYellow from '@/assets/candy-yellow.png';
import candyPurple from '@/assets/candy-purple.png';
import candyOrange from '@/assets/candy-orange.png';

interface GamePiece {
  id: string;
  type: 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';
  row: number;
  col: number;
}

interface GameStats {
  score: number;
  moves: number;
  level: number;
  targetScore: number;
}

const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'] as const;
const GRID_SIZE = 8;
const INITIAL_MOVES = 30;

export const CandyCrashGame = () => {
  const [grid, setGrid] = useState<GamePiece[][]>([]);
  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    moves: INITIAL_MOVES,
    level: 1,
    targetScore: 1000,
  });
  const [selectedPiece, setSelectedPiece] = useState<{ row: number; col: number } | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const { gameUser, awardCoins } = useGameUser();
  const { toast } = useToast();
  const gameRef = useRef<HTMLDivElement>(null);

  const generateRandomPiece = (row: number, col: number): GamePiece => ({
    id: `${row}-${col}-${Date.now()}`,
    type: COLORS[Math.floor(Math.random() * COLORS.length)],
    row,
    col,
  });

  const initializeGrid = useCallback(() => {
    const newGrid: GamePiece[][] = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      const gridRow: GamePiece[] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        gridRow.push(generateRandomPiece(row, col));
      }
      newGrid.push(gridRow);
    }
    setGrid(newGrid);
  }, []);

  const findMatches = useCallback((currentGrid: GamePiece[][]) => {
    const matches: { row: number; col: number }[] = [];
    
    // Check horizontal matches
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE - 2; col++) {
        if (
          currentGrid[row][col].type === currentGrid[row][col + 1].type &&
          currentGrid[row][col].type === currentGrid[row][col + 2].type
        ) {
          matches.push({ row, col }, { row, col: col + 1 }, { row, col: col + 2 });
        }
      }
    }
    
    // Check vertical matches
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE - 2; row++) {
        if (
          currentGrid[row][col].type === currentGrid[row + 1][col].type &&
          currentGrid[row][col].type === currentGrid[row + 2][col].type
        ) {
          matches.push({ row, col }, { row: row + 1, col }, { row: row + 2, col });
        }
      }
    }
    
    return matches.filter((match, index, self) => 
      self.findIndex(m => m.row === match.row && m.col === match.col) === index
    );
  }, []);

  const removeMatches = useCallback((currentGrid: GamePiece[][], matches: { row: number; col: number }[]) => {
    const newGrid = currentGrid.map(row => [...row]);
    matches.forEach(({ row, col }) => {
      newGrid[row][col] = { ...newGrid[row][col], type: 'red' as any, id: 'removed' };
    });
    return newGrid;
  }, []);

  const dropPieces = useCallback((currentGrid: GamePiece[][]) => {
    const newGrid = currentGrid.map(row => [...row]);
    
    for (let col = 0; col < GRID_SIZE; col++) {
      let writeIndex = GRID_SIZE - 1;
      
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        if (newGrid[row][col].id !== 'removed') {
          if (writeIndex !== row) {
            newGrid[writeIndex][col] = { ...newGrid[row][col], row: writeIndex };
            newGrid[row][col] = { ...generateRandomPiece(row, col), id: 'removed' };
          }
          writeIndex--;
        }
      }
      
      // Fill empty spaces at the top
      for (let row = writeIndex; row >= 0; row--) {
        newGrid[row][col] = generateRandomPiece(row, col);
      }
    }
    
    return newGrid;
  }, []);

  const processMatches = useCallback(() => {
    const matches = findMatches(grid);
    if (matches.length === 0) return false;
    
    const newGrid = removeMatches(grid, matches);
    const droppedGrid = dropPieces(newGrid);
    
    setGrid(droppedGrid);
    setGameStats(prev => ({
      ...prev,
      score: prev.score + matches.length * 10,
    }));
    
    return true;
  }, [grid, findMatches, removeMatches, dropPieces]);

  const swapPieces = useCallback((row1: number, col1: number, row2: number, col2: number) => {
    const newGrid = grid.map(row => [...row]);
    const temp = newGrid[row1][col1];
    newGrid[row1][col1] = { ...newGrid[row2][col2], row: row1, col: col1 };
    newGrid[row2][col2] = { ...temp, row: row2, col: col2 };
    return newGrid;
  }, [grid]);

  const isValidMove = useCallback((row1: number, col1: number, row2: number, col2: number) => {
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }, []);

  const handlePieceClick = useCallback((row: number, col: number) => {
    if (!gameActive) return;
    
    if (!selectedPiece) {
      setSelectedPiece({ row, col });
    } else {
      if (selectedPiece.row === row && selectedPiece.col === col) {
        setSelectedPiece(null);
        return;
      }
      
      if (isValidMove(selectedPiece.row, selectedPiece.col, row, col)) {
        const newGrid = swapPieces(selectedPiece.row, selectedPiece.col, row, col);
        const matches = findMatches(newGrid);
        
        if (matches.length > 0) {
          setGrid(newGrid);
          setGameStats(prev => ({ ...prev, moves: prev.moves - 1 }));
          setTimeout(() => processMatches(), 300);
        } else {
          toast({
            title: "Invalid move",
            description: "This swap doesn't create any matches!",
            variant: "destructive",
          });
        }
      } else {
        setSelectedPiece({ row, col });
      }
      setSelectedPiece(null);
    }
  }, [gameActive, selectedPiece, isValidMove, swapPieces, findMatches, processMatches, toast]);

  const startGame = () => {
    setGameActive(true);
    setGameStartTime(Date.now());
    setGameStats({
      score: 0,
      moves: INITIAL_MOVES,
      level: 1,
      targetScore: 1000,
    });
    initializeGrid();
  };

  const endGame = async () => {
    if (!gameUser) return;
    
    const duration = Math.floor((Date.now() - gameStartTime) / 1000);
    setGameActive(false);
    
    await awardCoins('candy_crash', gameStats.score, duration);
    
    toast({
      title: "Game Over!",
      description: `Final Score: ${gameStats.score}`,
    });
  };

  useEffect(() => {
    if (gameActive && gameStats.moves <= 0) {
      endGame();
    }
  }, [gameStats.moves, gameActive]);

  useEffect(() => {
    if (gameActive && gameStats.score >= gameStats.targetScore) {
      setGameStats(prev => ({
        ...prev,
        level: prev.level + 1,
        targetScore: prev.targetScore * 1.5,
        moves: prev.moves + 10,
      }));
      toast({
        title: "Level Up!",
        description: `Welcome to level ${gameStats.level + 1}!`,
      });
    }
  }, [gameStats.score, gameStats.targetScore, gameActive]);

  const getPieceImage = (type: GamePiece['type']) => {
    const imageMap = {
      red: candyRed,
      blue: candyBlue,
      green: candyGreen,
      yellow: candyYellow,
      purple: candyPurple,
      orange: candyOrange,
    };
    return imageMap[type];
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🍬 Candy Crash</span>
          {gameUser && (
            <Badge variant="secondary">
              🪙 {gameUser.coin_balance} coins
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!gameActive ? (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Match 3 or more candies to earn points and coins!
            </p>
            <Button onClick={startGame} size="lg" className="w-full">
              🎮 Start Game
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="font-bold">{gameStats.score}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Moves</p>
                <p className="font-bold">{gameStats.moves}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="font-bold">{gameStats.level}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target</p>
                <p className="font-bold">{gameStats.targetScore}</p>
              </div>
            </div>
            
            <div 
              ref={gameRef}
              className="grid grid-cols-8 gap-1 p-4 bg-muted rounded-lg"
              style={{ aspectRatio: '1' }}
            >
              {grid.map((row, rowIndex) =>
                row.map((piece, colIndex) => (
                  <button
                    key={piece.id}
                    onClick={() => handlePieceClick(rowIndex, colIndex)}
                    className={`
                      aspect-square rounded-md transition-all duration-200 hover:scale-105 bg-white
                      ${
                        selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex
                          ? 'ring-2 ring-primary scale-110'
                          : ''
                      }
                    `}
                  >
                    <img
                      src={getPieceImage(piece.type)}
                      alt={`${piece.type} candy`}
                      className="w-full h-full object-contain rounded-md"
                    />
                  </button>
                ))
              )}
            </div>
            
            <Button onClick={endGame} variant="outline" className="w-full">
              End Game
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};