// Standardní tlačítka.
// Sizes: "sm" | "md" (default) | "lg"
// Hover style se aplikuje přes inline mouse handlers (žádný CSS modul).

import { T } from "./theme";

function sizes(size) {
  return {
    h:  size === "lg" ? 48 : size === "sm" ? 38 : 44,
    fs: size === "lg" ? 15 : size === "sm" ? 13 : 14,
  };
}

const base = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
  borderRadius: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  whiteSpace: "nowrap", letterSpacing: "-.01em",
};

export function BtnPrimary({ children, onClick, size = "md", style: sx = {} }) {
  const { h, fs } = sizes(size);
  const px = size === "lg" ? 28 : size === "sm" ? 16 : 22;
  return (
    <button
      onClick={onClick}
      style={{ ...base, height: h, padding: `0 ${px}px`, border: "none",
        background: T.orange, color: "#fff", fontSize: fs,
        transition: "background .15s, box-shadow .15s", ...sx }}
      onMouseEnter={e => { e.currentTarget.style.background = T.orangeDk; e.currentTarget.style.boxShadow = "0 4px 14px rgba(240,120,0,.28)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = T.orange; e.currentTarget.style.boxShadow = "none"; }}
    >
      {children}
    </button>
  );
}

export function BtnSecondary({ children, onClick, size = "md", style: sx = {} }) {
  const { h, fs } = sizes(size);
  const px = size === "lg" ? 28 : size === "sm" ? 16 : 22;
  return (
    <button
      onClick={onClick}
      style={{ ...base, height: h, padding: `0 ${px}px`, border: `1.5px solid ${T.border2}`,
        background: "transparent", color: T.ink2, fontSize: fs,
        transition: "all .15s", ...sx }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.blue; e.currentTarget.style.color = T.blue; e.currentTarget.style.background = T.blueLight; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.ink2; e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}

export function BtnGhost({ children, onClick, size = "md", style: sx = {} }) {
  const { h, fs } = sizes(size);
  const px = size === "lg" ? 24 : size === "sm" ? 14 : 18;
  return (
    <button
      onClick={onClick}
      style={{ ...base, height: h, padding: `0 ${px}px`, border: `1.5px solid ${T.border}`,
        background: "transparent", color: T.ink3, fontSize: fs, fontWeight: 500,
        transition: "all .15s", ...sx }}
      onMouseEnter={e => { e.currentTarget.style.background = T.bg; e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.ink; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.ink3; }}
    >
      {children}
    </button>
  );
}

export function BtnBlue({ children, onClick, size = "md", style: sx = {} }) {
  const { h, fs } = sizes(size);
  const px = size === "lg" ? 28 : size === "sm" ? 16 : 22;
  return (
    <button
      onClick={onClick}
      style={{ ...base, height: h, padding: `0 ${px}px`, border: "none",
        background: T.blue, color: "#fff", fontSize: fs,
        transition: "background .15s, box-shadow .15s", ...sx }}
      onMouseEnter={e => { e.currentTarget.style.background = T.blueDark; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,102,204,.22)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = T.blue; e.currentTarget.style.boxShadow = "none"; }}
    >
      {children}
    </button>
  );
}

export const IconBtn = ({ onClick, children }) => (
  <button onClick={onClick}
    style={{ width: 34, height: 34, borderRadius: 9, border: "none",
      background: T.bg, color: T.ink3,
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", flexShrink: 0, transition: "background .12s" }}
    onMouseEnter={e => e.currentTarget.style.background = T.border}
    onMouseLeave={e => e.currentTarget.style.background = T.bg}
  >
    {children}
  </button>
);
