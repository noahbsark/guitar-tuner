/* Offline reference cancellation experiment. No microphone-to-speaker routing. */
(function(root){
"use strict";
function cancelReference(reference,mic,rate=16000){
 if(rate!==16000||reference.length<rate*2||mic.length<rate*2||reference.length>rate*8||mic.length>rate*8)throw Error("Use 2–8 seconds of aligned mono audio at 16 kHz.");
 const train=Math.floor(rate*1.5),calEnd=rate*2,maxLag=Math.floor(rate*.25),stride=4;
 // Match a known reference to delayed microphone audio over the first 1.5 seconds.
 function score(lag,step){let xx=0,yy=0,xy=0;for(let i=lag;i<train;i+=step){const x=reference[i-lag],y=mic[i];xx+=x*x;yy+=y*y;xy+=x*y}return Math.abs(xy)/Math.sqrt(Math.max(1e-18,xx*yy))}
 let best=0,delay=0;for(let lag=0;lag<=maxLag;lag+=stride){const v=score(lag,8);if(v>best){best=v;delay=lag}}
 const center=delay;for(let lag=Math.max(0,center-4);lag<=Math.min(maxLag,center+4);lag++){const v=score(lag,2);if(v>best){best=v;delay=lag}}
 if(best<.08)throw Error("Reference alignment is inconclusive. Keep the original recording; use matching synchronized files.");
 const taps=384,weights=new Float64Array(taps),history=new Float64Array(taps),output=new Float32Array(mic.length);let pos=0,power=0,before=0,after=0;
 for(let i=0;i<mic.length;i++){
  const x=i>=delay&&i-delay<reference.length?reference[i-delay]:0;
  power+=x*x-history[pos]*history[pos];history[pos]=x;
  let estimate=0;for(let k=0,j=pos;k<taps;k++,j=j===0?taps-1:j-1)estimate+=weights[k]*history[j];
  const error=mic[i]-estimate;
  if(i<train&&power>1e-7){const step=.45*error/(power+1e-5);for(let k=0,j=pos;k<taps;k++,j=j===0?taps-1:j-1)weights[k]+=step*history[j]}
  output[i]=Number.isFinite(error)?error:0;
  if(i>=train&&i<calEnd){before+=mic[i]*mic[i];after+=error*error}
  pos=(pos+1)%taps;
 }
 const reduction=10*Math.log10(Math.max(1e-12,before)/Math.max(1e-12,after));
 return {output,delayMs:delay/rate*1000,correlation:best,reductionDb:reduction};
}
function synthetic(){
 const rate=16000,n=rate*5,reference=new Float32Array(n),mic=new Float32Array(n),desired=new Float32Array(n);let seed=9631;
 for(let i=0;i<n;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;reference[i]=(seed/4294967296*2-1)*.18}
 const lag=320;for(let i=0;i<n;i++){const x=j=>j>=0?reference[j]:0;desired[i]=i>=rate*2?.065*Math.sin(2*Math.PI*220*i/rate)+.025*Math.sin(2*Math.PI*440*i/rate):0;mic[i]=desired[i]+.55*x(i-lag)+.18*x(i-lag-34)-.07*x(i-lag-122)}
 const result=cancelReference(reference,mic,rate);let residual=0,raw=0;for(let i=rate*2;i<n;i++){residual+=(result.output[i]-desired[i])**2;raw+=(mic[i]-desired[i])**2}
 return {...result,reference,mic,desired,knownEchoReduction:10*Math.log10(raw/Math.max(1e-12,residual))};
}
const api={cancelReference,synthetic};if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.GuitarEchoFilter=api;
})(typeof globalThis!=="undefined"?globalThis:this);
