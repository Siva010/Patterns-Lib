const fs=require("fs"),path=require("path"),vm=require("vm");
const DIR="Visuals", T=require(path.resolve(DIR,"tree-engine.js"));
const {randTokens,DEGEN}=require("./gen.js");
const html=fs.readFileSync(path.join(DIR,"113-path-sum-ii.html"),"utf8");
const src=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>/\.mount\(/.test(s));
let cfg=null; const fake=Object.assign({},T,{mount:c=>(cfg=c,{})});
const sb={window:{TreeLab:fake,matchMedia:()=>({matches:false}),addEventListener(){}},
          document:{getElementById:()=>null,querySelector:()=>null,addEventListener(){}},console};
sb.globalThis=sb; vm.createContext(sb); vm.runInContext(src,sb,{timeout:5000});
const treeOf=s=>T.buildTree(T.parseTokens(s),{maxNodes:63,maxHeight:8});
function go(tok,vi,tgt){
  const root=treeOf(tok),v=cfg.variants[vi],ev=[];
  const o={variant:v,id:v.id,index:vi,L:v.lines,lines:v.lines,root,maxNodes:63,maxHeight:8,forcedTarget:tgt};
  const r=cfg.run(root,e=>ev.push(e),o);
  if(!ev.length||ev[0].type!=="START") ev.unshift({type:"START",line:0,depth:0});
  if(!ev.some(e=>e.type==="DONE")) ev.push({type:"DONE",line:0,depth:0,value:r});
  return {r,root,events:ev};
}
// independent oracle: every root-to-leaf path with fresh arrays
function oracle(n,acc,tgt,out){ if(!n) return out; const p=acc.concat(n.val);
  if(!n.left&&!n.right){ if(p.reduce((a,b)=>a+b,0)===tgt) out.push(p.slice()); return out; }
  oracle(n.left,p,tgt,out); oracle(n.right,p,tgt,out); return out; }
const norm=a=>JSON.stringify((a||[]).map(x=>Array.isArray(x)?x.join(","):String(x)).sort());
const vi0=typeof cfg.defaultVariant==="number"?cfg.defaultVariant:0;
const CASES=DEGEN.concat(Array.from({length:180},()=>randTokens(15,6)));
let p=0,t=0,bad=[],cviol=0,hookErr=0,withPaths=0,divNoCopy=0;
for(const tok of CASES){
  const root=treeOf(tok);
  // pick a target that actually hits sometimes
  const all=oracle(root,[],Number.MAX_SAFE_INTEGER,[]);
  const anyPath=(function f(n,a,o){if(!n)return o;const q=a.concat(n.val);
    if(!n.left&&!n.right){o.push(q);return o;}f(n.left,q,o);f(n.right,q,o);return o;})(root,[],[]);
  const tgt = anyPath.length && Math.random()<0.7
      ? anyPath[Math.floor(Math.random()*anyPath.length)].reduce((a,b)=>a+b,0)
      : 999;
  t++;
  let x; try{ x=go(tok,vi0,tgt); }catch(e){ bad.push([tok,"threw "+e.message.slice(0,40)]); continue; }
  const want=oracle(root,[],tgt,[]);
  norm(want)===norm(x.r)?p++:bad.push([tok,"tgt="+tgt,"want "+norm(want).slice(0,60),"got "+norm(x.r).slice(0,60)]);
  const li=x.events.length-1, fin=T.replayTo(x,li);
  const c=x.events.filter(e=>e.type==="CALL").length, r=x.events.filter(e=>e.type==="RETURN").length;
  if(!fin.done||c!==r||fin.stack.length) cviol++;
  const o={isFail:cfg.isFail||(()=>false),glyph:"\u25a2",title:cfg.title||"f()"};
  for(let i=0;i<=li;i+=Math.max(1,Math.floor(li/8))){ const st=T.replayTo(x,i);
    try{ cfg.narrate&&cfg.narrate(st,o); cfg.stats&&cfg.stats(st); cfg.verdict&&cfg.verdict(st);
      for(const k of Object.keys(st.frames)){ cfg.expr&&cfg.expr(st.frames[k],st,o);
        cfg.nodeResult&&cfg.nodeResult(st.frames[k],st);}}catch(e){hookErr++;break;} }
  if(want.length){ withPaths++;
    const nc=cfg.variants.findIndex(v=>/nocopy|out\.add\(path\)|Wrong: out/i.test(v.id||v.label||""));
    if(nc>=0){ try{ if(norm(go(tok,nc,tgt).r)!==norm(x.r)) divNoCopy++; }catch(e){} } }
}
console.log("LC 113  113-path-sum-ii.html");
console.log(`   correct (full path sets)   ${p}/${t} ${p===t?"PASS":"FAIL"}`);
if(bad.length) console.log("     ",JSON.stringify(bad.slice(0,2)).slice(0,220));
console.log(`   contract                   ${cviol?"FAIL "+cviol:"PASS"}   hooks ${hookErr?"FAIL":"PASS"}`);
console.log(`   no-copy diverges on trees that record something: ${divNoCopy}/${withPaths}`);
console.log(`   variants: ${cfg.variants.map((v,i)=>(i===vi0?"*":"")+(v.id||v.label)).join(" | ")}`);
