// AvatarUpload — file picker + client-side resize na 256x256 + base64 callback.
// Persistence řeší rodičovský komponent (typicky PATCH /api/users/me).

import { useRef, useState } from 'react';

const MAX_SIZE = 256;     // px
const MAX_BYTES = 500_000;  // ~500 KB base64 (limit v API)

export default function AvatarUpload({ currentSrc, name = '?', onChange }) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const pickFile = () => fileRef.current?.click();

  const handleFile = async (e) => {
    setErr(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErr('Vyber prosím obrázek.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErr('Obrázek je příliš velký (max 8 MB).');
      return;
    }
    setBusy(true);
    try {
      const base64 = await resizeToBase64(file);
      if (base64.length > MAX_BYTES) {
        setErr('Obrázek je příliš velký i po zmenšení.');
        return;
      }
      onChange?.(base64);
    } catch (e2) {
      console.error(e2);
      setErr('Nepodařilo se zpracovat obrázek.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ position: 'relative' }}>
        {currentSrc ? (
          <img src={currentSrc} alt={name} style={{ width: 80, height: 80, borderRadius: 14, objectFit: 'cover', display: 'block', boxShadow: '0 2px 8px rgba(0,0,0,.12)' }} />
        ) : (
          <div style={{ width: 80, height: 80, borderRadius: 14, background: '#F97316', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 28, boxShadow: '0 2px 8px rgba(249,115,22,.25)' }}>
            {initials}
          </div>
        )}
      </div>
      <div>
        <button type="button" onClick={pickFile} disabled={busy}
          style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#fff', cursor: busy ? 'wait' : 'pointer', fontSize: 13, fontWeight: 600, color: '#1A1F2E', fontFamily: 'inherit' }}>
          {busy ? 'Nahrávám…' : (currentSrc ? 'Změnit foto' : '📷 Nahrát foto')}
        </button>
        {currentSrc && !busy && (
          <button type="button" onClick={() => onChange?.('')}
            style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#B91C1C', fontFamily: 'inherit' }}>
            Odstranit
          </button>
        )}
        {err && <div style={{ marginTop: 6, fontSize: 12, color: '#B91C1C' }}>{err}</div>}
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>JPG / PNG, max 8 MB</div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      </div>
    </div>
  );
}

// Resize image client-side na MAX_SIZE px (square crop center) a vrátí base64 JPEG.
async function resizeToBase64(file) {
  const img = await loadImage(URL.createObjectURL(file));
  const { width: w, height: h } = img;
  const minSide = Math.min(w, h);
  const sx = (w - minSide) / 2;
  const sy = (h - minSide) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = MAX_SIZE;
  canvas.height = MAX_SIZE;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, MAX_SIZE, MAX_SIZE);

  // Kvalita 0.85 → většinou ~30-80 KB
  return canvas.toDataURL('image/jpeg', 0.85);
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
