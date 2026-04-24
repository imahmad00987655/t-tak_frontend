import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import AdminLayout from "@/components/layout/AdminLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import CustomersPage from "@/pages/admin/Customers";
import CustomerDetail from "@/pages/admin/CustomerDetail";
import DeliveriesPage from "@/pages/admin/Deliveries";
import ProductsPage from "@/pages/admin/Products";
import EmployeesPage from "@/pages/admin/Employees";
import InventoryPage from "@/pages/admin/Inventory";
import PaymentsPage from "@/pages/admin/Payments";
import ExpensesPage from "@/pages/admin/Expenses";
import RoutesPage from "@/pages/admin/Routes";
import WalletsPage from "@/pages/admin/Wallets";
import ReportsPage from "@/pages/admin/Reports";
import DailyClosingPage from "@/pages/admin/DailyClosing";
import BillingPage from "@/pages/admin/Billing";
import AuditLogsPage from "@/pages/admin/AuditLogs";
import SettingsPage from "@/pages/admin/Settings";
import ReturnsDamagesPage from "@/pages/admin/ReturnsDamages";

import WorkerDashboard from "@/pages/worker/WorkerDashboard";
import QRScanPage from "@/pages/worker/QRScan";
import QuickDeliverPage from "@/pages/worker/QuickDeliver";

import ClientDashboard from "@/pages/client/ClientDashboard";

import LoginPage from "@/pages/auth/Login";
import NotFound from "@/pages/NotFound";
import PublicCustomerCard from "@/pages/public/PublicCustomerCard";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Routes>
      <Route path="/card/:token" element={<PublicCustomerCard />} />
      <Route path="*" element={<AuthenticatedAppRoutes />} />
    </Routes>
  );
}

function AuthenticatedAppRoutes() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Route based on role
  if (user?.role === 'field_worker') {
    return (
      <Routes>
        <Route path="/worker" element={<WorkerDashboard />} />
        <Route path="/worker/scan" element={<QRScanPage />} />
        <Route path="/worker/quick-deliver/:customerId" element={<QuickDeliverPage />} />
        <Route path="*" element={<Navigate to="/worker" replace />} />
      </Routes>
    );
  }

  if (user?.role === 'client') {
    return (
      <Routes>
        <Route path="/client" element={<ClientDashboard />} />
        <Route path="*" element={<Navigate to="/client" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="deliveries" element={<DeliveriesPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="wallets" element={<WalletsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="daily-closing" element={<DailyClosingPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="returns-damages" element={<ReturnsDamagesPage />} />
      </Route>
      <Route path="/worker" element={<WorkerDashboard />} />
      <Route path="/worker/scan" element={<QRScanPage />} />
      <Route path="/worker/quick-deliver/:customerId" element={<QuickDeliverPage />} />
      <Route path="/client" element={<ClientDashboard />} />
      <Route path="/login" element={<Navigate to="/admin" replace />} />
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
