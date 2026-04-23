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
import { fetchEmployeeLookups } from '@/lib/routesApi';
import { useAuth } from '@/contexts/AuthContext';

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
  const { data: employees = [], isLoading, isError, error } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
  });
  const { data: lookups } = useQuery({
    queryKey: ['employee-lookups'],
    queryFn: fetchEmployeeLookups,
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
        <DataTable data={employees} columns={columns} searchKeys={['name', 'phone', 'assignedArea']} />
      )}

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
    </div>
  );
}
