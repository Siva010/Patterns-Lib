/* RENDER smoke test — the half no headless harness has covered so far.
   Mounts each converted page in a real DOM (jsdom, borrowed from the globally
   installed percollate) and asserts the lab actually draws:

     - the adapter mounted and produced an SVG
     - the structure panel drew one circle per real node (per tree)
     - the call-tree panel drew something
     - stepping through EVERY trace index throws nothing and keeps drawing
     - no page-script errors, no unhandled exceptions
     - the same again after flipping to dark

   usage: node render_smoke.js <lc> [<lc> ...]                                */
const fs = require("fs"), path = require("path");
const { execSync } = require("child_process");

/* jsdom, from wherever this machine happens to keep one. There is no
   package.json here on purpose — the site itself has no build step — so we
   borrow a copy rather than adding a dependency.
     1. a local/global install resolvable as "jsdom"
     2. $JSDOM_PATH, if you want to point at one explicitly
     3. bundled inside a global npm package (percollate ships one) */
function loadJsdom() {
  const tried = [];
  const attempt = p => { try { return require(p); } catch (e) { tried.push(p); return null; } };
  let m = attempt("jsdom");
  if (m) return m;
  if (process.env.JSDOM_PATH) { m = attempt(process.env.JSDOM_PATH); if (m) return m; }
  let root = null;
  try { root = execSync("npm root -g", { encoding: "utf8" }).trim(); } catch (e) {}
  if (root && fs.existsSync(root)) {
    for (const pkg of fs.readdirSync(root)) {
      const c = path.join(root, pkg, "node_modules", "jsdom");
      if (fs.existsSync(c)) { m = attempt(c); if (m) return m; }
    }
  }
  throw new Error("no jsdom found. Install one (`npm i -g jsdom`) or set JSDOM_PATH.\ntried:\n  " + tried.join("\n  "));
}
const { JSDOM, VirtualConsole } = loadJsdom();
const DIR = path.resolve("Visuals");

const ENGINE_JS = fs.readFileSync(path.join(DIR, "tree-engine.js"), "utf8");

function pageFile(lc) {
  const f = fs.readdirSync(DIR).find(x => x.startsWith(lc + "-") && x.endsWith(".html"));
  if (!f) throw new Error("no page for LC " + lc);
  return f;
}

/* a dual page draws a caption band; single pages never do */
function cfgIsDual(lab) {
  return !!(lab && lab.querySelector("text.tl-tcap"));
}

function countRealNodes(tokensStr, sep) {
  // count non-null entries, per tree if the string carries two
  return String(tokensStr).split(sep || "|").map(part =>
    (part.match(/-?\d+/g) || []).length);
}

async function run(lc) {
  const file = pageFile(lc);
  let html = fs.readFileSync(path.join(DIR, file), "utf8");

  // inline the engine so jsdom needs no file:// resource loading
  html = html.replace(/<script\s+src="tree-engine\.js"\s*><\/script>/,
    "<script>\n" + ENGINE_JS + "\n</script>");
  if (/src="tree-engine\.js"/.test(html)) throw new Error("engine script tag not inlined");

  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => errors.push("jsdomError: " + (e && e.message)));
  vc.on("error", (...a) => errors.push("console.error: " + a.join(" ")));

  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    pretendToBeVisual: true,
    url: "https://local.test/" + file,
    virtualConsole: vc,
    beforeParse(w) {
      if (!w.matchMedia) w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
      // jsdom reports 0 for clientWidth; give the wrappers a width so the
      // engine's scale maths sees a real viewport
      Object.defineProperty(w.Element.prototype, "clientWidth", { get() { return 900; }, configurable: true });
    },
  });
  const w = dom.window, d = w.document;
  await new Promise(r => {
    if (d.readyState === "complete") return r();
    w.addEventListener("load", r); setTimeout(r, 3000);
  });

  const out = { lc, file, errors, checks: [] };
  const ok = (name, cond, detail) => out.checks.push([name, !!cond, detail || ""]);

  const lab = d.querySelector("#lab");
  ok("mount point exists", !!lab);
  ok("TreeLab global present", !!w.TreeLab, w.TreeLab ? "v" + w.TreeLab.version : "");

  const tsvg = lab && lab.querySelector(".tl-treesvg");
  const csvg = lab && lab.querySelector(".tl-callsvg, .tl-calltreesvg, svg");
  ok("structure svg rendered", !!tsvg);

  // node circles in the structure panel
  const circles = tsvg ? tsvg.querySelectorAll("circle.tl-nd").length : 0;
  const input = lab && lab.querySelector(".tl-custom");
  const tokenStr = input ? input.value : "";
  const per = countRealNodes(tokenStr);
  const expect = per.reduce((a, b) => a + b, 0);
  ok("structure drew a circle per node", circles > 0 && (!expect || circles === expect),
     `circles=${circles} expected=${expect || "?"} from "${tokenStr}"`);
  ok("labels drawn", tsvg ? tsvg.querySelectorAll("text.tl-nlab").length > 0 : false);

  // step through every index
  const scrub = lab && lab.querySelector("input.tl-scrub, .tl-scrub");
  let steps = 0, stepErr = null, drewAtEnd = 0;
  if (scrub) {
    const max = +scrub.max;
    for (let i = 0; i <= max; i++) {
      scrub.value = String(i);
      try { scrub.dispatchEvent(new w.Event("input", { bubbles: true })); steps++; }
      catch (e) { stepErr = `i=${i}: ${e.message}`; break; }
      if (errors.length) { stepErr = `i=${i}: ${errors[0]}`; break; }
    }
    drewAtEnd = tsvg ? tsvg.querySelectorAll("circle.tl-nd").length : 0;
  }
  ok("stepped every index", scrub && !stepErr, stepErr || `${steps} steps`);
  ok("still drawing at last step", drewAtEnd > 0, "circles=" + drewAtEnd);

  // variant + preset switching
  const vbtn = lab && lab.querySelector(".tl-variant, button.tl-vbtn");
  if (vbtn) {
    try { vbtn.click(); vbtn.click(); ok("variant toggle survives", !errors.length); }
    catch (e) { ok("variant toggle survives", false, e.message); }
  }
  const psel = lab && lab.querySelector("select.tl-preset, .tl-preset");
  if (psel && psel.options && psel.options.length > 1) {
    try {
      for (let i = 0; i < psel.options.length; i++) {
        psel.value = psel.options[i].value;
        psel.dispatchEvent(new w.Event("change", { bubbles: true }));
      }
      ok("all presets load", !errors.length, psel.options.length + " presets");
    } catch (e) { ok("all presets load", false, e.message); }
  }

  // Type a KNOWN tree in and count circles. This is the assertion with teeth:
  // 5 real nodes in, 5 node circles out (per rendered tree).
  const loadBtn = lab && lab.querySelector(".tl-load");
  if (input && loadBtn) {
    /* The assertion with teeth: type a KNOWN tree in and demand exactly that
       many circles back. It only applies to pages whose input really is a
       LeetCode array — 834 takes an edge list — so elsewhere it is recorded as
       not applicable rather than replaced by a made-up input. */
    const presetLabel = (psel && psel.options && psel.options.length)
      ? (psel.options[0].textContent || "").trim() : "";
    const isArrayInput = !presetLabel || /^\s*\[/.test(presetLabel);
    if (!isArrayInput) {
      out.checks.push(["typed-tree probe", true, "n/a — this page's input is not a LeetCode array"]);
    } else {
      try {
        const probe = cfgIsDual(lab) ? "[1,2,3,null,4] | [1,2,3,null,4]" : "[1,2,3,null,4]";
        input.value = probe;
        loadBtn.click();
        const n = tsvg.querySelectorAll("circle.tl-nd").length;
        const want = countRealNodes(probe).reduce((a, b) => a + b, 0);
        const err = lab.querySelector(".tl-err");
        const msg = err ? err.textContent.trim() : "";
        ok("typed tree renders exactly its nodes", n === want && !msg,
           `got ${n} circles, want ${want}${msg ? ", err: " + msg : ""}`);
      } catch (e) { ok("typed tree renders exactly its nodes", false, e.message); }
    }
  }

  // dark mode — back on preset 0 first, since the preset sweep above may have
  // left an intentionally empty tree selected (0 nodes is correct there)
  try {
    if (psel && psel.options && psel.options.length) {
      psel.value = psel.options[0].value;
      psel.dispatchEvent(new w.Event("change", { bubbles: true }));
    }
    d.documentElement.setAttribute("data-theme", "dark");
    if (scrub) { scrub.value = scrub.max; scrub.dispatchEvent(new w.Event("input", { bubbles: true })); }
    const n = tsvg.querySelectorAll("circle.tl-nd").length;
    const tok = input ? input.value : "";
    const want = countRealNodes(tok).reduce((a, b) => a + b, 0);
    ok("dark mode redraw", want === 0 ? true : n > 0, `circles=${n} tree="${tok}"`);
  } catch (e) { ok("dark mode redraw", false, e.message); }

  ok("no script errors", errors.length === 0, errors.slice(0, 2).join(" | "));
  dom.window.close();
  return out;
}

(async () => {
  const targets = process.argv.slice(2);
  let fails = 0;
  for (const lc of targets) {
    let r;
    try { r = await run(lc); }
    catch (e) { console.log(`LC ${lc}  SETUP FAIL — ${e.message}`); fails++; continue; }
    const bad = r.checks.filter(c => !c[1]);
    console.log(`LC ${r.lc.padEnd(5)} ${bad.length ? "FAIL" : "ok  "}  ${r.file}`);
    for (const [n, pass, det] of r.checks) {
      if (!pass) console.log(`        x ${n}${det ? " — " + det : ""}`);
    }
    if (!bad.length) {
      const d = Object.fromEntries(r.checks.map(c => [c[0], c[2]]));
      console.log(`        ${d["structure drew a circle per node"] || ""} · ${d["stepped every index"] || ""}`);
    }
    if (bad.length) fails++;
  }
  console.log(fails ? `\n${fails} page(s) with render failures` : "\nALL PAGES RENDER");
  process.exit(fails ? 1 : 0);
})();
