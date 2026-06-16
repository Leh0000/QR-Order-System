import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode } from 'lucide-react';

function downloadQR(tableNumber) {
  const svg = document.getElementById(`qr-table-${tableNumber}`);
  if (!svg) return;

  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const size = 300;
  canvas.width = size;
  canvas.height = size + 40;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, size, size);
    ctx.fillStyle = '#1D1B18';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Table ${tableNumber}`, size / 2, size + 28);

    const link = document.createElement('a');
    link.download = `table-${tableNumber}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

function downloadAll(count) {
  for (let i = 1; i <= count; i++) {
    setTimeout(() => downloadQR(i), (i - 1) * 300);
  }
}

export default function QRGeneratorPage() {
  const [tableCount, setTableCount] = useState(10);
  const baseUrl = `${window.location.origin}/order`;

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-bg-soft">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-soft">
            <QrCode size={22} className="text-accent" />
          </div>
          <div>
            <h1 className="font-serif font-semibold text-2xl text-ink">QR Code Generator</h1>
            <p className="text-sm text-ink-soft">Generate and download QR codes for each table.</p>
          </div>
        </div>

        <div className="bg-bg rounded-2xl p-6 mb-8 shadow-sm border border-line">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-ink">Number of tables:</label>
              <input
                type="number"
                min={1}
                max={50}
                value={tableCount}
                onChange={(e) => setTableCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-20 rounded-xl px-3 py-2 text-sm border border-line bg-bg-soft text-ink outline-none focus:border-accent"
              />
            </div>
            <button
              onClick={() => downloadAll(tableCount)}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-accent text-white ml-auto"
            >
              <Download size={16} />
              Download all ({tableCount})
            </button>
          </div>
          <p className="text-xs text-ink-soft mt-3">
            QR codes link to: <code className="bg-bg-soft px-1.5 py-0.5 rounded text-accent">{baseUrl}?table=N</code>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.map((n) => (
            <div key={n} className="bg-bg rounded-2xl p-4 flex flex-col items-center gap-3 shadow-sm border border-line">
              <p className="text-sm font-semibold text-ink">Table {n}</p>
              <div className="p-2 bg-white rounded-xl">
                <QRCodeSVG
                  id={`qr-table-${n}`}
                  value={`${baseUrl}?table=${n}`}
                  size={120}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <button
                onClick={() => downloadQR(n)}
                className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
              >
                <Download size={13} />
                Download
              </button>
            </div>
          ))}
        </div>
      </div>

      <nav className="fixed bottom-6 right-6 flex flex-col gap-2">
        <a
          href="/admin"
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-ink text-white shadow-lg"
        >
          Admin Dashboard →
        </a>
      </nav>
    </div>
  );
}
