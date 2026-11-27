const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'.',testMatch:'studio.spec.cjs',timeout:45000,
 use:{baseURL:'http://127.0.0.1:8765',trace:'retain-on-failure',screenshot:'only-on-failure'},
 reporter:[['list'],['html',{open:'never'}]],
 projects:[
 {name:'chromium-desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:900}}},
 {name:'chromium-mobile',use:{...devices['Pixel 7']}},
 {name:'webkit-mobile',use:{...devices['iPhone 13']}},
 {name:'firefox-desktop',use:{...devices['Desktop Firefox']}},
 // Diagnostic run only; the normal Firefox profile remains unchanged.
 {name:'firefox-audio-permitted',grep:/record both versions|NAM lab loads|studio neural capture/,use:{...devices['Desktop Firefox'],launchOptions:{firefoxUserPrefs:{'media.autoplay.default':0,'media.autoplay.block-webaudio':false}}}}
 ],
 webServer:{command:'python3 -m http.server 8765 --bind 127.0.0.1',cwd:require('path').resolve(__dirname,'../..'),url:'http://127.0.0.1:8765/guitar-amp.html',reuseExistingServer:!process.env.CI}
});
