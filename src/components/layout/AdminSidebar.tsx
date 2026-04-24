import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, Truck, Package, Warehouse, CreditCard,
  Receipt, UserCog, BarChart3, Settings, FileText, CalendarCheck,
  ChevronLeft, ChevronRight, Droplets, MapPin, Wallet, TrendingDown, Undo2
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Customers', path: '/admin/customers', icon: Users },
  { label: 'Deliveries', path: '/admin/deliveries', icon: Truck },
  { label: 'Products', path: '/admin/products', icon: Package },
  { label: 'Routes & Areas', path: '/admin/routes', icon: MapPin },
  { label: 'Inventory', path: '/admin/inventory', icon: Warehouse },
  { label: 'Billing', path: '/admin/billing', icon: CreditCard },
  { label: 'Payments', path: '/admin/payments', icon: Receipt },
  { label: 'Wallets', path: '/admin/wallets', icon: Wallet },
  { label: 'Expenses', path: '/admin/expenses', icon: TrendingDown },
  { label: 'Returns & Damages', path: '/admin/returns-damages', icon: Undo2 },
  { label: 'Employees', path: '/admin/employees', icon: UserCog },
  { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
  { label: 'Daily Closing', path: '/admin/daily-closing', icon: CalendarCheck },
  { label: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
  { label: 'Settings', path: '/admin/settings', icon: Settings, roles: ['super_admin', 'admin'] },
];

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const filteredItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || '');
  });

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-sidebar flex flex-col border-r border-sidebar-border z-30 transition-all duration-200",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
        <div className="w-8 h-8 rounded-md bg-sidebar-accent flex items-center justify-center shrink-0">
          <Droplets className="w-5 h-5 text-sidebar-primary" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-semibold text-sidebar-foreground truncate">Water Distribution</h1>
            <p className="text-[10px] text-sidebar-muted truncate">Management System</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {filteredItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "nav-item",
              isActive(item.path) ? "nav-item-active" : "nav-item-inactive"
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
