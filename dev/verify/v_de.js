const fs=require("fs"),path=require("path"),vm=require("vm");
const DIR="Visuals", T=require(path.resolve(DIR,"tree-engine.js"));
const {randTokens,sameValTokens,DEGEN}=require("./gen.js");
function load(lc){
  const file=fs.readdirSync(DIR).find(x=>x.startsWith(lc+"-")&&x.endsWith(".html"));
  const html=fs.readFileSync(path.join(DIR,file),"utf8");
  const src=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>/\.mount\(/.test(s));
  let cfg=null; const fake=Object.assign({},T,{mount:c=>(cfg=c,{})});
  const sb={window:{TreeLab:fake,matchMedia:()=>({matches:false}),addEventListener(){}},
            document:{getElementById:()=>null,querySelector:()=>null,addEventListener(){}},console};
  sb.globalThis=sb; vm.createContext(sb); vm.runInContext(src,sb,{timeout:5000});
  return {cfg,file,html};
}
const treeOf=s=>T.buildTree(T.parseTokens(s),{maxNodes:63,maxHeight:8});
function go(cfg,tok,vi){
  const root=treeOf(tok),v=cfg.variants[vi],ev=[];
  const r=cfg.run(root,e=>ev.push(e),{variant:v,id:v.id,index:vi,L:v.lines,lines:v.lines,root,maxNodes:63,maxHeight:8});
  if(!ev.length||ev[0].type!=="START") ev.unshift({type:"START",line:0,depth:0});
  if(!ev.some(e=>e.type==="DONE")) ev.push({type:"DONE",line:0,depth:0,value:r});
  return {r,root,events:ev};
}
// oracles
const good=(n,mx)=>!n?0:((n.val>=mx?1:0)+good(n.left,Math.max(mx,n.val))+good(n.right,Math.max(mx,n.val)));
const s129=(n,c)=>!n?0:(!n.left&&!n.right)?c*10+n.val:s129(n.left,c*10+n.val)+s129(n.right,c*10+n.val);
const has=(n,rem)=>!n?false:(!n.left&&!n.right)?rem===n.val:has(n.left,rem-n.val)||has(n.right,rem-n.val);
const paths=(n,acc,out)=>{ if(!n)return out; const p=acc.concat(n.val);
  if(!n.left&&!n.right){out.push(p.join("->"));return out;} paths(n.left,p,out); paths(n.right,p,out); return out; };
const OR={
 1448:(root)=>good(root,-Infinity),
 129:(root)=>s129(root,0),
 112:(root,tgt)=>has(root,tgt),
 257:(root)=>paths(root,[],[]),
};
const CASES=DEGEN.concat(Array.from({length:170},()=>randTokens(15,6)))
                 .concat(Array.from({length:30},()=>sameValTokens(12,5)));
for(const lc of process.argv.slice(2)){
  const {cfg,file,html}=load(lc);
  const vi0=typeof cfg.defaultVariant==="number"?cfg.defaultVariant:0;
  let p=0,t=0,bad=[],cviol=[],hookErr=0;
  for(const tok of CASES){ t++; let x;
    try{x=go(cfg,tok,vi0);}catch(e){bad.push([tok,"threw "+e.message.slice(0,40)]);continue;}
    const tgt=(x.events.find(e=>e.target!==undefined)||{}).target;
    const want=OR[lc](x.root,tgt);
    const got=x.r;
    const eq=Array.isArray(want)?JSON.stringify([...want].sort())===JSON.stringify([...(got||[])].map(String).sort())
                                : got===want;
    eq?p++:bad.push([tok,"want "+JSON.stringify(want).slice(0,50),"got "+JSON.stringify(got).slice(0,50)]);
    const li=x.events.length-1, fin=T.replayTo(x,li);
    const c=x.events.filter(e=>e.type==="CALL").length, r=x.events.filter(e=>e.type==="RETURN").length;
    if(!fin.done) cviol.push([tok,"no DONE"]);
    if(c!==r) cviol.push([tok,`CALL ${c} != RETURN ${r}`]);
    if(fin.stack.length) cviol.push([tok,"stack not empty"]);
    const o={isFail:cfg.isFail||(v=>v===-1),glyph:"\u25a2",title:cfg.title||"f()"};
    for(let i=0;i<=li;i+=Math.max(1,Math.floor(li/10))){ const st=T.replayTo(x,i);
      try{ cfg.narrate&&cfg.narrate(st,o); cfg.stats&&cfg.stats(st); cfg.verdict&&cfg.verdict(st);
        for(const k of Object.keys(st.frames)){ cfg.expr&&cfg.expr(st.frames[k],st,o);
          cfg.nodeResult&&cfg.nodeResult(st.frames[k],st); cfg.nodeState&&cfg.nodeState(k,st);
          if(cfg.checkText&&st.frames[k].check) cfg.checkText(st.frames[k].check,st);}}catch(e){hookErr++;break;} }
  }
  const essay=['id="s1"','class="rail"','class="appbar"','tree-engine.css','tree-engine.js','id="lab"','--r-anchor'].filter(s=>!html.includes(s));
  console.log(`LC ${lc}  ${file}`);
  console.log(`   correct   ${p}/${t} ${p===t?"PASS":"FAIL"}${bad.length?"  "+JSON.stringify(bad.slice(0,2)).slice(0,190):""}`);
  console.log(`   contract  ${cviol.length?"FAIL "+JSON.stringify(cviol.slice(0,2)):"PASS"}   hooks ${hookErr?"FAIL":"PASS"}   essay ${essay.length?"MISSING "+JSON.stringify(essay):"PASS"}`);
  for(let vi=0;vi<cfg.variants.length;vi++){ if(vi===vi0)continue;
    let d=0,s=0; for(const tok of CASES){ try{const a=go(cfg,tok,vi0).r,b=go(cfg,tok,vi).r;
      (JSON.stringify(a)===JSON.stringify(b))?s++:d++;}catch(e){} }
    console.log(`   variant "${cfg.variants[vi].id||cfg.variants[vi].label}" diverges ${d}/${d+s}`); }
  console.log();
}
