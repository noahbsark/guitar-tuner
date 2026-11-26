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
 const b=document.createElement("button");b.type="button";b.className="preset-tile";b.dataset.preset=opt.value;b.setAttribute("aria-label",opt.textContent);b.setAttribute("aria-pressed","false");b.style.setProperty("--tile-bg",bg);b.style.setProperty("--tile-color",color);
 const mark=document.createElement("span");mark.className="preset-icon";mark.textContent=icon;mark.setAttribute("aria-hidden","true");
 const title=document.createElement("span");title.className="preset-name";title.textContent=name;const detail=document.createElement("span");detail.className="preset-sub";detail.textContent=sub;title.append(detail);b.append(mark,title);
 b.addEventListener("click",()=>{preset.value=opt.value;preset.dispatchEvent(new Event("change",{bubbles:true}));sync()});tiles.append(b);
}
const dials=[];for(const label of document.querySelectorAll("#ampKnobs .knob")){
 const input=label.querySelector("input[type=range]");if(!input)continue;const dial=document.createElement("span");dial.className="dial-display";dial.setAttribute("aria-hidden","true");label.insertBefore(dial,input);dials.push([dial,input]);
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
 $("micHint").textContent=silent?"No headphones needed. Start the mic, record, then stop and listen.":"Wear headphones and start at a low volume before enabling live monitoring.";
 $("mic").textContent=silent?"Start recording setup":"Start live microphone";
 document.querySelector(".transport-status").dataset.live=String($("stop").disabled===false||$("recordLive").disabled===false);
}
$("quickBypass").addEventListener("click",()=>{$("bypass").checked=!$("bypass").checked;$("bypass").dispatchEvent(new Event("change",{bubbles:true}));sync()});
document.addEventListener("input",sync);document.addEventListener("change",sync);
document.addEventListener("click",()=>requestAnimationFrame(sync));
const observer=new MutationObserver(sync);observer.observe($("status"),{childList:true,characterData:true,subtree:true});sync();
})();