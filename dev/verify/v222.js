const fs=require("fs"),path=require("path"),vm=require("vm");
const DIR="Visuals", T=require(path.resolve(DIR,"tree-engine.js"));
const html=fs.readFileSync(path.join(DIR,"222-count-complete-tree-nodes.html"),"utf8");
const src=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>/\.mount\(/.test(s));
let cfg=null; const fake=Object.assign({},T,{mount:c=>(cfg=c,{})});
const sb={window:{TreeLab:fake,matchMedia:()=>({matches:false}),addEventListener(){}},
          document:{getElementById:()=>null,querySelector:()=>null,addEventListener(){}},console};
sb.globalThis=sb; vm.createContext(sb); vm.runInContext(src,sb,{timeout:5000});
const treeOf=s=>T.buildTree(T.parseTokens(s),{maxNodes:63,maxHeight:8});
const run=(tok,vi)=>{const root=treeOf(tok),v=cfg.variants[vi],ev=[];
  return {r:cfg.run(root,e=>ev.push(e),{variant:v,id:v.id,index:vi,L:v.lines,lines:v.lines,root,maxNodes:63,maxHeight:8}),root,ev};};
const count=n=>n?1+count(n.left)+count(n.right):0;
const complete=n=>"["+Array.from({length:n},(_,i)=>i+1).join(",")+"]";   // level-order, no gaps
const vi0=typeof cfg.defaultVariant==="number"?cfg.defaultVariant:0;
const names=cfg.variants.map(v=>v.id||v.label);
let p=0,t=0,bad=[],agree=0;
for(let n=1;n<=60;n++){ t++;
  const a=run(complete(n),vi0), b=run(complete(n),1-vi0);
  const want=count(a.root);
  if(a.r===want) p++; else bad.push([n,"want "+want,"got "+a.r]);
  if(a.r===b.r) agree++; else bad.push([n,"variants disagree",a.r,b.r]);
}
console.log(`LC 222 on COMPLETE trees (its actual precondition), sizes 1..60`);
console.log(`   correct        ${p}/${t} ${p===t?"PASS":"FAIL"}`);
console.log(`   both variants agree ${agree}/${t} ${agree===t?"PASS":"FAIL"}`);
if(bad.length) console.log("   ",JSON.stringify(bad.slice(0,3)));
// call counts: the whole point of the page
console.log("\n   perfect trees — calls, "+names[vi0]+" vs "+names[1-vi0]+":");
for(const h of [1,2,3,4]){ const n=(1<<h)-1;
  const a=run(complete(n),vi0), b=run(complete(n),1-vi0);
  const ca=a.ev.filter(e=>e.type==="CALL").length, cb=b.ev.filter(e=>e.type==="CALL").length;
  console.log(`     ${String(n).padStart(3)} nodes:  ${String(ca).padStart(3)}  vs ${String(cb).padStart(4)}   answer ${a.r}/${b.r}`); }
