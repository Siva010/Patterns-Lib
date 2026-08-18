/* Verification for LC 297, serialize and deserialize.

   Two independent things are checked, because the page has two halves and a
   round trip can be right by accident if both halves are wrong the same way:

   1. THE STRING. The tokens serialize produces must equal a preorder walk with
      explicit null markers, computed here by a separate traversal. If only the
      round trip were checked, a serializer and deserializer that agreed on some
      private encoding would pass while producing a string nobody else can read.

   2. THE ROUND TRIP. The tree rebuilt from that string, read out of panel 1,
      must equal the source — compared level-order with null placeholders.

   usage: node dev/verify/v_ser.js                                            */
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

/* ORACLE 1: preorder with explicit null markers, by its own traversal */
function preorderMarked(root) {
  const out = [];
  (function w(n) {
    if (!n) { out.push("#"); return; }
    out.push(String(n.val));
    w(n.left); w(n.right);
  })(root);
  return out;
}
/* ORACLE 2: level-order equality with null placeholders */
function sameByLevels(p, q) {
  const h = n => n ? 1 + Math.max(h(n.left), h(n.right)) : 0;
  let lp = [p], lq = [q];
  const H = Math.max(h(p), h(q));
  for (let d = 0; d <= H; d++) {
    if (lp.length !== lq.length) return false;
    for (let i = 0; i < lp.length; i++) {
      const a = lp[i], b = lq[i];
      if ((a == null) !== (b == null)) return false;
      if (a && b && a.val !== b.val) return false;
    }
    const np = [], nq = [];
    for (const n of lp) { np.push(n ? n.left : null); np.push(n ? n.right : null); }
    for (const n of lq) { nq.push(n ? n.left : null); nq.push(n ? n.right : null); }
    lp = np; lq = nq;
  }
  return true;
}

function gen(maxN) {
  const n = 1 + Math.floor(Math.random() * maxN);
  const out = [1 + Math.floor(Math.random() * 9)];
  let q = [0], count = 1;
  while (q.length && count < n) {
    const nq = [];
    for (const _ of q) for (let s = 0; s < 2; s++) {
      if (count >= n || Math.random() < 0.33) out.push("null");
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
    events.unshift({ type: "START", line: 0, depth: 0 });
  if (!events.some(e => e.type === "DONE"))
    events.push({ type: "DONE", line: 0, depth: 0, value: res });
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
        if (cfg.checkText && f.check) cfg.checkText(f.check, st);
      }
    } catch (e) { bad.push(`hook threw i=${i}: ${e.message.slice(0, 60)}`); break; }
  }
  return bad;
}

function purity(tr) {
  const n = tr.events.length, idxs = [];
  if (n <= 220) { for (let i = 0; i < n; i++) idxs.push(i); }
  else { const step = Math.ceil(n / 200); for (let i = 0; i < n; i += step) idxs.push(i); if (idxs[idxs.length - 1] !== n - 1) idxs.push(n - 1); }
  const up = {};
  for (const i of idxs) up[i] = shape(T.assembleTree(null, T.replayTo(tr, i).built[1]));
  for (let j = idxs.length - 1; j >= 0; j--) {
    const i = idxs[j];
    if (shape(T.assembleTree(null, T.replayTo(tr, i).built[1])) !== up[i]) return "index " + i;
  }
  return null;
}

function v297() {
  const { cfg, file } = cfgOf("297");
  const toks = ["[]", "[1]", "[1,2]", "[1,null,2]", "[1,2,3]", "[1,2,3,null,null,4,5]",
    "[1,2,null,3,null,4]", "[1,null,2,null,3]", "[1,2,3,4,5,6,7]"];
  for (const p of cfg.presets) toks.push(p.tokens);
  for (let i = 0; i < 160; i++) toks.push(gen(12));

  const CORRECT = "mark";
  let ct = 0, strBad = [], tripBad = [], cv = [], sp = [], per = {};
  for (const tk of toks) {
    let root; try { root = tree(tk); } catch (e) { continue; }
    const wantStr = preorderMarked(root).join(",");
    ct++;
    for (let vi = 0; vi < cfg.variants.length; vi++) {
      const id = cfg.variants[vi].id;
      per[id] = per[id] || { str: 0, trip: 0, total: 0 };
      let tr; try { tr = runTrace(cfg, root, vi); }
      catch (e) { tripBad.push([tk, id, "threw " + e.message.slice(0, 40)]); continue; }
      per[id].total++;

      const st = T.replayTo(tr, tr.events.length - 1);
      const gotStr = (st.done && st.done.toks ? st.done.toks : []).join(",");
      if (gotStr === wantStr) per[id].str++;
      else if (id === CORRECT) strBad.push([tk, "want " + wantStr, "got " + gotStr]);

      const rebuilt = T.assembleTree(null, st.built[1]);
      if (sameByLevels(rebuilt, root)) per[id].trip++;
      else if (id === CORRECT) tripBad.push([tk, id, "want " + shape(root), "got " + shape(rebuilt)]);

      cv.push(...contract(cfg, tr).map(m => [tk + " " + id, m]));
      const s = purity(tr);
      if (s) sp.push([tk, id, s]);
    }
  }
  console.log(`LC 297  ${file}`);
  console.log(`   oracle 1   the string must equal preorder with explicit null markers`);
  console.log(`   oracle 2   the rebuilt tree must equal the source (level-order)`);
  console.log(`   trees      ${ct}`);
  for (const id in per) {
    const p = per[id], role = id === CORRECT ? "correct" : "WRONG  ";
    console.log(`   ${role} "${id}"  string ${p.str}/${p.total}   round trip ${p.trip}/${p.total}` +
      (id !== CORRECT ? `   (round trip diverges ${p.total - p.trip}/${p.total})` : ""));
  }
  if (strBad.length) console.log(`      string: ${JSON.stringify(strBad.slice(0, 2))}`);
  if (tripBad.length) console.log(`      trip:   ${JSON.stringify(tripBad.slice(0, 2))}`);
  console.log(`   contract   ${cv.length ? "FAIL " + JSON.stringify(cv.slice(0, 2)) : "PASS"}`);
  console.log(`   structural purity  ${sp.length ? "FAIL " + JSON.stringify(sp.slice(0, 2)) : "PASS"}`);
  const ok = !strBad.length && !tripBad.length && !cv.length && !sp.length &&
             per[CORRECT].str === per[CORRECT].total && per[CORRECT].trip === per[CORRECT].total &&
             Object.keys(per).every(id => id === CORRECT || per[id].trip < per[id].total);
  return ok;
}

const ok = v297();
console.log("\n" + (ok ? "ALL PASS" : "FAILURES ABOVE"));
process.exit(ok ? 0 : 1);
