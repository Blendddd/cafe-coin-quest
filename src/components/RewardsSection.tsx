import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RewardsSection = () => {
  const rewards = [
    {
      name: "Free Coffee",
      price: 150,
      emoji: "☕",
      description: "Any size coffee of your choice",
      popular: false
    },
    {
      name: "Croissant",
      price: 200,
      emoji: "🥐",
      description: "Fresh baked croissant",
      popular: true
    },
    {
      name: "Sandwich",
      price: 400,
      emoji: "🥪",
      description: "Any sandwich from our menu",
      popular: false
    },
    {
      name: "Pasta Dish",
      price: 600,
      emoji: "🍝",
      description: "Full pasta meal with drink",
      popular: true
    },
    {
      name: "Pizza Slice",
      price: 300,
      emoji: "🍕",
      description: "Any pizza slice",
      popular: false
    },
    {
      name: "Full Meal",
      price: 1000,
      emoji: "🍽️",
      description: "Complete meal with appetizer, main, and dessert",
      popular: false
    }
  ];

  return (
    <section id="rewards" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            🏆 Rewards Menu
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Trade your hard-earned coins for delicious food at La Nova. The more you play, the more you save!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward, index) => (
            <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              {reward.popular && (
                <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">
                  Popular
                </Badge>
              )}
              
              <div className="p-6">
                <div className="text-center mb-4">
                  <div className="text-5xl mb-2 group-hover:scale-110 transition-transform duration-300">
                    {reward.emoji}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{reward.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{reward.description}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🪙</span>
                    <span className="text-2xl font-bold text-primary">{reward.price}</span>
                  </div>
                  <Button 
                    variant={reward.popular ? "default" : "outline"}
                    className="flex-shrink-0"
                  >
                    Redeem
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto p-8 bg-gradient-to-r from-primary/10 to-accent/10">
            <h3 className="text-2xl font-bold mb-4">How Redemption Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl mb-2">1️⃣</div>
                <h4 className="font-semibold mb-1">Select Reward</h4>
                <p className="text-sm text-muted-foreground">Choose what you want to redeem</p>
              </div>
              <div>
                <div className="text-3xl mb-2">2️⃣</div>
                <h4 className="font-semibold mb-1">Show QR Code</h4>
                <p className="text-sm text-muted-foreground">Present your redemption code</p>
              </div>
              <div>
                <div className="text-3xl mb-2">3️⃣</div>
                <h4 className="font-semibold mb-1">Enjoy Your Food</h4>
                <p className="text-sm text-muted-foreground">Staff verifies and serves your meal</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default RewardsSection;