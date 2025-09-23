import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuthSimple';
import { useGameUser } from '@/hooks/useGameUser';
import { AuthModal } from '../auth/AuthModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  coin_price: number;
  category: string;
  emoji: string;
}

interface Redemption {
  id: string;
  item_name: string;
  coins_spent: number;
  redemption_code: string;
  status: string;
  created_at: string;
  expires_at: string;
}

const MENU_ITEMS: MenuItem[] = [
  // Appetizers & Mezze
  { id: '1', name: 'Hummus with Bread', description: 'Creamy chickpea dip served with fresh Kurdish bread', coin_price: 120, category: 'Appetizers', emoji: '🫓' },
  { id: '2', name: 'Baba Ganoush', description: 'Smoky roasted eggplant dip with tahini', coin_price: 140, category: 'Appetizers', emoji: '🍆' },
  { id: '3', name: 'Tabbouleh Salad', description: 'Fresh parsley salad with tomatoes and bulgur', coin_price: 160, category: 'Appetizers', emoji: '🥗' },
  { id: '4', name: 'Stuffed Grape Leaves', description: 'Traditional dolma filled with rice and herbs', coin_price: 180, category: 'Appetizers', emoji: '🍃' },
  
  // Main Courses
  { id: '5', name: 'Kurdish Kebab', description: 'Grilled lamb skewers with onions and spices', coin_price: 450, category: 'Main Courses', emoji: '🍢' },
  { id: '6', name: 'Chicken Shawarma', description: 'Marinated chicken with garlic sauce and vegetables', coin_price: 350, category: 'Main Courses', emoji: '🌯' },
  { id: '7', name: 'Lamb Biryani', description: 'Fragrant rice dish with tender lamb and saffron', coin_price: 500, category: 'Main Courses', emoji: '🍛' },
  { id: '8', name: 'Falafel Plate', description: 'Crispy chickpea patties with tahini sauce', coin_price: 300, category: 'Main Courses', emoji: '🧆' },
  { id: '9', name: 'Mansaf', description: 'Traditional lamb with yogurt sauce and rice', coin_price: 550, category: 'Main Courses', emoji: '🍖' },
  { id: '10', name: 'Kurdish Kufta', description: 'Spiced meatballs in tomato sauce with bread', coin_price: 400, category: 'Main Courses', emoji: '🍲' },
  
  // Desserts
  { id: '11', name: 'Baklava', description: 'Layered pastry with nuts and honey syrup', coin_price: 150, category: 'Desserts', emoji: '🥮' },
  { id: '12', name: 'Muhallabia', description: 'Creamy milk pudding with rose water and pistachios', coin_price: 120, category: 'Desserts', emoji: '🍮' },
  { id: '13', name: 'Halva', description: 'Traditional sesame seed sweet', coin_price: 100, category: 'Desserts', emoji: '🍯' },
  
  // Beverages
  { id: '14', name: 'Kurdish Tea', description: 'Traditional strong black tea served in glasses', coin_price: 60, category: 'Beverages', emoji: '🍵' },
  { id: '15', name: 'Turkish Coffee', description: 'Rich, aromatic coffee prepared traditionally', coin_price: 80, category: 'Beverages', emoji: '☕' },
  { id: '16', name: 'Fresh Pomegranate Juice', description: 'Freshly squeezed pomegranate juice', coin_price: 140, category: 'Beverages', emoji: '🧃' },
  { id: '17', name: 'Ayran', description: 'Refreshing yogurt drink with mint', coin_price: 90, category: 'Beverages', emoji: '🥛' },
  { id: '18', name: 'Jallab', description: 'Traditional date syrup drink with pine nuts', coin_price: 110, category: 'Beverages', emoji: '🥤' },
];

export const RedemptionCenter = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [redemptionModal, setRedemptionModal] = useState<{ open: boolean; item: MenuItem | null }>({ open: false, item: null });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userRedemptions, setUserRedemptions] = useState<Redemption[]>([]);
  const { user } = useAuth();
  const { gameUser, createRedemption } = useGameUser();
  const { toast } = useToast();

  const categories = ['All', ...Array.from(new Set(MENU_ITEMS.map(item => item.category)))];
  
  const filteredItems = selectedCategory === 'All' 
    ? MENU_ITEMS 
    : MENU_ITEMS.filter(item => item.category === selectedCategory);

  const fetchUserRedemptions = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('redemptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching redemptions:', error);
      return;
    }
    
    setUserRedemptions(data || []);
  };

  useEffect(() => {
    if (user) {
      fetchUserRedemptions();
    }
  }, [user]);

  const handleRedemption = (item: MenuItem) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    
    if (!gameUser || gameUser.coin_balance < item.coin_price) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${item.coin_price} coins to redeem this item.`,
        variant: "destructive",
      });
      return;
    }
    
    setRedemptionModal({ open: true, item });
  };

  const confirmRedemption = async () => {
    if (!redemptionModal.item) return;
    
    const result = await createRedemption(redemptionModal.item.name, redemptionModal.item.coin_price);
    
    if (result) {
      await fetchUserRedemptions();
    }
    
    setRedemptionModal({ open: false, item: null });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">🪙 La Nova Coin Redemption</h2>
          <p className="text-muted-foreground">
            Redeem your hard-earned coins for authentic Kurdish and Middle Eastern dishes at La Nova RestCafe!
          </p>
          {gameUser && (
            <Badge variant="secondary" className="mt-2">
              💰 {gameUser.coin_balance} coins available
            </Badge>
          )}
        </div>

        {/* Redemption Instructions */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">🎯 How to Redeem</h3>
            <p className="text-muted-foreground">
              Select any item below, confirm your purchase, and show your redemption code at La Nova RestCafe to enjoy authentic Kurdish cuisine!
            </p>
          </CardContent>
        </Card>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Menu Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{item.emoji}</span>
                  {item.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-lg">
                    {item.coin_price} 🪙
                  </Badge>
                  <Button 
                    onClick={() => handleRedemption(item)}
                    disabled={!user || (gameUser && gameUser.coin_balance < item.coin_price)}
                  >
                    Redeem
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User's Recent Redemptions */}
        {user && userRedemptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>🧾 Your Recent Redemptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userRedemptions.map((redemption) => (
                  <div key={redemption.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{redemption.item_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Code: {redemption.redemption_code} | {redemption.coins_spent} coins
                      </p>
                    </div>
                    <Badge variant={redemption.status === 'pending' ? 'secondary' : 'default'}>
                      {redemption.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!user && (
          <Card className="bg-accent/20 border-primary/20">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Ready to redeem rewards? 🎁</h3>
              <p className="text-muted-foreground mb-4">
                Sign in to start redeeming your coins for authentic Kurdish dishes at La Nova RestCafe!
              </p>
              <Button onClick={() => setAuthModalOpen(true)} size="lg">
                Sign In to Redeem
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Redemption Confirmation Modal */}
      <Dialog open={redemptionModal.open} onOpenChange={(open) => setRedemptionModal({ open, item: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Redemption</DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem this item?
            </DialogDescription>
          </DialogHeader>
          
          {redemptionModal.item && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{redemptionModal.item.emoji}</span>
                <div>
                  <h4 className="font-semibold">{redemptionModal.item.name}</h4>
                  <p className="text-sm text-muted-foreground">{redemptionModal.item.description}</p>
                </div>
              </div>
              
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span>Cost:</span>
                  <Badge variant="secondary">{redemptionModal.item.coin_price} 🪙</Badge>
                </div>
                {gameUser && (
                  <div className="flex justify-between items-center mt-2">
                    <span>Balance after:</span>
                    <span className="font-semibold">{gameUser.coin_balance - redemptionModal.item.coin_price} 🪙</span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setRedemptionModal({ open: false, item: null })} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={confirmRedemption} className="flex-1">
                  Confirm Redemption
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  );
};