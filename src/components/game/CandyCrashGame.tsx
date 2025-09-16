import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGameUser } from '@/hooks/useGameUser';
import { useToast } from '@/hooks/use-toast';
import foodPizza from '@/assets/food-pizza.png';
import foodWing from '@/assets/food-wing.png';
import foodPepperoni from '@/assets/food-pepperoni.png';
import foodCheese from '@/assets/food-cheese.png';
import foodMushroom from '@/assets/food-mushroom.png';
import foodPepper from '@/assets/food-pepper.png';

interface GamePiece {
  id: string;
  type: 'pizza' | 'wing' | 'pepperoni' | 'cheese' | 'mushroom' | 'pepper';
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

const COLORS = ['pizza', 'wing', 'pepperoni', 'cheese', 'mushroom', 'pepper'] as const;
const GRID_SIZE = 8;
const INITIAL_MOVES = 25; // Reduced from 30
const MAX_CASCADES = 3; // Reduced from 6
const MIN_COLORS = 4; // Start with fewer colors
const MAX_COLORS = 6; // Max colors for higher levels

export const CandyCrashGame = () => {
  const [grid, setGrid] = useState<GamePiece[][]>([]);
  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    moves: INITIAL_MOVES,
    level: 1,
    targetScore: 1500, // Increased target score
  });
  const [selectedPiece, setSelectedPiece] = useState<{ row: number; col: number } | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const { gameUser, awardCoins } = useGameUser();
  const { toast } = useToast();
  const gameRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [animatingPieces, setAnimatingPieces] = useState<Set<string>>(new Set());
  const [cascadeCount, setCascadeCount] = useState(0);
  const [cascadeMultiplier, setCascadeMultiplier] = useState(1);

  // Get available colors based on level (difficulty scaling)
  const getAvailableColors = useCallback((level: number) => {
    const colorCount = Math.min(MIN_COLORS + Math.floor((level - 1) / 2), MAX_COLORS);
    return COLORS.slice(0, colorCount);
  }, []);

  // Smart piece generation that avoids immediate matches
  const generateSafePiece = useCallback((row: number, col: number, currentGrid?: GamePiece[][]): GamePiece => {
    const availableColors = getAvailableColors(gameStats.level);
    const usedGrid = currentGrid || grid;
    
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      const type = availableColors[Math.floor(Math.random() * availableColors.length)];
      let isValid = true;
      
      // Check horizontal matches (left side)
      if (col >= 2 && 
          usedGrid[row]?.[col - 1]?.type === type && 
          usedGrid[row]?.[col - 2]?.type === type) {
        isValid = false;
      }
      
      // Check horizontal matches (mixed)
      if (col >= 1 && col < GRID_SIZE - 1 &&
          usedGrid[row]?.[col - 1]?.type === type && 
          usedGrid[row]?.[col + 1]?.type === type) {
        isValid = false;
      }
      
      // Check vertical matches (top side)
      if (row >= 2 && 
          usedGrid[row - 1]?.[col]?.type === type && 
          usedGrid[row - 2]?.[col]?.type === type) {
        isValid = false;
      }
      
      // Check vertical matches (mixed)
      if (row >= 1 && row < GRID_SIZE - 1 &&
          usedGrid[row - 1]?.[col]?.type === type && 
          usedGrid[row + 1]?.[col]?.type === type) {
        isValid = false;
      }
      
      if (isValid) {
        return {
          id: `${row}-${col}-${Date.now()}-${Math.random()}`,
          type,
          row,
          col,
        };
      }
      
      attempts++;
    }
    
    // Fallback: return a random piece if we can't find a safe one
    return {
      id: `${row}-${col}-${Date.now()}-${Math.random()}`,
      type: availableColors[Math.floor(Math.random() * availableColors.length)],
      row,
      col,
    };
  }, [gameStats.level, getAvailableColors, grid]);

  const generateRandomPiece = (row: number, col: number): GamePiece => 
    generateSafePiece(row, col);

  const initializeGrid = useCallback(() => {
    const newGrid: GamePiece[][] = [];
    // Build grid row by row to avoid initial matches
    for (let row = 0; row < GRID_SIZE; row++) {
      const gridRow: GamePiece[] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        // Pass the current grid state to generateSafePiece
        const piece = generateSafePiece(row, col, newGrid);
        gridRow.push(piece);
      }
      newGrid.push(gridRow);
    }
    setGrid(newGrid);
  }, [generateSafePiece]);

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
      newGrid[row][col] = { ...newGrid[row][col], type: 'pizza' as any, id: 'removed' };
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
            newGrid[row][col] = { ...generateSafePiece(row, col, newGrid), id: 'removed' };
            hasDropped = true;
          }
          writeIndex--;
        }
      }
      
      // Fill empty spaces at the top with safe pieces
      for (let row = writeIndex; row >= 0; row--) {
        newGrid[row][col] = { ...generateSafePiece(row, col, newGrid), isAnimating: true };
        hasDropped = true;
      }
    }
    
    return { newGrid, hasDropped };
  }, [generateSafePiece]);

  const processMatches = useCallback(async (currentCascade = 0) => {
    if (isProcessing && currentCascade === 0) return false;
    if (currentCascade >= MAX_CASCADES) {
      setIsProcessing(false);
      setCascadeCount(0);
      setCascadeMultiplier(1);
      return false;
    }
    
    if (currentCascade === 0) {
      setIsProcessing(true);
      setCascadeCount(0);
      setCascadeMultiplier(1);
    }
    
    const matchResult = findMatches(grid);
    if (matchResult.matches.length === 0) {
      setIsProcessing(false);
      setCascadeCount(0);
      setCascadeMultiplier(1);
      return false;
    }
    
    // Update cascade counter and multiplier
    const newCascadeCount = currentCascade + 1;
    setCascadeCount(newCascadeCount);
    
    // Much more aggressive diminishing returns to prevent easy cascades
    const cascadeMultiplier = Math.max(0.3, 1 - (currentCascade * 0.3));
    setCascadeMultiplier(cascadeMultiplier);
    
    const { newGrid, specialPieces } = removeMatches(grid, matchResult);
    
    // Add special pieces to the grid (for 4+ matches)
    specialPieces.forEach(({ row, col, special }) => {
      if (newGrid[row][col].id !== 'removed') {
        newGrid[row][col] = { ...newGrid[row][col], special };
      }
    });
    
    const { newGrid: droppedGrid, hasDropped } = dropPieces(newGrid);
    
    setGrid(droppedGrid);
    
    // Calculate score with much lower base scoring
    const baseScore = matchResult.matches.length * (5 + gameStats.level); // Level-based scoring
    const cascadeBonus = Math.floor(baseScore * cascadeMultiplier);
    
    setGameStats(prev => ({
      ...prev,
      score: prev.score + cascadeBonus,
    }));
    
    // Show cascade feedback
    if (newCascadeCount > 1) {
      toast({
        title: `${newCascadeCount}x Cascade!`,
        description: `+${cascadeBonus} points`,
        duration: 1500,
      });
    }
    
    // Clear animations after a delay
    setTimeout(() => {
      setGrid(currentGrid => currentGrid.map(row => 
        row.map(piece => ({ ...piece, isAnimating: false }))
      ));
    }, 400);
    
    // Much longer delay and stricter cascade limit
    setTimeout(async () => {
      // Add randomness to prevent guaranteed cascades
      const cascadeChance = Math.max(0.3, 0.8 - (currentCascade * 0.2));
      if (Math.random() > cascadeChance) {
        setIsProcessing(false);
        setCascadeCount(0);
        setCascadeMultiplier(1);
        return;
      }
      
      const hasNewMatches = await processMatches(newCascadeCount);
      if (!hasNewMatches) {
        setIsProcessing(false);
        setCascadeCount(0);
        setCascadeMultiplier(1);
      }
    }, 1200); // Longer delay
    
    return true;
  }, [grid, findMatches, removeMatches, dropPieces, isProcessing, toast]);

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
      targetScore: 1500, // Higher target score
    });
    setCascadeCount(0);
    setCascadeMultiplier(1);
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
      const newLevel = gameStats.level + 1;
      const availableColors = getAvailableColors(newLevel);
      
      setGameStats(prev => ({
        ...prev,
        level: newLevel,
        targetScore: Math.floor(prev.targetScore * 1.8), // Higher difficulty progression
      }));
      toast({
        title: "Level Up!",
        description: `Level ${newLevel}! Now using ${availableColors.length} colors`,
        duration: 3000,
      });
    }
  }, [gameStats.score, gameStats.targetScore, gameActive, getAvailableColors]);

  const getPieceImage = (type: GamePiece['type']) => {
    const imageMap = {
      pizza: foodPizza,
      wing: foodWing,
      pepperoni: foodPepperoni,
      cheese: foodCheese,
      mushroom: foodMushroom,
      pepper: foodPepper,
    };
    return imageMap[type];
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🍕 Lanova Food Match</span>
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
              Match 3 or more food items to earn points and coins! Create special pieces by matching 4+ items in a row. Watch for chain reactions as pieces cascade down!
            </p>
            <Button onClick={startGame} size="lg" className="w-full">
              🎮 Start Game
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-4 text-center">
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
              {cascadeCount > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Cascade</p>
                  <p className="font-bold text-primary">{cascadeCount}x</p>
                </div>
              )}
            </div>
            
            <div 
              ref={gameRef}
              className="grid grid-cols-8 gap-2 p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg shadow-inner"
              style={{ aspectRatio: '1' }}
            >
              {grid.map((row, rowIndex) =>
                row.map((piece, colIndex) => (
                  <button
                    key={piece.id}
                    onClick={() => handlePieceClick(rowIndex, colIndex)}
                    disabled={isProcessing}
                    className={`
                      aspect-square rounded-lg transition-all duration-300 hover:scale-105 bg-gradient-to-br from-background to-muted/50 shadow-sm border border-border/20 relative overflow-hidden
                      ${piece.isAnimating ? 'animate-bounce' : ''}
                      ${isProcessing ? 'opacity-70' : ''}
                      ${
                        selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex
                          ? 'ring-2 ring-primary scale-110 shadow-lg'
                          : ''
                      }
                    `}
                  >
                    <img
                      src={getPieceImage(piece.type)}
                      alt={`${piece.type} food`}
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