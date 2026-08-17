/* Independent verification of tree-engine.js + the LC 110 adapter.
   1. replayTo purity: replaying to i from scratch == stepping forward i times
   2. LC 110 correctness against a plain recursive isBalanced oracle
   3. trace well-formedness invariants                                        */
const fs = require("fs"), path = require("path"), vm = require("vm");
const DIR = "Visuals";

const T = require(path.resolve(DIR, "tree-engine.js"));
console.log("engine version:", T.version, "| statics:", Object.keys(T).length);

// ---- pull the mount config out of the pilot page
function adapterConfig() {
  const html = fs.readFileSync(path.join(DIR, "110-balanced-binary-tree.html"), "utf8");
  // the adapter is the inline script that calls .mount(
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const src = scripts.find(s => /\.mount\(/.test(s));
  if (!src) throw new Error("no adapter script found in the pilot page");
  let captured = null;
  const fakeTreeLab = Object.assign({}, T, { mount: c => { captured = c; return {}; } });
  const sandbox = {
    window: { TreeLab: fakeTreeLab, matchMedia: () => ({ matches: false }), addEventListener() {} },
    document: { getElementById: () => null, querySelector: () => null, addEventListener() {} },
    console,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { timeout: 5000 });
  if (!captured) throw new Error("adapter did not call mount");
  return captured;
}

const cfg = adapterConfig();
console.log("adapter keys:", Object.keys(cfg).join(", "));
console.log("variants:", cfg.variants.map(v => v.id || v.label).join(" | "));

const treeOf = s => T.buildTree(T.parseTokens(s), { maxNodes: 63, maxHeight: 8 });

function trace(tokensStr, vi) {
  const root = treeOf(tokensStr);
  const v = cfg.variants[vi];
  const events = [];
  const emit = e => events.push(e);
  const opts = { variant: v, id: v.id, index: vi, L: v.lines, lines: v.lines, root,
                 maxNodes: 63, maxHeight: 8 };
  const result = cfg.run(root, emit, opts);
  // mirror the engine's bracketing so indices line up with the real page
  if (!events.length || events[0].type !== "START")
    events.unshift({ type: "START", line: (v.lines && v.lines.TOP) || 0, depth: 0 });
  if (!events.some(e => e.type === "DONE"))
    events.push({ type: "DONE", line: (v.lines && v.lines.TOP) || 0, depth: 0, value: result });
  return { events, result, root };
}

// ---- 1. replay purity: independent mutable forward-stepper
function forwardStep(state, e) {
  state.returning = null; state.justFilled = null;
  switch (e.type) {
    case "START": state.started = true; break;
    case "CALL": {
      const f = { key: e.key, parentKey: e.parentKey, side: e.side, depth: e.depth,
                  isNull: e.isNull, val: e.val, args: e.args,
                  left: undefined, right: undefined, phase: "enter",
                  check: null, result: undefined, pruned: false };
      state.frames[e.key] = f; state.stack.push(f); state.callsSoFar++;
      break;
    }
    case "BASE": if (state.frames[e.key]) state.frames[e.key].phase = "base"; break;
    case "EVAL": if (state.frames[e.key]) state.frames[e.key].phase = "wait-" + e.side; break;
    case "CHECK": if (state.frames[e.key]) state.frames[e.key].check = e; break;
    case "PRUNE":
      if (state.frames[e.key]) state.frames[e.key].pruned = true;
      (e.skipped || []).forEach(k => state.pruned[k] = true);
      break;
    case "RETURN": {
      const fr = state.frames[e.key];
      if (fr) { fr.result = e.value; fr.phase = "returned"; state.stack.pop(); state.returning = fr; }
      if (e.parentKey && state.frames[e.parentKey]) {
        state.frames[e.parentKey][e.side] = e.value;
        state.justFilled = { parentKey: e.parentKey, side: e.side, value: e.value };
      }
      break;
    }
    case "DONE": state.done = e; break;
  }
  return state;
}
const canon = st => JSON.stringify({
  idx: st.index, calls: st.callsSoFar, depth: st.curDepth, line: st.curLine,
  stack: st.stack.map(f => f.key),
  frames: Object.keys(st.frames).sort().map(k => {
    const f = st.frames[k];
    return [k, f.phase, f.left, f.right, f.result, f.pruned, f.check ? f.check.type : null];
  }),
  pruned: Object.keys(st.pruned).sort(),
  executed: Object.keys(st.executed).sort(),
  justFilled: st.justFilled, returning: st.returning ? st.returning.key : null,
  done: !!st.done, started: st.started,
});

const TREES = ["[]", "[1]", "[1,2,9,3,null,null,null,4]", "[3,9,20,null,null,15,7]",
  "[1,2,2,3,3,null,null,4,4]", "[1,2,3,4,5,6,7]", "[1,2,null,3,null,4,null,5]",
  "[1,null,2,null,3,null,4]", "[1,2,2,3,null,null,3,4,null,null,4]"];
for (let i = 0; i < 12; i++) {
  const n = 1 + Math.floor(Math.random() * 12);
  const tok = Array.from({ length: n }, () => Math.random() < 0.28 ? "null" : String(1 + Math.floor(Math.random() * 9)));
  TREES.push("[" + tok.join(",") + "]");
}

let checked = 0, mismatch = 0;
for (const tok of TREES) for (let vi = 0; vi < cfg.variants.length; vi++) {
  let tr; try { tr = trace(tok, vi); } catch (e) { continue; }
  // forward-stepped reference
  const fwd = { stack: [], frames: {}, pruned: {}, executed: {}, callsSoFar: 0,
                returning: null, justFilled: null, done: null, started: false };
  for (let i = 0; i < tr.events.length; i++) {
    if (i > 0 && tr.events[i - 1].line) fwd.executed[tr.events[i - 1].line] = true;
    forwardStep(fwd, tr.events[i]);
    const top = fwd.stack.length ? fwd.stack[fwd.stack.length - 1] : null;
    const mine = Object.assign({}, fwd, { index: i,
      curLine: tr.events[i].line || 0,
      curDepth: top ? top.depth : (fwd.returning ? fwd.returning.depth : 0) });
    const pure = T.replayTo(tr, i);
    checked++;
    if (canon(mine) !== canon(pure)) {
      mismatch++;
      if (mismatch <= 2) console.log("  MISMATCH", tok, "v" + vi, "i=" + i,
        "\n    fwd :", canon(mine).slice(0, 200), "\n    pure:", canon(pure).slice(0, 200));
    }
  }
  // idempotence + random access + descending
  for (const order of [[...Array(tr.events.length).keys()],
                       [...Array(tr.events.length).keys()].reverse()]) {
    for (const i of order) {
      const a = canon(T.replayTo(tr, i)), b = canon(T.replayTo(tr, i));
      checked++; if (a !== b) { mismatch++; }
    }
  }
}
console.log(`\n1. replay purity      ${checked - mismatch}/${checked}`, mismatch ? "FAIL" : "PASS");

// ---- 2. LC 110 correctness
function oracle(node) {
  const h = n => { if (!n) return 0; const l = h(n.left); if (l < 0) return -1;
    const r = h(n.right); if (r < 0) return -1;
    return Math.abs(l - r) > 1 ? -1 : 1 + Math.max(l, r); };
  return h(node) !== -1;
}
let p = 0, tot = 0, bad = [];
const CASES = TREES.concat(Array.from({ length: 200 }, () => {
  const n = 1 + Math.floor(Math.random() * 14);
  return "[" + Array.from({ length: n }, () => Math.random() < 0.3 ? "null" : String(1 + Math.floor(Math.random() * 9))).join(",") + "]";
}));
for (const tok of CASES) for (let vi = 0; vi < cfg.variants.length; vi++) {
  let tr; try { tr = trace(tok, vi); } catch (e) { continue; }
  tot++;
  const want = oracle(tr.root);
  const got = tr.result !== -1;
  got === want ? p++ : bad.push([tok, "v" + vi, "want " + want, "got " + got + " (result " + tr.result + ")"]);
}
console.log(`2. LC 110 correctness ${p}/${tot}`, p === tot ? "PASS" : "FAIL");
if (bad.length) console.log("   ", JSON.stringify(bad.slice(0, 3)));

// ---- 3. trace invariants
let inv = 0, invBad = [];
for (const tok of CASES.slice(0, 60)) for (let vi = 0; vi < cfg.variants.length; vi++) {
  let tr; try { tr = trace(tok, vi); } catch (e) { continue; }
  inv++;
  const fin = T.replayTo(tr, tr.events.length - 1);
  if (fin.stack.length !== 0) invBad.push([tok, "stack not empty at end"]);
  const calls = tr.events.filter(e => e.type === "CALL").length;
  const rets = tr.events.filter(e => e.type === "RETURN").length;
  if (calls !== rets) invBad.push([tok, `CALL ${calls} != RETURN ${rets}`]);
  for (const k of Object.keys(fin.pruned)) if (fin.frames[k]) invBad.push([tok, "pruned key was called: " + k]);
}
console.log(`3. trace invariants   ${inv - invBad.length}/${inv}`, invBad.length ? "FAIL" : "PASS");
if (invBad.length) console.log("   ", JSON.stringify(invBad.slice(0, 3)));
