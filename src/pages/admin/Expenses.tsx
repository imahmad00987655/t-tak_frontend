import { useState } from 'react';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createExpense, fetchExpenses, type ExpenseDto } from '@/lib/operationsApi';
import { createExpenseCategory, fetchExpenseCategories } from '@/lib/operationsApi';
import { useAuth } from '@/contexts/AuthContext';

const expenseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function ExpensesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const { data: expenses = [], isLoading, isError, error } = useQuery({
    queryKey: ['expenses', fromDate, toDate],
    queryFn: () => fetchExpenses({ from: fromDate || undefined, to: toDate || undefined }),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: fetchExpenseCategories,
  });

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: 'Fuel',
      amount: 0,
      description: '',
      date: new Date().toISOString().slice(0, 10),
    },
  });

  const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['reports-overview'] });
      queryClient.invalidateQueries({ queryKey: ['daily-closing-summary'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      toast.success('Expense recorded successfully');
      setOpen(false);
      reset({
        category: 'Fuel',
        amount: 0,
        description: '',
        date: new Date().toISOString().slice(0, 10),
      });
    },
    onError: (e: Error) => toast.error(e.message || 'Could not record expense'),
  });
  const createCategoryMutation = useMutation({
    mutationFn: createExpenseCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      toast.success('Category added');
      setNewCategory('');
    },
    onError: (e: Error) => toast.error(e.message || 'Could not add category'),
  });

  const columns = [
    { key: 'id', label: 'ID', render: (e: ExpenseDto) => <span className="font-mono text-xs">{e.id}</span> },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'description', label: 'Description', render: (e: ExpenseDto) => <span className="font-medium">{e.description}</span> },
    { key: 'amount', label: 'Amount', sortable: true, render: (e: ExpenseDto) => <span className="font-medium text-destructive">Rs {e.amount.toLocaleString()}</span> },
    { key: 'date', label: 'Date', sortable: true },
  ];

  const onSubmit = (values: ExpenseFormValues) => {
    createMutation.mutate({
      category: values.category,
      amount: values.amount,
      description: values.description,
      date: values.date,
      actor: user?.name || 'Admin',
    });
  };

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Track business expenses and operational costs"
        actions={<Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm h-9 px-4"><Plus className="w-4 h-4 mr-1.5" /> Add Expense</Button>}
      />
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>From</Label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>To</Label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
      </div>

      {isError && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">Could not load expenses</p>
          <p className="text-muted-foreground mt-1">{error instanceof Error ? error.message : 'Unknown API error'}</p>
        </div>
      )}
      {isLoading ? (
        <div className="rounded-md border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading expenses...</div>
      ) : (
        <DataTable data={expenses} columns={columns} searchKeys={['description', 'category']} />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Record New Expense</DialogTitle>
            <DialogDescription>Log a business expense with details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
                <div className="flex gap-2 pt-1">
                  <Input
                    placeholder="New category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => createCategoryMutation.mutate(newCategory)}
                    disabled={createCategoryMutation.isPending || !newCategory.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Amount (Rs) *</Label>
                <Input type="number" placeholder="0" min="1" step="0.01" {...register('amount', { valueAsNumber: true })} />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Textarea placeholder="What was the expense for?" className="resize-none" rows={2} {...register('description')} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" {...register('date')} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Saving...' : 'Record Expense'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
