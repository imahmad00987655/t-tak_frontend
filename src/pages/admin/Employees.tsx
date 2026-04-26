import { useState } from 'react';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEmployee, fetchEmployees, type EmployeeDto } from '@/lib/operationsApi';
import { updateEmployee } from '@/lib/operationsApi';
import { fetchEmployeeLookups } from '@/lib/routesApi';
import { useAuth } from '@/contexts/AuthContext';
import { fetchManagedUsers, updateManagedUserPassword, updateManagedUserStatus } from '@/lib/settingsApi';

const roleMap: Record<string, string> = { field_worker: 'Field Worker', staff: 'Plant Staff', admin: 'Admin' };

const employeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  role: z.enum(['field_worker', 'staff', 'admin']),
  assignedArea: z.string().optional(),
  assignedRoute: z.string().optional(),
  loginPhone: z.string().optional(),
  loginEmail: z.string().optional(),
  loginPassword: z.string().optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function EmployeesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<EmployeeDto | null>(null);
  const [editEmployee, setEditEmployee] = useState<EmployeeDto | null>(null);
  const { data: employees = [], isLoading, isError, error } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
  });
  const { data: lookups } = useQuery({
    queryKey: ['employee-lookups'],
    queryFn: fetchEmployeeLookups,
  });
  const { data: managedUsers = [] } = useQuery({
    queryKey: ['settings-users'],
    queryFn: fetchManagedUsers,
  });

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      role: 'field_worker',
      assignedArea: '',
      assignedRoute: '',
      loginPhone: '',
      loginEmail: '',
      loginPassword: '',
    },
  });

  const mutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      toast.success('Employee added successfully');
      setOpen(false);
      reset();
    },
    onError: (e: Error) => toast.error(e.message || 'Could not add employee'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateEmployee>[1] }) =>
      updateEmployee(id, { ...body, actor: user?.name || 'Admin' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee updated');
      setEditEmployee(null);
    },
    onError: (e: Error) => toast.error(e.message || 'Could not update employee'),
  });
  const setUserStatus = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'active' | 'inactive' }) =>
      updateManagedUserStatus(userId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings-users'] }),
  });
  const setUserPassword = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      updateManagedUserPassword(userId, password),
    onSuccess: () => toast.success('Password updated'),
    onError: (e: Error) => toast.error(e.message || 'Could not update password'),
  });

  const columns = [
    { key: 'name', label: 'Name', sortable: true, render: (e: EmployeeDto) => <span className="font-medium">{e.name}</span> },
    { key: 'phone', label: 'Phone' },
    { key: 'role', label: 'Role', render: (e: EmployeeDto) => <span className="text-xs">{roleMap[e.role] || e.role}</span> },
    { key: 'assignedArea', label: 'Area', render: (e: EmployeeDto) => e.assignedArea || '—' },
    { key: 'deliveriesCompleted', label: 'Deliveries', sortable: true },
    { key: 'totalSales', label: 'Total Sales', sortable: true, render: (e: EmployeeDto) => e.totalSales ? `Rs ${e.totalSales.toLocaleString()}` : '—' },
    { key: 'status', label: 'Status', render: (e: EmployeeDto) => <StatusBadge status={e.status} /> },
  ];

  const onSubmit = (values: EmployeeFormValues) => {
    mutation.mutate({
      name: values.name,
      phone: values.phone,
      email: values.email || undefined,
      role: values.role,
      assignedArea: values.assignedArea || undefined,
      assignedRoute: values.assignedRoute || undefined,
      loginPhone: values.loginPhone || undefined,
      loginEmail: values.loginEmail || undefined,
      loginPassword: values.loginPassword || undefined,
      actor: user?.name || 'Admin',
    });
  };

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Manage staff, field workers, and their performance"
        actions={<Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-9 px-4"><Plus className="w-4 h-4 mr-1.5" /> Add Employee</Button>}
      />
      {isError && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">Could not load employees</p>
          <p className="text-muted-foreground mt-1">{error instanceof Error ? error.message : 'Unknown API error'}</p>
        </div>
      )}
      {isLoading ? (
        <div className="rounded-md border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading employees...</div>
      ) : (
        <DataTable
          data={employees}
          columns={columns}
          searchKeys={['name', 'phone', 'assignedArea']}
          actions={(e: EmployeeDto) => (
            <div className="flex items-center gap-1">
              <Button type="button" size="sm" variant="outline" onClick={() => setViewEmployee(e)}>View</Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEditEmployee(e)}
              >
                Edit
              </Button>
            </div>
          )}
        />
      )}
      <div className="mt-6 bg-card border border-border rounded-md p-4 space-y-3">
        <h3 className="text-sm font-semibold">User Access (moved from Settings)</h3>
        {managedUsers.map((u) => (
          <div key={u.id} className="flex items-center justify-between p-3 rounded border border-border">
            <div>
              <p className="text-sm font-medium">{u.name}</p>
              <p className="text-xs text-muted-foreground">{u.phone} · {roleMap[u.role] || u.role}</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="password"
                placeholder="New password"
                className="h-8 w-[150px]"
                onKeyDown={(evt) => {
                  if (evt.key === 'Enter') {
                    const value = (evt.target as HTMLInputElement).value.trim();
                    if (!value) return;
                    setUserPassword.mutate({ userId: u.id, password: value });
                    (evt.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <Button
                type="button"
                variant={u.status === 'active' ? 'outline' : 'default'}
                size="sm"
                onClick={() =>
                  setUserStatus.mutate({
                    userId: u.id,
                    status: u.status === 'active' ? 'inactive' : 'active',
                  })
                }
              >
                {u.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>Enter the employee details and assign a role.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input placeholder="e.g. Ali Raza" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Phone *</Label>
                <Input placeholder="03XX-XXXXXXX" {...register('phone')} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="email@example.com" {...register('email')} />
              </div>
              <div className="space-y-1.5">
                <Label>Role *</Label>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="field_worker">Field Worker</SelectItem>
                        <SelectItem value="staff">Plant Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Assigned Area</Label>
                <Controller
                  control={control}
                  name="assignedArea"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
                      <SelectContent>
                        {(lookups?.areas ?? []).map((area) => (
                          <SelectItem key={area} value={area}>{area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Assigned Route</Label>
                <Controller
                  control={control}
                  name="assignedRoute"
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                      <SelectContent>
                        {(lookups?.routes ?? []).map((route) => (
                          <SelectItem key={route.id} value={route.name}>
                            {route.name} ({route.area})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="border border-border rounded-md p-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Employee Login (optional)</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Login Phone</Label>
                  <Input placeholder="03XX-XXXXXXX" {...register('loginPhone')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Login Email</Label>
                  <Input type="email" placeholder="Optional" {...register('loginEmail')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input type="password" placeholder="Set password" {...register('loginPassword')} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Add Employee'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!viewEmployee} onOpenChange={() => setViewEmployee(null)}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
            <DialogDescription>{viewEmployee?.name}</DialogDescription>
          </DialogHeader>
          {viewEmployee && (
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Phone:</span> {viewEmployee.phone}</div>
              <div><span className="text-muted-foreground">Role:</span> {roleMap[viewEmployee.role] || viewEmployee.role}</div>
              <div><span className="text-muted-foreground">Area:</span> {viewEmployee.assignedArea || '—'}</div>
              <div><span className="text-muted-foreground">Route:</span> {viewEmployee.assignedRoute || '—'}</div>
              <div><span className="text-muted-foreground">Status:</span> {viewEmployee.status}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!editEmployee} onOpenChange={() => setEditEmployee(null)}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update all employee and login fields.</DialogDescription>
          </DialogHeader>
          {editEmployee && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                updateMutation.mutate({
                  id: editEmployee.id,
                  body: {
                    name: String(fd.get('name') || ''),
                    phone: String(fd.get('phone') || ''),
                    email: String(fd.get('email') || ''),
                    role: String(fd.get('role') || 'field_worker') as 'field_worker' | 'staff' | 'admin',
                    status: String(fd.get('status') || 'active') as 'active' | 'inactive',
                    assignedArea: String(fd.get('assignedArea') || ''),
                    assignedRoute: String(fd.get('assignedRoute') || ''),
                    loginPhone: String(fd.get('loginPhone') || ''),
                    loginEmail: String(fd.get('loginEmail') || ''),
                    loginPassword: String(fd.get('loginPassword') || ''),
                  },
                });
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input name="name" defaultValue={editEmployee.name} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input name="phone" defaultValue={editEmployee.phone} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input name="email" type="email" defaultValue={editEmployee.email} />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <select
                    name="role"
                    defaultValue={editEmployee.role}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="field_worker">Field Worker</option>
                    <option value="staff">Plant Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Assigned Area</Label>
                  <select
                    name="assignedArea"
                    defaultValue={editEmployee.assignedArea || ''}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select area</option>
                    {(lookups?.areas ?? []).map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Assigned Route</Label>
                  <select
                    name="assignedRoute"
                    defaultValue={editEmployee.assignedRoute || ''}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select route</option>
                    {(lookups?.routes ?? []).map((route) => (
                      <option key={route.id} value={route.name}>
                        {route.name} ({route.area})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select
                  name="status"
                  defaultValue={editEmployee.status}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="border border-border rounded-md p-3 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Login (optional)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Login Phone</Label>
                    <Input name="loginPhone" placeholder="03XX-XXXXXXX" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Login Email</Label>
                    <Input name="loginEmail" type="email" placeholder="Optional" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>New Password</Label>
                    <Input name="loginPassword" type="password" placeholder="Leave blank to keep" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditEmployee(null)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Saving...' : 'Save Changes'}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
