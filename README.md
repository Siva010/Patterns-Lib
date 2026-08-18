<div align="center">

# Patterns, No Gaps

### Stop grinding lists. Start recognising machines.

**A DSA study library organised by pattern and sub-variant — not by "Top 150 Problems That Will Get You Hired."**
Every problem earns its place by teaching exactly one thing no earlier problem taught.
Every algorithm ships with an interactive visualizer you can drive with your own input.

<br>

`Java 21` · `LeetCode-numbered` · `Zero build step` · `Works offline` · `Light & dark`

<br>

**[→ Open the library](index.html)** &nbsp;·&nbsp; **[Browse the visualizers](Visuals/index.html)**

</div>

<br>

---

## The problem with problem lists

You solve 150 problems. You get an offer-shaped feeling. Then an interviewer asks something
*slightly* off-list and you discover you memorised 150 solutions instead of learning six machines.

Curated lists optimise for coverage of *problems*. This library optimises for coverage of
**sub-variants** — the distinct mechanical shapes a pattern can take. Two Pointers isn't one
technique, it's eleven. Sliding Window is eleven more. Once you can name the machine, the
problem stops being a problem.

<br>

## What's inside

### 🧭 Every pattern, decomposed into sub-variants

Each pattern is broken into lettered sub-variants in **strict prerequisite order**. You don't
pick problems — you walk a path, and each step is the smallest possible increment over the last.

```
Two Pointers
  A  Converging pointers on sorted data      the discard argument is the whole pattern
  B  Converging with a discard proof         greedy: prove the smaller side can be dropped
  C  k-Sum reduction                         peel an index, recurse, bottom out at two pointers
  D  Read/write compaction                   the prefix [0, write) is the answer so far
  E  Two-sequence advance                    the design question is which pointer moves
  F  Backward-writing merge                  write from the back and you never clobber
  G  Fast & slow, and gap pointers           distance, not position
  H  Partitioning                            three regions, one pass
  I  Expand around center                    2n−1 centers, not n
  J  Cyclic sort                             value v belongs at index v−1
  K  Counting pairs on sorted data           count the block, don't enumerate it
```

Every sub-variant states its **mental model in one sentence** — the thing you should be able to
say out loud before you write a line of code.

### ⚠️ Anti-pattern problems — the highest-value pages here

Most resources teach you what works. These pages teach you **where the obvious approach is
wrong**, which is what actually separates people in interviews.

Each anti-pattern page runs in **two acts**:

1. **Act 1** — the naive approach runs and *visibly produces the wrong answer*. You watch the
   exact frame where the invariant breaks.
2. **Act 2** — the correct algorithm runs on the same input, with the wrong answer left on
   screen beside the right one.

Some of what that looks like in practice:

- **LC 862** — the sliding window quits early, then the page *keeps shrinking as a counterfactual*
  so you watch the sum **rise** when a negative leaves. "Shrink while valid" isn't a stopping rule
  when removal can increase the sum.
- **LC 560** — a shadow execution runs with `seen[0] = 1` omitted and returns the wrong count.
  The cost of that one missing line is a number on screen, not a claim in prose.
- **LC 1** — included specifically as a trap. It looks like Two Pointers. Sorting destroys the
  answer, because the output is indices.

### 🎬 Interactive visualizers, driven by real implementations

Not animations. Each page runs an **actual instrumented implementation** and emits one frame per
meaningful step.

|  |  |
|---|---|
| **Type your own input** | Change the array or string and the whole trace rebuilds against it. Drive the algorithm into the edge case *you* don't understand. |
| **Step or play** | Arrow keys, transport controls, adjustable speed. Space toggles play. |
| **Code follows execution** | A Java pane highlights the exact line running at the current frame. |
| **The invariant is on screen** | A persistent rule bar restates the governing rule every frame — *"retire whichever interval ends first"*, *"j moves every step, i only on a match."* |
| **Curated example chips** | Each page ships hand-picked inputs that trigger specific behaviours — the duplicate skip, the wrap-around, the case where the naive answer is wrong. |

Colour is **semantic and consistent across every page**: one hue for the anchor pointer, one for
left, one for right, one for the live window, one for a recorded answer. A discarded cell never
gets an alarm colour — it just recedes. Learn the vocabulary once, read every page.

### 📊 Progress that's actually yours

- **Checkbox per problem**, stored in your browser — no account, no server, nothing leaves your machine
- **Live progress meters** on every hub and pattern page
- **Export / import your progress as a file** — move between machines, or keep a backup
- **Reset** when you want a clean second pass

### 🔍 Built for finding things fast

- **Press `/`** to search every problem by name or LeetCode number
- **Table-of-contents rail** with scroll-spy on every long page
- **Copy-link anchors** on every section
- **Cross-references** between related problems, so `#8` in a "why" column jumps to LC 15
- **A visualizer icon** next to any problem that has one — click straight from the table into the trace

### 🗺️ Recognition guides and mastery checkpoints

Reading tables isn't studying. Each bundle closes with:

- **A decision procedure** — a concrete flow for identifying which machine a new problem needs
- **A signal → pattern cheat table** — the phrases in a problem statement that give the answer away
- **Trap cases** — where the obvious pattern is wrong, collected in one place
- **Mastery checkpoints** — can you state the invariant, reconstruct the template, name the failure mode?
- **A spaced-repetition revisit rule** — graded by how the attempt actually went (clean / slow /
  hinted / read the editorial), with an explicit schedule per grade and a capped daily queue

### ⚙️ Java templates that were actually run

Every template in the documents was **compiled and executed against the listed cases** before
being written down. They're collapsible, copyable, and annotated with the failure mode each
guard exists to prevent.

<br>

## Design

Deliberately not a dashboard. The reading surface is an **editorial document** — Source Serif for
prose, Inter for interface, JetBrains Mono for code, one warm accent, no gradients, no drop
shadows, generous measure.

- **Light and dark**, following your system by default, toggled per taste — and the setting
  follows you from a study table into a visualizer and back
- **Print stylesheet** — the tables print cleanly, with LeetCode numbers rendered inline
- **Respects `prefers-reduced-motion`**
- **Keyboard navigable**, with skip links, ARIA labelling, and focus-visible states throughout
- **Responsive** down to phone width

<br>

## Getting started

No install. No build. No dependencies.

```bash
git clone https://github.com/<your-handle>/patterns-no-gaps.git
cd patterns-no-gaps
```

Then open **`index.html`** in a browser. That's the whole setup.

Every page is a single self-contained HTML file — inline CSS, inline JS, no bundler, no
node_modules, no network calls except one Google Fonts stylesheet. Works from `file://`, works
on a plane, works in five years when today's framework is a memory.

<br>

## How to actually use it

1. **Start at a pattern hub** and read the sub-variant breakdown before touching a problem.
   Naming the machine is the skill; solving is downstream of it.
2. **Work the table top to bottom.** It's in prerequisite order for a reason. Skipping ahead
   means solving a problem whose lesson you don't yet have the vocabulary for.
3. **Try the problem on LeetCode first.** Open the visualizer when you're stuck, or after you've
   solved it to check your mental model matched the machine.
4. **When a visualizer surprises you, change the input.** That surprise is the gap. Feed it the
   case you got wrong.
5. **Tick it off.** Then let the revisit schedule bring it back before you've forgotten it.

<br>

## Repository layout

```
.
├─ index.html            the study library — start here
├─ three-patterns/       Two Pointers · Sliding Window · Binary Search
│  ├─ index.html           hub: recognition guide, checkpoints, coverage
│  ├─ two-pointers.html    sub-variants, problem table, templates, failure modes
│  ├─ sliding-window.html
│  ├─ binary-search.html
│  └─ src/                 markdown sources for the rendered pages
├─ trees/                Traversal · Tree Recursion · Binary Search Trees
│  ├─ index.html           hub
│  ├─ traversal.html  tree-recursion.html  bst.html
│  └─ src/trees.md
├─ graphs/               Traversal & Connectivity · Ordering, Partitions & Spanning · Weighted Paths
│  ├─ index.html           hub
│  ├─ traversal.html  ordering.html  weighted-paths.html
│  └─ src/graphs.md
├─ Visuals/              every interactive visualizer
│  ├─ index.html           catalog, grouped by pattern and sub-variant
│  └─ <lc>-<slug>.html     one self-contained page each
└─ assets/
```

<br>

## Status

The study documents are **complete** for all nine patterns across three bundles — every
sub-variant, table, template, failure mode, recognition guide and checkpoint is written.

Visualizer coverage is **still growing**. Traversal, Tree Recursion, Two Pointers and Sliding
Window are fully covered; Binary Search is partial, Binary Search Trees is next up, and the
graph patterns have none yet — a graph lab needs a different engine from the tree one. A problem
without a visualizer simply has no icon beside it in the table — everything else works.

<br>

## Contributing

Contributions very welcome, especially new visualizers.

Every visualizer follows one contract: copy the shared prelude verbatim, use only the semantic
colour tokens, and drive the page from a **real implementation** rather than a hand-authored list
of frames. If a problem has a classic trap, the visualization should make that trap *visible* —
that's the entire reason the problem is in the syllabus.

Good first contributions:

- A visualizer for any problem whose table row has no icon yet
- An example chip that triggers a behaviour the existing chips miss
- A failure mode you hit in a real interview that isn't in the tables

<br>

## Acknowledgements

Problem numbering and statements belong to [LeetCode](https://leetcode.com). This repository
contains original explanations, templates and visualizations — not problem text.

<br>

---

<div align="center">

**If this saves you from grinding a list you'll forget, that's the whole point.**

⭐ Star it if it's useful · Open an issue if a page confused you — that's a bug in the explanation

</div>
