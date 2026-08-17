/* Independent check of the dual-tree pages 100 and 101.

   My oracles are LEVEL-ORDER, deliberately a third method — different from the
   recursion under test (parallel descent) AND from the authoring agent's
   verification (preorder null-marked serialisation):

   100 — walk both trees breadth-first in lockstep with null placeholders;
         equal iff every level matches slot for slot.
   101 — expand each level with null placeholders; symmetric iff every level
         array equals its own reverse.

   usage: node v_bc.js                                                       */
const fs = require("fs"), path = require("path"), vm = require("vm");
const DIR = "Visuals";
const T = require(path.resolve(DIR, "tree-engine.js"));
const LIM = { maxNodes: 63, maxHeight: 8 };

function cfgOf(lc) {
  const f = fs.readdirSync(DIR).find(x => x.startsWith(lc + "-") && x.endsWith(".html"));
  const html = fs.readFileSync(path.join(DIR, f), "utf8");
  const src = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1])
                .filter(s => /\.mount\(/.test(s)).pop();
  let cap = null;
  const fake = Object.assign({}, T, { mount: c => (cap = c, {}) });
  const sb = { window: { TreeLab: fake, matchMedia: () => ({ matches: false }), addEventListener() {} },
    document: { getElementById: () => null, querySelector: () => null, addEventListener() {} }, console };
  sb.globalThis = sb; vm.createContext(sb);
  vm.runInContext(src, sb, { timeout: 8000 });
  return { cfg: cap, file: f, html };
}
const tree = s => T.buildTree(T.parseTokens(s), LIM);
const h = n => n ? 1 + Math.max(h(n.left), h(n.right)) : 0;

/* ---------- oracles, level-order ---------- */
function sameByLevels(p, q) {
  let lp = [p], lq = [q];
  const H = Math.max(h(p), h(q));
  for (let d = 0; d <= H; d++) {
    if (lp.length !== lq.length) return false;
    for (let i = 0; i < lp.length; i++) {
      const a = lp[i], b = lq[i];
      if ((a === null) !== (b === null)) return false;
      if (a && b && a.val !== b.val) return false;
    }
    const np = [], nq = [];
    for (const n of lp) { np.push(n ? n.left : null); np.push(n ? n.right : null); }
    for (const n of lq) { nq.push(n ? n.left : null); nq.push(n ? n.right : null); }
    lp = np; lq = nq;
  }
  return true;
}
function symByLevels(root) {
  if (!root) return true;
  let level = [root];
  const H = h(root);
  for (let d = 0; d < H; d++) {
    const vals = level.map(n => (n ? n.val : null));
    for (let i = 0, j = vals.length - 1; i < j; i++, j--) if (vals[i] !== vals[j]) return false;
    const next = [];
    for (const n of level) { next.push(n ? n.left : null); next.push(n ? n.right : null); }
    level = next;
  }
  return true;
}

/* ---------- well-formed generator ---------- */
function gen(maxN) {
  const n = 1 + Math.floor(Math.random() * maxN);
  const out = [1 + Math.floor(Math.random() * 6)];
  let q = [0], count = 1;
  while (q.length && count < n) {
    const nq = [];
    for (const _ of q) for (let s = 0; s < 2; s++) {
      if (count >= n || Math.random() < 0.3) { out.push("null"); }
      else { out.push(1 + Math.floor(Math.random() * 6)); nq.push(1); count++; }
    }
    q = nq;
    if (out.length > 70) break;
  }
  while (out.length && out[out.length - 1] === "null") out.pop();
  return "[" + out.join(",") + "]";
}
/* a tree and its structural mirror, as token strings */
function mirrorTokens(tok) {
  const r = tree(tok);
  const mir = (function m(n) { return n ? { val: n.val, left: m(n.right), right: m(n.left) } : null; })(r);
  // serialise back to a level-order token list
  const out = []; let lvl = [mir];
  while (lvl.some(x => x)) {
    const nx = [];
    for (const n of lvl) { out.push(n ? n.val : "null"); nx.push(n ? n.left : null); nx.push(n ? n.right : null); }
    lvl = nx;
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
  // frame keys must be unique -> one CALL per key
  const seen = {};
  for (const e of tr.events) if (e.type === "CALL") {
    if (seen[e.key]) bad.push("duplicate frame key " + e.key);
    seen[e.key] = 1;
  }
  const o = { isFail: cfg.isFail || (v => v === -1), glyph: cfg.holeGlyph || "▢", title: cfg.title || "f()" };
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
        // the dual third-argument form
        if (cfg.nodeState && f.refs) for (const r of f.refs) cfg.nodeState(k, st, { t: r.t || 0, key: r.key, frame: f });
        if (cfg.checkText && f.check) cfg.checkText(f.check, st);
      }
    } catch (e) { bad.push(`hook threw i=${i}: ${e.message.slice(0, 60)}`); break; }
    if (JSON.stringify(T.replayTo(tr, i).stack.map(f => f.key)) !== JSON.stringify(st.stack.map(f => f.key)))
      bad.push("impure replay at " + i);
  }
  return bad;
}

/* ---------------- 100 ---------------- */
function v100() {
  const { cfg, file } = cfgOf("100");
  const pairs = [["[]", "[]"], ["[]", "[1]"], ["[1]", "[]"], ["[1]", "[1]"], ["[1]", "[2]"],
    ["[1,2]", "[1,null,2]"], ["[1,2,3]", "[1,2,3]"], ["[1,2,3]", "[1,3,2]"],
    ["[1,2,3,4,5,6,7]", "[1,2,3,4,5,6,7]"], ["[5,5,5,5,5]", "[5,5,5,5,null,5]"]];
  for (const p of cfg.presets) if (p.tokens2) pairs.push([p.tokens, p.tokens2]);
  for (let i = 0; i < 180; i++) {
    const a = gen(13);
    const r = Math.random();
    pairs.push([a, r < 0.34 ? a : r < 0.67 ? mirrorTokens(a) : gen(13)]);
  }
  const ci = cfg.variants.findIndex(v => v.id === "strict");
  let cp = 0, ct = 0, bad = [], cv = [], refBad = [], trueN = 0;
  const div = {};
  for (const [ta, tb] of pairs) {
    let A, B; try { A = tree(ta); B = tree(tb); } catch (e) { continue; }
    const want = sameByLevels(A, B); if (want) trueN++;
    let tr; try { tr = runTrace(cfg, A, B, ci); } catch (e) { bad.push([ta, tb, "threw " + e.message.slice(0, 30)]); ct++; continue; }
    ct++; tr.result === want ? cp++ : bad.push([ta, tb, "want " + want, "got " + tr.result]);
    cv.push(...contract(cfg, tr).map(m => [ta + " | " + tb, m]));
    // refs must name the SAME key in both trees
    for (const e of tr.events) if (e.type === "CALL" && e.refs) {
      if (e.refs.length !== 2) refBad.push([e.key, "refs len " + e.refs.length]);
      else {
        const ts = e.refs.map(r => r.t || 0).sort().join(",");
        if (ts !== "0,1") refBad.push([e.key, "t set " + ts]);
        if (e.refs[0].key !== e.refs[1].key) refBad.push([e.key, "keys differ"]);
      }
    }
    for (let vi = 0; vi < cfg.variants.length; vi++) {
      if (vi === ci) continue;
      const id = cfg.variants[vi].id; div[id] = div[id] || [0, 0]; div[id][1]++;
      let t2; try { t2 = runTrace(cfg, A, B, vi); } catch (e) { div[id][0]++; continue; }
      if (t2.result !== want) div[id][0]++;
    }
  }
  console.log(`LC 100  ${file}`);
  console.log(`   oracle     level-order lockstep with null placeholders`);
  console.log(`   correct    ${cp}/${ct}   (oracle said equal on ${trueN})`);
  if (bad.length) console.log(`      ${JSON.stringify(bad.slice(0, 3))}`);
  console.log(`   contract   ${cv.length ? "FAIL " + JSON.stringify(cv.slice(0, 2)) : "PASS"}`);
  console.log(`   refs       ${refBad.length ? "FAIL " + JSON.stringify(refBad.slice(0, 2)) : "PASS  (2 refs, t=0&1, same key)"}`);
  for (const id in div) console.log(`   variant "${id}" diverges  ${div[id][0]}/${div[id][1]}`);
  return !bad.length && !cv.length && !refBad.length && Object.values(div).every(d => d[0] > 0);
}

/* ---------------- 101 ---------------- */
function v101() {
  const { cfg, file } = cfgOf("101");
  const toks = ["[]", "[1]", "[1,2,2,3,4,4,3]", "[1,2,2,null,3,null,3]", "[1,2,2,2,null,2]",
    "[1,2,3]", "[1,2,2]", "[1,2,2,3,4,4,3,5,6,7,8,8,7,6,5]", "[1,null,2]", "[5,5,5,5,5,5,5]"];
  for (const p of cfg.presets) toks.push(p.tokens);
  for (let i = 0; i < 120; i++) toks.push(gen(13));
  // half the corpus deliberately symmetric: build half + its mirror
  for (let i = 0; i < 70; i++) {
    const half = gen(6), hr = tree(half);
    if (!hr) continue;
    const root = { val: 0, left: hr, right: (function m(n) { return n ? { val: n.val, left: m(n.right), right: m(n.left) } : null; })(hr) };
    const out = []; let lvl = [root];
    while (lvl.some(x => x)) { const nx = []; for (const n of lvl) { out.push(n ? n.val : "null"); nx.push(n ? n.left : null); nx.push(n ? n.right : null); } lvl = nx; }
    while (out.length && out[out.length - 1] === "null") out.pop();
    toks.push("[" + out.join(",") + "]");
  }
  const ci = cfg.variants.findIndex(v => v.id === "cross");
  let cp = 0, ct = 0, bad = [], cv = [], refBad = [], trueN = 0;
  const div = {};
  for (const tk of toks) {
    let A; try { A = tree(tk); } catch (e) { continue; }
    const want = symByLevels(A); if (want) trueN++;
    let tr; try { tr = runTrace(cfg, A, null, ci); } catch (e) { bad.push([tk, "threw " + e.message.slice(0, 30)]); ct++; continue; }
    ct++; tr.result === want ? cp++ : bad.push([tk, "want " + want, "got " + tr.result]);
    cv.push(...contract(cfg, tr).map(m => [tk, m]));
    for (const e of tr.events) if (e.type === "CALL" && e.refs) {
      for (const r of e.refs) if ((r.t || 0) !== 0) refBad.push([e.key, "t=" + r.t + " but 101 has one tree"]);
      if (e.refs.length === 2 && e.refs[0].key === e.refs[1].key) refBad.push([e.key, "both cursors same node"]);
    }
    for (let vi = 0; vi < cfg.variants.length; vi++) {
      if (vi === ci) continue;
      const id = cfg.variants[vi].id; div[id] = div[id] || [0, 0]; div[id][1]++;
      let t2; try { t2 = runTrace(cfg, A, null, vi); } catch (e) { div[id][0]++; continue; }
      if (t2.result !== want) div[id][0]++;
    }
  }
  console.log(`\nLC 101  ${file}`);
  console.log(`   oracle     every BFS level equals its own reverse`);
  console.log(`   correct    ${cp}/${ct}   (oracle said symmetric on ${trueN})`);
  if (bad.length) console.log(`      ${JSON.stringify(bad.slice(0, 3))}`);
  console.log(`   contract   ${cv.length ? "FAIL " + JSON.stringify(cv.slice(0, 2)) : "PASS"}`);
  console.log(`   refs       ${refBad.length ? "FAIL " + JSON.stringify(refBad.slice(0, 2)) : "PASS  (all t=0, two distinct cursors)"}`);
  for (const id in div) console.log(`   variant "${id}" diverges  ${div[id][0]}/${div[id][1]}`);
  return !bad.length && !cv.length && !refBad.length && Object.values(div).every(d => d[0] > 0);
}

const a = v100(), b = v101();
console.log("\n" + (a && b ? "ALL PASS" : "FAILURES ABOVE"));
process.exit(a && b ? 0 : 1);
