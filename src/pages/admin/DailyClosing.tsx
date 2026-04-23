import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { closeDay, fetchDailyClosingSummary } from '@/lib/operationsApi';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function DailyClosingPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['daily-closing-summary'],
    queryFn: () => fetchDailyClosingSummary(),
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
            <div className="flex justify-between"><span className="text-muted-foreground">Revenue</span><span className="font-semibold text-accent">Rs {Number(data?.revenue || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Expenses</span><span className="font-semibold text-destructive">Rs {Number(data?.expenses || 0).toLocaleString()}</span></div>
            <div className="flex justify-between border-t border-border pt-3"><span className="font-medium">Net</span><span className="font-semibold">Rs {Number(data?.net || 0).toLocaleString()}</span></div>
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
