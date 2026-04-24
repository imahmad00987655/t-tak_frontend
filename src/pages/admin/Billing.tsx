import { useState } from 'react';
import DataTable from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import KPICard from '@/components/shared/KPICard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FileText, DollarSign, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchInvoices, recordPayment, type InvoiceDto } from '@/lib/financeApi';
import { fetchSettings } from '@/lib/settingsApi';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchDeliveryLookups } from '@/lib/deliveriesApi';
import { Minus, Plus } from 'lucide-react';

export default function BillingPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<InvoiceDto | null>(null);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInAmount, setWalkInAmount] = useState(0);
  const [walkInMethod, setWalkInMethod] = useState<'cash' | 'bank_transfer' | 'online' | 'other'>('cash');
  const [walkInNotes, setWalkInNotes] = useState('');
  const [walkInItems, setWalkInItems] = useState<Record<string, number>>({});
  const { data: invoices = [], isLoading, isError, error } = useQuery({
    queryKey: ['invoices'],
    queryFn: fetchInvoices,
  });
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });
  const { data: deliveryLookups } = useQuery({
    queryKey: ['delivery-lookups'],
    queryFn: fetchDeliveryLookups,
  });
  const walkInProducts = (deliveryLookups?.products ?? []).filter((p) => p.status === 'active' && p.defaultPrice > 0);
  const walkInMutation = useMutation({
    mutationFn: recordPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-lookups'] });
      toast.success('Walk-in transaction recorded');
      setWalkInOpen(false);
      setWalkInName('');
      setWalkInAmount(0);
      setWalkInMethod('cash');
      setWalkInNotes('');
      setWalkInItems({});
    },
    onError: (e: Error) => toast.error(e.message || 'Could not record walk-in payment'),
  });

  const totalBilled = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.walletDeduction, 0);
  const totalDue = invoices.reduce((s, i) => s + i.amountDue, 0);
  const walkInComputedTotal = Object.entries(walkInItems).reduce((sum, [productId, qty]) => {
    const product = walkInProducts.find((p) => p.id === productId);
    return sum + (product?.defaultPrice || 0) * qty;
  }, 0);

  const updateWalkInQty = (productId: string, delta: number) => {
    setWalkInItems((prev) => {
      const next = { ...prev };
      const value = (next[productId] || 0) + delta;
      if (value <= 0) delete next[productId];
      else next[productId] = value;
      return next;
    });
  };

  const columns = [
    { key: 'id', label: 'Invoice', render: (inv: InvoiceDto) => <span className="font-mono text-xs font-medium">{inv.id}</span> },
    { key: 'customerName', label: 'Customer', sortable: true, render: (inv: InvoiceDto) => <span className="font-medium">{inv.customerName}</span> },
    { key: 'area', label: 'Area', sortable: true },
    { key: 'totalAmount', label: 'Total', sortable: true, render: (inv: InvoiceDto) => `Rs ${inv.totalAmount.toLocaleString()}` },
    { key: 'walletDeduction', label: 'Paid', render: (inv: InvoiceDto) => <span className="text-accent">Rs {inv.walletDeduction.toLocaleString()}</span> },
    { key: 'amountDue', label: 'Due', render: (inv: InvoiceDto) => <span className={inv.amountDue > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>Rs {inv.amountDue.toLocaleString()}</span> },
    { key: 'paymentStatus', label: 'Status', render: (inv: InvoiceDto) => <StatusBadge status={inv.paymentStatus} /> },
    { key: 'date', label: 'Date', sortable: true },
  ];

  return (
    <div>
      <PageHeader
        title="Billing & Invoices"
        description="Invoice module: generated delivery bills. Payment entries are tracked separately in Payments."
        actions={<Button onClick={() => setWalkInOpen(true)}>Walk-in Billing</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Invoices" value={invoices.length} icon={FileText} />
        <KPICard title="Total Billed" value={`Rs ${totalBilled.toLocaleString()}`} icon={DollarSign} />
        <KPICard title="Total Collected" value={`Rs ${totalPaid.toLocaleString()}`} icon={CheckCircle} variant="accent" />
        <KPICard title="Outstanding Dues" value={`Rs ${totalDue.toLocaleString()}`} icon={AlertCircle} variant="destructive" />
      </div>

      {isError && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">Could not load invoices</p>
          <p className="text-muted-foreground mt-1">{error instanceof Error ? error.message : 'Unknown API error'}</p>
        </div>
      )}
      {isLoading ? (
        <div className="rounded-md border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading invoices...</div>
      ) : (
        <DataTable
          data={invoices}
          columns={columns}
          searchKeys={['id', 'customerName', 'area']}
          onRowClick={(inv) => setSelected(inv as InvoiceDto)}
          actions={(inv: InvoiceDto) => (
            <button className="p-1.5 rounded hover:bg-muted" title="View Invoice" onClick={(e) => { e.stopPropagation(); setSelected(inv); }}>
              <Eye className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        />
      )}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invoice {selected?.id}</DialogTitle>
            <DialogDescription>Delivery {selected?.deliveryId} • {selected?.date}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Customer:</span> <span className="font-medium">{selected.customerName}</span></div>
                <div><span className="text-muted-foreground">Area:</span> {selected.area}</div>
                <div><span className="text-muted-foreground">Worker:</span> {selected.workerName}</div>
                <div className="flex items-center gap-1.5"><span className="text-muted-foreground">Status:</span> <StatusBadge status={selected.paymentStatus} /></div>
              </div>
              <div className="border border-border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-muted/50"><th className="text-left p-2.5 text-xs font-medium text-muted-foreground">Item</th><th className="text-right p-2.5 text-xs font-medium text-muted-foreground">Qty</th><th className="text-right p-2.5 text-xs font-medium text-muted-foreground">Price</th><th className="text-right p-2.5 text-xs font-medium text-muted-foreground">Total</th></tr></thead>
                  <tbody>
                    {selected.items.map((item, idx: number) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="p-2.5">{item.productName}</td>
                        <td className="p-2.5 text-right">{item.quantity}</td>
                        <td className="p-2.5 text-right">Rs {item.unitPrice}</td>
                        <td className="p-2.5 text-right font-medium">Rs {item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-1.5 text-sm border-t border-border pt-3">
                <div className="flex justify-between"><span className="text-muted-foreground">Total Amount</span><span className="font-semibold">Rs {selected.totalAmount.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Wallet Deduction</span><span className="text-accent">- Rs {selected.walletDeduction.toLocaleString()}</span></div>
                <div className="flex justify-between font-semibold"><span>Amount Due</span><span className={selected.amountDue > 0 ? 'text-destructive' : ''}>Rs {selected.amountDue.toLocaleString()}</span></div>
                {settings?.promotions.buyXGetYEnabled && (
                  <div className="text-xs text-muted-foreground">
                    Promo active: Buy {settings.promotions.buyXQty}, get {settings.promotions.buyYQty} free.
                  </div>
                )}
                {settings?.promotions.spendXGetYEnabled && (
                  <div className="text-xs text-muted-foreground">
                    Promo active: Spend Rs {settings.promotions.spendAmount}, get {settings.promotions.spendFreeQty} bottles free.
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelected(null)}>Close</Button>
                <Button size="sm" onClick={() => toast.success('Invoice downloaded')}>Download PDF</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={walkInOpen} onOpenChange={setWalkInOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Walk-in Billing</DialogTitle>
            <DialogDescription>Record billing/payment for non-registered customers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={walkInName} onChange={(e) => setWalkInName(e.target.value)} placeholder="Walk-in customer name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Amount (Rs)</Label>
                <Input type="number" min="1" value={walkInAmount} onChange={(e) => setWalkInAmount(Number(e.target.value || 0))} />
              </div>
              <div className="space-y-1">
                <Label>Method</Label>
                <Select value={walkInMethod} onValueChange={(v) => setWalkInMethod(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input value={walkInNotes} onChange={(e) => setWalkInNotes(e.target.value)} placeholder="Optional notes" />
            </div>
            <div className="space-y-2">
              <Label>Products</Label>
              <div className="space-y-2 max-h-52 overflow-auto">
                {walkInProducts.map((product) => {
                  const qty = walkInItems[product.id] || 0;
                  return (
                    <div key={product.id} className="border border-border rounded-md px-3 py-2 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">Rs {product.defaultPrice}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => updateWalkInQty(product.id, -1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{qty}</span>
                        <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => updateWalkInQty(product.id, 1)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm font-medium text-right">Total: Rs {walkInComputedTotal.toLocaleString()}</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setWalkInOpen(false)}>Cancel</Button>
              <Button
                onClick={() => walkInMutation.mutate({
                  customerId: 'walk-in',
                  walkInName: walkInName || 'Walk-in Customer',
                  amount: walkInComputedTotal || walkInAmount,
                  items: Object.entries(walkInItems)
                    .filter(([, quantity]) => quantity > 0)
                    .map(([productId, quantity]) => {
                      const product = walkInProducts.find((p) => p.id === productId);
                      return { productId, quantity, unitPrice: product?.defaultPrice };
                    }),
                  method: walkInMethod,
                  notes: walkInNotes || undefined,
                })}
                disabled={walkInMutation.isPending || (walkInComputedTotal <= 0 && walkInAmount <= 0)}
              >
                {walkInMutation.isPending ? 'Saving...' : 'Record'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
