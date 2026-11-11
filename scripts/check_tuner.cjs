const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'tuner.js'), 'utf8');
const pure = source.slice(0, source.indexOf('const tuningSelect')) + source.slice(source.indexOf('function getRMS('));
const api = vm.runInNewContext(pure + '\n({getRMS, detectPitchAutocorrelation})');
const frequencies=[55,61.7354,73.4162,82.4069,110,146.8324,195.9977,246.9417,329.6276];
const rows=[];
for(const rate of [44100,48000]) for(const type of ['sine','harmonics']) for(const f of frequencies) for(const phase of [0,0.7,1.4]) {
 const samples=Float32Array.from({length:4096},(_,i)=>{const t=2*Math.PI*f*i/rate+phase;return 0.3*(Math.sin(t)+(type==='harmonics'?0.35*Math.sin(2*t)+0.15*Math.sin(3*t):0));});
 const result=api.detectPitchAutocorrelation(samples,rate,api.getRMS(samples));
 const error=result?Math.abs(1200*Math.log2(result.frequency/f)):null;
 if(error===null||error>1) throw new Error(JSON.stringify({rate,type,f,phase,result,error}));
 rows.push({rate,type,f,phase,error});
}
const silence=new Float32Array(4096);
if(api.detectPitchAutocorrelation(silence,48000,api.getRMS(silence))!==null)throw new Error('Silence should be rejected');
const report={cases:rows.length,silenceRejected:true,groups:[44100,48000].flatMap(rate=>['sine','harmonics'].map(type=>({sampleRate:rate,signal:type,cases:rows.filter(r=>r.rate===rate&&r.type===type).length,maxAbsoluteCents:Math.max(...rows.filter(r=>r.rate===rate&&r.type===type).map(r=>r.error))})))};

console.log(JSON.stringify(report,null,2));
