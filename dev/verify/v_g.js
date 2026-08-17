/* Independent check of the G pages (236, 1123).
   Oracles here are deliberately DIFFERENT from both the recursion under test
   and from the method the authoring agent used to verify:

   236  — subtree-membership counting. For every node count how many of {p,q}
          lie in its subtree; the LCA is the DEEPEST node whose count is 2.
          (agent used root-path intersection; the page uses post-order pointers)
   1123 — containment. Collect the deepest leaves, then the answer is the
          DEEPEST node whose subtree contains ALL of them.
          (agent used a pairwise LCA fold)

   usage: node v_g.js                                                        */
const fs = require("fs"), path = require("path"), vm = require("vm");
const DIR = "Visuals";
const T = require(path.resolve(DIR, "tree-engine.js"));

function configOf(lc) {
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
  if (!cap) throw new Error("no mount in " + f);
  return { cfg: cap, html, file: f };
}

const treeOf = s => T.buildTree(T.parseTokens(s), { maxNodes: 63, maxHeight: 8 });

/* well-formed LeetCode array: BFS, only non-null nodes get children */
function genTree(maxN, distinct) {
  const n = 1 + Math.floor(Math.random() * maxN);
  const vals = []; const used = new Set();
  const pick = () => { let v; do { v = Math.floor(Math.random() * 40) - 5; } while (distinct && used.has(v)); used.add(v); return v; };
  const out = [pick()]; let q = [0]; let count = 1;
  while (q.length && count < n) {
    const nq = [];
    for (const _ of q) for (const side of [0, 1]) {
      if (count >= n) { out.push("null"); continue; }
      if (Math.random() < 0.3) { out.push("null"); }
      else { out.push(pick()); nq.push(1); count++; }
    }
    q = nq;
    if (out.length > 70) break;
  }
  while (out.length && out[out.length - 1] === "null") out.pop();
  return "[" + out.join(",") + "]";
}

function runTrace(cfg, root, vi, extra) {
  const v = cfg.variants[vi], events = [];
  const opts = Object.assign({ variant: v, id: v.id, index: vi, L: v.lines, lines: v.lines,
    root, maxNodes: 63, maxHeight: 8 }, extra || {});
  const result = cfg.run(root, e => events.push(e), opts);
  if (!events.length || events[0].type !== "START")
    events.unshift({ type: "START", line: (v.lines && v.lines.TOP) || 0, depth: 0 });
  if (!events.some(e => e.type === "DONE"))
    events.push({ type: "DONE", line: (v.lines && v.lines.TOP) || 0, depth: 0, value: result });
  return { events, result, root };
}

/* ---------- contract, shared ---------- */
function contract(cfg, tr) {
  const bad = [], li = tr.events.length - 1, fin = T.replayTo(tr, li);
  const calls = tr.events.filter(e => e.type === "CALL").length;
  const rets = tr.events.filter(e => e.type === "RETURN").length;
  if (!fin.done) bad.push("no DONE");
  if (calls !== rets) bad.push(`CALL ${calls} != RETURN ${rets}`);
  if (fin.stack.length) bad.push("stack not empty");
  for (const k of Object.keys(fin.pruned)) if (fin.frames[k]) bad.push("pruned key entered: " + k);
  const o = { isFail: cfg.isFail || (v => v === -1), glyph: cfg.holeGlyph || "▢", title: cfg.title || "f()" };
  for (let i = 0; i <= li; i++) {
    const st = T.replayTo(tr, i);
    try {
      cfg.narrate && cfg.narrate(st, o);
      cfg.stats && cfg.stats(st);
      cfg.verdict && cfg.verdict(st);
      for (const k of Object.keys(st.frames)) {
        cfg.expr && cfg.expr(st.frames[k], st, o);
        cfg.nodeResult && cfg.nodeResult(st.frames[k], st);
        cfg.nodeState && cfg.nodeState(k, st);
        if (cfg.checkText && st.frames[k].check) cfg.checkText(st.frames[k].check, st);
      }
    } catch (e) { bad.push(`hook threw i=${i}: ${e.message.slice(0, 50)}`); break; }
    if (JSON.stringify(T.replayTo(tr, i).stack.map(f => f.key)) !==
        JSON.stringify(st.stack.map(f => f.key))) bad.push("impure replay at " + i);
  }
  return bad;
}

/* =======================  236  ======================= */
function verify236() {
  const { cfg, file } = configOf("236");
  const nodes = r => { const a = []; (function w(n) { if (!n) return; a.push(n); w(n.left); w(n.right); })(r); return a; };
  const depthOf = (r, n, d) => !r ? -1 : r === n ? d
    : Math.max(depthOf(r.left, n, d + 1), depthOf(r.right, n, d + 1));
  // ORACLE: deepest node whose subtree contains both targets
  function oracle(root, p, q) {
    let best = null, bestD = -1;
    for (const n of nodes(root)) {
      const sub = nodes(n).map(x => x.val);
      if (sub.includes(p) && sub.includes(q)) {
        const d = depthOf(root, n, 0);
        if (d > bestD) { bestD = d; best = n; }
      }
    }
    return best ? best.val : null;
  }
  const got = v => (v == null) ? null : (typeof v === "object" ? (v.val != null ? v.val : null) : v);

  const cases = [];
  const DEG = ["[]", "[1]", "[1,2]", "[1,2,3]", "[1,2,null,3,null,4]", "[1,null,2,null,3,null,4]",
    "[1,2,3,4,5,6,7]", "[3,5,1,6,2,0,8,null,null,7,4]"];
  for (const t of DEG) cases.push(t);
  for (let i = 0; i < 230; i++) cases.push(genTree(15, true));

  let cp = 0, ct = 0, bad = [], cviol = [], splitCases = 0, relayDiv = 0, relayTot = 0;
  const correctVi = cfg.variants.findIndex(v => v.id === "early");
  for (const tok of cases) {
    let root; try { root = treeOf(tok); } catch (e) { continue; }
    if (!root) continue;
    const vals = nodes(root).map(n => n.val);
    // up to 4 target pairs per tree
    for (let k = 0; k < 4 && vals.length; k++) {
      const p = vals[Math.floor(Math.random() * vals.length)];
      const q = vals[Math.floor(Math.random() * vals.length)];
      const want = oracle(root, p, q);
      // correct variant
      let tr; try { tr = runTrace(cfg, root, correctVi, { forcedTargets: [p, q] }); }
      catch (e) { bad.push([tok, p, q, "threw " + e.message.slice(0, 30)]); ct++; continue; }
      ct++;
      got(tr.result) === want ? cp++ : bad.push([tok, "p=" + p, "q=" + q, "want " + want, "got " + JSON.stringify(tr.result)]);
      cviol.push(...contract(cfg, tr).map(m => [tok, m]));
      // is this a genuine split (LCA is neither target)?
      const isSplit = want !== null && want !== p && want !== q;
      if (isSplit) splitCases++;
      // wrong variant must diverge on splits
      const relayVi = cfg.variants.findIndex(v => v.id === "relay");
      if (relayVi >= 0 && isSplit) {
        relayTot++;
        let t2; try { t2 = runTrace(cfg, root, relayVi, { forcedTargets: [p, q] }); } catch (e) { continue; }
        if (got(t2.result) !== want) relayDiv++;
      }
    }
  }
  console.log(`LC 236  ${file}`);
  console.log(`   variants   ${cfg.variants.map(v => v.id).join(" | ")}`);
  console.log(`   correct    ${cp}/${ct}  (oracle: deepest subtree containing both)`);
  if (bad.length) console.log(`      ${JSON.stringify(bad.slice(0, 3))}`);
  console.log(`   contract   ${cviol.length ? "FAIL " + JSON.stringify(cviol.slice(0, 3)) : "PASS"}`);
  console.log(`   genuine splits in corpus: ${splitCases}`);
  console.log(`   variant "relay" diverges on splits  ${relayDiv}/${relayTot}` +
    (relayTot && relayDiv === relayTot ? "   (100% — as the essay claims)" : ""));
  return !bad.length && !cviol.length && relayDiv === relayTot && relayTot > 20;
}

/* =======================  1123  ======================= */
function verify1123() {
  const { cfg, file } = configOf("1123");
  const nodes = r => { const a = []; (function w(n) { if (!n) return; a.push(n); w(n.left); w(n.right); })(r); return a; };
  const H = n => n ? 1 + Math.max(H(n.left), H(n.right)) : 0;
  const depthOf = (r, n, d) => !r ? -1 : r === n ? d : Math.max(depthOf(r.left, n, d + 1), depthOf(r.right, n, d + 1));
  // ORACLE: deepest node whose subtree contains EVERY deepest leaf
  function oracle(root) {
    if (!root) return null;
    const h = H(root);
    const deep = nodes(root).filter(n => !n.left && !n.right && depthOf(root, n, 1) === h);
    let best = null, bestD = -1;
    for (const n of nodes(root)) {
      const sub = new Set(nodes(n));
      if (deep.every(d => sub.has(d))) {
        const d = depthOf(root, n, 0);
        if (d > bestD) { bestD = d; best = n; }
      }
    }
    return best;
  }
  /* the adapter carries node VALUES, not node objects, so compare on value.
     The corpus below uses DISTINCT values, which makes a value comparison
     equivalent to an identity comparison. */
  const gotNode = v => (v === null || v === undefined) ? null : v;

  const cases = ["[]", "[1]", "[1,2]", "[1,2,3]", "[1,2,3,4,5,6,7]", "[1,null,2,null,3]",
    "[1,2,null,3]", "[3,5,1,6,2,0,8,null,null,7,4]", "[0,1,3,null,2]", "[1,2,3,4]"];
  for (let i = 0; i < 240; i++) cases.push(genTree(15, true));

  let cp = 0, ct = 0, bad = [], cviol = [];
  const correctVi = cfg.variants.findIndex(v => v.id === "pair");
  const div = {};
  for (const tok of cases) {
    let root; try { root = treeOf(tok); } catch (e) { continue; }
    const want = oracle(root);
    let tr; try { tr = runTrace(cfg, root, correctVi); }
    catch (e) { bad.push([tok, "threw " + e.message.slice(0, 30)]); ct++; continue; }
    ct++;
    const g = gotNode(tr.result), w = want ? want.val : null;
    (g === w) ? cp++ : bad.push([tok, "want " + w, "got " + g]);
    cviol.push(...contract(cfg, tr).map(m => [tok, m]));
    for (let vi = 0; vi < cfg.variants.length; vi++) {
      if (vi === correctVi) continue;
      const id = cfg.variants[vi].id;
      div[id] = div[id] || [0, 0]; div[id][1]++;
      let t2; try { t2 = runTrace(cfg, root, vi); } catch (e) { div[id][0]++; continue; }
      if (gotNode(t2.result) !== w) div[id][0]++;
    }
  }
  console.log(`\nLC 1123  ${file}`);
  console.log(`   variants   ${cfg.variants.map(v => v.id).join(" | ")}`);
  console.log(`   correct    ${cp}/${ct}  (oracle: deepest node containing all deepest leaves)`);
  if (bad.length) console.log(`      ${JSON.stringify(bad.slice(0, 3))}`);
  console.log(`   contract   ${cviol.length ? "FAIL " + JSON.stringify(cviol.slice(0, 3)) : "PASS"}`);
  for (const id in div) console.log(`   variant "${id}" diverges  ${div[id][0]}/${div[id][1]}`);
  return !bad.length && !cviol.length && Object.values(div).every(d => d[0] > 0);
}

const a = verify236(), b = verify1123();
console.log("\n" + (a && b ? "ALL PASS" : "FAILURES ABOVE"));
process.exit(a && b ? 0 : 1);
