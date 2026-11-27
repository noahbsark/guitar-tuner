// Stage the pinned npm package's engine files on the same origin. No lifecycle scripts.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{createHash}=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'vendor','nam-runtime');
const version='3.0.7',spec='neural-amp-modeler-wasm@'+version,tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ogt-nam-'));
try{
 const npm=process.platform==='win32'?'npm.cmd':'npm';
 const result=JSON.parse(execFileSync(npm,['pack',spec,'--ignore-scripts','--json','--pack-destination',tmp],{encoding:'utf8',shell:process.platform==='win32'}))[0];
 const expectedIntegrity='sha512-y0grDbAtr+im9eJP+KjDbcLhbYR8NM1mvjd8u7o4NeUC2f5SlU3E2jLTLmWqCZJ5gbzGBlT03DLCPCRHY9OEiw==';
 if(result.version!==version||result.name!=='neural-amp-modeler-wasm'||result.integrity!==expectedIntegrity)throw Error('Unexpected package metadata');
 const tarball=path.join(tmp,result.filename),actualIntegrity='sha512-'+createHash('sha512').update(fs.readFileSync(tarball)).digest('base64');
 if(actualIntegrity!==expectedIntegrity)throw Error('Downloaded package bytes failed SHA-512 verification');
 execFileSync('tar',['-xf',tarball,'-C',tmp]);
 const pkg=path.join(tmp,'package'),dist=path.join(pkg,'dist'),target=path.join(dest,'dist');
 for(const file of ['engine/index.js','engine/nam-worklet.js','engine/nam-engine.wasm'])if(!fs.existsSync(path.join(dist,file)))throw Error('Missing engine asset: '+file);
 const packageLicense=path.join(pkg,'LICENSE');
 if(!fs.existsSync(packageLicense)||!fs.readFileSync(packageLicense,'utf8').trim())throw Error('Pinned package is missing its license');
 fs.mkdirSync(dest,{recursive:true});fs.rmSync(target,{recursive:true,force:true});fs.mkdirSync(target);
 for(const dir of ['engine','chunks'])if(fs.existsSync(path.join(dist,dir)))fs.cpSync(path.join(dist,dir),path.join(target,dir),{recursive:true});
 fs.copyFileSync(packageLicense,path.join(dest,'PACKAGE-LICENSE.txt'));
 const hashFile=file=>({path:path.relative(dest,file).split(path.sep).join('/'),bytes:fs.statSync(file).size,sha256:createHash('sha256').update(fs.readFileSync(file)).digest('hex')});
 function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):e.isFile()?[path.join(dir,e.name)]:[])}
 const manifest=[...walk(target),path.join(dest,'PACKAGE-LICENSE.txt')].sort().map(hashFile);
 fs.writeFileSync(path.join(dest,'build-info.json'),JSON.stringify({name:result.name,version:result.version,integrity:actualIntegrity,source:'https://github.com/tone-3000/neural-amp-modeler-wasm',files:manifest,distributionReview:'pending'},null,2)+'\n');
 console.log('Prepared '+spec+' at '+dest+' ('+result.integrity+')');
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
