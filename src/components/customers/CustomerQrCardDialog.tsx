import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { CustomerDto } from '@/lib/customersApi';

interface Props {
  customer: CustomerDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CustomerQrCardDialog({ customer, open, onOpenChange }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl print:border-0 print:shadow-none [&>button]:print:hidden">
        <DialogHeader>
          <DialogTitle>Customer QR card</DialogTitle>
          <DialogDescription>
            Print-ready QR code only.
          </DialogDescription>
        </DialogHeader>
        {customer && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-white p-8 text-black print:shadow-none flex items-center justify-center">
              {error && <p className="text-sm text-destructive">{error}</p>}
              {!error && dataUrl && <img src={dataUrl} alt="Customer QR" className="w-[280px] h-[280px]" />}
              {!error && !dataUrl && <p className="text-sm text-muted-foreground py-16">Generating...</p>}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 print:hidden">
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
