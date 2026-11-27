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
 await page.locator('#takeName').fill('Recorded browser take');await page.locator('#renameTake').click();
 await page.locator('#persistTake').click();await expect(page.locator('#persistTake')).toHaveText('Saved on this device');
 await page.screenshot({path:testInfo.outputPath('take-review.png'),fullPage:true});
 await page.reload();await expect(page.locator('#takeSelect')).toContainText('Recorded browser take');await expect(page.locator('#persistTake')).toHaveText('Saved on this device');
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
 test.setTimeout(100000);
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
 await page.locator('#namCrunch').click();await expect(page.locator('#namStarterStatus')).toContainText('ToneTinkerer Crunch active',{timeout:35000});await expect(page.locator('#cab')).toBeEnabled();
 await page.locator('#namLead').click();await expect(page.locator('#namStarterStatus')).toContainText('ToneTinkerer Lead active',{timeout:35000});await expect(page.locator('#cab')).toBeEnabled();
 await page.screenshot({path:testInfo.outputPath('starter-captures.png'),fullPage:true});
 await page.locator('#namStarterClear').click();
 await expect(page.locator('#ampName')).not.toHaveText('Neural capture');
 await expect(page.locator('#namDistorted')).toHaveAttribute('aria-pressed','false');
 await expect(page.locator('#namLead')).toHaveAttribute('aria-pressed','false');
 expect(errors).toEqual([]);
});

test('camera permission is optional and a performance video contains processed audio',async({page},testInfo)=>{
 test.setTimeout(75000);
 await page.addInitScript(()=>{
  if(!navigator.mediaDevices)return;
  window.__cameraRequests=[];window.__rejectCamera=true;
  navigator.mediaDevices.getUserMedia=async constraints=>{
   window.__cameraRequests.push({audio:!!constraints.audio,video:!!constraints.video});
   if(constraints.video){
    if(window.__rejectCamera)throw new DOMException('Test camera permission denied','NotAllowedError');
    const canvas=document.createElement('canvas');canvas.width=320;canvas.height=240;const p=canvas.getContext('2d');let i=0;
    const draw=()=>{p.fillStyle='#234635';p.fillRect(0,0,320,240);p.fillStyle='#f4c477';p.fillRect(i++%250,80,50,60)};draw();
    window.__cameraTimer=setInterval(draw,40);
    const stream=canvas.captureStream(24);window.__cameraTrack=stream.getVideoTracks()[0];return stream;
   }
   const ac=window.__testCaptureContext=new (window.AudioContext||window.webkitAudioContext)();
   const output=ac.createMediaStreamDestination(),osc=ac.createOscillator(),gain=ac.createGain();osc.frequency.value=220;gain.gain.value=.06;osc.connect(gain);gain.connect(output);osc.start();
   window.__testCaptureTrack=output.stream.getAudioTracks()[0];ac.resume().catch(()=>{});return output.stream;
  };
  // Observe the native recorder inputs without replacing its encoder.
  if(window.MediaRecorder){const Native=window.MediaRecorder;window.__recorderTracks=[];window.MediaRecorder=new Proxy(Native,{construct(target,args){window.__recorderTracks.push({audio:args[0].getAudioTracks().map(t=>t.id),video:args[0].getVideoTracks().length});return Reflect.construct(target,args)}})}
 });
 await page.goto('/guitar-amp.html');
 test.skip(!(await page.evaluate(()=>!!window.MediaRecorder&&!!navigator.mediaDevices&&!!HTMLCanvasElement.prototype.captureStream&&['video/webm;codecs=vp8,opus','video/webm','video/mp4'].some(t=>MediaRecorder.isTypeSupported(t)))),'Video capture or recorder unavailable');
 await expect(page.locator('#cameraStart')).toBeDisabled();
 await page.locator('#mic').click();await expect(page.locator('#cameraStart')).toBeEnabled({timeout:15000});
 await page.locator('#cameraStart').click();await expect(page.locator('#cameraStatus')).toContainText('Camera unavailable');
 await expect(page.locator('#recordLive')).toBeEnabled();
 await page.evaluate(()=>{window.__rejectCamera=false});
 await page.locator('#cameraStart').click();await expect(page.locator('#cameraFrame')).toBeVisible();
 await expect(page.locator('#cameraStatus')).toContainText('Camera ready');
 await page.locator('#cameraStop').click();
 await expect(page.locator('#cameraFrame')).toBeHidden();
 await expect.poll(()=>page.evaluate(()=>window.__cameraTrack.readyState)).toBe('ended');
 await page.evaluate(()=>clearInterval(window.__cameraTimer));
 await page.locator('#cameraStart').click();await expect(page.locator('#cameraFrame')).toBeVisible();
 await page.locator('#recordLive').click();await expect(page.locator('#takeStatus')).toContainText('Recording video, original and amplified');
 await expect(page.locator('#takeTimer')).not.toHaveText('00:00',{timeout:5000});
 await page.locator('#stopLive').click();
 await expect(page.locator('#saveVideo')).toBeEnabled({timeout:15000});
 await expect(page.locator('#takeVideoPreview')).toBeVisible();
 await expect.poll(()=>page.locator('#takeVideoPreview').evaluate(v=>v.videoWidth),{timeout:10000}).toBeGreaterThan(0);
 await expect.poll(()=>page.evaluate(()=>[window.__cameraTrack.readyState,window.__testCaptureTrack.readyState])).toEqual(['ended','ended']);
 const capture=await page.evaluate(()=>({requests:window.__cameraRequests,recorders:window.__recorderTracks,processed:g.record.stream.getAudioTracks()[0].id}));
 expect(capture.requests.filter(r=>r.video).every(r=>!r.audio)).toBe(true);
 expect(capture.recorders.find(r=>r.video===1)?.audio).toEqual([capture.processed]);
 const dl=page.waitForEvent('download');await page.locator('#saveVideo').click();const file=await dl;
 expect(file.suggestedFilename()).toMatch(/performance\.(webm|mp4)$/);
 expect(await file.failure()).toBeNull();expect(require('node:fs').statSync(await file.path()).size).toBeGreaterThan(1000);
 await expect(page.locator('#saveWet')).toBeEnabled();await expect(page.locator('#saveDry')).toBeEnabled();
 await page.screenshot({path:testInfo.outputPath('performance-video.png'),fullPage:true});
 // Render a short excerpt of the real encoded performance. Validate container
 // bytes, preserve the original, and verify decoded video dimensions.
 await page.locator('#takeEditor summary').click();
 await page.locator('#editStart').fill('0');
 await page.locator('#editEnd').fill('0.7');
 await page.locator('#editFadeIn').fill('0.05');
 await page.locator('#editFadeOut').fill('0.05');
 const editedDownload=page.waitForEvent('download');
 await page.locator('#editRender').click();
 const edited=await editedDownload;
 expect(edited.suggestedFilename()).toMatch(/guitar-edited-video\.(mp4|webm)$/);
 expect(await edited.failure()).toBeNull();
 const editedBytes=require('node:fs').readFileSync(await edited.path());
 expect(editedBytes.length).toBeGreaterThan(1000);
 await expect(page.locator('#editStatus')).toContainText('Original unchanged');
 await expect(page.locator('#saveVideo')).toBeEnabled();
 const dims=await page.evaluate(async({base64,mime})=>{
  const data=Uint8Array.from(atob(base64),c=>c.charCodeAt(0)),url=URL.createObjectURL(new Blob([data],{type:mime})),v=document.createElement('video');
  try{await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Edited video metadata timeout')),8000);v.onloadedmetadata=()=>{clearTimeout(timeout);resolve()};v.onerror=()=>{clearTimeout(timeout);reject(Error('Edited video decode failed'))};v.src=url;v.load()});return [v.videoWidth,v.videoHeight]}finally{v.removeAttribute('src');v.load();URL.revokeObjectURL(url)}
 },{base64:editedBytes.toString('base64'),mime:edited.suggestedFilename().endsWith('.mp4')?'video/mp4':'video/webm'});
 expect(dims[0]).toBeGreaterThan(0);expect(dims[1]).toBeGreaterThan(0);
 await page.evaluate(()=>{clearInterval(window.__cameraTimer);window.__testCaptureContext?.close()});
});

test('saved recording survives reload and non-destructive editor creates valid trimmed WAV',async({page},testInfo)=>{
 await page.goto('/guitar-amp.html');
 test.skip(!(await page.evaluate(()=>!!window.indexedDB&&!!window.AudioContext)),'Local storage or Web Audio unavailable');
 await expect(page.locator('#libraryStatus')).toContainText('0 of 10 saved');
 await page.evaluate(async()=>{
  const rate=16000,frames=rate*4,ab=new ArrayBuffer(44+frames*2),d=new DataView(ab);
  const str=(i,s)=>{for(let j=0;j<s.length;j++)d.setUint8(i+j,s.charCodeAt(j))};str(0,'RIFF');d.setUint32(4,ab.byteLength-8,true);str(8,'WAVEfmt ');d.setUint32(16,16,true);d.setUint16(20,1,true);d.setUint16(22,1,true);d.setUint32(24,rate,true);d.setUint32(28,rate*2,true);d.setUint16(32,2,true);d.setUint16(34,16,true);str(36,'data');d.setUint32(40,frames*2,true);
  for(let i=0;i<frames;i++)d.setInt16(44+i*2,Math.round(Math.sin(i*2*Math.PI*220/rate)*5000),true);
  const part={bytes:ab,type:'audio/wav'};
  await new Promise((resolve,reject)=>{const open=indexedDB.open('ogt-guitar-recordings',1);open.onerror=()=>reject(Error('Fixture open: '+(open.error?.message||'unknown')));open.onsuccess=()=>{const db=open.result,tx=db.transaction('takes','readwrite');const req=tx.objectStore('takes').put({id:'test-persisted-take',name:'Library fixture',seconds:4,saved:true,storageVersion:2,wet:part,dry:part,video:null});let detail;req.onerror=()=>{detail=req.error};tx.oncomplete=()=>{db.close();resolve()};tx.onerror=tx.onabort=()=>{db.close();reject(Error('Fixture write: '+(tx.error?.message||detail?.message||'unknown')))}}});
 });
 await page.reload();await expect(page.locator('#takeSelect')).toContainText('Library fixture');await expect(page.locator('#persistTake')).toHaveText('Saved on this device');
 await page.locator('#takeName').fill('Edited test take');await page.locator('#renameTake').click();await expect(page.locator('#takeSelect')).toContainText('Edited test take');
 await page.locator('#takeEditor summary').click();
 await page.locator('#editStart').fill('1');await page.locator('#editEnd').fill('3');await page.locator('#editFadeIn').fill('0.1');await page.locator('#editFadeOut').fill('0.1');await page.locator('#editNormalize').check();
 const dl=page.waitForEvent('download');await page.locator('#editRender').click();const file=await dl;
 const bytes=require('node:fs').readFileSync(await file.path()),rate=bytes.readUInt32LE(24),channels=bytes.readUInt16LE(22),frames=bytes.readUInt32LE(40)/(channels*2);
 expect(bytes.toString('ascii',0,4)).toBe('RIFF');expect(frames/rate).toBeCloseTo(2,2);
 expect(Math.abs(bytes.readInt16LE(44))).toBeLessThan(3);
 expect(Math.abs(bytes.readInt16LE(bytes.length-2))).toBeLessThan(3);
 await expect(page.locator('#editStatus')).toContainText('Original unchanged');
 await page.screenshot({path:testInfo.outputPath('local-library-editor.png'),fullPage:true});
 await page.reload();await expect(page.locator('#takeSelect')).toContainText('Edited test take');await expect(page.locator('#saveWet')).toBeEnabled();
 page.once('dialog',d=>d.accept());await page.locator('#deleteTake').click();await expect(page.locator('#takeReview')).toBeHidden();
 await page.reload();await expect(page.locator('#libraryStatus')).toContainText('0 of 10 saved');await expect(page.locator('#takeReview')).toBeHidden();
});
test('offline echo experiment gives an explicitly synthetic result and WAV download',async({page})=>{
 await page.goto('/guitar-echo-lab.html');
 await page.locator('#filterDemo').click();await expect(page.locator('#filterStatus')).toContainText('Synthetic room: delay 20.0 ms');
 await expect(page.locator('#filterReview')).toBeVisible();await expect(page.locator('#filterDownload')).toBeEnabled();
 const dl=page.waitForEvent('download');await page.locator('#filterDownload').click();const file=await dl;
 const bytes=require('node:fs').readFileSync(await file.path());expect(bytes.readUInt32LE(24)).toBe(16000);expect(bytes.readUInt16LE(22)).toBe(1);
});
test('responsive studio controls fit 360, 390, 768 and 1440 pixels',async({page},testInfo)=>{
 test.skip(testInfo.project.name!=='chromium-desktop','Viewport matrix runs once in desktop Chromium');
 await page.goto('/guitar-amp.html');
 for(const width of [360,390,768,1440]){
  await page.setViewportSize({width,height:900});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await expect(page.locator('#mic')).toBeVisible();await expect(page.locator('#panicAudio')).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('responsive-'+width+'.png'),fullPage:true});
 }
});

test('emergency stop rejects late microphone permission and releases acquired tracks',async({page})=>{
 // Replace only the device acquisition boundary in the served HTML fixture.
 // WebKit may expose different MediaDevices wrappers across JS worlds; mutating
 // navigator in page.evaluate was intermittent. Everything after the grant
 // still runs through the actual studio's permission and cancellation logic.
 await page.route('**/guitar-amp.html',async route=>{
  const response=await route.fetch(),html=await response.text();
  const needle='await navigator.mediaDevices.getUserMedia({audio:';
  expect(html).toContain(needle);
  await route.fulfill({response,body:html.replace(needle,'await window.__requestTestMic({audio:').replace('if(!navigator.mediaDevices?.getUserMedia)throw Error','if(!window.__requestTestMic)throw Error')});
 });
 await page.addInitScript(()=>{
  window.__requestTestMic=()=>new Promise(resolve=>{window.__grantMic=()=>{
   const C=window.AudioContext||window.webkitAudioContext,ac=window.__lateContext=new C();
   const dest=ac.createMediaStreamDestination();window.__lateTrack=dest.stream.getAudioTracks()[0];resolve(dest.stream);
  }});
 });
 await page.goto('/guitar-amp.html');
 test.skip(!(await page.evaluate(()=>!!(window.AudioContext||window.webkitAudioContext))),'Web Audio unavailable');
 await page.locator('#mic').click();
 await expect.poll(()=>page.evaluate(()=>typeof window.__grantMic),{timeout:10000}).toBe('function');
 await expect(page.locator('#panicAudio')).toBeEnabled();await page.locator('#panicAudio').click();
 await page.evaluate(()=>window.__grantMic());
 await expect.poll(()=>page.evaluate(()=>window.__lateTrack?.readyState)).toBe('ended');
 await expect(page.locator('#recordLive')).toBeDisabled();
 await expect(page.locator('#mic')).toBeEnabled();
 expect(await page.evaluate(()=>mode)).not.toBe('mic');
 await page.evaluate(()=>window.__lateContext?.close());
});
