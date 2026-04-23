import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login(email, password, selectedRole);
      if (selectedRole === 'field_worker') navigate('/worker');
      else if (selectedRole === 'client') navigate('/client');
      else navigate('/admin');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (role: UserRole) => {
    try {
      setLoading(true);
      await login('', '', role);
      if (role === 'field_worker') navigate('/worker');
      else if (role === 'client') navigate('/client');
      else navigate('/admin');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-4">
            <Droplets className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Water Distribution</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Email or Phone</label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@waterdist.pk or 03XX-XXXXXXX"
              className="w-full h-10 px-3 mt-1 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 px-3 mt-1 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <Button type="submit" className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6">
          <p className="text-xs text-muted-foreground text-center mb-3">Quick Demo Access</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['admin', 'Admin'],
              ['staff', 'Plant Staff'],
              ['field_worker', 'Field Worker'],
              ['client', 'Customer'],
            ] as [UserRole, string][]).map(([role, label]) => (
              <button
                key={role}
                onClick={() => quickLogin(role)}
                className="h-9 px-3 rounded-md border border-input bg-card text-xs font-medium hover:bg-muted transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
