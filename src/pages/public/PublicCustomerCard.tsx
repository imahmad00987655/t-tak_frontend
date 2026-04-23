import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPublicCustomerByToken } from '@/lib/customersApi';
import { MapPin, Phone, User, Truck, Calendar } from 'lucide-react';

export default function PublicCustomerCard() {
  const { token } = useParams();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-customer', token],
    queryFn: () => fetchPublicCustomerByToken(token!),
    enabled: !!token,
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-6">
        <p className="text-muted-foreground">Invalid link</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-6">
        <p className="text-muted-foreground">Loading customer card…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 p-6">
        <div className="max-w-md text-center space-y-2">
          <p className="font-medium">Card unavailable</p>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'This QR code may be invalid or expired.'}
          </p>
        </div>
      </div>
    );
  }

  const c = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="bg-primary text-primary-foreground px-6 py-5">
            <p className="text-xs uppercase tracking-wide opacity-90">TikTak Water</p>
            <h1 className="text-xl font-semibold mt-1">Customer card</h1>
            <p className="font-mono text-sm mt-2 opacity-95">{c.customerId}</p>
          </div>
          <div className="p-6 space-y-5 text-sm">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium text-base">{c.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium">{c.phone}</p>
                {c.altPhone && <p className="text-muted-foreground mt-1">{c.altPhone}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="leading-relaxed">{c.address}</p>
                <p className="text-muted-foreground mt-2">
                  {[c.area, c.zone].filter(Boolean).join(' · ')}
                  {c.route ? ` · ${c.route}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1 flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="capitalize">{c.customerType}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1 flex justify-between">
                <span className="text-muted-foreground">Customer since</span>
                <span>{c.joiningDate}</span>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-muted/50 border-t border-border text-center text-[11px] text-muted-foreground">
            Verified delivery address on file. Contact support to update details.
          </div>
        </div>
      </div>
    </div>
  );
}
