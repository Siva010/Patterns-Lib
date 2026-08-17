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
- localStorage namespaces: `tpswbs.v1.*` (arrays/strings), `treepat.v1.*` (trees).

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

Tree Recursion: **22 of 30** pages converted to the lab engine.
Done: 104 110 112 113 124 129 222 236 257 337 404 437 543 572 687 951 968 979
1123 1448 100 101.

Remaining 8, each blocked on an engine capability rather than on authoring:

| capability | pages | note |
|---|---|---|
| growing tree | 105, 106, 297, 617 | the recursion *builds* the tree; structure must come from the event log |
| mutating edges | 226, 114, 117 | edges rewired mid-trace, replay-safe |
| general graph | 834 | non-binary adjacency, two rooted passes |

Growth and mutation should share one mechanism: `NODE` / `LINK` events
accumulated during replay and overlaid on the static layout. A partial start on
this was reverted; nothing is half-built.

Also outstanding:
- Binary Search: 4 pages to **write from scratch** (981, 719, 300, 528), plus
  wiring 15 anchors and the Pattern 5 catalog section.
- BST: 14 core problems, no coverage yet. `bst.html` already has the `a.viz` CSS.

## Repository

- Remote: `https://github.com/Siva010/Patterns-Lib` (public), branch `main`.
- **Keep this repo out of Dropbox.** Dropbox wrote a "conflicted copy" of a
  remote-tracking ref into `.git/refs/`, which git read as corruption and which
  broke every fetch. The divergent commit it pointed at is preserved as the tag
  `dropbox-conflicted-2026-08-07`. `.gitignore` now excludes the pattern, but the
  real fix is not syncing `.git` at all.
- Cloudflare deploy config: `wrangler.jsonc`.
