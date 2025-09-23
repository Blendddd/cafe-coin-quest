import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useGameUser } from '@/hooks/useGameUser';
import { useUserRole } from '@/hooks/useUserRole';

// Import candy images
import candyRed from '@/assets/candy-red.png';
import candyBlue from '@/assets/candy-blue.png';
import candyGreen from '@/assets/candy-green.png';
import candyYellow from '@/assets/candy-yellow.png';
import candyOrange from '@/assets/candy-orange.png';
import candyPurple from '@/assets/candy-purple.png';

// Game piece types
type PieceType = 'candy-red' | 'candy-blue' | 'candy-green' | 'candy-yellow' | 'candy-orange' | 'candy-purple';

interface GamePiece {
  id: string;
  type: PieceType;
  row: number;
  col: number;
}

interface GameState {
  grid: (GamePiece | null)[][];
  score: number;
  moves: number;
  targetScore: number;
  isPlaying: boolean;
  gameOver: boolean;
}

interface Position {
  row: number;
  col: number;
}

const GRID_SIZE = 6;
const INITIAL_MOVES = 15; // Harder: fewer moves
const TARGET_SCORE = 2500; // Harder: higher target
const PIECE_TYPES: PieceType[] = ['candy-red', 'candy-blue', 'candy-green', 'candy-yellow', 'candy-orange', 'candy-purple'];

const CandyCrushGame: React.FC = () => {
  const { toast } = useToast();
  const { gameUser, awardCoins } = useGameUser();
  const { isAdmin } = useUserRole();

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    grid: [],
    score: 0,
    moves: INITIAL_MOVES,
    targetScore: TARGET_SCORE,
    isPlaying: false,
    gameOver: false
  });

  const [hasPlayedToday, setHasPlayedToday] = useState(false);

  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Generate a random piece
  const createPiece = (row: number, col: number): GamePiece => ({
    id: `${row}-${col}-${Date.now()}-${Math.random()}`,
    type: PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)],
    row,
    col
  });

  // Initialize empty grid
  const createEmptyGrid = (): (GamePiece | null)[][] => {
    return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
  };

  // Fill grid with random pieces
  const fillGrid = (grid: (GamePiece | null)[][]): (GamePiece | null)[][] => {
    const newGrid = grid.map(row => [...row]);
    
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (!newGrid[row][col]) {
          newGrid[row][col] = createPiece(row, col);
        }
      }
    }
    
    return newGrid;
  };

  // Find all matches in the grid
  const findMatches = (grid: (GamePiece | null)[][]): Position[] => {
    const matches: Position[] = [];
    
    // Check horizontal matches
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE - 2; col++) {
        const piece1 = grid[row][col];
        const piece2 = grid[row][col + 1];
        const piece3 = grid[row][col + 2];
        
        if (piece1 && piece2 && piece3 && 
            piece1.type === piece2.type && piece2.type === piece3.type) {
          matches.push({ row, col }, { row, col: col + 1 }, { row, col: col + 2 });
          
          // Check for longer matches
          for (let k = col + 3; k < GRID_SIZE; k++) {
            const nextPiece = grid[row][k];
            if (nextPiece && nextPiece.type === piece1.type) {
              matches.push({ row, col: k });
            } else {
              break;
            }
          }
        }
      }
    }
    
    // Check vertical matches
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE - 2; row++) {
        const piece1 = grid[row][col];
        const piece2 = grid[row + 1][col];
        const piece3 = grid[row + 2][col];
        
        if (piece1 && piece2 && piece3 && 
            piece1.type === piece2.type && piece2.type === piece3.type) {
          matches.push({ row, col }, { row: row + 1, col }, { row: row + 2, col });
          
          // Check for longer matches
          for (let k = row + 3; k < GRID_SIZE; k++) {
            const nextPiece = grid[k][col];
            if (nextPiece && nextPiece.type === piece1.type) {
              matches.push({ row: k, col });
            } else {
              break;
            }
          }
        }
      }
    }
    
    // Remove duplicates
    const uniqueMatches: Position[] = [];
    matches.forEach(match => {
      if (!uniqueMatches.find(m => m.row === match.row && m.col === match.col)) {
        uniqueMatches.push(match);
      }
    });
    
    return uniqueMatches;
  };

  // Remove matched pieces from grid
  const removeMatches = (grid: (GamePiece | null)[][], matches: Position[]): (GamePiece | null)[][] => {
    const newGrid = grid.map(row => [...row]);
    
    matches.forEach(({ row, col }) => {
      newGrid[row][col] = null;
    });
    
    return newGrid;
  };

  // Apply gravity - make pieces fall down
  const applyGravity = (grid: (GamePiece | null)[][]): (GamePiece | null)[][] => {
    const newGrid = createEmptyGrid();
    
    // For each column, collect non-null pieces and place them at the bottom
    for (let col = 0; col < GRID_SIZE; col++) {
      const column: GamePiece[] = [];
      
      // Collect all non-null pieces in this column
      for (let row = GRID_SIZE - 1; row >= 0; row--) {
        const piece = grid[row][col];
        if (piece) {
          column.push(piece);
        }
      }
      
      // Place pieces at the bottom of the column
      for (let i = 0; i < column.length; i++) {
        const newRow = GRID_SIZE - 1 - i;
        const piece = column[i];
        newGrid[newRow][col] = {
          ...piece,
          row: newRow,
          col: col
        };
      }
    }
    
    return newGrid;
  };

  // Fill empty spaces with new pieces
  const fillEmptySpaces = (grid: (GamePiece | null)[][]): (GamePiece | null)[][] => {
    const newGrid = grid.map(row => [...row]);
    
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE; row++) {
        if (!newGrid[row][col]) {
          newGrid[row][col] = createPiece(row, col);
        }
      }
    }
    
    return newGrid;
  };

  // Process matches and cascades
  const processMatches = useCallback(async (grid: (GamePiece | null)[][]): Promise<{ finalGrid: (GamePiece | null)[][], totalScore: number }> => {
    let currentGrid = grid;
    let totalScore = 0;
    let cascadeCount = 0;
    const maxCascades = 10;
    
    while (cascadeCount < maxCascades) {
      const matches = findMatches(currentGrid);
      
      if (matches.length === 0) {
        break;
      }
      
      // Calculate score for this match
      const matchScore = matches.length * 10 * (cascadeCount + 1);
      totalScore += matchScore;
      
      // Remove matches
      currentGrid = removeMatches(currentGrid, matches);
      
      // Apply gravity
      currentGrid = applyGravity(currentGrid);
      
      // Fill empty spaces
      currentGrid = fillEmptySpaces(currentGrid);
      
      cascadeCount++;
      
      // Add a small delay for visual effect
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    return { finalGrid: currentGrid, totalScore };
  }, []);

  // Check if two positions are adjacent
  const areAdjacent = (pos1: Position, pos2: Position): boolean => {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  };

  // Swap two pieces in the grid
  const swapPieces = (grid: (GamePiece | null)[][], pos1: Position, pos2: Position): (GamePiece | null)[][] => {
    const newGrid = grid.map(row => [...row]);
    const temp = newGrid[pos1.row][pos1.col];
    newGrid[pos1.row][pos1.col] = newGrid[pos2.row][pos2.col];
    newGrid[pos2.row][pos2.col] = temp;
    
    // Update piece positions
    if (newGrid[pos1.row][pos1.col]) {
      newGrid[pos1.row][pos1.col]!.row = pos1.row;
      newGrid[pos1.row][pos1.col]!.col = pos1.col;
    }
    if (newGrid[pos2.row][pos2.col]) {
      newGrid[pos2.row][pos2.col]!.row = pos2.row;
      newGrid[pos2.row][pos2.col]!.col = pos2.col;
    }
    
    return newGrid;
  };

  // Handle piece click
  const handlePieceClick = async (row: number, col: number) => {
    if (isProcessing || gameState.gameOver || !gameState.isPlaying) return;
    
    const clickedPos = { row, col };
    
    if (!selectedPiece) {
      // Select first piece
      setSelectedPiece(clickedPos);
    } else if (selectedPiece.row === row && selectedPiece.col === col) {
      // Deselect same piece
      setSelectedPiece(null);
    } else if (areAdjacent(selectedPiece, clickedPos)) {
      // Valid move - swap pieces
      setIsProcessing(true);
      
      const swappedGrid = swapPieces(gameState.grid, selectedPiece, clickedPos);
      const matches = findMatches(swappedGrid);
      
      if (matches.length > 0) {
        // Valid move with matches
        setGameState(prev => ({
          ...prev,
          grid: swappedGrid,
          moves: prev.moves - 1
        }));
        
        // Process matches and cascades
        const { finalGrid, totalScore } = await processMatches(swappedGrid);
        
        setGameState(prev => ({
          ...prev,
          grid: finalGrid,
          score: prev.score + totalScore
        }));
        
        toast({
          title: "Great match!",
          description: `+${totalScore} points!`,
        });
      } else {
        // Invalid move - swap back
        toast({
          title: "No matches",
          description: "Try a different combination!",
          variant: "destructive"
        });
      }
      
      setSelectedPiece(null);
      setIsProcessing(false);
    } else {
      // Select new piece
      setSelectedPiece(clickedPos);
    }
  };

  // Check if user can play today (admins can always play)
  const canPlayToday = !hasPlayedToday || isAdmin;

  // Start new game
  const startGame = () => {
    if (!canPlayToday) {
      toast({
        title: "Daily limit reached",
        description: "Come back tomorrow for another challenge!",
        variant: "destructive"
      });
      return;
    }

    const initialGrid = fillGrid(createEmptyGrid());
    
    setGameState({
      grid: initialGrid,
      score: 0,
      moves: INITIAL_MOVES,
      targetScore: TARGET_SCORE,
      isPlaying: true,
      gameOver: false
    });
    
    setSelectedPiece(null);
    setIsProcessing(false);
    
    toast({
      title: "Daily Challenge Started!",
      description: "Beat the target score with limited moves!",
    });
  };

  // End game
  const endGame = useCallback(async () => {
    if (gameState.gameOver) return;
    
    setGameState(prev => ({ ...prev, isPlaying: false, gameOver: true }));
    setHasPlayedToday(true); // Mark as played today
    
    // Calculate coins based on score
    const coinsEarned = Math.floor(gameState.score / 100);
    const isWin = gameState.score >= gameState.targetScore;
    
    if (coinsEarned > 0 && gameUser) {
      try {
        await awardCoins('candy-crush', gameState.score, 0);
        toast({
          title: isWin ? "Challenge Complete! 🎉" : "Challenge Failed",
          description: isWin 
            ? `Amazing! You earned ${coinsEarned} coins! Score: ${gameState.score}` 
            : `You earned ${coinsEarned} coins. Try again tomorrow!`,
        });
      } catch (error) {
        toast({
          title: isWin ? "Challenge Complete! 🎉" : "Challenge Failed",
          description: `Final score: ${gameState.score}`,
        });
      }
    } else {
      toast({
        title: isWin ? "Challenge Complete! 🎉" : "Challenge Failed",
        description: `Final score: ${gameState.score}`,
      });
    }
  }, [gameState.score, gameState.targetScore, gameState.gameOver, gameUser, awardCoins, toast]);

  // Check for game end conditions
  useEffect(() => {
    if (gameState.isPlaying && (gameState.moves <= 0 || gameState.score >= gameState.targetScore)) {
      endGame();
    }
  }, [gameState.moves, gameState.score, gameState.targetScore, gameState.isPlaying, endGame]);

  // Check if user has played today
  useEffect(() => {
    if (gameUser?.last_game_played) {
      const lastPlayed = new Date(gameUser.last_game_played);
      const today = new Date();
      const isToday = lastPlayed.toDateString() === today.toDateString();
      setHasPlayedToday(isToday);
    }
  }, [gameUser]);

  // Get piece image
  const getPieceImage = (type: PieceType): string => {
    const imageMap: Record<PieceType, string> = {
      'candy-red': candyRed,
      'candy-blue': candyBlue,
      'candy-green': candyGreen,
      'candy-yellow': candyYellow,
      'candy-orange': candyOrange,
      'candy-purple': candyPurple,
    };
    return imageMap[type];
  };

  // Render game piece
  const renderPiece = (piece: GamePiece | null, row: number, col: number) => {
    const isSelected = selectedPiece?.row === row && selectedPiece?.col === col;
    
    return (
      <div
        key={`${row}-${col}`}
        className={`
          aspect-square bg-card border-2 rounded-lg cursor-pointer
          transition-all duration-200 hover:scale-105
          ${isSelected ? 'border-primary shadow-lg scale-110' : 'border-border'}
          ${isProcessing ? 'pointer-events-none opacity-50' : ''}
        `}
        onClick={() => handlePieceClick(row, col)}
      >
        {piece && (
          <img
            src={getPieceImage(piece.type)}
            alt={piece.type}
            className="w-full h-full object-contain p-1"
            draggable={false}
          />
        )}
      </div>
    );
  };

  if (!gameState.isPlaying && !gameState.gameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">🍬 Daily Candy Challenge</h2>
          <p className="text-muted-foreground max-w-md">
            One challenging level per day! Score {TARGET_SCORE} points in just {INITIAL_MOVES} moves to win coins.
          </p>
          {hasPlayedToday && !isAdmin && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                ✅ You've completed today's challenge! Come back tomorrow for a new one.
              </p>
            </div>
          )}
          {isAdmin && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <p className="text-sm text-primary">
                🔧 Admin mode: You can play unlimited times for testing
              </p>
            </div>
          )}
        </div>
        <Button 
          onClick={startGame} 
          size="lg" 
          className="px-8"
          disabled={hasPlayedToday && !isAdmin}
        >
          {hasPlayedToday && !isAdmin ? "Come Back Tomorrow" : isAdmin ? "Start Challenge (Admin)" : "Start Daily Challenge"}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Game Stats */}
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Score</p>
            <p className="text-xl font-bold text-primary">{gameState.score}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Moves Left</p>
            <p className="text-xl font-bold">{gameState.moves}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Target</p>
            <p className="text-xl font-bold text-accent">{gameState.targetScore}</p>
          </div>
        </div>
        <div className="mt-4 w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((gameState.score / gameState.targetScore) * 100, 100)}%` }}
          />
        </div>
      </Card>

      {/* Game Grid */}
      <Card className="p-4">
        <div 
          className="grid gap-1 mx-auto max-w-sm"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
        >
          {gameState.grid.map((row, rowIndex) =>
            row.map((piece, colIndex) => renderPiece(piece, rowIndex, colIndex))
          )}
        </div>
      </Card>

      {/* Game Controls */}
      {gameState.gameOver && (
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Challenge complete! Come back tomorrow for a new challenge.
          </p>
        </div>
      )}

      {/* Instructions */}
      <Card className="p-4 bg-muted/50">
        <h3 className="font-semibold mb-2">Daily Challenge Rules:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Click a candy to select it</li>
          <li>• Click an adjacent candy to swap them</li>
          <li>• Match 3+ candies in a row to score points</li>
          <li>• Reach {TARGET_SCORE} points in {INITIAL_MOVES} moves to win!</li>
          <li>• One challenge per day - make it count!</li>
        </ul>
      </Card>
    </div>
  );
};

export default CandyCrushGame;