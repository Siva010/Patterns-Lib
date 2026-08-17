# Tree-recursion lab adapter — author's guide

Project root: `C:\Users\Siva\Dropbox\MSivaFiles\1- [ DSA ] Prep\Patterns Variations Study`

You are converting an **essay page** so its embedded diagram becomes a full recursion lab.
The engine is already built and verified. You write only the problem-specific adapter.

## Read these two first

1. **`Visuals/110-balanced-binary-tree.html`** — the reference conversion. Copy its shape exactly:
   the two `<head>` tags, the `<div id="lab">` where the old diagram was, and the adapter
   `<script>` at the end. Its adapter is the model for yours.
2. **`Visuals/tree-engine.js`** — skim `mount`, `replayTo` and the defaults so you know what you
   get for free.

## THE RULE THAT MATTERS MOST — the essay survives

These pages are study documents. **Do not delete, reword, reorder or "improve" any prose**, any
heading, the TOC rail, the appbar, the theme script, the `§1–§4` structure, the complexity
discussion, the failure-mode table, or the `§4` reference implementation. Do not touch the page's
existing inline `<style>`.

You make exactly four edits per page:
1. add `<link rel="stylesheet" href="tree-engine.css">` in the head
2. add `<script src="tree-engine.js"></script>` in the head (or before your adapter)
3. replace **only** the existing embedded visualizer block with `<div id="lab"></div>`
4. append your adapter `<script>` before `</body>`

If a page's existing visualizer block is hard to identify, find the element the page's own inline
viz JS renders into and replace that block, including the JS that drove it. Nothing else.

Also run `add_roles.py` on the page (see "Role palette" below) — that is a fifth mechanical edit.

## Role palette

The tree pages predate the semantic role tokens the engine wants. Run:

```bash
python <scratchpad>/add_roles.py Visuals/<your-page>.html
```

It is idempotent and prints what it did. Do this for every page you convert. Without it the lab
falls back to near-monochrome and the five call states stop being distinguishable.

## `TreeLab.mount(config)` — the full API

### Required

| key | type | notes |
|---|---|---|
| `mountEl` | selector or Element | `"#lab"` |
| `presets` | `Array<{tokens, label?, note?}>` or `Array<string>` | ≥1. Bare string ⇒ `{tokens}`. `note` shows under the bar |
| `variants` | `Array<{id?, label?, java?, lines?}>` | ≥1. `java` = 1-based source lines. `lines` = your name→line map, handed back as `opts.L`. `lines.TOP` is used for the auto START/DONE line. The variant toggle only renders when `length > 1` |
| `run` | `function(root, emit, opts) → answer` | THE recursion. `root` is `{val,left,right,key,depth}` or `null`; keys are root-path strings (`"R"`, `"RL"`, `"RLL"`…). `emit(event)` appends. `opts = {variant, id, index, L, lines, root, instance, maxNodes, maxHeight}` |

### Optional (default)

`title` (`"f()"`) · `subtitle` (`""`) · `tag` (`"interactive"`) · `lang` (`"Java"`) ·
`defaultPreset` (`0`) · `defaultVariant` (`0`) ·
`doneFields(result, opts)` (`null`, merged into the auto `DONE`) ·
`expr(frame, state, o)` (built-in `(▢, ▢)`) · `checkText(checkEvent, state)` (`null`) ·
`narrate(state, o)` (built-in) · `stats(state)` (`null`, appended after built-ins) ·
`verdict(state)` (`null`) · `nodeState(key, state)` (`TreeLab.defaultNodeState`) ·
`nodeResult(frame, state)` (`TreeLab.fmtVal(frame.result)`; `null`/`""` draws nothing) ·
`isFail(value)` (`v === -1` — **decides the sentinel hue everywhere; override it if `-1` is a
legitimate answer for your problem**) ·
`maxNodes` (`31`) · `maxHeight` (`6`) · `maxEvents` (`4000`) ·
`speeds` / `defaultSpeed` (`6`) ·
`showSource` `showStack` `showCallTree` `showStructure` `showCustom` `builtinStats` (all `true`) ·
`legend` (5-item default; `state` ∈ `active|path|done|neg|pruned|ghost`, or `false`) ·
`callTreeNote` (`""`) · `structureNote` (default mentions the extra null leaf) ·
`customPlaceholder` · `holeGlyph` (`▢`) · `nullGlyph` (`∅`) ·
`keyboard` — **use `true` (focus-scoped). Never `"document"` on an essay page**, it hijacks the
page's space and arrow keys ·
`autoplay` (`false`) · `onLoad(instance, root)` · `onStep(state, instance)`

`expr` and `narrate` receive `o = {isFail, glyph, title}`; pass it straight to `TreeLab.hole`.

### Statics you can use

`TreeLab.parseTokens` `buildTree` `treeHeight` `countNodes` `subtreeKeys(node,key)` (→ a
`PRUNE.skipped` array) `layoutTree` `layoutCallTree` `replayTo` `hlJava` `esc` `fmtVal`
`hole(frame, side, state, o)` `defaultNodeState` `defaultNarrate` `DEFAULT_SPEEDS` `DEFAULT_LEGEND`

## Event vocabulary — emit these from `run`

| type | fields | meaning |
|---|---|---|
| `CALL` | `key, parentKey, side, depth, isNull, val, args, line` | entering a call |
| `BASE` | `key, line, value` | hit the base case |
| `EVAL` | `key, side, line, childVal?` | about to recurse into `side` (`"left"`/`"right"`) |
| `CHECK` | `key, line, ...custom` | a guard/test — rendered by your `checkText` |
| `PRUNE` | `key, skipped:[keys], line` | short-circuit; use `TreeLab.subtreeKeys` for `skipped` |
| `RETURN` | `key, parentKey, side, depth, value, line, reason` | returning; fills the parent's hole |

`START` and `DONE` are added by the engine automatically — emit them yourself only if you need
custom fields on them (or use `doneFields`).

**`side` must be `"left"` or `"right"`** — that is what fills `frame.left` / `frame.right`.
For problems where a call has more than two children or a non-child recursion, still use those two
slots and explain the mapping in `expr`.

## Two trees, or two cursors in one tree (engine 1.1.0+)

Some problems compare two trees (100, 572, 617, 951) or two positions in one tree (101).
The engine now renders up to two structures side by side and lets a call say which nodes it is
looking at.

**Presets** gain `tokens2`:

```js
presets: [
  { tokens: "[1,2,3]", tokens2: "[1,2,3]", note: "identical" },
  { tokens: "[1,2]",   tokens2: "[1,null,2]", note: "same values, different shape" },
]
```

**`treeLabels`** captions the two panels, e.g. `treeLabels: ["p", "q"]`. Omit it and no caption
band is drawn.

The single custom-input box carries both trees separated by `|` — `[1,2,3] | [1,2,3]`. That is
handled inside `loadTokens`, so you need no extra UI. `cfg.dualSep` changes the separator.

**`run` receives `opts.root2`** — the second tree's root, or `null`.

**`refs` on a `CALL` event** says which real nodes that call is examining:

```js
em({ type: "CALL", key: k, /* ...as usual... */,
     refs: [{ t: 0, key: "RL" }, { t: 1, key: "RL" }] });
```

`t` is the structure index (`0` = first tree, `1` = second), `key` is the node key inside that
tree. The structure panel colours each node with the state of the frame pointing at it. Omit
`refs` entirely and behaviour is exactly as before — the panel keys off the frame key, which is
what every single-tree page does.

For **101 (symmetric)** there is only one tree, so emit `t: 0` twice with the two different keys:
`refs: [{t:0,key:"RL"},{t:0,key:"RR"}]`. Do **not** pass `tokens2`.

For **572 (subtree of another)** the outer walk and the inner comparison both emit refs; the
inner comparison's `t:0` key is the candidate's key plus the relative path.

`cfg.nodeState` gets a third argument on dual pages: `nodeState(frameKey, st, {t, key, frame})`.
Existing single-tree adapters ignore it and are unaffected.

## Non-scalar return values

If your recursion returns a tuple or object (LC 337 `{rob, skip}`, LC 979 balance, LC 968 states),
that is fine — the engine stores whatever you put in `RETURN.value`. You then must supply:
- `isFail` (almost certainly `() => false`, since `-1` is meaningless for you)
- `nodeResult` to format it short enough to sit under a node
- `expr` so the pending expression shows the tuple's holes

## Correctness bar

`run` must be a **real, correct implementation** — not a canned frame list. Trace it against the
edge cases before you write it. State complexity truthfully wherever the page mentions it.
If a problem has a classic trap, the lab should make that trap visible; that is the reason the
problem is in the syllabus.

## Verification before you report — all of it

1. **Correctness**: extract your `run` and compare against an independently written recursive
   oracle on ≥150 random trees plus these degenerates: empty `[]`, single `[1]`, left chain,
   right chain, perfect tree, all-equal values, and one tree that exercises your problem's trap.
2. **Contract**: for every one of those traces assert — the final frame has `done:true`; `CALL`
   count equals `RETURN` count; the stack is empty at the last index; no key in `pruned` was ever
   entered; and `narrate` / `expr` / `checkText` / `verdict` / `nodeResult` never throw at **any**
   index of **any** trace.
3. **Replay purity**: `TreeLab.replayTo(trace, i)` twice at the same `i` must be identical, and
   descending order must match ascending.
4. **Essay intact**: assert every `§` heading id, the rail, the appbar and the reference block are
   still present, and that the page has exactly one `<style>` and one `</html>`.
5. Load the page in a browser if you can; report if you could not.

## Do not

- edit any page other than the ones assigned to you
- edit `tree-engine.js`, `tree-engine.css`, `Visuals/index.html`, or any study table
- use `keyboard: "document"`
- introduce a build step, ES modules, or any network request
- define new colours anywhere
