import PageHeader from '@/components/shared/PageHeader';
import KPICard from '@/components/shared/KPICard';
import { BarChart3, TrendingUp, DollarSign, Truck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchReportsCharts, fetchReportsOverview } from '@/lib/operationsApi';
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

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
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
      </div>
      {isError && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">Could not load report overview</p>
          <p className="text-muted-foreground mt-1">{error instanceof Error ? error.message : 'Unknown API error'}</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Monthly Revenue" value={isLoading ? '...' : `Rs ${Number(data?.monthlyRevenue || 0).toLocaleString()}`} icon={DollarSign} variant="accent" />
        <KPICard title="Total Deliveries" value={isLoading ? '...' : Number(data?.totalDeliveries || 0).toLocaleString()} subtitle="This month" icon={Truck} variant="info" />
        <KPICard title="Outstanding Dues" value={isLoading ? '...' : `Rs ${Number(data?.outstandingDues || 0).toLocaleString()}`} icon={TrendingUp} variant="warning" />
        <KPICard title="Net Profit" value={isLoading ? '...' : `Rs ${Number(data?.netProfit || 0).toLocaleString()}`} subtitle="Est. this month" icon={BarChart3} variant="accent" />
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
          <h3 className="text-sm font-semibold mb-4">Delivery Volume</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData?.deliveryVolume ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="deliveries" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
