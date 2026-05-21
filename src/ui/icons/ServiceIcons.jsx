// SVG ikony pro kategorie služeb — clean line style.
// Každá komponenta přijímá `size` prop (default 22).

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" };
const wrap = (size, body) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}>{body}</svg>
);

export function IcFurniture({ size = 22 }) { return wrap(size, <><rect x="3" y="6" width="18" height="13" rx="1"/><path d="M8 6V4h8v2"/><line x1="3" y1="11" x2="21" y2="11"/></>); }
export function IcDrill({ size = 22 })     { return wrap(size, <><path d="M14 10l-2 2-6.5 6.5a1 1 0 000 1.4l.6.6a1 1 0 001.4 0L14 14"/><path d="M14 10l2-2 4-1-1 4-2 2"/><circle cx="19" cy="5" r="1"/></>); }
export function IcWrench({ size = 22 })    { return wrap(size, <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>); }
export function IcClean({ size = 22 })     { return wrap(size, <><path d="M3 22l7-7"/><path d="M7.5 13.5L14 5l5 5-8.5 6.5"/><path d="M5 17l2 2"/></>); }
export function IcIron({ size = 22 })      { return wrap(size, <><path d="M5 17H3a1 1 0 01-1-1v-2a9 9 0 019-9h10l1 5H5v7z"/><circle cx="7" cy="17" r="1" fill="currentColor"/></>); }
export function IcSofa({ size = 22 })      { return wrap(size, <><path d="M20 9V6a2 2 0 00-2-2H6a2 2 0 00-2 2v3"/><path d="M2 11a2 2 0 012 2v2h16v-2a2 2 0 012-2 2 2 0 01-2-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 01-2 2z"/><line x1="6" y1="19" x2="6" y2="15"/><line x1="18" y1="19" x2="18" y2="15"/></>); }
export function IcElectric({ size = 22 })  { return wrap(size, <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>); }
export function IcPlumbing({ size = 22 })  { return wrap(size, <><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8H6a3 3 0 000 6h1v3a1 1 0 001 1h8a1 1 0 001-1v-3h1a3 3 0 000-6z"/></>); }
export function IcPaint({ size = 22 })     { return wrap(size, <><path d="M19 3H5a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"/><path d="M12 12v9"/><path d="M10 21h4"/></>); }
export function IcGarden({ size = 22 })    { return wrap(size, <><path d="M12 22V11"/><path d="M12 11C12 8 9 5 6 5s-3 3-1 5c1.5 1.5 4 2 7 1z"/><path d="M12 11c0-3 3-6 6-6s3 3 1 5c-1.5 1.5-4 2-7 1z"/></>); }
export function IcTile({ size = 22 })      { return wrap(size, <><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></>); }
export function IcFloor({ size = 22 })     { return wrap(size, <><path d="M3 21h18"/><path d="M3 7l9-4 9 4"/><path d="M3 7v14"/><path d="M21 7v14"/><path d="M12 3v18"/></>); }
export function IcMove({ size = 22 })      { return wrap(size, <><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v5"/><path d="M14 21a3 3 0 110-6 3 3 0 010 6z"/><path d="M21 21a3 3 0 110-6 3 3 0 010 6z"/></>); }
export function IcTech({ size = 22 })      { return wrap(size, <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></>); }
export function IcCar({ size = 22 })       { return wrap(size, <><path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/><path d="M5 12h14"/></>); }
export function IcHeart({ size = 22 })     { return wrap(size, <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>); }
export function IcPaw({ size = 22 })       { return wrap(size, <><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><circle cx="6.5" cy="15.5" r="2"/><path d="M16.5 15.5c1 2 1.5 3-1.5 4.5s-4.5 1-6 0-2.5-2.5-1.5-4.5l1-2a3 3 0 015 0l1 2z"/></>); }
export function IcWallet({ size = 22 })    { return wrap(size, <><path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5"/><path d="M16 12a2 2 0 000 4h5v-4h-5z"/></>); }
export function IcHandshake({ size = 22 }) { return wrap(size, <path d="M20.42 4.58a5.4 5.4 0 00-7.65 0l-.77.78-.77-.78a5.4 5.4 0 00-7.65 7.65l1.06 1.06L12 21.23l7.36-7.94 1.06-1.06a5.4 5.4 0 000-7.65z"/>); }
export function IcChild({ size = 22 })     { return wrap(size, <><circle cx="12" cy="6" r="3"/><path d="M12 9v5"/><path d="M9 14l-2 4"/><path d="M15 14l2 4"/><path d="M9 12h6"/></>); }
export function IcHammer({ size = 22 })    { return wrap(size, <><path d="M15 12l-8.5 8.5a2.12 2.12 0 01-3-3L12 9"/><path d="M17.64 15L22 10.64"/><path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 00-3.94-1.64H9l.92.82A6.18 6.18 0 0112 8.4v1.56l2 2h2.47l2.26 1.91"/></>); }
export function IcFlameSvc({ size = 22 })  { return wrap(size, <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z"/>); }
export function IcMonitor({ size = 22 })   { return wrap(size, <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>); }
