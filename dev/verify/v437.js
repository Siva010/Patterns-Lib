const fs=require("fs"),path=require("path"),vm=require("vm");
const DIR="Visuals", T=require(path.resolve(DIR,"tree-engine.js"));
const {randTokens,DEGEN}=require("./gen.js");
const html=fs.readFileSync(path.join(DIR,"437-path-sum-iii.html"),"utf8");
const src=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>/\.mount\(/.test(s));
let cfg=null; const fake=Object.assign({},T,{mount:c=>(cfg=c,{})});
const sb={window:{TreeLab:fake,matchMedia:()=>({matches:false}),addEventListener(){}},
          document:{getElementById:()=>null,querySelector:()=>null,addEventListener(){}},console};
sb.globalThis=sb; vm.createContext(sb); vm.runInContext(src,sb,{timeout:5000});
const treeOf=s=>T.buildTree(T.parseTokens(s),{maxNodes:63,maxHeight:8});
function go(tok,vi,tgt){
  const root=treeOf(tok),v=cfg.variants[vi],ev=[];
  const r=cfg.run(root,e=>ev.push(e),{variant:v,id:v.id,index:vi,L:v.lines,lines:v.lines,root,
                                      maxNodes:63,maxHeight:8,forcedTarget:tgt});
  if(!ev.length||ev[0].type!=="START") ev.unshift({type:"START",line:0,depth:0});
  if(!ev.some(e=>e.type==="DONE")) ev.push({type:"DONE",line:0,depth:0,value:r});
  return {r,root,events:ev};
}
// independent brute force: every downward path
function brute(root,tgt){ let c=0;
  const down=(n,s)=>{ if(!n)return; s+=n.val; if(s===tgt)c++; down(n.left,s); down(n.right,s); };
  const each=n=>{ if(!n)return; down(n,0); each(n.left); each(n.right); };
  each(root); return c; }
const vi0=typeof cfg.defaultVariant==="number"?cfg.defaultVariant:0;
const names=cfg.variants.map(v=>v.id||v.label);
const CASES=DEGEN.concat(Array.from({length:150},()=>randTokens(15,6)));
let p=0,t=0,bad=[],agree=0,pairs=0,cviol=0,hookErr=0;
for(const tok of CASES){
  const root=treeOf(tok);
  const vals=[]; (function w(n){if(!n)return;vals.push(n.val);w(n.left);w(n.right);})(root);
  const targets=[...new Set([0,1,-1].concat(vals.slice(0,4)))].slice(0,6);
  for(const tgt of targets){
    t++; let a; try{ a=go(tok,vi0,tgt); }catch(e){ bad.push([tok,tgt,"threw "+e.message.slice(0,30)]); continue; }
    const want=brute(root,tgt);
    a.r===want?p++:bad.push([tok,"tgt="+tgt,"want "+want,"got "+a.r]);
    // both variants must agree
    for(let vi=0;vi<cfg.variants.length;vi++){ if(vi===vi0) continue;
      pairs++; try{ if(go(tok,vi,tgt).r===a.r) agree++; }catch(e){} }
    const li=a.events.length-1, fin=T.replayTo(a,li);
    const c=a.events.filter(e=>e.type==="CALL").length, r=a.events.filter(e=>e.type==="RETURN").length;
    if(!fin.done||c!==r||fin.stack.length) cviol++;
    const o={isFail:cfg.isFail||(()=>false),glyph:"\u25a2",title:cfg.title||"f()"};
    for(let i=0;i<=li;i+=Math.max(1,Math.floor(li/6))){ const st=T.replayTo(a,i);
      try{ cfg.narrate&&cfg.narrate(st,o); cfg.stats&&cfg.stats(st); cfg.verdict&&cfg.verdict(st);
        for(const k of Object.keys(st.frames)){ cfg.expr&&cfg.expr(st.frames[k],st,o);
          cfg.nodeResult&&cfg.nodeResult(st.frames[k],st);}}catch(e){hookErr++;break;} }
  }
}
console.log("LC 437  437-path-sum-iii.html   variants:",names.map((n,i)=>(i===vi0?"*":"")+n).join(" | "));
console.log(`   correct vs brute force     ${p}/${t} ${p===t?"PASS":"FAIL"}`);
if(bad.length) console.log("     ",JSON.stringify(bad.slice(0,2)).slice(0,200));
console.log(`   naive == prefix            ${agree}/${pairs} ${agree===pairs?"PASS":"FAIL"}`);
console.log(`   contract ${cviol?"FAIL "+cviol:"PASS"}   hooks ${hookErr?"FAIL":"PASS"}`);
