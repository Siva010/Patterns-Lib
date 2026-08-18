/* Verification for LC 617, merge two binary trees.

   ORACLE: a POSITION MAP, not a second recursive merge. Walk each tree once
   recording path -> value. A node exists in the answer at path p iff p is in
   either map, and its value is a[p] + b[p] treating a missing side as 0. That
   is a set-union over addresses rather than a parallel descent, so it agrees
   with the code under test only if both are actually right.

   The page has two correct variants that write to DIFFERENT panels — the
   in-place merge lands in panel 0 on top of tree a, the copying one builds a
   fresh tree in panel 2 — so the panel is looked up per variant.

   usage: node dev/verify/v_merge.js                                          */
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

/* path -> value for one tree */
function posMap(root) {
  const m = {};
  (function w(n, p) { if (!n) return; m[p] = n.val; w(n.left, p + "L"); w(n.right, p + "R"); })(root, "R");
  return m;
}
/* the answer, assembled from the union of addresses */
function mergeByPositions(a, b) {
  const ma = posMap(a), mb = posMap(b);
  function mk(p) {
    const has = (p in ma) || (p in mb);
    if (!has) return null;
    return { val: (ma[p] || 0) + (mb[p] || 0), left: mk(p + "L"), right: mk(p + "R") };
  }
  return mk("R");
}

function genDistinct(maxN) {
  const n = 1 + Math.floor(Math.random() * maxN);
  const out = [1 + Math.floor(Math.random() * 9)];
  let q = [0], count = 1;
  while (q.length && count < n) {
    const nq = [];
    for (const _ of q) for (let s = 0; s < 2; s++) {
      if (count >= n || Math.random() < 0.34) out.push("null");
      else { out.push(1 + Math.floor(Math.random() * 9)); nq.push(1); count++; }
    }
    q = nq;
    if (out.length > 70) break;
  }
  while (out.length && out[out.length - 1] === "null") out.pop();
  return "[" + out.join(",") + "]";
}

function runTrace(cfg, A, B, vi) {
  const v = cfg.variants[vi], events = [];
  const res = cfg.run(A, e => events.push(e), { variant: v, id: v.id, index: vi,
    L: v.lines, lines: v.lines, root: A, root2: B, maxNodes: 63, maxHeight: 8 });
  if (!events.length || events[0].type !== "START")
    events.unshift({ type: "START", line: (v.lines && v.lines.TOP) || 0, depth: 0 });
  if (!events.some(e => e.type === "DONE"))
    events.push({ type: "DONE", line: (v.lines && v.lines.TOP) || 0, depth: 0, value: res });
  return { events, result: res };
}

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
        if (cfg.nodeState && f.refs) for (const r of f.refs) cfg.nodeState(k, st, { t: r.t || 0, key: r.key, frame: f });
        if (cfg.checkText && f.check) cfg.checkText(f.check, st);
      }
    } catch (e) { bad.push(`hook threw i=${i}: ${e.message.slice(0, 60)}`); break; }
  }
  return bad;
}

function purity(tr, panel, base) {
  const n = tr.events.length, idxs = [];
  if (n <= 220) { for (let i = 0; i < n; i++) idxs.push(i); }
  else { const step = Math.ceil(n / 200); for (let i = 0; i < n; i += step) idxs.push(i); if (idxs[idxs.length - 1] !== n - 1) idxs.push(n - 1); }
  const up = {}, down = {};
  for (const i of idxs) up[i] = shape(T.assembleTree(base, T.replayTo(tr, i).built[panel]));
  for (let j = idxs.length - 1; j >= 0; j--) { const i = idxs[j]; down[i] = shape(T.assembleTree(base, T.replayTo(tr, i).built[panel])); }
  for (const i of idxs) if (up[i] !== down[i]) return `index ${i}: up ${up[i]} vs down ${down[i]}`;
  return null;
}

const PANEL = { inplace: 0, nullnull: 0, noadd: 0, copy: 2 };
const CORRECT = ["inplace", "copy"];

function v617() {
  const { cfg, file } = cfgOf("617");
  const pairs = [["[1,3,2,5]", "[2,1,3,null,4,null,7]"], ["[]", "[]"], ["[]", "[1,2,3]"],
    ["[1,2,3]", "[]"], ["[1]", "[1,2]"], ["[1,2,3]", "[4,5,6]"], ["[1,null,2]", "[1,2]"],
    ["[1]", "[1]"], ["[1,2,3,4,5,6,7]", "[1,2,3,4,5,6,7]"]];
  for (const p of cfg.presets) pairs.push([p.tokens, p.tokens2 || "[]"]);
  for (let i = 0; i < 160; i++) pairs.push([genDistinct(11), genDistinct(11)]);

  let ct = 0, bad = [], cv = [], sp = [], per = {};
  for (const [ta, tb] of pairs) {
    let A, B; try { A = tree(ta); B = tree(tb); } catch (e) { continue; }
    const want = shape(mergeByPositions(A, B));
    ct++;
    for (let vi = 0; vi < cfg.variants.length; vi++) {
      const id = cfg.variants[vi].id, panel = PANEL[id];
      per[id] = per[id] || { match: 0, total: 0 };
      let tr; try { tr = runTrace(cfg, A, B, vi); }
      catch (e) { bad.push([ta, tb, id, "threw " + e.message.slice(0, 40)]); continue; }
      per[id].total++;
      const st = T.replayTo(tr, tr.events.length - 1);
      const base = panel === 0 ? A : null;
      const got = shape(T.assembleTree(base, st.built[panel]));
      if (got === want) per[id].match++;
      else if (CORRECT.indexOf(id) >= 0) bad.push([ta + " + " + tb, id, "want " + want, "got " + got]);
      cv.push(...contract(cfg, tr).map(m => [ta + "+" + tb + " " + id, m]));
      const s = purity(tr, panel, base);
      if (s) sp.push([ta + "+" + tb, id, s]);
    }
  }
  console.log(`LC 617  ${file}`);
  console.log(`   oracle     union of addresses, values summed (not a parallel descent)`);
  console.log(`   pairs      ${ct}`);
  for (const id in per) {
    const p = per[id], role = CORRECT.indexOf(id) >= 0 ? "correct" : "WRONG  ";
    console.log(`   ${role} "${id}"  panel ${PANEL[id]}  matches ${p.match}/${p.total}` +
      (CORRECT.indexOf(id) < 0 ? `   diverges ${p.total - p.match}/${p.total}` : ""));
  }
  if (bad.length) console.log(`      ${JSON.stringify(bad.slice(0, 3))}`);
  console.log(`   contract   ${cv.length ? "FAIL " + JSON.stringify(cv.slice(0, 2)) : "PASS"}`);
  console.log(`   structural purity  ${sp.length ? "FAIL " + JSON.stringify(sp.slice(0, 2)) : "PASS"}`);
  const wrongOk = Object.keys(per).every(id =>
    CORRECT.indexOf(id) >= 0 ? per[id].match === per[id].total : per[id].match < per[id].total);
  return !bad.length && !cv.length && !sp.length && wrongOk;
}

const ok = v617();
console.log("\n" + (ok ? "ALL PASS" : "FAILURES ABOVE"));
process.exit(ok ? 0 : 1);
