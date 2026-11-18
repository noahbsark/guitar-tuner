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

// Exercise the full display loop with consecutive tones and silence.
const readout = {};
const browser = vm.createContext({
  document: {
    body: {dataset: {}},
    getElementById: id => ['noteReadout', 'detailsText', 'helperText', 'needle', 'levelBar'].includes(id)
      ? (readout[id] = {style: {}}) : null,
    querySelectorAll: () => []
  },
  location: {search: ''},
  URLSearchParams,
  requestAnimationFrame: () => 1
});
vm.runInContext(source, browser);
vm.runInContext(`
  isListening = true;
  audioContext = {sampleRate: 48000};
  buffer = new Float32Array(4096);
  let testPitch = 85;
  let testVolume = 0.3;
  analyser = {getFloatTimeDomainData(samples) {
    for (let i = 0; i < samples.length; i++) {
      samples[i] = testVolume * Math.sin(2 * Math.PI * testPitch * i / 48000);
    }
  }};
  for (let i = 0; i < 3; i++) updateLoop();
`, browser);
const assert = require('node:assert/strict');
assert.match(readout.detailsText.textContent, /Target: E2/);
vm.runInContext('testPitch = 110; updateLoop();', browser);
assert.equal(readout.noteReadout.textContent, '—');
assert.equal(readout.needle.style.left, '50%');
vm.runInContext('updateLoop(); updateLoop();', browser);
assert.match(readout.detailsText.textContent, /Target: A2 · Detected: A2 \(110.0 Hz\)/);
assert.equal(readout.helperText.textContent, 'In tune');
vm.runInContext('testVolume = 0; updateLoop();', browser);
assert.equal(readout.noteReadout.textContent, '—');
vm.runInContext('testVolume = 0.3; updateLoop();', browser);
assert.equal(readout.noteReadout.textContent, '—');
vm.runInContext(`
  currentTuningKey = "sevenDropA";
  currentStrings = TUNINGS[currentTuningKey].strings;
  manualTarget = currentStrings[0];
  resetDetectionState();
  for (let i = 0; i < 3; i++) updateLoop();
`, browser);
assert.match(readout.detailsText.textContent, /Target: A1 · Detected: A2/);
assert.match(readout.helperText.textContent, /Check the string and octave/);
assert.equal(vm.runInContext('TUNINGS.sevenStandard.strings.length', browser), 7);
console.log('Display target changes, silence recovery, and seven-string octave guard passed.');

vm.runInContext(`
  currentTuningKey = "chromatic";
  testPitch = 392;
  for (let i = 0; i < 3; i++) updateLoop();
`, browser);
assert.equal(readout.noteReadout.textContent, 'G4');
vm.runInContext('testPitch = 659.255; updateLoop();', browser);
assert.equal(readout.noteReadout.textContent, '—');
vm.runInContext('updateLoop(); updateLoop();', browser);
assert.equal(readout.noteReadout.textContent, 'E5');
assert.match(readout.detailsText.textContent, /659\.3 Hz.* relative to E5/);
assert.equal(readout.helperText.textContent, 'In tune');
console.log('Chromatic G4 and E5 detection and target transitions passed.');

vm.runInContext(`
  currentTuningKey = "standard";
  currentStrings = TUNINGS.standard.strings;
  passProgress = {};
  let recordedCount = 0;
  updatePassProgress = () => { recordedCount = checkedNotes.size; };
  renderTuning(currentStrings[0], 82.4069, 0);
  renderTuning(currentStrings[0], 82.4069, 0);
  renderTuning(currentStrings[1], 109, -16);
`, browser);
assert.equal(vm.runInContext('recordedCount', browser), 1);
vm.runInContext('renderTuning(currentStrings[1], 110, 0);', browser);
assert.equal(vm.runInContext('recordedCount', browser), 2);
console.log('Tuning-pass count ignores repeats and out-of-tune notes.');

assert.equal(vm.runInContext('relativeTensionChange(110, 110)', browser), 0);
assert.equal(vm.runInContext('Math.round(relativeTensionChange(82.4069, 73.4162))', browser), -21);
assert.equal(vm.runInContext('Math.round(relativeTensionChange(73.4162, 82.4069))', browser), 26);
console.log('Same-string tension examples and reverse comparison passed.');

vm.runInContext(`
  currentTuningKey = TWELVE_STRING_DEFAULT;
  currentStrings = TUNINGS[currentTuningKey].strings;
  checkedNotes.clear();
  manualTarget = currentStrings[7];
  testPitch = 391.9954;
  resetDetectionState();
  for (let i = 0; i < 3; i++) updateLoop();
`, browser);
assert.match(readout.detailsText.textContent, /Course 3 octave: G4/);
assert.equal(vm.runInContext('currentStrings.length', browser), 12);
vm.runInContext(`
  testPitch = 246.9417;
  manualTarget = currentStrings[8];
  resetDetectionState();
  for (let i = 0; i < 3; i++) updateLoop();
  manualTarget = currentStrings[9];
  resetDetectionState();
  for (let i = 0; i < 3; i++) updateLoop();
`, browser);
assert.match(readout.detailsText.textContent, /Course 2 second: B3/);
assert.equal(vm.runInContext('checkedNotes.size', browser), 3);
console.log('12-string G4 detection and separate unison targets passed.');
