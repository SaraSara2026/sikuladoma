// Hodnocení šikuly po dokončené zakázce. 5 kategorií × 5 hvězd + doporučení + komentář.
// Volá POST /api/reviews. orderId je povinný prop.

import { useState } from "react";
import { T, S, inp, lbl } from "../ui/theme";
import { IconBtn } from "../ui/Button";
import { IcX, IcCheckCircle } from "../ui/icons/UIIcons";
import { reviewsApi } from "../lib/api";

const HODNOCENI_KATEGORIE = [
  { id: "domluva",    label: "Dodržení domluvy" },
  { id: "kvalita",    label: "Kvalita služby" },
  { id: "komunikace", label: "Komunikace" },
  { id: "vstricnost", label: "Vstřícnost a chování" },
  { id: "cena",       label: "Cena odpovídala domluvě" },
];

export default function HodnoceniForm({ orderId, onClose, onSubmitted }) {
  const [hodnoceni, setHodnoceni] = useState({});
  const [doporuceni, setDoporuceni] = useState(null);
  const [komentar, setKomentar] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState(null);

  const setH = (id, val) => setHodnoceni(p => ({ ...p, [id]: val }));
  const vsechnyVyplneny = HODNOCENI_KATEGORIE.every(k => hodnoceni[k.id]) && doporuceni !== null;

  const odeslat = async () => {
    if (!vsechnyVyplneny || busy) return;
    if (!orderId) { setErr("Chybí orderId — nelze odeslat."); return; }
    setErr(null);
    setBusy(true);
    try {
      // Průměr 5 hvězd z kategorií = celkové stars
      const avg = Math.round(
        HODNOCENI_KATEGORIE.reduce((s, k) => s + (hodnoceni[k.id] || 0), 0) / HODNOCENI_KATEGORIE.length
      );
      await reviewsApi.create({
        order_id:  orderId,
        stars:     avg,
        ratings:   hodnoceni,
        recommend: doporuceni === "ano",
        comment:   komentar || null,
      });
      setDone(true);
      onSubmitted?.();
    } catch (e) {
      setErr(e.message || "Odeslání hodnocení selhalo.");
    } finally {
      setBusy(false);
    }
  };

  if (done) return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "48px 28px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#16A34A" }}>
            <IcCheckCircle />
          </div>
          <h3 style={{ fontSize: 19, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Děkujeme za hodnocení</h3>
          <p style={{ fontSize: 14, color: T.ink3, lineHeight: 1.65, marginBottom: 22 }}>
            Vaše hodnocení pomáhá ostatním zákazníkům při výběru šikuly.
          </p>
          <button onClick={onClose}
            style={{ height: 42, padding: "0 24px", borderRadius: 10, border: "none", background: T.orange, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.orange, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 2 }}>Hodnocení šikuly</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>Jak proběhla zakázka?</div>
          </div>
          <IconBtn onClick={onClose}><IcX /></IconBtn>
        </div>

        <div style={{ padding: "20px", maxHeight: "65vh", overflowY: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
            {HODNOCENI_KATEGORIE.map(k => (
              <div key={k.id}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 7 }}>{k.label}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1,2,3,4,5].map(star => (
                    <button key={star} onClick={() => setH(k.id, star)}
                      style={{ width: 36, height: 36, borderRadius: 8, border: `1.5px solid ${hodnoceni[k.id] >= star ? "#F97316" : T.border}`, background: hodnoceni[k.id] >= star ? "#FFF7ED" : "#fff", cursor: "pointer", fontSize: 16, transition: "all .12s" }}>
                      {hodnoceni[k.id] >= star ? "★" : "☆"}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 10 }}>Doporučili byste tohoto šikulu?</div>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { id: "ano", label: "✅ Doporučuji",   bg: "#F0FDF4", border: "#22C55E", color: "#16A34A" },
                { id: "ne",  label: "❌ Nedoporučuji", bg: "#FEF2F2", border: "#EF4444", color: "#DC2626" },
              ].map(opt => (
                <button key={opt.id} onClick={() => setDoporuceni(opt.id)}
                  style={{ flex: 1, height: 44, borderRadius: 10, border: `1.5px solid ${doporuceni === opt.id ? opt.border : T.border}`, background: doporuceni === opt.id ? opt.bg : "#fff", color: doporuceni === opt.id ? opt.color : T.ink, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all .14s" }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ ...lbl, marginBottom: 6 }}>Chcete něco doplnit? <span style={{ color: T.ink4, fontWeight: 400 }}>(volitelné)</span></label>
            <textarea value={komentar} onChange={e => { if (e.target.value.length <= 300) setKomentar(e.target.value); }}
              placeholder="Krátký komentář…"
              style={{ ...inp, minHeight: 80, resize: "none" }} />
            <div style={{ fontSize: 11, color: T.ink4, textAlign: "right", marginTop: 4 }}>{komentar.length}/300</div>
          </div>

          <div style={{ marginTop: 14, background: "#F8FAFC", border: `1px solid ${T.border}`, borderRadius: 9, padding: "10px 13px", fontSize: 12, color: T.ink3, lineHeight: 1.55 }}>
            Hodnocení je propojeno s konkrétní zakázkou. Každou zakázku lze ohodnotit pouze jednou.
          </div>
        </div>

        {err && (
          <div style={{ margin: "0 20px 12px", padding: "9px 12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 12, color: "#B91C1C" }}>
            {err}
          </div>
        )}

        <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={odeslat} disabled={!vsechnyVyplneny || busy}
            style={{ height: 44, padding: "0 24px", borderRadius: 10, border: "none", background: vsechnyVyplneny && !busy ? T.orange : T.border, color: vsechnyVyplneny && !busy ? "#fff" : T.ink4, fontWeight: 600, fontSize: 14, cursor: vsechnyVyplneny && !busy ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all .15s" }}>
            {busy ? "Odesílám…" : "Odeslat hodnocení"}
          </button>
        </div>
      </div>
    </div>
  );
}
