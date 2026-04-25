import { useState } from 'react';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
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
import { createRoute, fetchRouteLookups, fetchRoutes, type RouteDto } from '@/lib/routesApi';

export default function RoutesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: routes = [], isLoading, isError, error } = useQuery({
    queryKey: ['routes'],
    queryFn: fetchRoutes,
  });
  const { data: lookups } = useQuery({
    queryKey: ['route-lookups'],
    queryFn: fetchRouteLookups,
  });

  const routeSchema = z.object({
    name: z.string().min(1, 'Route name is required'),
    area: z.string().min(1, 'Area is required'),
    zone: z.string().optional(),
    workerId: z.string().optional(),
  });
  type RouteFormValues = z.infer<typeof routeSchema>;

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      name: '',
      area: '',
      zone: '',
      workerId: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: RouteFormValues) => createRoute({
      name: values.name,
      area: values.area,
      zone: values.zone || undefined,
      workerIds: values.workerId ? [values.workerId] : [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast.success('Route added successfully');
      setOpen(false);
      reset();
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to add route'),
  });

  const columns = [
    { key: 'name', label: 'Route', sortable: true, render: (r: RouteDto) => <span className="font-medium">{r.name}</span> },
    { key: 'area', label: 'Area', sortable: true },
    { key: 'zone', label: 'Zone', sortable: true, render: (r: RouteDto) => r.zone || '—' },
    { key: 'customerCount', label: 'Customers', sortable: true },
    { key: 'assignedWorkers', label: 'Workers', render: (r: RouteDto) => {
      return <span className="text-xs">{r.workerNames.length ? r.workerNames.join(', ') : '-'}</span>;
    }},
  ];

  const onSubmit = (values: RouteFormValues) => {
    createMutation.mutate(values);
  };

  return (
    <div>
      <PageHeader
        title="Routes & Areas"
        description="Manage delivery routes and area assignments"
        actions={<Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-9 px-4"><Plus className="w-4 h-4 mr-1.5" /> Add Route</Button>}
      />
      {isError && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">Could not load routes</p>
          <p className="text-muted-foreground mt-1">{error instanceof Error ? error.message : 'Unknown API error'}</p>
        </div>
      )}
      {isLoading ? (
        <div className="rounded-md border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading routes...</div>
      ) : (
        <DataTable data={routes} columns={columns} searchKeys={['name', 'area']} />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Add New Route</DialogTitle>
            <DialogDescription>Create a new delivery route and assign workers.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Route Name *</Label>
                <Input placeholder="e.g. Route F1" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Area *</Label>
                <Input placeholder="e.g. Garden Town" {...register('area')} />
                {errors.area && <p className="text-xs text-destructive">{errors.area.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Zone</Label>
                <Input placeholder="e.g. Central" {...register('zone')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Assign Worker</Label>
              <Controller
                control={control}
                name="workerId"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
                    <SelectContent>
                      {(lookups?.workers ?? []).map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Saving...' : 'Add Route'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
