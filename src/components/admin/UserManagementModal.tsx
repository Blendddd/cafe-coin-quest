import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, Coins, GamepadIcon, Gift, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CoinAdjustmentForm } from './CoinAdjustmentForm';

interface AdminUser {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  coin_balance: number;
  total_coins_earned: number;
  coins_earned_today: number;
  last_game_played: string | null;
  created_at: string;
  total_games: number;
  total_redemptions: number;
}

interface GameSession {
  id: string;
  game_type: string;
  score: number;
  coins_earned: number;
  duration_seconds: number | null;
  completed_at: string;
}

interface Redemption {
  id: string;
  item_name: string;
  redemption_code: string;
  status: string;
  coins_spent: number;
  created_at: string;
  expires_at: string;
  redeemed_at: string | null;
}

interface AdminAction {
  id: string;
  action_type: string;
  coin_adjustment: number | null;
  reason: string;
  old_balance: number | null;
  new_balance: number | null;
  created_at: string;
}

interface UserManagementModalProps {
  user: AdminUser;
  open: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  user,
  open,
  onClose,
}) => {
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(user.coin_balance);
  const { toast } = useToast();

  const fetchUserData = async () => {
    if (!open) return;

    setLoading(true);
    try {
      // Fetch game sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(20);

      if (sessionsError) throw sessionsError;
      setGameSessions(sessions || []);

      // Fetch redemptions
      const { data: userRedemptions, error: redemptionsError } = await supabase
        .from('redemptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (redemptionsError) throw redemptionsError;
      setRedemptions(userRedemptions || []);

      // Fetch admin actions for this user
      const { data: actions, error: actionsError } = await supabase
        .from('admin_actions')
        .select('*')
        .eq('target_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (actionsError) throw actionsError;
      setAdminActions(actions || []);

      // Get updated balance
      const { data: userData, error: userError } = await supabase
        .from('game_users')
        .select('coin_balance')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      if (userData) {
        setCurrentBalance(userData.coin_balance);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user.id, open]);

  const handleCoinAdjustment = async () => {
    // Refresh user data after coin adjustment
    await fetchUserData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Management: {user.display_name || 'Anonymous User'}
          </DialogTitle>
          <DialogDescription>
            View and manage user details, game history, and coin balance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Current Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentBalance}</div>
                <div className="text-xs text-muted-foreground">
                  Total earned: {user.total_coins_earned}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <GamepadIcon className="h-4 w-4" />
                  Games Played
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.total_games}</div>
                <div className="text-xs text-muted-foreground">
                  Today: {user.coins_earned_today} coins
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Redemptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.total_redemptions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {user.last_game_played 
                    ? formatDate(user.last_game_played)
                    : 'Never'
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <div className="text-sm text-muted-foreground">
                    {user.email || 'Not provided'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <div className="text-sm text-muted-foreground">
                    {user.phone || 'Not provided'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">User ID</label>
                  <div className="text-sm font-mono text-muted-foreground">
                    {user.id}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Created</label>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(user.created_at)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coin Adjustment */}
          <CoinAdjustmentForm
            userId={user.id}
            currentBalance={currentBalance}
            onAdjustment={handleCoinAdjustment}
          />

          {/* Tabs for detailed information */}
          <Tabs defaultValue="games" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="games">Game History</TabsTrigger>
              <TabsTrigger value="redemptions">Redemptions</TabsTrigger>
              <TabsTrigger value="admin">Admin Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="games">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Game Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : gameSessions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Game Type</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Coins Earned</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gameSessions.map((session) => (
                          <TableRow key={session.id}>
                            <TableCell className="font-medium">
                              {session.game_type}
                            </TableCell>
                            <TableCell>{session.score.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                +{session.coins_earned}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDuration(session.duration_seconds)}
                            </TableCell>
                            <TableCell>
                              {formatDate(session.completed_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No game sessions found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="redemptions">
              <Card>
                <CardHeader>
                  <CardTitle>Redemption History</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : redemptions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Coins Spent</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {redemptions.map((redemption) => (
                          <TableRow key={redemption.id}>
                            <TableCell className="font-medium">
                              {redemption.item_name}
                            </TableCell>
                            <TableCell className="font-mono">
                              {redemption.redemption_code}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  redemption.status === 'redeemed'
                                    ? 'default'
                                    : redemption.status === 'expired'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {redemption.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                -{redemption.coins_spent}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDate(redemption.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No redemptions found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admin">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Admin Action History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : adminActions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Action</TableHead>
                          <TableHead>Adjustment</TableHead>
                          <TableHead>Balance Change</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {adminActions.map((action) => (
                          <TableRow key={action.id}>
                            <TableCell className="font-medium">
                              {action.action_type.replace('_', ' ')}
                            </TableCell>
                            <TableCell>
                              {action.coin_adjustment !== null && (
                                <Badge
                                  variant={action.coin_adjustment > 0 ? 'default' : 'destructive'}
                                >
                                  {action.coin_adjustment > 0 ? '+' : ''}
                                  {action.coin_adjustment}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {action.old_balance !== null && action.new_balance !== null && (
                                <span className="text-sm">
                                  {action.old_balance} → {action.new_balance}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{action.reason}</span>
                            </TableCell>
                            <TableCell>
                              {formatDate(action.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No admin actions found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};