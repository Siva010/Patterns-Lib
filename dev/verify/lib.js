const fs=require("fs"),path=require("path"),vm=require("vm");
function load(file){
  const t=fs.readFileSync(path.join("Visuals",file),"utf8");
  const sim=[...t.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>/buildFrames/.test(s));
  if(!sim) throw new Error("no buildFrames in "+file);
  const el=()=>new Proxy(function(){},{get:(o,k)=>
      k==="style"?{}:k==="classList"?{add(){},remove(){},toggle(){},contains(){return false}}
      :k==="dataset"?{}:k==="value"?"":k==="length"?0
      :k==="getBBox"?(()=>({x:0,y:0,width:0,height:0})):el(),
    set:()=>true, apply:()=>el()});
  const doc={getElementById:()=>el(),querySelector:()=>el(),querySelectorAll:()=>[],
    createElement:()=>el(),createElementNS:()=>el(),createTextNode:()=>el(),
    addEventListener:()=>{},documentElement:el(),body:el()};
  const sb={document:doc,window:{matchMedia:()=>({matches:false}),addEventListener(){},scrollTo(){},
    requestAnimationFrame:()=>0,getComputedStyle:()=>({getPropertyValue:()=>""})},
    localStorage:{getItem:()=>null,setItem:()=>{}},setTimeout:()=>0,clearTimeout:()=>{},
    requestAnimationFrame:()=>0,getComputedStyle:()=>({getPropertyValue:()=>""}),console,__c:null};
  sb.window.document=doc; sb.globalThis=sb; vm.createContext(sb);
  // buildFrames is a hoisted function declaration — grab it at the top of the IIFE,
  // before any DOM work in the body can throw.
  const patched=sim.replace(/\(function\s*\(\s*\)\s*\{/, m=>m+' try{ __c = buildFrames; }catch(e){} ');
  try{ vm.runInContext(patched,sb,{timeout:8000}); }catch(e){ /* page auto-run may throw on the stub */ }
  if(!sb.__c) throw new Error("could not capture buildFrames from "+file);
  return sb.__c;
}
module.exports={load};
