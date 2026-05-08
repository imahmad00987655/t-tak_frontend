import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Phone, MapPin, User, Droplets } from 'lucide-react';
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

const BRAND_PRIMARY = '#1c3a5e';
const BRAND_ACCENT = '#2c7a5a';
const BRAND_LIGHT = '#f4f8fb';

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
    QRCode.toDataURL(cardUrl, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: { dark: BRAND_PRIMARY, light: '#ffffff' },
    })
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl print:border-0 print:shadow-none print:max-w-full print:p-0 [&>button]:print:hidden">
        <style>{`
          @media print {
            @page { size: auto; margin: 12mm; }
            body * { visibility: hidden; }
            .ttok-print-card, .ttok-print-card * { visibility: visible; }
            .ttok-print-card {
              position: absolute;
              left: 0; top: 0; right: 0;
              margin: 0 auto;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          .ttok-print-card {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        `}</style>
        <DialogHeader className="print:hidden">
          <DialogTitle>Customer QR card</DialogTitle>
          <DialogDescription>
            Branded T-Tok card with QR code and customer details.
          </DialogDescription>
        </DialogHeader>
        {customer && (
          <div className="space-y-4">
            <div
              className="ttok-print-card mx-auto w-full max-w-[640px] overflow-hidden rounded-2xl bg-white text-black shadow-lg"
              style={{ border: `2px solid ${BRAND_PRIMARY}` }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-6 py-4 text-white"
                style={{ background: `linear-gradient(90deg, ${BRAND_PRIMARY} 0%, #2a5285 100%)` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ backgroundColor: BRAND_ACCENT }}
                  >
                    <Droplets className="h-6 w-6 text-white" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-2xl font-extrabold tracking-wide">T-TOK</div>
                    <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">
                      Pure Drinking Water
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest opacity-70">Customer Card</div>
                  <div className="text-sm font-semibold">#{customer.customerId}</div>
                </div>
              </div>

              {/* Accent strip */}
              <div className="h-1.5 w-full" style={{ backgroundColor: BRAND_ACCENT }} />

              {/* Body */}
              <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-[auto,1fr]">
                {/* Left: QR */}
                <div className="flex flex-col items-center">
                  <div
                    className="rounded-md px-3 py-1 text-xs font-bold uppercase tracking-widest text-white"
                    style={{ backgroundColor: BRAND_PRIMARY }}
                  >
                    T-TOK SCAN
                  </div>
                  <div
                    className="mt-2 rounded-xl bg-white p-3"
                    style={{ border: `2px solid ${BRAND_PRIMARY}` }}
                  >
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {!error && dataUrl && (
                      <img src={dataUrl} alt="Customer QR" className="h-[200px] w-[200px]" />
                    )}
                    {!error && !dataUrl && (
                      <div className="flex h-[200px] w-[200px] items-center justify-center text-xs text-gray-500">
                        Generating...
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-[10px] font-medium uppercase tracking-wider text-gray-500">
                    Scan to verify
                  </div>
                </div>

                {/* Right: Customer details */}
                <div className="flex flex-col justify-center">
                  <div className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: BRAND_ACCENT }}>
                    Registered Customer
                  </div>
                  <div className="mt-1 text-2xl font-bold leading-tight" style={{ color: BRAND_PRIMARY }}>
                    {customer.name}
                  </div>

                  <div className="mt-4 space-y-2.5 text-sm">
                    <div className="flex items-start gap-2">
                      <User className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRAND_ACCENT }} />
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Customer ID
                        </div>
                        <div className="font-medium text-gray-900">{customer.customerId}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRAND_ACCENT }} />
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Phone
                        </div>
                        <div className="font-medium text-gray-900">{customer.phone || '-'}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BRAND_ACCENT }} />
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Address
                        </div>
                        <div className="font-medium text-gray-900">{customer.address || '-'}</div>
                        {customer.area && (
                          <div className="text-xs text-gray-600">{customer.area}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between px-6 py-2.5 text-[11px] text-white"
                style={{ backgroundColor: BRAND_PRIMARY }}
              >
                <span className="font-medium tracking-wide">Fresh · Pure · Reliable</span>
                <span className="opacity-80">www.t-tok.com</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row print:hidden">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button
                type="button"
                className="flex-1 text-white"
                style={{ backgroundColor: BRAND_PRIMARY }}
                onClick={handlePrint}
              >
                Print Card
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
