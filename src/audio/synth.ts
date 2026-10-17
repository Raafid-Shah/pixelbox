// Fallback oscillator synth (the plan's AudioWorklet sequencer replaces the music path in Phase 5).
let ctx:AudioContext|null=null,master:GainNode,muted=false;
export function startAudio(){ if(ctx)return; ctx=new AudioContext();master=ctx.createGain();master.gain.value=.25;
  const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=8000;master.connect(lp);lp.connect(ctx.destination);
  const h=ctx.createOscillator(),hg=ctx.createGain();h.frequency.value=60;hg.gain.value=.012;h.connect(hg);hg.connect(master);h.start(); }
export function toggleMute(){ muted=!muted; if(master)master.gain.value=muted?0:.25; return muted; }
export function blip(freq=660,dur=.07,type:OscillatorType='square',slide=0){ if(!ctx||muted)return; const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime;
  o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.linearRampToValueAtTime(Math.max(20,freq+slide),t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.4,t+.005);g.gain.linearRampToValueAtTime(0,t+dur);o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.02); }
export const jingle=()=>[523,659,784,1046].forEach((f,i)=>setTimeout(()=>blip(f,.12,'square'),i*90));
