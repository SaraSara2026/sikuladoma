// Centrální design tokeny pro celou aplikaci.
// Žádné komponenty, jen plain object/style hodnoty.

// Barevné tokeny
export const T = {
  blue:      "#0066CC",
  blueDark:  "#004E9A",
  blueLight: "#E8F1FB",
  blueMid:   "#B3D0F5",
  orange:    "#F07800",
  orangeDk:  "#C05F00",
  orangeLt:  "#FFF4E8",
  ink:       "#1A1F2E",
  ink2:      "#3D4554",
  ink3:      "#6B7280",
  ink4:      "#9CA3AF",
  bg:        "#F9FAFB",
  surface:   "#FFFFFF",
  border:    "#E5E7EB",
  border2:   "#D1D5DB",
  green:     "#059669",
  greenLt:   "#ECFDF5",
  red:       "#DC2626",
};

// Sdílený overlay + modal kontejner
export const S = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(10,15,30,.55)",
    zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20, backdropFilter: "blur(8px)",
  },
  modal: {
    background: "#fff", borderRadius: 18, width: "100%", maxWidth: 580,
    maxHeight: "90vh", overflowY: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,.15)",
    animation: "modalUp .2s ease",
  },
};

// Formulářové styly (sdílené napříč modaly)
export const inp = {
  width: "100%", padding: "11px 14px", border: `1.5px solid ${T.border}`,
  borderRadius: 12, fontSize: 14, outline: "none", fontFamily: "inherit",
  color: T.ink, background: "#fff",
  transition: "border-color .14s, box-shadow .14s", boxSizing: "border-box",
};

export const lbl = {
  display: "block", fontSize: 11, fontWeight: 600, color: T.ink3,
  marginBottom: 5, letterSpacing: ".04em", textTransform: "uppercase",
};

export const hint = {
  fontSize: 14, color: T.ink3, marginBottom: 14, lineHeight: 1.55,
};
