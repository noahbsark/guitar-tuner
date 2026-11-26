const {test,expect}=require('@playwright/test');
const {AxeBuilder}=require('@axe-core/playwright');
test('studio initializes and presets, bypass, workspace navigation and saved rigs work',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/guitar-amp.html');
 await expect(page.locator('#presetTiles button')).toHaveCount(9);
 await expect(page.locator('#headphones')).toBeHidden();
 await page.locator('#micMode').selectOption('headphones');
 await expect(page.locator('#headphones')).toBeVisible();
 await expect(page.locator('#mic')).toBeDisabled();
 await page.locator('#headphones').check();await expect(page.locator('#mic')).toBeEnabled();
 await page.locator('#micMode').selectOption('silent');
 await expect(page.locator('#headphones')).toBeHidden();
 await page.locator('#presetTiles button').filter({hasText:'Metallica'}).click();
 await expect(page.locator('#amp')).toHaveValue('metal');
 await page.locator('#quickBypass').click();await expect(page.locator('#bypass')).toBeChecked();
 await page.locator('#quickBypass').click();await expect(page.locator('#bypass')).not.toBeChecked();
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
 await page.screenshot({path:testInfo.outputPath('studio.png'),fullPage:true});
 await page.locator('.workspace-link[data-view="rigs"]').click();
 await page.locator('#rigName').fill('Browser test rig');
 await page.locator('#saveRig').click();
 await expect(page.locator('#rigList')).toContainText('Browser test rig');
 await page.reload();await page.locator('.workspace-link[data-view="rigs"]').click();
 await expect(page.locator('#rigList')).toContainText('Browser test rig');
 await page.locator('.workspace-link[data-view="gear"]').click();
 await expect(page.locator('#real-gear')).toBeVisible();
 await expect(page.locator('#gearResults a[href*="amazon"]').first()).toHaveAttribute('href',/tag=guitar-tuner0a-20/);
 expect(errors).toEqual([]);
});
test('WCAG accessibility report for each workspace',async({page},testInfo)=>{
 await page.goto('/guitar-amp.html');
 const all=[];
 for(const view of ['studio','practice','rigs','gear']){
  await page.locator('.workspace-link[data-view="'+view+'"]').click();
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  for(const v of result.violations)all.push({workspace:view,id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)});
 }
 await testInfo.attach('accessibility-report',{body:JSON.stringify(all,null,2),contentType:'application/json'});
 expect(all).toEqual([]);
});
test('demo starts only after the user presses play',async({page})=>{
 await page.goto('/guitar-amp.html');
 await expect(page.locator('#media')).toBeHidden();
 await page.locator('#demo').click();
 await expect(page.locator('#media')).toBeVisible();
 await expect.poll(()=>page.locator('#media').evaluate(el=>el.currentTime),{timeout:12000}).toBeGreaterThan(0.1);
 await expect(page.locator('#status')).toContainText(/generated|playing/i);
});

test('amp knob supports pointer drag and native keyboard adjustment',async({page})=>{
 await page.goto('/guitar-amp.html');
 const gain=page.locator('#gain');await gain.focus();const initial=Number(await gain.inputValue());
 await gain.press('ArrowRight');await expect.poll(async()=>Number(await gain.inputValue())).toBeGreaterThan(initial);
 const dial=page.locator('label[for="gain"] .dial-display');await dial.scrollIntoViewIfNeeded();
 const r=await dial.boundingBox();expect(r).not.toBeNull();
 const before=Number(await gain.inputValue());
 await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(r.x+r.width/2,r.y+r.height/2-35,{steps:5});await page.mouse.up();
 await expect.poll(async()=>Number(await gain.inputValue())).toBeGreaterThan(before);
});
test('local waveform supports seeking and loop selection',async({page},testInfo)=>{
 // Original generated test signal, no third-party assets or network upload.
 const rate=16000,frames=rate*8,buf=Buffer.alloc(44+2*frames);
 buf.write('RIFF',0);buf.writeUInt32LE(buf.length-8,4);buf.write('WAVEfmt ',8);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(1,22);buf.writeUInt32LE(rate,24);buf.writeUInt32LE(rate*2,28);buf.writeUInt16LE(2,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(frames*2,40);
 for(let i=0;i<frames;i++)buf.writeInt16LE(Math.round(Math.sin(i*2*Math.PI*220/rate)*6000),44+i*2);
 await page.goto('/guitar-amp.html');
 await page.locator('#file').setInputFiles({name:'test-guitar.wav',mimeType:'audio/wav',buffer:buf});
 await expect(page.locator('#recordingTimeline')).toBeVisible();
 await expect(page.locator('#waveSeek')).toBeEnabled({timeout:15000});
 await expect(page.locator('#waveStatus')).toContainText('Original recording waveform',{timeout:15000});
 const seek=page.locator('#waveSeek');await seek.fill('250');
 await expect.poll(()=>page.locator('#media').evaluate(el=>el.currentTime)).toBeCloseTo(2,0);
 await page.locator('#waveA').click();await seek.fill('750');
 await expect.poll(()=>page.locator('#media').evaluate(el=>el.currentTime)).toBeCloseTo(6,0);
 await page.locator('#waveB').click();await expect(page.locator('#waveLoop')).toBeVisible();
 await expect(page.locator('#waveToggle')).toBeEnabled();await page.locator('#waveToggle').click();
 await expect(page.locator('#waveToggle')).toHaveText('Stop looping');
 await page.screenshot({path:testInfo.outputPath('waveform.png'),fullPage:true});
});

test('record both versions of a take, stop input and download or reamp',async({page},testInfo)=>{
 // Generate a test-only input with Web Audio, without requesting a physical microphone.
 await page.addInitScript(()=>{
  if(!navigator.mediaDevices)return;
  navigator.mediaDevices.getUserMedia=async()=>{
   const ac=window.__testCaptureContext=new (window.AudioContext||window.webkitAudioContext)();
   const output=ac.createMediaStreamDestination(),osc=ac.createOscillator(),gain=ac.createGain();osc.frequency.value=220;gain.gain.value=.06;osc.connect(gain);gain.connect(output);osc.start();
   window.__testCaptureTrack=output.stream.getAudioTracks()[0];ac.resume().catch(()=>{});return output.stream;
  };
 });
 await page.goto('/guitar-amp.html');
 test.skip(!(await page.evaluate(()=>!!window.MediaRecorder&&!!navigator.mediaDevices)),'MediaRecorder unavailable');
 await page.locator('#mic').click();
 try{await expect(page.locator('#recordLive')).toBeEnabled({timeout:15000})}catch(e){
  const diagnostics=await page.evaluate(()=>({status:document.querySelector('#status')?.textContent,engine:typeof ctx!=='undefined'?ctx?.state:null,testInput:window.__testCaptureContext?.state,testTrack:window.__testCaptureTrack?.readyState,secure:isSecureContext,hidden:document.hidden,activation:navigator.userActivation?.hasBeenActive}));
  console.log('MICROPHONE_DIAGNOSTICS '+JSON.stringify(diagnostics));throw e;
 }
 await page.locator('#recordLive').click();
 await expect(page.locator('#takeStatus')).toContainText('Recording original and amplified');
 await expect(page.locator('#takeTimer')).not.toHaveText('00:00',{timeout:5000});
 await page.locator('#stopLive').click();
 await expect(page.locator('#takeReview')).toBeVisible({timeout:15000});
 await expect(page.locator('#takeStatus')).toContainText('Take ready');
 await expect.poll(()=>page.evaluate(()=>window.__testCaptureTrack.readyState)).toBe('ended');
 for(const [id,tag] of [['saveWet','amplified'],['saveDry','original']]){
  const dl=page.waitForEvent('download');await page.locator('#'+id).click();
  const file=await dl;expect(file.suggestedFilename()).toMatch(new RegExp(tag+'\\.'));
  expect(await file.failure()).toBeNull();
  const fs=require('node:fs');expect(fs.statSync(await file.path()).size).toBeGreaterThan(100);
 }
 await page.screenshot({path:testInfo.outputPath('take-review.png'),fullPage:true});
 await page.locator('#reampTake').click();await expect(page.locator('#status')).toContainText('Original take loaded',{timeout:15000});await expect(page.locator('#play')).toBeEnabled();
 await page.evaluate(()=>window.__testCaptureContext?.close());
});

test('NAM lab loads local synthetic model and processes a test recording',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/guitar-nam-lab.html');
 test.skip(!(await page.evaluate(()=>!!window.AudioWorkletNode&&!!window.WebAssembly)),'AudioWorklet or WebAssembly unavailable');
 // Original one-tap linear fixture: validates execution only, not amp tone.
 const model={version:'0.5.4',architecture:'Linear',config:{receptive_field:1,bias:false},weights:[0.5],sample_rate:48000,metadata:{name:'Synthetic half-gain test fixture'}};
 const rate=48000,frames=rate*2,buf=Buffer.alloc(44+2*frames);
 buf.write('RIFF',0);buf.writeUInt32LE(buf.length-8,4);buf.write('WAVEfmt ',8);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(1,22);buf.writeUInt32LE(rate,24);buf.writeUInt32LE(rate*2,28);buf.writeUInt16LE(2,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(frames*2,40);
 for(let i=0;i<frames;i++)buf.writeInt16LE(Math.round(Math.sin(i*2*Math.PI*220/rate)*6000),44+i*2);
 await page.locator('#namModel').setInputFiles({name:'synthetic.nam',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(model))});
 await page.locator('#namAudio').setInputFiles({name:'synthetic.wav',mimeType:'audio/wav',buffer:buf});
 await page.locator('#namPrepare').click();
 await expect(page.locator('#namStatus')).toContainText('Model ready',{timeout:35000});
 await page.locator('#namPlay').click();
 await expect(page.locator('#namStatus')).toContainText('Playing recording');
 await page.locator('#namBypass').click();await expect(page.locator('#namBypass')).toHaveAttribute('aria-pressed','true');
 await page.locator('#namStop').click();await expect(page.locator('#namPlay')).toBeEnabled();
 if(await page.evaluate(()=>!!window.MediaRecorder)){
  await page.locator('#namExport').click();
  await expect(page.locator('#namDownload')).toBeEnabled({timeout:12000});
  const dl=page.waitForEvent('download');await page.locator('#namDownload').click();const file=await dl;
  expect(file.suggestedFilename()).toMatch(/^neural-guitar\./);expect(require('node:fs').statSync(await file.path()).size).toBeGreaterThan(100);
 }
 await page.screenshot({path:testInfo.outputPath('neural-lab.png'),fullPage:true});
 expect(errors).toEqual([]);
});
test('NAM lab rejects malformed captures without starting playback',async({page})=>{
 await page.goto('/guitar-nam-lab.html');
 await page.locator('#namModel').setInputFiles({name:'invalid.nam',mimeType:'application/json',buffer:Buffer.from('{"invalid":true}')});
 await page.locator('#namAudio').setInputFiles({name:'invalid.wav',mimeType:'audio/wav',buffer:Buffer.from('invalid')});
 await page.locator('#namPrepare').click();
 await expect(page.locator('#namPlay')).toBeDisabled();
 await expect(page.locator('#namStatus')).toContainText('Invalid or unsupported NAM model file.');
});

test('studio neural capture replaces the amp, processes a signal and restores the built-in route',async({page},testInfo)=>{
 await page.goto('/guitar-amp.html');const errors=[];page.on('pageerror',e=>errors.push(e.message));
 test.skip(!(await page.evaluate(()=>!!window.AudioWorkletNode&&!!window.WebAssembly)),'AudioWorklet or WebAssembly unavailable');
 const rate=await page.evaluate(()=>{const C=window.AudioContext||window.webkitAudioContext;let a;try{a=new C({sampleRate:48000})}catch{a=new C()}const rate=a.sampleRate;a.close().catch(()=>{});return rate});
 const model={version:'0.5.4',architecture:'Linear',config:{receptive_field:1,bias:false},weights:[0.5],sample_rate:rate,metadata:{name:'Synthetic half-gain test fixture'}};
 await page.locator('#namControls summary').click();
 await page.locator('#studioNamFile').setInputFiles({name:'linear-test.nam',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(model))});
 await page.locator('#studioNamLoad').click();
 await expect(page.locator('#studioNamStatus')).toContainText('linear-test.nam active',{timeout:35000});
 await expect(page.locator('#ampName')).toHaveText('Neural capture');
 await expect(page.locator('#gain')).toBeDisabled();
 await expect(page.locator('#cab')).toBeDisabled();
 const frames=rate*4,buf=Buffer.alloc(44+frames*2);
 buf.write('RIFF',0);buf.writeUInt32LE(buf.length-8,4);buf.write('WAVEfmt ',8);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(1,22);buf.writeUInt32LE(rate,24);buf.writeUInt32LE(rate*2,28);buf.writeUInt16LE(2,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(frames*2,40);
 for(let i=0;i<frames;i++)buf.writeInt16LE(Math.round(Math.sin(i*2*Math.PI*220/rate)*3500),44+i*2);
 await page.locator('#file').setInputFiles({name:'test.wav',mimeType:'audio/wav',buffer:buf});
 await expect(page.locator('#waveSeek')).toBeEnabled();
 await page.locator('#guitar').selectOption('direct');
 await page.locator('#input').fill('0');await page.locator('#bass').fill('0');
 await page.evaluate(()=>{window.__namIn=ctx.createAnalyser();window.__namOut=ctx.createAnalyser();g.ampIn.connect(window.__namIn);g.bass.connect(window.__namOut)});
 await page.locator('#play').click();
 await expect.poll(()=>page.evaluate(()=>{
  const rms=node=>{const samples=new Float32Array(node.fftSize);node.getFloatTimeDomainData(samples);return Math.sqrt(samples.reduce((sum,x)=>sum+x*x,0)/samples.length)};
  const input=rms(window.__namIn),output=rms(window.__namOut);return input>.005&&output/input>.3&&output/input<.7;
 }),{timeout:7000}).toBe(true);
 await page.locator('#play').click();await expect(page.locator('#studioNamClear')).toBeEnabled();
 await page.locator('.workspace-link[data-view="practice"]').click();
 await expect(page.locator('#namWavNotice')).toBeVisible();await expect(page.locator('#wavExport')).toBeDisabled();
 await page.locator('.workspace-link[data-view="studio"]').click();await page.screenshot({path:testInfo.outputPath('studio-neural.png'),fullPage:true});
 await page.locator('#studioNamClear').click();await expect(page.locator('#gain')).toBeEnabled();
 await expect(page.locator('#studioNamStatus')).toContainText('Built-in amplifier restored');
 await page.locator('.workspace-link[data-view="practice"]').click();await expect(page.locator('#namWavNotice')).toBeHidden();await expect(page.locator('#wavExport')).toBeEnabled();
 expect(errors).toEqual([]);
});

test('bundled MIT neural captures load without uploads and switch back safely',async({page},testInfo)=>{
 await page.goto('/guitar-amp.html');
 test.skip(!(await page.evaluate(()=>!!window.AudioWorkletNode&&!!window.WebAssembly)),'AudioWorklet or WebAssembly unavailable');
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.locator('#namClean').click();
 await expect(page.locator('#namStarterStatus')).toContainText('RiffSmith Clean active',{timeout:35000});
 await expect(page.locator('#namClean')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#namDistorted')).toHaveAttribute('aria-pressed','false');
 await page.locator('#namDistorted').click();
 await expect(page.locator('#namStarterStatus')).toContainText('RiffSmith Distorted active',{timeout:35000});
 await expect(page.locator('#namDistorted')).toHaveAttribute('aria-pressed','true');
 await page.locator('#demo').click();
 await expect.poll(()=>page.locator('#media').evaluate(el=>el.currentTime),{timeout:12000}).toBeGreaterThan(.1);
 await page.locator('#play').click();
 await expect(page.locator('#namStarterClear')).toBeEnabled();
 await page.screenshot({path:testInfo.outputPath('starter-captures.png'),fullPage:true});
 await page.locator('#namStarterClear').click();
 await expect(page.locator('#ampName')).not.toHaveText('Neural capture');
 await expect(page.locator('#namDistorted')).toHaveAttribute('aria-pressed','false');
 expect(errors).toEqual([]);
});
