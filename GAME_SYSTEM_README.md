# 🎮 La Nova Cafe Quest - Modular Game & Loyalty System

A complete CandyCrash-like game and loyalty system that can be embedded into any restaurant website. Users play games, earn coins, and redeem them for real food rewards.

## ✨ Features Included

### 🔐 User Authentication
- Email/password signup & signin
- Secure session management
- User profiles with game data

### 🎮 Game System
- **Candy Crash Game**: Match-3 puzzle game
- Real-time scoring system
- Daily coin earning limits (500 coins/day)
- Anti-cheat protection (backend validation)

### 💰 Coin Wallet System  
- Persistent coin balance across sessions
- Daily limits and tracking
- Secure backend validation
- Real-time balance updates

### 🎁 Redemption System
- Full restaurant menu with coin prices
- Redemption code generation
- Order tracking and verification
- Staff-friendly redemption codes

### 📊 Analytics & Tracking
- Game session tracking
- User engagement metrics
- Redemption history
- Daily/weekly usage stats

## 🛠 Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (Authentication, Database, RLS)
- **Database**: PostgreSQL with Row Level Security
- **Real-time**: Supabase real-time subscriptions
- **Security**: Server-side validation, daily limits, RLS policies

## 📁 Component Structure

```
src/
├── hooks/
│   ├── useAuth.tsx          # Authentication management
│   └── useGameUser.tsx      # Game user & coin management
├── components/
│   ├── auth/
│   │   └── AuthModal.tsx    # Login/signup modal
│   ├── game/
│   │   ├── CandyCrashGame.tsx  # Main game component
│   │   └── GameCenter.tsx      # Game selection hub
│   └── redemption/
│       └── RedemptionCenter.tsx # Food redemption system
```

## 🚀 How to Embed in Your Restaurant Website

### Option 1: Individual Components
```jsx
import { AuthProvider } from './hooks/useAuth';
import { CandyCrashGame } from './components/game/CandyCrashGame';
import { RedemptionCenter } from './components/redemption/RedemptionCenter';

// Wrap your app with AuthProvider
<AuthProvider>
  {/* Use components anywhere */}
  <CandyCrashGame />
  <RedemptionCenter />
</AuthProvider>
```

### Option 2: Complete Game Center
```jsx
import { GameCenter } from './components/game/GameCenter';
import { RedemptionCenter } from './components/redemption/RedemptionCenter';

// Full game experience
<GameCenter />
<RedemptionCenter />
```

### Option 3: Embed as Widget
```jsx
// Add to any page as a widget
<div className="game-widget">
  <CandyCrashGame />
</div>
```

## 🔧 Configuration

### Database Setup
- ✅ User accounts with game profiles
- ✅ Coin balance tracking
- ✅ Game session logging  
- ✅ Redemption system
- ✅ Row Level Security policies
- ✅ Anti-cheat validation functions

### Customization Options

#### Game Settings
```javascript
// In CandyCrashGame.tsx
const INITIAL_MOVES = 30;        // Moves per game
const DAILY_COIN_LIMIT = 500;    // Max coins per day
const COINS_PER_100_POINTS = 1;  // Conversion rate
const MAX_COINS_PER_GAME = 50;   // Game limit
```

#### Menu Items
```javascript
// In RedemptionCenter.tsx - easily modify menu
const MENU_ITEMS = [
  { name: 'Pizza Slice', coin_price: 200, category: 'Main' },
  { name: 'Coffee', coin_price: 80, category: 'Beverages' },
  // Add your restaurant items here
];
```

## 🏪 Restaurant Staff Features

### Redemption Verification
- Unique codes like "LN4A2F9B" 
- 24-hour expiry on redemptions
- Simple staff interface to verify codes
- Automatic order tracking

### Analytics Dashboard
- Total coins earned by users
- Popular menu items
- Daily/weekly engagement
- Revenue impact tracking

## 🔒 Security Features

- ✅ Server-side coin validation
- ✅ Daily earning limits
- ✅ Row Level Security (RLS)
- ✅ Bot protection
- ✅ Session security
- ✅ Input validation

## 🎯 Benefits for Restaurants

1. **Customer Loyalty**: Gamified rewards system
2. **Increased Visits**: Daily coin limits encourage return visits  
3. **Data Collection**: User preferences and engagement metrics
4. **Social Media**: Shareable game scores and achievements
5. **Revenue**: Direct redemption drives food sales

## 🚀 Getting Started

1. **Database is ready** - All tables and functions created
2. **Components are modular** - Pick what you need
3. **Styling is customizable** - Tailwind CSS classes
4. **API is secure** - Backend validation included

## 📱 Mobile Ready

- Responsive design for all devices
- Touch-friendly game controls
- Mobile-optimized interface
- Progressive Web App ready

## 🎮 Game Mechanics

### Candy Crash Rules
- Match 3+ candies to score points
- 1 coin per 100 points scored
- Maximum 50 coins per game
- 30 moves per game
- Level progression with increasing targets

### Coin Economics
- Daily limit: 500 coins max
- Resets at midnight
- Secure backend validation
- No client-side manipulation possible

---

**Ready to boost your restaurant's customer loyalty with gamification!** 🚀

This system is completely self-contained and can be embedded into any existing website or used as a standalone loyalty platform.