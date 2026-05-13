import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { closeDay, fetchDailyClosingSummary } from '@/lib/operationsApi';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export default function DailyClosingPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState('');
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['daily-closing-summary', selectedDate],
    queryFn: () => fetchDailyClosingSummary(selectedDate || undefined),
  });

  const closeMutation = useMutation({
    mutationFn: closeDay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-closing-summary'] });
      queryClient.invalidateQueries({ queryKey: ['reports-overview'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      toast.success('Day closed successfully');
    },
    onError: (e: Error) => toast.error(e.message || 'Could not close day'),
  });

  const onCloseDay = () => {
    closeMutation.mutate({
      date: data?.date,
      actor: user?.name || 'Admin',
    });
  };

  return (
    <div>
      <PageHeader title="Daily Closing" description={`Closing report for ${data?.date || 'today'}`} />
      <div className="mb-4 max-w-xs space-y-1">
        <Label>Select Date</Label>
        <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
      </div>
      {isError && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">Could not load closing summary</p>
          <p className="text-muted-foreground mt-1">{error instanceof Error ? error.message : 'Unknown API error'}</p>
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        <div className="bg-card border border-border rounded-md p-6 space-y-4">
          <h3 className="text-sm font-semibold">Day Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Deliveries</span><span className="font-medium">{isLoading ? '...' : data?.totalDeliveries || 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span className="font-medium text-accent">{isLoading ? '...' : data?.completed || 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Failed</span><span className="font-medium text-destructive">{isLoading ? '...' : data?.failed || 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pending</span><span className="font-medium text-warning">{isLoading ? '...' : data?.pending || 0}</span></div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-md p-6 space-y-4">
          <h3 className="text-sm font-semibold">Financial Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Gross Sales (Revenue)</span><span className="font-semibold">Rs {Number(data?.revenue || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Advance Collected (at delivery creation)</span><span className="font-semibold text-accent">Rs {Number(data?.advanceCollected || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cash at Runtime (worker collections)</span><span className="font-semibold text-accent">Rs {Number(data?.deliveryCollected || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Wallet Recharges</span><span className="font-semibold text-info">Rs {Number(data?.walletRecharge || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Wallet Deductions (on deliveries)</span><span className="font-semibold">Rs {Number(data?.walletDeduction || 0).toLocaleString()}</span></div>
            <div className="flex justify-between border-t border-border pt-3"><span className="font-medium">Total Cash Inflow</span><span className="font-semibold text-accent">Rs {Number(data?.cashCollected || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Outstanding (Today)</span><span className="font-semibold text-destructive">Rs {Number(data?.outstanding || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Expenses</span><span className="font-semibold text-destructive">Rs {Number(data?.expenses || 0).toLocaleString()}</span></div>
            <div className="flex justify-between border-t border-border pt-3"><span className="font-medium">Net (Revenue − Expenses)</span><span className="font-semibold">Rs {Number(data?.net || 0).toLocaleString()}</span></div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-md p-6 space-y-4">
          <h3 className="text-sm font-semibold">Payments by Method</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Cash</p>
              <p className="font-semibold text-accent mt-1">Rs {Number(data?.paymentBreakdown?.cash || 0).toLocaleString()}</p>
            </div>
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Online</p>
              <p className="font-semibold text-info mt-1">Rs {Number(data?.paymentBreakdown?.online || 0).toLocaleString()}</p>
            </div>
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Card</p>
              <p className="font-semibold mt-1">Rs {Number(data?.paymentBreakdown?.card || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full"
          onClick={onCloseDay}
          disabled={isLoading || !!data?.isClosed || closeMutation.isPending}
        >
          <Lock className="w-4 h-4 mr-2" />
          {data?.isClosed ? 'Day Already Closed' : closeMutation.isPending ? 'Closing...' : 'Close Day'}
        </Button>
      </div>
    </div>
  );
}
