import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const GameSection = () => {
  return (
    <section id="games" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            🎮 Game Center
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Play addictive puzzle games inspired by your favorite cafe treats. Match, crush, and collect coins!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <div className="text-6xl group-hover:scale-110 transition-transform duration-300">🍬</div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Candy Crush Cafe</h3>
              <p className="text-muted-foreground mb-4">
                Match delicious cafe treats in this sweet puzzle adventure
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-primary">Earn up to</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">🪙</span>
                    <span className="font-semibold">50</span>
                  </div>
                </div>
                <Button>Play Now</Button>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="aspect-square bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
              <div className="text-6xl group-hover:scale-110 transition-transform duration-300">☕</div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Coffee Connect</h3>
              <p className="text-muted-foreground mb-4">
                Connect coffee beans and create the perfect brew combinations
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-primary">Earn up to</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">🪙</span>
                    <span className="font-semibold">75</span>
                  </div>
                </div>
                <Button variant="outline">Coming Soon</Button>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <div className="text-6xl group-hover:scale-110 transition-transform duration-300">🥐</div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">Pastry Pop</h3>
              <p className="text-muted-foreground mb-4">
                Pop bubbles to reveal hidden pastries and sweet surprises
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-primary">Earn up to</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">🪙</span>
                    <span className="font-semibold">60</span>
                  </div>
                </div>
                <Button variant="outline">Coming Soon</Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-4 bg-card px-6 py-4 rounded-lg border">
            <span className="text-2xl">⏰</span>
            <div className="text-left">
              <p className="font-semibold">Daily Bonus Available!</p>
              <p className="text-sm text-muted-foreground">Get 25 free coins just for logging in today</p>
            </div>
            <Button variant="outline">Claim Bonus</Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GameSection;