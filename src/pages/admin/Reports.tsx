import PageHeader from '@/components/shared/PageHeader';
import KPICard from '@/components/shared/KPICard';
import { BarChart3, TrendingUp, DollarSign, Truck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchInactiveCustomersReport, fetchReportsCharts, fetchReportsDetailed, fetchReportsOverview } from '@/lib/operationsApi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { fetchDeliveryLookups } from '@/lib/deliveriesApi';

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [walkInGapDays, setWalkInGapDays] = useState(10);
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const setQuickRange = (mode: 'day' | 'week' | 'month') => {
    const now = new Date();
    const end = now.toISOString().slice(0, 10);
    const start = new Date(now);
    if (mode === 'day') {
      setFromDate(end);
      setToDate(end);
      return;
    }
    if (mode === 'week') start.setDate(now.getDate() - 6);
    if (mode === 'month') start.setDate(now.getDate() - 29);
    setFromDate(start.toISOString().slice(0, 10));
    setToDate(end);
  };
  const filters = useMemo(
    () => ({ from: fromDate || undefined, to: toDate || undefined }),
    [fromDate, toDate]
  );
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['reports-overview', filters.from, filters.to],
    queryFn: () => fetchReportsOverview(filters),
  });
  const { data: chartData } = useQuery({
    queryKey: ['reports-charts', filters.from, filters.to],
    queryFn: () => fetchReportsCharts(filters),
  });
  const { data: inactiveData, isFetching: inactiveLoading } = useQuery({
    queryKey: ['reports-inactive-customers', filters.from, filters.to, walkInGapDays],
    queryFn: () => fetchInactiveCustomersReport({ ...filters, walkInGapDays }),
  });
  const { data: lookups } = useQuery({
    queryKey: ['delivery-lookups'],
    queryFn: fetchDeliveryLookups,
  });
  const { data: detailsData } = useQuery({
    queryKey: ['reports-details', filters.from, filters.to, customerId, productId, workerId, paymentMethod],
    queryFn: () => fetchReportsDetailed({
      ...filters,
      customerId: customerId || undefined,
      productId: productId || undefined,
      workerId: workerId || undefined,
      paymentMethod: paymentMethod || undefined,
    }),
  });

  const canExport = !!fromDate && !!toDate;

  const exportRows = useMemo(() => {
    const revenue = chartData?.revenueTrend ?? [];
    const volume = chartData?.deliveryVolume ?? [];
    return revenue.map((r) => {
      const vol = volume.find((v) => v.day === r.day);
      return {
        Date: r.day,
        Revenue: r.revenue,
        Delivered19L: vol?.delivered19L ?? 0,
        Delivered15L: vol?.delivered15L ?? 0,
        Delivered500ml: vol?.delivered500ml ?? 0,
      };
    });
  }, [chartData]);

  const handleExport = (format: 'csv' | 'xlsx') => {
    if (!canExport) {
      toast.error('Select From and To date before export.');
      return;
    }
    if (!exportRows.length) {
      toast.error('No report data found for selected range.');
      return;
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Reports');
    const name = `reports-${fromDate}-to-${toDate}.${format}`;
    XLSX.writeFile(wb, name, { bookType: format });
  };

  return (
    <div>
      <PageHeader title="Reports" description="Financial and operational reports" />
      <div className="mb-4 flex flex-wrap gap-2 items-end">
        <div className="space-y-1">
          <Label>From</Label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>To</Label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <Button type="button" variant="outline" onClick={() => setQuickRange('day')}>Day</Button>
        <Button type="button" variant="outline" onClick={() => setQuickRange('week')}>Week</Button>
        <Button type="button" variant="outline" onClick={() => setQuickRange('month')}>Month</Button>
        <div className="space-y-1">
          <Label>Customer</Label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All</option>
            {(lookups?.customers ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Product</Label>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All</option>
            {(lookups?.products ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Worker</Label>
          <select value={workerId} onChange={(e) => setWorkerId(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All</option>
            {(lookups?.workers ?? []).map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Payment Method</Label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All</option>
            <option value="cash">Cash</option>
            <option value="online">Online</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="other">Other</option>
          </select>
        </div>
        <Button type="button" variant="outline" onClick={() => handleExport('csv')}>Export CSV</Button>
        <Button type="button" variant="outline" onClick={() => handleExport('xlsx')}>Export Excel</Button>
      </div>
      {isError && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">Could not load report overview</p>
          <p className="text-muted-foreground mt-1">{error instanceof Error ? error.message : 'Unknown API error'}</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Sales" value={isLoading ? '...' : `Rs ${Number(data?.monthlyRevenue || 0).toLocaleString()}`} icon={DollarSign} variant="accent" />
        <KPICard title="Total Expenses" value={isLoading ? '...' : `Rs ${Number(data?.monthlyExpenses || 0).toLocaleString()}`} subtitle="Selected range" icon={Truck} variant="info" />
        <KPICard title="Outstanding Dues" value={isLoading ? '...' : `Rs ${Number(data?.outstandingDues || 0).toLocaleString()}`} icon={TrendingUp} variant="warning" />
        <KPICard title="Total Profit" value={isLoading ? '...' : `Rs ${Number(data?.netProfit || 0).toLocaleString()}`} subtitle="Selected range" icon={BarChart3} variant="accent" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KPICard title="Cash Revenue" value={`Rs ${Number(data?.paymentBreakdown?.cash || 0).toLocaleString()}`} icon={DollarSign} />
        <KPICard title="Online Revenue" value={`Rs ${Number(data?.paymentBreakdown?.online || 0).toLocaleString()}`} icon={DollarSign} />
        <KPICard title="Card Revenue" value={`Rs ${Number(data?.paymentBreakdown?.card || 0).toLocaleString()}`} icon={DollarSign} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-md p-6">
          <h3 className="text-sm font-semibold mb-4">Revenue Trend</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData?.revenueTrend ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#1f6feb" fill="#1f6feb22" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card border border-border rounded-md p-6">
          <h3 className="text-sm font-semibold mb-4">Product-wise Delivery Volume</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData?.deliveryVolume ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="delivered19L" name="19L Delivered" fill="#16a34a" />
                <Bar dataKey="delivered15L" name="15L Delivered" fill="#1d4ed8" />
                <Bar dataKey="delivered500ml" name="500ml Delivered" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-md p-4">
          <h3 className="text-sm font-semibold mb-3">Customer-wise Report</h3>
          <div className="space-y-2 max-h-56 overflow-auto">
            {(detailsData?.customerReport ?? []).map((row) => (
              <div key={row.id} className="text-xs border border-border rounded p-2">
                <p className="font-medium">{row.name} ({row.customerId})</p>
                <p className="text-muted-foreground">Deliveries: {row.deliveries} · Revenue: Rs {row.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-md p-4">
          <h3 className="text-sm font-semibold mb-3">Product-wise Report</h3>
          <div className="space-y-2 max-h-56 overflow-auto">
            {(detailsData?.productReport ?? []).map((row) => (
              <div key={row.id} className="text-xs border border-border rounded p-2">
                <p className="font-medium">{row.name}</p>
                <p className="text-muted-foreground">Qty Sold: {row.quantitySold} · Revenue: Rs {row.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-md p-4">
          <h3 className="text-sm font-semibold mb-3">Field Worker Performance</h3>
          <div className="space-y-2 max-h-56 overflow-auto">
            {(detailsData?.workerPerformance ?? []).map((row) => (
              <div key={row.id} className="text-xs border border-border rounded p-2">
                <p className="font-medium">{row.name}</p>
                <p className="text-muted-foreground">Deliveries: {row.deliveries} · Revenue: Rs {row.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-md p-4">
          <h3 className="text-sm font-semibold mb-3">Payment Methods</h3>
          <div className="space-y-2 max-h-56 overflow-auto">
            {(detailsData?.paymentMethods ?? []).map((row) => (
              <div key={row.method} className="text-xs border border-border rounded p-2">
                <p className="font-medium capitalize">{row.method}</p>
                <p className="text-muted-foreground">Count: {row.totalCount} · Amount: Rs {row.totalAmount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 bg-card border border-border rounded-md p-6 space-y-4">
        <div className="flex flex-wrap items-end gap-3 justify-between">
          <div>
            <h3 className="text-sm font-semibold">Inactive / At-Risk Customers</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Customers active in previous month but inactive in current month, and walk-ins who stopped coming.
            </p>
          </div>
          <div className="space-y-1">
            <Label>Walk-in inactivity days</Label>
            <Input
              type="number"
              min="1"
              value={walkInGapDays}
              onChange={(e) => setWalkInGapDays(Math.max(1, Number(e.target.value) || 10))}
              className="w-40"
            />
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Period: {inactiveData?.period.previousMonth ?? '-'} → {inactiveData?.period.currentMonth ?? '-'}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border border-border rounded-md p-4">
            <h4 className="text-sm font-medium mb-2">
              Inactive Registered ({inactiveData?.inactiveRegisteredCustomers.length ?? 0})
            </h4>
            <div className="space-y-2 max-h-56 overflow-auto">
              {(inactiveData?.inactiveRegisteredCustomers ?? []).map((row) => (
                <div key={row.id} className="text-xs border border-border rounded px-2 py-1">
                  <p className="font-medium">{row.name} ({row.customerId})</p>
                  <p className="text-muted-foreground">{row.area} · {row.phone}</p>
                  <p className="text-muted-foreground">Last order: {row.lastOrderDate}</p>
                  <p className="text-muted-foreground">
                    Trend: {row.purchaseFrequencyTrend} · LTV: Rs {row.lifetimeValue.toLocaleString()} · Tag: {row.tag}
                  </p>
                </div>
              ))}
              {!inactiveLoading && !(inactiveData?.inactiveRegisteredCustomers?.length) && (
                <p className="text-xs text-muted-foreground">No inactive registered customers for selected range.</p>
              )}
            </div>
          </div>
          <div className="border border-border rounded-md p-4">
            <h4 className="text-sm font-medium mb-2">
              Inactive Walk-ins ({inactiveData?.inactiveWalkIns.length ?? 0})
            </h4>
            <div className="space-y-2 max-h-56 overflow-auto">
              {(inactiveData?.inactiveWalkIns ?? []).map((row) => (
                <div key={`${row.name}-${row.lastSeen}`} className="text-xs border border-border rounded px-2 py-1">
                  <p className="font-medium">{row.name}</p>
                  <p className="text-muted-foreground">Active days: {row.activeDays} · Last seen: {row.lastSeen}</p>
                  <p className="text-muted-foreground">
                    Days inactive: {row.daysSinceLast} · Total: Rs {row.totalAmount.toLocaleString()} · Tag: {row.tag}
                  </p>
                </div>
              ))}
              {!inactiveLoading && !(inactiveData?.inactiveWalkIns?.length) && (
                <p className="text-xs text-muted-foreground">No inactive walk-ins for selected range.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
