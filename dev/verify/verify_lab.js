/* Generic verifier for a converted tree-lab essay page.
   For each page: extract its real mount config, run its real `run` against an
   independent oracle, assert the trace contract, assert replay purity, and
   assert the essay survived.

   usage: node verify_lab.js <lcNumber> [...]                                  */
const fs = require("fs"), path = require("path"), vm = require("vm");
const DIR = "Visuals";
const T = require(path.resolve(DIR, "tree-engine.js"));

// ---------- page → mount config ----------
function pageFile(lc) {
  const f = fs.readdirSync(DIR).find(x => x.startsWith(lc + "-") && x.endsWith(".html"));
  if (!f) throw new Error("no page for LC " + lc);
  return f;
}
function configOf(file) {
  const html = fs.readFileSync(path.join(DIR, file), "utf8");
  const src = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1])
                .find(s => /\.mount\(/.test(s));
  if (!src) throw new Error("no adapter script in " + file);
  let cap = null;
  const fake = Object.assign({}, T, { mount: c => (cap = c, {}) });
  const sb = {
    window: { TreeLab: fake, matchMedia: () => ({ matches: false }), addEventListener() {} },
    document: { getElementById: () => null, querySelector: () => null, addEventListener() {} },
    console,
  };
  sb.globalThis = sb; vm.createContext(sb);
  vm.runInContext(src, sb, { timeout: 5000 });
  if (!cap) throw new Error("adapter never called mount in " + file);
  return { cfg: cap, html };
}

// ---------- trees ----------
const treeOf = s => T.buildTree(T.parseTokens(s), { maxNodes: 63, maxHeight: 8 });
const DEGEN = ["[]", "[1]", "[1,2,null,3,null,4]", "[1,null,2,null,3,null,4]",
  "[1,2,3,4,5,6,7]", "[5,5,5,5,5,5,5]", "[3,9,20,null,null,15,7]", "[1,2,2,3,3,3,3]"];
function randTree() {
  const n = 1 + Math.floor(Math.random() * 14);
  return "[" + Array.from({ length: n }, () =>
    Math.random() < 0.28 ? "null" : String(Math.floor(Math.random() * 19) - 9)).join(",") + "]";
}

function runTrace(cfg, tokensStr, vi) {
  const root = treeOf(tokensStr), v = cfg.variants[vi], events = [];
  const opts = { variant: v, id: v.id, index: vi, L: v.lines, lines: v.lines, root,
                 maxNodes: 63, maxHeight: 8 };
  const result = cfg.run(root, e => events.push(e), opts);
  if (!events.length || events[0].type !== "START")
    events.unshift({ type: "START", line: (v.lines && v.lines.TOP) || 0, depth: 0 });
  if (!events.some(e => e.type === "DONE"))
    events.push({ type: "DONE", line: (v.lines && v.lines.TOP) || 0, depth: 0, value: result });
  return { events, result, root };
}

// ---------- oracles ----------
const H = n => n ? 1 + Math.max(H(n.left), H(n.right)) : 0;
const ORACLES = {
  104: r => H(r),
  404: r => { const w = (n, isL) => !n ? 0
        : (!n.left && !n.right) ? (isL ? n.val : 0) : w(n.left, true) + w(n.right, false);
      return w(r, false); },
  222: r => { const c = n => n ? 1 + c(n.left) + c(n.right) : 0; return c(r); },
  543: r => { let best = 0; const h = n => { if (!n) return 0;
        const l = h(n.left), rr = h(n.right); best = Math.max(best, l + rr); return 1 + Math.max(l, rr); };
      h(r); return best; },
  124: r => { let best = -Infinity; const g = n => { if (!n) return 0;
        const l = Math.max(0, g(n.left)), rr = Math.max(0, g(n.right));
        best = Math.max(best, n.val + l + rr); return n.val + Math.max(l, rr); };
      if (!r) return 0; g(r); return best; },
  687: r => { let best = 0; const a = n => { if (!n) return 0;
        const l = a(n.left), rr = a(n.right);
        const ll = (n.left && n.left.val === n.val) ? l + 1 : 0;
        const rrr = (n.right && n.right.val === n.val) ? rr + 1 : 0;
        best = Math.max(best, ll + rrr); return Math.max(ll, rrr); };
      a(r); return best; },
};

// ---------- essay checks ----------
function essayOk(html) {
  const need = ['id="s1"', 'class="rail"', 'class="appbar"', 'tree-engine.css',
                'tree-engine.js', 'id="lab"', '--r-anchor'];
  const miss = need.filter(s => !html.includes(s));
  const structural = [];
  if ((html.match(/<style>/g) || []).length !== 1) structural.push("style blocks");
  if ((html.match(/<\/html>/g) || []).length !== 1) structural.push("html close");
  if (html.includes('keyboard: "document"') || html.includes("keyboard:'document'"))
    structural.push('keyboard:"document" (hijacks the page)');
  const secs = (html.match(/id="s\d(?:-\d)?"/g) || []).length;
  return { miss, structural, sections: secs };
}

// ---------- run ----------
const targets = process.argv.slice(2);
let anyFail = false;
for (const lc of targets) {
  let file, cfg, html;
  try { file = pageFile(lc); ({ cfg, html } = configOf(file)); }
  catch (e) { console.log(`LC ${lc}: SETUP FAIL — ${e.message}`); anyFail = true; continue; }

  const e0 = essayOk(html);
  const cases = DEGEN.concat(Array.from({ length: 160 }, randTree));
  const oracle = ORACLES[lc];

  let cp = 0, ct = 0, cbad = [];
  let contract = 0, cviol = [];
  let pure = 0, pviol = 0;

  for (const tok of cases) for (let vi = 0; vi < cfg.variants.length; vi++) {
    let tr; try { tr = runTrace(cfg, tok, vi); } catch (err) {
      cbad.push([tok, "v" + vi, "run threw: " + err.message.slice(0, 40)]); ct++; continue; }
    ct++;
    if (oracle) { const want = oracle(tr.root);
      tr.result === want ? cp++ : cbad.push([tok, "v" + vi, "want " + want, "got " + tr.result]);
    } else cp++;

    // contract
    contract++;
    const li = tr.events.length - 1, fin = T.replayTo(tr, li);
    const calls = tr.events.filter(x => x.type === "CALL").length;
    const rets = tr.events.filter(x => x.type === "RETURN").length;
    if (!fin.done) cviol.push([tok, "no DONE at last index"]);
    if (calls !== rets) cviol.push([tok, `CALL ${calls} != RETURN ${rets}`]);
    if (fin.stack.length) cviol.push([tok, "stack not empty"]);
    for (const k of Object.keys(fin.pruned)) if (fin.frames[k]) cviol.push([tok, "pruned key entered: " + k]);
    // hooks must never throw at any index
    const o = { isFail: cfg.isFail || (v => v === -1), glyph: cfg.holeGlyph || "▢", title: cfg.title || "f()" };
    for (let i = 0; i <= li; i++) {
      const st = T.replayTo(tr, i);
      try {
        if (cfg.narrate) cfg.narrate(st, o);
        if (cfg.stats) cfg.stats(st);
        if (cfg.verdict) cfg.verdict(st);
        for (const k of Object.keys(st.frames)) {
          if (cfg.expr) cfg.expr(st.frames[k], st, o);
          if (cfg.nodeResult) cfg.nodeResult(st.frames[k], st);
          if (cfg.nodeState) cfg.nodeState(k, st);
          if (cfg.checkText && st.frames[k].check) cfg.checkText(st.frames[k].check, st);
        }
      } catch (err) { cviol.push([tok, `hook threw at i=${i}: ${err.message.slice(0, 40)}`]); break; }
    }
    // purity spot-check
    for (const i of [0, li >> 1, li]) {
      pure++;
      if (JSON.stringify(T.replayTo(tr, i).stack.map(f => f.key)) !==
          JSON.stringify(T.replayTo(tr, i).stack.map(f => f.key))) pviol++;
    }
  }

  const ok = !e0.miss.length && !e0.structural.length && cp === ct && !cviol.length && !pviol;
  if (!ok) anyFail = true;
  console.log(`LC ${lc}  ${file}`);
  console.log(`   essay      ${e0.miss.length || e0.structural.length ? "FAIL " + JSON.stringify([...e0.miss, ...e0.structural]) : "ok (" + e0.sections + " section ids)"}`);
  console.log(`   variants   ${cfg.variants.map(v => v.id || v.label).join(" | ")}`);
  console.log(`   correct    ${cp}/${ct}${oracle ? "" : "  (no oracle — result unchecked)"}`);
  if (cbad.length) console.log(`      ${JSON.stringify(cbad.slice(0, 2))}`);
  console.log(`   contract   ${contract - cviol.length}/${contract}`);
  if (cviol.length) console.log(`      ${JSON.stringify(cviol.slice(0, 3))}`);
  console.log(`   purity     ${pure - pviol}/${pure}\n`);
}
process.exit(anyFail ? 1 : 0);
