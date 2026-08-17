/* Verification for the mutation pages (226 now; 114, 117 as they land).

   Oracle for 226: build the mirror as a FRESH tree with a plain recursive
   rebuild — mirror(n) = node(n.val, mirror(n.right), mirror(n.left)) — and
   compare shapes. This shares no method with the in-place pointer rewiring
   under test, which is the point: re-running a swap to check a swap would
   agree with itself even when both are wrong.

   Also asserts STRUCTURAL replay purity: the tree assembled at index i must be
   identical whether you sweep the trace upward or downward. That is the
   property the whole NODE/LINK design exists to preserve.

   usage: node dev/verify/v_mut.js                                           */
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

/* ORACLE: a fresh mirrored rebuild, not an in-place swap */
const mirrorRebuild = n => n ? { val: n.val, left: mirrorRebuild(n.right), right: mirrorRebuild(n.left) } : null;

function gen(maxN) {
  const n = 1 + Math.floor(Math.random() * maxN);
  const out = [1 + Math.floor(Math.random() * 9)];
  let q = [0], count = 1;
  while (q.length && count < n) {
    const nq = [];
    for (const _ of q) for (let s = 0; s < 2; s++) {
      if (count >= n || Math.random() < 0.32) out.push("null");
      else { out.push(1 + Math.floor(Math.random() * 9)); nq.push(1); count++; }
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
const finalShape = (tr, root) => {
  const st = T.replayTo(tr, tr.events.length - 1);
  return shape(T.assembleTree(root, st.built[0]));
};

function contract(cfg, tr) {
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
        if (cfg.checkText && f.check) cfg.checkText(f.check, st);
      }
    } catch (e) { bad.push(`hook threw i=${i}: ${e.message.slice(0, 60)}`); break; }
  }
  return bad;
}

/* structural purity: shapes at every index must match ascending vs descending */
function structuralPurity(tr, root) {
  const up = [], down = [];
  for (let i = 0; i < tr.events.length; i++)
    up.push(shape(T.assembleTree(root, T.replayTo(tr, i).built[0])));
  for (let i = tr.events.length - 1; i >= 0; i--)
    down[i] = shape(T.assembleTree(root, T.replayTo(tr, i).built[0]));
  for (let i = 0; i < up.length; i++) if (up[i] !== down[i]) return `index ${i}: up ${up[i]} vs down ${down[i]}`;
  // and twice at the same index
  for (const i of [0, up.length >> 1, up.length - 1]) {
    const a = shape(T.assembleTree(root, T.replayTo(tr, i).built[0]));
    const b = shape(T.assembleTree(root, T.replayTo(tr, i).built[0]));
    if (a !== b) return `index ${i} not idempotent`;
  }
  return null;
}

function v226() {
  const { cfg, file } = cfgOf("226");
  const toks = ["[]", "[1]", "[1,2,3]", "[4,2,7,1,3,6,9]", "[1,2,null,3,null,4]",
    "[1,null,2,null,3]", "[1,2,3,4,null,null,5]", "[5,5,5,5,5,5,5]",
    "[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]"];
  for (const p of cfg.presets) toks.push(p.tokens);
  for (let i = 0; i < 170; i++) toks.push(gen(13));

  const CORRECT = ["post", "pre"];
  let ct = 0, bad = [], cv = [], sp = [], perVariant = {};
  for (const tk of toks) {
    let root; try { root = tree(tk); } catch (e) { continue; }
    const want = shape(mirrorRebuild(root));
    ct++;
    for (let vi = 0; vi < cfg.variants.length; vi++) {
      const id = cfg.variants[vi].id;
      perVariant[id] = perVariant[id] || { match: 0, total: 0 };
      let tr; try { tr = runTrace(cfg, root, vi); }
      catch (e) { bad.push([tk, id, "threw " + e.message.slice(0, 40)]); continue; }
      perVariant[id].total++;
      const got = finalShape(tr, root);
      if (got === want) perVariant[id].match++;
      else if (CORRECT.indexOf(id) >= 0) bad.push([tk, id, "want " + want, "got " + got]);
      cv.push(...contract(cfg, tr).map(m => [tk + " " + id, m]));
      const s = structuralPurity(tr, root);
      if (s) sp.push([tk, id, s]);
    }
  }
  console.log(`LC 226  ${file}`);
  console.log(`   oracle     fresh mirrored rebuild (not an in-place swap)`);
  console.log(`   trees      ${ct}`);
  for (const id in perVariant) {
    const p = perVariant[id], role = CORRECT.indexOf(id) >= 0 ? "correct" : "WRONG  ";
    console.log(`   ${role} "${id}"  matches oracle ${p.match}/${p.total}` +
      (CORRECT.indexOf(id) < 0 ? `   diverges ${p.total - p.match}/${p.total}` : ""));
  }
  if (bad.length) console.log(`      ${JSON.stringify(bad.slice(0, 3))}`);
  console.log(`   contract   ${cv.length ? "FAIL " + JSON.stringify(cv.slice(0, 2)) : "PASS"}`);
  console.log(`   structural purity  ${sp.length ? "FAIL " + JSON.stringify(sp.slice(0, 2)) : "PASS (ascending == descending at every index)"}`);
  const wrongOk = Object.keys(perVariant).every(id =>
    CORRECT.indexOf(id) >= 0 ? perVariant[id].match === perVariant[id].total
                             : perVariant[id].match < perVariant[id].total);
  return !bad.length && !cv.length && !sp.length && wrongOk;
}

/* ---------------- 114 ----------------
   ORACLE: the flattened list must be the tree's PREORDER value sequence, laid
   out down .right with every .left null. Preorder is computed by a plain
   traversal of the ORIGINAL tree — it shares nothing with the reverse-preorder
   prev-pointer splicing under test. */
function v114() {
  const { cfg, file } = cfgOf("114");
  const preorder = n => n ? [n.val].concat(preorder(n.left), preorder(n.right)) : [];
  /* read a structure as a spine: returns the value list, or null if it is not
     a proper list (a surviving left pointer, or a branch) */
  function spine(n) {
    const out = [];
    let cur = n, guard = 0;
    while (cur) {
      if (cur.left) return null;              // a list has no left pointers
      out.push(cur.val);
      cur = cur.right;
      if (++guard > 200) return null;
    }
    return out;
  }

  const toks = ["[]", "[1]", "[1,2,5,3,4,null,6]", "[1,2,3,4,5,6,7]", "[1,null,2,null,3]",
    "[1,2,null,3,null,4]", "[1,2,3,null,null,4,5]", "[5,5,5,5,5]",
    "[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]"];
  for (const p of cfg.presets) toks.push(p.tokens);
  for (let i = 0; i < 170; i++) toks.push(gen(13));

  const CORRECT = ["rev"];
  let ct = 0, bad = [], cv = [], sp = [], per = {};
  for (const tk of toks) {
    let root; try { root = tree(tk); } catch (e) { continue; }
    const want = preorder(root).join(",");
    ct++;
    for (let vi = 0; vi < cfg.variants.length; vi++) {
      const id = cfg.variants[vi].id;
      per[id] = per[id] || { match: 0, total: 0, notList: 0 };
      let tr; try { tr = runTrace(cfg, root, vi); }
      catch (e) { bad.push([tk, id, "threw " + e.message.slice(0, 40)]); continue; }
      per[id].total++;
      const st = T.replayTo(tr, tr.events.length - 1);
      const asm = T.assembleTree(root, st.built[0]);
      const sp2 = spine(asm);
      if (sp2 === null) per[id].notList++;
      const got = sp2 === null ? "(not a list)" : sp2.join(",");
      if (got === want) per[id].match++;
      else if (CORRECT.indexOf(id) >= 0) bad.push([tk, id, "want " + want, "got " + got]);
      cv.push(...contract(cfg, tr).map(m => [tk + " " + id, m]));
      const s = structuralPurity(tr, root);
      if (s) sp.push([tk, id, s]);
    }
  }
  console.log(`\nLC 114  ${file}`);
  console.log(`   oracle     preorder of the original tree, laid down .right with every .left null`);
  console.log(`   trees      ${ct}`);
  for (const id in per) {
    const p = per[id], role = CORRECT.indexOf(id) >= 0 ? "correct" : "WRONG  ";
    console.log(`   ${role} "${id}"  matches ${p.match}/${p.total}` +
      (CORRECT.indexOf(id) < 0 ? `   diverges ${p.total - p.match}/${p.total}` +
        (p.notList ? `  (${p.notList} not even a list)` : "") : ""));
  }
  if (bad.length) console.log(`      ${JSON.stringify(bad.slice(0, 3))}`);
  console.log(`   contract   ${cv.length ? "FAIL " + JSON.stringify(cv.slice(0, 2)) : "PASS"}`);
  console.log(`   structural purity  ${sp.length ? "FAIL " + JSON.stringify(sp.slice(0, 2)) : "PASS (ascending == descending at every index)"}`);
  const wrongOk = Object.keys(per).every(id =>
    CORRECT.indexOf(id) >= 0 ? per[id].match === per[id].total : per[id].match < per[id].total);
  return !bad.length && !cv.length && !sp.length && wrongOk;
}

const ok = v226() & v114();
console.log("\n" + (ok ? "ALL PASS" : "FAILURES ABOVE"));
process.exit(ok ? 0 : 1);
