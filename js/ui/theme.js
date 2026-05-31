export const COLORS = {
  bg: '#111',
  surface: '#181818',
  surfaceDeep: '#141414',
  border: '#222',
  borderLight: '#1e1e1e',
  gold: '#c8a96e',
  text: '#f0ece4',
  textMuted: '#aaa',   // war #555 — erhöht für 50+ Lesbarkeit (Kontrast ~8.5:1 auf #111)
  textSubtle: '#999',  // war #444 — erhöht für 50+ Lesbarkeit (Kontrast ~6.0:1 auf #111)
  error: '#e05c5c',
  success: '#5cb85c',
};

export const FONTS = {
  sans: "'DM Sans', sans-serif",
  mono: "'DM Mono', monospace",
  display: "'Playfair Display', serif",
};

// Exakt aus der bestehenden App extrahiert:
export const S = {
  app: { minHeight:"100vh", background:"#111", color:"#f0ece4", fontFamily:"'DM Sans',sans-serif" },
  header: { padding:"22px 18px 12px", borderBottom:"1px solid #1e1e1e", background:"#111", position:"sticky", top:0, zIndex:100 },
  title: { fontFamily:"'Playfair Display',serif", fontSize:"20px", fontWeight:700, color:"#f0ece4", letterSpacing:"-0.02em" },
  sub: { fontSize:"11px", color:"#999", letterSpacing:"0.12em", textTransform:"uppercase", marginTop:"3px", fontFamily:"'DM Mono',monospace" },
  tabs: { display:"flex", gap:"2px", padding:"10px 18px 0", background:"#111", overflowX:"auto", WebkitOverflowScrolling:"touch" },
  tab: a => ({ padding:"10px 16px", fontSize:"12px", letterSpacing:"0.1em", textTransform:"uppercase", fontFamily:"'DM Mono',monospace", background:a?"#c8a96e":"transparent", color:a?"#111":"#d4d0c8", border:"none", borderRadius:"4px 4px 0 0", cursor:"pointer", fontWeight:a?700:600, whiteSpace:"nowrap", flexShrink:0 }),
  content: { padding:"14px 14px 80px", maxWidth:"480px", margin:"0 auto" },
  card: { background:"#181818", borderRadius:"12px", padding:"15px", marginBottom:"11px", border:"1px solid #222" },
  cardTitle: { fontSize:"11px", letterSpacing:"0.14em", textTransform:"uppercase", color:"#c8a96e", fontFamily:"'DM Mono',monospace", marginBottom:"11px", fontWeight:600 },
  toggle: a => ({ flex:1, padding:"10px", border:"none", borderRadius:"8px", fontSize:"12px", fontWeight:600, fontFamily:"'DM Mono',monospace", cursor:"pointer", background:a?"#c8a96e":"#2a2a2a", color:a?"#111":"#d4d0c8" }),
  timeBtn: a => ({ flex:1, padding:"9px", border:"1px solid", borderColor:a?"#c8a96e":"#3a3a3a", borderRadius:"6px", fontSize:"13px", fontFamily:"'DM Mono',monospace", cursor:"pointer", background:a?"#1e1a12":"#141414", color:a?"#c8a96e":"#bbb" }),
  input: { width:"100%", background:"#1a1a1a", border:"1px solid #2a2a2a", borderRadius:"8px", padding:"10px 12px", color:"#f0ece4", fontSize:"15px", fontFamily:"'DM Mono',monospace", outline:"none", boxSizing:"border-box" },
  label: { fontSize:"11px", letterSpacing:"0.1em", textTransform:"uppercase", color:"#aaa", fontFamily:"'DM Mono',monospace", marginBottom:"5px", display:"block" },
  mealCard: { background:"#141414", borderRadius:"10px", padding:"12px", marginBottom:"8px", border:"1px solid #1e1e1e", borderLeft:"3px solid #c8a96e" },
  chip: c => ({ fontSize:"10px", padding:"3px 8px", borderRadius:"20px", background:c+"18", color:c, fontFamily:"'DM Mono',monospace", fontWeight:600 }),
  statBox: { background:"#141414", borderRadius:"8px", padding:"10px 8px", textAlign:"center", border:"1px solid #1e1e1e" },
  btn: (c="#c8a96e",tc="#111") => ({ background:c, color:tc, border:"none", borderRadius:"8px", padding:"10px 16px", fontSize:"11px", fontWeight:700, fontFamily:"'DM Mono',monospace", cursor:"pointer", letterSpacing:"0.06em" }),
  tag: c => ({ fontSize:"9px", padding:"2px 7px", borderRadius:"12px", background:c+"22", color:c, fontFamily:"'DM Mono',monospace", fontWeight:600 }),
};
