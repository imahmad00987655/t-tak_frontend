import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Droplets } from 'lucide-react';
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
const BRAND_PRIMARY_DARK = '#15293f';
const BRAND_ACCENT = '#2c7a5a';

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
      margin: 0,
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
      <DialogContent className="sm:max-w-md print:border-0 print:shadow-none print:max-w-full print:p-0 [&>button]:print:hidden">
        <style>{`
          @media print {
            @page { size: 88.9mm 50.8mm; margin: 0; }
            body * { visibility: hidden; }
            .ttok-print-card, .ttok-print-card * { visibility: visible; }
            .ttok-print-card {
              position: absolute;
              left: 0; top: 0;
              margin: 0;
              border-radius: 0 !important;
              box-shadow: none !important;
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
            Standard business card · 3.5" × 2" (88.9 × 50.8 mm)
          </DialogDescription>
        </DialogHeader>
        {customer && (
          <div className="space-y-4">
            {/* Preview wrapper centers the actual-size card on screen */}
            <div className="flex items-center justify-center rounded-md bg-slate-100 p-4 print:bg-white print:p-0">
              <div
                className="ttok-print-card relative overflow-hidden bg-white text-black"
                style={{
                  width: '88.9mm',
                  height: '50.8mm',
                  borderRadius: '2.5mm',
                  boxShadow: '0 10px 30px rgba(28,58,94,0.18)',
                  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                }}
              >
                {/* Left navy panel */}
                <div
                  className="absolute inset-y-0 left-0 flex flex-col items-center justify-between text-white"
                  style={{
                    width: '32mm',
                    padding: '3mm 2mm',
                    background: `linear-gradient(160deg, ${BRAND_PRIMARY} 0%, ${BRAND_PRIMARY_DARK} 100%)`,
                  }}
                >
                  {/* Brand */}
                  <div className="flex w-full items-center justify-center" style={{ gap: '1mm' }}>
                    <Droplets style={{ width: '3mm', height: '3mm', color: '#9fd6b4' }} />
                    <span style={{ fontSize: '3.6mm', fontWeight: 800, letterSpacing: '0.5mm' }}>
                      T-TOK
                    </span>
                  </div>

                  {/* QR */}
                  <div
                    className="bg-white"
                    style={{
                      width: '26mm',
                      height: '26mm',
                      padding: '1mm',
                      borderRadius: '1.5mm',
                    }}
                  >
                    {error && (
                      <p style={{ fontSize: '2mm' }} className="text-red-600">
                        {error}
                      </p>
                    )}
                    {!error && dataUrl && (
                      <img
                        src={dataUrl}
                        alt="Customer QR"
                        style={{ width: '24mm', height: '24mm', display: 'block' }}
                      />
                    )}
                    {!error && !dataUrl && (
                      <div
                        className="flex items-center justify-center text-gray-400"
                        style={{ width: '24mm', height: '24mm', fontSize: '2mm' }}
                      >
                        ...
                      </div>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: '1.8mm',
                      letterSpacing: '0.4mm',
                      opacity: 0.85,
                      textTransform: 'uppercase',
                    }}
                  >
                    Scan to verify
                  </span>
                </div>

                {/* Right info area */}
                <div
                  className="absolute inset-y-0 right-0 flex flex-col"
                  style={{
                    left: '32mm',
                    padding: '3.5mm 4mm',
                  }}
                >
                  {/* Top accent bar */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '1mm',
                      background: `linear-gradient(90deg, ${BRAND_ACCENT}, ${BRAND_PRIMARY})`,
                    }}
                  />

                  {/* Tagline + ID */}
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        fontSize: '1.9mm',
                        fontWeight: 700,
                        letterSpacing: '0.5mm',
                        textTransform: 'uppercase',
                        color: BRAND_ACCENT,
                      }}
                    >
                      Customer Card
                    </span>
                    <span
                      style={{
                        fontSize: '2.2mm',
                        fontWeight: 700,
                        color: BRAND_PRIMARY,
                        background: '#eaf2f8',
                        padding: '0.4mm 1.4mm',
                        borderRadius: '1mm',
                      }}
                    >
                      #{customer.customerId}
                    </span>
                  </div>

                  {/* Name */}
                  <div
                    style={{
                      marginTop: '1.8mm',
                      fontSize: '4.4mm',
                      fontWeight: 800,
                      lineHeight: 1.1,
                      color: BRAND_PRIMARY,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {customer.name}
                  </div>

                  {/* Divider */}
                  <div
                    style={{
                      marginTop: '1.5mm',
                      height: '0.3mm',
                      width: '14mm',
                      background: BRAND_ACCENT,
                      borderRadius: '0.2mm',
                    }}
                  />

                  {/* Contact rows */}
                  <div style={{ marginTop: '1.5mm', fontSize: '2.4mm', lineHeight: 1.35 }}>
                    <div className="flex" style={{ gap: '1.4mm' }}>
                      <span style={{ color: '#6b7280', minWidth: '8mm', fontWeight: 600 }}>
                        Phone
                      </span>
                      <span style={{ color: '#111', fontWeight: 600 }}>
                        {customer.phone || '-'}
                      </span>
                    </div>
                    <div className="flex" style={{ gap: '1.4mm', marginTop: '0.6mm' }}>
                      <span style={{ color: '#6b7280', minWidth: '8mm', fontWeight: 600 }}>
                        Area
                      </span>
                      <span style={{ color: '#111', fontWeight: 600 }}>
                        {customer.area || '-'}
                      </span>
                    </div>
                    <div className="flex" style={{ gap: '1.4mm', marginTop: '0.6mm' }}>
                      <span style={{ color: '#6b7280', minWidth: '8mm', fontWeight: 600 }}>
                        Addr
                      </span>
                      <span
                        style={{
                          color: '#111',
                          fontWeight: 500,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          maxWidth: '42mm',
                        }}
                      >
                        {customer.address || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: '1.5mm',
                      borderTop: '0.2mm solid #e5e7eb',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '1.9mm',
                      color: '#4b5563',
                    }}
                  >
                    <span style={{ letterSpacing: '0.3mm' }}>Fresh · Pure · Reliable</span>
                    <span style={{ color: BRAND_PRIMARY, fontWeight: 700 }}>www.t-tok.com</span>
                  </div>
                </div>
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
