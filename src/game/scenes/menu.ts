import { T } from '../../theme/tokens';
import { drawText, drawTextWrapped } from '../../engine/bitmapfont';
import { panel, gauge } from '../../engine/ui/panel';
import projects from '../../content/projects.json';
import profile from '../../content/profile.json';
import { blip } from '../../audio/synth';
import { bus } from '../../engine/bus';
export interface Scene{ draw(g:CanvasRenderingContext2D,t:number):void }
/** Cartridge shelf: content is data; a cartridge's colours come from a hash of its slug. */
const hash=(s:string)=>[...s].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
export function createMenu():Scene{ let sel=0,open=false,type=0;
  bus.on('input:action',({a,down})=>{ if(!down)return; const n=projects.length;
    if(!open&&a==='LEFT'){sel=(sel+n-1)%n;blip(880,.04);type=0;} if(!open&&a==='RIGHT'){sel=(sel+1)%n;blip(880,.04);type=0;}
    if(a==='A'){open=!open;type=0;blip(open?1200:600,.08,'square',open?300:-200);} if(a==='B'&&open){open=false;blip(400,.08);} });
  return { draw(g,t){
    g.fillStyle=T.bg;g.fillRect(0,0,320,180);g.fillStyle='#0e1522';for(let x=0;x<320;x+=16)g.fillRect(x,0,1,180);for(let y=0;y<180;y+=16)g.fillRect(0,y,320,1);
    panel(g,8,6,304,26,'highlight');drawText(g,'PIXELBOX',16,15,T.white,'#000');drawText(g,'SCORE',208,11,T.border);drawText(g,String(18500+sel*100).padStart(6,'0'),208,20,T.score);
    panel(g,8,36,224,110);panel(g,236,36,76,110);
    projects.forEach((p,i)=>{ const h=hash(p.slug),x=20+i*52,y=52+(i===sel?-6-Math.round(Math.sin(t/200)):0);
      g.fillStyle=`hsl(${h%360} 70% 50%)`;g.fillRect(x,y,40,56);g.fillStyle='#000';g.fillRect(x+4,y+4,32,22);
      g.fillStyle=`hsl(${(h>>8)%360} 80% 65%)`;for(let k=0;k<12;k++)if((h>>k)&1)g.fillRect(x+6+(k%4)*7,y+6+((k/4)|0)*6,5,4);
      g.fillStyle=i===sel?T.amber:T.borderShadow;g.fillRect(x,y+50,40,6); });
    const p=projects[sel];drawText(g,p.title,20,118,T.amber,'#000');
    const msg=open?p.blurb:`${profile.role}. ${profile.bio}`;type=Math.min(msg.length,type+.7);drawTextWrapped(g,msg.slice(0,type|0),20,128,200,T.white);
    drawText(g,'TOP',244,44,T.border);drawText(g,'018500',244,54,T.score);drawText(g,'LEVEL',244,70,T.border);drawText(g,String(sel+1).padStart(2,'0'),244,80,T.score);
    Object.keys(profile.stats).forEach((k,i)=>{drawText(g,k,244,96+i*10,T.white);});gauge(g,244,138,60,(sel+1)/projects.length);
    panel(g,8,150,304,24);drawText(g,open?'B: BACK':'<> SELECT  A: OPEN',16,159,T.accent);if(Math.floor(t/400)%2)drawText(g,'>',300,159,T.amber);
  }};
}
