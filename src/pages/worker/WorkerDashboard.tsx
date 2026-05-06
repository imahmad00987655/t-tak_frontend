import StatusBadge from '@/components/shared/StatusBadge';
import { Droplets, QrCode, CheckCircle, Clock, AlertTriangle, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchWorkerDashboard } from '@/lib/dashboardApi';

function resolveWorkerId(userId?: string) {
  if (!userId) return '';
  const m = userId.match(/(\d+)$/);
  return m ? m[1] : '';
}

export default function WorkerDashboard() {
  const { user, logout } = useAuth();
  const workerId = user?.employeeId || resolveWorkerId(user?.id);
  const { data, isLoading } = useQuery({
    queryKey: ['worker-dashboard', workerId],
    queryFn: () => fetchWorkerDashboard(workerId),
    enabled: !!workerId,
  });
  const myDeliveries = data?.deliveries ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5" />
            <span className="font-semibold text-sm">Water Distribution</span>
          </div>
          <button onClick={logout} className="p-2"><LogOut className="w-4 h-4" /></button>
        </div>
        <p className="text-xs mt-1 opacity-80">Welcome, {user?.name}</p>
      </header>

      <div className="p-4 space-y-4">
        <Link to="/worker/scan" className="flex items-center justify-center gap-3 bg-primary text-primary-foreground rounded-lg p-5 active:opacity-90">
          <QrCode className="w-6 h-6" />
          <span className="text-lg font-semibold">Scan QR & Deliver</span>
        </Link>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <CheckCircle className="w-5 h-5 text-accent mx-auto mb-1" />
            <p className="text-2xl font-semibold">{isLoading ? '...' : data?.completed || 0}</p>
            <p className="text-xs text-muted-foreground">Done</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <Clock className="w-5 h-5 text-warning mx-auto mb-1" />
            <p className="text-2xl font-semibold">{isLoading ? '...' : data?.pending || 0}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <AlertTriangle className="w-5 h-5 text-destructive mx-auto mb-1" />
            <p className="text-2xl font-semibold">{isLoading ? '...' : data?.failed || 0}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-3">Today's Deliveries</h2>
          <div className="space-y-2">
            {myDeliveries.map((d) => (
              <Link
                to={`/worker/scan?customerId=${encodeURIComponent(d.customerId)}&returnTo=${encodeURIComponent(
                  `/worker/quick-deliver/${d.customerId}?deliveryId=${encodeURIComponent(d.id)}`
                )}`}
                key={d.id}
                className="block bg-card border border-border rounded-lg p-4 active:bg-muted"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm">{d.customerName}</span>
                  <StatusBadge status={d.status as any} />
                </div>
                <p className="text-xs text-muted-foreground">{d.customerAddress}</p>
                {d.periodStartDate && d.periodEndDate && (
                  <p className="text-[11px] text-info mt-1">
                    Plan: {d.periodStartDate} to {d.periodEndDate}
                    {d.advanceAmount ? ` · Advance Rs ${d.advanceAmount}` : ''}
                  </p>
                )}
                <div className="flex justify-between mt-2 text-xs">
                  <span className="text-muted-foreground">{d.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}</span>
                  <span className="font-medium">Rs {d.totalAmount}</span>
                </div>
              </Link>
            ))}
            {!isLoading && myDeliveries.length === 0 && (
              <div className="text-sm text-muted-foreground">No deliveries assigned yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
