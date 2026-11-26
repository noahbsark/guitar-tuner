// Run from repository root: node scripts/guitar-amp-smoke.cjs
const fs = require("node:fs");
const path = require("node:path");

function runSmoke(h,s){
 const base=h.match(/<script>([\s\S]*?)<\/script>/)[1];new Function(base+"\n"+s);
 const ids=new Map(),store=new Map();let seq=0;const timers=new Map();
 function node(tag="div",id=""){return {tagName:tag.toUpperCase(),id,type:"",value:"",checked:false,disabled:false,hidden:false,style:{},children:[],options:[],events:{},textContent:"",paused:true,addEventListener(k,f){(this.events[k]??=[]).push(f)},fire(k){for(const f of this.events[k]||[])f({target:this,preventDefault(){}})},append(...es){this.children.push(...es);if(tag==="select")for(const e of es){this.options.push(e);if(!this.value)this.value=e.value}},replaceChildren(...es){this.children=es},querySelector(){return this.children.at(-1)},focus(){},select(){},pause(){this.paused=true},set innerHTML(v){for(const m of v.matchAll(/<(input|output)\b[^>]*id="([^"]+)"[^>]*>/g)){const e=node(m[1],m[2]);e.type=m[0].match(/type="([^"]+)"/)?.[1]||"";e.value=m[0].match(/value="([^"]+)"/)?.[1]||"";ids.set(m[2],e)}}}}
 for(const m of h.matchAll(/<([a-z][\w-]*)\b[^>]*\bid="([A-Za-z][\w-]*)"[^>]*>/g)){const e=node(m[1],m[2]);e.type=m[0].match(/type="([^"]+)"/)?.[1]||"";e.value=m[0].match(/value="([^"]+)"/)?.[1]||"";e.checked=/\bchecked\b/.test(m[0]);ids.set(m[2],e)}
 for(const m of h.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)){const e=ids.get(m[1]);for(const opt of m[2].matchAll(/<option value="([^"]+)"([^>]*)>/g)){const o=node("option");o.value=opt[1];e.append(o);if(opt[2].includes("selected"))e.value=o.value}}
 const doc={getElementById:i=>ids.get(i),createElement:t=>node(t),addEventListener(){},body:node("body")};
 const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
 const setTimer=f=>{timers.set(++seq,f);return seq},clearTimer=i=>timers.delete(i);
 class MockURL{constructor(v){this.href=v;this.searchParams={set(){}}}}
 const param=()=>({value:0,setTargetAtTime(v){if(!Number.isFinite(v))throw Error("Non-finite audio parameter");this.value=v},cancelScheduledValues(){}});
 const audioNode=()=>({edges:new Set(),connect(x){this.edges.add(x);return x},disconnect(x){if(x){if(!this.edges.delete(x))throw Error("Disconnect missing edge")}else this.edges.clear()},start(){},getFloatTimeDomainData(a){a.fill(0)},...Object.fromEntries(["gain","frequency","Q","attack","release","threshold","ratio","knee","delayTime"].map(x=>[x,param()]))});
 class AC{constructor(){this.currentTime=0;this.sampleRate=8000;this.destination=audioNode()}createGain(){return audioNode()}createBiquadFilter(){return audioNode()}createWaveShaper(){return audioNode()}createAnalyser(){return audioNode()}createDynamicsCompressor(){return audioNode()}createDelay(){return audioNode()}createOscillator(){return audioNode()}createConvolver(){return audioNode()}createBuffer(c,l){return{getChannelData:()=>new Float32Array(l)}}createMediaStreamDestination(){return audioNode()}createMediaElementSource(){return audioNode()}}
 const test=`
 const results=[];const check=(ok,label)=>{if(!ok)throw Error(label);results.push(label)};const E=id=>document.getElementById(id);
 check(E("preset").options.length===9,"nine presets initialized");
 E("toneRequest").value="1980s metal";E("findTone").fire("click");check(E("amp").value==="metal","metal tone finder");
 E("saveA").fire("click");E("toneRequest").value="warm blues";E("findTone").fire("click");check(E("amp").value==="british","blues tone finder");
 E("saveB").fire("click");E("loadA").fire("click");check(E("amp").value==="metal","A/B restore");
 E("undoTone").fire("click");check(E("amp").value==="british","undo");
 E("redoTone").fire("click");check(E("amp").value==="metal","redo");
 E("rigName").value="Test rig";E("pickup").value="humbucker";E("wahOn").checked=true;E("saveRig").fire("click");const rig=JSON.parse(localStorage.getItem("ogt.amp.rigs.v1")).rigs[0];check(rig.name==="Test rig"&&rig.settings.pickup==="humbucker"&&rig.settings.wahOn,"new effect fields persist");
 E("buildRig").fire("click");check(JSON.parse(localStorage.getItem("ogt.amp.shopping.v1")).includes("crybaby"),"wah recommendation in shopping list");
 E("clearBuild").fire("click");check(JSON.parse(localStorage.getItem("ogt.amp.shopping.v1")).length===0,"clear shopping list");
 build();check(!!g&&g.raw.fftSize===4096,"live graph initialization");
 for(const p of Object.keys(presets)){E("preset").value=p;loadPreset()}check(true,"all presets configure graph");
 const offline=new window.AudioContext(),graph=createGraph(offline);
 for(const pre of ["comp-drive","drive-comp"])for(const post of ["mod-delay-verb","mod-verb-delay","delay-mod-verb","delay-verb-mod","verb-mod-delay","verb-delay-mod"]){E("preOrder").value=pre;E("postOrder").value=post;configureGraph(graph,offline,true);check(graph.routeKey===pre+"/"+post&&graph.preIn.edges.size===2&&graph.cabOut.edges.size===1&&graph[post.split("-").at(-1)+"Sum"].edges.has(graph.postOut),"routing "+pre+" / "+post)}
 return results;`;
 return new Function("document","window","localStorage","location","navigator","setTimeout","clearTimeout","setInterval","URL","requestAnimationFrame",base+"\n"+s+"\n"+test)(doc,{addEventListener(){},MediaRecorder:function(){},AudioContext:AC},storage,{hash:"",href:"https://onlineguitartuner.net/guitar-amp"},{},setTimer,clearTimer,()=>1,MockURL,()=>1)
}

const root=path.join(__dirname,"..");
const results=runSmoke(fs.readFileSync(path.join(root,"guitar-amp.html"),"utf8"),fs.readFileSync(path.join(root,"guitar-amp-extras.js"),"utf8"));
console.log(results.length+" smoke checks passed");
