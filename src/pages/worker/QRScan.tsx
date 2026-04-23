import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchCustomers, fetchPublicCustomerByToken } from '@/lib/customersApi';
import { useToast } from '@/hooks/use-toast';
import jsQR from 'jsqr';

type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
};

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
  const { toast } = useToast();
  const [manualId, setManualId] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [hasLiveFrame, setHasLiveFrame] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const handledScanRef = useRef(false);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const previewRetryRef = useRef<number | null>(null);

  const hasNativeBarcodeDetector = useMemo(() => typeof (window as any).BarcodeDetector !== 'undefined', []);

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
    navigate(`/worker/quick-deliver/${matched.id}`);
    return true;
  }, [navigate]);

  const handleResolvedValue = useCallback(async (value: string) => {
    if (handledScanRef.current || isResolving) return;
    handledScanRef.current = true;
    setIsResolving(true);
    try {
      const token = readTokenFromQrValue(value);
      if (token) {
        const customer = await fetchPublicCustomerByToken(token);
        navigate(`/worker/quick-deliver/${customer.id}`);
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
  }, [goToCustomerByLookup, isResolving, navigate, toast]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (previewRetryRef.current) {
      window.clearTimeout(previewRetryRef.current);
      previewRetryRef.current = null;
    }
    setCameraReady(false);
    setHasLiveFrame(false);
  }, []);

  const scanFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || handledScanRef.current) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    const video = videoRef.current;
    if (video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    if (video.videoWidth > 0 && video.videoHeight > 0) setHasLiveFrame(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    try {
      let rawValue = '';
      if (detectorRef.current) {
        const codes = await detectorRef.current.detect(canvas);
        rawValue = codes[0]?.rawValue || '';
      } else {
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(image.data, image.width, image.height);
        rawValue = code?.data || '';
      }
      if (rawValue) await handleResolvedValue(rawValue);
    } catch {
      // Ignore frame-level decode failures.
    }
    rafRef.current = requestAnimationFrame(scanFrame);
  }, [handleResolvedValue]);

  const startCamera = useCallback(async () => {
    setCameraError('');
    setHasLiveFrame(false);
    handledScanRef.current = false;
    try {
      detectorRef.current = null;
      if (hasNativeBarcodeDetector) {
        const DetectorCtor = (window as any).BarcodeDetector;
        detectorRef.current = new DetectorCtor({ formats: ['qr_code'] }) as BarcodeDetectorLike;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera API is unavailable in this browser. Use manual ID/phone search.');
        return;
      }
      const videoConstraintsToTry: MediaTrackConstraints[] = [
        { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        { width: { ideal: 1280 }, height: { ideal: 720 } },
        { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        true as unknown as MediaTrackConstraints,
      ];

      const attachAndValidateStream = async (stream: MediaStream): Promise<boolean> => {
        if (!videoRef.current) return false;
        const video = videoRef.current;
        video.srcObject = stream;
        video.playsInline = true;
        video.setAttribute('playsinline', 'true');
        video.muted = true;
        video.autoplay = true;
        const onLive = () => setHasLiveFrame(true);
        video.onloadeddata = onLive;
        video.onplaying = onLive;
        video.ontimeupdate = onLive;
        await new Promise<void>((resolve) => {
          if (video.readyState >= 1) {
            resolve();
            return;
          }
          const onLoaded = () => {
            video.removeEventListener('loadedmetadata', onLoaded);
            resolve();
          };
          video.addEventListener('loadedmetadata', onLoaded);
        });
        await video.play();

        const hasFrame = await new Promise<boolean>((resolve) => {
          const startedAt = Date.now();
          const check = () => {
            const ready = video.videoWidth > 0 && video.videoHeight > 0;
            if (ready) {
              resolve(true);
              return;
            }
            if (Date.now() - startedAt > 1800) {
              resolve(false);
              return;
            }
            requestAnimationFrame(check);
          };
          check();
        });
        return hasFrame;
      };

      let activeStream: MediaStream | null = null;
      for (const constraints of videoConstraintsToTry) {
        const trial = await navigator.mediaDevices.getUserMedia({
          video: constraints,
          audio: false,
        });
        const ok = await attachAndValidateStream(trial);
        if (ok) {
          activeStream = trial;
          break;
        }
        trial.getTracks().forEach((track) => track.stop());
      }

      if (!activeStream) {
        throw new Error('Camera opened but no live frames received. Try another browser/device camera.');
      }

      streamRef.current = activeStream;
      setCameraReady(true);
      rafRef.current = requestAnimationFrame(scanFrame);
    } catch (error) {
      setCameraError(
        error instanceof Error
          ? error.message
          : 'Camera permission denied or unavailable. Allow camera permission and retry.'
      );
    }
  }, [hasNativeBarcodeDetector, scanFrame]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleStartPreview = async () => {
    try {
      if (videoRef.current) {
        await videoRef.current.play();
        if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
          setHasLiveFrame(true);
        }
      }
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : 'Unable to start preview');
    }
  };

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
          {cameraReady ? (
            <video ref={videoRef} className="w-full h-full object-cover bg-black" playsInline muted autoPlay />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Camera className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground text-center px-4">
                {cameraError || 'Starting camera...'}
              </p>
            </div>
          )}
          {cameraReady && !hasLiveFrame && (
            <div className="absolute inset-0 bg-black/50 text-white text-xs flex flex-col items-center justify-center px-3 text-center gap-2">
              <p>Camera connected, waiting for live preview...</p>
              <Button variant="secondary" size="sm" onClick={handleStartPreview}>
                Tap to start preview
              </Button>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
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
