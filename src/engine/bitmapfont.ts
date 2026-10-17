// Runtime atlas: rasterise once at 8px, threshold alpha => no anti-aliasing. (Build-time script is a later phase.)
const CH=[...' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_abcdefghijklmnopqrstuvwxyz{|}~'];
const atlases=new Map<string,HTMLCanvasElement>();
function atlas(color:string){ let a=atlases.get(color); if(a)return a;
  const c=document.createElement('canvas');c.width=CH.length*8;c.height=8;const x=c.getContext('2d',{willReadFrequently:true})!;
  x.font='8px PressStart2P, monospace';x.textBaseline='top';x.fillStyle='#fff';CH.forEach((ch,i)=>x.fillText(ch,i*8,0));
  const d=x.getImageData(0,0,c.width,8);const n=parseInt(color.slice(1),16);
  for(let i=0;i<d.data.length;i+=4){const on=d.data[i+3]>110;d.data[i]=n>>16;d.data[i+1]=(n>>8)&255;d.data[i+2]=n&255;d.data[i+3]=on?255:0;}
  x.putImageData(d,0,0);atlases.set(color,c);return c; }
export const measureText=(s:string)=>s.length*8;
export function drawText(g:CanvasRenderingContext2D,s:string,x:number,y:number,color='#f4efe4',shadow?:string){
  if(shadow)drawText(g,s,x+1,y+1,shadow);const a=atlas(color);
  for(let i=0;i<s.length;i++){const k=CH.indexOf(s[i]);if(k>0)g.drawImage(a,k*8,0,8,8,Math.round(x)+i*8,Math.round(y),8,8);} }
export function drawTextWrapped(g:CanvasRenderingContext2D,s:string,x:number,y:number,w:number,color?:string){
  let line='',yy=y;for(const word of s.split(' ')){if(measureText(line+word)>w){drawText(g,line,x,yy,color);yy+=10;line='';}line+=word+' ';}drawText(g,line,x,yy,color);return yy+10; }
