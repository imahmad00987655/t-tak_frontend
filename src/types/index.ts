export type UserRole = 'admin' | 'staff' | 'field_worker' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'inactive';
  employeeId?: string;
  customerId?: string;
  avatar?: string;
}

export interface Customer {
  id: string;
  customerId: string;
  name: string;
  phone: string;
  altPhone?: string;
  address: string;
  area: string;
  zone: string;
  route: string;
  customerType: 'residential' | 'commercial' | 'industrial';
  status: 'active' | 'inactive';
  joiningDate: string;
  walletBalance: number;
  notes?: string;
  assignedWorker?: string;
  qrCode?: string;
  /** Server-issued token for public QR URL */
  qrToken?: string;
  /** Full URL encoded in QR (public customer card) */
  qrCardUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  unit: string;
  defaultPrice: number;
  category: string;
  status: 'active' | 'inactive';
  stockQuantity: number;
}

export interface CustomerPricing {
  customerId: string;
  productId: string;
  customPrice: number;
}

export type DeliveryStatus = 'pending' | 'assigned' | 'in_progress' | 'delivered' | 'partially_delivered' | 'failed' | 'cancelled';

export interface DeliveryItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Delivery {
  id: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  area: string;
  workerId: string;
  workerName: string;
  status: DeliveryStatus;
  items: DeliveryItem[];
  totalAmount: number;
  walletDeduction: number;
  amountDue: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  deliveryDate: string;
  deliveryTime?: string;
  periodStartDate?: string;
  periodEndDate?: string;
  advanceAmount?: number;
  notes?: string;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  customerId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  referenceId?: string;
  createdAt: string;
  balanceAfter: number;
}

export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'online' | 'other';
  referenceId?: string;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  approvedBy?: string;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  assignedRoute?: string;
  assignedArea?: string;
  joiningDate: string;
  deliveriesCompleted: number;
  failedDeliveries: number;
  totalSales: number;
  collectedPayments: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  lastRestocked: string;
  unitCost: number;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'stock_in' | 'stock_out' | 'damage' | 'loss';
  quantity: number;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface Route {
  id: string;
  name: string;
  area: string;
  assignedWorkers: string[];
  customerCount: number;
}

export interface DailyClosing {
  date: string;
  totalDeliveries: number;
  totalRevenue: number;
  totalExpenses: number;
  walletRecharges: number;
  cashCollected: number;
  outstandingDues: number;
  closedBy?: string;
  status: 'open' | 'closed';
}
