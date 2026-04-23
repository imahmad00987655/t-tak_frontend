import { Customer, Product, Delivery, Employee, InventoryItem, Payment, Expense, Route, WalletTransaction, InventoryTransaction } from '@/types';

export const mockCustomers: Customer[] = [
  { id: '1', customerId: 'WD-1001', name: 'Ahmad Hassan', phone: '0301-1234567', altPhone: '0321-7654321', address: 'House 12, Block A, Gulberg III', area: 'Gulberg', zone: 'Central', route: 'Route A1', customerType: 'residential', status: 'active', joiningDate: '2024-01-15', walletBalance: 2500, notes: 'Prefers morning delivery', assignedWorker: '1' },
  { id: '2', customerId: 'WD-1002', name: 'Fatima Enterprises', phone: '0300-9876543', address: '45-B, Main Boulevard, DHA Phase 5', area: 'DHA', zone: 'South', route: 'Route B2', customerType: 'commercial', status: 'active', joiningDate: '2024-02-20', walletBalance: 8500, assignedWorker: '2' },
  { id: '3', customerId: 'WD-1003', name: 'Ali Raza', phone: '0333-4567890', address: 'Flat 6, Floor 3, Johar Town', area: 'Johar Town', zone: 'East', route: 'Route C1', customerType: 'residential', status: 'active', joiningDate: '2024-03-10', walletBalance: 500, assignedWorker: '1' },
  { id: '4', customerId: 'WD-1004', name: 'Karachi Beverages', phone: '0312-5551234', address: 'Plot 22, Industrial Area, Kot Lakhpat', area: 'Kot Lakhpat', zone: 'West', route: 'Route D1', customerType: 'industrial', status: 'active', joiningDate: '2023-11-01', walletBalance: 15000, assignedWorker: '3' },
  { id: '5', customerId: 'WD-1005', name: 'Zainab Bibi', phone: '0345-6789012', address: 'House 78, Street 5, Model Town', area: 'Model Town', zone: 'North', route: 'Route A2', customerType: 'residential', status: 'inactive', joiningDate: '2024-01-25', walletBalance: 0, notes: 'Account suspended - unpaid dues' },
  { id: '6', customerId: 'WD-1006', name: 'Usman Traders', phone: '0322-3334455', address: '12-C, Liberty Market', area: 'Gulberg', zone: 'Central', route: 'Route A1', customerType: 'commercial', status: 'active', joiningDate: '2024-04-15', walletBalance: 3200, assignedWorker: '1' },
  { id: '7', customerId: 'WD-1007', name: 'Hina Perfumes', phone: '0311-2223344', address: '88, Anarkali Bazaar', area: 'Old City', zone: 'Central', route: 'Route E1', customerType: 'commercial', status: 'active', joiningDate: '2024-05-01', walletBalance: 1800, assignedWorker: '2' },
  { id: '8', customerId: 'WD-1008', name: 'Bilal Ahmed', phone: '0300-1112233', address: 'House 34, Wapda Town', area: 'Wapda Town', zone: 'South', route: 'Route B1', customerType: 'residential', status: 'active', joiningDate: '2024-06-12', walletBalance: 4000, assignedWorker: '3' },
];

export const mockProducts: Product[] = [
  { id: '1', name: '19L Water Can', description: 'Standard 19 liter filtered water can', unit: 'can', defaultPrice: 80, category: 'Water', status: 'active', stockQuantity: 450 },
  { id: '2', name: '10L Water Bottle', description: '10 liter filtered water bottle', unit: 'bottle', defaultPrice: 50, category: 'Water', status: 'active', stockQuantity: 300 },
  { id: '3', name: '1.5L Mineral Water', description: '1.5 liter mineral water bottle', unit: 'bottle', defaultPrice: 30, category: 'Water', status: 'active', stockQuantity: 1200 },
  { id: '4', name: '500ml Water Pack (12)', description: 'Pack of 12 x 500ml bottles', unit: 'pack', defaultPrice: 180, category: 'Water', status: 'active', stockQuantity: 200 },
  { id: '5', name: 'Empty Can Return', description: 'Empty 19L can collection', unit: 'can', defaultPrice: 0, category: 'Returns', status: 'active', stockQuantity: 0 },
];

export const mockDeliveries: Delivery[] = [
  { id: 'D-001', customerId: '1', customerName: 'Ahmad Hassan', customerAddress: 'House 12, Block A, Gulberg III', area: 'Gulberg', workerId: '1', workerName: 'Imran Khan', status: 'delivered', items: [{ productId: '1', productName: '19L Water Can', quantity: 3, unitPrice: 80, total: 240 }], totalAmount: 240, walletDeduction: 240, amountDue: 0, paymentStatus: 'paid', deliveryDate: '2026-04-08', deliveryTime: '09:15', createdAt: '2026-04-08T06:00:00Z' },
  { id: 'D-002', customerId: '2', customerName: 'Fatima Enterprises', customerAddress: '45-B, Main Boulevard, DHA Phase 5', area: 'DHA', workerId: '2', workerName: 'Tariq Mehmood', status: 'delivered', items: [{ productId: '1', productName: '19L Water Can', quantity: 10, unitPrice: 75, total: 750 }, { productId: '3', productName: '1.5L Mineral Water', quantity: 24, unitPrice: 25, total: 600 }], totalAmount: 1350, walletDeduction: 1350, amountDue: 0, paymentStatus: 'paid', deliveryDate: '2026-04-08', deliveryTime: '10:30', createdAt: '2026-04-08T06:00:00Z' },
  { id: 'D-003', customerId: '3', customerName: 'Ali Raza', customerAddress: 'Flat 6, Floor 3, Johar Town', area: 'Johar Town', workerId: '1', workerName: 'Imran Khan', status: 'pending', items: [{ productId: '1', productName: '19L Water Can', quantity: 2, unitPrice: 80, total: 160 }], totalAmount: 160, walletDeduction: 0, amountDue: 160, paymentStatus: 'unpaid', deliveryDate: '2026-04-08', createdAt: '2026-04-08T06:00:00Z' },
  { id: 'D-004', customerId: '4', customerName: 'Karachi Beverages', customerAddress: 'Plot 22, Industrial Area, Kot Lakhpat', area: 'Kot Lakhpat', workerId: '3', workerName: 'Naveed Akhtar', status: 'in_progress', items: [{ productId: '1', productName: '19L Water Can', quantity: 25, unitPrice: 70, total: 1750 }, { productId: '4', productName: '500ml Water Pack (12)', quantity: 10, unitPrice: 160, total: 1600 }], totalAmount: 3350, walletDeduction: 0, amountDue: 3350, paymentStatus: 'unpaid', deliveryDate: '2026-04-08', createdAt: '2026-04-08T06:00:00Z' },
  { id: 'D-005', customerId: '6', customerName: 'Usman Traders', customerAddress: '12-C, Liberty Market', area: 'Gulberg', workerId: '1', workerName: 'Imran Khan', status: 'assigned', items: [{ productId: '2', productName: '10L Water Bottle', quantity: 5, unitPrice: 50, total: 250 }], totalAmount: 250, walletDeduction: 0, amountDue: 250, paymentStatus: 'unpaid', deliveryDate: '2026-04-08', createdAt: '2026-04-08T06:00:00Z' },
  { id: 'D-006', customerId: '7', customerName: 'Hina Perfumes', customerAddress: '88, Anarkali Bazaar', area: 'Old City', workerId: '2', workerName: 'Tariq Mehmood', status: 'failed', items: [{ productId: '1', productName: '19L Water Can', quantity: 2, unitPrice: 80, total: 160 }], totalAmount: 160, walletDeduction: 0, amountDue: 0, paymentStatus: 'unpaid', deliveryDate: '2026-04-08', notes: 'Shop closed', createdAt: '2026-04-08T06:00:00Z' },
  { id: 'D-007', customerId: '8', customerName: 'Bilal Ahmed', customerAddress: 'House 34, Wapda Town', area: 'Wapda Town', workerId: '3', workerName: 'Naveed Akhtar', status: 'pending', items: [{ productId: '1', productName: '19L Water Can', quantity: 4, unitPrice: 80, total: 320 }], totalAmount: 320, walletDeduction: 0, amountDue: 320, paymentStatus: 'unpaid', deliveryDate: '2026-04-08', createdAt: '2026-04-08T06:00:00Z' },
];

export const mockEmployees: Employee[] = [
  { id: '1', name: 'Imran Khan', phone: '0301-1111111', email: 'imran@waterdist.pk', role: 'field_worker', status: 'active', assignedRoute: 'Route A1, Route A2', assignedArea: 'Gulberg, Model Town', joiningDate: '2023-06-01', deliveriesCompleted: 1245, failedDeliveries: 23, totalSales: 186750, collectedPayments: 152300 },
  { id: '2', name: 'Tariq Mehmood', phone: '0302-2222222', email: 'tariq@waterdist.pk', role: 'field_worker', status: 'active', assignedRoute: 'Route B2, Route E1', assignedArea: 'DHA, Old City', joiningDate: '2023-08-15', deliveriesCompleted: 987, failedDeliveries: 45, totalSales: 148050, collectedPayments: 128900 },
  { id: '3', name: 'Naveed Akhtar', phone: '0303-3333333', email: 'naveed@waterdist.pk', role: 'field_worker', status: 'active', assignedRoute: 'Route B1, Route D1', assignedArea: 'Wapda Town, Kot Lakhpat', joiningDate: '2024-01-10', deliveriesCompleted: 654, failedDeliveries: 12, totalSales: 98100, collectedPayments: 87500 },
  { id: '4', name: 'Saira Batool', phone: '0304-4444444', email: 'saira@waterdist.pk', role: 'staff', status: 'active', joiningDate: '2023-03-01', deliveriesCompleted: 0, failedDeliveries: 0, totalSales: 0, collectedPayments: 0 },
  { id: '5', name: 'Hassan Ali', phone: '0305-5555555', email: 'hassan@waterdist.pk', role: 'admin', status: 'active', joiningDate: '2022-12-01', deliveriesCompleted: 0, failedDeliveries: 0, totalSales: 0, collectedPayments: 0 },
];

export const mockInventory: InventoryItem[] = [
  { id: '1', name: '19L Water Cans', category: 'Containers', unit: 'pieces', currentStock: 450, minStockLevel: 100, lastRestocked: '2026-04-06', unitCost: 15 },
  { id: '2', name: '10L Water Bottles', category: 'Containers', unit: 'pieces', currentStock: 300, minStockLevel: 80, lastRestocked: '2026-04-05', unitCost: 10 },
  { id: '3', name: '1.5L Bottles', category: 'Bottles', unit: 'pieces', currentStock: 1200, minStockLevel: 200, lastRestocked: '2026-04-07', unitCost: 5 },
  { id: '4', name: '500ml Bottles', category: 'Bottles', unit: 'pieces', currentStock: 2400, minStockLevel: 500, lastRestocked: '2026-04-07', unitCost: 3 },
  { id: '5', name: 'Bottle Caps', category: 'Packaging', unit: 'pieces', currentStock: 5000, minStockLevel: 1000, lastRestocked: '2026-04-01', unitCost: 0.5 },
  { id: '6', name: 'Shrink Wrap Rolls', category: 'Packaging', unit: 'rolls', currentStock: 45, minStockLevel: 20, lastRestocked: '2026-03-28', unitCost: 250 },
  { id: '7', name: 'Filter Cartridges', category: 'Consumables', unit: 'pieces', currentStock: 12, minStockLevel: 10, lastRestocked: '2026-03-15', unitCost: 1500 },
  { id: '8', name: 'UV Lamps', category: 'Consumables', unit: 'pieces', currentStock: 4, minStockLevel: 3, lastRestocked: '2026-02-20', unitCost: 3500 },
];

export const mockPayments: Payment[] = [
  { id: 'P-001', customerId: '1', customerName: 'Ahmad Hassan', amount: 5000, method: 'cash', createdAt: '2026-04-07T14:00:00Z' },
  { id: 'P-002', customerId: '2', customerName: 'Fatima Enterprises', amount: 10000, method: 'bank_transfer', referenceId: 'TRX-8834', createdAt: '2026-04-06T10:00:00Z' },
  { id: 'P-003', customerId: '4', customerName: 'Karachi Beverages', amount: 20000, method: 'bank_transfer', referenceId: 'TRX-9921', createdAt: '2026-04-05T16:00:00Z' },
  { id: 'P-004', customerId: '8', customerName: 'Bilal Ahmed', amount: 4000, method: 'cash', createdAt: '2026-04-08T08:00:00Z' },
];

export const mockExpenses: Expense[] = [
  { id: 'E-001', category: 'Fuel', description: 'Delivery truck fuel - Route A & B', amount: 3500, date: '2026-04-08' },
  { id: 'E-002', category: 'Maintenance', description: 'Filter replacement - Plant Unit 2', amount: 12000, date: '2026-04-07' },
  { id: 'E-003', category: 'Utilities', description: 'Electricity bill - April', amount: 45000, date: '2026-04-05' },
  { id: 'E-004', category: 'Salaries', description: 'Staff salaries - March', amount: 180000, date: '2026-04-01' },
  { id: 'E-005', category: 'Packaging', description: 'Bottle caps and shrink wrap order', amount: 8500, date: '2026-04-03' },
];

export const mockRoutes: Route[] = [
  { id: '1', name: 'Route A1', area: 'Gulberg', assignedWorkers: ['1'], customerCount: 25 },
  { id: '2', name: 'Route A2', area: 'Model Town', assignedWorkers: ['1'], customerCount: 18 },
  { id: '3', name: 'Route B1', area: 'Wapda Town', assignedWorkers: ['3'], customerCount: 22 },
  { id: '4', name: 'Route B2', area: 'DHA', assignedWorkers: ['2'], customerCount: 15 },
  { id: '5', name: 'Route C1', area: 'Johar Town', assignedWorkers: ['1'], customerCount: 20 },
  { id: '6', name: 'Route D1', area: 'Kot Lakhpat', assignedWorkers: ['3'], customerCount: 8 },
  { id: '7', name: 'Route E1', area: 'Old City', assignedWorkers: ['2'], customerCount: 30 },
];

export const mockWalletTransactions: WalletTransaction[] = [
  { id: 'WT-001', customerId: '1', type: 'credit', amount: 5000, description: 'Wallet recharge - Cash', createdAt: '2026-04-07T14:00:00Z', balanceAfter: 5000 },
  { id: 'WT-002', customerId: '1', type: 'debit', amount: 240, description: 'Delivery D-001 - 3x 19L Water Can', referenceId: 'D-001', createdAt: '2026-04-08T09:15:00Z', balanceAfter: 2500 },
  { id: 'WT-003', customerId: '2', type: 'credit', amount: 10000, description: 'Wallet recharge - Bank transfer TRX-8834', createdAt: '2026-04-06T10:00:00Z', balanceAfter: 9850 },
  { id: 'WT-004', customerId: '2', type: 'debit', amount: 1350, description: 'Delivery D-002 - 10x 19L Can + 24x 1.5L', referenceId: 'D-002', createdAt: '2026-04-08T10:30:00Z', balanceAfter: 8500 },
];

export const mockInventoryTransactions: InventoryTransaction[] = [
  { id: 'IT-001', itemId: '1', itemName: '19L Water Cans', type: 'stock_in', quantity: 200, notes: 'New batch from supplier', createdAt: '2026-04-06T08:00:00Z', createdBy: 'Saira Batool' },
  { id: 'IT-002', itemId: '1', itemName: '19L Water Cans', type: 'stock_out', quantity: 40, notes: 'Daily deliveries', createdAt: '2026-04-08T07:00:00Z', createdBy: 'System' },
  { id: 'IT-003', itemId: '7', itemName: 'Filter Cartridges', type: 'stock_out', quantity: 2, notes: 'Replaced in Plant Unit 2', createdAt: '2026-04-07T11:00:00Z', createdBy: 'Saira Batool' },
  { id: 'IT-004', itemId: '3', itemName: '1.5L Bottles', type: 'damage', quantity: 15, notes: 'Damaged during transport', createdAt: '2026-04-07T16:00:00Z', createdBy: 'Naveed Akhtar' },
];

export const dashboardStats = {
  totalCustomers: 8,
  activeCustomers: 7,
  todayDeliveries: 7,
  completedDeliveries: 2,
  pendingDeliveries: 2,
  inProgressDeliveries: 1,
  failedDeliveries: 1,
  todayRevenue: 1590,
  monthlyRevenue: 432900,
  totalWalletBalance: 35500,
  outstandingDues: 4080,
  lowStockItems: 2,
};
