"use strict";
(() => {
const el=id=>document.getElementById(id);
const gear=[
["katana","Boss Katana-50 Gen 3","amp","value","Versatile modeling combo with onboard effects",["clean","british","lead","metal"]],
["champion","Fender Champion II 25","amp","budget","Affordable clean and modeled drive tones",["clean","british","lead"]],
["fender","Fender Blues Junior IV","amp","premium","Small tube combo with clean and breakup tones",["clean"]],
["dsl","Marshall DSL5CR","amp","premium","British tube crunch in a compact combo",["british","lead"]],
["peavey","Peavey 6505 MH","amp","premium","High-gain amplifier head; needs a compatible cabinet or load",["metal"]],
["orange","Orange Crush 35RT","amp","value","Solid-state combo with a driven channel",["british","lead","metal"]],
["sd1","Boss SD-1 Super OverDrive","drive","budget","Mid-forward overdrive",["overdrive"]],
["ts9","Ibanez TS9 Tube Screamer","drive","value","Mid-focused overdrive for leads and tightening gain",["overdrive"]],
["ds1","Boss DS-1 Distortion","drive","budget","Classic hard-clipping distortion",["distortion"]],
["rat","Pro Co RAT 2","drive","value","Distortion with adjustable filter",["distortion","fuzz"]],
["muff","Electro-Harmonix Big Muff Pi","drive","value","Sustained saturated fuzz",["fuzz"]],
["fuzzface","Dunlop Fuzz Face Mini","drive","premium","Vintage-style fuzz",["fuzz"]],
["comp","MXR Dyna Comp","comp","value","Classic guitar compression",[]],
["compbudget","Behringer CS400 Compressor Sustainer","comp","budget","Entry-level compression",[]],
["ns2","Boss NS-2 Noise Suppressor","gate","value","Noise suppression for high-gain rigs",[]],
["gatebudget","Donner Noise Killer","gate","budget","Basic noise gate",[]],
["ce2","Boss CE-2W Chorus","mod","premium","Classic chorus voicing",["chorus"]],
["chorus","TC Electronic June-60 Chorus","mod","budget","Simple chorus modulation",["chorus"]],
["bf3","Boss BF-3 Flanger","mod","value","Adjustable flanging",["flange"]],
["dd8","Boss DD-8 Digital Delay","delay","value","Multiple delay modes",[]],
["delaybudget","TC Electronic The Prophet Digital Delay","delay","budget","Simple digital delay",[]],
["hof","TC Electronic Hall of Fame 2 Reverb","verb","value","Multiple reverb types",[]],
["verb","TC Electronic Skysurfer Reverb","verb","budget","Simple reverb pedal",[]],
["zoom","Zoom G1X Four","multi","budget","All-in-one entry-level multi-effects and amp models",[]],
["bossme","Boss ME-90","multi","value","All-in-one multi-effects and amp modeling",[]],
["hx","Line 6 HX Stomp","multi","premium","Compact amp and effects modeling",[]],
["scarlett","Focusrite Scarlett Solo","accessory","value","Direct guitar input for cleaner recordings; not required",[]],
["irig","IK Multimedia iRig HD X","accessory","value","Portable guitar interface; check device compatibility",[]],
["headphones","Sony MDR-7506","accessory","value","Wired monitoring headphones",[]],
["crybaby","Dunlop GCB95 Cry Baby Wah","wah","value","Manual sweep wah pedal",[]],
["trem","Boss TR-2 Tremolo","trem","value","Adjustable amplitude modulation",[]]
].map(([id,name,kind,tier,description,matches])=>({id,name,kind,tier,description,matches}));
const byId=new Map(gear.map(p=>[p.id,p]));
const tiers=["budget","value","premium"];
const kinds={wah:"Wah",trem:"Tremolo",amp:"Amplifier",drive:"Drive / fuzz",comp:"Compressor",gate:"Noise gate",mod:"Modulation",delay:"Delay",verb:"Reverb",multi:"All-in-one alternative",accessory:"Optional recording accessories"};
const key="ogt.amp.rigs.v1", maxRigs=100;
const fields=[...Object.values(specs).flat().map(x=>x[0]),...toggles,"guitar","amp","cab","driveType","modType","bypass","pickup","hum","preOrder","postOrder"];
const unique=a=>Array.from(new Set(Array.isArray(a)?a.filter(x=>typeof x==="string"&&byId.has(x)):[]));
function cleanSettings(o){
 const out={}; if(!o||typeof o!=="object")return out;
 for(const group of Object.values(specs))for(const [id,,min,max] of group)if(typeof o[id]==="number"&&Number.isFinite(o[id]))out[id]=Math.round(Math.max(min,Math.min(max,o[id])));
 for(const id of [...toggles,"bypass"])if(typeof o[id]==="boolean")out[id]=o[id];
 for(const id of ["guitar","amp","cab","driveType","modType","pickup","hum","preOrder","postOrder"])if(typeof o[id]==="string"&&Array.from(el(id).options).some(x=>x.value===o[id]))out[id]=o[id];
 return out;
}
function cleanRig(r){
 if(!r||typeof r!=="object"||!r.settings||typeof r.settings!=="object")return null;
 return {id:typeof r.id==="string"?r.id.slice(0,80):"",name:typeof r.name==="string"?r.name.trim().slice(0,60)||"My rig":"My rig",settings:cleanSettings(r.settings),gear:unique(r.gear),owned:unique(r.owned),tier:tiers.includes(r.tier)?r.tier:"value"};
}
let state={rigs:[],saved:[],owned:[],tier:"value"},persistOK=true;
try{const data=JSON.parse(localStorage.getItem(key)||"null");if(data&&typeof data==="object"){state.rigs=(Array.isArray(data.rigs)?data.rigs:[]).map(cleanRig).filter(r=>r&&r.id).slice(0,maxRigs);state.saved=unique(data.saved);state.owned=unique(data.owned);state.tier=tiers.includes(data.tier)?data.tier:"value"}}catch{persistOK=false}
const msg=s=>el("rigStatus").textContent=s;
function persist(){try{localStorage.setItem(key,JSON.stringify(state));persistOK=true;return true}catch{persistOK=false;msg("Browser storage unavailable or full. Changes are available for this session only.");return false}}
function snapshot(){return Object.fromEntries(fields.map(id=>[id,el(id).type==="checkbox"?el(id).checked:el(id).type==="range"?Number(el(id).value):el(id).value]))}
let currentRigId=null,rigGear=[];
function capture(name){return {name:name.trim().slice(0,60)||"My rig",settings:snapshot(),gear:unique([...rigGear,...recommend().filter(p=>!state.owned.includes(p.id)).map(p=>p.id)]),owned:[...state.owned],tier:state.tier}}
function restore(r){const c=cleanRig(r);if(!c)return;
 const vals=c.settings;
 for(const [id,v] of Object.entries(vals)){if(id==="volume"){el(id).value=Math.min(Number(el(id).value),v);continue}if(id==="input"&&mode==="mic"){el(id).value=Math.min(Number(el(id).value),v);continue}if(typeof v==="boolean")el(id).checked=v;else el(id).value=v}
 showValues();apply();el("preset").value="";el("rigName").value=c.name;rigGear=c.gear;state.tier=c.tier;el("gearTier").value=c.tier;renderGear();
 msg("Rig loaded. Output never increases automatically; input gain is limited during live monitoring.");
}
function recommend(){
 const s=snapshot(),active=[["amp",s.amp],...(s.driveOn?[["drive",s.driveType]]:[]),...(s.compOn?[["comp",""]]:[]),...(s.gateOn?[["gate",""]]:[]),...(s.modOn?[["mod",s.modType]]:[]),...(s.delayOn?[["delay",""]]:[]),...(s.verbOn?[["verb",""]]:[]),...(s.wahOn?[["wah",""]]:[]),...(s.tremOn?[["trem",""]]:[]),["multi",""]];
 const rank=p=>Math.abs(tiers.indexOf(p.tier)-tiers.indexOf(state.tier));
 return active.flatMap(([kind,match])=>gear.filter(p=>p.kind===kind&&(!match||p.matches.includes(match))).sort((a,b)=>rank(a)-rank(b)).slice(0,2));
}
function make(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e}
function button(text,fn){const b=make("button",text);b.type="button";b.addEventListener("click",fn);return b}
function amazon(p){const u=new URL("https://www.amazon.com/s");u.searchParams.set("k",p.name);u.searchParams.set("tag","guitar-tuner0a-20");return u.href}
function reverb(p){const u=new URL("https://reverb.com/marketplace");u.searchParams.set("query",p.name);return u.href}
function link(text,url,paid){const a=make("a",text);a.href=url;a.target="_blank";a.rel=paid?"sponsored noopener":"noopener";return a}
function toggleList(list,id){const a=state[list];state[list]=a.includes(id)?a.filter(x=>x!==id):[...a,id];persist();renderGear();renderRigs()}
function gearCard(p){const card=make("article",undefined,"gear-item"),owned=state.owned.includes(p.id),saved=state.saved.includes(p.id);
 card.append(make("h3",p.name),make("p",kinds[p.kind]+" · "+p.tier+(owned?" · Already owned":""),"small muted"),make("p",p.description,"small"));
 const links=make("div",undefined,"actions");links.append(link("Amazon (paid link)",amazon(p),true),link("Reverb (not affiliated)",reverb(p),false));card.append(links);
 const controls=make("div",undefined,"actions");controls.append(button(saved?"Remove from wishlist":"Save gear",()=>toggleList("saved",p.id)),button(owned?"Mark not owned":"I own this",()=>toggleList("owned",p.id)));card.append(controls);return card}
function renderGear(){
 const list=el("gearResults");list.replaceChildren();const items=recommend().filter(p=>!el("hideOwned").checked||!state.owned.includes(p.id));
 if(on("bypass"))list.append(make("p","Effects are bypassed. Recommendations reflect the selected rig, not the original sound.","muted"));
 for(const p of items)list.append(gearCard(p));
 const wish=el("wishlist");wish.replaceChildren();for(const id of state.saved)wish.append(gearCard(byId.get(id)));if(!state.saved.length)wish.append(make("p","Save equipment here while trying tones.","muted"));
 const owned=el("ownedList");owned.replaceChildren();for(const id of state.owned)owned.append(button("Remove "+byId.get(id).name,()=>toggleList("owned",id)));if(!state.owned.length)owned.append(make("p","No gear marked as owned.","muted"));
 const rg=el("currentRigGear");rg.replaceChildren();for(const id of rigGear)rg.append(gearCard(byId.get(id)));el("currentRigGearWrap").hidden=!rigGear.length;
}
function renderRigs(){const list=el("rigList");list.replaceChildren();if(!state.rigs.length)list.append(make("p","No saved rigs yet.","muted"));
 for(const r of state.rigs){const card=make("article",undefined,"gear-item");card.append(make("h3",r.name),make("p",String(r.settings.amp||"Custom")+" · "+r.gear.length+" suggested products","small muted"));const b=make("div",undefined,"actions");b.append(button("Load",()=>{currentRigId=r.id;restore(r)}),button("Share",()=>share(r)),button("Delete",()=>{state.rigs=state.rigs.filter(x=>x.id!==r.id);if(currentRigId===r.id)currentRigId=null;persist();renderRigs()}));card.append(b);list.append(card)}
}
function share(r){
 // Share only rig settings, name, and suggested product IDs. Never include ownership, affiliate tags, recordings or visitor identifiers.
 const data={v:1,name:r.name,settings:{...r.settings},gear:r.gear,tier:r.tier};delete data.settings.volume;
 const u=new URL(location.href);u.search="";u.hash="rig="+encodeURIComponent(JSON.stringify(data));el("shareURL").value=u.href;el("shareWrap").hidden=false;el("shareURL").focus();el("shareURL").select();
 if(navigator.clipboard?.writeText)navigator.clipboard.writeText(u.href).then(()=>msg("Share link copied. Anyone with it can load these settings.")).catch(()=>msg("Copy the selected share link."));else msg("Copy the selected share link.");
}
el("saveRig").addEventListener("click",()=>{if(state.rigs.length>=maxRigs){msg("100 saved rigs maximum. Delete one or update an existing rig.");return}const r=capture(el("rigName").value);r.id=globalThis.crypto?.randomUUID?.()||String(Date.now())+"-"+Math.random().toString(36).slice(2);state.rigs.unshift(r);currentRigId=r.id;if(persist())msg("Rig saved on this device.");renderRigs()});
el("updateRig").addEventListener("click",()=>{const i=state.rigs.findIndex(r=>r.id===currentRigId);if(i<0){msg("Load or save a rig first.");return}state.rigs[i]={...capture(el("rigName").value),id:currentRigId};if(persist())msg("Saved rig updated.");renderRigs()});
el("shareRig").addEventListener("click",()=>share(capture(el("rigName").value)));
el("gearTier").value=state.tier;el("gearTier").addEventListener("change",()=>{state.tier=el("gearTier").value;persist();renderGear()});el("hideOwned").addEventListener("change",renderGear);
for(const id of ["amp","driveType","modType","bypass",...toggles,"preset","reset"])el(id).addEventListener(id==="reset"?"click":"change",renderGear);
el("exportRigs").addEventListener("click",()=>{const b=new Blob([JSON.stringify({version:1,...state},null,2)],{type:"application/json"});download(b,"my-guitar-rigs.json")});
el("importRigs").addEventListener("change",async()=>{try{const f=el("importRigs").files[0];if(!f||f.size>500000)throw Error("Choose a JSON backup under 500 KB.");const d=JSON.parse(await f.text());if(d.version!==1||!Array.isArray(d.rigs))throw Error("Unsupported backup format.");const imported=d.rigs.map(cleanRig).filter(Boolean);for(const r of imported){if(state.rigs.length>=maxRigs)break;r.id=globalThis.crypto?.randomUUID?.()||String(Date.now())+"-"+Math.random().toString(36).slice(2);state.rigs.push(r)}state.saved=unique([...state.saved,...unique(d.saved)]);state.owned=unique([...state.owned,...unique(d.owned)]);if(persist())msg("Backup imported (up to 100 rigs total).");renderGear();renderRigs()}catch(e){msg("Import failed: "+e.message)}finally{el("importRigs").value=""}});
function download(blob,name){const u=URL.createObjectURL(blob),a=make("a");a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000)}
if(location.hash.startsWith("#rig=")&&location.hash.length<12000){try{const d=JSON.parse(decodeURIComponent(location.hash.slice(5)));if(d.v===1&&cleanRig(d)){el("loadShared").hidden=false;el("loadShared").addEventListener("click",()=>{currentRigId=null;restore(d);el("loadShared").hidden=true})}}catch{msg("Invalid shared rig link.")}}
renderGear();renderRigs();if(!persistOK)msg("Browser storage is unavailable; rigs may not persist.");
// Synthetic pluck demo, original generated audio rather than a recording or commercial song.
function demoWav(){
 const sr=24000,seconds=8,arr=new Float32Array(sr*seconds);
 let seed=12345;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296*2-1};
 const notes=[[0,82.41],[.42,123.47],[.85,164.81],[1.25,196],[1.65,246.94],[2.1,329.63],[2.55,246.94],[3,196],[3.5,82.41],[3.53,123.47],[3.56,164.81],[4.4,110],[4.43,164.81],[4.46,220],[5.3,98],[5.33,146.83],[5.36,196],[6.2,82.41],[6.23,123.47],[6.26,164.81]];
 for(const [time,f] of notes){const length=Math.round(sr/f),buf=Float32Array.from({length},rnd),start=Math.round(time*sr);let idx=0;for(let i=0;i<sr*1.7&&start+i<arr.length;i++){const next=(idx+1)%length,v=buf[idx];buf[idx]=.997*(v+buf[next])*.5;idx=next;arr[start+i]+=v*.19*Math.min(1,i/100)*Math.exp(-i/(sr*1.4))}}
 const ab=new ArrayBuffer(44+arr.length*2),v=new DataView(ab);const str=(offset,s)=>{for(let i=0;i<s.length;i++)v.setUint8(offset+i,s.charCodeAt(i))};str(0,"RIFF");v.setUint32(4,ab.byteLength-8,true);str(8,"WAVE");str(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,sr,true);v.setUint32(28,sr*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,"data");v.setUint32(40,arr.length*2,true);for(let i=0;i<arr.length;i++)v.setInt16(44+2*i,Math.round(Math.max(-1,Math.min(1,arr[i]))*32767),true);return new Blob([ab],{type:"audio/wav"});
}
el("demo").addEventListener("click",async()=>{if(busy||rec||liveRec)return;busy=true;ui();status("Loading generated guitar demo…");let timer;try{disconnect();if(fileURL)URL.revokeObjectURL(fileURL);fileURL=URL.createObjectURL(demoWav());media.src=fileURL;media.hidden=false;media.load();build();attachMedia();el("guitar").value="direct";apply();const started=Promise.all([ctx.resume(),media.play()]);await Promise.race([started,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error("Playback did not start. Press Play to retry.")),5000)})]);status("Playing a generated plucked-string demo (not a real guitar recording).")}catch(e){media.pause();status("Demo loaded; "+e.message)}finally{clearTimeout(timer);busy=false;ui()}});
// Dual capture: direct microphone stream + processed studio output. No automatic downloads.
let liveRec=null,calibration=null,takeSeq=0,takes=[],selectedTake=null,takeURL=null;
const takePreview=el("takePreview"),takeStatus=message=>el("takeStatus").textContent=message;
function takeTime(seconds){const t=Math.max(0,Math.floor(seconds));return String(Math.floor(t/60)).padStart(2,"0")+":"+String(t%60).padStart(2,"0")}
function takeBlob(part){return part&&!part.failed&&part.chunks.length?new Blob(part.chunks,{type:part.recorder.mimeType||part.chunks[0].type||"application/octet-stream"}):null}
function takeExt(blob){return blob.type.includes("mp4")?"m4a":blob.type.includes("ogg")?"ogg":blob.type.includes("wav")?"wav":"webm"}
function currentTake(){return takes.find(t=>t.id===selectedTake)}
function unloadPreview(){takePreview.pause();if(takeURL){URL.revokeObjectURL(takeURL);takeURL=null;takePreview.removeAttribute("src");takePreview.load()}}
function previewTake(){
 unloadPreview();const t=currentTake();if(!t||mode==="mic"||busy||rec||liveRec)return;
 const blob=t[el("takeVersion").value];if(!blob){takeStatus("This version is unavailable. Choose the other recording.");return}
 takeURL=URL.createObjectURL(blob);takePreview.src=takeURL;takePreview.load();
}
function renderTakes(){
 const list=el("takeSelect");list.replaceChildren();for(const t of takes){const opt=make("option");opt.value=t.id;opt.textContent=t.name+" · "+takeTime(t.seconds);list.append(opt)}
 if(!currentTake())selectedTake=takes.at(-1)?.id??null;list.value=selectedTake??"";el("takeReview").hidden=!takes.length;
 const t=currentTake();if(t&&!t[el("takeVersion").value])el("takeVersion").value=t.wet?"wet":"dry";previewTake();
}
function takeUI(){
 const t=currentTake(),blocked=mode==="mic"||busy||!!rec||!!liveRec;
 el("takeReview").hidden=!takes.length||blocked;
 for(const [id,key] of [["saveWet","wet"],["saveDry","dry"],["reampTake","dry"]])el(id).disabled=blocked||!t?.[key];
 el("deleteTake").disabled=blocked||!t;el("takeSelect").disabled=blocked;el("takeVersion").disabled=blocked;
 if(blocked&&takeURL)unloadPreview();
}
const previousUI=ui;ui=function(){previousUI();el("demo").disabled=busy||!!rec||!!liveRec;el("recordLive").disabled=busy||!!rec||!!liveRec||mode!=="mic"||!window.MediaRecorder||takes.length>=5;el("stopLive").disabled=!liveRec||!!liveRec.stopping;el("calibrate").disabled=busy||!!rec||!!liveRec||!!calibration||mode!=="mic";if(liveRec){el("file").disabled=true;el("export").disabled=true}takeUI()};
const previousDisconnect=disconnect;disconnect=function(){if(liveRec)stopLive();if(calibration){clearTimeout(calibration.timer);calibration=null}previousDisconnect()};
function stopLive(){
 const job=liveRec;if(!job||job.stopping)return;job.stopping=true;clearTimeout(job.timer);clearInterval(job.clock);job.seconds=(performance.now()-job.started)/1000;el("takeTimer").textContent=takeTime(job.seconds);takeStatus("Finishing take…");
 for(const part of job.parts){if(part.recorder.state!=="inactive"){try{part.recorder.stop()}catch{part.failed=true;part.done=true}}else if(!part.started){part.done=true}}
 finalizeTake(job);ui();
}
function finalizeTake(job){
 if(liveRec!==job||!job.parts.every(p=>p.done))return;clearTimeout(job.timer);clearInterval(job.clock);liveRec=null;
 const dry=takeBlob(job.parts.find(p=>p.kind==="dry")),wet=takeBlob(job.parts.find(p=>p.kind==="wet"));
 if(dry||wet){const t={id:String(++takeSeq),name:"Take "+takeSeq,seconds:job.seconds??(performance.now()-job.started)/1000,dry,wet,settings:job.settings};takes.push(t);selectedTake=t.id;el("takeVersion").value=wet?"wet":"dry";renderTakes();takeStatus(dry&&wet?"Take ready. Preview, download either version, or try a different tone.":"Only one version was captured. Download the available recording.");status("Recording finished. Review your take below.")}
 else{takeStatus("Recording failed. Check microphone permissions and try again.");status("Recording unavailable.")}
 ui();
}
el("recordLive").addEventListener("click",()=>{
 if(mode!=="mic"||!stream||liveRec||rec||busy||takes.length>=5)return;
 let job=null;
 try{
  const mime=format(false);const parts=[];
  // Separate recorders start in the same user action; codecs can add different delays.
  for(const [kind,inputStream] of [["dry",stream],["wet",g.record.stream]]){
   const recorder=new MediaRecorder(inputStream,mime?{mimeType:mime}:{});parts.push({kind,recorder,chunks:[],failed:false,started:false,done:false});
  }
  job={parts,started:performance.now(),settings:snapshot(),stopping:false,timer:0,clock:0};liveRec=job;
  for(const part of parts){
   part.recorder.ondataavailable=e=>{if(e.data.size)part.chunks.push(e.data)};
   part.recorder.onerror=()=>{part.failed=true;stopLive();if(mode==="mic")disconnect()};
   part.recorder.onstop=()=>{part.done=true;if(!job.stopping){stopLive();if(mode==="mic")disconnect()}finalizeTake(job)};
   part.recorder.start(500);part.started=true;
  }
  el("takeTimer").textContent="00:00";job.clock=setInterval(()=>{if(liveRec===job)el("takeTimer").textContent=takeTime((performance.now()-job.started)/1000)},250);
  job.timer=setTimeout(()=>{stopLive();if(mode==="mic")disconnect()},600000);
  takeStatus("Recording original and amplified audio. Finish the take when ready (10-minute limit).");status("Recording a take…");ui();
 }catch(e){if(job){for(const p of job.parts)if(!p.started)p.done=true;stopLive()}takeStatus("Recording failed: "+e.message);ui()}
});
el("stopLive").addEventListener("click",()=>{stopLive();if(mode==="mic")disconnect()});
el("takeSelect").addEventListener("change",()=>{selectedTake=el("takeSelect").value;previewTake();takeUI()});
el("takeVersion").addEventListener("change",previewTake);
takePreview.addEventListener("play",()=>{if(mode==="mic"||busy||rec||liveRec){takePreview.pause();return}media.pause()});
media.addEventListener("play",()=>takePreview.pause());
for(const id of ["mic","demo","export","file","wavExport","metroStart"])el(id).addEventListener(id==="file"?"change":"click",()=>takePreview.pause(),true);
for(const [id,key,suffix] of [["saveWet","wet","amplified"],["saveDry","dry","original"]])el(id).addEventListener("click",()=>{const t=currentTake(),blob=t?.[key];if(blob&&!el(id).disabled)download(blob,"guitar-take-"+t.id+"-"+suffix+"."+takeExt(blob))});
el("reampTake").addEventListener("click",()=>{
 const t=currentTake();if(!t?.dry||el("reampTake").disabled)return;
 try{unloadPreview();disconnect();if(fileURL)URL.revokeObjectURL(fileURL);fileURL=URL.createObjectURL(t.dry);media.src=fileURL;media.hidden=false;media.load();build();attachMedia();status("Original take loaded. Pick a tone and press Play; export to save a new amplified version.");takeStatus("Original loaded into the studio. Your saved take is unchanged.")}
 catch(e){takeStatus("Unable to load take: "+e.message)}ui();
});
el("deleteTake").addEventListener("click",()=>{const t=currentTake();if(!t||el("deleteTake").disabled||!window.confirm("Delete this take from the current tab? Downloaded files are unaffected."))return;unloadPreview();takes=takes.filter(x=>x!==t);selectedTake=null;renderTakes();takeStatus("Take deleted from this tab.");ui()});
window.addEventListener("pagehide",unloadPreview);
window.addEventListener("beforeunload",e=>{if(takes.length||liveRec){e.preventDefault();e.returnValue=""}});
el("calibrate").addEventListener("click",()=>{if(mode!=="mic"||calibration)return;const samples=[],a=new Float32Array(g.analyser.fftSize),started=performance.now();status("Play normally for three seconds to calibrate input gain.");const job={timer:0};calibration=job;ui();
 const sample=()=>{if(calibration!==job||mode!=="mic")return;g.analyser.getFloatTimeDomainData(a);let sum=0,peak=0;for(const x of a){sum+=x*x;peak=Math.max(peak,Math.abs(x))}const rms=20*Math.log10(Math.max(1e-8,Math.sqrt(sum/a.length)));if(rms>-65)samples.push({rms,peak});if(performance.now()-started<3000){job.timer=setTimeout(sample,60);return}calibration=null;if(samples.length<5){status("Input too quiet. Move microphone closer and try again.")}else{samples.sort((a,b)=>a.rms-b.rms);const typical=samples[Math.floor(samples.length*.75)].rms,peak=Math.max(...samples.map(x=>x.peak));const delta=Math.min(6,-26-typical,20*Math.log10(.7/Math.max(.001,peak)));el("input").value=Math.max(0,Math.min(24,Math.round(n("input")+delta)));showValues();apply();status("Calibration complete. Input gain "+n("input")+" dB. Repeat if needed.")}ui()};sample()});
// Custom user-supplied speaker IR, with filtered cabinet path retained as fallback.
let customIR=null,irNodes=null,irLoad=0;
function ensureIR(){if(irNodes)return;const conv=ctx.createConvolver(),wet=ctx.createGain(),dry=ctx.createGain(),sum=ctx.createGain();wet.gain.value=0;dry.gain.value=1;g.cabLP.disconnect(g.cabOut);g.cabLP.connect(dry);g.cabLP.connect(conv);conv.connect(wet);dry.connect(sum);wet.connect(sum);sum.connect(g.cabOut);irNodes={conv,wet,dry}}
el("irFile").addEventListener("change",async()=>{const token=++irLoad;try{const f=el("irFile").files[0];if(!f||f.size>10000000)throw Error("Choose an impulse response under 10 MB.");build();const b=await ctx.decodeAudioData(await f.arrayBuffer());if(token!==irLoad)return;if(b.duration>2||b.numberOfChannels>2)throw Error("Use a mono or stereo speaker IR of two seconds or less.");ensureIR();customIR=b;irNodes.conv.buffer=b;irNodes.wet.gain.setTargetAtTime(1,ctx.currentTime,.03);irNodes.dry.gain.setTargetAtTime(0,ctx.currentTime,.03);el("irStatus").textContent="Custom IR active (not included in shared or saved rigs).";el("clearIR").disabled=false}catch(e){if(token===irLoad)el("irStatus").textContent="IR unavailable: "+e.message}finally{el("irFile").value=""}});
el("clearIR").addEventListener("click",()=>{irLoad++;if(irNodes){irNodes.wet.gain.setTargetAtTime(0,ctx.currentTime,.03);irNodes.dry.gain.setTargetAtTime(1,ctx.currentTime,.03)}customIR=null;el("clearIR").disabled=true;el("irStatus").textContent="Using the built-in cabinet voicing."});

// Studio workflow: bounded local history, explicit recovery, A/B snapshots and tone suggestions.
const sessionKey="ogt.amp.session.v1",shoppingKey="ogt.amp.shopping.v1";
const toneSnapshot=()=>{const v=snapshot();delete v.volume;return v};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
let past=[],future=[],current=toneSnapshot(),historyTimer=0,restoring=false,slots={A:null,B:null},activeSlot=null,measurements={A:null,B:null},matchTrim=1,measurementJob=null,outputAnalyser=null;
function historyUI(){
 el("undoTone").disabled=!past.length;el("redoTone").disabled=!future.length;
 for(const slot of ["A","B"]){el("load"+slot).disabled=!slots[slot];el("measure"+slot).disabled=!slots[slot]||activeSlot!==slot||mode!=="file"||media.paused||!!rec||!!measurementJob;el("slot"+slot).textContent=slots[slot]?(activeSlot===slot?"Selected":"Saved")+(measurements[slot]!==null?" · "+measurements[slot].toFixed(1)+" dBFS":""):"Empty"}
 el("levelMatch").disabled=measurements.A===null||measurements.B===null;
}
function saveSession(){try{localStorage.setItem(sessionKey,JSON.stringify({v:1,settings:toneSnapshot(),name:el("rigName").value.slice(0,60)}))}catch{}}
function flushHistory(){clearTimeout(historyTimer);historyTimer=0;if(restoring)return;const next=toneSnapshot();if(equal(next,current))return;past.push(current);if(past.length>80)past.shift();current=next;future=[];activeSlot=null;matchTrim=1;apply();saveSession();historyUI()}
function scheduleHistory(){if(restoring)return;clearTimeout(historyTimer);historyTimer=setTimeout(flushHistory,180)}
function applyTone(vals){
 restoring=true;const safe=cleanSettings(vals);
 for(const [id,v] of Object.entries(safe)){if(id==="volume")continue;if(id==="input"&&mode==="mic"){el(id).value=Math.min(n("input"),v);continue}if(typeof v==="boolean")el(id).checked=v;else el(id).value=v}
 el("preset").value="";showValues();apply();renderGear();restoring=false;
}
function navigateHistory(from,to){flushHistory();if(!from.length)return;to.push(current);const next=from.pop();activeSlot=null;matchTrim=1;applyTone(next);current=toneSnapshot();saveSession();historyUI()}
el("undoTone").addEventListener("click",()=>navigateHistory(past,future));
el("redoTone").addEventListener("click",()=>navigateHistory(future,past));
const priorApply=apply;apply=function(){priorApply();if(g&&matchTrim<1)g.volume.gain.setTargetAtTime(n("volume")/100*.8*matchTrim,ctx.currentTime,.02);if(!restoring)scheduleHistory()};
for(const id of fields)if(id!=="volume")el(id).addEventListener(el(id).type==="range"?"change":"change",scheduleHistory);
el("rigName").addEventListener("change",saveSession);
function matchedGain(slot){return on("levelMatch")&&measurements.A!==null&&measurements.B!==null?Math.max(.1,Math.min(1,db(Math.min(measurements.A,measurements.B)-measurements[slot]))):1}
function selectSlot(slot){flushHistory();if(!slots[slot])return;const before=current;activeSlot=slot;matchTrim=matchedGain(slot);applyTone(slots[slot]);current=toneSnapshot();if(!equal(before,current)){past.push(before);if(past.length>80)past.shift();future=[]}saveSession();historyUI();el("compareStatus").textContent="Loaded tone "+slot+(matchTrim<1?" with "+(20*Math.log10(matchTrim)).toFixed(1)+" dB level trim.":".")}
for(const slot of ["A","B"]){
 el("save"+slot).addEventListener("click",()=>{flushHistory();slots[slot]=toneSnapshot();measurements[slot]=null;activeSlot=slot;matchTrim=1;apply();historyUI();el("compareStatus").textContent="Captured tone "+slot+"."});
 el("load"+slot).addEventListener("click",()=>selectSlot(slot));
 el("measure"+slot).addEventListener("click",()=>{
 if(!g||mode!=="file"||media.paused||rec||activeSlot!==slot||measurementJob)return;
 if(!outputAnalyser){outputAnalyser=ctx.createAnalyser();outputAnalyser.fftSize=2048;g.safety.connect(outputAnalyser)}
 const job={slot,started:performance.now(),sum:0,count:0,samples:0};measurementJob=job;historyUI();const a=new Float32Array(outputAnalyser.fftSize);
 const run=()=>{if(measurementJob!==job)return;if(mode!=="file"||media.paused||activeSlot!==slot||rec||document.hidden){measurementJob=null;historyUI();el("compareStatus").textContent="Measurement interrupted. Replay the same excerpt and try again.";return}
 outputAnalyser.getFloatTimeDomainData(a);let sum=0;for(const x of a)sum+=x*x;if(sum/a.length>1e-7){job.sum+=sum;job.count+=a.length;job.samples++}
 if(performance.now()-job.started<2400){setTimeout(run,65);return}
 measurementJob=null;if(job.samples<8){el("compareStatus").textContent="Not enough audible signal to measure."}else{measurements[slot]=20*Math.log10(Math.sqrt(job.sum/job.count));matchTrim=matchedGain(slot);apply();el("compareStatus").textContent="Measured tone "+slot+". Replay the same excerpt for the other tone."}historyUI()};run();
 });
}
el("levelMatch").addEventListener("change",()=>{matchTrim=activeSlot?matchedGain(activeSlot):1;apply();el("compareStatus").textContent=on("levelMatch")?"Comparison attenuates the louder measured tone; output never boosts above your volume setting.":"Level matching off."});
let recovery=null;try{const x=JSON.parse(localStorage.getItem(sessionKey)||"null");if(x?.v===1&&x.settings&&typeof x.settings==="object")recovery=x}catch{}
el("restoreSession").hidden=!recovery;el("discardSession").hidden=!recovery;
el("restoreSession").addEventListener("click",()=>{if(!recovery)return;const before=current;applyTone(recovery.settings);el("rigName").value=typeof recovery.name==="string"?recovery.name.slice(0,60):"";current=toneSnapshot();if(!equal(before,current))past.push(before);future=[];activeSlot=null;matchTrim=1;el("restoreSession").hidden=el("discardSession").hidden=true;saveSession();historyUI();msg("Previous session restored. Microphone and files are never reopened automatically.")});
el("discardSession").addEventListener("click",()=>{recovery=null;try{localStorage.removeItem(sessionKey)}catch{}el("restoreSession").hidden=el("discardSession").hidden=true;msg("Previous session discarded.")});
window.addEventListener("pagehide",()=>{flushHistory();if(!recovery||el("restoreSession").hidden)saveSession()});
const previousUI2=ui;ui=function(){previousUI2();historyUI()};
media.addEventListener("pause",historyUI);media.addEventListener("playing",historyUI);
setInterval(()=>{if(!ctx){el("latencyEstimate").textContent="—";return}const vals=[ctx.baseLatency,ctx.outputLatency].filter(x=>Number.isFinite(x)&&x>=0);el("latencyEstimate").textContent=vals.length?Math.round(vals.reduce((a,b)=>a+b,0)*1000)+" ms (reported output path only)":"Not reported by browser";historyUI()},500);
document.addEventListener("keydown",e=>{if(!e.altKey||e.ctrlKey||e.metaKey||e.repeat||e.target?.matches("input,textarea,select,button,[contenteditable]"))return;if(e.key.toLowerCase()==="a"&&slots.A){e.preventDefault();selectSlot("A")}else if(e.key.toLowerCase()==="b"&&slots.B){e.preventDefault();selectSlot("B")}else if(e.key.toLowerCase()==="x"){e.preventDefault();el("bypass").checked=!on("bypass");apply();renderGear()}});
// Rule-based tone finder: local matching, no remote AI or data transmission.
const genrePreset={rock:"Classic rock — AC/DC inspired",metal:"Metal — Metallica inspired",blues:"Blues breakup",indie:"Grunge — Nirvana inspired",country:"Clean studio",jazz:"Clean studio",ambient:"Ambient lead — Pink Floyd inspired"};
const vibePreset={clean:"Clean studio",warm:"Blues breakup",crunch:"Classic rock — AC/DC inspired",heavy:"Metal — Metallica inspired",space:"Dreamy chorus",fuzz:"Vintage fuzz — Hendrix inspired",lead:"Brown lead — Van Halen inspired"};
function chooseTone(genre,vibe,request){
 const t=request.toLowerCase();
 const rules=[[/metallica|thrash|high[ -]?gain|heavy metal|80s metal|1980s metal/,"Metal — Metallica inspired"],[/van halen|brown (sound|tone)/,"Brown lead — Van Halen inspired"],[/hendrix|fuzz/,"Vintage fuzz — Hendrix inspired"],[/pink floyd|gilmour/,"Ambient lead — Pink Floyd inspired"],[/nirvana|grunge/,"Grunge — Nirvana inspired"],[/ac\/?dc|classic rock|crunch/,"Classic rock — AC/DC inspired"],[/ambient|dreamy|space|shimmer|chorus/,"Dreamy chorus"],[/blues|warm|breakup/,"Blues breakup"],[/clean|jazz|country/,"Clean studio"],[/metal|heavy|distort/,"Metal — Metallica inspired"]];
 const hit=rules.find(([re])=>re.test(t));return hit?hit[1]:vibePreset[vibe]||genrePreset[genre]||"Clean studio";
}
el("findTone").addEventListener("click",()=>{flushHistory();const text=el("toneRequest").value.trim(),name=chooseTone(el("toneGenre").value,el("toneVibe").value,text);if(!Object.hasOwn(presets,name))return;el("preset").value=name;el("guitar").value=el("toneGuitar").value;el("bypass").checked=false;loadPreset();const budget=el("toneBudget").value;if(tiers.includes(budget)){state.tier=budget;el("gearTier").value=budget;persist()}el("real-gear").hidden=budget==="virtual";renderGear();flushHistory();el("toneResult").textContent="Applied "+name+". "+(text?"Matched local keywords or selected style; not a generative AI model. ":"")+"Fine-tune the amp and pedals below."});
el("showGear").addEventListener("click",()=>{el("real-gear").hidden=false;el("real-gear").scrollIntoView({block:"start",behavior:"smooth"})});
// Shopping list separate from wishlist. One selected product per rig role by default.
let shopping=[];try{shopping=unique(JSON.parse(localStorage.getItem(shoppingKey)||"[]"))}catch{}
function persistShopping(){try{localStorage.setItem(shoppingKey,JSON.stringify(shopping))}catch{msg("Shopping list could not be persisted on this device.")}}
const cableNotes={wah:"Check pedal power and cable requirements.",trem:"Check pedal power and cable requirements.",amp:"Check mains voltage and speaker/load requirements. Amplifier heads require a compatible cabinet or load; never run a tube head unloaded.",drive:"Check pedal voltage, polarity and current requirements.",comp:"Check pedal power requirements.",gate:"Check power requirements and signal-chain placement.",mod:"Check mono/stereo wiring and power.",delay:"Check power requirements and mono/stereo wiring.",verb:"Check power requirements and mono/stereo wiring.",multi:"Check headphone/output compatibility; may replace separate pedals and an amplifier for silent practice.",accessory:"Check device, operating system and cable compatibility."};
function renderShopping(){const list=el("shoppingList");list.replaceChildren();if(!shopping.length)list.append(make("p","Add a suggested rig or select individual products below.","muted"));for(const id of shopping){const p=byId.get(id),card=make("article",undefined,"gear-item");card.append(make("h3",p.name),make("p",kinds[p.kind]+" · "+p.tier,"muted small"),make("p",cableNotes[p.kind],"small"));const actions=make("div",undefined,"actions");actions.append(link("Amazon (paid link)",amazon(p),true),link("Reverb (not affiliated)",reverb(p),false),button("Remove",()=>{shopping=shopping.filter(x=>x!==id);persistShopping();renderShopping();renderGear()}));card.append(actions);list.append(card)}}
const previousGearCard=gearCard;gearCard=function(p){const card=previousGearCard(p);const controls=card.querySelector(".actions:last-child");if(controls)controls.append(button(shopping.includes(p.id)?"Remove from build":"Add to build",()=>{shopping=shopping.includes(p.id)?shopping.filter(x=>x!==p.id):[...shopping,p.id];persistShopping();renderShopping();renderGear()}));return card};
el("buildRig").addEventListener("click",()=>{const chosen=new Map();for(const p of recommend()){if(p.kind==="multi"||state.owned.includes(p.id)||chosen.has(p.kind))continue;chosen.set(p.kind,p.id)}shopping=unique([...shopping,...chosen.values()]);persistShopping();renderShopping();renderGear()});
el("buildMulti").addEventListener("click",()=>{const p=recommend().find(p=>p.kind==="multi"&&!state.owned.includes(p.id));if(!p)return;shopping=unique([...shopping,p.id]);persistShopping();renderShopping();renderGear()});
el("clearBuild").addEventListener("click",()=>{shopping=[];persistShopping();renderShopping();renderGear()});
el("printBuild").addEventListener("click",()=>{if(!shopping.length){msg("Add equipment to your build first.");return}document.body.classList.add("print-build");try{window.print()}finally{document.body.classList.remove("print-build")}});
el("downloadBuild").addEventListener("click",()=>{const lines=["My guitar gear build","",...shopping.flatMap(id=>{const p=byId.get(id);return [p.name+" ("+kinds[p.kind]+", "+p.tier+")",cableNotes[p.kind],""]}),"Check exact model, compatibility, pricing and stock with the retailer."];download(new Blob([lines.join("\n")],{type:"text/plain"}),"guitar-gear-list.txt")});
renderShopping();renderGear();historyUI();


// Practice tools and offline audio rendering. None of these tools upload audio.
let wavBusy=false,loopA=null,loopB=null,loopActive=false,metroTimer=null,metroGain=null,metroNext=0,metroBeat=0;
const setPractice=s=>el("practiceStatus").textContent=s;
function practiceUI(){
 const usable=!!fileURL&&mode!=="mic"&&!rec&&!busy&&!wavBusy&&Number.isFinite(media.duration)&&media.duration>0;
 for(const id of ["loopStart","loopEnd","loopEnable","speed"])el(id).disabled=!usable;
 el("loopEnable").disabled=!usable||loopA===null||loopB===null||loopB-loopA<.2;
 el("loopEnable").textContent=loopActive?"Stop looping":"Loop selection";
 if(el("loopPoints").dataset){el("loopPoints").dataset.start=loopA===null?"":String(loopA);el("loopPoints").dataset.end=loopB===null?"":String(loopB)}
 el("loopPoints").textContent=loopA===null&&loopB===null?"No loop selected.":(loopA===null?"—":loopA.toFixed(2)+" s")+" → "+(loopB===null?"—":loopB.toFixed(2)+" s");
 el("wavExport").disabled=!usable||!window.OfflineAudioContext;
 el("metroStop").disabled=metroTimer===null;
 el("metroStart").disabled=metroTimer!==null||!!rec||wavBusy;
}
const previousUI3=ui;ui=function(){previousUI3();practiceUI();if(wavBusy){for(const id of ["mic","stop","file","play","demo","export","recordLive","irFile","clearIR"])el(id).disabled=true}};
const disconnect3=disconnect;disconnect=function(){loopActive=false;loopA=loopB=null;media.playbackRate=1;el("speed").value="1";disconnect3();practiceUI()};
el("loopStart").addEventListener("click",()=>{loopA=media.currentTime;if(loopB!==null&&loopB<=loopA+.2)loopB=null;loopActive=false;practiceUI()});
el("loopEnd").addEventListener("click",()=>{loopB=media.currentTime;if(loopA!==null&&loopB<=loopA+.2){loopA=null;setPractice("Set a loop start at least 0.2 seconds before the end.")}loopActive=false;practiceUI()});
el("loopEnable").addEventListener("click",()=>{if(loopA===null||loopB===null||loopB-loopA<.2)return;loopActive=!loopActive;if(loopActive)media.currentTime=loopA;practiceUI()});
el("speed").addEventListener("change",()=>{media.playbackRate=Number(el("speed").value);if("preservesPitch"in media)media.preservesPitch=true;setPractice("Playback speed "+media.playbackRate+"×. Pitch preservation depends on browser.")});
media.addEventListener("timeupdate",()=>{if(loopActive&&!rec&&!busy&&loopA!==null&&loopB!==null&&media.currentTime>=loopB)media.currentTime=loopA});
media.addEventListener("loadedmetadata",practiceUI);media.addEventListener("ended",()=>{if(loopActive&&!rec&&loopA!==null){media.currentTime=loopA;media.play().catch(()=>{})}});
el("export").addEventListener("click",()=>{loopActive=false;media.playbackRate=1;el("speed").value="1";stopMetro();practiceUI()},true);
function stopMetro(){if(metroTimer!==null){clearInterval(metroTimer);metroTimer=null}if(metroGain&&ctx){metroGain.gain.cancelScheduledValues(ctx.currentTime);metroGain.gain.setValueAtTime(0,ctx.currentTime)}el("metroBeat").textContent="—";practiceUI()}
el("metroStart").addEventListener("click",async()=>{if(metroTimer!==null||rec||wavBusy)return;try{if(!on("headphones"))throw Error("Confirm headphones first to prevent microphone feedback.");build();await ctx.resume();if(!on("headphones")||rec||wavBusy)return;metroGain=ctx.createGain();metroGain.gain.value=.10;metroGain.connect(ctx.destination);metroNext=ctx.currentTime+.04;metroBeat=0;const schedule=()=>{if(!on("headphones")||rec||document.hidden){stopMetro();return}const bpm=Math.max(40,Math.min(240,Number(el("bpm").value)||100)),beats=Number(el("beats").value)||4;while(metroNext<ctx.currentTime+.12){if(metroNext<ctx.currentTime-.1){metroNext=ctx.currentTime+.04;continue}const o=ctx.createOscillator(),env=ctx.createGain(),accent=metroBeat%beats===0;o.frequency.value=accent?1400:950;env.gain.setValueAtTime(.001,metroNext);env.gain.exponentialRampToValueAtTime(accent?.6:.35,metroNext+.004);env.gain.exponentialRampToValueAtTime(.001,metroNext+.055);o.connect(env);env.connect(metroGain);o.start(metroNext);o.stop(metroNext+.06);o.onended=()=>{o.disconnect();env.disconnect()};el("metroBeat").textContent=String(metroBeat%beats+1)+"/"+beats;metroBeat++;metroNext+=60/bpm}};metroTimer=setInterval(schedule,30);schedule();practiceUI();setPractice("Metronome plays through headphones only, outside the recording signal chain.")}catch(e){setPractice(e.message)}});
el("metroStop").addEventListener("click",stopMetro);el("headphones").addEventListener("change",()=>{if(!on("headphones"))stopMetro()});document.addEventListener("visibilitychange",()=>{if(document.hidden)stopMetro()});window.addEventListener("pagehide",stopMetro);
function pitchEstimate(data,sr){
 let power=0;for(const x of data)power+=x*x;if(power/data.length<1e-7)return null;
 const min=Math.floor(sr/500),max=Math.min(Math.floor(sr/65),Math.floor(data.length/2)-2),vals=new Float32Array(max+1);
 for(let lag=min;lag<=max;lag++){let xy=0,xx=0,yy=0;const size=data.length-max;for(let i=0;i<size;i++){const x=data[i],y=data[i+lag];xy+=x*y;xx+=x*x;yy+=y*y}vals[lag]=xy/Math.sqrt(Math.max(1e-20,xx*yy))}
 let best=-1,score=.75;for(let lag=min+1;lag<max;lag++){if(vals[lag]>score&&vals[lag]>=vals[lag-1]&&vals[lag]>=vals[lag+1]){best=lag;score=vals[lag];if(score>.94)break}}if(best<0)return null;
 const a=vals[best-1],b=vals[best],c=vals[best+1],den=2*(a-2*b+c),shift=den?Math.max(-.5,Math.min(.5,(a-c)/den)):0;return sr/(best+shift);
}
let pitchBuf=null;
setInterval(()=>{if(!on("tunerOn")||!g||mode==="none"||mode==="file"&&media.paused){el("practicePitch").textContent="—";return}if(!pitchBuf)pitchBuf=new Float32Array(g.raw.fftSize);g.raw.getFloatTimeDomainData(pitchBuf);const f=pitchEstimate(pitchBuf,ctx.sampleRate);if(!f){el("practicePitch").textContent="Play one string";return}const midi=Math.round(69+12*Math.log2(f/440)),cents=Math.round(1200*Math.log2(f/(440*2**((midi-69)/12))));const notes=["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];el("practicePitch").textContent=notes[(midi%12+12)%12]+(Math.floor(midi/12)-1)+" · "+(cents>0?"+":"")+cents+" cents · "+f.toFixed(1)+" Hz"},200);
// Offline PCM export using the same graph and settings, independent of playback speed.
function encodeWav(buffer,bits){
 const channels=Math.min(2,buffer.numberOfChannels),frames=buffer.length,bps=bits/8,bytes=frames*channels*bps;
 const ab=new ArrayBuffer(44+bytes),v=new DataView(ab);const str=(i,x)=>{for(let j=0;j<x.length;j++)v.setUint8(i+j,x.charCodeAt(j))};
 str(0,"RIFF");v.setUint32(4,36+bytes,true);str(8,"WAVE");str(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,channels,true);v.setUint32(24,buffer.sampleRate,true);v.setUint32(28,buffer.sampleRate*channels*bps,true);v.setUint16(32,channels*bps,true);v.setUint16(34,bits,true);str(36,"data");v.setUint32(40,bytes,true);
 const arrays=Array.from({length:channels},(_,i)=>buffer.getChannelData(i));let p=44;
 for(let i=0;i<frames;i++)for(let c=0;c<channels;c++){const x=Math.max(-1,Math.min(1,arrays[c][i])),val=Math.round(x*(x<0?2**(bits-1):2**(bits-1)-1));if(bits===16)v.setInt16(p,val,true);else{v.setUint8(p,val&255);v.setUint8(p+1,(val>>8)&255);v.setUint8(p+2,(val>>16)&255)}p+=bps}return new Blob([ab],{type:"audio/wav"});
}
function offlineGate(buffer,graph,ac){
 if(!on("gateOn")&&!on("adaptiveGate"))return;
 // Approximate envelope from unfiltered source for offline gate; live analyser measures post-input EQ.
 const a=buffer.getChannelData(0),block=Math.max(1,Math.floor(buffer.sampleRate*.02)),boost=n("input"),limit=Math.min(a.length,Math.ceil(ac.length/ac.sampleRate*buffer.sampleRate));let floor=-75,open=true;
 graph.gate.gain.cancelScheduledValues(0);for(let i=0;i<limit;i+=block){let sum=0,end=Math.min(limit,i+block);for(let j=i;j<end;j++)sum+=a[j]*a[j];const rms=10*Math.log10(Math.max(1e-14,sum/(end-i)))+boost;if(on("adaptiveGate")&&rms<floor+8)floor=Math.max(-90,Math.min(-35,floor*.98+rms*.02));const threshold=Math.max(on("gateOn")?n("gate"):-90,on("adaptiveGate")?Math.min(-32,floor+10):-90);const next=open?rms>threshold-5:rms>threshold;if(i===0||next!==open)graph.gate.gain.setTargetAtTime(next?1:.015,i/buffer.sampleRate,next?.008:.06);open=next}
}
el("wavExport").addEventListener("click",async()=>{if(!fileURL||wavBusy||rec||mode==="mic")return;const url=fileURL;wavBusy=true;media.pause();loopActive=false;stopMetro();ui();try{
 const Offline=window.OfflineAudioContext;if(!Offline)throw Error("Offline WAV export is not supported.");if(media.duration>180)throw Error("Offline WAV beta supports recordings up to three minutes.");
 build();const response=await fetch(url),blob=await response.blob();if(blob.size>80000000)throw Error("Choose a recording under 80 MB.");setPractice("Decoding recording…");const decoded=await ctx.decodeAudioData(await blob.arrayBuffer());if(decoded.duration>180)throw Error("Choose a recording up to three minutes.");const rate=48000,tail=on("bypass")?0:on("verbOn")||on("delayOn")?3:.12;const ac=new Offline(2,Math.ceil((decoded.duration+tail)*rate),rate),graph=createGraph(ac);
 configureGraph(graph,ac,true);offlineGate(decoded,graph,ac);if(customIR){const conv=ac.createConvolver();conv.buffer=customIR;graph.cabLP.disconnect(graph.cabOut);graph.cabLP.connect(conv);conv.connect(graph.cabOut)}
 // Keep selected output volume, never automatically boost beyond it.
 const src=ac.createBufferSource();src.buffer=decoded;src.connect(graph.input);graph.volume.connect(ac.destination);src.start();setPractice("Rendering offline at 48 kHz…");const rendered=await ac.startRendering();download(encodeWav(rendered,Number(el("wavBits").value)),"guitar-studio.wav");setPractice("WAV saved. Offline gate is an approximation of the live gate; comparison trim and playback speed are excluded.");
 }catch(e){setPractice("WAV export unavailable: "+e.message+". Try a supported WAV or MP3 file, or use real-time export.")}finally{wavBusy=false;el("irFile").disabled=false;el("clearIR").disabled=!customIR;ui()}});
practiceUI();

// Reference EQ helper: compare spectral balance, not notes, amp identity or exact artist tone.
function bandProfile(buffer,seconds=10){
 const sr=buffer.sampleRate,channels=Math.min(2,buffer.numberOfChannels),length=Math.min(buffer.length,Math.floor(sr*seconds)),arr=Array.from({length:channels},(_,c)=>buffer.getChannelData(c));
 const cuts=[100,300,1500,5000],coeff=cuts.map(f=>1-Math.exp(-2*Math.PI*f/sr));let totals=[0,0,0],count=0;
 for(const samples of arr){const lp=[0,0,0,0];for(let i=0;i<length;i++){const x=samples[i];for(let j=0;j<4;j++)lp[j]+=coeff[j]*(x-lp[j]);const bands=[lp[1]-lp[0],lp[2]-lp[1],lp[3]-lp[2]];for(let j=0;j<3;j++)totals[j]+=bands[j]*bands[j];count++}}
 if(!count||totals.reduce((a,b)=>a+b,0)/count<1e-8)throw Error("Recording too quiet for EQ matching.");
 const logs=totals.map(x=>10*Math.log10(Math.max(1e-12,x/count))),mean=logs.reduce((a,b)=>a+b,0)/3;return logs.map(x=>x-mean);
}
let refToken=0,referenceBuffer=null,matchBusy=false;
el("referenceFile").addEventListener("change",async()=>{const token=++refToken;referenceBuffer=null;el("matchReference").disabled=true;try{const f=el("referenceFile").files[0];if(!f||f.size>20000000)throw Error("Choose a guitar-only reference under 20 MB.");build();const decoded=await ctx.decodeAudioData(await f.arrayBuffer());if(token!==refToken)return;referenceBuffer=decoded;el("referenceStatus").textContent="Reference loaded. First ten seconds will be compared.";el("matchReference").disabled=false}catch(e){if(token===refToken)el("referenceStatus").textContent="Reference unavailable: "+e.message}});
el("matchReference").addEventListener("click",async()=>{if(!referenceBuffer||matchBusy)return;if(!fileURL||mode==="mic"||rec||wavBusy){el("referenceStatus").textContent="Load a recording or the generated demo and stop any active recording/export first.";return;}const token=refToken,sourceURL=fileURL,original=JSON.stringify(toneSnapshot());matchBusy=true;el("matchReference").disabled=true;try{const Offline=window.OfflineAudioContext;if(!Offline)throw Error("Offline rendering unavailable.");const blob=await(await fetch(sourceURL)).blob();if(blob.size>80000000)throw Error("Choose a source under 80 MB.");const decoded=await ctx.decodeAudioData(await blob.arrayBuffer());if(token!==refToken||sourceURL!==fileURL||mode==="mic"||rec||wavBusy||JSON.stringify(toneSnapshot())!==original)throw Error("Input or settings changed; try again.");const ac=new Offline(2,Math.ceil(Math.min(10,decoded.duration)*48000),48000),graph=createGraph(ac),src=ac.createBufferSource();configureGraph(graph,ac,true);offlineGate(decoded,graph,ac);if(customIR){const conv=ac.createConvolver();conv.buffer=customIR;graph.cabLP.disconnect(graph.cabOut);graph.cabLP.connect(conv);conv.connect(graph.cabOut)}src.buffer=decoded;src.connect(graph.input);graph.safety.connect(ac.destination);src.start();el("referenceStatus").textContent="Comparing broad frequency bands locally…";const rendered=await ac.startRendering();if(token!==refToken||sourceURL!==fileURL||mode==="mic"||rec||wavBusy||JSON.stringify(toneSnapshot())!==original)throw Error("Input or settings changed; try again.");const target=bandProfile(referenceBuffer),actual=bandProfile(rendered);flushHistory();for(const [i,id] of ["bass","mid","treble"].entries()){const delta=Math.max(-4,Math.min(4,(target[i]-actual[i])*.65));el(id).value=Math.max(-12,Math.min(12,Math.round(n(id)+delta)))}showValues();apply();flushHistory();el("referenceStatus").textContent="Applied bounded EQ adjustments. Use Undo to compare. This matches broad tonal balance only, not distortion, playing style or guitar identity."}catch(e){el("referenceStatus").textContent="EQ match unavailable: "+e.message}finally{matchBusy=false;el("matchReference").disabled=!referenceBuffer}});

ui();
})();