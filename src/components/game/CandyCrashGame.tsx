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
  special?: 'bomb' | 'striped' | 'wrapped';
  isAnimating?: boolean;
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [animatingPieces, setAnimatingPieces] = useState<Set<string>>(new Set());

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
    const matches: { row: number; col: number; type: string; matchType: 'horizontal' | 'vertical' | 'L' | 'T' }[] = [];
    const horizontalMatches: { [key: string]: { row: number; col: number; length: number } } = {};
    const verticalMatches: { [key: string]: { row: number; col: number; length: number } } = {};
    
    // Find horizontal matches
    for (let row = 0; row < GRID_SIZE; row++) {
      let currentMatchLength = 1;
      let currentType = currentGrid[row][0].type;
      
      for (let col = 1; col < GRID_SIZE; col++) {
        if (currentGrid[row][col].type === currentType) {
          currentMatchLength++;
        } else {
          if (currentMatchLength >= 3) {
            const key = `${row}-${col - currentMatchLength}`;
            horizontalMatches[key] = { row, col: col - currentMatchLength, length: currentMatchLength };
            for (let i = 0; i < currentMatchLength; i++) {
              matches.push({ 
                row, 
                col: col - currentMatchLength + i, 
                type: currentType,
                matchType: 'horizontal'
              });
            }
          }
          currentMatchLength = 1;
          currentType = currentGrid[row][col].type;
        }
      }
      // Check end of row
      if (currentMatchLength >= 3) {
        const key = `${row}-${GRID_SIZE - currentMatchLength}`;
        horizontalMatches[key] = { row, col: GRID_SIZE - currentMatchLength, length: currentMatchLength };
        for (let i = 0; i < currentMatchLength; i++) {
          matches.push({ 
            row, 
            col: GRID_SIZE - currentMatchLength + i, 
            type: currentType,
            matchType: 'horizontal'
          });
        }
      }
    }
    
    // Find vertical matches
    for (let col = 0; col < GRID_SIZE; col++) {
      let currentMatchLength = 1;
      let currentType = currentGrid[0][col].type;
      
      for (let row = 1; row < GRID_SIZE; row++) {
        if (currentGrid[row][col].type === currentType) {
          currentMatchLength++;
        } else {
          if (currentMatchLength >= 3) {
            const key = `${row - currentMatchLength}-${col}`;
            verticalMatches[key] = { row: row - currentMatchLength, col, length: currentMatchLength };
            for (let i = 0; i < currentMatchLength; i++) {
              matches.push({ 
                row: row - currentMatchLength + i, 
                col, 
                type: currentType,
                matchType: 'vertical'
              });
            }
          }
          currentMatchLength = 1;
          currentType = currentGrid[row][col].type;
        }
      }
      // Check end of column
      if (currentMatchLength >= 3) {
        const key = `${GRID_SIZE - currentMatchLength}-${col}`;
        verticalMatches[key] = { row: GRID_SIZE - currentMatchLength, col, length: currentMatchLength };
        for (let i = 0; i < currentMatchLength; i++) {
          matches.push({ 
            row: GRID_SIZE - currentMatchLength + i, 
            col, 
            type: currentType,
            matchType: 'vertical'
          });
        }
      }
    }
    
    return {
      matches: matches.filter((match, index, self) => 
        self.findIndex(m => m.row === match.row && m.col === match.col) === index
      ),
      horizontalMatches,
      verticalMatches
    };
  }, []);

  const removeMatches = useCallback((currentGrid: GamePiece[][], matchResult: { matches: { row: number; col: number; type: string; matchType: string }[], horizontalMatches: any, verticalMatches: any }) => {
    const newGrid = currentGrid.map(row => [...row]);
    const specialPieces: { row: number, col: number, special: 'bomb' | 'striped' | 'wrapped' }[] = [];
    
    // Create special pieces for matches of 4+
    Object.values(matchResult.horizontalMatches).forEach((match: any) => {
      if (match.length >= 4) {
        const centerCol = Math.floor(match.col + match.length / 2);
        specialPieces.push({ 
          row: match.row, 
          col: centerCol, 
          special: match.length >= 5 ? 'bomb' : 'striped' 
        });
      }
    });
    
    Object.values(matchResult.verticalMatches).forEach((match: any) => {
      if (match.length >= 4) {
        const centerRow = Math.floor(match.row + match.length / 2);
        specialPieces.push({ 
          row: centerRow, 
          col: match.col, 
          special: match.length >= 5 ? 'bomb' : 'striped' 
        });
      }
    });
    
    // Remove matched pieces
    matchResult.matches.forEach(({ row, col }) => {
      newGrid[row][col] = { ...newGrid[row][col], type: 'red' as any, id: 'removed' };
    });
    
    return { newGrid, specialPieces };
  }, []);

  const dropPieces = useCallback((currentGrid: GamePiece[][]) => {
    const newGrid = currentGrid.map(row => [...row]);
    let hasDropped = false;
    
    for (let col = 0; col < GRID_SIZE; col++) {
      let writeIndex = GRID_SIZE - 1;
      
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        if (newGrid[row][col].id !== 'removed') {
          if (writeIndex !== row) {
            newGrid[writeIndex][col] = { ...newGrid[row][col], row: writeIndex, isAnimating: true };
            newGrid[row][col] = { ...generateRandomPiece(row, col), id: 'removed' };
            hasDropped = true;
          }
          writeIndex--;
        }
      }
      
      // Fill empty spaces at the top
      for (let row = writeIndex; row >= 0; row--) {
        newGrid[row][col] = { ...generateRandomPiece(row, col), isAnimating: true };
        hasDropped = true;
      }
    }
    
    return { newGrid, hasDropped };
  }, []);

  const processMatches = useCallback(async () => {
    if (isProcessing) return false;
    setIsProcessing(true);
    
    const matchResult = findMatches(grid);
    if (matchResult.matches.length === 0) {
      setIsProcessing(false);
      return false;
    }
    
    const { newGrid, specialPieces } = removeMatches(grid, matchResult);
    
    // Add special pieces to the grid
    specialPieces.forEach(({ row, col, special }) => {
      if (newGrid[row][col].id !== 'removed') {
        newGrid[row][col] = { ...newGrid[row][col], special };
      }
    });
    
    const { newGrid: droppedGrid, hasDropped } = dropPieces(newGrid);
    
    setGrid(droppedGrid);
    setGameStats(prev => ({
      ...prev,
      score: prev.score + matchResult.matches.length * 10,
    }));
    
    // Clear animations after a delay
    setTimeout(() => {
      setGrid(currentGrid => currentGrid.map(row => 
        row.map(piece => ({ ...piece, isAnimating: false }))
      ));
    }, 300);
    
    // Chain reaction - check for new matches after pieces settle
    setTimeout(async () => {
      const hasNewMatches = await processMatches();
      if (!hasNewMatches) {
        setIsProcessing(false);
      }
    }, 600);
    
    return true;
  }, [grid, findMatches, removeMatches, dropPieces, isProcessing]);

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
        const matchResult = findMatches(newGrid);
        
        if (matchResult.matches.length > 0) {
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
              Match 3 or more candies to earn points and coins! Create special pieces by matching 4+ candies in a row. Watch for chain reactions as pieces cascade down!
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
                    disabled={isProcessing}
                    className={`
                      aspect-square rounded-md transition-all duration-300 hover:scale-105 bg-white relative
                      ${piece.isAnimating ? 'animate-bounce' : ''}
                      ${isProcessing ? 'opacity-70' : ''}
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
                      className={`w-full h-full object-contain rounded-md transition-transform duration-300 ${
                        piece.isAnimating ? 'scale-90' : 'scale-100'
                      }`}
                    />
                    {piece.special === 'bomb' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl animate-pulse">💣</span>
                      </div>
                    )}
                    {piece.special === 'striped' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                    )}
                    {piece.special === 'wrapped' && (
                      <div className="absolute inset-0 border-2 border-yellow-400 rounded-md animate-pulse"></div>
                    )}
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