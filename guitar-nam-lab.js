const $=id=>document.getElementById(id);
const setStatus=s=>$("namStatus").textContent=s;
const setExport=s=>$("namExportStatus").textContent=s;
const runtime="/vendor/nam-runtime/dist/engine/";
let ready=null,job=null,loading=false,generation=0,result=null,resultURL=null,bypass=false;
const time=t=>Math.floor(Math.max(0,t)/60)+":"+String(Math.floor(Math.max(0,t)%60)).padStart(2,"0");
const db=v=>Math.pow(10,v/20);
function update(){
 const blocked=loading||!!job;
 $("namPrepare").disabled=blocked||!$("namModel").files.length||!$("namAudio").files.length;
 for(const id of ["namModel","namAudio","namCab"])$(id).disabled=blocked;
 $("namPlay").disabled=!ready||blocked;$("namStop").disabled=!job;
 $("namBypass").disabled=!ready||loading||job?.kind==="export";
 $("namExport").disabled=!ready||blocked||!window.MediaRecorder;
 $("namDownload").disabled=!result||blocked;
 $("namInput").disabled=job?.kind==="export";$("namOutput").disabled=job?.kind==="export";
 $("namBypass").textContent=bypass?"Hear amplified":"Hear original";$("namBypass").setAttribute("aria-pressed",String(bypass));
 $("namIndicator").textContent=loading?"Loading…":ready?(job?.kind==="export"?"Rendering":bypass?"Original":"Model ready"):"Not loaded";
}
function clearResult(){result=null;if(resultURL){URL.revokeObjectURL(resultURL);resultURL=null}setExport("")}
function setProgress(t,d){$("namProgress").value=d>0?Math.max(0,Math.min(1,t/d)):0;$("namTime").textContent=time(t)+" / "+time(d)}
function disposeReady(){const r=ready;ready=null;if(r){try{r.node.disconnect()}catch{}r.ctx.close().catch(()=>{})}bypass=false;setProgress(0,0)}
function timeout(promise,ms,message){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(message)),ms)})]).finally(()=>clearTimeout(timer))}
function changeMix(){if(!ready)return;const {ctx,dry,wet,trim,out,cab}=ready;const original=bypass&&job?.kind!=="export";const now=ctx.currentTime;dry.gain.setTargetAtTime(original?1:0,now,.008);wet.gain.setTargetAtTime(original?0:1,now,.008);trim.gain.setTargetAtTime(db(Number($("namInput").value)),now,.015);out.gain.setTargetAtTime(Number($("namOutput").value)/100*.65,now,.015);cab.frequency.setTargetAtTime($("namCab").checked?4600:Math.min(22000,ctx.sampleRate*.48),now,.015)}
function fileChanged(){if(loading||job)return;generation++;disposeReady();clearResult();$("namInfo").textContent="";setStatus("Choose both local files, then load them.");update()}
$("namModel").addEventListener("change",fileChanged);$("namAudio").addEventListener("change",fileChanged);$("namCab").addEventListener("change",changeMix);
for(const [id,value,suffix] of [["namInput","namInputValue"," dB"],["namOutput","namOutputValue","%"]])$(id).addEventListener("input",()=>{$(value).textContent=$(id).value+suffix;changeMix()});
$("namPrepare").addEventListener("click",async()=>{
 if(loading||job||$("namPrepare").disabled)return;
 const model=$("namModel").files[0],audio=$("namAudio").files[0];const token=++generation;let ctx=null,node=null;
 disposeReady();clearResult();loading=true;update();setStatus("Checking local files…");
 try{
  if(!window.AudioWorkletNode||!window.WebAssembly)throw Error("Neural audio requires a secure context and AudioWorklet. Use HTTPS or localhost.");
  if(!model||model.size<10||model.size>12000000||!audio||audio.size>20000000)throw Error("Choose a .nam file under 12 MB and an audio file under 20 MB.");
  // Start the context during this button action. Determine the desired model rate below.
  const AC=window.AudioContext||window.webkitAudioContext;ctx=new AC({sampleRate:48000,latencyHint:"interactive"});
  const activation=ctx.resume().then(()=>null,e=>e);
  const json=await model.text(),config=JSON.parse(json);
  if(!config||typeof config!=="object"||typeof config.version!=="string"||typeof config.architecture!=="string"||!config.config||!Array.isArray(config.weights))throw Error("Invalid or unsupported NAM model file.");
  const trained=Number(config.sample_rate)||48000;
  if(![32000,44100,48000,88200,96000].includes(trained))throw Error("Unsupported model sample rate: "+trained+" Hz.");
  const activationError=await timeout(activation,5000,"Audio context did not start. Check autoplay permissions and retry.");if(activationError)throw activationError;
  if(ctx.sampleRate!==trained){await ctx.close();ctx=new AC({sampleRate:trained,latencyHint:"interactive"});await timeout(ctx.resume(),5000,"This browser cannot start the model's sample rate.");}
  if(ctx.sampleRate!==trained)throw Error("Device sample rate differs from the model. Resampling of the model itself is not supported in this lab.");
  if(token!==generation||document.hidden)throw Error("Loading cancelled.");
  setStatus("Loading neural engine…");
  let NamEngine;try{({NamEngine}=await import(runtime+"index.js"))}catch{throw Error("Neural runtime not prepared on this host. See the setup instructions below.");}
  const engine=await timeout(NamEngine.attach(ctx,{assetBaseUrl:new URL(runtime,location.href)}),20000,"Neural engine could not initialize.");
  node=await timeout(engine.createNode(),20000,"Neural node did not respond.");
  const info=await timeout(node.loadModel(json),20000,"Model loading timed out.");
  if(info.expectedSampleRate>0&&info.expectedSampleRate!==ctx.sampleRate)throw Error("Model requires "+info.expectedSampleRate+" Hz; the current context runs at "+ctx.sampleRate+" Hz.");
  setStatus("Decoding guitar recording…");const clip=await ctx.decodeAudioData(await audio.arrayBuffer());
  if(!clip.duration||clip.duration>60||clip.numberOfChannels>2)throw Error("Choose a mono or stereo recording of 60 seconds or less.");
  if(token!==generation||document.hidden)throw Error("Loading cancelled.");
  const trim=ctx.createGain(),dry=ctx.createGain(),wet=ctx.createGain(),cab=ctx.createBiquadFilter(),sum=ctx.createGain(),limiter=ctx.createDynamicsCompressor(),clipper=ctx.createWaveShaper(),out=ctx.createGain(),monitor=ctx.createGain();
  trim.gain.value=1;dry.gain.value=0;wet.gain.value=1;cab.type="lowpass";cab.Q.value=.707;cab.frequency.value=ctx.sampleRate*.48;
  limiter.threshold.value=-12;limiter.ratio.value=20;limiter.knee.value=0;limiter.attack.value=.001;limiter.release.value=.12;
  clipper.curve=Float32Array.from({length:4096},(_,i)=>Math.max(-.8,Math.min(.8,2*i/4095-1)));out.gain.value=.117;monitor.gain.value=0;
  trim.connect(node);node.connect(cab);cab.connect(wet);wet.connect(sum);dry.connect(sum);sum.connect(limiter);limiter.connect(clipper);clipper.connect(out);out.connect(monitor);monitor.connect(ctx.destination);
  ready={ctx,node,trim,dry,wet,cab,out,monitor,clip};node.addEventListener("processorerror",()=>{if(ready?.node!==node)return;stop(true);disposeReady();setStatus("Neural processing stopped unexpectedly. Reload the model.");update()});
  $("namInfo").textContent=model.name+" · "+ctx.sampleRate+" Hz · "+clip.duration.toFixed(1)+" s"+(info.slimmable?" · Slimmable model":"");
  changeMix();setProgress(0,clip.duration);setStatus("Model ready. Press Play to compare the tone, or render an amplified recording.");
 }catch(e){if(ctx&&ctx.state!=="closed")ctx.close().catch(()=>{});if(token===generation)setStatus(e.message||"Model could not load.");}
 finally{if(token===generation){loading=false;update()}}
});
function mime(){return ["audio/webm;codecs=opus","audio/ogg;codecs=opus","audio/mp4","audio/webm"].find(t=>MediaRecorder.isTypeSupported(t))||""}
function release(j){clearTimeout(j.tail);clearInterval(j.clock);try{j.source.disconnect()}catch{}if(j.destination){try{j.r.out.disconnect(j.destination)}catch{}j.destination.stream.getTracks().forEach(t=>t.stop())}j.r.monitor.gain.value=0}
function finish(j){if(job!==j)return;release(j);job=null;setProgress(j.cancelled?0:j.r.clip.duration,j.r.clip.duration);if(j.kind==="export"){if(!j.cancelled&&!j.failed&&j.chunks.length){const type=j.recorder.mimeType||j.chunks[0].type;result=new Blob(j.chunks,{type});setExport("Amplified output ready to download.");}else setExport(j.cancelled?"Render cancelled.":"Render failed; try another browser.");}else setStatus(j.cancelled?"Playback stopped.":"Playback finished.");changeMix();update()}
function stop(cancelled=true){const j=job;if(!j)return;j.cancelled=cancelled;clearTimeout(j.tail);try{j.source.stop()}catch{}j.r.monitor.gain.value=0;if(j.recorder&&j.recorder.state!=="inactive"){try{j.recorder.stop()}catch{j.failed=true;finish(j)}}else if(!j.recorder)finish(j)}
async function start(kind){
 if(!ready||job||loading)return;const r=ready;if(kind==="export"&&!window.MediaRecorder)return;
 const source=r.ctx.createBufferSource();source.buffer=r.clip;source.connect(r.trim);source.connect(r.dry);const j={r,source,kind,recorder:null,destination:null,chunks:[],cancelled:false,failed:false,clock:null,tail:null};job=j;update();
 try{
  await timeout(r.ctx.resume(),5000,"Audio playback did not start.");
  if(job!==j||j.cancelled)return;
  if(kind==="export"){
   clearResult();j.destination=r.ctx.createMediaStreamDestination();r.out.connect(j.destination);
   const type=mime();j.recorder=new MediaRecorder(j.destination.stream,type?{mimeType:type}:{});
   j.recorder.ondataavailable=e=>{if(e.data.size)j.chunks.push(e.data)};j.recorder.onerror=()=>{j.failed=true;stop(false)};j.recorder.onstop=()=>finish(j);
   r.monitor.gain.value=0;changeMix();j.recorder.start(250);setExport("Rendering amplified audio…");
  }else{changeMix();r.monitor.gain.value=1;setStatus("Playing recording. Use Hear original to compare.");}
  // Let scheduled mix gain settle before the first input sample.
  j.started=r.ctx.currentTime+.08;source.start(j.started);
  j.clock=setInterval(()=>setProgress(Math.max(0,r.ctx.currentTime-j.started),r.clip.duration),100);
  source.onended=()=>{if(job!==j||j.cancelled)return;if(kind==="export"){j.tail=setTimeout(()=>stop(false),180)}else finish(j)};
 }catch(e){j.failed=true;if(j.recorder&&j.recorder.state!=="inactive")stop(false);else finish(j);setStatus(e.message||"Playback unavailable.");}
}
$("namPlay").addEventListener("click",()=>start("preview"));$("namExport").addEventListener("click",()=>start("export"));$("namStop").addEventListener("click",()=>stop(true));$("namBypass").addEventListener("click",()=>{bypass=!bypass;changeMix();update()});
$("namDownload").addEventListener("click",()=>{if(!result)return;const t=result.type,ext=t.includes("mp4")?"m4a":t.includes("ogg")?"ogg":"webm";if(resultURL)URL.revokeObjectURL(resultURL);resultURL=URL.createObjectURL(result);const a=document.createElement("a");a.href=resultURL;a.download="neural-guitar."+ext;document.body.append(a);a.click();a.remove()});
document.addEventListener("visibilitychange",()=>{if(document.hidden){stop(true);if(loading){generation++;loading=false;setStatus("Loading cancelled when the tab was hidden.");update()}}});
window.addEventListener("pagehide",()=>{generation++;stop(true);disposeReady();clearResult()});update();
