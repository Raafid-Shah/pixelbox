import { bus } from '../engine/bus';
/** 30 s idle starts the guided reel; any input wakes. Reel steps are real content, so nothing is written twice. */
export function initAttract(onTick:(step:number)=>void,idleMs=30000){ let last=performance.now(),i=0;
  bus.on('input:action',()=>{last=performance.now();});
  setInterval(()=>{ if(performance.now()-last>idleMs&&!document.hidden) onTick(i++); },3000); }
