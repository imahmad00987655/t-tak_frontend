import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { CustomerDto } from '@/lib/customersApi';
import { ExternalLink } from 'lucide-react';

interface Props {
  customer: CustomerDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CustomerQrCardDialog({ customer, open, onOpenChange }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  const cardUrl = customer?.qrCardUrl;

  useEffect(() => {
    if (!open || !cardUrl) {
      setDataUrl(null);
      setError(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(cardUrl, { width: 280, margin: 2, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message || 'Could not generate QR');
      });
    return () => {
      cancelled = true;
    };
  }, [open, cardUrl]);

  useEffect(() => {
    if (!open || !customer?.customerId || !barcodeRef.current) return;
    JsBarcode(barcodeRef.current, customer.customerId, {
      format: 'CODE128',
      displayValue: true,
      fontSize: 13,
      height: 42,
      margin: 0,
      width: 2,
    });
  }, [open, customer?.customerId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Customer QR card</DialogTitle>
          <DialogDescription>
            Scanning opens a public page with this customer&apos;s details. The data is loaded from the
            server using the code embedded in the QR.
          </DialogDescription>
        </DialogHeader>
        {customer && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-white p-5 text-black print:shadow-none">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">TikTak Water</p>
                  <p className="text-lg font-semibold leading-tight">{customer.name}</p>
                  <p className="text-xs font-mono text-slate-600 mt-1">{customer.customerId}</p>
                </div>
                <div className="text-right text-[11px] text-slate-600">
                  <p>Route: {customer.route || 'N/A'}</p>
                  <p>Area: {customer.area || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-4 mt-4 items-center">
                <div className="space-y-2 text-sm">
                  <p><span className="text-slate-500">Phone:</span> {customer.phone}</p>
                  <p><span className="text-slate-500">Address:</span> {customer.address}</p>
                  <p><span className="text-slate-500">Type:</span> <span className="capitalize">{customer.customerType}</span></p>
                  <div className="pt-2">
                    <svg ref={barcodeRef} className="w-full max-w-[280px]" />
                  </div>
                </div>
                <div className="flex justify-center bg-white rounded-lg p-3 border border-slate-200">
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  {!error && dataUrl && (
                    <img src={dataUrl} alt="Customer QR" className="w-[190px] h-[190px]" />
                  )}
                  {!error && !dataUrl && <p className="text-sm text-muted-foreground py-16">Generating...</p>}
                </div>
              </div>

              <p className="mt-3 text-[11px] text-slate-600">
                Scan QR to open verified customer card for field delivery.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="default"
                className="flex-1"
                disabled={!cardUrl}
                onClick={() => cardUrl && window.open(cardUrl, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View card
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => window.print()}>
                Print
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
