import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockCustomers } from '@/data/mockData';
import { ArrowLeft, Camera, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function QRScanPage() {
  const navigate = useNavigate();
  const [manualId, setManualId] = useState('');
  const [scanning, setScanning] = useState(true);

  const handleManualSearch = () => {
    const customer = mockCustomers.find(c => c.customerId === manualId || c.phone === manualId);
    if (customer) navigate(`/worker/quick-deliver/${customer.id}`);
  };

  const simulateScan = () => {
    // Simulate scanning customer WD-1001
    navigate('/worker/quick-deliver/1');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/worker')} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
        <span className="font-semibold text-sm">Scan Customer QR</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Camera area */}
        <div
          onClick={simulateScan}
          className="w-64 h-64 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center bg-muted cursor-pointer active:bg-secondary"
        >
          <Camera className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Tap to simulate scan</p>
          <p className="text-xs text-muted-foreground mt-1">Point camera at QR code</p>
        </div>

        <div className="w-full max-w-xs mt-8">
          <p className="text-xs text-muted-foreground text-center mb-3">Or enter Customer ID / Phone</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="WD-1001 or phone"
              value={manualId}
              onChange={e => setManualId(e.target.value)}
              className="flex-1 h-12 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button onClick={handleManualSearch} className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-4">
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
