export function loop(update:(dt:number,t:number)=>void){ let last=performance.now(),acc=0; const step=1000/60;
  const f=(now:number)=>{ if(!document.hidden){acc+=Math.min(100,now-last); while(acc>=step){update(step,now);acc-=step;}} last=now; requestAnimationFrame(f); }; requestAnimationFrame(f); }
