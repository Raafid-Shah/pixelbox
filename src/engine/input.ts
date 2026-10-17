import { bus, Action } from './bus';
const keys:Record<string,Action>={ArrowUp:'UP',ArrowDown:'DOWN',ArrowLeft:'LEFT',ArrowRight:'RIGHT',Enter:'A',z:'A',' ':'A',Escape:'B',x:'B',Tab:'START',q:'L',e:'R'};
export const held=new Set<Action>();
function emit(a:Action,down:boolean){ if(down===held.has(a))return; if(down)held.add(a);else held.delete(a); bus.emit('input:action',{a,down}); }
export function initInput(){
  addEventListener('keydown',e=>{const a=keys[e.key];if(a){e.preventDefault();emit(a,true);}});
  addEventListener('keyup',e=>{const a=keys[e.key];if(a)emit(a,false);});
  const pad=new Set<number>();
  setInterval(()=>{const g=navigator.getGamepads?.()[0];if(!g)return;
    const map:[number,Action][]=[[12,'UP'],[13,'DOWN'],[14,'LEFT'],[15,'RIGHT'],[0,'A'],[1,'B'],[9,'START']];
    for(const [i,a] of map){const d=!!g.buttons[i]?.pressed;if(d!==pad.has(i)){if(d)pad.add(i);else pad.delete(i);emit(a,d);}}},16);
  return emit;
}
