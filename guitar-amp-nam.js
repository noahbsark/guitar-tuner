"use strict";
// Optional local neural amp. Built-in graph remains available with no runtime.
(()=>{
const el=id=>document.getElementById(id),runtime="/vendor/nam-runtime/dist/engine/";
let active=null,loading=false,epoch=0;
const tell=s=>el("studioNamStatus").textContent=s;
const timeout=(p,ms,msg)=>{let timer;return Promise.race([p,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(msg)),ms)})]).finally(()=>clearTimeout(timer))};
function canSwitch(){return !loading&&!busy&&!rec&&mode!=="mic"&&media.paused&&!g?.offlineBusy}
function sync(){
 const allowed=canSwitch();
 el("studioNamFile").disabled=!allowed;el("studioNamCab").disabled=!allowed;
 el("studioNamLoad").disabled=!allowed||!el("studioNamFile").files.length;
 el("studioNamClear").disabled=!allowed||!active;
 el("namControls").dataset.active=String(!!active);
 el("amp").disabled=!!active;el("gain").disabled=!!active;el("cab").disabled=!!active&&active.cab==="full";
 el("namWavNotice").hidden=!active;el("namReferenceNotice").hidden=!active;el("namGearNotice").hidden=!active;
 if(active){el("wavExport").disabled=true;el("matchReference").disabled=true}
 el("ampName").textContent=active?"Neural capture":(el("amp").selectedOptions[0]?.textContent||"Amplifier");
}
const oldUI=ui;ui=function(){oldUI();sync()};
function release(node){if(!node)return;try{node.disconnect()}catch{}try{Promise.resolve(node.dispose()).catch(()=>{})}catch{}}
function setRoute(next){
 // Switch only with transport stopped. Keep input cleanup and all pre/post
 // pedals, EQ, safety limiter, output volume and recording taps unchanged.
 if(!g)throw Error("Studio audio engine is unavailable.");
 const old=active;
 g.ampIn.disconnect();g.treble.disconnect();if(old)old.node.disconnect();
 try{
  if(next){g.ampIn.connect(next.node);next.node.connect(g.bass)}
  else g.ampIn.connect(g.ampPre);
  g.treble.connect(next?.cab==="full"?g.cabOut:g.cabHP);
 }catch(e){
  g.ampIn.disconnect();g.treble.disconnect();if(next)release(next.node);
  g.ampIn.connect(g.ampPre);g.treble.connect(g.cabHP);active=null;g.namActive=false;if(old)release(old.node);
  document.dispatchEvent(new Event("studio-nam-change"));sync();throw e;
 }
 active=next;g.namActive=!!active;
 if(old&&old.node!==next?.node)release(old.node);
 document.dispatchEvent(new Event("studio-nam-change"));
 sync();
}
function emergency(node){
 if(active?.node!==node)return;
 // Never resume the speaker path automatically after a worklet failure.
 g.monitor.gain.cancelScheduledValues(ctx.currentTime);g.monitor.gain.setValueAtTime(0,ctx.currentTime);
 if(rec)finish(true);disconnect();
 try{setRoute(null)}catch{tell("Neural processing failed. Reload the studio.");return}
 tell("Neural processing failed. Built-in amp restored; restart the input manually.");status("Audio stopped after a neural engine error.");ui();
}
el("studioNamFile").addEventListener("change",sync);
el("studioNamCab").addEventListener("change",sync);
for(const ev of ["play","pause","ended","emptied"])media.addEventListener(ev,()=>{if(loading&&ev==="play")media.pause();sync()});
el("studioNamLoad").addEventListener("click",async()=>{
 if(!canSwitch()||!el("studioNamFile").files.length)return;
 const file=el("studioNamFile").files[0],cab=el("studioNamCab").value,token=++epoch;let candidate=null;
 loading=true;busy=true;ui();tell("Loading neural amp…");
 try{
  if(!window.AudioWorkletNode||!window.WebAssembly)throw Error("Neural audio requires HTTPS or localhost and AudioWorklet support.");
  if(file.size<10||file.size>12000000)throw Error("Choose a NAM capture under 12 MB.");
  build();
  // Call resume within the button gesture; no playback or capture is started.
  const resume=ctx.resume().then(()=>null,e=>e);
  const json=await file.text(),config=JSON.parse(json);
  if(!config||typeof config.version!=="string"||typeof config.architecture!=="string"||!config.config||!Array.isArray(config.weights))throw Error("Invalid or unsupported NAM capture.");
  const rate=Number(config.sample_rate)||48000;
  if(rate!==ctx.sampleRate)throw Error("Capture uses "+rate+" Hz, but the studio uses "+ctx.sampleRate+" Hz. Try a matching capture or the separate neural amp lab.");
  const resumeError=await timeout(resume,7000,"Audio engine did not start. Check browser audio permissions.");if(resumeError)throw resumeError;
  if(token!==epoch||document.hidden)throw Error("Loading cancelled.");
  let NamEngine;try{({NamEngine}=await import(runtime+"index.js"))}catch{throw Error("Neural runtime not prepared on this host. The built-in amp is still available.");}
  const engine=await timeout(NamEngine.attach(ctx,{assetBaseUrl:new URL(runtime,location.href)}),20000,"Neural engine did not initialize.");
  candidate=await timeout(engine.createNode(),20000,"Neural node did not respond.");
  const info=await timeout(candidate.loadModel(json),20000,"Model could not load.");
  if(info.expectedSampleRate>0&&info.expectedSampleRate!==ctx.sampleRate)throw Error("The capture requires a different audio sample rate.");
  if(token!==epoch||document.hidden||!media.paused||mode==="mic"||rec)throw Error("Loading cancelled.");
  const loaded=candidate;loaded.addEventListener("processorerror",()=>emergency(loaded));
  setRoute({node:loaded,name:file.name,cab});candidate=null;
  tell(file.name+" active · "+ctx.sampleRate+" Hz · "+(cab==="full"?"cabinet included":"studio cabinet active")+". Presets adjust effects and EQ, not the capture. Start at low output.");
  status("Neural amp ready. Play a recording or start the microphone.");
 }catch(e){release(candidate);tell((active?"Previous neural capture retained. ":"Built-in amplifier available. ")+(e.message||"Model failed to load."))}
 finally{loading=false;busy=false;ui()}
});
el("studioNamClear").addEventListener("click",()=>{if(!active||!canSwitch())return;setRoute(null);tell("Built-in amplifier restored.");status("Built-in amplifier ready.");ui()});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&loading)epoch++});
window.addEventListener("pagehide",()=>{epoch++;if(active)release(active.node)});
sync();
})();
