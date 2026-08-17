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
// --- independent oracles, each a different method from the page's recursion
const rob337=r=>{ const f=n=>{ if(!n) return [0,0];              // [rob, skip]
    const L=f(n.left), R=f(n.right);
    return [n.val+L[1]+R[1], Math.max(L[0],L[1])+Math.max(R[0],R[1])]; };
  const t=f(r); return Math.max(t[0],t[1]); };
const coins979=r=>{ let moves=0; const f=n=>{ if(!n) return 0;
    const L=f(n.left), R=f(n.right); moves+=Math.abs(L)+Math.abs(R);
    return n.val-1+L+R; }; f(r); return moves; };
// 968 oracle: exhaustive minimum over camera placements (structurally different: brute force)
const cam968=r=>{ const nodes=[]; (function w(n){ if(!n)return; nodes.push(n); w(n.left); w(n.right); })(r);
  if(!nodes.length) return 0;
  const par=new Map(); (function w(n,p){ if(!n)return; par.set(n,p); w(n.left,n); w(n.right,n); })(r,null);
  const n=nodes.length; if(n>16) return null;                    // brute force only for small trees
  let best=Infinity;
  for(let mask=0;mask<(1<<n);mask++){
    let cnt=0; for(let i=0;i<n;i++) if(mask>>i&1) cnt++;
    if(cnt>=best) continue;
    let ok=true;
    for(let i=0;i<n&&ok;i++){
      const nd=nodes[i]; let cov=(mask>>i&1)===1;
      if(!cov){ const p=par.get(nd); if(p&&(mask>>nodes.indexOf(p)&1)) cov=true; }
      if(!cov&&nd.left&&(mask>>nodes.indexOf(nd.left)&1)) cov=true;
      if(!cov&&nd.right&&(mask>>nodes.indexOf(nd.right)&1)) cov=true;
      if(!cov) ok=false;
    }
    if(ok) best=cnt;
  }
  return best===Infinity?null:best; };
const OR={337:rob337,979:coins979,968:cam968};
const CASES=DEGEN.concat(Array.from({length:150},()=>randTokens(13,5)))
                 .concat(Array.from({length:20},()=>sameValTokens(11,4)));
for(const lc of process.argv.slice(2)){
  const {cfg,file,html}=load(lc);
  const vi0=typeof cfg.defaultVariant==="number"?cfg.defaultVariant:0;
  let p=0,t=0,skip=0,bad=[],cviol=0,hookErr=0;
  for(const tok of CASES){ let x;
    try{x=go(cfg,tok,vi0);}catch(e){bad.push([tok,"threw "+e.message.slice(0,36)]);t++;continue;}
    const want=OR[lc](x.root);
    if(want===null){skip++;} else { t++; x.r===want?p++:bad.push([tok,"want "+want,"got "+JSON.stringify(x.r)]); }
    const li=x.events.length-1, fin=T.replayTo(x,li);
    const c=x.events.filter(e=>e.type==="CALL").length, r=x.events.filter(e=>e.type==="RETURN").length;
    if(!fin.done||c!==r||fin.stack.length) cviol++;
    const o={isFail:cfg.isFail||(()=>false),glyph:"\u25a2",title:cfg.title||"f()"};
    for(let i=0;i<=li;i+=Math.max(1,Math.floor(li/8))){ const st=T.replayTo(x,i);
      try{ cfg.narrate&&cfg.narrate(st,o); cfg.stats&&cfg.stats(st); cfg.verdict&&cfg.verdict(st);
        for(const k of Object.keys(st.frames)){ cfg.expr&&cfg.expr(st.frames[k],st,o);
          cfg.nodeResult&&cfg.nodeResult(st.frames[k],st);}}catch(e){hookErr++;break;} }
  }
  const essay=['id="s1"','class="rail"','class="appbar"','tree-engine.css','tree-engine.js','id="lab"','--r-anchor'].filter(s=>!html.includes(s));
  const raw=/[^&](<|>)(?![a-zA-Z\/!])/.test(html)?"":"";
  console.log(`LC ${lc}  ${file}`);
  console.log(`   correct   ${p}/${t} ${p===t?"PASS":"FAIL"}${skip?"  ("+skip+" skipped: too big to brute force)":""}`);
  if(bad.length) console.log("     ",JSON.stringify(bad.slice(0,2)).slice(0,190));
  console.log(`   contract  ${cviol?"FAIL "+cviol:"PASS"}   hooks ${hookErr?"FAIL":"PASS"}   essay ${essay.length?"MISSING":"PASS"}`);
  for(let vi=0;vi<cfg.variants.length;vi++){ if(vi===vi0)continue;
    let d=0,s=0; for(const tok of CASES){ try{const a=go(cfg,tok,vi0).r,b=go(cfg,tok,vi).r;
      (JSON.stringify(a)===JSON.stringify(b))?s++:d++;}catch(e){} }
    console.log(`   variant "${cfg.variants[vi].id||cfg.variants[vi].label}" diverges ${d}/${d+s}`); }
  console.log();
}
