import { html, useState, useEffect, useRef } from '../../lib.js';
import { S, COLORS, FONTS } from '../../ui/theme.js';
import { fetchOFFByBarcode, normalizeBarcode } from '../../api/openFoodFacts.js';

/**
 * Barcode-Eingabe-Panel mit optionalem Kamera-Scan via BarcodeDetector-API.
 *
 * @param {{
 *   onSelect: (product: import('../../api/openFoodFacts.js').OFFProduct) => void,
 *   onClose: () => void,
 * }} props
 */
export function BarcodePanel({ onSelect, onClose }) {
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [hasBarcodeDetector, setHasBarcodeDetector] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const canScan =
      typeof window !== 'undefined'
      && 'BarcodeDetector' in window
      && !!navigator.mediaDevices?.getUserMedia;
    setHasBarcodeDetector(canScan);
    return () => stopStream();
  }, []);

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }

  async function handleManualSearch() {
    const code = normalizeBarcode(barcode);
    if (!code) return;
    if (code.length < 8) {
      setError('Barcode bitte vollständig eingeben.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const product = await fetchOFFByBarcode(code);
      onSelect(product);
      onClose();
    } catch (e) {
      setError(e.message || 'Produkt nicht gefunden.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStartCamera() {
    if (!hasBarcodeDetector) {
      setError('Kamera-Scan wird von diesem Browser nicht unterstützt. Bitte Barcode manuell eingeben.');
      return;
    }
    setError(null);
    let stopped = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setScanning(true);

      const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });

      const scanLoop = async () => {
        if (stopped || !videoRef.current) return;
        try {
          const found = await detector.detect(videoRef.current);
          if (found.length > 0 && !stopped) {
            stopped = true;
            const code = normalizeBarcode(found[0].rawValue);
            stream.getTracks().forEach(t => t.stop());
            streamRef.current = null;
            setScanning(false);
            setBarcode(code);
            setLoading(true);
            try {
              const product = await fetchOFFByBarcode(code);
              onSelect(product);
              onClose();
            } catch (e) {
              setError(e.message || 'Produkt nicht gefunden.');
            } finally {
              setLoading(false);
            }
            return;
          }
        } catch { /* Einzelbild-Erkennungsfehler ignorieren */ }
        if (!stopped) setTimeout(scanLoop, 500);
      };

      setTimeout(scanLoop, 800);
    } catch {
      setError('Kamera-Zugriff nicht möglich. Bitte Barcode manuell eingeben.');
    }
  }

  const normalizedBarcode = normalizeBarcode(barcode);
  const searchDisabled = loading || !normalizedBarcode;

  return html`
    <div style=${{ marginBottom: '10px' }}>
      ${scanning && html`
        <div style=${{ marginBottom: '8px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
          <video
            ref=${videoRef}
            autoplay
            playsinline
            muted
            style=${{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block' }}
          />
          <button
            onClick=${stopStream}
            style=${{
              position: 'absolute', top: '6px', right: '6px',
              ...S.btn('#222', COLORS.text),
              padding: '4px 8px', fontSize: '11px',
            }}
          >Stop</button>
        </div>
      `}
      <div style=${{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        <input
          type="text"
          inputmode="numeric"
          value=${barcode}
          placeholder="Barcode (EAN/UPC)"
          onInput=${e => setBarcode(e.target.value)}
          onKeyDown=${e => e.key === 'Enter' && handleManualSearch()}
          style=${{ ...S.input, flex: 1 }}
          autoFocus
        />
        <button
          onClick=${handleManualSearch}
          disabled=${searchDisabled}
          style=${{
            ...S.btn(searchDisabled ? '#2a2a2a' : COLORS.gold, searchDisabled ? '#555' : '#111'),
            padding: '0 14px',
            flexShrink: 0,
            minWidth: '86px',
          }}
        >
          ${loading ? 'Suche...' : 'Suchen'}
        </button>
      </div>
      ${hasBarcodeDetector && !scanning && html`
        <button
          onClick=${handleStartCamera}
          style=${{ ...S.btn('#1a2a1a', '#5cb85c'), width: '100%', marginBottom: '8px', fontSize: '12px' }}
        >
          Kamera-Scan starten
        </button>
      `}
      ${!hasBarcodeDetector && html`
        <div style=${{ fontSize: '11px', color: COLORS.textMuted, fontFamily: FONTS.mono, marginBottom: '8px', lineHeight: 1.5 }}>
          Kamera-Scan ist in diesem Browser nicht verfügbar. Die manuelle Barcode-Eingabe funktioniert weiterhin.
        </div>
      `}
      ${error && html`
        <div style=${{ fontSize: '11px', color: COLORS.error, fontFamily: FONTS.mono }}>
          ${error}
        </div>
      `}
    </div>
  `;
}
