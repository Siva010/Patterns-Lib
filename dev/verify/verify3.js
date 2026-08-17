const fs=require("fs"),path=require("path"),vm=require("vm");
const DIR="Visuals", T=require(path.resolve(DIR,"tree-engine.js"));
const {randTokens,sameValTokens,DEGEN}=require("./gen.js");
function cfgOf(lc){
  const file=fs.readdirSync(DIR).find(x=>x.startsWith(lc+"-")&&x.endsWith(".html"));
  const html=fs.readFileSync(path.join(DIR,file),"utf8");
  const src=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>/\.mount\(/.test(s));
  if(!src) return null;
  let cap=null; const fake=Object.assign({},T,{mount:c=>(cap=c,{})});
  const sb={window:{TreeLab:fake,matchMedia:()=>({matches:false}),addEventListener(){}},
            document:{getElementById:()=>null,querySelector:()=>null,addEventListener(){}},console};
  sb.globalThis=sb; vm.createContext(sb); vm.runInContext(src,sb,{timeout:5000});
  return {cfg:cap,file,html};
}
const treeOf=s=>T.buildTree(T.parseTokens(s),{maxNodes:63,maxHeight:8});
function trace(cfg,tok,vi){
  const root=treeOf(tok),v=cfg.variants[vi],ev=[];
  const res=cfg.run(root,e=>ev.push(e),{variant:v,id:v.id,index:vi,L:v.lines,lines:v.lines,root,maxNodes:63,maxHeight:8});
  if(!ev.length||ev[0].type!=="START") ev.unshift({type:"START",line:(v.lines&&v.lines.TOP)||0,depth:0});
  if(!ev.some(e=>e.type==="DONE")) ev.push({type:"DONE",line:(v.lines&&v.lines.TOP)||0,depth:0,value:res});
  return {result:res,root,events:ev};
}
const H=n=>n?1+Math.max(H(n.left),H(n.right)):0;
const OR={
 104:r=>H(r),
 404:r=>{const w=(n,L)=>!n?0:(!n.left&&!n.right)?(L?n.val:0):w(n.left,true)+w(n.right,false);return w(r,false);},
 222:r=>{const c=n=>n?1+c(n.left)+c(n.right):0;return c(r);},
 543:r=>{let b=0;const h=n=>{if(!n)return 0;const l=h(n.left),q=h(n.right);b=Math.max(b,l+q);return 1+Math.max(l,q);};h(r);return b;},
 124:r=>{if(!r)return 0;let b=-Infinity;const g=n=>{if(!n)return 0;const l=Math.max(0,g(n.left)),q=Math.max(0,g(n.right));b=Math.max(b,n.val+l+q);return n.val+Math.max(l,q);};g(r);return b;},
 687:r=>{let b=0;const a=n=>{if(!n)return 0;const l=a(n.left),q=a(n.right);
   const L=(n.left&&n.left.val===n.val)?l+1:0,R=(n.right&&n.right.val===n.val)?q+1:0;
   b=Math.max(b,L+R);return Math.max(L,R);};a(r);return b;},
};
const CASES=DEGEN.concat(Array.from({length:180},()=>randTokens(15,6)))
                 .concat(Array.from({length:40},()=>sameValTokens(12,5)));
let fail=false;
for(const lc of process.argv.slice(2)){
  const got=cfgOf(lc);
  if(!got){ console.log(`LC ${lc}: not converted yet\n`); continue; }
  const {cfg,file,html}=got;
  const vi0=typeof cfg.defaultVariant==="number"?cfg.defaultVariant:0;
  let p=0,t=0,bad=[],cviol=[],hookErr=[];
  for(const tok of CASES){ t++; let tr;
    try{tr=trace(cfg,tok,vi0);}catch(e){bad.push([tok,"threw "+e.message.slice(0,40)]);continue;}
    const want=OR[lc](tr.root);
    tr.result===want?p++:bad.push([tok,"want "+want,"got "+tr.result]);
    const li=tr.events.length-1, fin=T.replayTo(tr,li);
    const c=tr.events.filter(x=>x.type==="CALL").length, r=tr.events.filter(x=>x.type==="RETURN").length;
    if(!fin.done) cviol.push([tok,"no DONE"]);
    if(c!==r) cviol.push([tok,`CALL ${c} != RETURN ${r}`]);
    if(fin.stack.length) cviol.push([tok,"stack not empty"]);
    for(const k of Object.keys(fin.pruned)) if(fin.frames[k]) cviol.push([tok,"pruned key entered"]);
    const o={isFail:cfg.isFail||(v=>v===-1),glyph:cfg.holeGlyph||"\u25a2",title:cfg.title||"f()"};
    for(let i=0;i<=li;i+=Math.max(1,Math.floor(li/12))){ const st=T.replayTo(tr,i);
      try{ cfg.narrate&&cfg.narrate(st,o); cfg.stats&&cfg.stats(st); cfg.verdict&&cfg.verdict(st);
        for(const k of Object.keys(st.frames)){ cfg.expr&&cfg.expr(st.frames[k],st,o);
          cfg.nodeResult&&cfg.nodeResult(st.frames[k],st); cfg.nodeState&&cfg.nodeState(k,st);
          if(cfg.checkText&&st.frames[k].check) cfg.checkText(st.frames[k].check,st); } }
      catch(e){ hookErr.push([tok,`i=${i} ${e.message.slice(0,40)}`]); break; } }
  }
  const essay=['id="s1"','class="rail"','class="appbar"','tree-engine.css','tree-engine.js','id="lab"','--r-anchor']
                .filter(s=>!html.includes(s));
  const ok=p===t&&!cviol.length&&!hookErr.length&&!essay.length;
  if(!ok) fail=true;
  console.log(`LC ${lc}  ${file}`);
  console.log(`   correct   ${p}/${t} ${p===t?"PASS":"FAIL"}${bad.length?"  "+JSON.stringify(bad.slice(0,2)):""}`);
  console.log(`   contract  ${cviol.length?"FAIL "+JSON.stringify(cviol.slice(0,2)):"PASS"}`);
  console.log(`   hooks     ${hookErr.length?"FAIL "+JSON.stringify(hookErr.slice(0,2)):"PASS"}`);
  console.log(`   essay     ${essay.length?"MISSING "+JSON.stringify(essay):"PASS"}`);
  for(let vi=0;vi<cfg.variants.length;vi++){ if(vi===vi0) continue;
    let d=0,s=0; for(const tok of CASES){ try{ const a=trace(cfg,tok,vi0).result,b=trace(cfg,tok,vi).result;
      (JSON.stringify(a)===JSON.stringify(b))?s++:d++; }catch(e){} }
    console.log(`   variant "${cfg.variants[vi].id||cfg.variants[vi].label}" diverges ${d}/${d+s}`); }
  console.log();
}
process.exit(fail?1:0);
