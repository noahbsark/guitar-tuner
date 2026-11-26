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
