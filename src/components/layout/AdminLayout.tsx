import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import TopBar from './TopBar';
import { useState } from 'react';

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div className={`${collapsed ? 'md:ml-16' : 'md:ml-60'} ml-0 flex flex-col min-h-screen transition-all duration-200`}>
        <TopBar />
        <main className="flex-1 p-3 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
