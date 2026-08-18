/* Independent verification of the Binary Search visualizer pages.

   Each page's REAL buildFrames is extracted and replayed against an oracle
   written here by a DIFFERENT method than the code under test:

     300 - O(n^2) dynamic programming. A genuinely different algorithm, not a
           reimplementation of patience sorting.
     981 - a linear backward scan for the largest timestamp <= the query.

   Two things make extraction awkward, and both are handled rather than worked
   around, so that the real implementation is what gets tested:
     - these pages wire themselves to the DOM at load, so the stub must return
       element-like objects, not null
     - the script is an IIFE, so the function is not reachable by name until the
       wrapper is stripped

   usage: node dev/verify/v_bs.js                                            */
const fs = require("fs"), path = require("path"), vm = require("vm");
const DIR = "Visuals";

function fakeEl() {
  return new Proxy({}, {
    get(t, k) {
      if (k === "style" || k === "dataset") return {};
      if (k === "classList") return { add() {}, remove() {}, toggle() {}, contains: () => false };
      if (k === "children" || k === "childNodes") return [];
      if (k === "parentNode" || k === "firstChild" || k === "lastChild" || k === "nextSibling") return null;
      if (k === "length") return 0;
      if (k === Symbol.iterator) return [][Symbol.iterator].bind([]);
      if (k === Symbol.toPrimitive) return () => "";
      if (k in t) return t[k];
      if (["value", "textContent", "innerHTML", "innerText", "id", "className"].indexOf(k) >= 0) return "";
      return () => fakeEl();
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}

function extract(file, fnName) {
  const html = fs.readFileSync(path.join(DIR, file), "utf8");
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const src = scripts.find(s => s.indexOf("function " + fnName) >= 0);
  if (!src) throw new Error("no " + fnName + " in " + file);

  let body = src.trim();
  const m = body.match(/^\(\s*function\s*\w*\s*\([^)]*\)\s*\{/);
  if (m) {
    body = body.slice(m[0].length);
    const end = body.lastIndexOf("}");
    if (end >= 0) body = body.slice(0, end);
  }

  const sb = {
    console, Math, JSON, Array, Object, String, Number, Boolean, Set, Map, Date,
    isNaN, parseInt, parseFloat, Infinity, NaN,
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    requestAnimationFrame: () => 0, cancelAnimationFrame() {},
    window: { addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }) },
    document: {
      getElementById: () => fakeEl(), querySelector: () => fakeEl(),
      querySelectorAll: () => [], addEventListener() {}, createElement: () => fakeEl(),
      documentElement: fakeEl(), body: fakeEl(),
    },
    localStorage: { getItem: () => null, setItem() {} },
  };
  sb.globalThis = sb;
  vm.createContext(sb);
  vm.runInContext(body + "\n;globalThis.__fn = (typeof " + fnName + " === 'function') ? " + fnName + " : null;",
                  sb, { timeout: 8000 });
  if (!sb.__fn) throw new Error(fnName + " not reachable after unwrapping " + file);
  return sb.__fn;
}

let fails = 0;
const ok = (name, cond, detail) => {
  if (!cond) { fails++; console.log("   FAIL " + name + (detail ? " — " + detail : "")); }
  else console.log("   ok   " + name + (detail ? " — " + detail : ""));
};

function frameContract(F, label) {
  if (!Array.isArray(F) || !F.length) return label + ": frames not a non-empty array";
  const last = F[F.length - 1];
  if (!last.done) return label + ": final frame has no done:true";
  if (!("ans" in last)) return label + ": final frame has no ans";
  for (let i = 0; i < F.length; i++) {
    const f = F[i];
    if (!f || typeof f !== "object") return `${label}: frame ${i} is not an object`;
    for (const k of Object.keys(f)) {
      const v = f[k];
      if (v === undefined) return `${label}: frame ${i} field ${k} is undefined`;
      if (typeof v === "number" && !isFinite(v)) return `${label}: frame ${i} field ${k} is ${v}`;
    }
  }
  return null;
}

/* ------------------------------- LC 300 ------------------------------- */
function v300() {
  console.log("LC 300  longest increasing subsequence");
  let buildFrames;
  try { buildFrames = extract("300-longest-increasing-subsequence.html", "buildFrames"); }
  catch (e) { ok("extract buildFrames", false, e.message); return; }

  const dpLIS = a => {                       // ORACLE: O(n^2) DP
    if (!a.length) return 0;
    const d = a.map(() => 1);
    for (let i = 1; i < a.length; i++)
      for (let j = 0; j < i; j++) if (a[j] < a[i] && d[j] + 1 > d[i]) d[i] = d[j] + 1;
    return Math.max.apply(null, d);
  };
  const cases = [[], [1], [7, 7, 7, 7], [1, 2, 3, 4, 5], [5, 4, 3, 2, 1],
    [10, 9, 2, 5, 3, 7, 101, 18], [0, 1, 0, 3, 2, 3], [4, 10, 4, 3, 8, 9], [2, 2], [3, 1, 2]];
  for (let i = 0; i < 260; i++) {
    const n = Math.floor(Math.random() * 11);
    cases.push(Array.from({ length: n }, () => Math.floor(Math.random() * 12) - 3));
  }
  const isSub = (sub, arr) => { let j = 0; for (const x of arr) if (j < sub.length && sub[j] === x) j++; return j === sub.length; };
  let pass = 0, tot = 0, bad = [], cbad = null, notSub = null;
  for (const a of cases) {
    let F;
    try { F = buildFrames(a.slice()); }
    catch (e) { bad.push([JSON.stringify(a), "threw " + e.message.slice(0, 40)]); tot++; continue; }
    tot++;
    const want = dpLIS(a), got = F[F.length - 1].ans;
    if (got === want) pass++; else bad.push([JSON.stringify(a), "want " + want, "got " + got]);
    if (!cbad) cbad = frameContract(F, JSON.stringify(a));
    const t = F[F.length - 1].tails;
    if (!notSub && Array.isArray(t) && t.length > 1 && !isSub(t, a)) notSub = { input: a.slice(), tails: t.slice() };
  }
  ok("matches the O(n^2) DP oracle", pass === tot, `${pass}/${tot}`);
  if (bad.length) console.log("        " + JSON.stringify(bad.slice(0, 3)));
  ok("frame contract", !cbad, cbad || "flat, final frame carries ans + done:true, no undefined/Infinity");
  ok("tails is demonstrably NOT a subsequence", !!notSub,
     notSub ? `${JSON.stringify(notSub.input)} -> tails ${JSON.stringify(notSub.tails)}` : "no example found");
}

/* ------------------------------- LC 981 ------------------------------- */
function v981() {
  console.log("\nLC 981  time based key-value store");
  let buildFrames;
  try { buildFrames = extract("981-time-based-key-value-store.html", "buildFrames"); }
  catch (e) { ok("extract buildFrames", false, e.message); return; }

  const scan = (stamps, keys, vals, qKey, qTs) => {   // ORACLE: linear backward scan
    let best = "", bestT = -1;
    for (let i = 0; i < stamps.length; i++)
      if (keys[i] === qKey && stamps[i] <= qTs && stamps[i] > bestT) { bestT = stamps[i]; best = vals[i]; }
    return best;
  };
  const cases = [
    [[1], ["foo"], ["bar"], "foo", 1],
    [[1], ["foo"], ["bar"], "foo", 3],
    [[1], ["foo"], ["bar"], "foo", 0],
    [[1], ["foo"], ["bar"], "nope", 5],
    [[1, 4], ["foo", "foo"], ["bar", "bar2"], "foo", 4],
    [[1, 4], ["foo", "foo"], ["bar", "bar2"], "foo", 5],
  ];
  for (let i = 0; i < 260; i++) {
    const n = 1 + Math.floor(Math.random() * 7);
    const ks = ["a", "b", "c"];
    const stamps = [], keys = [], vals = [];
    let t = 0;
    for (let j = 0; j < n; j++) {
      t += 1 + Math.floor(Math.random() * 3);
      stamps.push(t); keys.push(ks[Math.floor(Math.random() * ks.length)]); vals.push("v" + j);
    }
    cases.push([stamps, keys, vals, ks[Math.floor(Math.random() * ks.length)], Math.floor(Math.random() * (t + 3))]);
  }
  let pass = 0, tot = 0, bad = [], cbad = null, empties = 0;
  for (const c of cases) {
    let F;
    try { F = buildFrames(c[0].slice(), c[1].slice(), c[2].slice(), c[3], c[4]); }
    catch (e) { bad.push([c[3] + "@" + c[4], "threw " + e.message.slice(0, 40)]); tot++; continue; }
    tot++;
    const want = scan(c[0], c[1], c[2], c[3], c[4]), got = F[F.length - 1].ans;
    if (want === "") empties++;
    if (got === want) pass++;
    else bad.push([JSON.stringify({ s: c[0], k: c[1], qk: c[3], qt: c[4] }), "want " + JSON.stringify(want), "got " + JSON.stringify(got)]);
    if (!cbad) cbad = frameContract(F, c[3] + "@" + c[4]);
  }
  ok("matches the linear backward-scan oracle", pass === tot, `${pass}/${tot}`);
  if (bad.length) console.log("        " + JSON.stringify(bad.slice(0, 3)));
  ok("frame contract", !cbad, cbad || "flat, final frame carries ans + done:true, no undefined/Infinity");
  ok("the empty-string case is exercised", empties > 10, empties + ' cases return ""');
}

v300();
v981();
console.log("\n" + (fails ? fails + " FAILURE(S)" : "ALL PASS"));
process.exit(fails ? 1 : 0);
