import { T } from '../../theme/tokens';
export type PanelKind='standard'|'highlight'|'danger';
/** Double-line panel, 1px steps only so it stays crisp at any integer scale. */
export function panel(g:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,kind:PanelKind='standard'){
  const c=kind==='danger'?T.score:kind==='highlight'?T.accent:T.border;
  g.fillStyle=T.panel;g.fillRect(x,y,w,h);
  g.strokeStyle=T.borderShadow;g.lineWidth=1;g.strokeRect(x+.5,y+.5,w-1,h-1);
  g.strokeStyle=c;g.strokeRect(x+2.5,y+2.5,w-5,h-5); }
export function gauge(g:CanvasRenderingContext2D,x:number,y:number,w:number,v:number,color:string=T.accent){
  g.fillStyle='#000';g.fillRect(x,y,w,6);g.fillStyle=color;g.fillRect(x+1,y+1,Math.round((w-2)*v),4); }
