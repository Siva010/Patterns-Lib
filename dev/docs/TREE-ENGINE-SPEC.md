# Tree-recursion lab engine — build contract

Project root: `C:\Users\Siva\Dropbox\MSivaFiles\1- [ DSA ] Prep\Patterns Variations Study`

## Goal

`Visuals/balanced-binary-tree-visualizer.html` is a standalone, richly-featured tree-recursion
lab. Its engine is ~90% generic. Extract that engine into two shared files, restyled onto the
project's house design system, so all 30 Tree Recursion pages can mount it.

**Read `Visuals/balanced-binary-tree-visualizer.html` end to end first.** It is the reference
implementation and the source of truth for behaviour. Preserve its behaviour exactly; change only
the styling and the module boundary.

## Deliverables

1. `Visuals/tree-engine.css` — all lab CSS, built **only** from house tokens (see below)
2. `Visuals/tree-engine.js` — the generic engine, exposing one global `TreeLab`
3. `Visuals/110-balanced-binary-tree.html` — converted as the pilot (see "Pilot" below)

No build step. Classic `<script src>` and `<link rel=stylesheet>`, both must work from `file://`.
Do **not** use ES modules (`type="module"` breaks under `file://` CORS).

## House design tokens — the only colours you may use

The consuming pages already define these in their own inline `:root` and dark block. Your CSS must
consume them and define **nothing new**:

```
--bg --bg-sunk --bg-code --fg --fg-mid --fg-dim --rule --rule-hard
--accent --accent-fg --accent-wash --accent-line
--serif --sans --mono
--t-key --t-typ --t-str --t-num --t-com --t-ann
--r-anchor --r-anchor2 --r-left --r-right --r-window --r-hit   (+ each -wash and -line)
```

Map the reference's ad-hoc palette onto the semantic roles:

| reference | house role | means |
|---|---|---|
| `--active` (amber) | `--r-anchor` | the active frame / current node |
| `--path` (blue) | `--r-left` | on the current call path |
| `--height` (mint) | `--r-hit` | a returned value / success |
| `--sentinel` (red) | `--r-anchor2` | the sentinel / failure value |
| `--prune` (violet) | `--r-right` | skipped by short-circuit |
| `--dim` / `--muted` | `--fg-dim` / `--fg-mid` | returned, inactive |

A node that was never called must be hue-less: `--rule` border, dim, dashed.

## Trace format — do not change it

A trace is `{ events: [ ... ] }`. Event types and their fields:

| type | fields | replay effect |
|---|---|---|
| `START` | `line?` | marks started |
| `CALL` | `key, parentKey, side, depth, isNull, val, args, line` | push a frame |
| `BASE` | `key, line, value` | `frame.phase = "base"` |
| `EVAL` | `key, side, line, childVal?` | `frame.phase = "wait-<side>"` |
| `CHECK` | `key, line, ...custom` | `frame.check = event` |
| `PRUNE` | `key, skipped:[keys], line` | mark every key in `skipped` pruned |
| `RETURN` | `key, parentKey, side, depth, value, line, reason` | pop; fill `frames[parentKey][side] = value`; set `justFilled` |
| `DONE` | `line, ...custom` | marks done |

`key` is a stable string identifying a call node (the reference uses a root-path string). Sibling
null calls must get distinct keys.

## Replay — port verbatim

`TreeLab.replayTo(trace, i)` must return exactly the reference's shape:

```
{ event, index, stack, frames, pruned, executed, callsSoFar,
  returning, justFilled, done, started, top, curLine, curDepth }
```

Frame shape: `{key, parentKey, side, depth, isNull, val, args, left, right,
phase, check, result, pruned}` with `phase` in `enter | base | wait-left | wait-right | returned`.

Replay must stay **pure and re-derivable from index 0** — that is what makes the scrubber and
step-back work. Do not keep incremental mutable state outside it.

## Generic (goes in the engine)

- `parseTokens(str)` / `buildTree(tokens)` — LeetCode level-order array with `null`s, tolerant of
  brackets and whitespace. Invalid input must surface a readable error, never throw.
- `layoutTree(root)` and `layoutCallTree(root)` — SVG layouts
- `renderCallTree` `renderStructure` `renderStack` `renderSource` `renderStats` `renderNarration`
- transport: play / pause / step / step-back / reset / scrub / speed
- zoom: `zIn` `zOut` `zFit` on the recursion tree, and `fitZoom()` on load
- Java syntax highlighting (`hlJava`) using `--t-*` tokens
- keyboard: `←` `→` step, `space` play/pause — ignored while an input is focused
- `prefers-reduced-motion` respected

## Problem-specific (the adapter each page supplies)

`TreeLab.mount(config)` where config is:

```js
TreeLab.mount({
  mountEl:   "#lab",              // container the engine builds into
  title:     "height()",          // name shown for the recursive function
  presets:   [ { label, tokens, note } ],
  defaultPreset: 0,

  // optional second source variant, e.g. short-circuit on/off
  variants:  [ { id:"prune", label:"Short-circuit: on",
                 java:[ "...lines..." ], lines:{ENTER:6, NULL:7, LEFT:9, ...} } ],

  // THE recursion. Emit events via `emit`. Must be a real implementation.
  run: function(root, emit, opts) { ... return answer; },

  // pending-expression HTML with holes, e.g. "1 + max(▢, 2)"
  expr:      function(frame, state) { return "<html>"; },
  // how a CHECK event renders inside its frame
  checkText: function(event, state) { return "<html>"; },
  // per-event narration: { tag, text }
  narrate:   function(state) { return {tag:"call", text:"..."}; },
  // extra stat chips and the final verdict
  stats:     function(state) { return [ {label:"calls", value:"3 / 7"} ]; },
  verdict:   function(state) { return {text:"balanced", ok:true}; },
  // optional: override how a node in the real tree is coloured
  nodeState: function(key, state) { return "active|path|done|pruned|ghost"; }
});
```

Everything in that object is optional except `mountEl`, `presets`, `run`, and one `variants` entry.
Sensible defaults for the rest.

## Pilot — `Visuals/110-balanced-binary-tree.html`

This page is an **essay** and the essay must survive. Do not delete or rewrite the prose,
the TOC rail, the `§1–§4` sections, the reference implementation block, the theme plumbing, or the
appbar. **Only** the small embedded visualizer inside `§2` is replaced: swap that block for a
`<div id="lab">` plus a `TreeLab.mount({...})` call, and add the two `<link>`/`<script>` tags.

Keep the page's existing inline house CSS intact — `tree-engine.css` layers on top of it.

The mounted lab must reach feature parity with the reference page: preset + custom tree input,
short-circuit toggle, play/step/scrub/speed, stats (depth, max, calls, frames, pruned), narration,
source pane with the running line, call stack newest-on-top with holes filling in, recursion tree
with zoom/fit, and the real binary tree beside it.

## Verification before you report

1. `node` is available. Extract `TreeLab.replayTo` and assert it is pure: replaying to index `i`
   from scratch equals stepping forward `i` times, for every `i`, on at least 5 trees.
2. Assert the reference's own answers still hold: run your ported `run()` for LC 110 against a
   plain recursive `isBalanced` oracle on ≥200 random trees.
3. Load the pilot in a browser. Step to the last frame. Check: no console errors, the essay
   sections all still render, the TOC rail still works, dark theme resolves, no horizontal overflow.
4. Confirm `tree-engine.css` contains **zero** hex/rgb literals — house tokens only.

## Do not

- touch any page other than `Visuals/110-balanced-binary-tree.html`
- edit `Visuals/index.html` or any study table
- introduce a build step, a bundler, ES modules, or any network request
- define new colours
