import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Header = () => {
  return (
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
                <span className="font-semibold text-accent-foreground">0</span>
              </div>
            </Card>
            <Button variant="outline">Sign In</Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;