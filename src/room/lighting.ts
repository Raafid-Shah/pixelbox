import { bus } from '../engine/bus';
const probe=document.createElement('canvas');probe.width=3;probe.height=1;const px=probe.getContext('2d',{willReadFrequently:true})!;
let n=0;
/** The screen relights the room: every 4th frame, average the frame into left/centre/right. */
export function relight(src:HTMLCanvasElement){ if(++n%4)return; px.drawImage(src,0,0,3,1);const d=px.getImageData(0,0,3,1).data;const s=document.documentElement.style;const out:[number,number,number][]=[];
  ['gl','gc','gr'].forEach((k,i)=>{const c:[number,number,number]=[d[i*4],d[i*4+1],d[i*4+2]];out.push(c);const m=Math.max(...c,1);s.setProperty('--'+k,c.map(v=>Math.min(255,Math.round(v*(255/m)))).join(','));}); bus.emit('frame:glow',out); }
export function initLamp(room:HTMLElement){ let on=true; bus.on('lamp:toggle',v=>{on=v;room.classList.toggle('off',!on);}); addEventListener('keydown',e=>{if(e.key==='l')bus.emit('lamp:toggle',!on);}); }
