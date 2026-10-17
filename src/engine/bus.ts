export type Action='UP'|'DOWN'|'LEFT'|'RIGHT'|'A'|'B'|'START'|'SELECT'|'L'|'R';
export interface Events{ 'input:action':{a:Action;down:boolean}; 'lamp:toggle':boolean; 'frame:glow':[number,number,number][]; 'set:change':string; 'unlock':string; 'visit:return':number; 'setting:change':{k:string;v:unknown}; 'channel:change':number; }
const m=new Map<string,Set<(p:any)=>void>>();
export const bus={
  on<K extends keyof Events>(k:K,h:(p:Events[K])=>void){ if(!m.has(k))m.set(k,new Set()); m.get(k)!.add(h); return ()=>{m.get(k)!.delete(h);}; },
  emit<K extends keyof Events>(k:K,p:Events[K]){ m.get(k)?.forEach(h=>h(p)); } };
