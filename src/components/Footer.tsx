const Footer = () => {
  return (
    <footer className="bg-card border-t py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold">LN</span>
              </div>
              <span className="font-bold text-lg">La Nova Cafe Quest</span>
            </div>
            <p className="text-muted-foreground">
              Play games, earn coins, enjoy delicious food. Your loyalty program, gamified.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Games</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Candy Crush Cafe</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Coffee Connect</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Pastry Pop</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Daily Challenges</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Rewards</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Coffee & Drinks</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Pastries & Snacks</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Full Meals</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Special Offers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Restaurant</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="https://www.lanova-restcafe.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Visit La Nova</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Location</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Menu</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; 2024 La Nova Cafe Quest. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;