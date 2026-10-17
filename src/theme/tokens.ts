export const T = { bg:'#07090f', panel:'#0b0f1a', border:'#8fb8cc', borderShadow:'#4f7388', accent:'#3fa9f5', score:'#d8342b', white:'#f4efe4', amber:'#ffb000' } as const;
export const materials = {
  plastic:{ base:'#d9d0b8', hi:'#f4efe4', sh:'#8a8168' },
  metal:{ base:'#9aa3ab', hi:'#e6ecf0', sh:'#4b535a' },
  wood:{ base:'#6b3f22', hi:'#8a5632', sh:'#3a2010' },
  rubber:{ base:'#23262d', hi:'#3a3e48', sh:'#0c0d10' },
} as const;
export function mirrorToCss(){ const r=document.documentElement.style; for(const [k,v] of Object.entries(T)) r.setProperty('--'+k,v); }
