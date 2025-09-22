import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Minus, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CoinAdjustmentFormProps {
  userId: string;
  currentBalance: number;
  onAdjustment: () => void;
}

export const CoinAdjustmentForm: React.FC<CoinAdjustmentFormProps> = ({
  userId,
  currentBalance,
  onAdjustment,
}) => {
  const [adjustment, setAdjustment] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (adjustment === 0) {
      toast({
        title: "Invalid Adjustment",
        description: "Please enter a non-zero coin adjustment amount.",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for this coin adjustment.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_adjust_user_coins', {
        p_target_user_id: userId,
        p_coin_adjustment: adjustment,
        p_reason: reason.trim(),
      });

      if (error) {
        console.error('Error adjusting coins:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to adjust coins. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const result = data as any;
      if (result && result.success) {
        toast({
          title: "Success",
          description: `Coins ${adjustment > 0 ? 'added' : 'deducted'} successfully. New balance: ${result.new_balance}`,
        });

        // Reset form
        setAdjustment(0);
        setReason('');
        setConfirmOpen(false);

        // Notify parent to refresh data
        onAdjustment();
      } else {
        toast({
          title: "Error",
          description: result?.error || "Failed to adjust coins.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adjusting coins:', error);
      toast({
        title: "Error",
        description: "Failed to adjust coins. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const newBalance = currentBalance + adjustment;
  const isDeduction = adjustment < 0;
  const wouldGoNegative = newBalance < 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Coin Adjustment
        </CardTitle>
        <CardDescription>
          Add or deduct coins from user's balance. All adjustments are logged for audit purposes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="current-balance">Current Balance</Label>
              <div className="text-2xl font-bold text-muted-foreground">
                {currentBalance} coins
              </div>
            </div>
            <div>
              <Label htmlFor="new-balance">New Balance</Label>
              <div className="text-2xl font-bold">
                <Badge
                  variant={wouldGoNegative ? "destructive" : "default"}
                  className="text-lg px-3 py-1"
                >
                  {newBalance} coins
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="adjustment">Coin Adjustment</Label>
            <div className="flex gap-2 mt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdjustment(prev => prev - 10)}
              >
                <Minus className="h-4 w-4" />
                10
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdjustment(prev => prev - 50)}
              >
                <Minus className="h-4 w-4" />
                50
              </Button>
              <Input
                id="adjustment"
                type="number"
                value={adjustment}
                onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
                placeholder="Enter adjustment amount"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdjustment(prev => prev + 50)}
              >
                <Plus className="h-4 w-4" />
                50
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdjustment(prev => prev + 10)}
              >
                <Plus className="h-4 w-4" />
                10
              </Button>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Positive numbers add coins, negative numbers deduct coins
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Reason for Adjustment *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for this coin adjustment (required for audit trail)"
              className="mt-1"
              rows={3}
            />
          </div>

          {wouldGoNegative && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div className="text-sm text-destructive">
                Warning: This adjustment would result in a negative balance, which is not allowed.
              </div>
            </div>
          )}

          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button
                disabled={adjustment === 0 || !reason.trim() || wouldGoNegative || loading}
                className="w-full"
              >
                {loading ? 'Processing...' : 'Apply Coin Adjustment'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Coin Adjustment</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to {isDeduction ? 'deduct' : 'add'}{' '}
                  <strong>{Math.abs(adjustment)} coins</strong> {isDeduction ? 'from' : 'to'} this user's account?
                  <br />
                  <br />
                  <strong>Current Balance:</strong> {currentBalance} coins
                  <br />
                  <strong>New Balance:</strong> {newBalance} coins
                  <br />
                  <strong>Reason:</strong> {reason}
                  <br />
                  <br />
                  This action will be logged in the audit trail and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit}>
                  Confirm Adjustment
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};