import { mirrorToCss } from './theme/tokens';
import { initInput } from './engine/input';
import { loop } from './engine/loop';
import { bus } from './engine/bus';
import { createScreen } from './engine/gl/shader';
import { toggleDive } from './engine/camera';
import { broadcastWood } from './hardware/bodies/broadcast-wood';
import { relight, initLamp } from './room/lighting';
import { mirror } from './fx/mirror';
import { startAudio, toggleMute, jingle, blip } from './audio/synth';
import { createMenu } from './game/scenes/menu';
import { initAttract } from './experiences/attract';
import { loadSettings, saveSettings } from './settings/schema';
import projects from './content/projects.json';

mirrorToCss();
const S=loadSettings();
const room=document.getElementById('room')!,body=document.getElementById('body')!,mir=document.getElementById('mirror') as HTMLCanvasElement;
broadcastWood.mount(body,{onKnob:(k)=>{ startAudio(); blip(k==='channel'?220:440,.12,'sawtooth'); bus.emit('channel:change',1); }});
const screen=createScreen(document.getElementById('out') as HTMLCanvasElement);
Object.assign(screen.params,S.shader);
const frame=document.createElement('canvas');frame.width=320;frame.height=180;const g=frame.getContext('2d',{willReadFrequently:true})!;g.imageSmoothingEnabled=false;
const menu=createMenu();initInput();initLamp(room);

let started=false;const start=()=>{ if(started)return; started=true; startAudio(); jingle(); };
addEventListener('pointerdown',start);bus.on('input:action',start);
addEventListener('keydown',e=>{ if(e.key==='f')toggleDive(body,room,S.reducedMotion); if(e.key==='m')S.audio.muted=toggleMute(); });
addEventListener('beforeunload',()=>saveSettings(S));
document.getElementById('classic')!.addEventListener('click',e=>{e.preventDefault();document.body.innerHTML='<main style="padding:24px;font:14px/1.6 system-ui;color:#f4efe4;background:#07090f;min-height:100%"><h1>Classic View</h1>'+projects.map(p=>`<h2>${p.title}</h2><p>${p.blurb}</p>`).join('')+'</main>';document.body.style.overflow='auto';});
initAttract(()=>{ bus.emit('input:action',{a:'RIGHT',down:true}); });

const born=performance.now();let n=0;
loop((_dt,t)=>{ n++;
  const warm=Math.min(1,(t-born)/900); menu.draw(g,t);
  if(warm<1){ const h=Math.max(2,Math.round(180*warm*warm)),y=Math.round((180-h)/2); const snap=g.getImageData(0,y,320,h); g.fillStyle='#000';g.fillRect(0,0,320,180);g.putImageData(snap,0,y); g.fillStyle='rgba(255,255,255,.6)';g.fillRect(0,89,320,Math.max(1,Math.round(2*(1-warm)))); }
  screen.present(frame,t); relight(frame); mirror(frame,mir,n); });
