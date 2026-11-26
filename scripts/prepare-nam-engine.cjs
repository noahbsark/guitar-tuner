// Stage the pinned npm package's engine files on the same origin. No lifecycle scripts.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'vendor','nam-runtime');
const version='3.0.7',spec='neural-amp-modeler-wasm@'+version,tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ogt-nam-'));
try{
 const npm=process.platform==='win32'?'npm.cmd':'npm';
 const result=JSON.parse(execFileSync(npm,['pack',spec,'--ignore-scripts','--json','--pack-destination',tmp],{encoding:'utf8',shell:process.platform==='win32'}))[0];
 if(result.version!==version||result.name!=='neural-amp-modeler-wasm'||!result.integrity)throw Error('Unexpected package metadata');
 execFileSync('tar',['-xf',path.join(tmp,result.filename),'-C',tmp]);
 const pkg=path.join(tmp,'package'),dist=path.join(pkg,'dist'),target=path.join(dest,'dist');
 for(const file of ['engine/index.js','engine/nam-worklet.js','engine/nam-engine.wasm'])if(!fs.existsSync(path.join(dist,file)))throw Error('Missing engine asset: '+file);
 fs.mkdirSync(dest,{recursive:true});fs.rmSync(target,{recursive:true,force:true});fs.mkdirSync(target);
 for(const dir of ['engine','chunks'])if(fs.existsSync(path.join(dist,dir)))fs.cpSync(path.join(dist,dir),path.join(target,dir),{recursive:true});
 if(fs.existsSync(path.join(pkg,'LICENSE')))fs.copyFileSync(path.join(pkg,'LICENSE'),path.join(dest,'PACKAGE-LICENSE.txt'));
 fs.writeFileSync(path.join(dest,'build-info.json'),JSON.stringify({name:result.name,version:result.version,integrity:result.integrity,source:'https://github.com/tone-3000/neural-amp-modeler-wasm'},null,2)+'\n');
 console.log('Prepared '+spec+' at '+dest+' ('+result.integrity+')');
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
