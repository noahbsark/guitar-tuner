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
 await expect(page.locator('#status')).toContainText(/generated|playing/i);
});
