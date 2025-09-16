import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GameUser {
  id: string;
  auth_id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  coin_balance: number;
  total_coins_earned: number;
  daily_coin_limit: number;
  coins_earned_today: number;
  last_daily_reset: string;
  created_at: string;
  updated_at: string;
}

export const useGameUser = () => {
  const { user, session } = useAuth();
  const [gameUser, setGameUser] = useState<GameUser | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createOrGetGameUser = async () => {
    if (!user || !session) return null;
    
    setLoading(true);
    
    try {
      // First, try to get existing game user
      const { data: existingUser, error: fetchError } = await supabase
        .from('game_users')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingUser) {
        setGameUser(existingUser);
        return existingUser;
      }

      // Create new game user if doesn't exist
      const { data: newUser, error: createError } = await supabase
        .from('game_users')
        .insert({
          auth_id: user.id,
          display_name: user.user_metadata?.display_name || null,
          email: user.email || null,
        })
        .select('*')
        .single();

      if (createError) {
        throw createError;
      }

      setGameUser(newUser);
      toast({
        title: "Welcome!",
        description: "Your game account has been created. You start with 0 coins!",
      });
      
      return newUser;
    } catch (error: any) {
      console.error('Error creating/fetching game user:', error);
      toast({
        title: "Error",
        description: "Failed to setup game account. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const refreshGameUser = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('game_users')
      .select('*')
      .eq('auth_id', user.id)
      .single();
    
    if (error) {
      console.error('Error refreshing game user:', error);
      return;
    }
    
    setGameUser(data);
  };

  const awardCoins = async (gameType: string, score: number, durationSeconds?: number) => {
    if (!gameUser) return null;
    
    try {
      const { data, error } = await supabase.rpc('award_coins', {
        p_user_id: gameUser.id,
        p_game_type: gameType,
        p_score: score,
        p_duration_seconds: durationSeconds
      });

      if (error) throw error;
      
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (result.success) {
        // Refresh user data to get updated balance
        await refreshGameUser();
        
        toast({
          title: `+${result.coins_awarded} coins!`,
          description: `New balance: ${result.new_balance} coins`,
        });
        
        return result;
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return null;
      }
    } catch (error: any) {
      console.error('Error awarding coins:', error);
      toast({
        title: "Error",
        description: "Failed to award coins. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const createRedemption = async (itemName: string, coinsRequired: number) => {
    if (!gameUser) return null;
    
    try {
      const { data, error } = await supabase.rpc('create_redemption', {
        p_user_id: gameUser.id,
        p_item_name: itemName,
        p_coins_required: coinsRequired
      });

      if (error) throw error;
      
      const result = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (result.success) {
        // Refresh user data to get updated balance
        await refreshGameUser();
        
        toast({
          title: "Redemption Created!",
          description: `Code: ${result.redemption_code}`,
        });
        
        return result;
      } else {
        toast({
          title: "Redemption Failed",
          description: result.error,
          variant: "destructive",
        });
        return null;
      }
    } catch (error: any) {
      console.error('Error creating redemption:', error);
      toast({
        title: "Error",
        description: "Failed to create redemption. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    if (user && session && !gameUser) {
      createOrGetGameUser();
    }
  }, [user, session]);

  return {
    gameUser,
    loading,
    createOrGetGameUser,
    refreshGameUser,
    awardCoins,
    createRedemption,
  };
};