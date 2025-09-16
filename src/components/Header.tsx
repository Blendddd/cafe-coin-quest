import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useGameUser } from "@/hooks/useGameUser";
import { AuthModal } from "./auth/AuthModal";

const Header = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { gameUser } = useGameUser();

  return (
    <>
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">LN</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">La Nova</h1>
              <p className="text-sm text-muted-foreground">Cafe Quest</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#home" className="text-foreground hover:text-primary transition-colors">Home</a>
            <a href="#games" className="text-foreground hover:text-primary transition-colors">Games</a>
            <a href="#rewards" className="text-foreground hover:text-primary transition-colors">Rewards</a>
            <a href="#menu" className="text-foreground hover:text-primary transition-colors">Menu</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Card className="px-3 py-1 bg-accent">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🪙</span>
                <span className="font-semibold text-accent-foreground">
                  {gameUser?.coin_balance ?? 0}
                </span>
              </div>
            </Card>
            
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground hidden md:inline">
                  Welcome, {user.email}
                </span>
                <Button variant="outline" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setAuthModalOpen(true)}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
    
    <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  );
};

export default Header;