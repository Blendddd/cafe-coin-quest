import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import { GameCenter } from "@/components/game/GameCenter";
import { RedemptionCenter } from "@/components/redemption/RedemptionCenter";
import Footer from "@/components/Footer";

const Index = () => {
  const [activeTab, setActiveTab] = useState("hero");
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      <main>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="container mx-auto px-4">
            <TabsList className="grid w-full grid-cols-3 sticky top-20 z-40 bg-background/80 backdrop-blur-md">
              <TabsTrigger value="hero">🏠 Home</TabsTrigger>
              <TabsTrigger value="games">🎮 Games</TabsTrigger>
              <TabsTrigger value="rewards">🎁 Rewards</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="hero" className="mt-0">
            <Hero 
              onStartPlaying={() => setActiveTab("games")} 
              onViewMenu={() => setShowMenu(true)}
              showMenu={showMenu}
              onCloseMenu={() => setShowMenu(false)}
            />
          </TabsContent>
          
          <TabsContent value="games" className="mt-6">
            <div className="container mx-auto px-4">
              <GameCenter />
            </div>
          </TabsContent>
          
          <TabsContent value="rewards" className="mt-6">
            <div className="container mx-auto px-4">
              <RedemptionCenter />
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
