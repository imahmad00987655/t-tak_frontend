import KPICard from '@/components/shared/KPICard';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { fetchAdminDashboard } from '@/lib/dashboardApi';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Truck,
  Clock,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Wallet,
  Package,
} from 'lucide-react';

export default function AdminDashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: fetchAdminDashboard,
  });

  const s = data?.summary;
  const todayList = data?.todayDeliveries ?? [];
  const recentExpenses = data?.recentExpenses ?? [];

  const summaryRows = s
    ? [
        { label: 'Completed', value: s.completedDeliveries, total: s.todayDeliveries, color: 'bg-accent' },
        { label: 'Pending', value: s.pendingDeliveries, total: s.todayDeliveries, color: 'bg-warning' },
        { label: 'In Progress', value: s.inProgressDeliveries, total: s.todayDeliveries, color: 'bg-info' },
        { label: 'Failed', value: s.failedDeliveries, total: s.todayDeliveries, color: 'bg-destructive' },
      ]
    : [];

  return (
    <div>
      <PageHeader title="Dashboard" description="Business overview for today" />

      {isError && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">Could not load dashboard</p>
          <p className="text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'Unknown API error'}
          </p>
        </div>
      )}

      {isLoading || !s ? (
        <div className="text-sm text-muted-foreground py-8">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard
              title="Total Customers"
              value={s.totalCustomers}
              subtitle={`${s.activeCustomers} active`}
              icon={Users}
            />
            <KPICard
              title="Today's Deliveries"
              value={s.todayDeliveries}
              subtitle={`${s.completedDeliveries} completed`}
              icon={Truck}
              variant="info"
            />
            <KPICard
              title="Today's Revenue"
              value={`Rs ${s.todayRevenue.toLocaleString()}`}
              icon={DollarSign}
              variant="accent"
            />
            <KPICard
              title="Monthly Revenue"
              value={`Rs ${s.monthlyRevenue.toLocaleString()}`}
              icon={TrendingUp}
              variant="accent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard title="Pending Deliveries" value={s.pendingDeliveries} icon={Clock} variant="warning" />
            <KPICard title="Failed Deliveries" value={s.failedDeliveries} icon={AlertTriangle} variant="destructive" />
            <KPICard
              title="Wallet Balances"
              value={`Rs ${s.totalWalletBalance.toLocaleString()}`}
              icon={Wallet}
            />
            <KPICard title="Low Stock Items" value={s.lowStockItems} icon={Package} variant="warning" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-md">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold">Today's Deliveries</h3>
                <span className="text-xs text-muted-foreground">{s.todayDeliveries} total</span>
              </div>
              <div className="divide-y divide-border">
                {todayList.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-muted-foreground">No deliveries scheduled for today.</div>
                ) : (
                  todayList.map((d) => (
                    <div key={d.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{d.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.area} · {d.workerName}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">Rs {d.totalAmount.toLocaleString()}</span>
                        <StatusBadge status={d.status as Parameters<typeof StatusBadge>[0]['status']} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-md">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold">Recent Expenses</h3>
                <span className="text-xs text-muted-foreground">Last 3 entries</span>
              </div>
              <div className="divide-y divide-border">
                {recentExpenses.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-muted-foreground">No expenses recorded yet.</div>
                ) : (
                  recentExpenses.map((e) => (
                    <div key={e.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{e.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.category} · {e.date}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-destructive">
                        Rs {e.amount.toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-md">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold">Delivery Summary</h3>
              </div>
              <div className="p-4 space-y-3">
                {summaryRows.map((item) => {
                  const pct = item.total > 0 ? (item.value / item.total) * 100 : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">
                          {item.value}/{item.total}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card border border-border rounded-md">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold">Financial Overview</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Outstanding Dues</span>
                  <span className="text-lg font-semibold text-destructive">
                    Rs {s.outstandingDues.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Wallet Balance</span>
                  <span className="text-lg font-semibold text-accent">
                    Rs {s.totalWalletBalance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Today's Revenue</span>
                  <span className="text-lg font-semibold">Rs {s.todayRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
