import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Camera, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchCustomers, fetchPublicCustomerByToken } from '@/lib/customersApi';
import { useToast } from '@/hooks/use-toast';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '@/contexts/AuthContext';

function readTokenFromQrValue(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const match = url.pathname.match(/\/card\/([^/?#]+)/i);
    return match?.[1] ?? null;
  } catch {
    const direct = raw.match(/\/card\/([^/?#]+)/i);
    if (direct?.[1]) return direct[1];
    if (/^[0-9a-f-]{20,}$/i.test(raw)) return raw;
    return null;
    
  }
}

export default function QRScanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [manualId, setManualId] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const handledScanRef = useRef(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const expectedCustomerId = searchParams.get('customerId')?.trim() || '';
  const returnTo = searchParams.get('returnTo')?.trim() || '';

  const goAfterVerify = useCallback(
    (nextCustomerId: string, qrToken?: string) => {
      if (returnTo) {
        const separator = returnTo.includes('?') ? '&' : '?';
        const target = `${returnTo}${separator}qrVerified=1${qrToken ? `&qrToken=${encodeURIComponent(qrToken)}` : ''}`;
        navigate(target);
        return;
      }
      navigate(
        `/worker/quick-deliver/${nextCustomerId}?qrVerified=1${qrToken ? `&qrToken=${encodeURIComponent(qrToken)}` : ''}`
      );
    },
    [navigate, returnTo]
  );

  const goToCustomerByLookup = useCallback(async (value: string) => {
    const needle = value.trim().toLowerCase();
    if (!needle) return false;
    const customers = await fetchCustomers();
    const matched = customers.find(
      (customer) =>
        customer.id === needle ||
        customer.customerId.toLowerCase() === needle ||
        customer.phone.toLowerCase() === needle
    );
    if (!matched) return false;
    if (expectedCustomerId && String(matched.id) !== expectedCustomerId) return false;
    goAfterVerify(String(matched.id));
    return true;
  }, [expectedCustomerId, goAfterVerify]);

  const handleResolvedValue = useCallback(async (value: string) => {
    if (handledScanRef.current || isResolving) return;
    handledScanRef.current = true;
    setIsResolving(true);
    try {
      const token = readTokenFromQrValue(value);
      if (token) {
        const customer = await fetchPublicCustomerByToken(token);
        if (expectedCustomerId && String(customer.id) !== expectedCustomerId) {
          toast({
            title: 'Wrong customer QR',
            description: 'Scan the assigned customer QR for this delivery.',
            variant: 'destructive',
          });
          handledScanRef.current = false;
          return;
        }
        goAfterVerify(String(customer.id), token);
        return;
      }
      const found = await goToCustomerByLookup(value);
      if (!found) {
        toast({ title: 'Customer not found', description: 'QR or ID does not match any customer.', variant: 'destructive' });
        handledScanRef.current = false;
      }
    } catch (error) {
      toast({
        title: 'Scan failed',
        description: error instanceof Error ? error.message : 'Unable to read this QR code.',
        variant: 'destructive',
      });
      handledScanRef.current = false;
    } finally {
      setIsResolving(false);
    }
  }, [expectedCustomerId, goAfterVerify, goToCustomerByLookup, isResolving, toast]);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (error) {
        console.warn('Failed stopping QR scanner', error);
      } finally {
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    }
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError('');
    handledScanRef.current = false;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera API is unavailable in this browser. Use manual ID/phone search.');
        return;
      }
      const scanner = new Html5Qrcode('worker-qr-reader', {
        verbose: false,
      });
      scannerRef.current = scanner;
      const onSuccess = async (decodedText: string) => {
        await handleResolvedValue(decodedText);
      };
      const onFailure = (_errorMessage: string) => {
        // keep scanning; noisy decode errors are expected per frame
      };
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1,
          disableFlip: false,
        },
        onSuccess,
        onFailure
      );
      console.info('QR camera started successfully');
      setCameraReady(true);
    } catch (error) {
      console.error('QR camera start failed', error);
      setCameraError(
        error instanceof Error
          ? error.message
          : 'Camera permission denied or unavailable. Allow camera permission and retry.'
      );
    }
  }, [handleResolvedValue]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'field_worker') {
      return;
    }
    startCamera();
    return () => {
      void stopCamera();
    };
  }, [isAuthenticated, startCamera, stopCamera, user?.role]);

  if (!isAuthenticated || user?.role !== 'field_worker') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-border rounded-lg p-6 text-center bg-card">
          <p className="text-base font-medium">Only field workers can access QR scan.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please login with a field worker account to scan customer QR codes.
          </p>
          <Button className="mt-4 w-full" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const handleManualSearch = async () => {
    const value = manualId.trim();
    if (!value) return;
    await handleResolvedValue(value);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/worker')} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
        <span className="font-semibold text-sm">Scan Customer QR</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-72 h-72 border-2 border-dashed border-border rounded-xl bg-muted overflow-hidden relative">
          <div id="worker-qr-reader" className="w-full h-full [&>div]:w-full [&>div]:h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
          {!cameraReady && (
            <div className="absolute inset-0 bg-muted w-full h-full flex flex-col items-center justify-center">
              <Camera className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground text-center px-4">
                {cameraError || 'Starting camera...'}
              </p>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Scan customer QR to open that customer directly.
        </p>
        {!!cameraError && (
          <Button variant="outline" className="mt-3" onClick={startCamera}>
            Retry Camera
          </Button>
        )}

        <div className="w-full max-w-xs mt-8">
          <p className="text-xs text-muted-foreground text-center mb-3">Or enter Customer ID / Phone / QR token</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="WD-1001 or phone or token"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              className="flex-1 h-12 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button onClick={handleManualSearch} disabled={isResolving} className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-4">
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
