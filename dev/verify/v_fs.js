/* Independent verification of 951 (flip equivalent) and 572 (subtree).
   The authoring agent died before running any verification, so nothing here
   may be assumed.

   Oracles, both chosen to be structurally different from the recursion:
   951 — EXHAUSTIVE BRUTE FORCE. Enumerate every subset of nodes to flip in
         tree 1 (2^k combinations), apply it, and test plain structural
         equality against tree 2. Flip-equivalent iff any combination matches.
   572 — enumerate EVERY node of the big tree as a candidate root and run full
         structural equality (level-order) against the pattern.

   usage: node v_fs.js                                                       */
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
const nodesOf = r => { const a = []; (function w(n) { if (!n) return; a.push(n); w(n.left); w(n.right); })(r); return a; };
const h = n => n ? 1 + Math.max(h(n.left), h(n.right)) : 0;

/* plain structural equality, level-order */
function sameTree(p, q) {
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
const clone = n => n ? { val: n.val, left: clone(n.left), right: clone(n.right) } : null;

/* 951 oracle: brute force every flip combination */
function flipEquivBrute(p, q) {
  const internals = nodesOf(p).filter(n => n.left || n.right);
  const k = internals.length;
  if (k > 12) return null;              // skip, too big to brute force
  for (let mask = 0; mask < (1 << k); mask++) {
    const c = clone(p);
    const ci = nodesOf(c).filter(n => n.left || n.right);
    for (let b = 0; b < k; b++) if (mask & (1 << b)) {
      const t = ci[b].left; ci[b].left = ci[b].right; ci[b].right = t;
    }
    if (sameTree(c, q)) return true;
  }
  return false;
}
/* 572 oracle: every node as a candidate, full equality */
function isSubtreeBrute(root, sub) {
  if (!sub) return true;
  for (const n of nodesOf(root)) if (sameTree(n, sub)) return true;
  return false;
}

function gen(maxN, lo, hi) {
  lo = lo === undefined ? 1 : lo; hi = hi === undefined ? 5 : hi;
  const rv = () => lo + Math.floor(Math.random() * (hi - lo + 1));
  const n = 1 + Math.floor(Math.random() * maxN);
  const out = [rv()]; let q = [0], count = 1;
  while (q.length && count < n) {
    const nq = [];
    for (const _ of q) for (let s = 0; s < 2; s++) {
      if (count >= n || Math.random() < 0.32) out.push("null");
      else { out.push(rv()); nq.push(1); count++; }
    }
    q = nq;
    if (out.length > 70) break;
  }
  while (out.length && out[out.length - 1] === "null") out.pop();
  return "[" + out.join(",") + "]";
}
/* a random flip of a tree, as tokens */
function randFlip(tok) {
  const r = clone(tree(tok));
  (function w(n) { if (!n) return; if (Math.random() < 0.5) { const t = n.left; n.left = n.right; n.right = t; } w(n.left); w(n.right); })(r);
  const out = []; let lvl = [r];
  while (lvl.some(x => x)) { const nx = []; for (const n of lvl) { out.push(n ? n.val : "null"); nx.push(n ? n.left : null); nx.push(n ? n.right : null); } lvl = nx; }
  while (out.length && out[out.length - 1] === "null") out.pop();
  return "[" + out.join(",") + "]";
}
/* tokens for the subtree rooted at a random node */
function subTokens(tok) {
  const r = tree(tok); if (!r) return "[]";
  const ns = nodesOf(r); const pick = ns[Math.floor(Math.random() * ns.length)];
  const out = []; let lvl = [pick];
  while (lvl.some(x => x)) { const nx = []; for (const n of lvl) { out.push(n ? n.val : "null"); nx.push(n ? n.left : null); nx.push(n ? n.right : null); } lvl = nx; }
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
        if (cfg.nodeState && f.refs) for (const r of f.refs) cfg.nodeState(k, st, { t: r.t || 0, key: r.key, frame: f });
        if (cfg.checkText && f.check) cfg.checkText(f.check, st);
      }
    } catch (e) { bad.push(`hook threw i=${i}: ${e.message.slice(0, 60)}`); break; }
    if (JSON.stringify(T.replayTo(tr, i).stack.map(f => f.key)) !== JSON.stringify(st.stack.map(f => f.key)))
      bad.push("impure replay at " + i);
  }
  return bad;
}

function report(lc, oracleName, pairs, oracle, correctId) {
  let cfg, file;
  try { ({ cfg, file } = cfgOf(lc)); }
  catch (e) { console.log(`LC ${lc}  SETUP FAIL — ${e.message}`); return false; }
  const ci = correctId ? cfg.variants.findIndex(v => v.id === correctId) : 0;
  if (ci < 0) { console.log(`LC ${lc}: no variant id "${correctId}" (have ${cfg.variants.map(v => v.id)})`); return false; }
  let cp = 0, ct = 0, bad = [], cv = [], trueN = 0, skipped = 0;
  const div = {};
  for (const [ta, tb] of pairs) {
    let A, B; try { A = tree(ta); B = tree(tb); } catch (e) { continue; }
    const want = oracle(A, B);
    if (want === null) { skipped++; continue; }
    if (want) trueN++;
    let tr; try { tr = runTrace(cfg, A, B, ci); }
    catch (e) { bad.push([ta, tb, "threw " + e.message.slice(0, 40)]); ct++; continue; }
    ct++; tr.result === want ? cp++ : bad.push([ta, tb, "want " + want, "got " + tr.result]);
    cv.push(...contract(cfg, tr).map(m => [ta + " | " + tb, m]));
    for (let vi = 0; vi < cfg.variants.length; vi++) {
      if (vi === ci) continue;
      const id = cfg.variants[vi].id; div[id] = div[id] || [0, 0]; div[id][1]++;
      let t2; try { t2 = runTrace(cfg, A, B, vi); } catch (e) { div[id][0]++; continue; }
      if (t2.result !== want) div[id][0]++;
    }
  }
  console.log(`LC ${lc}  ${file}`);
  console.log(`   variants   ${cfg.variants.map(v => v.id).join(" | ")}   [correct: ${cfg.variants[ci].id}]`);
  console.log(`   oracle     ${oracleName}`);
  console.log(`   correct    ${cp}/${ct}   (true on ${trueN}${skipped ? ", " + skipped + " too big to brute force" : ""})`);
  if (bad.length) console.log(`      ${JSON.stringify(bad.slice(0, 3))}`);
  console.log(`   contract   ${cv.length ? "FAIL " + JSON.stringify(cv.slice(0, 2)) : "PASS"}`);
  for (const id in div) console.log(`   variant "${id}" diverges  ${div[id][0]}/${div[id][1]}`);
  console.log("");
  return !bad.length && !cv.length && Object.values(div).every(d => d[0] > 0);
}

/* ---- 951 corpus ---- */
const P951 = [["[]", "[]"], ["[1]", "[1]"], ["[1]", "[2]"], ["[]", "[1]"],
  ["[1,2,3]", "[1,3,2]"], ["[1,2,3]", "[1,2,3]"], ["[1,2,3,4,5]", "[1,3,2,null,null,5,4]"],
  ["[1,2,3,4,5,6]", "[1,3,2,null,6,5,4]"], ["[1,2,3]", "[1,2,4]"], ["[5,5,5]", "[5,5,5]"]];
{
  const { cfg } = cfgOf("951");
  for (const p of cfg.presets) if (p.tokens2) P951.push([p.tokens, p.tokens2]);
}
for (let i = 0; i < 150; i++) {
  const a = gen(9, 1, 6), r = Math.random();
  P951.push([a, r < 0.5 ? randFlip(a) : gen(9, 1, 6)]);
}

/* ---- 572 corpus ---- */
const P572 = [["[3,4,5,1,2]", "[4,1,2]"], ["[3,4,5,1,2,null,null,null,null,0]", "[4,1,2]"],
  ["[1,2,3]", "[1,2]"], ["[1,2,3]", "[1,2,3]"], ["[1]", "[1]"], ["[1]", "[2]"],
  ["[]", "[1]"], ["[1,1,1,1]", "[1]"], ["[1,2,null,3]", "[2,3]"], ["[1,2,null,3]", "[2]"]];
{
  const { cfg } = cfgOf("572");
  for (const p of cfg.presets) if (p.tokens2) P572.push([p.tokens, p.tokens2]);
}
for (let i = 0; i < 150; i++) {
  const a = gen(11, 1, 4), r = Math.random();
  P572.push([a, r < 0.5 ? subTokens(a) : gen(4, 1, 4)]);
}

const ok1 = report("951", "brute force over all 2^k flip combinations", P951, flipEquivBrute, "both");
const ok2 = report("572", "full structural equality at every candidate node", P572, isSubtreeBrute, null);
console.log(ok1 && ok2 ? "ALL PASS" : "FAILURES ABOVE");
process.exit(ok1 && ok2 ? 0 : 1);
