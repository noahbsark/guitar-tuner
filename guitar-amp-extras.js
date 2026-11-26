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
["headphones","Sony MDR-7506","accessory","value","Wired monitoring headphones",[]]
].map(([id,name,kind,tier,description,matches])=>({id,name,kind,tier,description,matches}));
const byId=new Map(gear.map(p=>[p.id,p]));
const tiers=["budget","value","premium"];
const kinds={amp:"Amplifier",drive:"Drive / fuzz",comp:"Compressor",gate:"Noise gate",mod:"Modulation",delay:"Delay",verb:"Reverb",multi:"All-in-one alternative",accessory:"Optional recording accessories"};
const key="ogt.amp.rigs.v1", maxRigs=100;
const fields=[...Object.values(specs).flat().map(x=>x[0]),...toggles,"guitar","amp","cab","driveType","modType","bypass"];
const unique=a=>Array.from(new Set(Array.isArray(a)?a.filter(x=>typeof x==="string"&&byId.has(x)):[]));
function cleanSettings(o){
 const out={}; if(!o||typeof o!=="object")return out;
 for(const group of Object.values(specs))for(const [id,,min,max] of group)if(typeof o[id]==="number"&&Number.isFinite(o[id]))out[id]=Math.round(Math.max(min,Math.min(max,o[id])));
 for(const id of [...toggles,"bypass"])if(typeof o[id]==="boolean")out[id]=o[id];
 for(const id of ["guitar","amp","cab","driveType","modType"])if(typeof o[id]==="string"&&Array.from(el(id).options).some(x=>x.value===o[id]))out[id]=o[id];
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
 const s=snapshot(),active=[["amp",s.amp],...(s.driveOn?[["drive",s.driveType]]:[]),...(s.compOn?[["comp",""]]:[]),...(s.gateOn?[["gate",""]]:[]),...(s.modOn?[["mod",s.modType]]:[]),...(s.delayOn?[["delay",""]]:[]),...(s.verbOn?[["verb",""]]:[]),["multi",""]];
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
el("demo").addEventListener("click",async()=>{if(busy||rec)return;try{disconnect();if(fileURL)URL.revokeObjectURL(fileURL);fileURL=URL.createObjectURL(demoWav());media.src=fileURL;media.hidden=false;media.load();build();await ctx.resume();attachMedia();el("guitar").value="direct";apply();await media.play();status("Playing a generated plucked-string demo (not a real guitar recording).")}catch(e){status("Demo unavailable: "+e.message)}ui()});
// Local live recording; stop safely on mic disconnection, input switch or hidden tab.
let liveRec=null,calibration=null;
const previousUI=ui;ui=function(){previousUI();el("demo").disabled=busy||!!rec||!!liveRec;el("recordLive").disabled=busy||!!rec||!!liveRec||mode!=="mic"||!window.MediaRecorder;el("stopLive").disabled=!liveRec;el("calibrate").disabled=busy||!!rec||!!liveRec||!!calibration||mode!=="mic";if(liveRec){el("file").disabled=true;el("export").disabled=true}};
const previousDisconnect=disconnect;disconnect=function(){if(liveRec)stopLive();if(calibration){clearTimeout(calibration.timer);calibration=null}previousDisconnect()};
function stopLive(){if(liveRec&&liveRec.recorder.state!=="inactive")liveRec.recorder.stop()}
el("recordLive").addEventListener("click",()=>{if(mode!=="mic"||liveRec||rec)return;try{const mime=format(false),recorder=new MediaRecorder(g.record.stream,mime?{mimeType:mime}:{}),job={recorder,chunks:[],failed:false,timer:0};liveRec=job;recorder.ondataavailable=e=>{if(e.data.size)job.chunks.push(e.data)};recorder.onerror=()=>{job.failed=true;stopLive()};recorder.onstop=()=>{clearTimeout(job.timer);liveRec=null;if(!job.failed&&job.chunks.length){const type=recorder.mimeType||job.chunks[0].type,ext=type.includes("mp4")?"m4a":type.includes("ogg")?"ogg":"webm";download(new Blob(job.chunks,{type}),"live-guitar."+ext);status("Live recording saved.")}else status("Live recording failed.");ui()};recorder.start(500);job.timer=setTimeout(stopLive,600000);status("Recording processed microphone audio (10 minute limit).");ui()}catch(e){liveRec=null;status("Recording failed: "+e.message);ui()}});
el("stopLive").addEventListener("click",stopLive);
el("calibrate").addEventListener("click",()=>{if(mode!=="mic"||calibration)return;const samples=[],a=new Float32Array(g.analyser.fftSize),started=performance.now();status("Play normally for three seconds to calibrate input gain.");const job={timer:0};calibration=job;ui();
 const sample=()=>{if(calibration!==job||mode!=="mic")return;g.analyser.getFloatTimeDomainData(a);let sum=0,peak=0;for(const x of a){sum+=x*x;peak=Math.max(peak,Math.abs(x))}const rms=20*Math.log10(Math.max(1e-8,Math.sqrt(sum/a.length)));if(rms>-65)samples.push({rms,peak});if(performance.now()-started<3000){job.timer=setTimeout(sample,60);return}calibration=null;if(samples.length<5){status("Input too quiet. Move microphone closer and try again.")}else{samples.sort((a,b)=>a.rms-b.rms);const typical=samples[Math.floor(samples.length*.75)].rms,peak=Math.max(...samples.map(x=>x.peak));const delta=Math.min(6,-26-typical,20*Math.log10(.7/Math.max(.001,peak)));el("input").value=Math.max(0,Math.min(24,Math.round(n("input")+delta)));showValues();apply();status("Calibration complete. Input gain "+n("input")+" dB. Repeat if needed.")}ui()};sample()});
// Custom user-supplied speaker IR, with filtered cabinet path retained as fallback.
let customIR=null,irNodes=null,irLoad=0;
function ensureIR(){if(irNodes)return;const conv=ctx.createConvolver(),wet=ctx.createGain(),dry=ctx.createGain(),sum=ctx.createGain();wet.gain.value=0;dry.gain.value=1;g.cabLP.disconnect(g.modSum);g.cabLP.disconnect(g.modDelay);g.cabLP.connect(dry);g.cabLP.connect(conv);conv.connect(wet);dry.connect(sum);wet.connect(sum);sum.connect(g.modSum);sum.connect(g.modDelay);irNodes={conv,wet,dry}}
el("irFile").addEventListener("change",async()=>{const token=++irLoad;try{const f=el("irFile").files[0];if(!f||f.size>10000000)throw Error("Choose an impulse response under 10 MB.");build();const b=await ctx.decodeAudioData(await f.arrayBuffer());if(token!==irLoad)return;if(b.duration>2||b.numberOfChannels>2)throw Error("Use a mono or stereo speaker IR of two seconds or less.");ensureIR();customIR=b;irNodes.conv.buffer=b;irNodes.wet.gain.setTargetAtTime(1,ctx.currentTime,.03);irNodes.dry.gain.setTargetAtTime(0,ctx.currentTime,.03);el("irStatus").textContent="Custom IR active (not included in shared or saved rigs).";el("clearIR").disabled=false}catch(e){if(token===irLoad)el("irStatus").textContent="IR unavailable: "+e.message}finally{el("irFile").value=""}});
el("clearIR").addEventListener("click",()=>{irLoad++;if(irNodes){irNodes.wet.gain.setTargetAtTime(0,ctx.currentTime,.03);irNodes.dry.gain.setTargetAtTime(1,ctx.currentTime,.03)}customIR=null;el("clearIR").disabled=true;el("irStatus").textContent="Using the built-in cabinet voicing."});
ui();
})();