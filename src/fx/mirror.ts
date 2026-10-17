/** One frame, many displays: 80x45 copy every 2nd frame, with its own tint. */
export function mirror(src:HTMLCanvasElement,dst:HTMLCanvasElement,frame:number){ if(frame&1)return; const g=dst.getContext('2d')!;
  g.imageSmoothingEnabled=false;g.drawImage(src,0,0,80,45);g.fillStyle='rgba(60,140,255,.18)';g.fillRect(0,0,80,45); }
