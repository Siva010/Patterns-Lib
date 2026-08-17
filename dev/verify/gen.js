/* Well-formed LeetCode level-order arrays, bounded in both size and DEPTH.
   Two earlier mistakes this fixes:
     - values whose parent is null (malformed; engine correctly rejects)
     - chains deeper than the engine's level cap                          */
function randTokens(maxNodes, maxDepth){
  maxNodes = maxNodes || 15; maxDepth = maxDepth || 6;
  const n = 1 + Math.floor(Math.random() * (maxNodes - 1));
  const val = () => String(Math.floor(Math.random() * 19) - 9);
  const out = [val()];
  const q = [{ i: 0, d: 1 }];          // real nodes awaiting expansion, with depth
  let made = 1;
  while (q.length && made < n) {
    const cur = q.shift();
    if (cur.d >= maxDepth) continue;   // do not emit children past the cap
    for (const _ of [0, 1]) {
      if (made < n && Math.random() > 0.32) {
        out.push(val()); q.push({ i: out.length - 1, d: cur.d + 1 }); made++;
      } else out.push("null");
    }
  }
  while (out.length && out[out.length - 1] === "null") out.pop();
  return "[" + out.join(",") + "]";
}
const sameValTokens = (n, d) => randTokens(n, d).replace(/-?\d+/g, "5");
const DEGEN = ["[1]", "[1,2]", "[1,null,2]", "[1,2,3]", "[1,2,null,3]", "[1,null,2,null,3]",
  "[1,2,3,4,5,6,7]", "[5,5,5,5,5,5,5]", "[3,9,20,null,null,15,7]",
  "[1,2,2,3,3,null,null,4,4]", "[-3,-2,-1]", "[0,0,0]",
  "[1,2,null,3,null,4,null,5]", "[1,null,2,null,3,null,4]"];
module.exports = { randTokens, sameValTokens, DEGEN };
