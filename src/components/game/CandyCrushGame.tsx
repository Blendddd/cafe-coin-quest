import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useGameUser } from '@/hooks/useGameUser';

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
  level: number;
  targetScore: number;
  isPlaying: boolean;
  gameOver: boolean;
}

interface Position {
  row: number;
  col: number;
}

const GRID_SIZE = 6;
const INITIAL_MOVES = 20;
const PIECE_TYPES: PieceType[] = ['candy-red', 'candy-blue', 'candy-green', 'candy-yellow', 'candy-orange', 'candy-purple'];

const CandyCrushGame: React.FC = () => {
  const { toast } = useToast();
  const { gameUser, awardCoins } = useGameUser();

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    grid: [],
    score: 0,
    moves: INITIAL_MOVES,
    level: 1,
    targetScore: 1000,
    isPlaying: false,
    gameOver: false
  });

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

  // Start new game
  const startGame = () => {
    const initialGrid = fillGrid(createEmptyGrid());
    
    setGameState({
      grid: initialGrid,
      score: 0,
      moves: INITIAL_MOVES,
      level: 1,
      targetScore: 1000,
      isPlaying: true,
      gameOver: false
    });
    
    setSelectedPiece(null);
    setIsProcessing(false);
    
    toast({
      title: "Game Started!",
      description: "Make matches to earn points and coins!",
    });
  };

  // End game
  const endGame = useCallback(async () => {
    if (gameState.gameOver) return;
    
    setGameState(prev => ({ ...prev, isPlaying: false, gameOver: true }));
    
    // Calculate coins based on score
    const coinsEarned = Math.floor(gameState.score / 100);
    
    if (coinsEarned > 0 && gameUser) {
      try {
        await awardCoins('candy-crush', gameState.score, 0);
        toast({
          title: "Game Over!",
          description: `You earned ${coinsEarned} coins! Final score: ${gameState.score}`,
        });
      } catch (error) {
        toast({
          title: "Game Over!",
          description: `Final score: ${gameState.score}`,
        });
      }
    } else {
      toast({
        title: "Game Over!",
        description: `Final score: ${gameState.score}`,
      });
    }
  }, [gameState.score, gameState.gameOver, gameUser, awardCoins, toast]);

  // Check for game end conditions
  useEffect(() => {
    if (gameState.isPlaying && gameState.moves <= 0) {
      endGame();
    } else if (gameState.isPlaying && gameState.score >= gameState.targetScore) {
      // Level up
      setGameState(prev => ({
        ...prev,
        level: prev.level + 1,
        targetScore: prev.targetScore * 1.5,
        moves: prev.moves + 5
      }));
      
      toast({
        title: "Level Up!",
        description: `Welcome to level ${gameState.level + 1}!`,
      });
    }
  }, [gameState.moves, gameState.score, gameState.targetScore, gameState.isPlaying, gameState.level, endGame]);

  // Get piece image
  const getPieceImage = (type: PieceType): string => {
    const imageMap: Record<PieceType, string> = {
      'candy-red': '/src/assets/candy-red.png',
      'candy-blue': '/src/assets/candy-blue.png',
      'candy-green': '/src/assets/candy-green.png',
      'candy-yellow': '/src/assets/candy-yellow.png',
      'candy-orange': '/src/assets/candy-orange.png',
      'candy-purple': '/src/assets/candy-purple.png',
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
          <h2 className="text-3xl font-bold mb-4">🍬 Candy Crush Cafe</h2>
          <p className="text-muted-foreground max-w-md">
            Match 3 or more candies to score points and earn coins! 
            Swap adjacent pieces to create delicious combinations.
          </p>
        </div>
        <Button onClick={startGame} size="lg" className="px-8">
          Start Playing
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Game Stats */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Score</p>
            <p className="text-xl font-bold text-primary">{gameState.score}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Moves</p>
            <p className="text-xl font-bold">{gameState.moves}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Level</p>
            <p className="text-xl font-bold">{gameState.level}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Target</p>
            <p className="text-xl font-bold text-accent">{gameState.targetScore}</p>
          </div>
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
      <div className="flex justify-center space-x-4">
        <Button onClick={startGame} variant="outline">
          New Game
        </Button>
        {gameState.gameOver && (
          <Button onClick={startGame}>
            Play Again
          </Button>
        )}
      </div>

      {/* Instructions */}
      <Card className="p-4 bg-muted/50">
        <h3 className="font-semibold mb-2">How to Play:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Click a candy to select it</li>
          <li>• Click an adjacent candy to swap them</li>
          <li>• Match 3+ candies in a row to score points</li>
          <li>• Earn coins based on your final score</li>
          <li>• Reach the target score to level up!</li>
        </ul>
      </Card>
    </div>
  );
};

export default CandyCrushGame;