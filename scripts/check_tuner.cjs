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

for (const rate of [44100, 48000, 96000, 192000]) {
  for (const pitch of [30.8677, 41.20345, 55, 73.4162, 97.99885]) {
    const actual = vm.runInContext(`
      (() => {
        const rate = ${rate};
        const pitch = ${pitch};
        const stride = clamp(2 ** Math.ceil(Math.log2(rate / 24000)), 2, 8);
        const input = Float32Array.from({length: 4096 * stride}, (_, i) => {
          const phase = 2 * Math.PI * pitch * i / rate;
          return 0.2 * (Math.sin(phase) + 0.65 * Math.sin(2 * phase));
        });
        const filtered = new Float32Array(4096);
        averageSamples(input, filtered, stride);
        return detectPitchAutocorrelation(filtered, rate / stride, getRMS(input),
          MAX_BASS_FREQUENCY, MIN_BASS_FREQUENCY)?.frequency;
      })()
    `, browser);
    assert.ok(Math.abs(1200 * Math.log2(actual / pitch)) < 1, `${rate} Hz input, pitch ${pitch}: ${actual}`);
  }
}
vm.runInContext(`
  currentTuningKey = "standard";
  currentStrings = TUNINGS.standard.strings;
  manualTarget = null;
  testPitch = Math.sqrt(82.4069 * 110);
  resetDetectionState();
  updateLoop();
`, browser);
assert.match(readout.helperText.textContent, /Pitch outside this preset/);
console.log('20 low-bass sample-rate checks and out-of-preset feedback passed.');

assert.equal(vm.runInContext('describeRetuning(82.4069, 73.4162)', browser), 'Lower 2 semitones');
assert.equal(vm.runInContext('describeRetuning(329.6276, 329.6276)', browser), 'Leave as is');
assert.equal(vm.runInContext('describeRetuning(110, 110 * 443.993 / 440)', browser), 'Raise 16 cents');
console.log('Retuning planner directions and reference-pitch changes passed.');

assert.equal(vm.runInContext('parseCustomNotes("38,45,50,55,57,62").join(",")', browser), '38,45,50,55,57,62');
for (const bad of ['32,45,50,55,59,64', '40,45,50,55,59,77', '40,45', '40,45,50,55,59,64<script>']) {
  assert.equal(vm.runInContext(`parseCustomNotes(${JSON.stringify(bad)})`, browser), null);
}
assert.equal(vm.runInContext('createCustomTuning([38,45,50,55,57,62]).label', browser), 'D2 A2 D3 G3 A3 D4');
assert.equal(vm.runInContext('createCustomTuning([40,45,50,55,59,76]).strings[5].note', browser), 'E5');
console.log('Custom tuning link validation and exact note targets passed.');

assert.equal(vm.runInContext('intonationDifferenceCents(110, 220)', browser), 0);
assert.equal(vm.runInContext('Math.round(intonationDifferenceCents(110, 220 * 2 ** (12 / 1200)))', browser), 12);
assert.equal(vm.runInContext('Math.round(intonationDifferenceCents(110, 220 * 2 ** (-8 / 1200)))', browser), -8);
assert.equal(vm.runInContext('intonationDifferenceCents(110, 110)', browser), null);
assert.equal(vm.runInContext('intonationDifferenceCents(110, 329.63)', browser), null);
console.log('Intonation comparison reports sharp, flat, exact octave, and invalid second readings.');

const captureElements = Object.fromEntries([
  'captureOpenPitch', 'captureFrettedPitch', 'clearIntonation',
  'intonationOpen', 'intonationFretted', 'intonationResult'
].map(id => [id, {
  disabled: true,
  addEventListener(event, listener) { this[event] = listener; }
}]));
const captureBrowser = vm.createContext({
  document: {body: {dataset: {tuning: 'chromatic'}}, getElementById: id => captureElements[id] || null},
  location: {search: ''},
  URLSearchParams
});
vm.runInContext(source, captureBrowser);
vm.runInContext('setIntonationPitch(110)', captureBrowser);
assert.equal(captureElements.captureFrettedPitch.disabled, true);
captureElements.captureOpenPitch.click();
vm.runInContext('setIntonationPitch(220 * 2 ** (12 / 1200))', captureBrowser);
assert.equal(captureElements.captureFrettedPitch.disabled, false);
captureElements.captureFrettedPitch.click();
assert.match(captureElements.intonationResult.textContent, /12 cents sharp/);
captureElements.clearIntonation.click();
assert.equal(captureElements.captureFrettedPitch.disabled, true);
assert.equal(captureElements.intonationOpen.textContent, '—');
console.log('Intonation capture and reset flow passed.');
