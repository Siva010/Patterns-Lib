/* Engine-level test of the NODE / LINK structure events (engine 1.2.0).

   These have no adapter yet, so this drives replayTo and assembleTree with
   synthetic traces. Three things must hold:

     1. GROWTH   — a tree built by NODE/LINK events is correct at every index,
                   and the structure at index i is a pure function of i.
     2. MUTATION — LINK events rewired on top of an input tree produce the
                   rewired tree, with the untouched parts showing through.
     3. CYCLES   — an edge write that creates a cycle truncates the drawing
                   instead of hanging (114 flatten, 117 next pointers).

   usage: node dev/verify/v_grow.js                                          */
const path = require("path");
const T = require(path.resolve("Visuals", "tree-engine.js"));

let fails = 0;
function check(name, cond, detail) {
  if (!cond) { fails++; console.log("  FAIL " + name + (detail ? " — " + detail : "")); }
  else console.log("  ok   " + name + (detail ? " — " + detail : ""));
}
const shape = n => !n ? "." : "(" + n.val + " " + shape(n.left) + " " + shape(n.right) + ")";
const trace = events => ({ events });

/* ---------------- 1. growth ---------------- */
console.log("1. growth — build [1,[2],[3]] into panel 2 one event at a time");
{
  const evs = [
    { type: "START" },
    { type: "NODE", t: 2, key: "R", val: 1 },
    { type: "NODE", t: 2, key: "RL", val: 2 },
    { type: "LINK", t: 2, parent: "R", side: "left", child: "RL" },
    { type: "NODE", t: 2, key: "RR", val: 3 },
    { type: "LINK", t: 2, parent: "R", side: "right", child: "RR" },
    { type: "DONE" },
  ];
  const tr = trace(evs);
  const want = [".", "(1 . .)", "(1 . .)", "(1 (2 . .) .)", "(1 (2 . .) .)", "(1 (2 . .) (3 . .))", "(1 (2 . .) (3 . .))"];
  let allOk = true, saw = [];
  for (let i = 0; i < evs.length; i++) {
    const st = T.replayTo(tr, i);
    const root = T.assembleTree(null, st.built[2]);
    const got = shape(root);
    saw.push(got);
    if (got !== want[i]) allOk = false;
  }
  check("structure grows exactly as the events say", allOk, allOk ? "final " + saw[saw.length - 1] : "got " + JSON.stringify(saw));

  // purity: same index twice, and descending order
  let pure = true;
  for (let i = 0; i < evs.length; i++) {
    const a = shape(T.assembleTree(null, T.replayTo(tr, i).built[2]));
    const b = shape(T.assembleTree(null, T.replayTo(tr, i).built[2]));
    if (a !== b) pure = false;
  }
  for (let i = evs.length - 1; i >= 0; i--) {
    const d = shape(T.assembleTree(null, T.replayTo(tr, i).built[2]));
    if (d !== want[i]) pure = false;
  }
  check("replay stays pure ascending and descending", pure);

  // a node with no LINK to it must not appear under the root
  const orphan = trace([{ type: "START" },
    { type: "NODE", t: 2, key: "R", val: 1 },
    { type: "NODE", t: 2, key: "RL", val: 9 },   // created, never linked
    { type: "DONE" }]);
  const os = shape(T.assembleTree(null, T.replayTo(orphan, 3).built[2]));
  check("an unlinked node is not drawn as a child", os === "(1 . .)", "got " + os);
}

/* ---------------- 2. mutation ---------------- */
console.log("\n2. mutation — invert [1,2,3] by rewiring, base tree showing through");
{
  const base = T.buildTree(T.parseTokens("[1,2,3,4,5]"), { maxNodes: 31, maxHeight: 6 });
  check("base tree parsed", shape(base) === "(1 (2 (4 . .) (5 . .)) (3 . .))", shape(base));

  // swap the root's children only; the grandchildren must follow their parents
  const evs = [{ type: "START" },
    { type: "LINK", t: 0, parent: "R", side: "left", child: "RR" },
    { type: "LINK", t: 0, parent: "R", side: "right", child: "RL" },
    { type: "DONE" }];
  const tr = trace(evs);
  const at1 = shape(T.assembleTree(base, T.replayTo(tr, 1).built[0]));
  const at2 = shape(T.assembleTree(base, T.replayTo(tr, 2).built[0]));
  /* After the first write alone, BOTH of the root's pointers name RR — the
     half-done swap has aliased them. assembleTree draws each node once (the
     seen-guard that makes cycles safe), so RR appears on the branch reached
     first and the other side reads empty. That is the honest rendering: a tree
     layout cannot place one node in two places, and drawing it twice would
     claim there are two distinct 3s. An adapter that wants the intermediate
     aliased state to look deliberate should say so in its narration. */
  check("a half-done swap aliases, and the aliased node is drawn once",
        at1 === "(1 (3 . .) .)", at1);
  check("both edges written gives the swap, subtrees intact",
        at2 === "(1 (3 . .) (2 (4 . .) (5 . .)))", at2);

  // an untouched tree with an empty overlay is the base tree unchanged
  const none = T.assembleTree(base, T.replayTo(trace([{ type: "START" }, { type: "DONE" }]), 1).built[0]);
  check("no structure events leaves the base tree alone", shape(none) === shape(base));

  // detaching with child:null
  const det = trace([{ type: "START" }, { type: "LINK", t: 0, parent: "R", side: "left", child: null }, { type: "DONE" }]);
  const ds = shape(T.assembleTree(base, T.replayTo(det, 1).built[0]));
  check("child:null detaches a subtree", ds === "(1 . (3 . .))", ds);
}

/* ---------------- 3. cycles ---------------- */
console.log("\n3. cycle safety — a rewire that points a node at its own ancestor");
{
  const base = T.buildTree(T.parseTokens("[1,2,3]"), { maxNodes: 31, maxHeight: 6 });
  const evs = [{ type: "START" },
    { type: "LINK", t: 0, parent: "RL", side: "left", child: "R" },  // child -> root
    { type: "DONE" }];
  let ok = true, out = "", threw = null;
  const t0 = Date.now();
  try { out = shape(T.assembleTree(base, T.replayTo(trace(evs), 1).built[0])); }
  catch (e) { threw = e.message; ok = false; }
  const ms = Date.now() - t0;
  check("a cycle terminates instead of hanging", ok && ms < 2000, threw ? "threw " + threw : ms + "ms");
  check("the cycle is truncated, root drawn once", ok && (out.match(/\(1 /g) || []).length === 1, out);

  // 114-style flatten: everything onto the right spine
  const b2 = T.buildTree(T.parseTokens("[1,2,5,3,4,null,6]"), { maxNodes: 31, maxHeight: 6 });
  const flat = [{ type: "START" },
    { type: "LINK", t: 0, parent: "R", side: "left", child: null },
    { type: "LINK", t: 0, parent: "R", side: "right", child: "RL" },
    { type: "LINK", t: 0, parent: "RL", side: "left", child: null },
    { type: "LINK", t: 0, parent: "RL", side: "right", child: "RLL" },
    { type: "DONE" }];
  const fs = shape(T.assembleTree(b2, T.replayTo(trace(flat), 4).built[0]));
  check("a right-spine flatten renders", fs === "(1 . (2 . (3 . .)))", fs);
}

console.log("\n" + (fails ? fails + " FAILURE(S)" : "ALL PASS"));
process.exit(fails ? 1 : 0);
