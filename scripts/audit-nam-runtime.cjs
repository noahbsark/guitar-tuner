// Audit-only: collect provenance, without running upstream build scripts.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const dest=path.resolve(__dirname,'../vendor/nam-runtime'),manifest=JSON.parse(fs.readFileSync(path.join(dest,'build-info.json'),'utf8'));
const report={package:manifest.name,version:manifest.version,integrity:manifest.integrity,distributionReview:'pending',metadata:null,sourceTree:null,notes:[]};
const validSha=s=>typeof s==='string'&&/^[0-9a-f]{40}$/i.test(s);
const run=(bin,args,cwd)=>execFileSync(bin,args,{cwd,encoding:'utf8',timeout:45000,maxBuffer:4*1024*1024});
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ogt-nam-audit-'));
function inspect(url,sha,dir,paths){
 if(!validSha(sha))throw Error('Source revision unavailable');
 fs.mkdirSync(dir);run('git',['init','-q'],dir);
 run('git',['-c','core.hooksPath=/dev/null','fetch','--depth=1','--filter=blob:none',url,sha],dir);
 const resolved=run('git',['rev-parse','FETCH_HEAD'],dir).trim();
 if(resolved!==sha)throw Error('Source revision mismatch');
 const tree=run('git',['ls-tree',sha,'--',...paths],dir);
 const files={};
 for(const p of paths){if(!/LICENSE|COPYING|\.gitmodules|CMakeLists\.txt/.test(p))continue;try{files[p]=run('git',['show',sha+':'+p],dir)}catch{}}
 return {url,sha,tree,files};
}
try{
 const npm=process.platform==='win32'?'npm.cmd':'npm';
 const raw=execFileSync(npm,['view',manifest.name+'@'+manifest.version,'--json'],{encoding:'utf8',timeout:45000,maxBuffer:4*1024*1024,shell:process.platform==='win32'});
 const pkg=JSON.parse(raw);
 report.metadata={version:pkg.version,license:pkg.license,gitHead:pkg.gitHead||null,repository:pkg.repository,integrity:pkg.dist?.integrity||null};
 if(pkg.version!==manifest.version||pkg.dist?.integrity!==manifest.integrity)throw Error('Registry metadata does not match staged runtime');
 if(validSha(pkg.gitHead)){
  const source=inspect('https://github.com/tone-3000/neural-amp-modeler-wasm.git',pkg.gitHead,path.join(tmp,'engine'),['LICENSE','.gitmodules','core','wasm/CMakeLists.txt']);
  report.sourceTree=source;
  const coreSha=source.tree.match(/^160000 commit ([a-f0-9]{40})\tcore$/m)?.[1];
  if(coreSha){report.core=inspect('https://github.com/sdatkinson/NeuralAmpModelerCore.git',coreSha,path.join(tmp,'core'),['LICENSE','.gitmodules','Dependencies','Dependencies/eigen','Dependencies/AudioDSPTools','Dependencies/nlohmann']);}
  else report.notes.push('Core submodule revision not identified.');
 }else report.notes.push('Registry has no usable gitHead; obtain exact build revision from upstream.');
}catch(e){report.notes.push('Provenance collection incomplete: '+String(e.message).slice(0,1000))}
finally{fs.rmSync(tmp,{recursive:true,force:true})}
report.notes.push('Registry source metadata is not a reproducible-build attestation. Audit Eigen source availability, JSON and toolchain notices, and exact compiled dependency versions before public distribution. This report does not grant release clearance.');
fs.writeFileSync(path.join(dest,'provenance.json'),JSON.stringify(report,null,2)+'\n');
console.log('NAM provenance:',JSON.stringify({metadata:report.metadata,sourceRevision:report.sourceTree?.sha,coreRevision:report.core?.sha,notes:report.notes}));
