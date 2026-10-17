import { gradient, woodFilter } from '../materials';
export interface BodyCtx{ onKnob(name:string,v:number):void }
/** Halden Broadcast 12 (invented): wood sides, brushed-metal bezel, thick tube surround, four knobs, grille. */
export const broadcastWood={ id:'broadcast-wood', form:'tv' as const,
  mount(root:HTMLElement,ctx:BodyCtx){
    const grille=Array.from({length:14},(_,i)=>`<rect x="${120+i*18}" y="560" width="10" height="90" rx="5"/>`).join('');
    const knobs=['channel','volume','picture','power'].map(k=>`<button data-k="${k}" aria-label="${k}" style="width:5.5vmin;height:5.5vmin;opacity:0;cursor:pointer"></button>`).join('');
    root.insertAdjacentHTML('afterbegin',`<svg viewBox="0 0 1000 690" aria-hidden="true"><defs>${gradient('wd','wood')}${gradient('mt','metal')}${gradient('rb','rubber')}${woodFilter}</defs>
      <rect x="20" y="20" width="960" height="650" rx="26" fill="url(#wd)"/><rect x="20" y="20" width="960" height="650" rx="26" filter="url(#grain)"/>
      <rect x="90" y="60" width="820" height="470" rx="40" fill="url(#mt)"/><rect x="120" y="85" width="760" height="420" rx="60" fill="#0a0a0c" stroke="#2a2d33" stroke-width="10"/>
      <g fill="#14100c">${grille}</g>
      <circle cx="690" cy="605" r="30" fill="url(#rb)"/><circle cx="765" cy="605" r="30" fill="url(#rb)"/><circle cx="840" cy="605" r="30" fill="url(#rb)"/><circle cx="915" cy="605" r="24" fill="#d8342b"/></svg>
      <div role="group" aria-label="TV controls" style="position:absolute;left:66%;top:85%;display:flex;gap:2.2%">${knobs}</div>
      <div id="screen"><canvas id="out"></canvas></div>`);
    root.querySelectorAll<HTMLButtonElement>('[data-k]').forEach(b=>{b.onclick=()=>ctx.onKnob(b.dataset.k!,1);});
  }, unmount(){ }, screenRect:()=>document.getElementById('screen')!.getBoundingClientRect() };
