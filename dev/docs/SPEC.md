# Visualizer build contract

Project root: `C:\Users\Siva\Dropbox\MSivaFiles\1- [ DSA ] Prep\Patterns Variations Study`
Scratchpad:   `C:\Users\Siva\AppData\Local\Temp\claude\C--Users-Siva-Dropbox-MSivaFiles-1----DSA---Prep-Patterns-Variations-Study\3bc8a67b-d221-4c26-a364-9dfb4a96a5ca\scratchpad`

You are building interactive algorithm visualizers for a static DSA study site.
Every page is one self-contained HTML file. No build step, no frameworks, no
external JS/CSS beyond the Google Fonts link that is already in the prelude.

## Read these first

1. **`Visuals/15-3sum.html`** — the canonical reference page. Read it end to end
   before writing anything. Your output must be recognisably the same page design.
2. **`scratchpad/PRELUDE.html`** — lines 1–335 of that reference, with three
   placeholders. Copy it **verbatim** as the top of every file you write, replacing
   only `{{LC}}`, `{{NAME}}`, `{{DESCRIPTION}}`.
3. **`scratchpad/POSTLUDE.html`** — the theme-toggle script. Copy verbatim as the
   last thing before `</body></html>`.

Do not restyle, "improve", or reformat the prelude CSS. It is shared house style.

## Write incrementally — this matters

The connection to this environment drops. Agents have been killed mid-run several
times. **Write each file to disk the moment it is complete, then move to the next
one.** Do not hold two or three finished pages in memory and write them all at the
end — a drop at that point loses everything. Run the self-check after each write
rather than batching it. A finished file on disk survives anything.

## File naming

`Visuals/<lc-number>-<kebab-slug>.html` — slug from the LeetCode title, lowercase,
non-alphanumerics collapsed to `-`. Example: `26-remove-duplicates-from-sorted-array.html`.

## Page skeleton (between prelude and postlude)

Mirror the reference exactly:

```
<div class="eyebrow">SUB-VARIANT LABEL <span class="tag">LeetCode NN</span></div>
<h1>Title <span class="thin">/ visualized</span></h1>
<p class="lede">2–3 sentences. Name the machine and the invariant, not the story.</p>

<div class="controls-top">
  <div class="field">
    <label for="arrInput">ARRAY (COMMA-SEPARATED)</label>   <!-- label suits the input -->
    <div class="input-shell">
      <input id="arrInput" type="text" value="..." spellcheck="false" autocomplete="off">
      <button class="btn primary" id="runBtn">&#9654; Run</button>
    </div>
  </div>
</div>
<div class="examples" id="examples"></div>

<div class="grid">
  <div class="card">
    <div class="card-head"><h2>Execution</h2><span class="phase-pill" id="phasePill">idle</span></div>
    <div class="stage"> ...problem-specific visual... <div class="message" id="message"></div> </div>
    <div class="transport"> prev / play / next / restart / progress / speed </div>
  </div>
  <div class="card">
    <div class="card-head"><h2>Java &middot; running line</h2></div>
    <div class="code" id="code"></div>
    <div class="legend"> ...dots... </div>
  </div>
</div>

<div class="foot">complexity &middot; the one sentence worth remembering</div>
```

## Semantic colour roles — THIS IS THE PART THAT DRIFTS

Never introduce a new hue. Never hardcode a hex in a component rule. Use only:

| token | meaning | use for |
|---|---|---|
| `--r-anchor` | the fixed / pivot pointer | `i`, `mid`, the anchored index |
| `--r-anchor2` | a **second** fixed pointer | `j` in 4Sum-style double anchors |
| `--r-left` | left / slow / lo / write pointer | |
| `--r-right` | right / fast / hi / read pointer | |
| `--r-window` | the live span or active region | the current window, the search range |
| `--r-hit` | found / valid / recorded answer | |
| *(no hue)* | discarded / skipped / dead | `--fg-dim` + dashed border + reduced opacity |

Each has `-wash` (background tint) and `-line` (border) variants: `var(--r-left-wash)`.
A discarded cell **must not** get an alarm colour — it recedes. Reference: `.cell.skipped`
and `.cell.dupskip` in the reference page.

Neutral tokens: `--bg --bg-sunk --bg-code --fg --fg-mid --fg-dim --rule --rule-hard
--accent --accent-fg --accent-wash --accent-line --serif --sans --mono`.
Syntax tokens for the code pane: `--t-key --t-typ --t-ann`.

If your problem needs a component the reference lacks (linked-list nodes, two
sequences side by side, an interval bar), add CSS for it **in a `<style>` block you
append inside the existing prelude `<style>`**, built only from the tokens above.

## The simulation

- A `CODE` array of Java source lines, each an array of `[class, text]` spans using
  classes `kw` `ty` `fn` `tx`. Rendered into `#code` with `data-line` indices.
- A `buildFrames(input)` that runs a **real, correct implementation** and pushes one
  frame per meaningful step. Every frame carries at minimum:
  `{ ...state, phase, code: <line index>, msg: '<html string>' }`
- `render()` applies the current frame to the DOM and adds `.exec` to the running line.
- Transport: `prevBtn` `playBtn` `nextBtn` `restartBtn`, `#bar`, `#stepCount`, `#speed`.
- Keyboard: ArrowLeft / ArrowRight step, Space toggles play. Ignore keys while the
  input is focused.
- 4–5 example chips in `#examples`, each `[value, 'what it shows']`. **Verify each chip
  actually produces the behaviour its label claims** — a chip labelled "duplicate skip"
  that never triggers one is a bug.
- Parse and clamp user input defensively (cap length ~10–12 cells so the tape fits).

Message spans use `.i` (anchor) `.l` (left) `.r` (right) `.m` (hit) `.x` (discarded)
`.k` (inline code), matching the reference.

## buildFrames contract — NON-NEGOTIABLE

Earlier pages drifted on all three of these and it made central verification painful.
Follow this exactly:

1. **Signature:** `buildFrames(input, ...params)` where `input` is the primary data.
2. **Input type:** an **array** — of numbers, or of single-character strings for string
   problems (`[...str]`). Never take a raw string. Do the parsing and clamping in `run()`
   before you call `buildFrames`.
3. **Return:** a plain **flat array of frames**. Not an object, not `{F, truth}`.
   If you need an independently-computed reference answer for a verdict card, attach it to
   the final frame as `truth`, not to the return value.
4. **The final frame MUST carry `ans`** — the value the problem actually returns, in the
   problem's own contract. Not an index into something, unless the answer *is* an index.
   - Unreachable / not-found must be the problem's real sentinel (`0` for LC 209, `-1` for
     LC 862), never `Infinity` and never `undefined`.
   - You may carry other fields too (`best`, `count`, `bestL`…), but `ans` must exist and
     must be the returned answer.
5. **The final frame MUST carry `done: true`.**

A one-line self-test you should run on every page before reporting:

```js
const L = buildFrames(sampleInput, ...params).slice(-1)[0];
console.assert(L.done === true && L.ans !== undefined, "final frame contract violated");
```

## Degenerate inputs — test these, they are where the bugs were

Empty input, single element, all-identical elements, and the parameter at its extremes
(k = 0, k = n, limit = 0, target unreachable). Several shipped pages printed `Infinity`,
printed no verdict at all, or rendered a verdict on a frame *before* the line that computes
it had run. Step your own page to the last frame on each of these before you report.

## Correctness bar

The algorithm must be right, not just plausible. Trace it mentally against the
edge cases in your example chips before you write the frames. State the complexity
truthfully in `.foot`. If a problem has a classic trap (LC 80's `k=2` bound, LC 41's
in-place cycle placement, LC 287's two-phase Floyd), the visualization should make
that trap *visible*, because that is the entire reason the problem is in the syllabus.

## Self-check before you finish

Run this on each file you wrote and fix anything it reports:

```bash
python - <<'EOF'
import re,glob,os
for p in glob.glob("Visuals/<your-files>*.html"):
    t=open(p,encoding="utf-8").read(); e=[]
    for tag,n in [("<style>",1),("</style>",1),("</head>",1),("<body>",1),("</body>",1),("</html>",1)]:
        if t.count(tag)!=n: e.append("%s=%d"%(tag,t.count(tag)))
    for s in ['id="themeBtn"','class="appbar"','tpswbs.v1.theme','Source Serif 4','id="stepCount"']:
        if s not in t: e.append("missing "+s)
    used=set(re.findall(r'var\(\s*(--[a-z0-9-]+)',t)); defd=set(re.findall(r'(--[a-z0-9-]+)\s*:',t))
    if used-defd: e.append("undefined tokens: %s"%sorted(used-defd))
    body=t[t.index("</style>"):]
    stray=[h for h in re.findall(r'#[0-9a-fA-F]{6}\b',t[t.index("<style>"):t.index("</style>")])]
    print(os.path.basename(p), e or "OK", ("stray hex in CSS: %d"%len(stray)) if len(stray)>40 else "")
EOF
```

Also open each file and confirm it is >12 KB and the `<h1>` matches the problem.

## Do not

- touch any file outside the `Visuals/<your assigned files>` you were given
- edit `Visuals/index.html`, the study tables, or any other page — the orchestrator
  wires those up centrally afterwards
- add a favicon, analytics, or any network request
- leave `TODO`, placeholder arrays, or a `buildFrames` that returns canned frames
