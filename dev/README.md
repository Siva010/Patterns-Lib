# dev — the verification toolkit

Nothing here ships to the reader. The site itself is static HTML with no build
step; this directory is how the pages get checked.

**Run everything from the repository root**, not from inside `dev/`. The scripts
resolve `Visuals/` relative to the working directory.

## The two kinds of check

A converted page has two halves that can fail independently, so there are two
kinds of harness.

**DOM-free** — extracts a page's real `mount` config, runs its real `run`
function, and compares the answer against an oracle. Catches wrong answers,
broken trace contracts, impure replay, hooks that throw.

**Render** — mounts the page in an actual DOM and asserts it draws. Catches a
lab that lays out wrong, renders nothing, or throws only when a renderer runs.
No amount of DOM-free testing substitutes for this; it was added late, and
until it existed the render path was entirely unverified.

## Render smoke test

```bash
node dev/verify/render_smoke.js 110 968 236
```

Needs a `jsdom` it can find — a local or global install, `$JSDOM_PATH`, or one
bundled inside any global npm package. Per page it asserts: the adapter
mounted; the structure panel drew one node circle per real node; typing a known
tree in yields exactly that many circles; every trace index steps without
throwing; every preset loads; the variant toggle survives; dark mode redraws;
no script errors.

## Correctness harnesses

```bash
node dev/verify/verify_engine.js              # engine: replay purity, invariants
node dev/verify/verify_lab.js 104 110 222     # contract + purity, any page
node dev/verify/v_bc.js                       # LC 100, 101
node dev/verify/v_fs.js                       # LC 951, 572
node dev/verify/v_g.js                        # LC 236, 1123
node dev/verify/v_k.js                        # LC 337, 979, 968
```

### The rule these follow

**An oracle must not share a method with the code under test.** A second
implementation of the same recursion agrees with the first including where both
are wrong. So:

| page | oracle method |
|---|---|
| 968 cameras | exhaustive brute force over all 2ⁿ camera placements |
| 951 flip equivalent | brute force over all 2ᵏ flip combinations |
| 100 same tree | level-order lockstep with null placeholders |
| 101 symmetric | every BFS level equals its own reverse |
| 236 LCA | deepest node whose subtree contains both targets |
| 1123 | deepest node containing every deepest leaf |
| 572 subtree | full structural equality at every candidate node |
| 337 house robber | two-component DP |
| 222 count nodes | plain recursive count (the page uses the spine trick) |

Only the intended-correct variant is oracle-checked. Each deliberately-wrong
variant is asserted to **diverge**, and by how much — a wrong variant that
never diverges is either not wrong or not reachable.

`gen.js` generates well-formed LeetCode arrays: BFS, only non-null nodes get
children, depth-bounded, trailing nulls trimmed. Hand-rolled random arrays
produce values whose parent is null, which the engine correctly rejects — and
then you spend an hour chasing a bug that is in your generator.

## Page tools

```bash
python dev/tools/add_roles.py Visuals/<page>.html    # the 6 semantic role tokens
python dev/tools/splice.py <page>.html <adapter>.html  # attach an adapter, idempotent
python dev/tools/essay_check.py Visuals/<page>.html   # prose survived the edit
python dev/tools/build_graphs.py --apply             # render Bundle 03 from its markdown
python dev/tools/add_toolbar.py --apply <page.html>  # restore the filter toolbar
```

`add_toolbar.py` lifts the toolbar block verbatim from `three-patterns/two-pointers.html`
and inserts it at the top of the content column. Bundles 02 and 03 carried all of
its CSS and the behaviour script that drives it but never had the markup, so the
filters were unreachable — and `--toolbar-h` kept its 46px placeholder, which
stranded every sticky table header 46px below the appbar. Idempotent; refuses on
a page that already has one or is missing the CSS it depends on.

`build_graphs.py` is the only page generator here. `graphs/src/graphs.md` is the
source of truth for Bundle 03 and the four `graphs/*.html` pages are its output —
edit the markdown and rebuild, never the HTML. It borrows the page shell from
`trees/bst.html` at build time and refuses rather than guessing if the donor has
lost a marker.

`add_roles.py` and `splice.py` are both idempotent and refuse rather than
duplicate.

## Writing a new adapter

`docs/ADAPTER-GUIDE.md` is the contract: the full `TreeLab.mount(config)` API,
the event vocabulary, the dual-tree/refs mechanism, and the rule that matters
most — **the essay survives**. These pages are study documents; a conversion
adds a lab and changes nothing else.
