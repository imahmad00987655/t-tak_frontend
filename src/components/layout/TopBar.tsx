import { useAuth } from '@/contexts/AuthContext';
import { Bell, Search, LogOut, User, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { fetchAuditLogs } from '@/lib/operationsApi';

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  staff: 'Plant Staff',
  field_worker: 'Field Worker',
  client: 'Customer',
};

export default function TopBar() {
  const { user, logout } = useAuth();
  const { data: notifications = [] } = useQuery({
    queryKey: ['topbar-notifications'],
    queryFn: () => fetchAuditLogs(10),
  });

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customers, deliveries..."
            className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs px-2 py-1 rounded border border-input bg-muted text-muted-foreground hidden sm:inline-flex">
          {roleLabels[user?.role || 'admin'] || 'User'}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger className="relative p-2 rounded-md hover:bg-muted transition-colors">
            <Bell className="w-4 h-4 text-muted-foreground" />
            {notifications.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <DropdownMenuItem className="text-xs text-muted-foreground">No notifications</DropdownMenuItem>
            ) : (
              notifications.slice(0, 6).map((n) => (
                <DropdownMenuItem key={n.id} className="flex flex-col items-start py-2">
                  <span className="text-xs font-medium">{n.action}</span>
                  <span className="text-[11px] text-muted-foreground">{n.details || n.timestamp}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-xs">{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-xs text-destructive">
              <LogOut className="w-3 h-3 mr-2" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
