/* Verification for LC 834, sum of distances in tree.

   ORACLE: brute force. Run a BFS from EVERY node and sum the distances. That is
   O(n^2) and shares nothing with the two-pass rerooting under test — no sizes,
   no subtree sums, no identity. If the rerooting arithmetic is wrong anywhere,
   this disagrees.

   usage: node dev/verify/v_834.js                                            */
const fs = require("fs"), path = require("path"), vm = require("vm");
const DIR = "Visuals";
const T = require(path.resolve(DIR, "tree-engine.js"));

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

/* ORACLE: BFS from every node */
function bruteForce(n, edges) {
  const g = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) { g[a].push(b); g[b].push(a); }
  const out = [];
  for (let s = 0; s < n; s++) {
    const dist = new Array(n).fill(-1);
    dist[s] = 0;
    const q = [s];
    for (let h = 0; h < q.length; h++) {
      const u = q[h];
      for (const v of g[u]) if (dist[v] < 0) { dist[v] = dist[u] + 1; q.push(v); }
    }
    out.push(dist.reduce((a, b) => a + b, 0));
  }
  return out;
}

/* a random tree on n nodes: every node picks an earlier node as parent */
function randTree(n) {
  const edges = [];
  for (let v = 1; v < n; v++) edges.push([Math.floor(Math.random() * v), v]);
  return edges;
}
const toStr = edges => edges.map(e => e[0] + "-" + e[1]).join(", ");

function runTrace(cfg, tokensStr, vi) {
  const v = cfg.variants[vi], events = [];
  const res = cfg.run(null, e => events.push(e), { variant: v, id: v.id, index: vi,
    L: v.lines, lines: v.lines, root: null, root2: null,
    tokensStr: tokensStr, preset: { tokens: tokensStr }, maxNodes: 63, maxHeight: 8 });
  if (!events.length || events[0].type !== "START") events.unshift({ type: "START", line: 0, depth: 0 });
  if (!events.some(e => e.type === "DONE")) events.push({ type: "DONE", line: 0, depth: 0, value: res });
  return { events, result: res };
}

let fails = 0;
const ok = (name, cond, detail) => {
  if (!cond) { fails++; console.log("   FAIL " + name + (detail ? " — " + detail : "")); }
  else console.log("   ok   " + name + (detail ? " — " + detail : ""));
};

const { cfg, file } = cfgOf("834");
console.log("LC 834  " + file);
console.log("   oracle     BFS from every node, summed (O(n^2)) — no sizes, no rerooting");

const cases = [
  [[[0, 1], [0, 2], [2, 3], [2, 4], [2, 5]], 6],
  [[[0, 1]], 2],
  [[[0, 1], [1, 2], [2, 3], [3, 4]], 5],
  [[[0, 1], [0, 2], [0, 3], [0, 4]], 5],
  [[[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]], 7],
];
for (const p of cfg.presets) {
  const es = p.tokens.split(/[,;\s]+/).filter(Boolean).map(s => s.split("-").map(Number));
  let n = 0; for (const e of es) n = Math.max(n, e[0] + 1, e[1] + 1);
  cases.push([es, n]);
}
for (let i = 0; i < 220; i++) { const n = 2 + Math.floor(Math.random() * 11); cases.push([randTree(n), n]); }

const CORRECT = "two";
const per = {};
let bad = [], cbad = [], nary = null, ct = 0;
for (const [edges, n] of cases) {
  const want = bruteForce(n, edges).join(",");
  const str = toStr(edges);
  ct++;
  for (let vi = 0; vi < cfg.variants.length; vi++) {
    const id = cfg.variants[vi].id;
    per[id] = per[id] || { match: 0, total: 0 };
    let tr;
    try { tr = runTrace(cfg, str, vi); }
    catch (e) { bad.push([str, id, "threw " + e.message.slice(0, 40)]); continue; }
    per[id].total++;
    const got = (tr.result || []).join(",");
    if (got === want) per[id].match++;
    else if (id === CORRECT) bad.push([str, id, "want " + want, "got " + got]);

    // contract
    const li = tr.events.length - 1, fin = T.replayTo(tr, li);
    const calls = tr.events.filter(e => e.type === "CALL").length;
    const rets = tr.events.filter(e => e.type === "RETURN").length;
    if (calls !== rets) cbad.push([str, id, `CALL ${calls} != RETURN ${rets}`]);
    if (fin.stack.length) cbad.push([str, id, "stack not empty"]);
    if (!fin.done) cbad.push([str, id, "no DONE"]);
    const seen = {};
    for (const e of tr.events) if (e.type === "CALL") { if (seen[e.key]) cbad.push([str, id, "dup key " + e.key]); seen[e.key] = 1; }
    const o = { isFail: () => false, glyph: "▢", title: "f()" };
    for (let i = 0; i <= li; i++) {
      const st = T.replayTo(tr, i);
      try {
        cfg.narrate && cfg.narrate(st, o);
        cfg.stats && cfg.stats(st);
        cfg.verdict && cfg.verdict(st);
        for (const k of Object.keys(st.frames)) {
          const f = st.frames[k];
          cfg.expr && cfg.expr(f, st, o);
          if (cfg.checkText && f.check) cfg.checkText(f.check, st);
        }
      } catch (e) { cbad.push([str, id, `hook threw i=${i}: ${e.message.slice(0, 50)}`]); break; }
    }
    // the structure must actually be n-ary and cover every node
    if (id === CORRECT && !nary) {
      const root = T.assembleTree(null, fin.built[0]);
      const count = (function c(x) { return x ? 1 + (x.kids || []).reduce((a, k) => a + c(k), 0) : 0; })(root);
      if (!root || !root.kids) nary = "assembled root has no kids array";
      else if (count !== n) nary = `assembled ${count} nodes, expected ${n}`;
    }
  }
}
ok("matches brute force", per[CORRECT].match === per[CORRECT].total, `${per[CORRECT].match}/${per[CORRECT].total}`);
if (bad.length) console.log("        " + JSON.stringify(bad.slice(0, 3)));
for (const id in per) if (id !== CORRECT) {
  const p = per[id];
  ok(`variant "${id}" diverges`, p.match < p.total, `${p.total - p.match}/${p.total}`);
}
ok("trace contract", !cbad.length, cbad.length ? JSON.stringify(cbad.slice(0, 2)) : "CALL==RETURN, stack empty, unique keys, hooks never throw");
ok("structure is n-ary and complete", !nary, nary || "every node assembled, root carries kids");
console.log("\n" + (fails ? fails + " FAILURE(S)" : "ALL PASS"));
process.exit(fails ? 1 : 0);
