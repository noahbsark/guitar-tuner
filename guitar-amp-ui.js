"use strict";
(() => {
const $=id=>document.getElementById(id);
const nav=[...document.querySelectorAll(".workspace-link")],links=[...document.querySelectorAll("[data-view]")],panels=[...document.querySelectorAll("[data-workspace]")];
let workspace="studio";
function view(name,scroll=false){
 if(!["studio","practice","rigs","gear"].includes(name))return;
 workspace=name;
 // Keep the transport accessible during recording, regardless of the active workspace.
 for(const panel of panels)panel.classList.toggle("workspace-off",panel.id!=="studio-input"&&panel.dataset.workspace!==name);
 if(name==="gear")$("real-gear").hidden=false;
 for(const a of nav){const active=a.dataset.view===name;a.classList.toggle("active",active);if(active)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")}
 if(scroll){const target=name==="studio"?$("studio-input"):panels.find(x=>x.dataset.workspace===name);target?.scrollIntoView({block:"start",behavior:"auto"});sync()}
}
for(const a of links)a.addEventListener("click",e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();view(a.dataset.view,true)});
$("showGear").addEventListener("click",()=>view("gear",true));
$("loadShared").addEventListener("click",()=>view("studio",true));
const hash=location.hash;view(hash.startsWith("#rig=")||hash==="#my-rigs"?"rigs":hash==="#real-gear"?"gear":hash==="#practice-tools"?"practice":"studio");
const presetsUI=[
["Clean","Clear & bright","◈","#254438","#a9e6bd"],["Blues","Warm breakup","≈","#443928","#f0cc8e"],["AC/DC","Classic rock","ϟ","#453326","#f2be88"],["Nirvana","Grunge","≋","#394338","#b9daa4"],["Metallica","High gain","ϟ","#45313a","#f4a7bb"],["Pink Floyd","Atmospheric","✧","#36334b","#c8bbf3"],["Hendrix","Vintage fuzz","✦","#45334a","#e8b5e9"],["Van Halen","Lead","↗","#46392c","#f3c18c"],["Dreamy","Chorus clean","≈","#29424d","#a4d7ec"]
];
const preset=$("preset"),tiles=$("presetTiles");
for(const [i,opt] of [...preset.options].entries()){
 const [name,sub,icon,bg,color]=presetsUI[i]||[opt.textContent,"Preset","♪","#254438","#a9e6bd"];
 const b=document.createElement("button");b.type="button";b.className="preset-tile";b.dataset.preset=opt.value;b.setAttribute("aria-pressed","false");b.style.setProperty("--tile-bg",bg);b.style.setProperty("--tile-color",color);
 const mark=document.createElement("span");mark.className="preset-icon";mark.textContent=icon;mark.setAttribute("aria-hidden","true");
 const title=document.createElement("span");title.className="preset-name";title.textContent=name;const detail=document.createElement("span");detail.className="preset-sub";detail.textContent=sub;title.append(detail);b.append(mark,title);
 b.addEventListener("click",()=>{preset.value=opt.value;preset.dispatchEvent(new Event("change",{bubbles:true}));sync()});tiles.append(b);
}
const dials=[];for(const label of document.querySelectorAll("#ampKnobs .knob")){
 const input=label.querySelector("input[type=range]");if(!input)continue;const dial=document.createElement("span");dial.className="dial-display";dial.setAttribute("aria-hidden","true");label.insertBefore(dial,input);dials.push([dial,input]);
 let drag=null;const update=v=>{input.value=String(Math.min(Number(input.max),Math.max(Number(input.min),Math.round(v))));input.dispatchEvent(new Event("input",{bubbles:true}))};
 dial.addEventListener("pointerdown",e=>{if(!e.isPrimary||e.button!==0||input.disabled)return;e.preventDefault();drag={id:e.pointerId,y:e.clientY,v:Number(input.value)};dial.setPointerCapture(e.pointerId);input.focus({preventScroll:true});dial.classList.add("dragging")});
 dial.addEventListener("pointermove",e=>{if(!drag||e.pointerId!==drag.id)return;update(drag.v+(drag.y-e.clientY)*(Number(input.max)-Number(input.min))/130*(e.shiftKey?.2:1))});
 const end=e=>{if(!drag||e.pointerId!==drag.id)return;drag=null;dial.classList.remove("dragging");input.dispatchEvent(new Event("change",{bubbles:true}))};dial.addEventListener("pointerup",end);dial.addEventListener("pointercancel",end);dial.addEventListener("lostpointercapture",end);
}
function sync(){
 for(const b of tiles.querySelectorAll("button"))b.setAttribute("aria-pressed",String(b.dataset.preset===preset.value));
 const bypass=$("bypass").checked;const quick=$("quickBypass");quick.textContent=bypass?"Hear processed":"Hear original";quick.setAttribute("aria-pressed",String(bypass));
 $("ampName").textContent=$("amp").selectedOptions[0]?.textContent||"Amplifier";
 const pedals=[...document.querySelectorAll(".pedal input[type=checkbox]")];$("pedalCount").textContent=pedals.filter(p=>p.checked).length+" active";
 for(const p of pedals){const l=p.closest("label");if(l&&l.lastChild?.nodeType===3)l.lastChild.textContent=p.checked?" On":" Off"}
 for(const [dial,input] of dials){const f=Math.max(0,Math.min(1,(Number(input.value)-Number(input.min))/(Number(input.max)-Number(input.min)||1)));dial.style.setProperty("--dial-angle",f*270+"deg");dial.style.setProperty("--dial-rotation",f*270-135+"deg")}
 const silent=$("micMode").value==="silent",label=$("headphones").closest("label");
 // The checkbox is also used by the metronome. Keep it accessible from the input area.
 label.hidden=silent&&workspace!=="practice";if(label.lastChild?.nodeType===3)label.lastChild.textContent=silent?" I am wearing headphones for the metronome":" I am wearing headphones";
 $("micHint").textContent=silent?"No headphones needed. Start the mic, record a take, then finish it to listen.":"Wear headphones and start at a low volume before enabling live monitoring.";
 $("mic").textContent=silent?"Start recording setup":"Start live microphone";
 document.querySelector(".transport-status").dataset.live=String($("stop").disabled===false||$("recordLive").disabled===false);
}
$("quickBypass").addEventListener("click",()=>{$("bypass").checked=!$("bypass").checked;$("bypass").dispatchEvent(new Event("change",{bubbles:true}));sync()});
document.addEventListener("input",sync);document.addEventListener("change",sync);
document.addEventListener("click",()=>requestAnimationFrame(sync));
const observer=new MutationObserver(sync);observer.observe($("status"),{childList:true,characterData:true,subtree:true});sync();

// Local overview waveform; native range supplies keyboard and touch seeking.
const player=$("media"),timeline=$("recordingTimeline"),seek=$("waveSeek"),canvas=$("waveCanvas"),paint=canvas.getContext("2d");
let waveURL="",waveGeneration=0,peaks=null,loading=false;
const clock=t=>Number.isFinite(t)?Math.floor(t/60)+":"+String(Math.floor(t%60)).padStart(2,"0"):"0:00";
function drawWave(){
 if(!paint)return;const w=canvas.width,h=canvas.height;paint.clearRect(0,0,w,h);
 paint.fillStyle="#263641";paint.fillRect(0,h/2,w,1);if(!peaks)return;
 paint.fillStyle="#81c8a1";const norm=Math.max(.03,...peaks),step=w/peaks.length;for(let i=0;i<peaks.length;i++){const v=Math.max(1,peaks[i]/norm*(h-12));paint.fillRect(i*step,(h-v)/2,Math.max(1,step-1),v)}
}
function usable(){return Boolean(fileURL&&mode!=="mic"&&!rec&&!busy&&!$("play").disabled&&Number.isFinite(player.duration)&&player.duration>0)}
function timelineSync(){
 const exists=!!fileURL&&mode!=="mic"&&!player.hidden;timeline.hidden=!exists;
 const ok=usable();seek.disabled=!ok;for(const id of ["waveBack","waveForward"])$(id).disabled=!ok;
 for(const [id,original] of [["waveA","loopStart"],["waveB","loopEnd"],["waveToggle","loopEnable"]])$(id).disabled=!ok||$(original).disabled;
 $("waveToggle").textContent=$("loopEnable").textContent;
 const duration=Number.isFinite(player.duration)?player.duration:0,t=duration?Math.min(duration,player.currentTime):0,ratio=duration?t/duration:0;
 seek.value=String(Math.round(ratio*1000));seek.setAttribute("aria-valuetext",clock(t)+" of "+clock(duration));$("timelineClock").textContent=clock(t)+" / "+clock(duration);$("waveCursor").style.left=ratio*100+"%";
 const lp=$("loopPoints").dataset,a=Number(lp.start),b=Number(lp.end),selected=duration>0&&lp.start!==""&&lp.end!==""&&Number.isFinite(a)&&Number.isFinite(b)&&b>a;
 $("waveLoop").hidden=!selected;if(selected){$("waveLoop").style.left=Math.max(0,Math.min(100,a/duration*100))+"%";$("waveLoop").style.width=Math.max(0,Math.min(100-a/duration*100,(b-a)/duration*100))+"%"}
}
async function loadWave(){
 timelineSync();const url=fileURL;if(!url||url===waveURL||!ctx||!Number.isFinite(player.duration)||player.duration<=0)return;waveURL=url;const token=++waveGeneration;peaks=null;drawWave();loading=true;$("waveStatus").textContent="Preparing waveform…";
 try{
  if(!ctx||!Number.isFinite(player.duration)||player.duration>180)throw Error("Waveform preview is limited to recordings up to three minutes.");
  const blob=await(await fetch(url)).blob();if(blob.size>40000000)throw Error("Waveform preview is limited to 40 MB.");
  if(token!==waveGeneration||url!==fileURL)return;
  const decoded=await ctx.decodeAudioData(await blob.arrayBuffer());if(token!==waveGeneration||url!==fileURL)return;
  const count=450,values=new Float32Array(count),channels=Math.min(2,decoded.numberOfChannels);
  for(let ch=0;ch<channels;ch++){const data=decoded.getChannelData(ch);for(let i=0;i<count;i++){const start=Math.floor(i*data.length/count),end=Math.floor((i+1)*data.length/count),stride=Math.max(1,Math.floor((end-start)/256));for(let j=start;j<end;j+=stride)values[i]=Math.max(values[i],Math.abs(data[j]))}}
  peaks=values;drawWave();$("waveStatus").textContent="Original recording waveform. Click or use the slider to seek.";
 }catch(e){if(token===waveGeneration&&url===fileURL)$("waveStatus").textContent="Waveform unavailable. You can still use the playback slider."}
 finally{if(token===waveGeneration){loading=false;timelineSync()}}
}
function jump(t){if(usable())player.currentTime=Math.max(0,Math.min(player.duration,t));timelineSync()}
seek.addEventListener("input",()=>jump(Number(seek.value)/1000*player.duration));canvas.addEventListener("click",e=>{if(!usable())return;const r=canvas.getBoundingClientRect();jump((e.clientX-r.left)/r.width*player.duration)});
$("waveBack").addEventListener("click",()=>jump(player.currentTime-5));$("waveForward").addEventListener("click",()=>jump(player.currentTime+5));
for(const [id,original] of [["waveA","loopStart"],["waveB","loopEnd"],["waveToggle","loopEnable"]])$(id).addEventListener("click",()=>{$(original).click();timelineSync()});
for(const ev of ["loadedmetadata","durationchange","playing","pause","timeupdate","seeked","ended","emptied","error"])player.addEventListener(ev,()=>{timelineSync();if(ev==="loadedmetadata"||ev==="durationchange")loadWave()});
document.addEventListener("click",()=>requestAnimationFrame(timelineSync));new MutationObserver(timelineSync).observe($("status"),{childList:true,subtree:true});timelineSync();

})();