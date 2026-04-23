import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockCustomers, mockProducts } from '@/data/mockData';
import { ArrowLeft, Check, Minus, Plus, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function QuickDeliverPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const customer = mockCustomers.find(c => c.id === customerId);
  const activeProducts = mockProducts.filter(p => p.status === 'active' && p.defaultPrice > 0);

  const [items, setItems] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');

  if (!customer) return <div className="p-8 text-center text-muted-foreground">Customer not found</div>;

  const updateQty = (productId: string, delta: number) => {
    setItems(prev => {
      const next = { ...prev };
      const val = (next[productId] || 0) + delta;
      if (val <= 0) delete next[productId];
      else next[productId] = val;
      return next;
    });
  };

  const total = Object.entries(items).reduce((sum, [pid, qty]) => {
    const product = activeProducts.find(p => p.id === pid);
    return sum + (product?.defaultPrice || 0) * qty;
  }, 0);

  const walletAfter = Math.max(0, customer.walletBalance - total);
  const amountDue = Math.max(0, total - customer.walletBalance);

  const handleConfirm = () => {
    if (Object.keys(items).length === 0) {
      toast({ title: 'Select at least one product', variant: 'destructive' });
      return;
    }
    toast({ title: 'Delivery recorded!', description: `Rs ${total} for ${customer.name}` });
    navigate('/worker');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
        <span className="font-semibold text-sm">Quick Delivery</span>
      </header>

      <div className="p-4 space-y-4 flex-1">
        {/* Customer Info */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold">{customer.name}</p>
              <p className="text-xs text-muted-foreground">{customer.customerId} · {customer.area}</p>
              <p className="text-xs text-muted-foreground mt-1">{customer.address}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-accent">
                <Wallet className="w-4 h-4" />
                <span className="font-semibold">Rs {customer.walletBalance.toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Current balance</p>
            </div>
          </div>
        </div>

        {/* Products */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Select Products</h3>
          <div className="space-y-2">
            {activeProducts.map(p => {
              const qty = items[p.id] || 0;
              return (
                <div key={p.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Rs {p.defaultPrice} / {p.unit}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updateQty(p.id, -1)} className="w-10 h-10 rounded-lg border border-border flex items-center justify-center active:bg-muted">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-semibold">{qty}</span>
                    <button onClick={() => updateQty(p.id, 1)} className="w-10 h-10 rounded-lg border border-border flex items-center justify-center active:bg-muted">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs text-muted-foreground">Delivery Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any notes..."
            className="w-full h-16 px-3 py-2 mt-1 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Summary */}
        {total > 0 && (
          <div className="bg-card border border-border rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-semibold">Rs {total}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Wallet Deduction</span><span className="text-accent">-Rs {Math.min(total, customer.walletBalance)}</span></div>
            {amountDue > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Amount Due</span><span className="text-destructive font-semibold">Rs {amountDue}</span></div>}
            <div className="flex justify-between border-t border-border pt-2"><span className="text-muted-foreground">Balance After</span><span>Rs {walletAfter}</span></div>
          </div>
        )}
      </div>

      {/* Confirm */}
      <div className="p-4 border-t border-border bg-card">
        <Button onClick={handleConfirm} className="w-full h-14 bg-accent text-accent-foreground hover:bg-accent/90 text-base font-semibold" disabled={Object.keys(items).length === 0}>
          <Check className="w-5 h-5 mr-2" /> Confirm Delivery · Rs {total}
        </Button>
      </div>
    </div>
  );
}
