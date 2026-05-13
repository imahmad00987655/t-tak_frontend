import { apiFetch } from './api';

export interface AdminDashboardSummaryDto {
  totalCustomers: number;
  activeCustomers: number;
  todayDeliveries: number;
  completedDeliveries: number;
  pendingDeliveries: number;
  inProgressDeliveries: number;
  failedDeliveries: number;
  todayRevenue: number;
  todayAdvanceCollected?: number;
  todayWalletDeduction?: number;
  todayOutstanding?: number;
  todayDeliveryCollected?: number;
  todayWalletRecharge?: number;
  todayCashCollected?: number;
  monthlyRevenue: number;
  outstandingDues: number;
  totalWalletBalance: number;
  lowStockItems: number;
}

export interface AdminDashboardDeliveryRow {
  id: string;
  customerName: string;
  area: string;
  workerName: string;
  totalAmount: number;
  status: string;
}

export interface AdminDashboardExpenseRow {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

export interface AdminDashboardDto {
  summary: AdminDashboardSummaryDto;
  todayDeliveries: AdminDashboardDeliveryRow[];
  recentExpenses: AdminDashboardExpenseRow[];
}

export async function fetchAdminDashboard(): Promise<AdminDashboardDto> {
  const json = await apiFetch<{ data: AdminDashboardDto }>('/api/dashboards/admin');
  return json.data;
}

export interface WorkerDashboardDto {
  deliveries: Array<{
    id: string;
    customerId: string;
    customerName: string;
    customerAddress: string;
    status: string;
    totalAmount: number;
    deliveryDate: string;
    deliveryTime?: string;
    periodStartDate?: string;
    periodEndDate?: string;
    advanceAmount?: number;
    items: Array<{ quantity: number; productName: string }>;
  }>;
  completed: number;
  pending: number;
  failed: number;
}

export interface ClientDashboardDto {
  customer: {
    id: string;
    customerId: string;
    name: string;
    phone: string;
    address: string;
    area: string;
    route: string;
    customerType: string;
    walletBalance: number;
  };
  deliveries: Array<{
    id: string;
    status: string;
    totalAmount: number;
    deliveryDate: string;
    deliveryTime?: string;
    items: Array<{ quantity: number; productName: string; total: number; unitPrice: number }>;
  }>;
  transactions: Array<{
    id: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    createdAt: string;
  }>;
}

export async function fetchWorkerDashboard(workerId: string): Promise<WorkerDashboardDto> {
  const json = await apiFetch<{ data: WorkerDashboardDto }>(`/api/dashboards/worker/${encodeURIComponent(workerId)}`);
  return json.data;
}

export async function fetchClientDashboard(customerId: string): Promise<ClientDashboardDto> {
  const json = await apiFetch<{ data: ClientDashboardDto }>(`/api/dashboards/client/${encodeURIComponent(customerId)}`);
  return json.data;
}
