import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import MenuModal from "./MenuModal";

interface HeroProps {
  onStartPlaying: () => void;
  onViewMenu: () => void;
  showMenu: boolean;
  onCloseMenu: () => void;
}

const Hero = ({ onStartPlaying, onViewMenu, showMenu, onCloseMenu }: HeroProps) => {
  return (
    <section 
      id="home" 
      className="py-20 bg-gradient-to-br from-background to-secondary relative"
    >
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Play. Earn. <span className="text-primary">Taste.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Welcome to La Nova Cafe Quest! Play fun games, collect coins, and redeem them for delicious food at our restaurant. Your loyalty, gamified.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-lg px-8 py-6" onClick={onStartPlaying}>
              🎮 Start Playing
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6" onClick={onViewMenu}>
              🍽️ View Menu
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <Card className="p-6 text-center bg-card/50 backdrop-blur-sm">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Play Games</h3>
              <p className="text-muted-foreground">
                Enjoy CandyCrash-style games and earn coins for every level you complete
              </p>
            </Card>

            <Card className="p-6 text-center bg-card/50 backdrop-blur-sm">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🪙</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Collect Coins</h3>
              <p className="text-muted-foreground">
                Build up your coin balance over days and weeks of gameplay
              </p>
            </Card>

            <Card className="p-6 text-center bg-card/50 backdrop-blur-sm">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🍕</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Redeem Food</h3>
              <p className="text-muted-foreground">
                Trade your coins for real food at La Nova restaurant
              </p>
            </Card>
          </div>
        </div>
      </div>
      
      <MenuModal open={showMenu} onClose={onCloseMenu} />
    </section>
  );
};

export default Hero;