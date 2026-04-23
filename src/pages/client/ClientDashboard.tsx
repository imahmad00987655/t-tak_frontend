import { useAuth } from '@/contexts/AuthContext';
import { Droplets, LogOut, Truck, Wallet, FileText, User } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import { useQuery } from '@tanstack/react-query';
import { fetchClientDashboard } from '@/lib/dashboardApi';

function resolveCustomerId(userId?: string) {
  if (!userId) return '';
  const m = userId.match(/(\d+)$/);
  return m ? m[1] : '';
}

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const customerId = user?.customerId || resolveCustomerId(user?.id);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['client-dashboard', customerId],
    queryFn: () => fetchClientDashboard(customerId),
    enabled: !!customerId,
  });

  const customer = data?.customer;
  const deliveries = data?.deliveries ?? [];
  const transactions = data?.transactions ?? [];

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
        <p className="text-xs mt-1 opacity-80">Welcome, {customer?.name || user?.name}</p>
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-accent" />
            <span className="text-sm font-semibold">Prepaid Balance</span>
          </div>
          <p className="text-3xl font-semibold text-accent">Rs {Number(customer?.walletBalance || 0).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{customer?.customerId || '—'} · {customer?.area || '—'}</p>
        </div>

        {isError && (
          <div className="text-sm text-destructive">Could not load dashboard data.</div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <Truck className="w-5 h-5 text-info mx-auto mb-1" />
            <p className="text-xl font-semibold">{isLoading ? '...' : deliveries.length}</p>
            <p className="text-xs text-muted-foreground">Deliveries</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <FileText className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-semibold">{isLoading ? '...' : transactions.length}</p>
            <p className="text-xs text-muted-foreground">Transactions</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Recent Deliveries</h3>
          <div className="space-y-2">
            {deliveries.map((d) => (
              <div key={d.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-xs">{d.id}</span>
                  <StatusBadge status={d.status as any} />
                </div>
                <p className="text-xs text-muted-foreground">{d.deliveryDate} {d.deliveryTime && `· ${d.deliveryTime}`}</p>
                {d.items.map((item, i) => (
                  <div key={i} className="text-xs flex justify-between mt-1">
                    <span>{item.quantity}x {item.productName}</span>
                    <span>Rs {item.total}</span>
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-border flex justify-between text-sm font-medium">
                  <span>Total</span><span>Rs {d.totalAmount}</span>
                </div>
              </div>
            ))}
            {!isLoading && deliveries.length === 0 && <div className="text-sm text-muted-foreground">No deliveries yet.</div>}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Wallet History</h3>
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {transactions.map((t) => (
              <div key={t.id} className="px-4 py-3 flex justify-between items-center">
                <div>
                  <p className="text-xs">{t.description}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</p>
                </div>
                <span className={`text-sm font-medium ${t.type === 'credit' ? 'text-accent' : 'text-destructive'}`}>
                  {t.type === 'credit' ? '+' : '-'}Rs {t.amount}
                </span>
              </div>
            ))}
            {!isLoading && transactions.length === 0 && <div className="px-4 py-3 text-sm text-muted-foreground">No transactions yet.</div>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Profile</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span>{customer?.name || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{customer?.phone || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Address</span><span className="text-right max-w-[200px]">{customer?.address || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize">{customer?.customerType || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Route</span><span>{customer?.route || '—'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
