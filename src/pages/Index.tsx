import Header from "@/components/Header";
import Hero from "@/components/Hero";
import GameSection from "@/components/GameSection";
import RewardsSection from "@/components/RewardsSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <GameSection />
        <RewardsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
