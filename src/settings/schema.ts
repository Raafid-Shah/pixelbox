export interface Settings{ version:2; set:string; reducedMotion:boolean; flashReduction:boolean; shader:{curve:number;scan:number;bloom:number}; audio:{master:number;muted:boolean} }
export const defaults:Settings={ version:2,set:'late-byte-cafe',reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,flashReduction:false,shader:{curve:.18,scan:.35,bloom:.25},audio:{master:.25,muted:false} };
const K='pixelbox:settings';
export function loadSettings():Settings{ try{ const r=JSON.parse(localStorage.getItem(K)||'null'); return r?.version===2?{...defaults,...r}:defaults; }catch{ return defaults; } }
export function saveSettings(s:Settings){ try{ localStorage.setItem(K,JSON.stringify(s)); }catch{} }
