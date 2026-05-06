import { apiFetch } from './api';
import type { UserRole } from '@/types';

export interface ExpenseDto {
  id: string;
  dbId: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

export interface EmployeeDto {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole | 'admin' | 'staff' | 'field_worker';
  status: 'active' | 'inactive';
  assignedArea: string;
  assignedRoute: string;
  joiningDate: string;
  deliveriesCompleted: number;
  failedDeliveries: number;
  totalSales: number;
  collectedPayments: number;
}

export interface ReportsOverviewDto {
  monthlyRevenue: number;
  totalDeliveries: number;
  outstandingDues: number;
  netProfit: number;
  monthlyExpenses: number;
  paymentBreakdown?: {
    cash: number;
    online: number;
    card: number;
  };
}

export interface ReportsChartsDto {
  revenueTrend: Array<{ day: string; revenue: number }>;
  deliveryVolume: Array<{ day: string; deliveries: number }>;
}

export interface InactiveCustomersReportDto {
  period: {
    previousMonth: string;
    currentMonth: string;
  };
  inactiveRegisteredCustomers: Array<{
    id: string;
    customerId: string;
    name: string;
    phone: string;
    area: string;
    lastOrderDate: string;
    purchaseFrequencyTrend: 'declining' | 'stable' | 'growing';
    lifetimeValue: number;
    tag: 'inactive' | 'at_risk' | 'active';
  }>;
  inactiveWalkIns: Array<{
    name: string;
    firstSeen: string;
    lastSeen: string;
    activeDays: number;
    totalAmount: number;
    daysSinceLast: number;
    tag: 'inactive' | 'lost_customer';
  }>;
}

export interface ReportsDetailedDto {
  customerReport: Array<{
    id: string;
    customerId: string;
    name: string;
    deliveries: number;
    revenue: number;
  }>;
  productReport: Array<{
    id: string;
    name: string;
    quantitySold: number;
    revenue: number;
  }>;
  workerPerformance: Array<{
    id: string;
    name: string;
    deliveries: number;
    revenue: number;
  }>;
  paymentMethods: Array<{
    method: string;
    totalAmount: number;
    totalCount: number;
  }>;
}

export interface DailyClosingSummaryDto {
  date: string;
  totalDeliveries: number;
  completed: number;
  failed: number;
  pending: number;
  revenue: number;
  expenses: number;
  net: number;
  isClosed: boolean;
  closedRecord: null | {
    id: string;
    closedBy: string;
    closedAt: string;
  };
}

export interface AuditLogDto {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface ExpenseCategoryDto {
  id: string;
  name: string;
}

export async function fetchExpenses(filters?: { from?: string; to?: string }): Promise<ExpenseDto[]> {
  const params = new URLSearchParams();
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  const q = params.toString() ? `?${params.toString()}` : '';
  const json = await apiFetch<{ data: ExpenseDto[] }>(`/api/expenses${q}`);
  return json.data;
}

export async function fetchExpenseCategories(): Promise<ExpenseCategoryDto[]> {
  const json = await apiFetch<{ data: ExpenseCategoryDto[] }>('/api/expenses/categories');
  return json.data;
}

export async function createExpenseCategory(name: string): Promise<ExpenseCategoryDto> {
  const json = await apiFetch<{ data: ExpenseCategoryDto }>('/api/expenses/categories', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return json.data;
}

export async function createExpense(body: {
  category: string;
  description: string;
  amount: number;
  date: string;
  actor?: string;
}) {
  const json = await apiFetch<{ data: unknown }>('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function fetchEmployees(): Promise<EmployeeDto[]> {
  const json = await apiFetch<{ data: EmployeeDto[] }>('/api/employees');
  return json.data;
}

export async function createEmployee(body: {
  name: string;
  phone: string;
  email?: string;
  role: 'field_worker' | 'staff' | 'admin';
  assignedArea?: string;
  assignedRoute?: string;
  loginPhone?: string;
  loginEmail?: string;
  loginPassword?: string;
  actor?: string;
}) {
  const json = await apiFetch<{ data: unknown }>('/api/employees', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function updateEmployee(
  id: string,
  body: Partial<{
    name: string;
    phone: string;
    email: string;
    role: 'field_worker' | 'staff' | 'admin';
    status: 'active' | 'inactive';
    assignedArea: string;
    assignedRoute: string;
    loginPhone: string;
    loginEmail: string;
    loginPassword: string;
    actor: string;
  }>
) {
  const json = await apiFetch<{ data: EmployeeDto }>(`/api/employees/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function fetchReportsOverview(filters?: { from?: string; to?: string }): Promise<ReportsOverviewDto> {
  const params = new URLSearchParams();
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  const q = params.toString() ? `?${params.toString()}` : '';
  const json = await apiFetch<{ data: ReportsOverviewDto }>(`/api/reports/overview${q}`);
  return json.data;
}

export async function fetchReportsCharts(filters?: { from?: string; to?: string }): Promise<ReportsChartsDto> {
  const params = new URLSearchParams();
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  const q = params.toString() ? `?${params.toString()}` : '';
  const json = await apiFetch<{ data: ReportsChartsDto }>(`/api/reports/charts${q}`);
  return json.data;
}

export async function fetchInactiveCustomersReport(filters?: {
  from?: string;
  to?: string;
  walkInGapDays?: number;
}): Promise<InactiveCustomersReportDto> {
  const params = new URLSearchParams();
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  if (filters?.walkInGapDays) params.set('walkInGapDays', String(filters.walkInGapDays));
  const q = params.toString() ? `?${params.toString()}` : '';
  const json = await apiFetch<{ data: InactiveCustomersReportDto }>(`/api/reports/inactive-customers${q}`);
  return json.data;
}

export async function fetchReportsDetailed(filters?: {
  from?: string;
  to?: string;
  customerId?: string;
  productId?: string;
  workerId?: string;
  paymentMethod?: string;
}): Promise<ReportsDetailedDto> {
  const params = new URLSearchParams();
  if (filters?.from) params.set('from', filters.from);
  if (filters?.to) params.set('to', filters.to);
  if (filters?.customerId) params.set('customerId', filters.customerId);
  if (filters?.productId) params.set('productId', filters.productId);
  if (filters?.workerId) params.set('workerId', filters.workerId);
  if (filters?.paymentMethod) params.set('paymentMethod', filters.paymentMethod);
  const q = params.toString() ? `?${params.toString()}` : '';
  const json = await apiFetch<{ data: ReportsDetailedDto }>(`/api/reports/details${q}`);
  return json.data;
}

export async function fetchDailyClosingSummary(date?: string): Promise<DailyClosingSummaryDto> {
  const q = date ? `?date=${encodeURIComponent(date)}` : '';
  const json = await apiFetch<{ data: DailyClosingSummaryDto }>(`/api/daily-closing/today${q}`);
  return json.data;
}

export async function closeDay(body: { date?: string; actor?: string }): Promise<DailyClosingSummaryDto> {
  const json = await apiFetch<{ data: DailyClosingSummaryDto }>('/api/daily-closing/close', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return json.data;
}

export async function fetchAuditLogs(limit = 100): Promise<AuditLogDto[]> {
  const json = await apiFetch<{ data: AuditLogDto[] }>(`/api/audit-logs?limit=${limit}`);
  return json.data;
}
