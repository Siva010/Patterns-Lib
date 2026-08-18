/* Verification for the construction pages (105 now; 106, 297, 617 as they land).

   ORACLE: the rebuilt tree must be structurally IDENTICAL to the preset tree
   the traversals were derived from. That is the strongest oracle available for
   these problems and it shares no method with the range arithmetic under test —
   the comparison is a level-order walk with null placeholders, not a second
   recursive build.

   Also asserted:
     - every LINK names a child that some NODE actually created
     - structural replay purity on the BUILT panel: the tree assembled at index
       i is identical sweeping the trace up or down
     - the usual trace contract

   usage: node dev/verify/v_build.js                                         */
const fs = require("fs"), path = require("path"), vm = require("vm");
const DIR = "Visuals";
const T = require(path.resolve(DIR, "tree-engine.js"));
const LIM = { maxNodes: 63, maxHeight: 8 };

function cfgOf(lc) {
  const f = fs.readdirSync(DIR).find(x => x.startsWith(lc + "-") && x.endsWith(".html"));
  const html = fs.readFileSync(path.join(DIR, f), "utf8");
  const src = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1])
                .filter(s => /\.mount\(/.test(s)).pop();
  if (!src) throw new Error("no adapter in " + f);
  let cap = null;
  const fake = Object.assign({}, T, { mount: c => (cap = c, {}) });
  const sb = { window: { TreeLab: fake, matchMedia: () => ({ matches: false }), addEventListener() {} },
    document: { getElementById: () => null, querySelector: () => null, addEventListener() {} }, console };
  sb.globalThis = sb; vm.createContext(sb);
  vm.runInContext(src, sb, { timeout: 8000 });
  if (!cap) throw new Error("adapter never mounted in " + f);
  return { cfg: cap, file: f };
}
const tree = s => T.buildTree(T.parseTokens(s), LIM);
const shape = n => !n ? "." : "(" + n.val + " " + shape(n.left) + " " + shape(n.right) + ")";

/* level-order equality with null placeholders — not a recursive compare */
function sameByLevels(p, q) {
  const h = n => n ? 1 + Math.max(h(n.left), h(n.right)) : 0;
  let lp = [p], lq = [q];
  const H = Math.max(h(p), h(q));
  for (let d = 0; d <= H; d++) {
    if (lp.length !== lq.length) return false;
    for (let i = 0; i < lp.length; i++) {
      const a = lp[i], b = lq[i];
      if ((a === null || a === undefined) !== (b === null || b === undefined)) return false;
      if (a && b && a.val !== b.val) return false;
    }
    const np = [], nq = [];
    for (const n of lp) { np.push(n ? n.left : null); np.push(n ? n.right : null); }
    for (const n of lq) { nq.push(n ? n.left : null); nq.push(n ? n.right : null); }
    lp = np; lq = nq;
  }
  return true;
}

/* well-formed tree with DISTINCT values — both problems require it */
function genDistinct(maxN) {
  const n = 1 + Math.floor(Math.random() * maxN);
  const pool = [];
  for (let i = 1; i <= 60; i++) pool.push(i);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  let p = 0;
  const out = [pool[p++]];
  let q = [0], count = 1;
  while (q.length && count < n) {
    const nq = [];
    for (const _ of q) for (let s = 0; s < 2; s++) {
      if (count >= n || Math.random() < 0.32) out.push("null");
      else { out.push(pool[p++]); nq.push(1); count++; }
    }
    q = nq;
    if (out.length > 70) break;
  }
  while (out.length && out[out.length - 1] === "null") out.pop();
  return "[" + out.join(",") + "]";
}

function runTrace(cfg, root, vi) {
  const v = cfg.variants[vi], events = [];
  const res = cfg.run(root, e => events.push(e), { variant: v, id: v.id, index: vi,
    L: v.lines, lines: v.lines, root, maxNodes: 63, maxHeight: 8 });
  if (!events.length || events[0].type !== "START")
    events.unshift({ type: "START", line: (v.lines && v.lines.TOP) || 0, depth: 0 });
  if (!events.some(e => e.type === "DONE"))
    events.push({ type: "DONE", line: (v.lines && v.lines.TOP) || 0, depth: 0, value: res });
  return { events, result: res };
}

function contract(cfg, tr, panel) {
  const bad = [], li = tr.events.length - 1, fin = T.replayTo(tr, li);
  const calls = tr.events.filter(e => e.type === "CALL").length;
  const rets = tr.events.filter(e => e.type === "RETURN").length;
  if (!fin.done) bad.push("no DONE");
  if (calls !== rets) bad.push(`CALL ${calls} != RETURN ${rets}`);
  if (fin.stack.length) bad.push("stack not empty");
  const seen = {};
  for (const e of tr.events) if (e.type === "CALL") {
    if (seen[e.key]) bad.push("DUPLICATE frame key " + e.key);
    seen[e.key] = 1;
  }
  // every LINK child must have been created by a NODE
  const made = {};
  for (const e of tr.events) {
    if (e.type === "NODE") made[(e.t || 0) + ":" + e.key] = 1;
    if (e.type === "LINK" && e.child != null && !made[(e.t || 0) + ":" + e.child])
      bad.push("LINK to uncreated child " + e.child);
  }
  const o = { isFail: cfg.isFail || (v => v === -1), glyph: "▢", title: "f()" };
  for (let i = 0; i <= li; i++) {
    const st = T.replayTo(tr, i);
    try {
      cfg.narrate && cfg.narrate(st, o);
      cfg.stats && cfg.stats(st);
      cfg.verdict && cfg.verdict(st);
      for (const k of Object.keys(st.frames)) {
        const f = st.frames[k];
        cfg.expr && cfg.expr(f, st, o);
        cfg.nodeResult && cfg.nodeResult(f, st);
        cfg.nodeState && cfg.nodeState(k, st);
        if (cfg.nodeState && f.refs) for (const r of f.refs) cfg.nodeState(k, st, { t: r.t || 0, key: r.key, frame: f });
        if (cfg.checkText && f.check) cfg.checkText(f.check, st);
      }
    } catch (e) { bad.push(`hook threw i=${i}: ${e.message.slice(0, 60)}`); break; }
  }
  return bad;
}

function structuralPurity(tr, panel) {
  const up = [], down = [];
  for (let i = 0; i < tr.events.length; i++)
    up.push(shape(T.assembleTree(null, T.replayTo(tr, i).built[panel])));
  for (let i = tr.events.length - 1; i >= 0; i--)
    down[i] = shape(T.assembleTree(null, T.replayTo(tr, i).built[panel]));
  for (let i = 0; i < up.length; i++) if (up[i] !== down[i]) return `index ${i}: up ${up[i]} vs down ${down[i]}`;
  return null;
}

function verify(lc, correctIds, panel) {
  let cfg, file;
  try { ({ cfg, file } = cfgOf(lc)); }
  catch (e) { console.log(`LC ${lc}  SETUP FAIL — ${e.message}`); return false; }

  const toks = ["[]", "[1]", "[1,2]", "[1,null,2]", "[3,9,20,null,null,15,7]",
    "[1,2,3,4,5,6,7]", "[1,2,null,3,null,4]", "[1,null,2,null,3]", "[5,3,8,2,4,7,9]"];
  for (const p of cfg.presets) toks.push(p.tokens);
  for (let i = 0; i < 170; i++) toks.push(genDistinct(13));

  let ct = 0, bad = [], cv = [], sp = [], per = {};
  for (const tk of toks) {
    let root; try { root = tree(tk); } catch (e) { continue; }
    ct++;
    for (let vi = 0; vi < cfg.variants.length; vi++) {
      const id = cfg.variants[vi].id;
      per[id] = per[id] || { match: 0, total: 0 };
      let tr;
      try { tr = runTrace(cfg, root, vi); }
      catch (e) { bad.push([tk, id, "threw " + e.message.slice(0, 50)]); continue; }
      per[id].total++;
      const st = T.replayTo(tr, tr.events.length - 1);
      const built = T.assembleTree(null, st.built[panel]);
      if (sameByLevels(built, root)) per[id].match++;
      else if (correctIds.indexOf(id) >= 0) bad.push([tk, id, "want " + shape(root), "got " + shape(built)]);
      cv.push(...contract(cfg, tr, panel).map(m => [tk + " " + id, m]));
      const s = structuralPurity(tr, panel);
      if (s) sp.push([tk, id, s]);
    }
  }
  console.log(`LC ${lc}  ${file}`);
  console.log(`   oracle     rebuilt tree must equal the source (level-order, null placeholders)`);
  console.log(`   trees      ${ct}`);
  for (const id in per) {
    const p = per[id], role = correctIds.indexOf(id) >= 0 ? "correct" : "WRONG  ";
    console.log(`   ${role} "${id}"  matches ${p.match}/${p.total}` +
      (correctIds.indexOf(id) < 0 ? `   diverges ${p.total - p.match}/${p.total}` : ""));
  }
  if (bad.length) console.log(`      ${JSON.stringify(bad.slice(0, 3))}`);
  console.log(`   contract   ${cv.length ? "FAIL " + JSON.stringify(cv.slice(0, 2)) : "PASS (incl. no LINK to an uncreated node)"}`);
  console.log(`   structural purity  ${sp.length ? "FAIL " + JSON.stringify(sp.slice(0, 2)) : "PASS (ascending == descending at every index)"}`);
  const wrongOk = Object.keys(per).every(id =>
    correctIds.indexOf(id) >= 0 ? per[id].match === per[id].total : per[id].match < per[id].total);
  console.log("");
  return !bad.length && !cv.length && !sp.length && wrongOk;
}

const ok = verify("105", ["range", "cursor"], 1);
console.log(ok ? "ALL PASS" : "FAILURES ABOVE");
process.exit(ok ? 0 : 1);
