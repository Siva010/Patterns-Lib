# Patterns Lib — working notes

A static study site: DSA problems organised by **pattern and sub-variant**, not by
"top N problems". Every page is a self-contained essay; many carry an interactive
visualizer.

## Hard constraints

- **No build step. No ES modules. No network requests.** Pages must work from
  `file://`, which rules out `import`/`export` (CORS). Classic scripts only.
- **No colour literals** in `Visuals/tree-engine.css` or any new CSS. Use the
  house tokens. New colours are not introduced anywhere.
- **`data-pid` is the localStorage progress key.** Renumbering one silently
  destroys a reader's saved progress. The display `<span class="n">` numbers are
  cosmetic and may be renumbered — but they are coupled to `<a class="xref">`
  labels, so relabel those in the same pass.
- localStorage namespaces: `tpswbs.v1.*` (arrays/strings), `treepat.v1.*` (trees),
  `graphpat.v1.*` (graphs).

## The rule that matters most

**The essay survives.** These pages are study documents. Converting one to use
the lab engine is five mechanical edits — the CSS link, the JS script, replacing
only the old visualizer block, appending the adapter, and running
`dev/tools/add_roles.py`. Prose, headings, the TOC rail, the appbar, the theme
script, the complexity discussion, the failure-mode table and the reference
implementation are not touched, reworded, reordered or "improved".

## The lab engine

`Visuals/tree-engine.js` (one global, `TreeLab`) + `Visuals/tree-engine.css`.

Everything it renders is a **pure function of `trace.events[0..i]`**.
`TreeLab.replayTo(trace, i)` rebuilds the world from index 0 every call and holds
no mutable state. That is what makes step-back and the scrubber exactly correct.
**Do not add incremental state beside it** — any new capability must express
itself as events, so that structure at step *i* is derivable rather than
remembered.

`dev/docs/ADAPTER-GUIDE.md` is the adapter contract and the full
`TreeLab.mount(config)` API.

## Verification

See `dev/README.md`. Two independent halves:

```bash
node dev/verify/render_smoke.js 110 968 236   # does it actually draw
node dev/verify/verify_lab.js 104 110 222     # contract + replay purity
node dev/verify/v_bc.js                       # correctness vs oracles
```

**An oracle must not share a method with the code under test.** A second
implementation of the same recursion agrees with the first exactly where both are
wrong. Preferred oracles are brute force (968: all 2ⁿ camera placements; 951: all
2ᵏ flip combinations) or a structurally different formulation.

Only the intended-correct variant is oracle-checked. Every deliberately-wrong
variant is asserted to **diverge**, and by how much. A wrong variant that never
diverges is either not wrong or not reachable.

Generate test trees with `dev/verify/gen.js`. Hand-rolled random LeetCode arrays
produce values whose parent is null; the engine correctly rejects those, and you
will lose an hour blaming the engine.

## Current state

Study documents: **three bundles, complete.** Bundle 01 `three-patterns/`,
Bundle 02 `trees/`, Bundle 03 `graphs/` (31 sub-variants, 104 listed problems).

Tree Recursion: **29 of 29 — complete.**

Engine capabilities, in the order they were needed:
- **1.1.0** dual trees and node `refs` (100, 101, 951, 572)
- **1.2.0** `NODE` / `LINK` structure events — growth and mutation are one
  mechanism (105, 106, 226, 114, 297, 617)
- **1.3.0** general n-ary trees: a `LINK` with a NUMERIC side, `layoutNary`,
  and `noBaseTree` for a page whose input is not a tree at all (834)

**117 is deliberately excluded — it is 29 pages, not 30.** Its algorithm is a
`while` loop with a dummy head and tail that walks each level along the `next`
pointers it has already built. There is no recursion in it. This engine's whole
vocabulary — call stack, recursion tree, holes waiting on children — describes a
recursion, so mounting a loop on it would draw a call tree that does not exist.
Its existing visualizer suits it and stays. Do not "finish" 117 by forcing it.

Also outstanding:
- Binary Search: **13 of 15**. 719 and 528 still to write from scratch; 300 and
  981 are done. Then 15 anchors and the Pattern 5 catalog section.
- BST: 14 core problems, no coverage yet. `bst.html` already has the `a.viz` CSS.
- Graphs: no visualizers. `tree-engine.js` speaks call stacks and recursion
  trees; a graph lab needs grids, queues, DSU forests and heaps, which is a
  different engine, not an adapter. Do not force one onto the tree engine.

## Bundle 03 — Graphs

`graphs/` is **generated**, not hand-edited. `graphs/src/graphs.md` is the source
of truth; `dev/tools/build_graphs.py` renders it into the four pages.

```bash
python dev/tools/build_graphs.py            # dry run
python dev/tools/build_graphs.py --apply
```

**Edit the markdown and rebuild — never the HTML.** The generator adds structure
(ids, anchors, the rail, checkboxes, `§`/`#n` cross-links, badges) and no prose.
The page shell — stylesheet, appbar, search layer, behaviour script — is lifted
verbatim from `trees/bst.html` at build time, so a fix to the house chrome
propagates instead of forking. It refuses rather than guessing if the donor
loses a marker or a problem row will not parse.

Conventions the generator encodes:
- `data-pid` is the md's own problem number, `p1`–`p104`, and is stable as long
  as the numbering in the markdown is.
- `★⚠︎` rows are `data-marker="anti"` and carry both badges. Core counts are
  ★-only, matching how Bundles 01 and 02 already report on the library card.
- `↻` re-solve rows get **no** `data-pid` and no checkbox — they point at a
  problem listed elsewhere and must not be counted twice.
- `SLUG_FIX` overrides the LeetCode slug where the doc shortens a title
  (1489 says "MST", LeetCode says "Minimum Spanning Tree").

## Repository

- Remote: `https://github.com/Siva010/Patterns-Lib` (public), branch `main`.
- **Keep this repo out of Dropbox.** Dropbox wrote a "conflicted copy" of a
  remote-tracking ref into `.git/refs/`, which git read as corruption and which
  broke every fetch. The divergent commit it pointed at is preserved as the tag
  `dropbox-conflicted-2026-08-07`. `.gitignore` now excludes the pattern, but the
  real fix is not syncing `.git` at all.
- Cloudflare deploy config: `wrangler.jsonc`.
