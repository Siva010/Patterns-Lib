# Trees, No Gaps — Traversal · Tree Recursion · Binary Search Trees

**Calibration:** written for an advanced backend engineer doing FAANG prep in **Java 21**, LeetCode-numbered, and shaped as a companion to *Three Patterns, No Gaps*. The level bracket is left open, so the doc is tiered instead of guessed: the **★ core path is the minimum sufficient set** (a strong beginner can follow it linearly), **○ marks optional depth**, and **Extra Reps** are pure repetition — skip them if the starred problem went clean the first time.

**Total core: 58 problems** — 52 ★ plus 6 ⚠. Everything else is explicitly labelled optional. Nothing here is padding; if a problem is listed, there is exactly one thing it teaches that no earlier problem taught.

Every template in this document was compiled and run against the listed cases before being written down.

---

## How to read the tables

| Marker | Meaning |
|---|---|
| ★ | Core. Must solve unaided, from scratch, before advancing. |
| ○ | Optional. Solve only if the gate check for that sub-variant fails, or you want depth. |
| 🔒 | LeetCode Premium. Free substitute given where one exists. |
| ⚠ | **Anti-pattern problem.** Included specifically because the obvious recursion is *wrong*. These are the highest-value problems in the entire document. |

Problems within a sub-variant are in strict prerequisite order. Sub-variants themselves are in prerequisite order.

Two conventions used throughout, because they remove more bugs than anything else:

- **A tree question is answered by exactly one of three machines** — a traversal (I need to *visit*), a recursion that returns a value (I need to *aggregate*), or an ordering argument (it is a BST, so I need to *decide which subtree to skip*). Naming the machine before writing code is the entire skill.
- **`null` is a case, not an accident.** Every template below states what it returns for `null` and why that value is the identity element of whatever it is combining.

---
---

# PATTERN 1 — TRAVERSAL

## 1.1 Pattern Breakdown

Traversal is not one technique. It is a family united by a single idea: **impose a total order on the nodes, then visit each one exactly once.** The sub-variants differ in *what imposes the order* and *what state rides along with the visit*.

| # | Sub-variant | Order imposed by | State carried | Space |
|---|---|---|---|---|
| **A** | **Recursive DFS — the three orders** | the call stack | the implicit root-path | O(h) |
| **B** | **Iterative DFS — explicit stack** | a stack you own | whatever you push | O(h) |
| **C** | **BFS — level order** | a FIFO queue + a size snapshot | the current frontier | O(w) |
| **D** | **Level-order derivatives** | as C, then a per-level rule | one accumulator per level | O(w) |
| **E** | **Coordinate-indexed traversal** | a computed `(row, col)` or heap index | an index per node | O(n) |
| **F** | **Tree as a graph** | a parent map + BFS from any node | `visited` — trees stop being acyclic-by-direction | O(n) |
| **G** | **Morris threading** | temporary right-child threads | none | **O(1)** |
| **H** | **N-ary / generalized children** | a child list instead of `left`/`right` | as A–D | O(h) or O(w) |

**Sub-variants worth stating explicitly:**
- **B** is not "A without recursion." The iterative inorder and postorder machines have genuinely different shapes, and postorder-by-reversed-preorder is the trick people fail to reconstruct under pressure.
- **C** hinges on one line — `int sz = q.size();` taken *before* the inner loop. Every level-order problem is that snapshot plus an accumulator.
- **E** is the family where the node's *position* is data. Heap indexing (`2i`, `2i+1`) for width, `(col, row)` sort keys for vertical order.
- **F** is the sub-variant most people never learn: once a question asks about distance in *any* direction, the tree is a graph, and top-down DFS cannot answer it at all.
- **G** exists for exactly one interview sentence: "can you do it in O(1) space?"

---

## 1.2 Problem Table

### A — Recursive DFS: the three orders

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★1 | **144. Binary Tree Preorder Traversal** | Easy | A | The atom. Establishes the base case `if (node == null) return;` and the fact that "visit" is one line you can move. |
| ★2 | **94. Binary Tree Inorder Traversal** | Easy | A | Moving the visit line one position changes the entire output order. This is the whole lesson of sub-variant A. |
| ★3 | **145. Binary Tree Postorder Traversal** | Easy | A | Postorder is the *only* order in which a node is processed after both children — therefore the only order that can aggregate from below. Everything in Pattern 2 is postorder. |
| ○4 | 589. N-ary Tree Preorder Traversal | Easy | A + H | Same recursion with a child list. Do it only if the generalization isn't obvious. |

### B — Iterative DFS with an explicit stack

> **Intuition.** This is **not** *A without recursion*. You are hand-building the machine the call stack was running for you — and inorder and postorder turn out to have genuinely different shapes.

**Mental model.** *"The stack holds the ancestors I still owe something to. For inorder that is exactly the ancestors whose left subtree is finished but whose own value I have not emitted yet."*

Postorder-by-reversed-preorder is the piece people fail to reconstruct under pressure, and it comes with a caveat that matters more than the trick itself.

LC 173 is the reason this sub-variant earns its place: a **paused inorder**. The same machine, stopped between steps, with the stack as the saved position.

```
   INORDER, iterative
       while (cur != null || stack nonempty):
           descend left, pushing every node
           pop -> emit -> move to its RIGHT child
       INVARIANT: the stack holds exactly those ancestors whose LEFT subtree is finished
                  and whose own value has NOT yet been emitted

   POSTORDER, by reversed preorder
       push root;  pop -> addFirst;  push LEFT then RIGHT   (so RIGHT pops first)
       Root-Right-Left emitted front-first  ==  Left-Right-Root
       CAVEAT: correct LIST, wrong MOMENTS
```

*`addFirst` does the reversing as you go, with no second pass. Pushing left before right is what makes right pop first, which is what makes the reversal come out as postorder.*

**Recognition — reach for this when:**

- ✓ Recursion is unavailable, or the stack depth would overflow.
- ✓ You need to **pause** the traversal between nodes — an iterator, a merge of two trees.
- ✓ You want explicit control over what is remembered at each node.
- ✗ But **not** when you need to act on a node strictly *after* both children. Reversed-preorder gives the right list at the wrong time.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★5 | **94. Binary Tree Inorder Traversal** *(iterative)* | Easy | B | The follow-up is the actual exercise. "Descend left pushing, pop, visit, go right" — the only DFS machine you must be able to write without recursion. |
| ★6 | **145. Binary Tree Postorder Traversal** *(iterative)* | Easy | B | Reverse-preorder: push left before right, then reverse the output. Know that this is *not* true postorder timing — it produces the right list, not the right visit moments. |
| ★7 | **173. Binary Search Tree Iterator** | Medium | B | A *paused* inorder. Forces you to store the machine's state between calls, which proves you understand what the stack held. O(h) space, amortized O(1) `next()`. |
| ○8 | 331. Verify Preorder Serialization of a Binary Tree | Medium | B | Slot counting — a traversal with no tree at all. Elegant, occasionally asked, teaches nothing structural. |

#### Why it works — the inorder invariant, and the postorder trick's limit

The inorder machine is worth deriving once; the postorder one is worth knowing precisely what it does and does not give you.

1. **The inorder invariant.** The stack holds exactly those ancestors whose left subtree is finished and whose own value has not yet been emitted. Everything the loop does maintains that sentence.
2. **The two halves of the loop.** Descend left while pushing — you are deferring every node you pass. Then pop, emit (its left subtree is now provably done), and move to its right child, because that is the only debt left.
3. **The postorder trick.** Root-Right-Left, emitted front-first, reads as Left-Right-Root. Push **left** first so that **right** pops first, and use `addFirst` so the reversal happens without a second pass.
4. **What the trick does not give you.** It produces the correct sequence, but each node is *processed* before its children. If the visit has a side effect that must happen after both children — freeing, folding, releasing — the timing is wrong even though the list is right.

> **The caveat that makes reversed-preorder a list trick rather than a traversal:** it yields the correct **list**, not the correct visit **moments**. If you must act on a node strictly after both children (freeing, folding), use the `lastVisited` form.

**LC 173's `next()` is amortized `O(1)`, and the gate asks why.** Each node is pushed exactly once and popped exactly once across the whole iteration, so `n` calls do `O(n)` total work even though a single call may descend a long left spine. Space is `O(h)`.

**`Deque` is both a stack and a queue, which is the hazard.** `push`/`pop` give LIFO, `add`/`poll` give FIFO. Mixing them inside one method silently turns a BFS into a DFS.

#### Walkthrough — iterative inorder on the five-node tree

Watch the stack. At every emit, the invariant holds: everything on the stack is an ancestor whose left subtree is finished and whose value is still owed.

```
        1
       / \
      2   3
     / \
    4   5
```

| # | cur | Stack (top first) | Action | Emitted so far |
|---|---|---|---|---|
| 1 | 1 → 2 → 4 | `4, 2, 1` | descend left, pushing each | -- |
| 2 | -- | `2, 1` | pop 4, emit, go to its right (null) | 4 |
| 3 | -- | `1` | pop 2, emit, go to its right → 5 | 4, 2 |
| 4 | 5 | `5, 1` | descend from 5 (no left child) | 4, 2 |
| 5 | -- | `1` | pop 5, emit, right is null | 4, 2, 5 |
| 6 | -- | `(empty)` | pop 1, emit, go right → 3, push and pop it | 4, 2, 5, **1, 3** |

Inorder `4 2 5 1 3`, matching the recursive walk exactly. Note step 3: node 2 is emitted the moment it is popped, and *only* then does its right subtree get explored — which is the iterative restatement of *the visit sits between the two calls*.

#### Key observations — what interviewers are listening for

- **State the stack invariant, not the loop.** *Ancestors whose left subtree is done and whose value is still owed.* The gate asks for it, and it reconstructs the code if you blank.
- **The amortization argument is short.** Each node is pushed once and popped once, so `n` calls cost `O(n)` overall. That is the whole answer to *why is `next()` amortized `O(1)`?*
- **Know the postorder caveat before you use the trick.** Right list, wrong moments. Volunteering that distinction shows you understand what a traversal order actually is.
- **An iterator is a paused traversal.** Framing LC 173 that way — rather than as a new problem — is what makes it a two-minute problem instead of a twenty-minute one.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Using reversed-preorder postorder for side effects | a node is processed before its children are done, so folds and frees happen in the wrong order. | It produces the right list, not the right timing. Use recursion or the `lastVisited` form. |
| Mixing `push`/`pop` with `add`/`poll` on one `Deque` | a silent DFS where you intended a BFS, or vice versa. | `add`/`poll` for FIFO, `push`/`pop` for LIFO. Never mix them in one method. |
| Pushing right before left in the postorder trick | the reversal comes out as the wrong order entirely. | Push **left** first so **right** pops first — that ordering is what the reversal depends on. |
| Emitting during the descend loop | you get preorder while believing you wrote inorder. | The descend loop only pushes. Emission happens after the pop. |

#### Key takeaway

- **Trigger:** recursion unavailable, stack depth a risk, or the traversal must be **pausable**.
- **Inorder invariant:** the stack holds ancestors whose left subtree is done and whose value is still owed.
- **Postorder trick:** Root-Right-Left with `addFirst`; push left first so right pops first.
- **The caveat:** correct list, wrong moments — use `lastVisited` when timing matters.
- **Gate:** iterative inorder blind with the invariant stated, then LC 173 and why `next()` is amortized `O(1)`. See [§5.1](#51-traversal).


### C — BFS: level order with the size snapshot

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★9 | **102. Binary Tree Level Order Traversal** | Medium | C | The size snapshot. `int sz = q.size()` before the inner loop is the one line that separates levels; without it you have a flat traversal. |
| ⚠10 | **111. Minimum Depth of Binary Tree** | Easy | C | The obvious `1 + min(left, right)` is **wrong**: a node with one child would report depth 1 through a `null` that is not a leaf. Also the first problem where BFS strictly beats DFS — it stops at the first leaf. |
| ○11 | 107. Binary Tree Level Order Traversal II | Medium | C | #9 with `addFirst`. Two-minute warm-up, nothing new. |

### D — Level-order derivatives

> **Intuition.** Once you own the level skeleton, every derivative is **one per-level rule**: keep the last one, alternate the direction, average them, take the maximum.

**Mental model.** *"Same machine, different accumulator. The only question left is what I do with a level once I am holding all of it."*

The interesting cases are the ones where a **DFS** does the same job more cheaply. LC 199's right side view is the example worth knowing both ways, because the two forms have different space costs and the gate asks you to name which is which.

Zigzag carries the one real trap in this sub-variant, and it is a trap about *where the reversal lives*.

```
   199, two ways -- know both and which is which:
       BFS   take the LAST node of each level                O(w) space
       DFS   visit RIGHT first; record when depth == out.size()   O(h) space

   103 zigzag -- the direction flag belongs to the OUTPUT list:
       if (l2r) level.addLast(v);  else level.addFirst(v);
       NEVER reverse the queue -- that also reverses the children's enqueue
       order and corrupts every level below.
```

*In the DFS form of 199, `depth == out.size()` is the test for *first arrival at a new depth* — and visiting right before left is what makes the first arrival the rightmost node.*

**Recognition — reach for this when:**

- ✓ The answer is one value **per level** — the last, the largest, the average, the sum.
- ✓ Or the levels themselves need reshaping, as in zigzag.
- ✓ You can state whether you want `O(w)` BFS or `O(h)` DFS, and why.
- ✗ But **not** if the rule needs information from a *different* level. Cross-level dependencies are a recursion problem, not a level-order one.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★12 | **199. Binary Tree Right Side View** | Medium | D | "Last node of each level." Teaches that the accumulator can be a single value, and that the DFS solution (visit right first, record on first arrival at a new depth) is equally valid — write both. |
| ★13 | **103. Binary Tree Zigzag Level Order Traversal** | Medium | D | The direction flag belongs to the *output list*, not the queue. Reversing the queue is the standard wrong turn. |
| ○14 | 637. Average of Levels in Binary Tree | Easy | D | Pure rep. Watch the `long` accumulator. |
| ○15 | 515. Find Largest Value in Each Tree Row | Medium | D | Pure rep. |
| ○16 | 1161. Maximum Level Sum of a Binary Tree | Medium | D | Rep with a 1-indexed answer; the off-by-one is the only content. |

#### Why it works — the two forms of 199, and why zigzag must reverse the output

One derivative that is better as a DFS, and one that punishes the obvious implementation. Together they are the whole sub-variant.

1. **The skeleton does not change.** Sub-variant C's loop, with the snapshot, is still underneath. Only the accumulator differs.
2. **199 as a DFS.** Visit **right before left** and record a node whenever `depth == out.size()`. The first node reached at any new depth is therefore the rightmost one, and the space cost is `O(h)` rather than `O(w)`.
3. **Zigzag's tempting mistake.** Reversing the frontier looks like it produces alternating output, and it does — for one level.
4. **Why it then breaks.** Reversing the queue also reverses the order in which those nodes enqueue **their** children, so every level below inherits a scrambled ordering. The output is correct at level one and corrupt underneath.

> **The rule that keeps zigzag correct below level one:** the direction flag belongs to the **output** list, never to the queue. Reverse the output; leave the frontier alone.

**The 199 space trade-off is the gate.** BFS costs `O(w)` — up to `n/2` on a complete tree. The right-first DFS costs `O(h)`. Being able to write both and say which is which is what is being tested.

**`LinkedList` gives you `addFirst` for free**, which is why zigzag needs no explicit reversal pass — you simply choose which end to append to.

#### Walkthrough — zigzag on the five-node tree

The queue is drained left-to-right on **every** level. Only the side you append to changes.

```
        1
       / \
      2   3
     / \
    4   5
```

| # | Level drained (always L to R) | Direction | Appends | Level output |
|---|---|---|---|---|
| 1 | `1` | left to right | `addLast(1)` | `[1]` |
| 2 | `2, 3` | right to left | `addFirst(2)`, then `addFirst(3)` | `[3, 2]` |
| 3 | `4, 5` | left to right | `addLast(4)`, `addLast(5)` | `[4, 5]` |

Result `[[1], [3,2], [4,5]]`. The queue order never changed — nodes 2 and 3 still enqueued their children in the normal order, which is why level three comes out as `[4, 5]` and not reversed. Flip the queue instead and level three would have been corrupted by level two's reversal.

#### Key observations — what interviewers are listening for

- **Know both forms of 199 and their costs.** `O(w)` BFS versus `O(h)` right-first DFS. The gate asks for both, and the space comparison is the point of asking.
- **`depth == out.size()` is a neat first-arrival test.** It works because the output list is built strictly in depth order — worth recognising, since the same idiom reappears in other first-arrival problems.
- **Reverse the output, never the frontier.** One sentence that prevents the only real bug in this sub-variant.
- **Most derivatives are one line.** Largest per level, average per level, last per level — all the same skeleton. Recognising that keeps four problems from feeling like four problems.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Implementing zigzag by reversing the queue | level one is correct and everything below it is corrupt. | Reverse the **output** list. The frontier's order determines the next level's enqueue order. |
| Visiting left before right in the DFS form of 199 | you record the leftmost node at each depth — the left side view. | Right before left. That ordering is the entire trick. |
| Recording with `depth > out.size()` | off-by-one; depths get skipped or duplicated. | `depth == out.size()` is exactly *first arrival at a new depth*. |
| Using BFS reflexively when `O(h)` is available | `O(w)` space where `O(h)` would do — up to `n/2` versus `log n` on a balanced tree. | Ask which dimension you are paying for before choosing the traversal. |

#### Key takeaway

- **Trigger:** one value per level, or a per-level reshaping.
- **The rule:** sub-variant C's skeleton plus one accumulator.
- **199:** BFS last-of-level is `O(w)`; right-first DFS with `depth == out.size()` is `O(h)`.
- **Zigzag:** flip the **output**, never the queue.
- **Gate:** write 199 both ways and say which is `O(h)` and which is `O(w)`. See [§5.1](#51-traversal).


### E — Coordinate-indexed traversal

> **Intuition.** Give every node a **coordinate** and the problem stops being about tree shape. Width becomes an index subtraction; vertical order becomes a sort.

**Mental model.** *"The node's *position* is data. Once I attach a `(row, col)` pair or a heap index, the answer is arithmetic on coordinates rather than a walk over structure."*

Two problems, two different coordinate systems, and each has its own trap. **Heap indexing** (`left = 2i`, `right = 2i+1`) turns width into a difference. **`(row, col)` labelling** turns vertical order into a sort — and traversal order stops being output order entirely.

Both traps are about the coordinate rather than the traversal, which is what makes this a sub-variant of its own rather than a footnote under BFS.

```
   662 WIDTH -- heap indexing:  left = 2i,  right = 2i + 1

       width of a level  =  lastIndex - firstIndex + 1
       -- an index DIFFERENCE, so the MISSING nodes between the ends still count

       normalise:  subtract each level's first index before recursing
       carry as long: a deep alternating tree blows past int

   987 VERTICAL ORDER -- traversal order is NOT output order

       sort key = (col, row, val)
                              ^^^ the third key is the trap:
                                  no traversal produces it for you
```

*Width counts gaps, so a level holding two nodes at indices 0 and 3 has width 4, not 2. That is the whole of LC 662.*

**Recognition — reach for this when:**

- ✓ The answer depends on **where** a node sits, not just on its subtree.
- ✓ Words like *width*, *vertical*, *column*, *diagonal*, or a position in a complete tree.
- ✓ Gaps matter — absent nodes still occupy space in the answer.
- ✗ But **not** when position is incidental. If only structure matters, coordinates are extra bookkeeping for nothing.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★17 | **662. Maximum Width of Binary Tree** | Medium | E | Heap indexing: `left = 2i`, `right = 2i + 1`. Width is an index *difference*, not a node count. Normalize each level against its first index or the indices overflow `long` on a 3000-deep skew. |
| ⚠18 | **987. Vertical Order Traversal of a Binary Tree** | Hard | E | The trap: traversal order is **not** output order. Nodes at the same `(row, col)` must be sorted by *value*, which no BFS or DFS gives you for free. Collect `(col, row, val)` triples, then sort. |
| ○19 | 314. Binary Tree Vertical Order Traversal 🔒 | Medium | E | The easy version of #18 — no value tie-break. Free substitute: solve **987** and drop the third sort key. |

#### Why it works — two coordinate systems, two traps

Each problem here is easy once the coordinate is chosen and quietly wrong if the trap is missed.

1. **Heap indexing.** Assign the root index 0, then `left = 2i` and `right = 2i + 1`. This is the same numbering an array-backed heap uses, and it encodes horizontal position exactly.
2. **Width is a difference, not a count.** Under that numbering the width of a level is `last - first + 1`. Counting nodes instead undercounts every sparse level, because the gaps between the ends are part of the width.
3. **Normalisation is mandatory.** Raw indices double each level, so a deep alternating tree overflows — first `int`, then even `long`. Subtract the level's first index as you go, and carry the index as `long`.
4. **LC 987's third sort key.** Sorting by `(col, row)` alone leaves ties among nodes at the *same* position, and no traversal resolves them for you. The tiebreak is the node's **value**, and it has to be added explicitly.

> **One trap per problem:** width is an index **difference**, so normalise against each level's first index and carry indices as `long`. And in LC 987 the third sort key is the node's **value** — nothing gives it to you for free.

**Traversal order is not output order in LC 987.** You collect `(col, row, val)` triples during any traversal you like, then sort. Trying to emit in the right order during the walk is the hard way to do it and usually wrong.

**Normalisation also keeps the numbers readable while debugging**, which matters more than it sounds when you are hand-tracing a deep tree.

#### Walkthrough — LC 662 width, with per-level normalisation

A deliberately sparse tree. Watch level three: two nodes, width four.

```
        1                index 0
       / \
      2   3              indices 0, 1   (after normalising)
     /     \
    4       5            indices 0, 3   <- two nodes, width 4
```

| # | Level | Raw indices | Normalised | first .. last | Width |
|---|---|---|---|---|---|
| 1 | `1` | `0` | `0` | 0 .. 0 | **1** |
| 2 | `2, 3` | `0, 1` | `0, 1` | 0 .. 1 | **2** |
| 3 | `4, 5` | `0, 3` | `0, 3` | 0 .. 3 | **4** |

Answer 4. Level three holds only two nodes, but they sit at normalised indices 0 and 3 — the two absent positions between them are genuinely part of the width. Count nodes instead of subtracting indices and you report 2, which is the single most common wrong answer to this problem.

#### Key observations — what interviewers are listening for

- **Choose the coordinate first, then the traversal.** BFS or DFS both work once every node carries an index. Deciding the numbering is the real modelling step.
- **Say why normalisation is needed, not just that it is.** Indices double per level, so depth 60 overflows `long`. Subtracting the level's first index keeps them small permanently.
- **The third sort key is a genuine interview trap.** The gate names it specifically. Two nodes can share a column *and* a row, and only the value separates them.
- **Gaps are data.** *Width counts the empty positions between the ends* is the sentence that makes LC 662 obvious and its absence that makes it confusing.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Counting nodes per level as the width | undercounts every sparse level. | Width is `lastIndex - firstIndex + 1` under heap indexing. |
| Heap indices without per-level normalisation | overflow, then negative widths as the numbers wrap. | Subtract the level's first index; carry indices as `long`. |
| Sorting LC 987 by `(col, row)` only | wrong order among nodes sharing a position. | The third sort key is the node's **value**. No traversal supplies it. |
| Trying to emit vertical order during the walk | a complicated traversal that is still in the wrong order. | Collect triples, then sort. Traversal order is not output order. |

#### Key takeaway

- **Trigger:** the answer depends on a node's position — width, column, diagonal.
- **Heap indexing:** `left = 2i`, `right = 2i+1`; width is `last - first + 1`.
- **Two safeguards:** normalise per level, and carry indices as `long`.
- **LC 987:** collect `(col, row, val)` and sort — the **value** is the third key.
- **Gate:** state the heap-index rule, why normalisation is required, and the third sort key. See [§5.1](#51-traversal).


### F — Tree as a graph

> **Intuition.** The moment a question asks about distance in **any** direction, the tree stops being a tree. Add a parent map and it becomes an undirected graph — and top-down DFS cannot answer the question at all.

**Mental model.** *"I can only walk downward, but the answer is `k` steps away in *any* direction. So I need to be able to walk up too — and the instant I can, the structure has cycles."*

This is the sub-variant most people never learn, and it is the most transferable one in the pattern. The recognition is a single sentence and it changes the entire approach.

Three steps, and the third is the one people forget: build the parent map, BFS through **three** neighbours, and carry a `visited` set.

```
   a tree walked downward only:      a tree with parent links:

          (root)                            (root)
            |                                 |  ^
            v                                 v  |
          (node)                            (node)      <- a 2-CYCLE

   THREE STEPS
     1. one DFS to record every node's parent      -- BEFORE the BFS starts
     2. BFS outward through THREE neighbours:  left, right, parent
     3. a visited set -- the graph now has 2-cycles, so BFS without it never terminates

   at depth k, the WHOLE FRONTIER is the answer
```

*Parent links make every edge bidirectional, so a node and its parent form a two-node cycle. That is why `visited` is mandatory rather than an optimisation.*

**Recognition — reach for this when:**

- ✓ **Distance** in a tree, measured in any direction — up, down, or across.
- ✓ The question is anchored at an arbitrary node rather than at the root.
- ✓ Words like *k away*, *nearest*, *infection spreads*, *time to reach*.
- ✗ But **not** for anything answerable by a downward pass. Building a parent map for a subtree question is pure overhead.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ⚠20 | **863. All Nodes Distance K in Binary Tree** | Medium | F | The highest-value problem in Pattern 1. No top-down DFS can answer it: distance runs *upward* too. Build a parent map, then BFS from the target with a `visited` set. The moment a tree question mentions distance in any direction, it is a graph question. |
| ★21 | **2385. Amount of Time for Binary Tree to Be Infected** | Medium | F | Identical machine, different question — the answer is the number of BFS rounds. This is the transfer rep; if #20 was memorized rather than understood, this exposes it. |
| ○22 | 742. Closest Leaf in a Binary Tree 🔒 | Medium | F | Same parent-map BFS with a leaf predicate. Free substitute: **863**. |

#### Why it works — why downward DFS cannot answer it, and why visited is mandatory

Two claims. The first tells you to change tools; the second stops the new tool from hanging.

1. **Downward-only recursion cannot reach the answer.** From the target node, a node `k` steps away may be a sibling, an ancestor, or in a completely different branch. A top-down DFS has no route to any of them — it is not a matter of being slow, it is a matter of being unable.
2. **A parent map makes the structure undirected.** Record every node's parent once, and each node now has up to three neighbours: `left`, `right`, `parent`. Distance in the tree becomes ordinary graph distance.
3. **Which means cycles.** An undirected edge between a node and its parent is traversable both ways — a 2-cycle. BFS on a cyclic graph without a `visited` set bounces between them forever.
4. **Build the map before you start.** Populating it lazily during the BFS misses ancestors above the target, because you only discover parents for nodes you have already reached from above.

> **Say this before writing code — the gate calls it the most transferable in the pattern:** **parent map + BFS + visited.** The visited set is mandatory, not an optimisation: parent links create 2-cycles, so BFS without it never terminates.

**At depth `k`, the entire frontier is the answer.** You do not filter — BFS has already grouped the nodes by distance, so the whole queue at that moment is the result.

**`seen.add(nb)` doubles as the enqueue condition.** Java's `Set.add` returns `false` if the element was already present, so one call both tests and marks — which is why the loop body stays a single line.

#### Walkthrough — LC 863 — all nodes distance 2 from node 5

Target is node 5, `k = 2`. Watch the frontier move **upward** at step 1 — which is precisely what a downward DFS could never do.

```
        3
       / \
      5   1
     / \
    6   2

   parent map:  5->3,  1->3,  6->5,  2->5     target = 5,  k = 2
```

| # | Depth | Frontier | Neighbours explored | Seen |
|---|---|---|---|---|
| 1 | 0 | `5` | left 6, right 2, **parent 3** | `5, 6, 2, 3` |
| 2 | 1 | `6, 2, 3` | 6 and 2 are leaves; 3's neighbours are 5 (seen) and **1** | `+ 1` |
| 3 | 2 | `1` | depth `k` reached — stop | -- |

Answer `[1]`. Node 1 is two steps away only by going **up** from 5 to 3 and then down — there is no downward path from 5 to 1 at all. Notice also step 2: node 3's neighbour list includes 5, which is already seen; without the `visited` set the search would walk straight back down and oscillate forever.

#### Key observations — what interviewers are listening for

- **The recognition is the skill, not the code.** *Distance in any direction means parent map plus BFS plus visited.* Saying that before writing anything is exactly what the gate tests.
- **Name why `visited` is mandatory.** Not *for efficiency* — for **termination**. Parent links create 2-cycles and the BFS would never stop.
- **Build the parent map eagerly.** One complete DFS first. Lazy population is a subtle bug that only shows up on targets deep in the tree.
- **The frontier is the answer.** BFS groups by distance for free, so no filtering pass is needed at depth `k`.
- **This generalises past trees.** Once you see *a tree is a graph with extra promises*, problems about infection spread, nearest leaf and time-to-reach all become the same BFS.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Graph BFS on a tree without `visited` | infinite loop between a node and its parent. | Parent links create 2-cycles. Use `seen.add(nb)` as the enqueue condition. |
| Building the parent map lazily during the BFS | missing ancestors above the target. | The parent map must be **complete** before the BFS starts. |
| Trying to solve it with a downward DFS | you can reach descendants and nothing else. | The question is undirected. Change the structure, not the traversal. |
| Filtering the frontier at depth `k` | unnecessary work, and a chance to filter wrongly. | Everything in the queue at depth `k` is exactly `k` away. Return the lot. |

#### Key takeaway

- **Trigger:** distance in a tree, in any direction, anchored anywhere.
- **Three steps:** complete parent map → BFS through left, right, **parent** → `visited` set.
- **Why visited:** for **termination** — parent links create 2-cycles.
- **Read-off:** at depth `k` the whole frontier is the answer.
- **Gate:** say *parent map + BFS + visited* before coding, and explain why the visited set is mandatory. See [§5.1](#51-traversal).


### G — Morris traversal

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★23 | **94. Binary Tree Inorder Traversal** *(Morris, O(1) space)* | Easy | G | Exists for one interview sentence: "now do it in constant space." Thread the inorder predecessor's right pointer to the current node, then **undo the thread** on the second visit. The undo is the whole problem. |

### H — N-ary and generalized children

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★24 | **429. N-ary Tree Level Order Traversal** | Medium | H | BFS where the frontier expansion is a loop, not two lines. Confirms that C generalizes without change. |
| ★25 | **559. Maximum Depth of N-ary Tree** | Easy | H | Aggregation over a child list: the identity element for `max` over zero children is `0`, and getting that wrong is the only bug available. |
| ○26 | 590. N-ary Tree Postorder Traversal | Easy | H | Redundant after #24 and #3. |

---

### Extra Reps — Traversal (only if a gate fails)

| Problem | Targets |
|---|---|
| 993. Cousins in Binary Tree | Depth *and* parent recorded in one pass. |
| 1302. Deepest Leaves Sum | Level accumulator with a reset. |
| 623. Add One Row to Tree | Level-order with structural insertion mid-traversal. |
| 1609. Even Odd Tree | Per-level monotonicity + parity, four failure conditions in one loop. |
| 671. Second Minimum Node In a Binary Tree | Pruned DFS — stop descending when the invariant says you cannot improve. |
| 366. Find Leaves of Binary Tree 🔒 | Height-indexed bucketing. Free substitute: 1302 plus a height computation. |

---

## 1.3 Templates

### A — Recursive DFS, all three orders

> **Intuition.** One skeleton, one line moved. **Where you put the visit relative to the two recursive calls is the traversal order** — there is no third idea here.

**Mental model.** *"`dfs(node)` is a promise: I will completely visit this subtree and touch nothing outside it. And the call stack, without my doing anything, *is* the path from the root to where I am."*

Traversal is not one technique. It is a family united by a single idea — **impose a total order on the nodes, then visit each one exactly once** — and the sub-variants differ in what imposes the order and what state rides along.

Of the three orders, **postorder is load-bearing** for everything that follows. It is the only one where both recursive calls have already returned by the time the parent's visit runs, which is exactly what computing a subtree aggregate requires.

```
   void dfs(node):
       if (node == null) return          <- guard the CALLEE, once, at the top

       // visit here   ->  PREORDER    before both children
       dfs(node.left)
       // visit here   ->  INORDER     between the two children
       dfs(node.right)
       // visit here   ->  POSTORDER   after both children

   only in POSTORDER have both recursive calls RETURNED
       -> only postorder can compute an aggregate over the subtree
```

*`null` is a legal subtree — the empty one. Guarding the callee means exactly one null check exists; guarding the caller doubles the branching and hides bugs as the function grows.*

**Recognition — reach for this when:**

- ✓ You need to visit every node once, and `O(h)` stack space is acceptable.
- ✓ The work at a node depends on its **subtree** (postorder) or on the path down to it (preorder).
- ✓ You want the root-path for free — the call stack already is it.
- ✗ But **not** when the answer is level-by-level. That needs a queue, which is sub-variant **C**.
- ✗ And **not** under an `O(1)` space constraint — that is Morris, sub-variant **G**.


```java
// INVARIANT: dfs(node) completely visits the subtree rooted at node and touches nothing
//            outside it. The call stack IS the path root → node.
// BASE CASE: null is a legal subtree — the empty one. Guard the CALLEE, never the caller:
//            "if (node.left != null) dfs(node.left)" doubles the branching and hides bugs.
void dfs(TreeNode node, List<Integer> out) {
    if (node == null) return;
    // out.add(node.val);        // PREORDER  — before both children
    dfs(node.left, out);
    out.add(node.val);           // INORDER   — between the two children
    dfs(node.right, out);
    // out.add(node.val);        // POSTORDER — after both children
}
```


#### Why it works — the invariant, and why postorder is the special one

Four lines that the whole of Pattern 2 rests on. The last one is the reason this sub-variant comes first.

1. **The invariant.** `dfs(node)` completely visits the subtree rooted at `node` and touches nothing outside it. That containment is what lets you reason about one node at a time.
2. **The stack is the path.** The chain of active calls is exactly root → node. Any problem about the path from the root needs no extra data structure — it is already on the stack.
3. **The base case.** `null` is the **empty subtree**, a perfectly legal input. So the guard belongs at the top of the callee: one check, one place.
4. **Why postorder computes aggregates.** At the moment a postorder visit runs, both `dfs` calls have **returned**, so both subtree answers already exist. In pre- and inorder at least one child is still unknown when the parent acts — so no aggregate is available to combine.

> **Three orders, one skeleton, one moved line:** if you cannot state *why* postorder is the only order that can compute a subtree aggregate, stop here — the whole of Pattern 2 depends on it.

**Recursive DFS tolerates a null root; BFS never does.** The `if (node == null) return;` guard absorbs the empty tree for free, whereas a queue template dereferences `root` immediately and needs an explicit guard. Worth knowing as an asymmetry rather than memorising per template.

**Space is `O(h)`, which is `O(n)` on a degenerate tree.** A linked-list-shaped tree will overflow the stack, and that is the honest answer when asked about the worst case.

#### Walkthrough — all three orders from one skeleton

The same five-node tree, traced once. Each row is a moment during the single walk; the three columns show which order would emit at that moment.

```
        1
       / \
      2   3
     / \
    4   5
```

| # | Moment | Preorder | Inorder | Postorder |
|---|---|---|---|---|
| 1 | enter 1 | **1** |  |  |
| 2 | enter 2 | **2** |  |  |
| 3 | enter and leave 4 (a leaf) | **4** | **4** | **4** |
| 4 | back at 2, left child done |  | **2** |  |
| 5 | enter and leave 5 (a leaf) | **5** | **5** | **5** |
| 6 | leave 2 — both children done |  |  | **2** |
| 7 | back at 1, left subtree done |  | **1** |  |
| 8 | enter and leave 3, then leave 1 | **3** | **3** | **3**, then **1** |

Preorder `1 2 4 5 3`, inorder `4 2 5 1 3`, postorder `4 5 2 3 1`. Row 6 is the one to look at: node 2 is emitted in postorder only *after* both 4 and 5 are finished — which is precisely why a postorder visit can combine their answers and a preorder visit cannot.

#### Key observations — what interviewers are listening for

- **Say the postorder sentence before you are asked.** *Both recursive calls have returned, so both subtree answers exist.* That single line is the A gate, and it is the foundation of every problem in Pattern 2.
- **Guard the callee, always.** One `if (node == null) return;` at the top. Guarding at the call site doubles the branching, and the duplicated logic is where base-case bugs hide once the function grows.
- **The call stack is free state.** Root-path problems need no auxiliary structure in recursive DFS. Recognising that is what makes sub-variants E and F of Pattern 2 feel natural later.
- **Name the space honestly.** `O(h)`, degrading to `O(n)` on a degenerate tree. Saying `O(log n)` without the caveat assumes balance you were never promised.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Guarding the caller: `if (n.left != null) dfs(n.left)` | duplicated null logic, and missed base cases as the function grows. | Guard the **callee**: one `if (node == null) return;` at the top, always. |
| Trying to compute a subtree aggregate in preorder | the parent acts before its children are known, so the aggregate is wrong or incomplete. | Aggregates are postorder. If the parent needs the children's answers, the visit goes after both calls. |
| Assuming `O(log n)` stack space | stack overflow on a degenerate, list-shaped tree. | Space is `O(h)`. Only a balanced tree makes that `O(log n)`. |
| Rewriting the skeleton per order | three near-identical functions and three chances to introduce a bug. | One skeleton, one moved line. The orders differ by placement, nothing else. |

#### Key takeaway

- **Trigger:** visit every node once; work depends on the subtree or the root-path.
- **The skeleton:** guard the callee, recurse left, recurse right — and place the visit to pick the order.
- **Postorder is special:** both calls have returned, so both subtree answers exist.
- **Cost:** `O(n)` time, `O(h)` space — `O(n)` on a degenerate tree.
- **Gate:** all three orders from one skeleton, plus the one-sentence reason postorder owns aggregates. See [§5.1](#51-traversal).


### B — Iterative DFS with an explicit stack

```java
// INORDER, iterative.
// INVARIANT: the stack holds exactly those ancestors of `cur` whose left subtree is finished
//            and whose own value has not yet been emitted.
List<Integer> inorder(TreeNode root) {
    List<Integer> out = new ArrayList<>();
    Deque<TreeNode> st = new ArrayDeque<>();
    TreeNode cur = root;
    while (cur != null || !st.isEmpty()) {
        while (cur != null) { st.push(cur); cur = cur.left; }  // descend left, pushing
        cur = st.pop();
        out.add(cur.val);                                      // its left subtree is done
        cur = cur.right;                                       // now we owe the right subtree
    }
    return out;
}
```

```java
// POSTORDER, iterative — by reversed preorder.
// Root-Right-Left, emitted front-first, is Left-Right-Root.
// CAVEAT: this yields the correct LIST, not the correct visit MOMENTS. If you must act on a
//         node strictly after both children (freeing, folding), use the lastVisited form.
List<Integer> postorder(TreeNode root) {
    LinkedList<Integer> out = new LinkedList<>();
    Deque<TreeNode> st = new ArrayDeque<>();
    if (root != null) st.push(root);
    while (!st.isEmpty()) {
        TreeNode n = st.pop();
        out.addFirst(n.val);                       // push-front == reverse, without a second pass
        if (n.left  != null) st.push(n.left);      // LEFT pushed first, so RIGHT pops first
        if (n.right != null) st.push(n.right);
    }
    return out;
}
```

```java
// 173. Binary Search Tree Iterator — a PAUSED inorder.
// The stack always holds the not-yet-returned ancestors, smallest on top.
// Amortized O(1) per next() (each node is pushed and popped exactly once), O(h) space.
class BSTIterator {
    private final Deque<TreeNode> st = new ArrayDeque<>();
    BSTIterator(TreeNode root) { pushLeft(root); }
    private void pushLeft(TreeNode n) { while (n != null) { st.push(n); n = n.left; } }
    public boolean hasNext() { return !st.isEmpty(); }
    public int next() { TreeNode n = st.pop(); pushLeft(n.right); return n.val; }
}
```

### C — BFS, level order

> **Intuition.** One line makes level order work: **snapshot `q.size()` before the inner loop**. Everything else in this sub-variant is that snapshot plus an accumulator.

**Mental model.** *"The queue holds exactly one frontier at a time. If I write down how big it is *before* I start draining, I know precisely where the level ends — even though I am appending the next level while I go."*

The subtlety is that the queue is being modified while you consume it. `q.size()` is a moving target, so reading it inside the loop condition merges every level into one flat list.

There is also a boundary asymmetry worth internalising: **recursive DFS tolerates a null root; BFS never does**, because the template dereferences `root` on the very first `q.add`.

```
   while (!q.isEmpty()):
       int sz = q.size();               <- SNAPSHOT, before the inner loop
       for (i = 0; i < sz; i++):        <- NOT  i < q.size()
           n = q.poll()
           ... accumulate into this level ...
           enqueue n.left, n.right      <- the queue GROWS while you drain it

   sz freezes the level boundary at the moment the level began.
```

*Read `q.size()` inside the condition and the loop keeps consuming the children it just added, so every level runs into the next one.*

**Recognition — reach for this when:**

- ✓ The answer is organised **by level** — per-level lists, averages, maxima, the last node.
- ✓ You want the **shallowest** answer and can stop early — BFS reaches it first.
- ✓ Width matters more than depth, and `O(w)` space is acceptable.
- ✗ But **not** when the work depends on a subtree aggregate. That is postorder recursion, sub-variant **A**.


```java
// THE ONE LINE: sz is snapshotted BEFORE the inner loop. Without it the queue grows while
//               you drain it and every level boundary is lost.
// BOUNDARY: BFS templates need an explicit null-root guard; recursive DFS templates do not.
List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> out = new ArrayList<>();
    if (root == null) return out;
    Deque<TreeNode> q = new ArrayDeque<>();
    q.add(root);
    while (!q.isEmpty()) {
        int sz = q.size();
        List<Integer> level = new ArrayList<>(sz);
        for (int i = 0; i < sz; i++) {
            TreeNode n = q.poll();
            level.add(n.val);
            if (n.left  != null) q.add(n.left);
            if (n.right != null) q.add(n.right);
        }
        out.add(level);
    }
    return out;
}
```

```java
// 111. Minimum depth — the recursion everyone writes first is WRONG:
//         return 1 + Math.min(depth(left), depth(right));
//      A node with one child returns 1, because the ABSENT child returns 0 and wins the min.
//      A leaf is "no children", not "one null child".
int minDepth(TreeNode root) {
    if (root == null) return 0;
    if (root.left  == null) return 1 + minDepth(root.right);   // one real child: no min at all
    if (root.right == null) return 1 + minDepth(root.left);
    return 1 + Math.min(minDepth(root.left), minDepth(root.right));
}

// BFS is strictly better here: it returns at the FIRST leaf instead of exploring everything.
int minDepthBfs(TreeNode root) {
    if (root == null) return 0;
    Deque<TreeNode> q = new ArrayDeque<>();
    q.add(root);
    int depth = 1;
    while (!q.isEmpty()) {
        for (int i = q.size(); i > 0; i--) {
            TreeNode n = q.poll();
            if (n.left == null && n.right == null) return depth;   // first leaf wins
            if (n.left  != null) q.add(n.left);
            if (n.right != null) q.add(n.right);
        }
        depth++;
    }
    return depth;
}
```

#### Why it works — the size snapshot, and the one-child trap

The skeleton is four lines and one of them carries the whole idea. The second half of this section is the classic wrong recursion that BFS fixes outright.

1. **The queue holds one frontier.** At the top of the outer loop, everything in the queue is at the same depth. That is the property being maintained.
2. **Draining while enqueueing breaks it.** Each `poll` removes a node of the current level and each `add` appends a node of the *next* one, so `q.size()` changes meaning mid-loop.
3. **The snapshot freezes the boundary.** `int sz = q.size();` captures the level's width before any of it is consumed, so the inner loop runs exactly over this level and stops.
4. **The null-root guard.** BFS dereferences `root` immediately by enqueuing it. Recursive DFS absorbs a null root in its base case; BFS must check explicitly.

> **The one line:** `int sz = q.size();` taken **before** the inner loop, never inside its condition. Without it the queue grows while you drain it and every level boundary is lost.

**LC 111 is the trap that makes this sub-variant matter.** The recursion everyone writes first — `return 1 + Math.min(depth(left), depth(right));` — is **wrong on every one-child node**, because the absent child returns 0 and wins the min. A leaf is *no children*, not *one null child*, so the one-child case has to be handled explicitly.

**BFS is strictly better for minimum depth.** It returns at the **first leaf** it meets instead of exploring the entire tree, and it makes the one-child trap impossible to write.

#### Walkthrough — level order, watching the snapshot

The `sz` column is the whole lesson: it is read once per level, and the queue is longer than `sz` by the time the inner loop ends.

```
        1
       / \
      2   3
     / \
    4   5
```

| # | Queue at level start | sz | Drained | Enqueued during | Level output |
|---|---|---|---|---|---|
| 1 | `1` | **1** | 1 | 2, 3 | `[1]` |
| 2 | `2, 3` | **2** | 2, 3 | 4, 5 | `[2, 3]` |
| 3 | `4, 5` | **2** | 4, 5 | nothing | `[4, 5]` |

Result `[[1], [2,3], [4,5]]`. Look at row 2: `sz` was 2, but by the time the inner loop finished the queue held 2 more nodes. Had the condition read `i < q.size()`, the loop would have kept going straight into level three and produced `[[1], [2,3,4,5]]`.

#### Key observations — what interviewers are listening for

- **The snapshot is the sub-variant.** Every level-order derivative in **D** is this skeleton plus an accumulator. Getting the snapshot reflexive pays for eight problems.
- **Know the null-root asymmetry.** DFS templates tolerate it, BFS templates do not. It is a one-line fix and a guaranteed null-pointer exception if you forget it.
- **For shallowest-anything, BFS beats recursion on merit.** Not just stylistically — it terminates at the first hit rather than exploring the whole tree, and it sidesteps the one-child trap by construction.
- **Space is `O(w)`, not `O(h)`.** The widest level dominates. On a complete tree that is `n/2`, which is worth saying when comparing against DFS's `O(h)`.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| BFS without the `q.size()` snapshot | levels merge into one flat list. | Take `int sz = q.size();` **before** the inner loop, never inside its condition. |
| `1 + min(left, right)` for minimum depth | wrong on every one-child node — the absent child returns 0 and wins the min. | A leaf is *both children null*. Handle the one-child case explicitly, or use BFS and avoid it. |
| Missing the null-root guard | `NullPointerException` on the first `q.add(root)` dereference. | Recursive DFS tolerates a null root; BFS never does. Guard explicitly. |
| Using `Deque` as a queue with `push` | silent DFS instead of BFS — the output looks plausible and is wrong. | `add`/`poll` for FIFO. `push`/`pop` is LIFO and belongs in sub-variant B. |

#### Key takeaway

- **Trigger:** the answer is per-level, or you want the shallowest result and can stop early.
- **The one line:** `int sz = q.size();` **before** the inner loop.
- **Guard:** BFS needs an explicit null-root check; recursive DFS does not.
- **LC 111:** `1 + min(...)` is wrong on one-child nodes; BFS returns at the first leaf.
- **Gate:** the skeleton blind with the snapshot and the guard, plus why LC 111 breaks the naive recursion. See [§5.1](#51-traversal).


### D — Level-order derivatives

```java
// 199. Right side view, DFS form: visit RIGHT first, record the first node seen at each depth.
// O(h) space instead of BFS's O(w), and two lines shorter. Know both.
void rightView(TreeNode n, int depth, List<Integer> out) {
    if (n == null) return;
    if (depth == out.size()) out.add(n.val);   // first arrival at a new depth
    rightView(n.right, depth + 1, out);        // RIGHT before LEFT — that is the whole trick
    rightView(n.left,  depth + 1, out);
}
```

```java
// 103. Zigzag. The direction flag belongs to the OUTPUT list, never to the queue:
//      reversing the queue also reverses the children's enqueue order and corrupts
//      every level below it.
List<List<Integer>> zigzag(TreeNode root) {
    List<List<Integer>> out = new ArrayList<>();
    if (root == null) return out;
    Deque<TreeNode> q = new ArrayDeque<>();
    q.add(root);
    boolean l2r = true;
    while (!q.isEmpty()) {
        int sz = q.size();
        LinkedList<Integer> level = new LinkedList<>();
        for (int i = 0; i < sz; i++) {
            TreeNode n = q.poll();
            if (l2r) level.addLast(n.val); else level.addFirst(n.val);
            if (n.left  != null) q.add(n.left);
            if (n.right != null) q.add(n.right);
        }
        out.add(level);
        l2r = !l2r;
    }
    return out;
}
```

### E — Coordinate-indexed traversal

```java
// 662. Width. Heap indexing: left = 2i, right = 2i + 1. Width is an index DIFFERENCE,
//      not a node count — the missing nodes between the ends are part of the width.
// NORMALIZE against each level's first index, and carry the index as a long: a deep
//      alternating tree makes raw indices exceed any fixed width.
int widthOfBinaryTree(TreeNode root) {
    if (root == null) return 0;
    int best = 0;
    Deque<TreeNode> qn = new ArrayDeque<>();
    Deque<Long> qi = new ArrayDeque<>();
    qn.add(root); qi.add(0L);
    while (!qn.isEmpty()) {
        int sz = qn.size();
        long first = qi.peek(), last = 0;
        for (int k = 0; k < sz; k++) {
            TreeNode n = qn.poll();
            long i = qi.poll() - first;                 // renumber this level from 0
            last = i;
            if (n.left  != null) { qn.add(n.left);  qi.add(2 * i); }
            if (n.right != null) { qn.add(n.right); qi.add(2 * i + 1); }
        }
        best = Math.max(best, (int) (last + 1));
    }
    return best;
}
```

```java
// 987. Vertical order. Traversal order is NOT output order.
// Sort key: (col, row, val). The third component is the trap — no traversal produces it.
List<List<Integer>> verticalTraversal(TreeNode root) {
    List<int[]> nodes = new ArrayList<>();
    collect(root, 0, 0, nodes);
    nodes.sort((a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0])
                       : a[1] != b[1] ? Integer.compare(a[1], b[1])
                                      : Integer.compare(a[2], b[2]));
    List<List<Integer>> out = new ArrayList<>();
    for (int k = 0; k < nodes.size(); k++) {
        if (k == 0 || nodes.get(k)[0] != nodes.get(k - 1)[0]) out.add(new ArrayList<>());
        out.get(out.size() - 1).add(nodes.get(k)[2]);
    }
    return out;
}

void collect(TreeNode n, int row, int col, List<int[]> acc) {
    if (n == null) return;
    acc.add(new int[]{col, row, n.val});
    collect(n.left,  row + 1, col - 1, acc);
    collect(n.right, row + 1, col + 1, acc);
}
```

### F — Tree as a graph

```java
// 863. Three steps, and the third is the one people forget.
//   1. one DFS to record every node's parent
//   2. BFS outward from the target through THREE neighbours: left, right, parent
//   3. a visited set — the graph now contains 2-cycles, so BFS without it never terminates
List<Integer> distanceK(TreeNode root, TreeNode target, int k) {
    Map<TreeNode, TreeNode> par = new HashMap<>();
    link(root, null, par);
    Deque<TreeNode> q = new ArrayDeque<>();
    Set<TreeNode> seen = new HashSet<>();
    q.add(target); seen.add(target);
    for (int d = 0; !q.isEmpty(); d++) {
        if (d == k) {                                    // the whole frontier is the answer
            List<Integer> out = new ArrayList<>();
            for (TreeNode n : q) out.add(n.val);
            return out;
        }
        for (int i = q.size(); i > 0; i--) {
            TreeNode n = q.poll();
            for (TreeNode nb : new TreeNode[]{n.left, n.right, par.get(n)})
                if (nb != null && seen.add(nb)) q.add(nb);
        }
    }
    return List.of();
}

void link(TreeNode n, TreeNode p, Map<TreeNode, TreeNode> par) {
    if (n == null) return;
    par.put(n, p);
    link(n.left, n, par);
    link(n.right, n, par);
}
```

### G — Morris traversal, O(1) space

> **Intuition.** Borrow the tree's own null pointers as breadcrumbs. Thread a subtree's rightmost node back to its ancestor so you can climb without a stack — then **destroy the thread** before you leave.

**Mental model.** *"I have no stack, so the tree itself has to remember where I should return to. The predecessor's right pointer is null and therefore free — I will borrow it, and I will put it back."*

This sub-variant exists for exactly one interview sentence: *can you do it in `O(1)` space?* Knowing it is the difference between answering that question and conceding it.

The predecessor is the **rightmost node of the left subtree**, and `pred.right == cur` is the marker meaning *I have been here before — this is the second visit*.

```
   FIRST visit to cur (pred.right == null):
       pred.right = cur        <- create the thread, a breadcrumb back up
       cur = cur.left          <- descend

   SECOND visit (pred.right == cur):
       pred.right = null       <- UNDO the thread, restoring the tree
       emit cur
       cur = cur.right         <- climb onward

   loop condition needs BOTH terms:
       while (pred.right != null && pred.right != cur)
                                 ^ without this, the second visit loops forever
```

*Every thread is destroyed before its node is emitted, so the tree is bit-identical when the loop exits. An interviewer will ask you to prove exactly that.*

**Recognition — reach for this when:**

- ✓ The problem explicitly demands **`O(1)` extra space**.
- ✓ You are allowed to mutate the tree temporarily, provided you restore it.
- ✓ An inorder walk is what you need — Morris is most natural there.
- ✗ But **not** when the tree must not be touched at all, even transiently. Concurrent readers make threading unsafe.


```java
// INVARIANT: every thread created is destroyed before its node is emitted, so the tree is
//            bit-identical when the loop exits. An interviewer WILL ask you to prove that.
// The predecessor is the rightmost node of the left subtree; "pred.right == cur" is the
// marker that says "I have been here before — this is the second visit".
List<Integer> morrisInorder(TreeNode root) {
    List<Integer> out = new ArrayList<>();
    TreeNode cur = root;
    while (cur != null) {
        if (cur.left == null) { out.add(cur.val); cur = cur.right; continue; }
        TreeNode pred = cur.left;
        while (pred.right != null && pred.right != cur) pred = pred.right;
        if (pred.right == null) { pred.right = cur;  cur = cur.left;  }   // 1st visit: thread
        else                    { pred.right = null; out.add(cur.val); cur = cur.right; } // undo
    }
    return out;
}
```


#### Why it works — the threading invariant and its proof obligation

Morris is short and every line is load-bearing. The proof that the tree survives is the part you will actually be asked for.

1. **No stack means the tree must remember.** Recursion and an explicit stack both store the return path outside the tree. With `O(1)` space neither is available, so the path has to live *in* the structure.
2. **The predecessor has a free pointer.** The rightmost node of `cur`'s left subtree is the node visited immediately before `cur` in inorder, and its `right` is null by definition of being rightmost. That null is the slot to borrow.
3. **First visit: thread and descend.** `pred.right = cur` records where to return, then go left. You will come back up through that thread automatically.
4. **Second visit: undo, emit, continue.** Arriving with `pred.right == cur` proves the left subtree is finished. Set `pred.right = null` **first**, restoring the tree, then emit `cur` and move right.

> **The invariant an interviewer will ask you to prove:** every thread created is destroyed before its node is emitted, so the tree is bit-identical when the loop exits.

**Total work is still `O(n)`: each edge is walked at most twice, once to build a thread and once to find it again.** Say *amortized `O(n)`, constant space* and be ready to justify the factor of two.

**The loop condition needs both terms.** `pred.right != null` alone spins forever on the second visit, because the thread you created is exactly what makes `pred.right` non-null. The second term `pred.right != cur` is what recognises your own breadcrumb.

#### Walkthrough — Morris inorder on a three-node tree

`2` with children `1` and `3`. Two visits to the root: one to thread, one to undo and emit.

```
      2
     / \
    1   3        predecessor of 2 is 1 (rightmost of the left subtree)
```

| # | cur | pred | Test | Action | Emitted |
|---|---|---|---|---|---|
| 1 | 2 | 1 | `pred.right == null` | **thread**: `1.right = 2`; `cur = 1` | -- |
| 2 | 1 | -- | `cur.left == null` | emit 1; `cur = cur.right` → follows the thread back to 2 | 1 |
| 3 | 2 | 1 | `pred.right == cur` | **undo**: `1.right = null`; emit 2; `cur = 3` | 1, 2 |
| 4 | 3 | -- | `cur.left == null` | emit 3; `cur = null`, loop ends | 1, 2, 3 |

Inorder `1 2 3`, and the tree is back exactly as it started — `1.right` was set at step 1 and cleared at step 3, before node 2 was emitted. Step 2 is the pretty part: moving to `cur.right` from node 1 follows the borrowed thread and climbs back up without any stack at all.

#### Key observations — what interviewers are listening for

- **The undo is the answer, not the threading.** Anyone can create a thread. The gate is *prove the tree is unmodified at the end*, which is entirely about where the undo sits.
- **Justify the factor of two, do not hide it.** Each edge is walked at most twice — once building a thread, once finding it. *Amortized `O(n)`, constant space* is the precise claim.
- **Both terms of the loop condition earn their place.** One detects the end of the subtree, the other detects your own breadcrumb. Dropping either hangs the traversal.
- **Know when Morris is inappropriate.** It mutates the tree transiently. Under concurrent access, or when mutation is forbidden outright, it is the wrong answer even though it is the clever one.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Morris without removing the thread | the returned tree is corrupt, and a second traversal loops forever. | The `else` branch must set `pred.right = null` **before** emitting. |
| Loop condition with only `pred.right != null` | infinite loop on the second visit — your own thread satisfies the condition. | Both terms: `pred.right != null && pred.right != cur`. |
| Emitting before undoing | the invariant *thread destroyed before emit* breaks, and the proof you are asked for is false. | Undo, then emit, then move right — in that order. |
| Claiming plain `O(n)` without the caveat | an imprecise complexity claim on a question specifically about cost. | Each edge is walked up to twice; say *amortized*. |

#### Key takeaway

- **Trigger:** *can you do it in `O(1)` space?* — and mutation is permitted.
- **The mechanism:** thread the left subtree's rightmost node to `cur`, descend, then undo on return.
- **The marker:** `pred.right == cur` means second visit.
- **The invariant:** every thread is destroyed before its node is emitted — the tree survives intact.
- **Gate:** Morris inorder blind, including the undo, and a proof that the tree is unmodified. See [§5.1](#51-traversal).


### H — N-ary children

> **Intuition.** Swap `left`/`right` for a child list and **every one of A through D still works**. The only genuinely new decision is the identity element for your aggregate.

**Mental model.** *"The shape of the recursion does not change — only how I enumerate children. What does change is what I return when there are none."*

This sub-variant is short because the generalisation is nearly free. Two fields become a loop; everything else about the traversal is untouched.

The one place it bites is the base case. With two children you can write `max(left, right)` and never think about it; with a list you have to name the value that a **zero-child** fold returns.

```
   binary                              n-ary
   ------------------------------      ------------------------------
   dfs(node.left)                      for (Node c : node.children)
   dfs(node.right)                         dfs(c)

   IDENTITY ELEMENTS -- the answer for an EMPTY child list:
       max for depth   ->  0        NOT -infinity, and NOT 1
       sum             ->  0
       min             ->  +infinity
       count           ->  0
```

*`max(depth of no children) = 0`, so a leaf returns `0 + 1 = 1`. Choose `-infinity` and every leaf reports nonsense; choose 1 and every depth is one too large.*

**Recognition — reach for this when:**

- ✓ Nodes carry a **list** of children rather than two fields.
- ✓ You already know the binary form and need the same answer generalised.
- ✓ The aggregate is a fold — max, sum, min, count — over the children's results.
- ✗ But **not** when the problem depends on *left versus right* specifically. Ordering-sensitive logic does not survive the generalisation.


```java
// The identity element for max over ZERO children is 0, not -infinity and not 1.
// Get that wrong and every leaf reports the wrong depth.
int maxDepth(Node root) {
    if (root == null) return 0;
    int best = 0;
    for (Node c : root.children) best = Math.max(best, maxDepth(c));
    return best + 1;
}
```


#### Why it works — why the generalisation is free, and where it is not

Three steps of *nothing changes*, then the one step that does.

1. **The child list replaces the two fields.** `node.left` and `node.right` were only ever a fixed-size collection of children. A list is the same thing without the arity restriction.
2. **The loop replaces the two calls.** `for (Node c : node.children) dfs(c);` is exactly the two recursive calls, generalised. Pre- and postorder still mean *before the loop* and *after the loop*.
3. **BFS needs no change at all.** Enqueue every child instead of two. The size snapshot from sub-variant C is untouched, so level-order and its derivatives generalise for free.
4. **The identity element does change.** A fold over an empty list must return something, and that value is the base case. It is the only decision the binary form let you avoid making.

> **The only genuinely new decision:** the identity element for max over **zero** children is 0, not `-infinity` and not 1. Get that wrong and every leaf reports the wrong depth.

**Pick the identity by asking what the fold should return for nothing.** Sum of no numbers is 0; max of no depths is 0 because depth is non-negative; min of no values is `+infinity`. Stating it that way makes it a derivation rather than a memory test.

**Ordering-sensitive logic does not generalise.** Anything phrased as *left before right* — the DFS form of LC 199, inorder itself — has no meaning once children are an unordered list.

#### Walkthrough — n-ary max depth

Root with three children, one of which has two children of its own. The fold at each node is `max over children, then + 1`.

```
        1
      / | \
     2  3  4
       / \
      5   6
```

| # | Node | Children | max over children | Returns |
|---|---|---|---|---|
| 1 | 2 | none | **0**  (the identity) | `0 + 1` = **1** |
| 2 | 5 | none | **0** | **1** |
| 3 | 6 | none | **0** | **1** |
| 4 | 3 | 5, 6 | `max(1, 1)` = 1 | **2** |
| 5 | 4 | none | **0** | **1** |
| 6 | 1 | 2, 3, 4 | `max(1, 2, 1)` = 2 | **3** |

Depth 3. Rows 1, 2, 3 and 5 are all the identity doing its job: a leaf's loop never executes, `best` stays 0, and the node returns 1. Initialise `best` to `-infinity` instead and every one of those rows returns garbage that then poisons the fold above it.

#### Key observations — what interviewers are listening for

- **Derive the identity, do not recall it.** *What should this fold return for no children?* Sum: 0. Max of a non-negative quantity: 0. Min: `+infinity`. The gate asks you to state it.
- **The generalisation is genuinely free for A through D.** Saying so — and meaning it — is the point of this sub-variant. It is not a new technique, it is the same ones with the arity restriction lifted.
- **Watch for logic that assumed two children.** Anything that says *left* or *right* by name is not generalisable, and that is worth noticing before you start rather than after.
- **Null children still need guarding.** A child list can contain nulls depending on the problem's representation. The callee guard from sub-variant A still applies.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Initialising the fold to `-infinity` for a depth | every leaf returns nonsense, which propagates up the whole tree. | The identity for max over zero children is **0**. A leaf is depth 1. |
| Initialising to 1 | every depth comes out one too large. | The `+ 1` for the node itself happens once, at the return. The identity is the *children's* contribution, which is 0. |
| Generalising order-sensitive logic | left-versus-right reasoning has no meaning over a list. | Check whether the binary version depended on ordering before porting it. |
| Rewriting BFS for n-ary | wasted effort, and a fresh chance to drop the size snapshot. | Enqueue all children instead of two. Nothing else about sub-variant C changes. |

#### Key takeaway

- **Trigger:** a child list instead of `left`/`right`.
- **The change:** two recursive calls become one loop; BFS enqueues all children.
- **The one decision:** the identity element — what the fold returns for zero children.
- **Depth:** identity 0, so a leaf returns 1. Not `-infinity`, not 1.
- **Gate:** generalise any of A-D without re-deriving, and state the identity element for the aggregate. See [§5.1](#51-traversal).

---

## 1.4 Failure Modes — Traversal

| # | Bug | Symptom | Prevention |
|---|---|---|---|
| 1 | Guarding the caller (`if (n.left != null) dfs(n.left)`) | Duplicated null logic, missed base cases as the function grows | Guard the callee: one `if (node == null) return;` at the top, always. |
| 2 | BFS without the `q.size()` snapshot | Levels merge into one flat list | Take `int sz = q.size();` *before* the inner loop, never inside its condition. |
| 3 | `1 + min(left, right)` for minimum depth | Wrong on every one-child node | A leaf is "both children null". Handle the one-child case explicitly. |
| 4 | Zigzag implemented by reversing the queue | Correct level 1, corrupt everything below | Reverse the output list, never the frontier. |
| 5 | Counting nodes per level as "width" | Undercounts every sparse level | Width is `lastIndex - firstIndex + 1` under heap indexing. |
| 6 | Heap indices without per-level normalization | Overflow, then negative widths | Subtract the level's first index; carry indices as `long`. |
| 7 | Vertical order sorted only by `(col, row)` | Wrong order among equal positions | The third sort key is the node's value. Nothing gives it to you for free. |
| 8 | Graph BFS on a tree without `visited` | Infinite loop between a node and its parent | Parent links create 2-cycles. `seen.add(nb)` as the enqueue condition. |
| 9 | Building the parent map lazily during BFS | Missing ancestors above the target | The parent map must be complete *before* the BFS starts. |
| 10 | Morris without removing the thread | The returned tree is corrupt; a second traversal loops forever | The `else` branch must set `pred.right = null` before emitting. |
| 11 | Morris with `while (pred.right != null)` only | Infinite loop on the second visit | The loop condition needs both terms: `pred.right != null && pred.right != cur`. |
| 12 | Reverse-preorder postorder used for side effects | Node processed before its children are done | It produces the right list, not the right timing. Use recursion or the lastVisited form. |
| 13 | Missing null-root guard in a BFS template | NPE on the first `q.add(root)` dereference | Recursive DFS tolerates a null root; BFS never does. |
| 14 | `Deque` used as a queue with `push` | Silent DFS instead of BFS | `add`/`poll` for FIFO, `push`/`pop` for LIFO. Never mix them in one method. |

---
---

# PATTERN 2 — TREE RECURSION

## 2.1 Pattern Breakdown

Pattern 1 asks *"in what order do I touch the nodes?"* Pattern 2 asks a harder question: **"what does a subtree owe its parent?"**

Every problem here is solved by answering three questions, in this order, *before writing code*:

1. **What does `dfs(node)` return?** One number? A pair? A structure? Name the type.
2. **What is the value for `null`?** It must be the identity element of the combining operation — `0` for a sum, `0` for a height, `true` for an "all nodes satisfy", `Integer.MIN_VALUE` for an unclamped max.
3. **Is the answer the return value, or something recorded on the side?** If those differ, you are in sub-variant C and the two must never be confused.

| # | Sub-variant | What `dfs` returns | Direction | Answer lives in |
|---|---|---|---|---|
| **A** | **Bottom-up aggregate** | one value about the subtree | up | the return value |
| **B** | **Parallel recursion on two trees** | a boolean or a merged node | up | the return value |
| **C** | **Augmented return** | the value the *parent* needs | up | a field/array on the side |
| **D** | **Top-down inherited state** | nothing (or a count) | down | an accumulator, via parameters |
| **E** | **Root-to-leaf paths + backtracking** | nothing | down | a mutable path, undone on exit |
| **F** | **Prefix sums on the root path** | nothing | down | a map keyed by prefix, undone on exit |
| **G** | **LCA** | the node found, or `null` | up | the return value |
| **H** | **Construction from traversals** | the built subtree | up | the return value |
| **I** | **Serialization / structural identity** | a canonical string or hash | up | a map or a string |
| **J** | **In-place restructuring** | the new subtree root | up | the tree itself |
| **K** | **Tree DP with per-child states** | a small tuple, one entry per state | up | a combination of the root's states |
| **L** | **Rerooting (two-pass)** | pass 1 up, pass 2 down | both | an array indexed by node |

**Sub-variants worth stating explicitly:**
- **C** is where interviews are lost. In 543 and 124 the value you *record* (a path through the node) and the value you *return* (a path ending at the node, usable by the parent) are different quantities. People who return the recorded value get plausible-looking wrong answers.
- **E** and **F** look like DFS but are really backtracking: every mutation on the way down needs an exact inverse on the way up.
- **K** is dynamic programming that happens to run on a tree. The state is per node, the transition is over children, and the order is postorder because that is the only topological order available.
- **L** is the only sub-variant where a single DFS is provably insufficient: you need every node's answer, and each answer depends on the whole rest of the tree.

---

## 2.2 Problem Table

### A — Bottom-up aggregate

> **Intuition.** Ask each subtree for **one fact about itself**, then combine the two answers. Nothing above the node is visible, and nothing above it needs to be.

**Mental model.** *"`dfs(n)` answers a question about the subtree at `n`, using only the two answers its children gave me. I never look up, and I never need to."*

Pattern 1 asked *in what order do I touch the nodes?* This pattern asks a harder question: **what does a subtree owe its parent?** Answer it before typing and most of the bugs never get written.

Three questions, in this order, every single time: what does `dfs` **return**; what is the value for **null**; is the answer the **return value** or something recorded on the side.

```
   dfs(n) sees ONLY:   n.val,  dfs(n.left),  dfs(n.right)

   IDENTITY -- the null case must be the neutral element of the combine:
       height / sum        ->  0
       "all nodes satisfy" ->  true
       unclamped max       ->  Integer.MIN_VALUE

   110  SENTINEL ABORT:  -1 means "something below is already unbalanced"
        short-circuits every ancestor  ->  O(n), not the naive O(n log n)

   222  "complete" is the ALGORITHM, not decoration:
        equal spine heights -> perfect subtree -> 2^h - 1, no traversal at all
        otherwise only ONE recursive call goes deep  ->  O(log^2 n)
```

*Get the identity wrong and every leaf reports a wrong answer, which then poisons everything above it. It is the single most common source of off-by-one in this pattern.*

**Recognition — reach for this when:**

- ✓ The answer is **one fact per subtree** — a height, a count, a sum, a boolean.
- ✓ A node's answer is computable from its two children's answers and nothing else.
- ✓ You can name the value for `null` without hesitating.
- ✗ But **not** when what you record differs from what the parent needs. That is sub-variant **C**, and confusing the two is where interviews are lost.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★27 | **104. Maximum Depth of Binary Tree** | Easy | A | The atom of postorder aggregation: `1 + max(left, right)`, identity `0`. Every Pattern 2 problem is a mutation of this shape. |
| ★28 | **110. Balanced Binary Tree** | Easy | A | The sentinel-abort idiom: return `-1` to mean "already unbalanced" and the whole tree is O(n) instead of O(n log n). This is sub-variant C compressed into one integer. |
| ⚠29 | **222. Count Complete Tree Nodes** | Medium | A | A correct O(n) traversal is the *wrong answer*. The constraint "complete" is the problem: compare left- and right-spine heights and discard half the tree per level → O(log²n). Whenever a tree problem names its shape, the shape is the algorithm. |
| ○30 | 404. Sum of Left Leaves | Easy | A | Aggregate with a predicate that depends on the *edge* you arrived by, not the node. Two-minute rep. |

#### Why it works — the three questions, and why postorder is forced

This sub-variant is the base case of the whole pattern, so it is worth being explicit about why the shape is what it is.

1. **What does `dfs` return?** Name the type before writing anything. One number? A boolean? A pair? Ambiguity here is what produces functions that half-return two different quantities.
2. **What is the value for `null`?** It must be the **identity element** of the combining operation — `0` for a sum or a height, `true` for a universal claim, `Integer.MIN_VALUE` for an unclamped max. Ask what the *empty* subtree contributes.
3. **Is the answer returned or recorded?** For sub-variant A they are the same value, which is exactly what makes it the easy case. When they diverge you are in **C**.
4. **Why the visit must be postorder.** Both children's answers must already exist when the parent combines them, and postorder is the only order where both recursive calls have returned — the point established in Pattern 1 A.

> **Answer these three before typing:** what does `dfs` return; what is the value for `null`; is the answer the return value or a recorded one. **Every bug in this pattern is one of those three answered wrongly.**

**LC 110's sentinel is a real complexity fix, not a trick.** Returning `-1` for *something below me is already unbalanced* short-circuits every ancestor, giving `O(n)`. Computing height inside an outer traversal instead is `O(n log n)` on balanced trees and `O(n^2)` on skewed ones.

**LC 222 turns a property into an algorithm.** *Complete* means equal left and right spine heights imply a **perfect** subtree, so its size is `2^h - 1` with no traversal at all. When they differ, exactly one of the two recursive calls descends — hence `O(log^2 n)`.

**Use `long` for sums.** LC 129, 1339 and 437 all overflow `int` on deep or wide trees, silently. Take any modulus at the end, not during.

#### Walkthrough — LC 110 — the sentinel doing its job

`dfs` returns the height, or `-1` meaning *already unbalanced*. Watch how the `-1` at node 2 stops all work above it.

```
        1
       / \
      2   9          node 2's subtree is skewed:
     /                  3 -> 4, so heights 2 and 0 differ by 2
    3
   /
  4
```

| # | Node | left | right | Combine | Returns |
|---|---|---|---|---|---|
| 1 | 4 | 0 (null) | 0 (null) | `|0-0| <= 1`, ok | **1** |
| 2 | 3 | 1 | 0 (null) | `|1-0| <= 1`, ok | **2** |
| 3 | 2 | 2 | 0 (null) | `|2-0| = 2` > 1 → **unbalanced** | **-1** |
| 4 | 1 | -1 | -- | left is already `-1` | **-1**, short-circuit — node 9 is never visited |

Answer `false`. Row 4 is the point: once `-1` appears, no ancestor does any further work and the right subtree is never explored at all. The naive version — a `height()` call inside an outer `isBalanced()` traversal — would recompute heights at every level instead, which is where the extra `log n` factor comes from.

#### Key observations — what interviewers are listening for

- **Say the three questions out loud, in order.** Return type, null value, returned-or-recorded. The gate for this sub-variant is literally answering them for LC 104.
- **The identity element is derived, not recalled.** *What does the empty subtree contribute to this combine?* Sum: 0. Height: 0. Universal claim: true. Max with no floor: `MIN_VALUE`.
- **A sentinel value is a legitimate return type.** `-1` in LC 110 is not a hack — it is a second channel in the return, and it buys a whole complexity class. Explain the `O(n)` versus `O(n log n)` difference unprompted.
- **Watch for problems where the constraint is the algorithm.** LC 222's *complete* is the entire solution. Reading a constraint as decoration rather than as a lever is a recurring way to miss the intended approach.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Wrong identity for `null` | off-by-one at every leaf, propagating up the whole tree. | Ask what the **empty** subtree contributes to this specific combine, and answer per state. |
| Recomputing height inside an outer traversal (LC 110) | `O(n log n)` on balanced trees, `O(n^2)` on skewed ones. | Use the `-1` sentinel and a single pass. |
| `int` sums on LC 129, 1339 or 437 | silent overflow on deep or wide trees. | Accumulate in `long`; apply any modulus only at the end. |
| Combining before both calls have returned | you are writing preorder and calling it an aggregate. | Aggregates are postorder. Both children must be known before the parent combines. |

#### Key takeaway

- **Trigger:** one fact per subtree, computable from the two children's facts.
- **The three questions:** what is returned, what `null` returns, returned-or-recorded.
- **Identity:** the neutral element of the combine — 0, `true`, `MIN_VALUE` as appropriate.
- **LC 110:** `-1` sentinel gives `O(n)`; the naive nesting gives `O(n log n)`.
- **Gate:** answer the three questions aloud for LC 104, and write LC 110's sentinel version with the complexity argument. See [§5.2](#52-tree-recursion).


### B — Parallel recursion on two trees

> **Intuition.** Walk **two** trees in lockstep with one function. The base case does all the work; the recursive step is a single line.

**Mental model.** *"I am comparing two nodes at the same position in two trees. Either both are absent, or one is, or both exist — and only the third case needs any thought."*

The three-case base is the whole template, and `a == b` is doing something slightly clever: it covers *both null* in one line, and it is the only place two nulls are allowed to compare equal.

The pairing rule — which child of `a` lines up with which child of `b` — is a **parameter**, not a law. Changing it is what turns *same tree* into *symmetric tree*.

```
   THE THREE-CASE BASE, and it is the whole template:

       if (a == b)                 return true    // both null -- the only equal-nulls case
       if (a == null || b == null) return false   // exactly one null
       if (a.val != b.val)         return false   // both exist, values differ

   then one line:  recurse on the paired children

   100  same tree      pair (a.left, b.left)  and (a.right, b.right)
   101  symmetric      pair (a.left, b.RIGHT) and (a.right, b.LEFT)   <- CROSSED

   the pairing is a PARAMETER, not a different algorithm
```

*`a == b` is true only when both are the same reference — which for two independent trees means both are `null`. That is why it collapses the both-null case into one comparison.*

**Recognition — reach for this when:**

- ✓ Two trees, compared or merged position by position.
- ✓ The question is structural — identical, symmetric, subtree-of, merged.
- ✓ You can state the pairing rule in one line.
- ✗ But **not** when the two trees are traversed at different rates. Matching a subtree at *any* position needs an outer loop over candidate roots as well.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★31 | **100. Same Tree** | Easy | B | Two cursors descending in lockstep. The three-line base case (`both null` / `one null` / `values differ`) is the template for everything in B. |
| ★32 | **101. Symmetric Tree** | Easy | B | Same machine with the recursion *crossed*: `(a.left, b.right)` and `(a.right, b.left)`. Teaches that the pairing rule is a parameter, not a law. |
| ★33 | **572. Subtree of Another Tree** | Easy | B | Composition: a traversal whose visit action is a whole second recursion. O(mn) is expected; know that the O(m+n) answer is serialization plus KMP (see #55). |
| ○34 | 617. Merge Two Binary Trees | Easy | B | B where the return is a node instead of a boolean. Redundant if #31 is solid. |
| ○35 | 951. Flip Equivalent Binary Trees | Medium | B | B with a disjunction over two pairings. Good if you want one harder rep. |

#### Why it works — the three-case base, and why symmetry is a parameter

Almost all the correctness lives in the base case, which is why it is worth writing carefully once and reusing.

1. **Both absent.** `a == b` catches it. Two nulls are the same reference, so this is `true` — structurally identical empty subtrees.
2. **Exactly one absent.** If the previous test failed and either is `null`, the structures differ. `false`, immediately.
3. **Both present.** Compare the values. If they differ the trees differ; if they match, the answer depends entirely on the children.
4. **The pairing rule.** For *same tree* you pair left-with-left. For *symmetric* you pair left-with-right. Same function, same base case, one argument swapped — which is why LC 101 is not a new algorithm.

> **The distinction the gate asks for:** the crossed pairing in LC 101 is a **parameter**, not a different algorithm. One function walks two trees; how you line up the children is the only thing that changes.

**Merging returns a node instead of a boolean.** LC 617 uses the same skeleton with the base cases returning the surviving subtree rather than `true`/`false` — the shape is identical, only the return type moves.

**Subtree-of is this plus an outer search.** LC 572 runs the two-tree comparison from every candidate root, which is why its cost is the product rather than the sum.

#### Walkthrough — LC 101 — symmetric check with the crossed pairing

Watch the pairing column. Each call compares a node from the left subtree against its **mirror** in the right subtree.

```
         1
        / \
       2   2
      / \ / \
     3  4 4  3
```

| # | Compared pair | Case | Result |
|---|---|---|---|
| 1 | `(2, 2)` | both present, values equal | recurse on the crossed pairs |
| 2 | `(3, 3)` | outer-left vs outer-right, equal | recurse → both children null |
| 3 | `(4, 4)` | inner-left vs inner-right, equal | recurse → both children null |
| 4 | `(null, null)` | `a == b` | **true** — the base case that terminates every branch |

Answer `true`. The only thing separating this from LC 100 is which children were paired at step 1: `(a.left, b.right)` and `(a.right, b.left)` instead of the straight pairing. Same base case, same recursion, one argument order.

#### Key observations — what interviewers are listening for

- **Write the base case once and reuse it.** Three lines, and they cover every structural comparison in this sub-variant.
- **`a == b` is deliberate, not lazy.** It handles both-null in a single reference comparison. Worth pointing out, because it looks like a shortcut and is actually the precise test.
- **Name the pairing before you write the recursion.** *Left with right* or *left with left*. Stating it turns LC 101 from a puzzle into a one-argument change.
- **The return type can be a node.** Merging is the same walk with a different payload. Recognising that keeps LC 617 from feeling like a new problem.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Checking `a == null && b == null` then `a == null || b == null` separately | correct but verbose, and easy to get the order wrong. | `a == b` collapses the first case cleanly. Then a single `||` test. |
| Using the straight pairing for LC 101 | you have written *same tree* and answered a different question. | Symmetric pairs left-with-right. State the pairing explicitly before recursing. |
| Comparing values before checking for null | `NullPointerException` on the first lopsided pair. | Base cases first, always: both-null, one-null, then values. |
| Assuming subtree-of is a single comparison | misses matches that start below the root. | LC 572 needs an outer walk over candidate roots as well. |

#### Key takeaway

- **Trigger:** two trees compared or merged position by position.
- **The base:** `a == b` → true; one null → false; values differ → false.
- **The pairing:** a parameter. Straight for LC 100, crossed for LC 101.
- **Return type:** boolean for comparison, node for merging — same skeleton.
- **Gate:** the two-tree base case blind, plus why LC 101's crossed pairing is a parameter. See [§5.2](#52-tree-recursion).


### C — Augmented return: what you record ≠ what you return

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ⚠36 | **543. Diameter of Binary Tree** | Easy | C | *The* proof problem of Pattern 2. The obvious recursion returns the diameter and is wrong: a parent cannot build a path from a child's diameter. Return the **height**; record `left + right` in a field. Be able to say that out loud. |
| ★37 | **124. Binary Tree Maximum Path Sum** | Hard | C | #36 with two additions: the returned value is clamped at zero (`Math.max(0, child)` — a negative branch is simply not used) and the recorded value may be a single node. The clamp is the entire difficulty. |
| ○38 | 687. Longest Univalue Path | Medium | C | Same skeleton with an equality guard on each edge. Pure rep of the record/return split. |
| ○39 | 1372. Longest ZigZag Path in a Binary Tree | Medium | C | The returned value becomes a *pair* (left-going, right-going). Do this if you want to see the pattern generalize beyond one number. |

### D — Top-down inherited state

> **Intuition.** Push what you know **down** as a parameter. Nothing comes back up except a count — and because each child recomputes the state from scratch, there is nothing to undo.

**Mental model.** *"The parameter *is* the state. I hand each child the version of it that applies to them, and I never have to restore anything, because I never modified anything shared."*

This is the mirror image of sub-variant A: information flows **down** rather than up. The answer accumulates in a counter or is returned as a simple sum of the children's counts.

The reason D needs **no backtracking** — unlike E and F — is that the state is passed **by value** and recomputed per child, rather than mutated in a shared structure.

```
   A  bottom-up          child answers  ->  combine  ->  return upward
   D  top-down            parent state   ->  pass down  ->  count

   1448 goodNodes:
       dfs(node, maxSoFar)
           good = (node.val >= maxSoFar) ? 1 : 0
           pass down  max(maxSoFar, node.val)   -- a NEW value per child
           return good + dfs(left, ...) + dfs(right, ...)

   nothing shared is mutated  ->  NOTHING TO UNDO
   that is the entire difference from sub-variants E and F
```

*`max(maxSoFar, node.val)` creates a fresh value for the call rather than editing something both siblings can see. That is what makes backtracking unnecessary.*

**Recognition — reach for this when:**

- ✓ A node's verdict depends on the **path from the root** to it — a running max, depth, or sum.
- ✓ The answer is a **count** or a simple sum over all nodes.
- ✓ The inherited state is a small immutable value you can pass as a parameter.
- ✗ But **not** when the state is a shared mutable structure. A list or a map that both children see needs the undo discipline of **E** and **F**.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★40 | **1448. Count Good Nodes in Binary Tree** | Medium | D | The cleanest statement of "the parameter *is* the state." `maxSoFar` flows down; nothing flows up but a count. |
| ★41 | **129. Sum Root to Leaf Numbers** | Medium | D | The accumulator is transformed on the way down (`cur * 10 + val`) and only harvested at leaves. Watch what "leaf" means — not "null". |
| ○42 | 1315. Sum of Nodes with Even-Valued Grandparent | Medium | D | Two generations of inherited state instead of one. Skip if #40 was clean. |

#### Why it works — why top-down needs no undo

The distinction between D and E is one of the cleanest in the pattern, and the gate asks for it directly.

1. **The state travels as a parameter.** `dfs(node, maxSoFar)` — the value is on the call stack, one copy per frame, invisible to siblings.
2. **Each child gets a freshly computed value.** `max(maxSoFar, node.val)` produces a **new** value for the call. The parent's own variable is untouched.
3. **So there is nothing shared to restore.** When the call returns, the frame vanishes and with it the child's copy. No cleanup step exists because no mutation happened.
4. **Contrast with E and F.** There the state is a shared list or map. Every mutation on the way down needs an exact inverse on the way up, or one branch's data leaks into the next.

> **The distinction the gate asks for:** sub-variant D needs no backtracking because the state is **recomputed per child** rather than mutated in a shared structure. E and F mutate, so they must undo.

**The seed value is a small modelling choice.** LC 1448 can start with `root.val` or with `Integer.MIN_VALUE` — both are correct, and one reads better. Being able to say why either works shows you understand what the parameter means.

**Depth is the simplest inherited state of all**, which is why the DFS form of LC 199 in Pattern 1 D is really this sub-variant wearing a traversal hat.

#### Walkthrough — LC 1448 — counting good nodes

A node is *good* if no node on the path from the root to it is greater. Watch `maxSoFar` change per branch without any restoration.

```
        3
       / \
      1   4
     /   / \
    3   1   5
```

| # | Node | maxSoFar in | Good? | Passes down |
|---|---|---|---|---|
| 1 | 3 (root) | 3 | yes (3 >= 3) | 3 |
| 2 | 1 | 3 | no (1 < 3) | 3 |
| 3 | 3 | 3 | **yes** | 3 |
| 4 | 4 | 3 | **yes** (4 >= 3) | **4** |
| 5 | 1 | 4 | no | 4 |
| 6 | 5 | 4 | **yes** (5 >= 4) | 5 |

Four good nodes. Notice rows 2 and 4: the left branch carried `maxSoFar = 3` while the right branch carried 4, at the same time, with no interference. Neither branch had to restore anything — each simply received its own value. Hold that state in a shared field instead and the left branch's 3 would leak into the right.

#### Key observations — what interviewers are listening for

- **Name the direction before you write the signature.** *Does information flow up or down?* Up means a return value; down means a parameter. Getting that right first eliminates most of the design.
- **The no-undo property comes from immutability, not from luck.** Passing a value creates a copy per frame. That single fact is the whole D-versus-E distinction.
- **The counter can be a return value or a field.** Summing the children's counts keeps the function pure, which is usually the cleaner choice and is worth preferring when it costs nothing.
- **Depth-based problems are this sub-variant.** Anything phrased as *at depth d* or *on the path so far* is inherited state, even when it is presented as a traversal problem.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Holding the inherited state in a shared field | one branch's value leaks into its sibling. | Pass it as a parameter. A fresh value per call is what makes the undo unnecessary. |
| Adding backtracking that is not needed | harmless but confusing, and it suggests the D/E distinction has not landed. | Nothing shared was mutated, so there is nothing to restore. |
| Choosing a seed that excludes the root | the root is misclassified, and every count is off by one. | Seed with `root.val` or `Integer.MIN_VALUE`, and be able to say why your choice includes the root. |
| Returning the state instead of the count | the function reports the running max rather than the answer. | The state goes **down**; the count comes **up**. Two different channels. |

#### Key takeaway

- **Trigger:** a node's verdict depends on the root path; the answer is a count.
- **The mechanism:** state travels **down** as a parameter, recomputed per child.
- **No backtracking:** nothing shared is mutated, so nothing needs restoring.
- **Contrast:** E and F mutate shared structures and therefore must undo.
- **Gate:** LC 1448 blind, plus why D needs no backtracking while E does. See [§5.2](#52-tree-recursion).


### E — Root-to-leaf paths with backtracking

> **Intuition.** Keep one mutable path and edit it as you walk. Every push on the way down needs an **exact inverse** on the way up — otherwise one branch's nodes leak into the next.

**Mental model.** *"There is a single list representing *where I am right now*. I add myself entering, and I remove myself leaving. If I ever forget the removal, my sibling inherits my ancestors."*

This looks like DFS and is really **backtracking**. The distinction from sub-variant D is that the state here is shared and mutated, so the walk owes an undo.

Two rules, both non-negotiable, and each has its own failure mode.

```
   TWO RULES, both non-negotiable:

     1. exactly one removeLast() for every addLast(), on EVERY exit path
        -- otherwise paths from one branch leak into the next

     2. record a COPY -- new ArrayList<>(path)
        -- otherwise every result aliases the same list, which ends up empty

   LEAF is  (left == null && right == null)
        NOT  (n == null),  which is one step PAST a leaf
```

*`n == null` and *is a leaf* are different tests that both exist and both matter. Using the wrong one either counts each root-to-leaf answer twice or accepts half-paths.*

**Recognition — reach for this when:**

- ✓ The answer is a **list of paths**, or something computed per complete root-to-leaf path.
- ✓ You need the actual sequence of nodes, not just an aggregate.
- ✓ A single shared structure is the natural representation of *where I am*.
- ✗ But **not** when a per-node parameter would do. If the state is one immutable value, use **D** and skip the undo entirely.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★43 | **112. Path Sum** | Easy | E | The leaf test, isolated. `root == null` returning false is correct; `root.left == null && root.right == null` is the actual leaf condition. Most people conflate them once, forever. |
| ★44 | **257. Binary Tree Paths** | Easy | E | First problem where the path is a mutable list: add before recursing, **remove after**. The remove is the whole sub-variant. |
| ★45 | **113. Path Sum II** | Medium | E | #43 and #44 composed, plus the copy-on-record rule: `new ArrayList<>(path)`, or every result aliases the same list and you return N copies of the empty list. |
| ○46 | 988. Smallest String Starting From Leaf | Medium | E | Backtracking with a `StringBuilder` and a reversal. Good if `setLength` discipline is shaky. |

#### Why it works — the two rules, and the leaf condition

Three details, and each one corresponds to a specific wrong answer people actually produce.

1. **The path is shared, so it must be restored.** One list represents the current root path. Entering a node appends; leaving must remove. The undo goes **after all recursive calls**, on every exit path.
2. **Recording must copy.** The list keeps changing after you record it. Storing the reference means every result points at the same object, which is empty by the time the walk finishes.
3. **A leaf is not a null.** `left == null && right == null` is a leaf. `n == null` is the empty subtree one step beyond it — and recursing into both children of a leaf reaches it **twice**.
4. **Which is why the tests are not interchangeable.** Use `n == null` as the leaf condition and every root-to-leaf answer is counted twice, or half-paths get accepted, depending on where you put the record.

> **The two rules, stated as one:** one undo per mutation, placed after **all** recursive calls on every exit path — and record `new ArrayList<>(path)`, never the list itself.

**The undo has to survive early returns.** If any branch returns before the bottom of the function, that path also owes a `removeLast`. A `try/finally`, or simply having a single exit point, removes the whole class of bug.

**LC 257 and 113 are the same walk with different payloads** — a string versus a summed list. The discipline is identical, which is why they are graded as one skill.

#### Walkthrough — LC 113 — path sum II, watching the undo

Target 8. Follow the `path` column: it must return to exactly its previous contents each time a branch finishes.

```
        5
       / \
      4   3
     /
    3          target = 8
```

| # | At | Action | path after | Note |
|---|---|---|---|---|
| 1 | 5 | `addLast(5)` | `[5]` | enter root |
| 2 | 4 | `addLast(4)` | `[5, 4]` | enter left |
| 3 | 3 | `addLast(3)` | `[5, 4, 3]` | **leaf**, sum 12 != 8 — no record |
| 4 | 3 | `removeLast()` | `[5, 4]` | undo, leaving the leaf |
| 5 | 4 | `removeLast()` | `[5]` | undo, leaving node 4 |
| 6 | 3 | `addLast(3)` | `[5, 3]` | **leaf**, sum 8 — record `new ArrayList<>(path)` |

Result `[[5, 3]]`. Rows 4 and 5 are the whole discipline: without them, row 6 would begin from `[5, 4, 3]` and produce `[5, 4, 3, 3]`. And had row 6 recorded `path` itself instead of a copy, the final answer would be an empty list — the walk empties it on the way out.

#### Key observations — what interviewers are listening for

- **Pair every mutation with its inverse as you type it.** Write `addLast` and `removeLast` in the same keystroke burst, then fill the recursion between them. The bug then cannot be written.
- **The copy is not defensive programming, it is correctness.** The list is guaranteed to change afterwards. Recording a reference records a future empty list.
- **State the leaf condition without hesitating.** The gate says so explicitly. `left == null && right == null` — and know why `n == null` is a different, also-necessary test.
- **Early returns owe an undo too.** The most common leak is a branch that returns before reaching the bottom of the function.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| `addLast` without a matching `removeLast` | paths from one branch leak into the next. | One undo per mutation, placed after **all** recursive calls, on every exit path. |
| Recording the path list instead of a copy | every result is the same list — and it ends up empty. | `new ArrayList<>(path)` at the moment of recording. |
| Treating `n == null` as the leaf condition | root-to-leaf answers counted twice, or half-paths accepted. | A leaf is `left == null && right == null`. Both tests exist and mean different things. |
| Putting the undo before the recursive calls | the children walk with an incomplete path. | The undo is the **last** statement, after both calls have returned. |

#### Key takeaway

- **Trigger:** the answer is a list of complete root-to-leaf paths.
- **Rule 1:** exactly one `removeLast` per `addLast`, after all recursive calls, on every exit.
- **Rule 2:** record `new ArrayList<>(path)` — a copy, never the live list.
- **Leaf:** `left == null && right == null`, not `n == null`.
- **Gate:** LC 113 blind with one undo per mutation, the copy-on-record, and the leaf condition stated without hesitation. See [§5.2](#52-tree-recursion).


### F — Prefix sums on the root path

> **Intuition.** **LC 560 transplanted onto a tree.** The array becomes the current root path, and the hash map of prefix sums becomes a map that must be undone on the way back up.

**Mental model.** *"I am running the subarray-sum-equals-K algorithm, except my array is the path from the root to wherever I am standing — and that array shrinks when I step back."*

The transfer is the point of this sub-variant, and the gate asks for it directly: explain LC 437 as LC 560 on the root path.

`prefix[s]` = how many nodes on the **current root path** have running sum `s`. The word *current* is doing all the work, and it is the undo that makes it true.

```
   LC 560 on an array          LC 437 on a tree
   -------------------------   ----------------------------------------
   prefix sums of a[0..i]      prefix sums along the CURRENT root path
   map: sum -> count           map: sum -> count
   answer += map[p - k]        answer += map[p - k]
   -- array never shrinks --   -- the path SHRINKS when you step back --
                               so the map must be DECREMENTED on the way up

   seed  prefix.put(0L, 1)     so a path starting at the root is counted
   the decrement is the LAST statement of the DFS body
```

*Without the decrement, cousins see each other's prefix sums and the count includes paths that do not exist — ones that would have to jump sideways across the tree.*

**Recognition — reach for this when:**

- ✓ Counting **downward paths** with a given sum, not necessarily starting at the root.
- ✓ You already know the array version of the problem.
- ✓ The path is a contiguous run of ancestors — exactly a subarray of the root path.
- ✗ But **not** for paths that bend. A path through a node using both children is sub-variant **C**, not this.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★47 | **437. Path Sum III** | Medium | F | The bridge from arrays to trees: the prefix-sum hash map from "subarray sum equals K" transplanted onto the root path. The map must be **undone on the way up** or paths from different branches contaminate each other. If you know LC 560, you already know this — that transfer is the point. |

#### Why it works — the transplant, and the two bookkeeping rules

One idea carried across, and two details that make the carry legitimate.

1. **The array becomes the root path.** In LC 560 the prefix sums come from `a[0..i]`. Here they come from the chain of ancestors down to the current node — which is exactly a contiguous sequence, so the same counting works.
2. **The lookup is unchanged.** `answer += prefix[p - k]` counts how many ancestors have a running sum that makes the segment between them and here equal `k`.
3. **The seed.** `prefix.put(0L, 1)` before the first call, so that a path **starting at the root** is counted. Seeding inside the DFS would re-seed at every node.
4. **The undo.** The path shrinks when you return, so the map must shrink with it. Decrementing `prefix[p]` is the **last statement** of the DFS body — otherwise a node's sum stays visible to its cousins.

> **The sentence that makes *current root path* true:** the decrement is the last statement of the DFS body. Without it, cousins see each other's sums and you count paths that would have to jump sideways across the tree.

**Use `long` for the running sum.** LC 437's values and depths can overflow `int` silently, and the failure looks like an ordinary wrong answer rather than a crash.

**The seed goes before the first call, not inside it.** Seeding inside means every node re-registers a zero prefix, which inflates the count by exactly the number of nodes.

#### Walkthrough — LC 437 — counting downward paths summing to 8

Watch the map contents. The entry added when entering a node is gone again by the time its sibling is visited.

```
        5
       / \
      3   3          target k = 8
     /
    5
```

| # | At | running sum p | look up p - 8 | count | map after |
|---|---|---|---|---|---|
| 1 | root 5 | 5 | `map[-3]` = 0 | 0 | `{0:1, 5:1}` |
| 2 | left 3 | 8 | `map[0]` = **1** | **1** | `{0:1, 5:1, 8:1}` |
| 3 | leaf 5 | 13 | `map[5]` = **1** | **2** | `{0:1, 5:1, 8:1, 13:1}` |
| 4 | unwind to root | -- | -- | 2 | `{0:1, 5:1}` — **13 and 8 removed** |
| 5 | right 3 | 8 | `map[0]` = **1** | **3** | `{0:1, 5:1, 8:1}` |

Three paths: `5-3`, `3-5` and the right-hand `5-3`. Row 4 is the sub-variant in one line — the left branch's entries are removed before the right branch runs. Skip the decrement and row 5 would still see `8:1` and `13:1` from the left branch, counting a path that steps sideways from one child to the other, which no tree path can do.

#### Key observations — what interviewers are listening for

- **Lead with the transfer.** *This is LC 560 with the array replaced by the root path.* The gate asks for exactly that sentence, and it makes the rest of the solution follow.
- **The undo is what defines the data structure.** The map claims to describe the *current* path. That claim is only true because of the decrement — so the decrement is part of the definition, not cleanup.
- **Seed once, outside.** `{0: 1}` before the walk begins. It is what lets a path that starts at the root be counted at all.
- **Downward only.** This counts paths that run straight down. A path that bends through a node is a different question and a different sub-variant.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Prefix map not decremented on the way up | overcounts paths that appear to span two branches. | The decrement is the **last statement** of the DFS body. |
| Prefix map missing the `{0: 1}` seed | misses every path that starts at the root. | Seed before the first call, not inside it. |
| Seeding inside the DFS | the count is inflated by roughly the number of nodes. | One seed, before the walk starts. |
| `int` running sums | silent overflow on deep or large-valued trees. | Accumulate in `long`. |

#### Key takeaway

- **Trigger:** count downward paths with a given sum, starting anywhere.
- **The transfer:** LC 560 with the array replaced by the current root path.
- **Seed:** `prefix.put(0L, 1)` once, before the walk.
- **Undo:** decrement `prefix[p]` as the last statement of the DFS body.
- **Gate:** explain LC 437 as LC 560 on the root path, including why the entry must be decremented. See [§5.2](#52-tree-recursion).


### G — Lowest common ancestor

> **Intuition.** Six lines, one real proof. Ask both children *did you find anything?* — and the pattern of answers tells you whether **this** node is the split point.

**Mental model.** *"If both sides come back non-null, the two targets are in different subtrees, so I am the place they meet. If only one side comes back, I pass it up unchanged — and that turns out to be right whether it is the answer or just one of the targets."*

The code is trivial and the argument is not. What makes it work is that a single non-null return is correct under **two different readings**, and you never have to distinguish them.

That double meaning is the thing to be able to defend, because it is exactly what an interviewer will probe.

```
   dfs(n) returns:  a target if n IS one,
                    otherwise whatever its children found

   BOTH sides non-null   ->  p and q are in different subtrees
                             -> n is the SPLIT POINT -> return n

   ONE side non-null     ->  return it, unchanged. It is EITHER
                               (a) the LCA, already found deeper, OR
                               (b) one target that is an ancestor of the other
                             and passing it up is correct in BOTH readings

   NEITHER               ->  return null
```

*You never need to know which of the two readings applies. That is what collapses the whole problem into six lines.*

**Recognition — reach for this when:**

- ✓ Lowest common ancestor, meeting point, or *where do these two paths converge*.
- ✓ The tree is a plain binary tree with no ordering to exploit.
- ✗ But **not** on a BST, where the ordering gives an `O(h)` walk with no recursion — that is Pattern 3 A.
- ✗ And **not** when a target may be absent, unless you extend the return value. See below.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★48 | **236. Lowest Common Ancestor of a Binary Tree** | Medium | G | Six lines that hide a real proof: returning a non-null from both sides means *this* node is the split point. Be able to explain why returning the node itself on a match is correct even when one target is an ancestor of the other. |
| ★49 | **1123. Lowest Common Ancestor of Deepest Leaves** | Medium | G + C | LCA where the targets are not given — you must return `(depth, node)` upward and let the deeper side win. Sub-variants C and G composed. |
| ○50 | 1650. Lowest Common Ancestor of a Binary Tree III 🔒 | Medium | G | With parent pointers this becomes the two-pointer "intersection of two linked lists" trick. Free substitute: **160. Intersection of Two Linked Lists**. |

#### Why it works — the one step worth defending

Two of the three cases are obvious. The third is the whole problem.

1. **The base.** `null` returns `null`; a node equal to `p` or `q` returns itself. Nothing subtle yet.
2. **Both sides non-null.** One target was found somewhere left and the other somewhere right. No node below `n` can contain both, so `n` is the lowest node that does — return `n`.
3. **Exactly one side non-null, reading (a).** The LCA was already determined deeper in that subtree. Passing it up unchanged preserves it, because no ancestor can be *lower*.
4. **Exactly one side non-null, reading (b).** The value returned is one target, and the other lies **beneath it**. Then that target is itself the LCA — so passing it up is again correct. The code never distinguishes the two, and does not need to.

> **The step the gate asks you to defend:** if only one side returns non-null, it is either the LCA found deeper **or** one target that is an ancestor of the other — and passing it up is correct in both readings.

**This version assumes both targets exist.** If they might not, you must return `(found_p, found_q, node)` or run a containment check first — a standard follow-up, and a place where *it worked on LeetCode* is not an answer.

**Say the assumption out loud before you rely on it.** Unstated, it is the difference between a correct solution and one that confidently returns a node when one target was never in the tree.

#### Walkthrough — LC 236 — both readings in one tree

Targets `p = 5` and `q = 4`, where 4 sits **beneath** 5. This is reading (b), the case people find hardest to justify.

```
        3
       / \
      5   1
     / \
    6   2
       / \
      7   4        p = 5,  q = 4
```

| # | Node | left returns | right returns | Verdict |
|---|---|---|---|---|
| 1 | 6 | null | null | returns `null` |
| 2 | 7 | null | null | `null` |
| 3 | 4 | -- | -- | **is a target** → returns `4` |
| 4 | 2 | null | `4` | one side → pass up `4` |
| 5 | 5 | `null` (from 6) | `4` (from 2) | **is a target itself** → returns `5` immediately |
| 6 | 3 | `5` | `null` | one side → pass up `5` → **answer 5** |

Answer 5. Row 5 is reading (b) in action: node 5 is one of the targets and the other is beneath it, so 5 short-circuits and returns itself without ever looking at what came up from node 2. Row 6 then passes it along unchanged. At no point did the code decide *which* reading it was in.

#### Key observations — what interviewers are listening for

- **Defend the one-sided case unprompted.** Both readings, in one sentence. That is exactly what the gate names, and it is the only part of this problem that is not mechanical.
- **State the existence assumption.** *This assumes both targets are present.* Saying it before being asked converts a hidden bug into a deliberate scope decision.
- **The short-circuit at a target is deliberate.** Returning immediately on `n == p || n == q` is what makes reading (b) work without extra logic.
- **On a BST, do not use this.** The ordering lets you walk down in `O(h)` with no recursion at all. Reaching for the general algorithm on a BST misses the point of the constraint.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Assuming both targets exist without saying so | wrong answer when one is absent — a node is returned that is not an ancestor of anything. | Say the assumption out loud; if it is unstated in the problem, return a found-flag pair. |
| Trying to distinguish the two one-sided readings | extra state, extra branches, and no change in behaviour. | Passing the value up is correct in both. That is the point. |
| Continuing to search below a found target | correct but wasteful, and it breaks the reading-(b) shortcut. | Return immediately when the node **is** a target. |
| Using this on a BST | `O(n)` where `O(h)` was available. | On a BST, compare values and walk down. See Pattern 3 A. |

#### Key takeaway

- **Trigger:** lowest common ancestor in a plain binary tree.
- **Both non-null:** this node is the split point.
- **One non-null:** pass it up — correct whether it is the LCA or an ancestor target.
- **Caveat:** assumes both targets exist; otherwise return a found-flag pair.
- **Gate:** LC 236 blind, defending the both-sides-non-null step and the ancestor case. See [§5.2](#52-tree-recursion).


### H — Construction from traversals

> **Intuition.** One traversal tells you **who the root is**; the other tells you **how many nodes go left**. Together they rebuild the tree, and neither can do it alone.

**Mental model.** *"Preorder hands me the next root. I look it up in the inorder sequence, and everything to its left in that sequence is its left subtree. Now I know both sizes and can recurse."*

The pair is what carries the information: preorder supplies **identity**, inorder supplies **split position**. Either alone is ambiguous.

LC 105 and 106 differ by exactly one thing, and the gate asks you to state it from memory after writing both back to back.

```
   105  preorder + inorder
        preorder gives the ROOT (consume left to right)
        inorder  says how many nodes are on its LEFT
        -> build LEFT subtree first

   106  postorder + inorder
        postorder is consumed FROM THE RIGHT   (root, then right, then left)
        -> build RIGHT subtree FIRST

   that single swap is the ENTIRE difference between the two

   the cursor is SHARED STATE: a field, or an int[1].
   copying it into each frame builds subtrees from the wrong slice.
```

*The cursor must be shared because consuming a node in one subtree has to be visible to the other. Pass it by value and every sibling restarts from the same position.*

**Recognition — reach for this when:**

- ✓ You are given **two traversals** and asked to rebuild the tree.
- ✓ Values are distinct, so the inorder lookup is unambiguous.
- ✗ But **not** with preorder alone, or inorder alone — neither is uniquely decodable.
- ✗ And **not** with duplicate values, where the inorder position cannot be located reliably.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★51 | **105. Construct Binary Tree from Preorder and Inorder Traversal** | Medium | H | Preorder gives you the root; inorder tells you how much of it belongs to the left. The index map plus the arithmetic for the two sub-ranges is the entire problem, and it is *always* an off-by-one. |
| ★52 | **106. Construct Binary Tree from Inorder and Postorder Traversal** | Medium | H | Postorder consumed **from the right**, and therefore the right subtree is built **before** the left. Write it immediately after #51 or you will fuse the two in memory. |
| ○53 | 889. Construct Binary Tree from Preorder and Postorder Traversal | Medium | H | Shows why the answer is not unique without inorder. Worth reading even if you don't code it. |
| ○54 | 654. Maximum Binary Tree | Medium | H | Construction from one array by repeatedly splitting at the max. O(n) monotonic-stack solution is a bonus. |

#### Why it works — why two traversals, and why the cursor is shared

Two structural facts. The second is where the bug lives.

1. **Preorder supplies identity.** Its first element is the root of the current subtree. Consuming left to right hands you each subtree's root in exactly the order you need it.
2. **Inorder supplies the split.** Find the root's position in the inorder range; everything before it is the left subtree, everything after is the right. That gives both sizes.
3. **The cursor must be shared.** Building the left subtree consumes an unknown number of preorder entries, and the right subtree must start after **all** of them. A per-frame copy cannot know that, so it rebuilds from the wrong slice.
4. **Postorder reverses the order of construction.** Read from the right, postorder gives root, then right subtree, then left. So LC 106 must build the **right** subtree first — the one swap that separates it from LC 105.

> **The single difference between LC 105 and LC 106:** postorder is consumed **from the right**, so the **right** subtree must be built first. Write them back to back and state that difference from memory.

**A hash map from value to inorder index turns the lookup from `O(n)` into `O(1)`**, taking the whole construction from `O(n^2)` to `O(n)`. Worth building unprompted, and worth saying why.

**Mirroring is a silent failure.** Build the left subtree first in LC 106 and you get a perfectly valid tree that is the mirror of the right answer — no exception, no crash.

#### Walkthrough — LC 105 — rebuilding from preorder and inorder

`preorder = [3, 9, 20, 15, 7]`, `inorder = [9, 3, 15, 20, 7]`. The cursor advances **once per node**, across all frames.

```
preorder   3   9   20   15   7        <- consumed left to right
inorder    9   3   15   20   7
```

| # | Cursor takes | Inorder range | Left size | Builds |
|---|---|---|---|---|
| 1 | `3` | `[9, 3, 15, 20, 7]` | 1 (just `9`) | root 3; recurse left on `[9]` |
| 2 | `9` | `[9]` | 0 | leaf 9; both sides empty |
| 3 | `20` | `[15, 20, 7]` | 1 (just `15`) | node 20 — **the cursor is now at index 2**, which only works because frame 2 advanced it |
| 4 | `15` | `[15]` | 0 | leaf 15 |
| 5 | `7` | `[7]` | 0 | leaf 7 |

Rebuilt correctly. Row 3 is the reason the cursor cannot be copied: node 20's frame relies on frames 1 and 2 having already consumed `3` and `9`. Hand each frame its own copy and node 20 would read `9` instead, building a completely different tree with no error raised.

#### Key observations — what interviewers are listening for

- **Name what each traversal contributes.** *Preorder gives identity, inorder gives the split.* One sentence that makes the algorithm obvious and explains why one traversal is not enough.
- **Write 105 and 106 back to back, deliberately.** The gate asks for exactly this, because the difference is one line and it will not stick otherwise.
- **Build the index map without being asked.** `O(n)` versus `O(n^2)`, for three lines. Explaining the improvement is as valuable as making it.
- **A mirrored tree throws no exception.** That is what makes the LC 106 ordering bug dangerous — it produces a plausible tree, silently.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Copying the `pre` cursor into each frame | subtrees built from the wrong slice; the result is a different tree entirely. | The cursor is shared state: a field, or an `int[1]`. |
| Building the left subtree first in LC 106 | a mirrored tree, and no exception thrown. | Postorder is consumed from the right, so the **right** subtree is built first. |
| Scanning the inorder array for each root | `O(n^2)` on skewed input. | Precompute a value-to-index map once. |
| Assuming distinct values | the inorder lookup becomes ambiguous and the reconstruction is arbitrary. | Check the constraint. With duplicates, the pair of traversals is not uniquely decodable. |

#### Key takeaway

- **Trigger:** rebuild a tree from two traversals.
- **The pairing:** preorder gives the **root**; inorder gives the **left-subtree size**.
- **LC 106:** postorder is read from the right, so build the **right** subtree first.
- **The cursor:** shared — a field or `int[1]`, never copied per frame.
- **Gate:** LC 105 blind, then LC 106 immediately after, stating the one difference from memory. See [§5.2](#52-tree-recursion).


### I — Serialization and structural identity

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★55 | **297. Serialize and Deserialize Binary Tree** | Hard | I | The null markers *are* the structure. Preorder with `#` for null is uniquely decodable; preorder without it is not, and inorder is not even with markers. Deserialization consumes the same stream in the same order — one shared cursor, never an index copy. |
| ○56 | 652. Find Duplicate Subtrees | Medium | I | Canonical serialization used as a map key. The obvious string concatenation is O(n²) characters; know the id-triple alternative. |
| ○57 | 449. Serialize and Deserialize BST | Medium | I + P3 | The BST version needs no null markers at all — the ordering carries the structure. Nice contrast with #55. |

### J — In-place restructuring

> **Intuition.** **Recurse first, rewire after.** Mutating a node before its children have been processed means they get processed in a shape you already changed.

**Mental model.** *"I want to move pointers around, but my children are still the old shape. So I let the recursion finish, and only then do I rewire — otherwise I am inverting things twice."*

The order-of-operations rule is the whole sub-variant, and it shows up in three quite different problems: inverting, flattening, and linking a level.

The `O(1)`-space variants are where it gets interesting, because they replace recursion with a pointer discipline that has to be exactly right.

```
   226  INVERT:  recurse, THEN swap.
        swapping first inverts subtrees twice and the tree can come back unchanged

   114  FLATTEN, O(1) space:
        for each node, splice the LEFT subtree between the node and its right subtree;
        the RIGHTMOST node of the left subtree inherits the old right chain

            n                    n
           / \        ->          \
          L   R                    L ... -> R

   117  O(1)-space level order:
        the level you have ALREADY LINKED is the queue for the next one
        a DUMMY HEAD removes every "is this the first child on this level?" case
```

*LC 117's trick is that you do not need a queue at all — the `next` pointers you built on the previous level give you a ready-made iteration order.*

**Recognition — reach for this when:**

- ✓ The tree itself is the output — inverted, flattened, or linked.
- ✓ An `O(1)`-space constraint on a problem that looks like it needs a queue.
- ✓ Pointer rewiring rather than value computation.
- ✗ But **not** when the original tree must survive. These mutate in place by definition.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★58 | **226. Invert Binary Tree** | Easy | J | The whole of J in three lines: recurse, then rewire. Swap *after* the recursive calls return, or you invert the subtrees you already swapped. |
| ★59 | **114. Flatten Binary Tree to Linked List** | Medium | J | Two solutions worth knowing: reverse-postorder with a `prev` pointer, and the O(1)-space Morris-style rewiring. The second is the follow-up they actually want. |
| ★60 | **117. Populating Next Right Pointers in Each Node II** | Medium | J + D | The O(1)-space level-order: the level you already linked *is* the queue for the next one. A dummy head plus a tail pointer removes every special case. |
| ○61 | 116. Populating Next Right Pointers in Each Node | Medium | J | The perfect-tree version. Strictly easier than #60 — do it only as a warm-up. |
| ○62 | 156. Binary Tree Upside Down 🔒 | Medium | J | Rewiring along the left spine. Free substitute: **114**. |

#### Why it works — why the recursion comes first

One ordering rule, and two pointer disciplines that depend on it.

1. **Mutation invalidates what the children saw.** If you swap `left` and `right` before recursing, the recursive calls operate on subtrees that have already moved — and invert them a second time.
2. **So the calls go first.** Recurse into both children, let them finish restructuring themselves, and only then rewire the current node's pointers.
3. **LC 114 splices rather than rebuilds.** Put the left subtree between the node and its right subtree. The **rightmost node of the left subtree** is the one that inherits the old right chain — find it, attach, then clear `left`.
4. **LC 117 reuses the previous level as its queue.** Once a level is linked by `next`, walking it gives you every parent in order, so you can link the level below without any auxiliary structure. The dummy head means the *first* child of a level needs no special case.

> **The rule that covers all three problems:** **recurse, then rewire.** Swapping before the calls inverts subtrees twice, and in some shapes the tree comes back apparently unchanged.

**The dummy head is the same idiom as the linked-list one.** It exists so that *is this the first element?* never needs asking — and reaching for it unprompted is a small, strong signal.

**LC 114's `O(1)` version is worth having over the recursive one**, because the whole point of the problem is the space constraint. The gate asks specifically for that version.

#### Walkthrough — LC 114 — flattening by splicing

At each node with a left subtree: find the rightmost node of that left subtree, hand it the current right chain, then move the left subtree across.

```
        1
       / \
      2   5
     / \   \
    3   4   6
```

| # | At | Left subtree | Rightmost of it | Rewire |
|---|---|---|---|---|
| 1 | node 1 | `2 -> (3, 4)` | **4** | `4.right = 5`; `1.right = 2`; `1.left = null` |
| 2 | node 2 | `3` | **3** | `3.right = 4`; `2.right = 3`; `2.left = null` |
| 3 | node 3 | none | -- | move on to `3.right` |
| 4 | node 4 | none | -- | move on |
| 5 | nodes 5, 6 | none | -- | already a chain |

Result `1 -> 2 -> 3 -> 4 -> 5 -> 6`, all on `right` pointers with every `left` cleared. Row 1 is the splice: node 4 is the rightmost of node 1's left subtree, so it is the node that must inherit the old right chain starting at 5. Attach it anywhere else and the tail is lost.

#### Key observations — what interviewers are listening for

- **State the ordering rule before writing.** *Recurse, then rewire.* It covers inverting, flattening and linking, and it is the only bug worth worrying about in the recursive forms.
- **Double inversion can look like success.** On symmetric trees, swapping before recursing returns the original tree unchanged — which passes a careless test.
- **The rightmost node is the attachment point.** In LC 114 it is the only node whose `right` is free, which is why it inherits the old chain.
- **LC 117 needs no queue at all.** *The level I already linked is the queue for the next one.* That reframing is what makes the `O(1)` space possible.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Swapping children before recursing in LC 226 | double inversion — and in some shapes the tree comes back unchanged. | Recurse, then rewire. |
| Attaching the old right chain to the wrong node in LC 114 | the tail is lost and the flattened list is truncated. | The **rightmost** node of the left subtree inherits it — that is the only node with a free `right`. |
| Forgetting to clear `left` after splicing | the result is not a right-only chain, so it fails the problem's definition. | `node.left = null` as part of every splice. |
| Handling the first child of a level as a special case in LC 117 | branchy, error-prone code. | Use a dummy head; the special case disappears. |

#### Key takeaway

- **Trigger:** the tree itself is the output — inverted, flattened, linked.
- **The rule:** **recurse, then rewire.**
- **LC 114:** splice the left subtree in; its **rightmost** node inherits the old right chain.
- **LC 117:** the linked level is the queue for the next; a dummy head kills the first-child case.
- **Gate:** LC 114's `O(1)`-space version and LC 117's dummy-head loop, both blind. See [§5.2](#52-tree-recursion).


### K — Tree DP with per-child states

> **Intuition.** Dynamic programming that happens to run on a tree. The **state is per node**, the transition is over children, and the order is postorder — because that is the only topological order available.

**Mental model.** *"One value per node is not enough. I return a small tuple — one entry per state — and the parent combines the tuples rather than the numbers."*

The design work is entirely up front: name the states, name the transition, and name what `null` returns **for each state separately**. Getting the null value wrong is the classic failure, and it shows up as an off-by-one at every leaf.

LC 968 is called out as the hardest gate in the document, and the reason is that all three parts have to be designed rather than recalled.

```
   337  ROB:  return {rob this node, do NOT rob this node}
        null -> identity for BOTH states -- an empty subtree contributes nothing either way
        answer: max(rob(root)[0], rob(root)[1])

   979  COINS: the return value is a SURPLUS and may be NEGATIVE.
        you count FLOW ACROSS AN EDGE, not nodes:
        |surplus| coins must cross the edge to the parent, in either direction

   968  CAMERAS: three states, greedy postorder
        0 = uncovered    1 = covered, no camera here    2 = has a camera
        place a camera as LATE as possible -- at the PARENT of an uncovered node,
        because a camera at the parent covers strictly more
        null MUST be 1: an absent child needs no cover,
                        otherwise every leaf gets a camera
        answer: cameras + (cover(root) == 0 ? 1 : 0)   -- the root can end up uncovered
```

*Each problem's `null` value is a separate design decision, made per state. `null = 1` in LC 968 is not a convention — it is the claim that an absent child needs no covering.*

**Recognition — reach for this when:**

- ✓ One number per node is not enough — a node's best answer depends on a **choice** it makes.
- ✓ Words like *rob*, *cover*, *choose*, *cannot both*, with a constraint between parent and child.
- ✓ You can enumerate a small fixed set of states per node.
- ✗ But **not** when every node needs its own global answer. That is rerooting, sub-variant **L**.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★63 | **337. House Robber III** | Medium | K | The `int[]{withRoot, withoutRoot}` return. The first genuinely two-dimensional state, and the model for everything else in K. |
| ★64 | **979. Distribute Coins in Binary Tree** | Medium | K | The return value is a *surplus* that may be negative, and the cost is `abs(left) + abs(right)`. Teaches that flow across an edge is the thing being counted, not nodes. |
| ★65 | **968. Binary Tree Cameras** | Hard | K | Three states (covered-with-camera / covered-without / uncovered) and a greedy postorder placement. The hardest state design in this document; if you can derive its transition table you can derive any of them. |
| ○66 | 1339. Maximum Product of Splitted Binary Tree | Medium | K | Subtree sums plus a second pass over candidates. Watch the modulus: take it only at the very end, on the maximum. |

#### Why it works — designing the state, the transition and the null value

Three design decisions, in order. The code is short once they are settled and unwriteable before.

1. **Name the states.** What choice does a node make? LC 337: robbed or not. LC 968: uncovered, covered, or holding a camera. The state set must be small and exhaustive.
2. **Name the transition.** How does a parent's state depend on its children's? This is where the constraint lives — *if I rob this node I cannot rob its children*, *a camera here covers my children and my parent*.
3. **Name the null value, per state.** Ask what the **empty** subtree contributes to each state **individually**. In LC 968 an absent child needs no cover, so `null` must be state 1 — return 0 instead and every leaf gets a camera it does not need.
4. **Postorder is forced.** Children's tuples must exist before the parent combines them, and postorder is the only topological order a tree traversal gives you.

> **The design decision that fails silently:** ask what the *empty* subtree contributes to each state **individually**. In LC 968 `null` must be 1 — an absent child needs no cover — otherwise every leaf gets a camera.

**LC 979 counts flow, not nodes.** The return value is a **surplus** and may be negative; `|surplus|` coins must cross the edge to the parent, in either direction. Counting nodes instead of edge traffic is the wrong model and produces a plausible wrong number.

**LC 968's greedy is *place the camera as late as possible*** — at the parent of an uncovered node, because a camera at the parent covers strictly more than one at the child. That argument is what makes the greedy correct rather than merely reasonable.

**The root needs a final check.** `cameras + (cover(root) == 0 ? 1 : 0)` — the root has no parent to cover it, so it can finish uncovered.

#### Walkthrough — LC 337 — the two-state tuple

Each node returns `{rob, skip}`. A robbed node forces both children to be skipped; a skipped node lets each child take its own better option.

```
        3
       / \
      2   3
       \   \
        3   1
```

| # | Node | children return | rob = val + sum(child skips) | skip = sum(max of child) |
|---|---|---|---|---|
| 1 | leaf 3 | -- | `3` | `0` |
| 2 | leaf 1 | -- | `1` | `0` |
| 3 | 2 | `{3, 0}` | `2 + 0` = **2** | `max(3,0)` = **3** |
| 4 | right 3 | `{1, 0}` | `3 + 0` = **3** | `max(1,0)` = **1** |
| 5 | root 3 | `{2,3}` and `{3,1}` | `3 + 3 + 1` = **7** | `max(2,3) + max(3,1)` = **6** |

Answer `max(7, 6) = 7`. Row 5 shows why one number per node would not do: the root's *rob* value needs its children's **skip** entries specifically, not their best. Collapse the tuple to a single best-so-far and that information is gone.

#### Key observations — what interviewers are listening for

- **Design the three parts before writing any code.** States, transition, null-per-state. The gate for LC 968 asks you to do exactly that from scratch, without recalling the code.
- **The null value is per state, not per problem.** Asking *what does the empty subtree contribute to this state* separately for each entry is what prevents the leaf off-by-one.
- **Justify the greedy, do not assert it.** *A camera at the parent covers strictly more than one at the child* is why placing late is optimal. Without that sentence the solution is a guess that happens to pass.
- **Watch for surplus-style returns.** LC 979's negative values confuse people because they expect counts. Naming it *flow across an edge* fixes the model immediately.
- **The root often needs a post-check.** It has no parent, so any state that relies on the parent to resolve must be handled explicitly after the recursion returns.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Wrong identity for `null` in a DP state | off-by-one at every leaf — LC 968 gives a camera to each one. | Ask what the **empty** subtree contributes to each state, individually. |
| Returning one number instead of a tuple | the parent cannot distinguish the child's options, so the constraint cannot be enforced. | One entry per state. The tuple is the whole technique. |
| Counting nodes rather than edge flow in LC 979 | a plausible number that is not the answer. | The return value is a surplus; `|surplus|` coins cross the edge, in either direction. |
| Forgetting the root's final adjustment in LC 968 | the root can end uncovered and the count is one short. | `cameras + (cover(root) == 0 ? 1 : 0)`. |

#### Key takeaway

- **Trigger:** a per-node **choice** with a constraint between parent and child.
- **Design first:** states, transition, and the `null` value **per state**.
- **Return:** a small tuple, one entry per state — never a single collapsed best.
- **LC 968:** place cameras as late as possible; `null` is *covered*; check the root at the end.
- **Gate:** design LC 968's three states, transition and `null` value from scratch — the hardest gate in the document. See [§5.2](#52-tree-recursion).


### L — Rerooting and two-pass DFS

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★67 | **834. Sum of Distances in Tree** | Hard | L | The one problem that proves a single DFS is not enough. Pass 1 computes subtree sizes and the root's answer bottom-up; pass 2 derives every child's answer from its parent's in O(1): `ans[c] = ans[p] + (n - 2 * size[c])`. Derive that formula, don't memorize it. |
| ○68 | 310. Minimum Height Trees | Medium | L | Topological leaf-peeling — a different, cheaper way to exploit "every node needs an answer". Good contrast. |

---

### Extra Reps — Tree Recursion (only if a gate fails)

| Problem | Targets |
|---|---|
| 508. Most Frequent Subtree Sum | Bottom-up aggregate feeding a frequency map. |
| 1026. Maximum Difference Between Node and Ancestor | Top-down min/max state, sub-variant D. |
| 863. All Nodes Distance K in Binary Tree | Re-rep of the tree-as-graph transfer if §1.F failed. |
| 1443. Minimum Time to Collect All Apples in a Tree | Tree DP on an adjacency list rather than a `TreeNode`. |
| 2246. Longest Path With Different Adjacent Characters | Sub-variant C on a general tree — the diameter argument again. |
| 545. Boundary of Binary Tree 🔒 | Three separate traversals composed. Free substitute: 199 plus 257. |

---

## 2.3 Templates


### A — Bottom-up aggregate

```java
// INVARIANT: dfs(n) returns a fact about the subtree rooted at n, computed only from facts
//            about its two children. Nothing above n is visible, and nothing needs to be.
// IDENTITY: the null case must be the neutral element of the combining operation —
//           0 for a height or a sum, true for a universal claim, MIN_VALUE for an open max.
int height(TreeNode n) {
    if (n == null) return 0;
    return 1 + Math.max(height(n.left), height(n.right));
}
```

```java
// 110. The sentinel-abort idiom. -1 means "a subtree below is already unbalanced", which
//      short-circuits everything above it: O(n) instead of the naive O(n log n).
int balancedHeight(TreeNode n) {
    if (n == null) return 0;
    int l = balancedHeight(n.left);  if (l < 0) return -1;
    int r = balancedHeight(n.right); if (r < 0) return -1;
    return Math.abs(l - r) > 1 ? -1 : 1 + Math.max(l, r);
}
```

```java
// 222. "Complete" is the algorithm, not decoration. Equal spine heights ⇒ the subtree is
//      perfect ⇒ 2^h - 1 nodes with no traversal at all. Otherwise exactly one of the two
//      recursive calls goes deep, so the total is O(log^2 n).
int countNodes(TreeNode root) {
    if (root == null) return 0;
    int lh = spine(root, true), rh = spine(root, false);
    if (lh == rh) return (1 << lh) - 1;
    return 1 + countNodes(root.left) + countNodes(root.right);
}

int spine(TreeNode n, boolean left) {
    int h = 0;
    while (n != null) { h++; n = left ? n.left : n.right; }
    return h;
}
```

### B — Parallel recursion on two trees

```java
// The three-case base is the whole template. "a == b" covers both-null in one line and is
// the only place two nulls are allowed to be equal.
boolean same(TreeNode a, TreeNode b) {
    if (a == null || b == null) return a == b;
    return a.val == b.val && same(a.left, b.left) && same(a.right, b.right);
}

// 101. Identical machine, CROSSED pairing. The pairing rule is a parameter, not a law.
boolean mirror(TreeNode a, TreeNode b) {
    if (a == null || b == null) return a == b;
    return a.val == b.val && mirror(a.left, b.right) && mirror(a.right, b.left);
}
```

### C — Augmented return: record ≠ return

> **Intuition.** The value you **record** and the value you **return** are two different quantities. Confusing them produces answers that look right and are not.

**Mental model.** *"At this node I can measure the best path that *bends* here — but a bend is useless to my parent, because it has already spent both of my sides. What my parent can use is a path that still *continues upward*. So I record one and return the other."*

This is where interviews are lost. In LC 543 and 124 the recorded value (a path through the node) and the returned value (a path ending at the node, usable by the parent) are genuinely different quantities, and returning the recorded one gives plausible-looking wrong answers.

Say it out loud before coding: **record the bend, return the continuation.**

```
   543  Diameter -- THE distinction of Pattern 2

       RECORD   left + right              the path that BENDS at this node
                                          -- uses BOTH sides, so a parent cannot extend it
       RETURN   1 + max(left, right)      the path that CONTINUES upward
                                          -- the only thing a parent can build on

   124  Maximum path sum = 543 plus one clamp

       RETURN   node.val + max(0, max(left, right))
                            ^^^^^^ "a branch with a negative total is simply not taken"
```

*A bent path has already consumed both of the node's sides, so no ancestor can extend it. That is the whole reason the two values must differ.*

**Recognition — reach for this when:**

- ✓ The best answer might sit **entirely below** the root, bending at some inner node.
- ✓ You catch yourself wanting to return two different things from one function.
- ✓ Words like *diameter*, *maximum path*, *longest path* that need not touch the root.
- ✗ But **not** when the recorded and returned values coincide. Then it is sub-variant **A** and the extra machinery is noise.


```java
// 543. Diameter. THE distinction of Pattern 2:
//   RECORD  left + right       — the path that BENDS at this node; unusable by the parent
//   RETURN  1 + max(left,right)— the path that CONTINUES upward; the only thing a parent wants
// Returning the diameter is the classic wrong answer: a parent cannot build a longer path
// out of a child's bent path, because a bent path already used both of the child's sides.
int best = 0;

int heightForDiameter(TreeNode n) {
    if (n == null) return 0;
    int l = heightForDiameter(n.left), r = heightForDiameter(n.right);
    best = Math.max(best, l + r);
    return 1 + Math.max(l, r);
}
```

```java
// 124. Maximum path sum = 543 plus one clamp.
// Math.max(0, child) encodes "a branch with a negative total is simply not taken".
// Without it, a tree of all-negative values returns a sum of several of them.
int bestSum = Integer.MIN_VALUE;

int gain(TreeNode n) {
    if (n == null) return 0;
    int l = Math.max(0, gain(n.left));
    int r = Math.max(0, gain(n.right));
    bestSum = Math.max(bestSum, n.val + l + r);   // RECORD: the path may bend here
    return n.val + Math.max(l, r);                // RETURN: a path going up cannot bend
}
```

#### Why it works — why a bent path cannot be returned

One argument, and once it lands the whole sub-variant is obvious.

1. **Two different questions at each node.** *What is the best path that passes through this node?* and *what is the best path ending at this node that my parent could extend?* They have different answers.
2. **The bend uses both sides.** `left + right` goes down one child, through the node, and down the other. Every one of the node's connections is now spent.
3. **So a parent cannot extend it.** To reach the node from above, the parent needs the node's upward connection — which a bent path has already used. There is no way to attach.
4. **Hence record one, return the other.** Record `left + right` into a running best; return `1 + max(left, right)`, a path that has one side free and can therefore be continued.

> **Say it out loud before coding:** **record the bend, return the continuation.** Returning the recorded value is the classic wrong answer — a parent cannot build a longer path out of a child's bent path, because a bent path already used both of the child's sides.

**LC 124 is LC 543 plus one clamp.** `Math.max(0, child)` encodes *a branch with a negative total is simply not taken*. Without it, a tree of all-negative values returns a sum of several of them instead of the single least-bad node.

**The clamp belongs on the child's contribution, not on the result.** Clamping the final answer would forbid a legitimately negative maximum on an all-negative tree; clamping the child is what expresses *I may decline this branch*.

#### Walkthrough — LC 543 — where record and return diverge

The best path here bends at node 2, well below the root. Watch the two columns come apart.

```
        1
       / \
      2   3
     / \
    4   5
```

| # | Node | left ht | right ht | RECORD (bend) | RETURN (continue) |
|---|---|---|---|---|---|
| 1 | 4 | 0 | 0 | `0 + 0` = 0 | `1 + max(0,0)` = **1** |
| 2 | 5 | 0 | 0 | 0 | **1** |
| 3 | 2 | 1 | 1 | `1 + 1` = **2** | `1 + max(1,1)` = **2** |
| 4 | 3 | 0 | 0 | 0 | **1** |
| 5 | 1 | 2 | 1 | `2 + 1` = **3**  <- the answer | `1 + max(2,1)` = **3** |

The diameter is **3** edges — the path `4 - 2 - 1 - 3`, recorded at the root in row 5. Row 3 is where the two columns first diverge: node 2 records a bend of 2 — the path `4 - 2 - 5`, already finished — while returning 2 as a continuation, the path `4 - 2`, which still has a free end pointing up. The root can extend the second and could never extend the first.

#### Key observations — what interviewers are listening for

- **This is the sub-variant that decides the pattern.** The gate asks you to state the record/return distinction for LC 543 **unprompted**. Producing the code without the sentence is exactly what it is designed to catch.
- **Name both quantities before writing the function.** *The bend* and *the continuation*. Two names, two lines, and the bug becomes unwriteable.
- **The clamp is a modelling decision.** `max(0, child)` says *I am allowed to decline this branch*. Justify it on an all-negative tree and it stops being a magic zero.
- **A running best is legitimate mutable state.** Recording into a field while returning something else is not a hack — it is what makes one postorder pass sufficient.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Returning the recorded value | plausible but wrong on any tree where the best path bends below the root. | Say it before coding: *record the bend, return the continuation.* |
| Omitting `Math.max(0, child)` in LC 124 | wrong on all-negative trees — it sums several negatives instead of taking the best single node. | A branch with a negative total is never taken. The clamp encodes that. |
| Clamping the recorded answer instead of the child | an all-negative tree wrongly reports 0. | Clamp the **child's contribution**. The answer itself may legitimately be negative. |
| Using one variable for both quantities | the two meanings collide and the bug is invisible on symmetric test trees. | Two names. The compiler cannot catch this one for you. |

#### Key takeaway

- **Trigger:** the best answer may bend at an inner node and never touch the root.
- **The rule:** **record the bend, return the continuation.**
- **LC 543:** record `left + right`; return `1 + max(left, right)`.
- **LC 124:** the same, plus `max(0, child)` — decline branches with negative totals.
- **Gate:** state the distinction for LC 543 unprompted, then write LC 124 with the clamp justified on an all-negative tree. See [§5.2](#52-tree-recursion).


### D — Top-down inherited state

```java
// 1448. The parameter IS the state. Nothing comes back up except a count, and the state is
//       recomputed for each child rather than restored — which is why D needs no backtracking.
int goodNodes(TreeNode n, int maxSoFar) {
    if (n == null) return 0;
    int self = n.val >= maxSoFar ? 1 : 0;
    int m = Math.max(maxSoFar, n.val);
    return self + goodNodes(n.left, m) + goodNodes(n.right, m);
}
// call: goodNodes(root, root.val)  — or Integer.MIN_VALUE; both work, one reads better
```

### E — Root-to-leaf paths with backtracking

```java
// 113. Two rules, both non-negotiable:
//   1. exactly one removeLast() for every addLast(), on EVERY exit path
//   2. record a COPY — new ArrayList<>(path) — or all results alias one list that ends empty
// LEAF: (left == null && right == null). Not "n == null", which is one step past a leaf.
void paths(TreeNode n, int rem, LinkedList<Integer> path, List<List<Integer>> out) {
    if (n == null) return;
    path.addLast(n.val);
    rem -= n.val;
    if (n.left == null && n.right == null && rem == 0) out.add(new ArrayList<>(path));
    paths(n.left,  rem, path, out);
    paths(n.right, rem, path, out);
    path.removeLast();
}
```

### F — Prefix sums on the root path

```java
// 437. This is LC 560 (subarray sum equals K) with the array replaced by the current root path.
// prefix[s] = how many nodes on the CURRENT root path have running sum s.
// The undo is what makes "current root path" true; without it, cousins see each other's sums.
Map<Long, Integer> prefix = new HashMap<>();
int total = 0;

void countPaths(TreeNode n, long cur, int target) {
    if (n == null) return;
    cur += n.val;
    total += prefix.getOrDefault(cur - target, 0);   // count BEFORE inserting: no zero-length path
    prefix.merge(cur, 1, Integer::sum);
    countPaths(n.left,  cur, target);
    countPaths(n.right, cur, target);
    prefix.merge(cur, -1, Integer::sum);             // UNDO on the way up
}
// seed prefix.put(0L, 1) so that a path starting at the root is counted
```

### G — Lowest common ancestor

```java
// 236. Six lines, one real proof.
// If both sides return non-null, p and q are in different subtrees ⇒ n is the split point.
// If only one side returns non-null, it is either the LCA found deeper, or one target that is
// an ancestor of the other — and passing it up is correct in both readings.
TreeNode lca(TreeNode n, TreeNode p, TreeNode q) {
    if (n == null || n == p || n == q) return n;
    TreeNode l = lca(n.left,  p, q);
    TreeNode r = lca(n.right, p, q);
    if (l != null && r != null) return n;
    return l != null ? l : r;
}
```


### H — Construction from traversals

```java
// 105. Preorder gives the root; inorder says how many nodes belong to the left subtree.
// The shared cursor `pre` must be a field: copying it into each frame breaks the ordering.
int pre = 0;
Map<Integer, Integer> pos = new HashMap<>();      // value -> index in inorder

TreeNode buildTree(int[] preorder, int[] inorder) {
    for (int i = 0; i < inorder.length; i++) pos.put(inorder[i], i);
    return build(preorder, 0, inorder.length - 1);
}

TreeNode build(int[] preorder, int lo, int hi) {
    if (lo > hi) return null;                     // empty range, not "lo == hi"
    int v = preorder[pre++];
    TreeNode n = new TreeNode(v);
    int m = pos.get(v);
    n.left  = build(preorder, lo, m - 1);         // LEFT first: preorder emits left before right
    n.right = build(preorder, m + 1, hi);
    return n;
}
```

```java
// 106. Postorder is consumed FROM THE RIGHT, so the right subtree must be built FIRST.
// That single swap is the entire difference from 105. Write them back to back.
int post;                                          // init to postorder.length - 1

TreeNode buildPost(int[] postorder, int lo, int hi, Map<Integer, Integer> pos) {
    if (lo > hi) return null;
    int v = postorder[post--];
    TreeNode n = new TreeNode(v);
    int m = pos.get(v);
    n.right = buildPost(postorder, m + 1, hi, pos);
    n.left  = buildPost(postorder, lo, m - 1, pos);
    return n;
}
```

### I — Serialization

> **Intuition.** The **null markers are the structure**. Preorder with markers is uniquely decodable; preorder alone is not, and inorder is not even with them.

**Mental model.** *"I am writing down the tree so that reading it back is deterministic. The nulls are not padding — they are the only thing that tells the reader where a subtree stops."*

Sub-variant H needed **two** traversals because one was ambiguous. This sub-variant removes the ambiguity a different way: by recording the absences.

Understanding why inorder fails even *with* markers is the part the gate asks for, and it is a genuinely instructive failure.

```
   preorder + null markers        UNIQUELY DECODABLE
       3 , 9 , # , # , 20 , 15 , # , # , 7 , # , #
       the first token is always the root of the next subtree

   preorder ALONE                 ambiguous -- no way to know where a subtree ends

   inorder + markers              STILL fails: the root is somewhere in the MIDDLE
                                  and nothing marks which token it is

   deserialize uses ONE SHARED CURSOR, exactly as in sub-variant H
```

*Preorder works because the root comes first, so the reader always knows what it is looking at. Inorder never establishes that, with or without markers.*

**Recognition — reach for this when:**

- ✓ Encode a tree to a string and decode it back exactly.
- ✓ Structural identity — *are these two subtrees the same shape and values?*
- ✓ Finding duplicate subtrees, which is canonical-form plus a hash map.
- ✗ But **not** inorder, in any form. It cannot locate the root, so it cannot be decoded.


```java
// 297. The null markers ARE the structure. Preorder + markers is uniquely decodable;
//      preorder alone is not, and inorder is not even with markers (it cannot locate the root).
String serialize(TreeNode root) {
    StringBuilder sb = new StringBuilder();
    ser(root, sb);
    return sb.toString();
}

void ser(TreeNode n, StringBuilder sb) {
    if (n == null) { sb.append("#,"); return; }
    sb.append(n.val).append(',');
    ser(n.left, sb);
    ser(n.right, sb);
}

TreeNode deserialize(String data) {
    return des(new ArrayDeque<>(Arrays.asList(data.split(","))));
}

TreeNode des(Deque<String> q) {                    // ONE shared cursor, same order as writing
    String t = q.poll();
    if (t == null || t.equals("#")) return null;
    TreeNode n = new TreeNode(Integer.parseInt(t));
    n.left  = des(q);
    n.right = des(q);
    return n;
}
```

#### Why it works — why preorder plus markers, and nothing else

Three encodings, one of which works. The reasons the other two fail are the content here.

1. **Preorder alone is ambiguous.** `3, 9, 20` could be a left chain, a right chain, or a root with two children. Nothing says where a subtree ends.
2. **Markers supply the boundaries.** A `#` says *this subtree is empty*, which is exactly the missing information. Now every recursive call knows when to stop.
3. **Preorder makes the reader's job deterministic.** The next unread token is always the root of the next subtree, so decoding mirrors encoding exactly — read root, decode left, decode right.
4. **Inorder cannot work even with markers.** The root sits somewhere in the middle of its own encoding, and nothing identifies which token it is. Without knowing the root you cannot split, and without splitting you cannot recurse.

> **The claim the gate asks you to explain:** the null markers **are** the structure. Preorder plus markers is uniquely decodable; preorder alone is not, and inorder is not even with markers, because it cannot locate the root.

**Deserialization uses one shared cursor**, exactly as construction did in sub-variant H, and for exactly the same reason: the left subtree consumes an unknown number of tokens.

**Structural identity is serialization plus a map.** LC 652 canonicalises every subtree to a string and counts them — a direct reuse, and a good sign the sub-variant has landed.

**Delimiters matter more than they look.** `1,2` and `12` must not collide, so separate tokens explicitly rather than concatenating digits.

#### Walkthrough — serializing and reading back a four-node tree

Encoding is a plain preorder walk that emits `#` for null. Decoding reads the same tokens in the same order.

```
        1
       / \
      2   3
         /
        4
```

| # | Encode step | Emits | Decode step | Builds |
|---|---|---|---|---|
| 1 | visit 1 | `1` | read `1` | root 1, then decode its left |
| 2 | visit 2, both children null | `2, #, #` | read `2, #, #` | leaf 2 — both `#` end it |
| 3 | visit 3, left is 4 | `3` | read `3` | node 3; the next token belongs to **its left** |
| 4 | visit 4, both null | `4, #, #` | read `4, #, #` | leaf 4 |
| 5 | 3's right is null | `#` | read `#` | 3's right is empty — subtree complete |

Encoded as `1,2,#,#,3,4,#,#,#`. Row 5 is the marker earning its place: without that final `#` the decoder cannot tell whether node 3 has a right child, and the encoding would describe several different trees. Every `#` removes exactly one ambiguity.

#### Key observations — what interviewers are listening for

- **The markers are data, not padding.** Saying *the nulls are the structure* is the whole insight, and it is what the gate is checking.
- **Be able to reject inorder with a reason.** *It cannot locate the root.* That is a sharper answer than *it does not work*, and it demonstrates you understand what decoding requires.
- **The shared cursor recurs.** Same mechanism as sub-variant H. Noticing the reuse is worth more than the individual problems.
- **Canonical strings enable subtree comparison.** Once a subtree has a unique encoding, *are these equal* and *find duplicates* both become map lookups.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Serialising preorder without null markers | the string describes many different trees; decoding is arbitrary. | The markers are the structure. Emit one per absent child. |
| Trying to use inorder | the decoder cannot find the root and the whole approach collapses. | Preorder puts the root first, which is what makes decoding deterministic. |
| Copying the cursor during deserialization | subtrees decoded from the wrong offset. | One shared cursor, exactly as in sub-variant H. |
| Concatenating values without a delimiter | `1,2` and `12` become indistinguishable. | Emit explicit separators between tokens. |

#### Key takeaway

- **Trigger:** encode and decode a tree, or compare subtrees structurally.
- **The encoding:** preorder **plus null markers** — uniquely decodable.
- **Why not inorder:** it cannot locate the root, with or without markers.
- **Decoding:** one shared cursor, root first, then left, then right.
- **Gate:** explain why preorder needs markers and inorder cannot work, then write serialize/deserialize with one shared cursor. See [§5.2](#52-tree-recursion).


### J — In-place restructuring

```java
// 226. Recurse first, rewire after. Swapping before the calls inverts subtrees twice.
TreeNode invert(TreeNode n) {
    if (n == null) return null;
    TreeNode l = invert(n.left), r = invert(n.right);
    n.left = r; n.right = l;
    return n;
}
```

```java
// 114. Flatten, O(1) space. For each node, splice the left subtree in between the node and
//      its right subtree; the rightmost node of the left subtree inherits the old right chain.
void flatten(TreeNode root) {
    TreeNode cur = root;
    while (cur != null) {
        if (cur.left != null) {
            TreeNode pred = cur.left;
            while (pred.right != null) pred = pred.right;
            pred.right = cur.right;
            cur.right = cur.left;
            cur.left = null;
        }
        cur = cur.right;
    }
}
```

```java
// 117. O(1)-space level order: the level you have ALREADY linked is the queue for the next one.
// The dummy head removes every "is this the first child on the level?" special case.
Node connect(Node root) {
    Node cur = root;
    while (cur != null) {
        Node dummy = new Node(0), tail = dummy;
        for (Node n = cur; n != null; n = n.next) {
            if (n.left  != null) tail = tail.next = n.left;
            if (n.right != null) tail = tail.next = n.right;
        }
        cur = dummy.next;
    }
    return root;
}
```

### K — Tree DP with per-child states

```java
// 337. Return one entry per state: {rob this node, do not rob this node}.
// null returns the identity for BOTH states — an empty subtree contributes nothing either way.
int[] rob(TreeNode n) {
    if (n == null) return new int[]{0, 0};
    int[] l = rob(n.left), r = rob(n.right);
    int with    = n.val + l[1] + r[1];                          // children must be skipped
    int without = Math.max(l[0], l[1]) + Math.max(r[0], r[1]);  // children choose freely
    return new int[]{with, without};
}
// answer: Math.max(rob(root)[0], rob(root)[1])
```

```java
// 979. The return value is a SURPLUS and may be negative. What you count is flow across an
//      edge, not nodes: |surplus| coins must cross the edge to the parent, in either direction.
int moves = 0;

int surplus(TreeNode n) {
    if (n == null) return 0;
    int l = surplus(n.left), r = surplus(n.right);
    moves += Math.abs(l) + Math.abs(r);
    return n.val + l + r - 1;                    // this node keeps exactly one coin
}
```

```java
// 968. Three states, greedy postorder. Place a camera as LATE as possible — at the parent of
//      an uncovered node — because a camera at the parent covers strictly more.
//   0 = uncovered   1 = covered, no camera here   2 = has a camera
// null MUST be 1: an absent child needs no cover, otherwise every leaf gets a camera.
int cameras = 0;

int cover(TreeNode n) {
    if (n == null) return 1;
    int l = cover(n.left), r = cover(n.right);
    if (l == 0 || r == 0) { cameras++; return 2; }   // a child is exposed ⇒ camera HERE
    return (l == 2 || r == 2) ? 1 : 0;
}
// answer: cameras + (cover(root) == 0 ? 1 : 0)   — the root can end up uncovered
```

### L — Rerooting, two passes

> **Intuition.** Every node needs its **own** global answer, and each answer depends on the whole rest of the tree. One DFS cannot do that — so compute the root's answer, then **move the root one edge at a time**.

**Mental model.** *"I know the answer for the root. Now, if I shift the root to one of its children, which distances got shorter and which got longer? Everything in that child's subtree came one step closer; everything else moved one step further."*

This is the only sub-variant where a single DFS is **provably insufficient**, and recognising that is the signature: *every node needs its own answer* means two passes, not a cleverer one.

The whole content of the problem is one line of arithmetic, and the gate asks you to derive it on a blank page.

```
   PASS 1  (postorder)   size[v]  and  ans[root] = sum of distances from the root

   PASS 2  (preorder)    move the root one edge, from p to c:

        size[c] nodes get one step CLOSER
        n - size[c] nodes get one step FURTHER

        ans[c] = ans[p] - size[c] + (n - size[c])
               = ans[p] + n - 2 * size[c]

   derive that line on paper -- it is the only content of the problem
```

*Each term counts something concrete: `- size[c]` is the subtree that came closer, `+ (n - size[c])` is everything else that moved away. The formula is a bookkeeping identity, not a trick.*

**Recognition — reach for this when:**

- ✓ **Every node** needs its own answer, and each depends on the entire tree.
- ✓ A single DFS would be `O(n^2)` — one full traversal per node.
- ✓ Moving the root by one edge changes the answer by a computable delta.
- ✗ But **not** when only the root's answer is wanted. Then one postorder pass is enough and rerooting is overhead.


```java
// 834. Pass 1 (postorder): size[v], and ans[root] = sum of distances from the root.
// Pass 2 (preorder): move the root one edge, from p to c.
//     size[c] nodes get one step CLOSER, the other n - size[c] get one step FURTHER:
//         ans[c] = ans[p] - size[c] + (n - size[c]) = ans[p] + n - 2 * size[c]
// Derive that line on paper. It is the only content of the problem.
int n;
int[] size, ans;
List<List<Integer>> g;

void down(int v, int p) {
    size[v] = 1;
    for (int w : g.get(v)) if (w != p) {
        down(w, v);
        size[v] += size[w];
        ans[v]  += ans[w] + size[w];
    }
}

void up(int v, int p) {
    for (int w : g.get(v)) if (w != p) {
        ans[w] = ans[v] + n - 2 * size[w];
        up(w, v);
    }
}
```


#### Why it works — why one pass cannot work, and the rerooting identity

First the impossibility, then the four-line derivation the gate asks for.

1. **Why one DFS fails.** A node's answer depends on nodes both below **and** above it. A single postorder pass only ever knows about the subtree, so it can compute the root's answer and nothing else.
2. **Pass 1 collects what is local.** A postorder walk gives `size[v]` for every node, and accumulates `ans[root]`, the sum of distances from the root.
3. **Pass 2 moves the root by one edge.** Going from parent `p` to child `c`: every node inside `c`'s subtree is now one step closer, and every node outside it is one step further away.
4. **Which is the identity.** `ans[c] = ans[p] - size[c] + (n - size[c])`, and simplifying gives `ans[c] = ans[p] + n - 2 * size[c]`. A preorder pass propagates it to the whole tree in `O(n)`.

> **Derive this on a blank page, and say what each term counts:** `ans[c] = ans[p] + n - 2 * size[c]` — `size[c]` nodes came one step closer, the other `n - size[c]` moved one step further.

**The direction of the passes is not interchangeable.** Pass 1 must be postorder because sizes aggregate upward; pass 2 must be preorder because each child's answer is derived from its parent's.

**If the derivation will not come, draw a five-node tree and move the root by hand.** The gate says this explicitly — the obstacle is almost never the algebra.

#### Walkthrough — LC 834 — moving the root one edge

A six-node tree, `n = 6`, rooted at 0 with `ans[0] = 8`. Watch the formula applied to each child in turn.

```
        0
       / \
      1   2
         /|\
        3 4 5        n = 6,  ans[0] = 8
```

| # | Move root | size[c] | closer | further | ans[c] |
|---|---|---|---|---|---|
| 1 | 0 → 1 | 1 | 1 node | 5 nodes | `8 + 6 - 2(1)` = **12** |
| 2 | 0 → 2 | 4 | 4 nodes | 2 nodes | `8 + 6 - 2(4)` = **6** |
| 3 | 2 → 3 | 1 | 1 node | 5 nodes | `6 + 6 - 2(1)` = **10** |
| 4 | 2 → 4 | 1 | 1 node | 5 nodes | **10** |
| 5 | 2 → 5 | 1 | 1 node | 5 nodes | **10** |

Answers `[8, 12, 6, 10, 10, 10]`. Row 2 is the interesting one: moving the root **towards** the bigger subtree lowers the total, because four nodes got closer and only two got further. Row 1 moves towards a leaf and the total rises for the mirror-image reason. The formula is just that trade, written down.

#### Key observations — what interviewers are listening for

- **The recognition is the hard part.** *Every node needs its own answer* is the signature of rerooting. Spotting it before writing an `O(n^2)` solution is what the sub-variant is for.
- **Derive the identity, never recall it.** The gate asks for a blank-page derivation **and** for what each term counts. The second half is what shows it is understood.
- **The pass directions are forced.** Postorder up for sizes, preorder down for answers. Neither can be swapped, and saying why is a clean way to show you see the dependency structure.
- **Drawing beats algebra when stuck.** Five nodes, move the root by hand, count. The formula falls out and then stays.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| One DFS for a *every node needs its own answer* problem | `O(n^2)` and a time-limit failure. | That is the signature of rerooting: two passes. |
| Getting the sign wrong in the identity | answers drift further from correct the deeper you go. | `- size[c]` for the subtree that came closer, `+ (n - size[c])` for everything else. |
| Running pass 2 in postorder | a child's answer is computed before its parent's exists. | Pass 2 is preorder — the parent's answer is the input to the child's. |
| Forgetting that `size` includes the node itself | off-by-one in every delta. | `size[v]` counts `v` plus all its descendants. |

#### Key takeaway

- **Trigger:** every node needs its own answer, each depending on the whole tree.
- **Two passes:** postorder for `size[]` and `ans[root]`; preorder to propagate.
- **The identity:** `ans[c] = ans[p] + n - 2 * size[c]`.
- **What it counts:** `size[c]` nodes came closer; `n - size[c]` moved further.
- **Gate:** derive that line on a blank page and say what each term counts. See [§5.2](#52-tree-recursion).

---

## 2.4 Failure Modes — Tree Recursion

| # | Bug | Symptom | Prevention |
|---|---|---|---|
| 1 | Returning the recorded value in 543 / 124 | Plausible but wrong on any tree where the best path bends below the root | Say it out loud before coding: *record the bend, return the continuation.* |
| 2 | Omitting `Math.max(0, child)` in 124 | Wrong on all-negative trees | A branch with a negative total is never taken. The clamp encodes that. |
| 3 | Treating `n == null` as the leaf condition | Root-to-leaf answers counted twice, or half-paths accepted | A leaf is `left == null && right == null`. Both tests exist and mean different things. |
| 4 | `addLast` without a matching `removeLast` | Paths from one branch leak into the next | One undo per mutation, placed after *all* recursive calls, on every exit path. |
| 5 | Recording the path list instead of a copy | Every result is the same (empty) list | `new ArrayList<>(path)` at the moment of recording. |
| 6 | Prefix map not decremented on the way up | Overcounts paths that span two branches | The decrement is the last statement of the DFS body. |
| 7 | Prefix map missing the `{0: 1}` seed | Misses every path that starts at the root | Seed before the first call, not inside it. |
| 8 | Copying the `pre` cursor into each frame in 105 | Subtrees built from the wrong slice | The cursor is shared state: a field, or an `int[1]`. |
| 9 | Building the left subtree first in 106 | Mirrored tree, no exception thrown | Postorder is consumed from the right ⇒ right subtree first. |
| 10 | Swapping children before recursing in 226 | Double inversion; the tree comes back unchanged in some shapes | Recurse, then rewire. |
| 11 | Wrong identity for `null` in a DP state | Off-by-one at every leaf (968 gives a camera to each leaf) | Ask what the *empty* subtree contributes to each state, individually. |
| 12 | `int` sums on 129 / 1339 / 437 | Silent overflow on deep or wide trees | Accumulate in `long`; take the modulus only at the end. |
| 13 | Recomputing height inside an outer traversal (110) | O(n log n) on balanced trees, O(n²) on skewed ones | Use the `-1` sentinel and one pass. |
| 14 | Assuming both targets exist in 236 | Wrong answer when one is absent | Say the assumption out loud; if unstated, return a found-flag pair. |
| 15 | One DFS for a "every node needs its own answer" problem | O(n²), TLE | That is the signature of rerooting: two passes, §2.L. |

---
---

# PATTERN 3 — BINARY SEARCH TREES

## 3.1 Pattern Breakdown

A BST is a binary tree plus one promise: **for every node, everything in the left subtree is smaller and everything in the right subtree is larger.** The promise is worth exactly two things, and everything in this pattern is one of them.

1. **You may skip a subtree.** Comparing once tells you an entire half is irrelevant — this is binary search with pointers instead of indices, and it is why `search`, `insert`, `delete`, `range`, and `LCA` are all O(h).
2. **Inorder is sorted.** Any question about *order statistics* — k-th, successor, closest, minimum difference, mode — becomes a question about a sorted sequence you never have to materialise.

The failure mode that defines the pattern: **the promise is about whole subtrees, not about parent–child pairs.** A node can be larger than its parent and still violate the BST property. That single sentence is problem #72.

| # | Sub-variant | What the ordering buys | Cost |
|---|---|---|---|
| **A** | **Search on the ordering** | one comparison discards a subtree | O(h) |
| **B** | **Validation with an inherited range** | `(low, high)` narrows as you descend | O(n) |
| **C** | **Inorder is sorted** | order statistics without sorting | O(n), O(h) space |
| **D** | **Successor / predecessor** | the descent remembers the last left turn | O(h) |
| **E** | **Insert and delete** | structural edit that preserves the promise | O(h) |
| **F** | **Construction** | a sorted input already encodes the shape | O(n) |
| **G** | **Range queries and pruning** | whole subtrees fall outside the range | O(h + k) |
| **H** | **BST as an ordered container** | `TreeMap` / `TreeSet` — floor, ceiling, headMap | O(log n) per op |

**Sub-variants worth stating explicitly:**
- **B** and **C** are two different correct answers to the same question (validation), and knowing both is the point: the range version is top-down, the inorder version is bottom-up, and the inorder version generalises to *"is this sequence sorted?"* problems that the range version cannot express.
- **D** is the one BST operation people cannot reconstruct under pressure, because the answer lives in a variable updated during the descent rather than at the node where you stop.
- **G** — pruning — is where the ordering pays for itself twice: one comparison per node decides whether to recurse at all.
- **H** is not really "trees" but it is where BSTs actually appear in production code, and it is the bridge to the ordered-multiset sliding windows in the companion document.

---

## 3.2 Problem Table

### A — The ordering invariant and search

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★69 | **700. Search in a Binary Search Tree** | Easy | A | The atom. Iterative in four lines, and it should be iterative — the recursion buys nothing here. |
| ★70 | **235. Lowest Common Ancestor of a Binary Search Tree** | Medium | A | The first place the ordering *replaces* an algorithm: no upward search, no post-processing. Descend while both targets are on the same side; the first node that splits them is the answer. Compare with #48 and notice how much machinery vanishes. |
| ○71 | 270. Closest Binary Search Tree Value 🔒 | Easy | A | Track the best while descending. Free substitute: **2476. Closest Nodes Queries in a Binary Search Tree**. |

### B — Validation with an inherited range

> **Intuition.** The BST property constrains a node against **every ancestor**, not just its parent. So carry the allowed range down with you, narrowing it at every step.

**Mental model.** *"I arrive at this node already knowing the window it is allowed to occupy. Going left tightens the ceiling; going right tightens the floor. If the node is outside its window, the tree is not a BST."*

This is the failure mode that **defines** the pattern: a node can be larger than its parent and still violate the property, because it also has to respect a grandparent it never compares against.

There are **two** correct answers here, and knowing both is the point — the range version is top-down, the inorder version is bottom-up, and the inorder one generalises to *is this sequence sorted?* problems the range version cannot express.

```
   THE TRAP -- valid against the parent, invalid against a grandparent:

            5
           / \
          1   4        4 < 5 ok, but 4 is in the RIGHT subtree of 5
             / \       and 3 < 5 -- so this is NOT a BST
            3   6

   RANGE version (top-down):  bounds narrow monotonically as you descend
       going LEFT  tightens the HIGH bound
       going RIGHT tightens the LOW bound
       call: valid(root, Long.MIN_VALUE, Long.MAX_VALUE)

   INORDER version (bottom-up): inorder must be STRICTLY increasing
       no bounds arithmetic, and it generalises to "is this traversal sorted?"
```

*Use `long` bounds, never `Integer.MIN_VALUE` sentinels — node values may legitimately *be* `Integer.MIN_VALUE`, and the sentinel then rejects a valid tree.*

**Recognition — reach for this when:**

- ✓ Verify that a tree **is** a BST, or that some ordering constraint holds throughout.
- ✓ A property that must hold against all ancestors, not just the immediate parent.
- ✓ Or: a question phrased as *is this traversal sorted?*, which suits the inorder form.
- ✗ But **not** if you only compare each node to its parent. That is the bug this sub-variant exists to prevent.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ⚠72 | **98. Validate Binary Search Tree** | Medium | B | The single most instructive trap in trees. Comparing each node to its parent passes on trees that are not BSTs — the property constrains a node against *every* ancestor, not the nearest one. Pass `(low, high)` down as `Long` bounds, or validate by checking the inorder sequence is strictly increasing. Know both, and know why `Integer.MIN_VALUE` as a sentinel is a bug. |
| ○73 | 255. Verify Preorder Sequence in Binary Search Tree 🔒 | Medium | B | The same range logic against a stream instead of a tree. Free substitute: **1008**, which builds the tree the same way. |

#### Why it works — why parent comparison is not enough, and two ways to fix it

One counterexample, then the two standard repairs — which are worth knowing as a pair.

1. **The property is about subtrees.** *Everything* in the right subtree of 5 must exceed 5 — not just 5's immediate right child. A node three levels down is still bound by that constraint.
2. **So parent comparison accepts invalid trees.** In the diagram, 3 is a valid left child of 4, and 4 is a valid right child of 5 — yet 3 sits in 5's right subtree while being smaller than 5. Every local check passes.
3. **The range fix, top-down.** Carry `(low, high)`. Descending left replaces `high` with the node's value; descending right replaces `low`. The bounds narrow monotonically, so every ancestor's constraint is still enforced at the bottom.
4. **The inorder fix, bottom-up.** A tree is a BST exactly when its inorder traversal is strictly increasing. Keep one `prev` node and compare. No arithmetic, and it extends to any *is this sequence sorted* question.

> **The sentence that defines the pattern's failure mode:** the promise is about **whole subtrees, not about parent-child pairs**. A node can be larger than its parent and still violate the BST property.

**`Integer.MIN_VALUE` sentinels are a bug, not a shortcut.** A node may legitimately hold that value, and the comparison then fails on a perfectly valid tree. Use `long` bounds, or the nullable `prev` node of the inorder version.

**State the duplicate policy before coding.** LeetCode's BSTs are strict, so `<=` where `<` belongs silently accepts duplicates. It is a one-character difference and a real correctness decision.

#### Walkthrough — LC 98 — the tree that passes every local check

The counterexample from above. Every parent-child pair is fine; the inherited range catches it anyway.

```
        5
       / \
      1   4
         / \
        3   6
```

| # | Node | Inherited (low, high) | Parent check | Range check |
|---|---|---|---|---|
| 1 | 5 | `(-inf, +inf)` | -- | ok |
| 2 | 1 | `(-inf, 5)` | 1 < 5, ok | ok |
| 3 | 4 | `(5, +inf)` | 4 > ... **parent is 5**, so 4 < 5 | already fails: `4 > 5` is false |
| 4 | 3 | `(5, 4)` | 3 < 4, **looks fine** | **fails**: `3 > 5` is false |

Not a BST. Row 4 is the whole lesson: node 3 is a perfectly legal left child of 4, and a parent-only check waves it through. The inherited `low = 5` — set three levels up, when the descent turned right at the root — is what catches it. Note also that row 3 already fails; the example is drawn so that both the immediate and the distant violation are visible.

#### Key observations — what interviewers are listening for

- **Know both solutions, deliberately.** The gate asks for LC 98 **both ways**. They are not redundant: the range form is top-down arithmetic, the inorder form is a bottom-up scan that generalises further.
- **The sentinel bug is worth naming.** *Node values may be `Integer.MIN_VALUE`* is a concrete reason, not a stylistic preference. The gate asks you to explain it.
- **Bounds narrow monotonically.** That monotonicity is what makes the top-down version correct — each step can only tighten, never loosen, so ancestor constraints survive to the leaves.
- **The inorder form has a wider reach.** Anything phrased as *is this traversal sorted* becomes the same three lines with a different predicate.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Validating against the parent only | accepts trees that are not BSTs. | The property is about ancestors, not parents. Inherit `(low, high)`. |
| `Integer.MIN_VALUE` / `MAX_VALUE` as sentinels | fails on trees containing those exact values. | Use `long` bounds, or a nullable `prev` node in the inorder version. |
| `<=` instead of `<` | accepts duplicates. | LeetCode's BSTs are strict. State the duplicate policy before coding. |
| Comparing `prev` by value when it may be unset | a null dereference on the leftmost node. | `prev` starts null and the first comparison is skipped — that is what makes the nullable form work. |

#### Key takeaway

- **Trigger:** verify the BST property, or any all-ancestors ordering constraint.
- **The trap:** parent comparison passes on trees that are not BSTs.
- **Range form:** inherit `(low, high)`; left tightens high, right tightens low.
- **Inorder form:** the traversal must be **strictly** increasing; keep one `prev`.
- **Gate:** LC 98 both ways, plus why `Integer.MIN_VALUE` sentinels are a bug. The foundation gate. See [§5.3](#53-binary-search-trees).


### C — Inorder is sorted

> **Intuition.** The second thing the ordering buys: **inorder is a sorted sequence**. Every order-statistic question — k-th, closest, minimum gap, mode — becomes a scan over a sorted array you never have to build.

**Mental model.** *"I am not walking a tree. I am walking a sorted list that happens to be stored as a tree, and one variable holding the previous element turns it into an ordinary scan."*

This is the one sub-variant where visiting both children unconditionally is **correct** — the whole point is to produce the full sorted order. Everywhere else in this pattern, that would mean you discarded the ordering.

One variable does most of the work: `prev`, the previously visited node. It converts inorder into a pairwise scan, which is what makes LC 530 and LC 99 short.

```
   inorder over a BST  ==  the sorted sequence, without materialising it

   230  k-th smallest:   count during inorder, STOP the moment you reach k
        without the early exit you have "sort the tree and index it",
        which is the wrong complexity story

   530  minimum difference:  the minimum gap is between INORDER-ADJACENT nodes only
        so one `prev` variable suffices -- never compare all pairs

   99   recover a swapped BST -- look for INVERSIONS:
            first  = the LEFT  element of the FIRST inversion
            second = the RIGHT element of the LAST  inversion
        (they coincide when the swapped nodes are adjacent)
```

*Two inversions when the swapped nodes are far apart, one when they are adjacent. Tracking only the first inversion is the classic wrong answer.*

**Recognition — reach for this when:**

- ✓ An **order statistic** — k-th smallest, closest value, minimum difference, mode.
- ✓ A question about adjacency in sorted order.
- ✓ Detecting that the sorted order has been disturbed, as in LC 99.
- ✗ But **not** when a comparison could prune. If one side can be eliminated, use **A** or **G** and stay `O(h)`.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★74 | **230. Kth Smallest Element in a BST** | Medium | C | Counting during inorder with an early exit. The follow-up — "the tree is modified often, optimise `kthSmallest`" — wants a subtree-size field on each node; have the answer ready. |
| ★75 | **530. Minimum Absolute Difference in BST** | Easy | C | The minimum difference can only occur between *inorder-adjacent* nodes. Once you see that, the problem is a one-variable scan; without it, it looks like it needs every pair. |
| ★76 | **99. Recover Binary Search Tree** | Medium | C + §1.G | Two nodes swapped means one or two inversions in the inorder sequence; the first inversion's left element and the last inversion's right element are the culprits. The stated follow-up is O(1) space, which is exactly what Morris traversal is for. |
| ○77 | 501. Find Mode in Binary Search Tree | Easy | C | Streaming mode over a sorted sequence with O(1) extra space. Fiddly bookkeeping, no new idea. |
| ○78 | 897. Increasing Order Search Tree | Easy | C | Inorder rewiring in place. Pleasant, rarely asked. |

#### Why it works — what one `prev` variable buys

Three problems, one mechanism, and one complexity argument that has to be made explicitly.

1. **Inorder over a BST is sorted.** Left subtree, node, right subtree — and everything left is smaller, everything right larger. The sequence comes out ascending by construction.
2. **So adjacency in the traversal is adjacency in sorted order.** The minimum difference between any two values is therefore between **inorder-adjacent** nodes only. Comparing all pairs is `O(n^2)` for information a single scan already has.
3. **One `prev` node makes it a scan.** Hold the previously visited node and compare on arrival. That is the whole machinery for LC 530 and LC 99.
4. **LC 99 needs two inversions, not one.** If the swapped nodes are adjacent there is one inversion; if they are far apart there are two. Take `first` from the **first** inversion's left element and `second` from the **last** inversion's right element, and both cases are covered.

> **The sentence the gate asks for unprompted:** **the minimum difference is between inorder-adjacent nodes.** Once that is said, LC 530 is a three-line scan and comparing all pairs stops being tempting.

**LC 230's early exit is the point, not an optimisation.** Stop as soon as the counter reaches `k`. Without it you have *sort the tree and index it*, which answers the question with the wrong complexity story — and the natural follow-up is the subtree-size augmentation, which makes repeated queries `O(h)`.

**Reverse inorder is a descending scan for free.** Right, node, left — used by LC 538 to accumulate a running suffix sum without any extra structure.

#### Walkthrough — LC 99 — two inversions, far apart

The inorder sequence should be `1 2 3 4`. Nodes 3 and 1 have been swapped, so the traversal reads `3 2 1 4` — two separate inversions.

```
   inorder reads:   3   2   1   4
                    ^^^^^       first inversion  (3 > 2)
                        ^^^^^   last  inversion  (2 > 1)
```

| # | prev | current | Inversion? | Record |
|---|---|---|---|---|
| 1 | -- | 3 | no (first node) | -- |
| 2 | 3 | 2 | **yes**, `3 > 2` | `first = 3` (the **left** element) |
| 3 | 2 | 1 | **yes**, `2 > 1` | `second = 1` (the **right** element, from the LAST inversion) |
| 4 | 1 | 4 | no | -- |

Swap 3 and 1 and the tree is repaired. Row 3 is why one inversion is not enough: had you stopped after the first, you would swap 3 and 2 and produce `2 3 1 4`, which is still broken. When the swapped nodes are **adjacent** there is only one inversion, and `first` and `second` both come from it — which is why the same rule covers both cases.

#### Key observations — what interviewers are listening for

- **This is the sub-variant where visiting both children is right.** Everywhere else in this pattern that means you threw the ordering away. Here it is the point, and knowing the difference is what §3.1 is warning about.
- **`prev` is the whole technique.** One nullable node variable turns a tree walk into a sorted-sequence scan. Recognising that collapses three problems into one idea.
- **Say the adjacency claim before writing LC 530.** *The minimum gap is between inorder-adjacent nodes.* The gate asks for it unprompted, and it is what rules out the `O(n^2)` approach.
- **The early exit changes the complexity story.** Without it, LC 230 is a full traversal. With it — and with the subtree-size follow-up — it is a genuinely different answer.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Comparing all pairs for the minimum difference | `O(n^2)` for information a single inorder scan already contains. | In a BST the minimum gap is between inorder-adjacent nodes only. |
| `kthSmallest` without an early exit | a full `O(n)` traversal, and a bad follow-up conversation. | Stop as soon as the counter reaches `k`; mention the subtree-size augmentation. |
| Recovering a swapped BST by tracking one inversion | wrong whenever the swapped nodes are not adjacent. | `first` from the **first** inversion, `second` from the **last**. |
| Materialising the inorder list | `O(n)` extra space for a scan that needs one variable. | Hold `prev` and compare on arrival. |

#### Key takeaway

- **Trigger:** an order statistic — k-th, closest, minimum gap, mode.
- **The fact:** inorder over a BST is the sorted sequence.
- **The tool:** one `prev` node turns the walk into a pairwise scan.
- **LC 99:** `first` from the first inversion, `second` from the last.
- **Gate:** state the inorder-adjacency claim unprompted, and describe LC 99's two-inversion rule from memory. See [§5.3](#53-binary-search-trees).


### D — Successor and predecessor

> **Intuition.** The successor is **not** at the node you stop on. It is the last node you turned **left** from — and that is why people cannot reconstruct this one under pressure.

**Mental model.** *"As I descend, every time I go left I am passing a node that is bigger than my target. The deepest such node is the closest thing above the target, so I remember it. If the target turns out to have a right subtree, that subtree's minimum beats it."*

This is the one BST operation people cannot rebuild from memory, and the reason is structural: **the answer lives in a variable updated during the descent**, not at the node where the search stops.

Two cases, and the second is the one that catches people. If the node **has** a right subtree, the successor is that subtree's minimum. If it does not, the answer is the remembered left-turn.

```
   descending towards the target:

       go RIGHT  ->  this node is SMALLER than the target, useless as a successor
       go LEFT   ->  this node is LARGER  than the target  ->  REMEMBER IT

   the answer is the LAST node you turned left from
   -- the deepest ancestor still greater than the target

   BUT if the target has a RIGHT subtree,
       the successor is that subtree's MINIMUM instead (it is closer)

   the answer is in a VARIABLE, not at the node you stopped on
```

*Reading the answer off the stopping node works only when that node happens to have a right child. Every other case needs the remembered turn.*

**Recognition — reach for this when:**

- ✓ Next-larger or next-smaller **in sorted order**, given a node or a value.
- ✓ Iterator-style traversal of a BST, where `next()` is exactly successor.
- ✓ *Closest value* questions, which are a successor and predecessor comparison.
- ✗ But **not** if you have the whole inorder sequence already. Then adjacency is direct and this machinery is unnecessary.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★79 | **285. Inorder Successor in BST** 🔒 | Medium | D | The answer is not at the node you stop on — it is the last node from which you turned *left*. That is a one-variable descent, and almost nobody reconstructs it correctly the first time. Free substitute: **173. Binary Search Tree Iterator**, which is the same idea with the state made explicit. |
| ○80 | 510. Inorder Successor in BST II 🔒 | Medium | D | With parent pointers and no root, the two cases split cleanly. Free substitute: reason it through on paper against #79. |

#### Why it works — why the answer is a remembered turn

Two cases. The first is easy and the second is the reason this sub-variant exists.

1. **Turning right tells you nothing useful.** Going right means the current node is smaller than the target. A smaller node can never be the successor, so it is discarded.
2. **Turning left records a candidate.** Going left means the current node is **larger** than the target. It is therefore an upper bound — and each subsequent left turn is a tighter one, so the last is the best.
3. **Case 1: the target has a right subtree.** Then the successor is inside it — specifically its minimum, the leftmost node. That is closer to the target than any ancestor could be.
4. **Case 2: no right subtree.** Nothing below the target is larger, so the answer must be above it — and it is exactly the deepest ancestor from which the descent turned left.

> **The sentence to have ready:** the successor is the **last node from which you turned left** — the deepest ancestor still greater than the target. It is not the node you stopped on.

**Predecessor is the exact mirror.** Remember right turns instead, and if the target has a left subtree take that subtree's maximum.

**LC 173's iterator is this operation repeated.** A stack of not-yet-returned ancestors is the same *remembered left turns* idea, made persistent between calls — see Pattern 1 B.

#### Walkthrough — successor of 5, which has no right child

The target is a leaf, so the answer cannot be below it. Watch the `remembered` column.

```
        8
       / \
      4   12
     / \
    2   6
       / \
      5   7        target = 5
```

| # | At | 5 vs node | Turn | Remembered |
|---|---|---|---|---|
| 1 | 8 | 5 < 8 | **left** | **8** |
| 2 | 4 | 5 > 4 | right | 8 |
| 3 | 6 | 5 < 6 | **left** | **6**  <- tighter bound |
| 4 | 5 | found, no right child | -- | 6 |

Successor is **6**. The descent stopped at node 5, and 5 has no right child — so the answer had to come from the remembered variable. Notice how row 3 tightened the bound from 8 to 6: each left turn is a better upper bound than the last. Read the answer off the stopping node instead and you get nothing at all.

#### Key observations — what interviewers are listening for

- **The answer is in a variable, and say so.** The gate asks you to explain why it is the last left-turn rather than the stopping node. That framing is the whole sub-variant.
- **Hand-trace a target with no right child.** The gate names this case specifically, because it is the one where the naive reading fails.
- **Each left turn tightens the bound.** Which is why the **last** one is the answer and not the first. Worth stating — it explains why a single variable suffices.
- **Predecessor is not a separate skill.** Mirror the turns and the subtree. Deriving it from successor rather than memorising it separately is the sign the idea has landed.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Reading the successor off the stopping node | wrong answer whenever the node has no right child. | The answer is the last node you turned left from; track it in a variable. |
| Forgetting the right-subtree case | you return a distant ancestor when a much closer node exists below. | If the target has a right subtree, the successor is that subtree's minimum. |
| Remembering the first left turn instead of the last | an upper bound, but not the tightest one. | Overwrite on every left turn. The deepest one wins. |
| Materialising the inorder sequence to find it | `O(n)` time and space for an `O(h)` operation. | The descent already carries the information. |

#### Key takeaway

- **Trigger:** next-larger or next-smaller in sorted order; iterator `next()`.
- **The rule:** the answer is the **last left turn**, held in a variable.
- **Exception:** if the target has a right subtree, take that subtree's minimum.
- **Predecessor:** the exact mirror — remember right turns, take the left subtree's maximum.
- **Gate:** successor blind, plus why the answer is the last left-turn rather than the stopping node. See [§5.3](#53-binary-search-trees).


### E — Insert and delete

> **Intuition.** Structural edits that **preserve the promise**. Insertion is always at a null leaf; deletion has three cases, and only the third is hard.

**Mental model.** *"I descend to where the node belongs, then hand the rewired subtree back to my caller. The parent reattaches whatever I return, so I never need a parent pointer and never special-case the root."*

The **return the subtree** idiom is what makes both operations short. Each call returns the new root of the subtree it was given, and the parent simply assigns it — so rewiring happens automatically at every level.

Deletion's two-child case is the one worth understanding rather than memorising, because the obvious pointer-splicing approach is wrong in a way that only shows up later.

```
   701 INSERT   always lands at a NULL leaf -- descend by comparison, attach

   450 DELETE   three cases, and the third is the only hard one:

       0 children  ->  return null
       1 child     ->  return that child
       2 children  ->  copy the inorder SUCCESSOR's value into this node,
                       then RECURSIVELY DELETE that successor
                       from the right subtree

   the "return the subtree" idiom makes the PARENT rewire itself
       node.left  = delete(node.left,  key)
       node.right = delete(node.right, key)
   -> no parent pointer, no special case for the root
```

*Recursing into the right subtree to remove the successor keeps every invariant intact. Splicing pointers by hand does not — it leaves a corrupt tree that fails on the *next* operation.*

**Recognition — reach for this when:**

- ✓ Structural modification of a BST — insert, delete, or both.
- ✓ The tree must remain a valid BST afterwards.
- ✓ You want `O(h)` without maintaining parent pointers.
- ✗ But **not** when the tree must stay balanced. That is an AVL or red-black rotation, a different subject.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★81 | **701. Insert into a Binary Search Tree** | Medium | E | Insertion is always at a null leaf — no rebalancing, no case analysis. Return-the-subtree recursion makes rewiring automatic; learn that idiom here because #82 depends on it. |
| ★82 | **450. Delete Node in a BST** | Medium | E | The only structurally hard BST operation. Zero children, one child, two children — and in the two-child case you replace the value with the inorder successor and then delete *that* node from the right subtree. Get this and E is closed. |

#### Why it works — the three delete cases, and why the third recurses

Two easy cases and one that people get wrong in a specific, delayed-failure way.

1. **Insertion is always at a leaf.** Descend by comparison until you fall off the tree. The null position you reach is exactly where the value belongs, so there is no restructuring to do.
2. **Delete, no children.** Return `null`. The parent's assignment does the detaching for you.
3. **Delete, one child.** Return that child. Everything in it already satisfies the ordering relative to the parent, because it satisfied it relative to the node being removed.
4. **Delete, two children.** You cannot simply return one child — the other would be orphaned. So copy the **inorder successor's** value into this node (it is the smallest value larger than everything on the left, so the ordering still holds), then delete that successor from the right subtree **recursively**. The successor has at most one child, so that deletion is one of the easy cases.

> **Why the two-child case recurses instead of splicing:** copy the successor's value, then **recursively delete the successor**. Recursing keeps the invariant at every level; splicing pointers by hand produces a corrupt tree that fails on the next operation rather than this one.

**The successor always has at most one child.** It is the leftmost node of the right subtree, so it has no left child by definition — which is why the recursive delete terminates in one of the easy cases and cannot recurse indefinitely.

**The predecessor works equally well.** Copying the largest value from the left subtree is symmetric and equally correct; pick one and be consistent.

#### Walkthrough — LC 450 — deleting a node with two children

Delete 5, which has both children. Watch the value get copied down and the successor removed from below.

```
        5
       / \
      3   6
     / \   \
    2   4   7        delete 5
```

| # | Step | Detail |
|---|---|---|
| 1 | locate 5 | the root; it has **two** children, so case three applies |
| 2 | find the inorder successor | leftmost node of the right subtree → **6** |
| 3 | copy the value | the root becomes **6**; the tree is momentarily invalid (two 6s) |
| 4 | recursively delete 6 | from the **right** subtree — and that 6 has one child (7), so it is the easy case |
| 5 | result | `6` at the root, right subtree is now just `7`; ordering intact throughout |

Final tree: root 6, left subtree `3(2,4)`, right child 7. Step 4 is the reason for recursion — the successor had a right child, and splicing pointers by hand would have dropped it. Because the successor is the *leftmost* node of the right subtree, it can never have a left child, so the recursive call always lands in the zero- or one-child case.

#### Key observations — what interviewers are listening for

- **The return-the-subtree idiom is the reusable part.** `node.left = delete(node.left, key)` makes the parent rewire itself. It removes parent pointers, root special-cases and most of the bug surface in one move.
- **Justify the recursive delete, do not just perform it.** The gate asks specifically for that justification rather than a pointer splice.
- **Say why the successor is easy to remove.** *It is the leftmost node of the right subtree, so it has no left child.* That is what guarantees termination.
- **Corruption here is delayed.** A bad splice produces a tree that looks fine and fails on the **next** operation, which is what makes it worth getting right the first time.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Deleting a two-child node by splicing pointers | corrupt tree on the next operation, not this one. | Copy the successor's value, then recursively delete the successor. |
| Taking the successor from the wrong side | the ordering breaks — you need the smallest value **larger** than the left subtree. | Inorder successor = leftmost node of the **right** subtree. |
| Maintaining parent pointers to rewire | extra state and a root special-case for no benefit. | Return the new subtree root and let the parent assign it. |
| Assuming insertion may need restructuring | unnecessary complexity. | Insertion is always at a null leaf. Descend, attach, done. |

#### Key takeaway

- **Trigger:** structurally modify a BST while preserving the ordering.
- **Insert:** descend by comparison; the null position you reach is the right place.
- **Delete:** 0 children → `null`; 1 child → that child; 2 children → copy successor, recurse.
- **The idiom:** return the new subtree root; the parent reattaches it.
- **Gate:** LC 450 blind with all three cases, justifying the recursive delete over a pointer splice. See [§5.3](#53-binary-search-trees).


### F — Construction

> **Intuition.** A **sorted input already encodes the shape**. For a balanced tree the middle element is the root — this is binary search with the recursion tree materialised as the answer.

**Mental model.** *"I do not need to decide anything. The sorted order tells me which element belongs at the root, and the two halves are the same problem again."*

LC 108 is the clean case: sorted plus height-balanced means the middle element must be the root, and each half recurses identically.

LC 1008 is the interesting one, because it reuses sub-variant **B**'s range trick — running **forward** over a preorder stream instead of validating an existing tree.

```
   108  sorted array -> height-balanced BST

        the MIDDLE element is the root; recurse on each half
        this is binary search with the recursion tree kept as the answer
        O(n), and balanced by construction

   1008 preorder -> BST, in O(n)

        the RANGE TRICK from sub-variant B, running FORWARD:
        consume values while they fit inside (low, high);
        return as soon as one does not

   inserting a sorted array one element at a time instead
        -> degenerates to a linked list, O(n^2)
```

*Building by repeated insertion from sorted input is the classic wrong answer — every insert goes right, so the tree becomes a list and construction costs `O(n^2)`.*

**Recognition — reach for this when:**

- ✓ Build a BST from **sorted** input, or from a traversal of one.
- ✓ The problem asks for **height-balanced**, which pins the root to the middle.
- ✓ You are given a preorder stream and want `O(n)` rather than repeated insertion.
- ✗ But **not** from unsorted input — there is no shape information to exploit, so you are back to inserting one at a time.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★83 | **108. Convert Sorted Array to Binary Search Tree** | Easy | F | Sorted array + "height-balanced" ⇒ the middle element is the root, by definition. Binary search written as a constructor. |
| ★84 | **1008. Construct Binary Search Tree from Preorder Traversal** | Medium | F | The O(n) solution is the range trick from #72 running forward: consume values while they fit inside `(low, high)`. This is the sub-variant B insight reused as a *builder*. |
| ○85 | 109. Convert Sorted List to Binary Search Tree | Medium | F | The inorder-simulation solution (build left, then consume the head, then build right) is genuinely clever and worth one read. |
| ○86 | 95. Unique Binary Search Trees II | Medium | F | Catalan recursion returning lists of trees. Fun, rarely asked. |
| ○87 | 96. Unique Binary Search Trees | Medium | F | Pure DP; it is a counting problem wearing a tree costume. |

#### Why it works — why the middle, and how the range trick runs forward

Two constructions. The second is a genuinely nice reuse of an earlier sub-variant.

1. **Sorted plus balanced determines the root.** For the tree to be height-balanced, the two subtrees must hold equal counts. The only element that splits a sorted array into equal halves is the middle one.
2. **Each half is the same problem.** Everything before the middle is smaller (so it is the left subtree) and everything after is larger. Recurse identically, and the result is balanced by construction.
3. **LC 1008 turns validation into construction.** In sub-variant B the range `(low, high)` **checked** each node. Here it **decides** whether the next value in the stream belongs in this subtree at all.
4. **Which gives `O(n)`.** Consume values while they fit inside the current bounds; return the moment one does not. Each value is examined a constant number of times, so the whole preorder stream is processed once.

> **The reuse worth naming:** LC 1008 is the **range trick from LC 98 running forward** over the preorder stream — consume values while they fit inside `(low, high)`, and return as soon as one does not.

**Never build from sorted input by repeated insertion.** Every value is larger than the last, so every insert descends right and the tree degenerates into a linked list — `O(n^2)` to build and `O(n)` per subsequent operation.

**The cursor is shared**, exactly as in Pattern 2 H and I. The left subtree consumes an unknown number of preorder values, so the right subtree must start after all of them.

#### Walkthrough — LC 108 — sorted array to balanced BST

`[-10, -3, 0, 5, 9]`. The middle element becomes the root at every level, so balance is automatic.

```
index    0    1    2    3    4
value  -10   -3    0    5    9
```

| # | Range | Middle | Becomes | Recurses on |
|---|---|---|---|---|
| 1 | `[0 .. 4]` | index 2 → **0** | the root | `[0..1]` and `[3..4]` |
| 2 | `[0 .. 1]` | index 0 → **-10** | root's left child | `[]` and `[1..1]` |
| 3 | `[1 .. 1]` | index 1 → **-3** | right child of -10 | nothing |
| 4 | `[3 .. 4]` | index 3 → **5** | root's right child | `[]` and `[4..4]` |
| 5 | `[4 .. 4]` | index 4 → **9** | right child of 5 | nothing |

Height 3, perfectly balanced, in `O(n)`. Compare against inserting `-10, -3, 0, 5, 9` one at a time: each value exceeds everything already present, so every insert walks the full right spine and the result is a five-node chain built in `O(n^2)`. The sorted order was carrying the shape information all along.

#### Key observations — what interviewers are listening for

- **Sorted input is shape information, not just data.** That reframing is what makes LC 108 obvious and repeated insertion visibly wrong.
- **Name the reuse in LC 1008.** *The LC 98 range trick, running forward.* The gate asks for exactly that explanation, and it is what turns an `O(n log n)` insert-based solution into `O(n)`.
- **Either middle works for even counts.** Left or right of centre both give a valid height-balanced tree. Say so rather than agonising.
- **The degenerate case is worth stating unprompted.** *Inserting sorted data one at a time gives a linked list* is a good instinct to demonstrate.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Building from a sorted array by inserting one at a time | degenerates to a linked list, `O(n^2)`. | Recurse on the middle element. |
| Rebuilding index ranges by copying subarrays | `O(n log n)` time and `O(n log n)` space for no benefit. | Pass `(lo, hi)` indices into the original array. |
| Copying the preorder cursor per frame in LC 1008 | subtrees built from the wrong position in the stream. | The cursor is shared — a field or an `int[1]`. |
| Assuming unsorted input can use this | the middle element is meaningless without an ordering. | Sort first, or accept repeated insertion. |

#### Key takeaway

- **Trigger:** build a BST from sorted input or from a preorder stream.
- **LC 108:** the middle element is the root; recurse on each half. `O(n)`, balanced by construction.
- **LC 1008:** the LC 98 range trick running forward — consume while values fit `(low, high)`.
- **Never:** repeated insertion from sorted input — that is a linked list in `O(n^2)`.
- **Gate:** LC 108 blind, then explain LC 1008's `O(n)` solution as the LC 98 bound trick running forward. See [§5.3](#53-binary-search-trees).


### G — Range queries and pruning

> **Intuition.** Where the ordering **pays for itself twice**: one comparison per node decides whether to recurse at all, so whole subtrees never get visited.

**Mental model.** *"Before I look inside a subtree I ask whether it could possibly contain anything I want. If the answer is no, I do not descend — and that is not an optimisation, it is the algorithm."*

LC 938 is the clean case: sum the values in a range, and skip any subtree that lies entirely outside it. Cost is `O(h + k)` rather than `O(n)`.

LC 669 is the one with a genuine trap, and it is the trap the gate asks you to explain with a concrete counterexample.

```
   938  RANGE SUM   one comparison decides whether to descend at all
        node.val < low   ->  the whole LEFT  subtree is too small, skip it
        node.val > high  ->  the whole RIGHT subtree is too large, skip it

   669  TRIM -- the trap:

        when a node is BELOW low, its entire LEFT subtree is below low too
        -> the replacement is the TRIMMED RIGHT SUBTREE, not null

        returning null here silently deletes valid nodes,
        and it is the standard wrong answer

   538  reverse inorder -- right, node, left -- is a DESCENDING scan, for free
```

*A node outside the range does not mean its whole subtree is outside. Half of it may still be in range, which is precisely why `trim` must return a subtree rather than `null`.*

**Recognition — reach for this when:**

- ✓ A query restricted to a **value range** — sum, count, collect, trim.
- ✓ The expected cost mentions `k`, the number of results, rather than `n`.
- ✓ Whole subtrees can be excluded by a single comparison.
- ✗ But **not** if you find yourself recursing into both children unconditionally. Then the bounds are not being used and the cost is `O(n)`.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★88 | **938. Range Sum of BST** | Easy | G | One comparison per node decides whether to recurse at all. The whole value of the ordering, in eight lines. |
| ★89 | **669. Trim a Binary Search Tree** | Medium | G | Pruning that returns a *replacement subtree*. When a node is below `low`, its entire left subtree is too — so you return the trimmed right subtree, not `null`. That step is the trap. |
| ★90 | **538. Convert BST to Greater Tree** | Medium | G + C | Reverse inorder (right, node, left) with a running sum. Teaches that the inorder machine runs backwards for free, which is half of sub-variant D. |

#### Why it works — why trim returns a subtree, not null

Pruning is straightforward until LC 669, where the obvious move deletes valid data.

1. **Pruning on the sum.** If `node.val < low`, everything in the left subtree is also below `low`, so it cannot contribute — recurse right only. Symmetrically for `> high`.
2. **Trim looks similar and is not.** The temptation is to return `null` for any node outside the range, mirroring the pruning logic.
3. **But out-of-range does not mean the subtree is empty.** If `node.val < low`, its **left** subtree is entirely below `low` and can go — but its **right** subtree may contain values inside the range.
4. **So return the trimmed surviving side.** The replacement for an out-of-range node is the trimmed subtree on the side that could still hold valid values. Returning `null` throws those away silently.

> **The standard wrong answer, and why:** when a node is below `low`, its entire **left** subtree is below `low` too — so the replacement is the trimmed **right** subtree, not `null`. Returning `null` here silently deletes valid nodes.

**LC 538 gets a descending scan for free.** Reverse inorder — right, node, left — visits values largest-first, so a running suffix sum needs no extra structure at all.

**If both children are always visited, the bounds are not doing anything.** That is the self-check for this sub-variant: one comparison should eliminate a side, and if it does not, re-read the bounds.

#### Walkthrough — LC 669 — trimming to [3, 4], the four-node counterexample

Node 1 is below the range. Return `null` for it and you delete nodes 2 and 3, which are perfectly valid.

```
        3
       / \
      1   4
       \
        2          trim to [3, 4]
```

| # | At | In range? | Naive `null` | Correct |
|---|---|---|---|---|
| 1 | 3 (root) | yes | keep, recurse both sides | same |
| 2 | 1 | **no**, `1 < 3` | return `null` → node 2 is **lost** | return the trimmed **right** subtree |
| 3 | 2 | no, `2 < 3` | -- | its right subtree is empty → `null` here is correct |
| 4 | 4 | yes | keep | same |

Correct result: root 3 with right child 4 and **no** left child — because trimming node 1 returned its right subtree (node 2), which then trimmed to `null` in its own right. The naive version reaches the same answer *here* only by luck; add a node valued 3 under 2 and the naive version deletes it while the correct version keeps it. That is the counterexample the gate asks for.

#### Key observations — what interviewers are listening for

- **The self-check is one sentence.** *Did a comparison eliminate a side?* If both children are always visited, you are paying `O(n)` for a structure that offered `O(h + k)`.
- **Trim is not pruning, despite looking like it.** Pruning skips work; trimming rebuilds. Returning `null` conflates the two and loses data.
- **Have the counterexample ready.** The gate asks for a **concrete** four-node tree. Abstract reasoning is not what it is testing.
- **Reverse inorder is a free descending scan.** Worth remembering as a general trick, not just for LC 538.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Recursing into both children in a range query | `O(n)` where `O(h + k)` was asked for. | One comparison must eliminate a side; if it does not, re-read the bounds. |
| `trim` returning `null` for an out-of-range node | silently deletes in-range descendants. | Return the trimmed subtree on the surviving side. |
| Trimming only one level | out-of-range nodes survive deeper in the tree. | The returned subtree must itself be trimmed — the recursion does this if you return its result. |
| Using forward inorder for a descending accumulation | you need the whole sequence before you can start. | Reverse inorder gives descending order directly. |

#### Key takeaway

- **Trigger:** a value-range query — sum, count, collect, trim.
- **Pruning:** one comparison decides whether to descend; `O(h + k)`.
- **LC 669:** an out-of-range node is replaced by its **trimmed surviving subtree**, never `null`.
- **LC 538:** reverse inorder is a descending scan, for free.
- **Gate:** explain why LC 669 must return a subtree rather than `null`, with a concrete four-node counterexample. See [§5.3](#53-binary-search-trees).


### H — BST as an ordered container

> **Intuition.** Where BSTs actually live in production code. `TreeMap` and `TreeSet` give you **floor, ceiling, headMap and tailMap** in `O(log n)` — and knowing that is the bridge out of *trees* as a topic.

**Mental model.** *"I am not solving a tree problem. I need an ordered container with efficient neighbour queries, and a balanced BST is the data structure that provides it."*

This sub-variant is deliberately not really about trees. It is about recognising when the **ordering operations** are what you need, and reaching for the library rather than hand-rolling a tree.

It is also the bridge to the ordered-multiset sliding windows in the companion document — the same structure, used as a window aggregate rather than as a standalone container.

```
   TreeMap / TreeSet -- O(log n) per operation

       floorKey(x)      largest key <= x
       ceilingKey(x)    smallest key >= x
       higherKey(x)     strictly greater
       headMap / tailMap / subMap        range views

   653  Two Sum on a BST:
        two converging pointers over a FORWARD and a REVERSE BST iterator
        -- the sorted-array two-pointer template, with the array replaced
           by two O(h)-space cursors

   this is the same structure as the ordered-multiset sliding window
   in the companion document (§2.J there)
```

*`floor` and `ceiling` are the operations a hash map cannot give you. The moment a problem needs *nearest key*, an ordered container is the answer.*

**Recognition — reach for this when:**

- ✓ You need **neighbour queries** — floor, ceiling, nearest — not just membership.
- ✓ A range view or ordered iteration over a changing collection.
- ✓ The collection is mutated *and* queried in order, so sorting once is not enough.
- ✗ But **not** for plain membership or counting. A hash map is `O(1)` and simpler; ordering costs you a log factor you are not using.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★91 | **653. Two Sum IV — Input is a BST** | Easy | H | Two converging pointers over two BST iterators — the two-pointer pattern running on a tree. The naive hash-set answer is accepted; the iterator answer is the one that gets a follow-up nod. |
| ○92 | 220. Contains Duplicate III | Hard | H | `TreeSet.floor`/`ceiling` inside a sliding window — the ordered-multiset window from the companion document. The clearest example of a BST used as a tool rather than a subject. |
| ○93 | 2476. Closest Nodes Queries in a Binary Search Tree | Medium | H | Flatten to a sorted array, then `lowerBound`/`upperBound` per query. Explicitly ties §3.C to binary search on an array. |


#### Why it works — when the ordering operations are the requirement

A short sub-variant, because the skill is recognition rather than implementation.

1. **Hash maps cannot answer neighbour queries.** *What is the largest key at most `x`?* requires an ordering. A hash map has none, so the question costs a full scan.
2. **A balanced BST answers them in `O(log n)`.** `floorKey`, `ceilingKey` and the range views are exactly the descent from sub-variant **A**, with rebalancing handled for you.
3. **Mutation is what rules out sorting once.** If the collection never changed you could sort an array and binary search it. An ordered container earns its keep precisely when inserts and deletes are interleaved with queries.
4. **LC 653 makes the connection explicit.** Two converging pointers over a forward and a reverse BST iterator is the sorted-array two-pointer template, with the array replaced by two `O(h)`-space cursors. Same algorithm, different backing store.

> **The connection the gate asks you to name:** LC 653 is **converging two pointers** — sub-variant **A** of Two Pointers — with the sorted array replaced by a forward and a reverse BST iterator. Solving it with a hash set works and misses the point.

**The iterators are the ones from Pattern 1 B.** A paused inorder walk gives the forward cursor; a paused reverse inorder gives the backward one. Each is `O(h)` space and amortized `O(1)` per step.

**This is where the two documents meet.** The ordered-multiset sliding window uses the same structure to maintain a window median — a BST used as a moving aggregate rather than a static container.

#### Walkthrough — LC 653 — two-sum on a BST with two iterators

Target 9. The forward iterator yields ascending values, the reverse one descending — exactly the two ends of a sorted array.

```
        5
       / \
      3   6
     / \   \
    2   4   7        target = 9

   forward iterator:  2 3 4 5 6 7
   reverse iterator:  7 6 5 4 3 2
```

| # | low | high | sum | vs 9 | Move |
|---|---|---|---|---|---|
| 1 | 2 | 7 | 9 | **hit** | return true |

Found immediately here, but the shape is the point: had the sum been too small the forward cursor would advance, and too large the reverse cursor would retreat — identical to converging pointers on a sorted array. The two iterators cost `O(h)` space each, versus `O(n)` for a hash set, and the discard argument is the one from Two Pointers A, unchanged.

#### Key observations — what interviewers are listening for

- **Recognition is the whole skill here.** *Do I need neighbour queries on a changing collection?* If yes, ordered container. If no, a hash map is simpler and faster.
- **Name the two-pointer correspondence.** The gate asks you to solve LC 653 with two iterators **and** name the sub-variant it corresponds to. The naming is half the exercise.
- **Know the API, not just the concept.** `floorKey`, `ceilingKey`, `higherKey`, `subMap`. Reaching for the right method is what makes this practical rather than theoretical.
- **This is the bridge out of the topic.** Treating BSTs as a tool rather than a subject is exactly what the final gate is checking.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Solving LC 653 with a hash set | correct, `O(n)` space, and it ignores the structure entirely. | Two iterators, `O(h)` space each. The gate asks for that version specifically. |
| Using an ordered container for plain membership | `O(log n)` where `O(1)` was available. | A hash map is simpler unless you need ordering. |
| Hand-rolling a balanced BST | rotation bugs, for functionality the standard library already provides. | `TreeMap` / `TreeSet` unless the problem explicitly forbids them. |
| Sorting once when the collection mutates | the sorted snapshot goes stale after the first insert. | An ordered container maintains the invariant across mutations. |

#### Key takeaway

- **Trigger:** neighbour queries — floor, ceiling, nearest — on a **changing** collection.
- **The tool:** `TreeMap` / `TreeSet`, `O(log n)` per operation.
- **LC 653:** converging two pointers over a forward and a reverse iterator, `O(h)` space.
- **The bridge:** the same structure drives the ordered-multiset sliding window in the companion document.
- **Gate:** solve LC 653 with two iterators and name the two-pointer sub-variant it corresponds to. See [§5.3](#53-binary-search-trees).

---

### Extra Reps — BST (only if a gate fails)

| Problem | Targets |
|---|---|
| 1382. Balance a Binary Search Tree | Inorder to array, then problem 108 — composition of two solved things. |
| 1305. All Elements in Two BSTs | Two iterators merged; sub-variant B of two pointers, on trees. |
| 173. Binary Search Tree Iterator | Re-rep if the paused-inorder state machine is not automatic. |
| 333. Largest BST Subtree 🔒 | Augmented return carrying `(min, max, size, isBst)`. Free substitute: 98 plus 104 composed. |
| 426. Convert Binary Search Tree to Sorted Doubly Linked List 🔒 | Inorder rewiring with a `prev` pointer. Free substitute: 897. |
| 776. Split BST 🔒 | Recursive splitting that returns a pair of trees. Free substitute: 669. |

---

## 3.3 Templates


### A — Search and BST-LCA

> **Intuition.** **Binary search with pointers instead of indices.** One comparison tells you an entire subtree is irrelevant, and that single fact is what makes search, insert, delete, range and LCA all `O(h)`.

**Mental model.** *"I compare once. Whatever I am looking for is either smaller than me or larger than me, so half the tree just stopped existing. Then I do it again."*

A BST is a binary tree plus one promise: **for every node, everything in the left subtree is smaller and everything in the right subtree is larger.** That promise is worth exactly two things — you may skip a subtree, and inorder is sorted — and every sub-variant here cashes in one of them.

LC 235 is worth contrasting with the general LCA of Pattern 2 G. On a BST there is **no upward pass, no returned sentinels, and no proof about ancestors**: you simply descend while both targets agree on the direction.

```
   700 SEARCH        compare once, discard a side, repeat        O(h)
       iterative, because the recursion is pure tail-recursion
       and Java will not remove it

   235 BST-LCA        descend while BOTH targets go the SAME way

       both smaller   ->  go left
       both larger    ->  go right
       otherwise      ->  they split HERE, so this node is the answer

   compare with Pattern 2 G, where the same question needs a full
   postorder pass and a two-reading argument. The ordering removes all of it.
```

*The first node that does **not** send both targets the same way is the split point, and therefore the answer. No recursion needed, no sentinel values, no proof obligation.*

**Recognition — reach for this when:**

- ✓ The structure is a **BST**, and the question is *where is x* or *where do these meet*.
- ✓ The expected cost is `O(h)` — the problem is testing whether you use the ordering.
- ✓ A single comparison at each node can eliminate a whole side.
- ✗ But **not** on a plain binary tree. Without the ordering promise, LCA needs Pattern 2's postorder argument.


```java
// 700. Iterative, because the recursion is pure tail-recursion and Java will not remove it.
TreeNode search(TreeNode root, int target) {
    TreeNode cur = root;
    while (cur != null && cur.val != target) cur = target < cur.val ? cur.left : cur.right;
    return cur;
}
```

```java
// 235. BST LCA. Descend while both targets are strictly on the same side; the first node that
// does NOT send them the same way is the split point — and therefore the answer.
// No upward pass, no returned sentinels, no proof about ancestors. Compare with §2.G.
TreeNode lcaBst(TreeNode root, TreeNode p, TreeNode q) {
    TreeNode cur = root;
    while (cur != null) {
        if (p.val < cur.val && q.val < cur.val)      cur = cur.left;
        else if (p.val > cur.val && q.val > cur.val) cur = cur.right;
        else return cur;
    }
    return null;
}
```

#### Why it works — what the ordering buys, and why LCA collapses

One promise, two consequences. This sub-variant is the first of them.

1. **The promise.** For every node, the **entire** left subtree is smaller and the **entire** right subtree is larger. Note *entire* — it is a claim about subtrees, not about parent-child pairs.
2. **So one comparison discards half.** If the target is smaller than the current node, it cannot be anywhere in the right subtree. That is a whole branch eliminated by a single test, which is exactly binary search.
3. **LCA needs no upward pass.** If both targets are smaller than the current node, both live in the left subtree, so the meeting point is also down there. Same for larger. Descend while they agree.
4. **The first disagreement is the answer.** When one target is smaller and the other larger — or one **is** the current node — the paths diverge here. This node is the lowest that contains both.

> **The thesis for every template in this pattern:** **every one of them is the same descent.** Compare, discard a side, recurse or loop. If a BST solution of yours visits both children unconditionally, you have written a binary-tree solution and thrown the ordering away — which is sometimes right (see **C**) and usually wrong.

**Write search iteratively.** The recursion is pure tail recursion and Java will not eliminate it, so the loop is strictly better — `O(1)` space instead of `O(h)`.

**Using the general LCA on a BST is a wrong answer even when it is correct.** It runs in `O(n)` and misses the entire point of the question, which is whether you noticed the ordering.

#### Walkthrough — LC 235 — LCA of 2 and 4

Both targets are in the left subtree until they are not. Watch the descent stop at the first disagreement.

```
        6
       / \
      2   8
     / \
    0   4          p = 2,  q = 4
       / \
      3   5
```

| # | At | 2 vs node | 4 vs node | Verdict |
|---|---|---|---|---|
| 1 | 6 | smaller | smaller | both left → descend left |
| 2 | 2 | **equal** | larger | **they disagree** → node 2 is the answer |

Answer 2 — reached in two comparisons on a seven-node tree. Node 2 is itself one of the targets and the other is beneath it, which on a plain binary tree needed the careful two-reading argument of Pattern 2 G. Here it falls out of *the targets no longer agree on a direction*, with no case analysis at all.

#### Key observations — what interviewers are listening for

- **Name what the ordering bought, per problem.** The gate asks exactly that. For search: half the tree per comparison. For LCA: the entire upward pass disappears.
- **Iterative search is the better answer.** Tail recursion is not optimised in Java, so the loop saves `O(h)` stack for no cost in clarity.
- **The promise is about subtrees, not parents.** Worth internalising here, because sub-variant **B** exists entirely because people forget it.
- **Reaching for Pattern 2's LCA on a BST is a tell.** It signals you are treating the BST as a plain tree. Correct, `O(n)`, and the wrong answer to the question being asked.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Using the general LCA on a BST | correct but `O(n)`, and it misses the point of the question. | If it is a BST, descend by comparison. |
| Writing search recursively | `O(h)` stack for a pure tail call Java will not eliminate. | Use a loop. |
| Visiting both children unconditionally | you have written a binary-tree solution and discarded the ordering. | One comparison must eliminate a side. If it does not, re-read the bounds. |
| Assuming parent-child ordering is the property | accepts trees that are not BSTs — see sub-variant **B**. | The promise covers the **entire** subtree, so it constrains every ancestor. |

#### Key takeaway

- **Trigger:** a BST, and the question is *find* or *where do two paths meet*.
- **The promise:** whole left subtree smaller, whole right subtree larger.
- **Search:** compare, discard a side, loop. `O(h)` time, `O(1)` space.
- **LCA:** descend while both targets agree; the first disagreement is the answer.
- **Gate:** iterative search and BST-LCA blind, stating what the ordering bought in each. See [§5.3](#53-binary-search-trees).


### B — Validation with an inherited range

```java
// 98. The BST property constrains a node against EVERY ancestor, not just its parent.
// The bounds narrow monotonically as you descend: going left tightens the high bound,
// going right tightens the low bound.
// Long bounds, NOT Integer.MIN_VALUE sentinels — node values may be Integer.MIN_VALUE.
boolean valid(TreeNode n, long low, long high) {
    if (n == null) return true;
    if (n.val <= low || n.val >= high) return false;
    return valid(n.left, low, n.val) && valid(n.right, n.val, high);
}
// call: valid(root, Long.MIN_VALUE, Long.MAX_VALUE)
```

```java
// The other correct answer: inorder must be STRICTLY increasing. Bottom-up instead of
// top-down, no bounds arithmetic, and it generalises to "is this traversal sorted?".
TreeNode prev = null;

boolean validInorder(TreeNode n) {
    if (n == null) return true;
    if (!validInorder(n.left)) return false;
    if (prev != null && prev.val >= n.val) return false;
    prev = n;
    return validInorder(n.right);
}
```

### C — Inorder is sorted

```java
// 230. Count during inorder, stop the moment you have k. The early exit is the point:
// without it you have "sort the tree and index it", which is the wrong complexity story.
int count, answer;

void kth(TreeNode n, int k) {
    if (n == null || count >= k) return;
    kth(n.left, k);
    if (++count == k) { answer = n.val; return; }
    kth(n.right, k);
}
```

```java
// 530 / 99. One variable — the previously visited node — turns inorder into a scan over a
// sorted sequence. 530 minimises the gap; 99 looks for inversions:
//    first  = the LEFT element of the FIRST inversion
//    second = the RIGHT element of the LAST inversion   (they coincide when the swap is adjacent)
TreeNode prevNode = null, first = null, second = null;

void scan(TreeNode n) {
    if (n == null) return;
    scan(n.left);
    if (prevNode != null && prevNode.val > n.val) {
        if (first == null) first = prevNode;
        second = n;
    }
    prevNode = n;
    scan(n.right);
}
```

### D — Successor and predecessor

```java
// 285. The successor is NOT at the node you stop on. It is the last node from which you
// turned LEFT — the deepest ancestor that is still greater than the target.
// If the node has a right subtree, the answer is that subtree's minimum instead.
TreeNode successor(TreeNode root, TreeNode p) {
    TreeNode best = null, cur = root;
    while (cur != null) {
        if (p.val < cur.val) { best = cur; cur = cur.left; }   // remember the left turn
        else                 { cur = cur.right; }              // equal or greater: go right
    }
    return best;
}
```

### E — Insert and delete

```java
// 701. Insertion is always at a null leaf. The "return the subtree" idiom makes the parent
// rewire itself, which is why no parent pointer and no special first-node case is needed.
TreeNode insert(TreeNode n, int v) {
    if (n == null) return new TreeNode(v);
    if (v < n.val) n.left  = insert(n.left, v);
    else           n.right = insert(n.right, v);
    return n;
}
```

```java
// 450. Three cases, and the third is the only hard one:
//   0 children -> return null
//   1 child    -> return that child
//   2 children -> copy the inorder successor's value here, then DELETE THAT SUCCESSOR
//                 from the right subtree. Recursing into the right subtree keeps the
//                 invariant; splicing pointers by hand does not.
TreeNode delete(TreeNode n, int key) {
    if (n == null) return null;
    if (key < n.val)      n.left  = delete(n.left, key);
    else if (key > n.val) n.right = delete(n.right, key);
    else {
        if (n.left == null)  return n.right;
        if (n.right == null) return n.left;
        TreeNode s = n.right;
        while (s.left != null) s = s.left;      // inorder successor = leftmost of the right subtree
        n.val = s.val;
        n.right = delete(n.right, s.val);
    }
    return n;
}
```

### F — Construction

```java
// 108. Sorted + height-balanced ⇒ the middle element is the root. This is binary search
// with the recursion tree materialised as the answer.
TreeNode sortedToBst(int[] a, int lo, int hi) {
    if (lo > hi) return null;
    int mid = lo + (hi - lo) / 2;
    TreeNode n = new TreeNode(a[mid]);
    n.left  = sortedToBst(a, lo, mid - 1);
    n.right = sortedToBst(a, mid + 1, hi);
    return n;
}
```

```java
// 1008. O(n): the range trick from 98, running forward over the preorder stream.
// Consume values while they fit inside (low, high); return as soon as one does not.
int idx = 0;

TreeNode bstFromPreorder(int[] pre, long low, long high) {
    if (idx == pre.length || pre[idx] < low || pre[idx] > high) return null;
    TreeNode n = new TreeNode(pre[idx++]);
    n.left  = bstFromPreorder(pre, low, n.val);
    n.right = bstFromPreorder(pre, n.val, high);
    return n;
}
```

### G — Range queries and pruning

```java
// 938. One comparison per node decides whether to descend at all.
int rangeSum(TreeNode n, int lo, int hi) {
    if (n == null) return 0;
    if (n.val < lo) return rangeSum(n.right, lo, hi);   // whole left subtree is out of range
    if (n.val > hi) return rangeSum(n.left,  lo, hi);   // whole right subtree is out of range
    return n.val + rangeSum(n.left, lo, hi) + rangeSum(n.right, lo, hi);
}
```

```java
// 669. When a node is below `low`, its entire LEFT subtree is below `low` too — so the
// replacement is the trimmed RIGHT subtree, not null. Returning null here silently deletes
// valid nodes and is the standard wrong answer.
TreeNode trim(TreeNode n, int low, int high) {
    if (n == null) return null;
    if (n.val < low)  return trim(n.right, low, high);
    if (n.val > high) return trim(n.left,  low, high);
    n.left  = trim(n.left,  low, high);
    n.right = trim(n.right, low, high);
    return n;
}
```

```java
// 538. Reverse inorder — right, node, left — is a descending scan, for free.
int running = 0;

void greater(TreeNode n) {
    if (n == null) return;
    greater(n.right);
    running += n.val;
    n.val = running;
    greater(n.left);
}
```

### H — BST as an ordered container

```java
// 653. Two converging pointers over a forward and a reverse BST iterator — the sorted-array
// two-pointer template with the array replaced by two O(h)-space cursors.
boolean findTarget(TreeNode root, int k) {
    Deque<TreeNode> lo = new ArrayDeque<>(), hi = new ArrayDeque<>();
    for (TreeNode n = root; n != null; n = n.left)  lo.push(n);
    for (TreeNode n = root; n != null; n = n.right) hi.push(n);
    TreeNode l = lo.peek(), r = hi.peek();
    while (l != null && r != null && l != r) {
        int s = l.val + r.val;
        if (s == k) return true;
        if (s < k) { l = advance(lo, true);  }      // smallest is too small: raise it
        else       { r = advance(hi, false); }      // largest is too large: lower it
    }
    return false;
}

TreeNode advance(Deque<TreeNode> st, boolean forward) {
    TreeNode n = st.pop();
    for (TreeNode c = forward ? n.right : n.left; c != null; c = forward ? c.left : c.right)
        st.push(c);
    return st.peek();
}
```

---

## 3.4 Failure Modes — Binary Search Trees

| # | Bug | Symptom | Prevention |
|---|---|---|---|
| 1 | Validating against the parent only | Accepts trees that are not BSTs | The property is about ancestors, not parents. Inherit `(low, high)`. |
| 2 | `Integer.MIN_VALUE` / `MAX_VALUE` as validation sentinels | Fails on trees containing those exact values | Use `long` bounds, or a nullable `prev` node in the inorder version. |
| 3 | `<=` instead of `<` in validation | Accepts duplicates | LeetCode's BSTs are strict. State the duplicate policy before coding. |
| 4 | Recursing into both children in a range query | O(n) where O(h + k) was asked for | One comparison must eliminate a side; if it does not, re-read the bounds. |
| 5 | `trim` returning `null` for an out-of-range node | Silently deletes in-range descendants | Return the trimmed subtree on the surviving side. |
| 6 | Deleting a two-child node by splicing pointers | Corrupt tree on the next operation | Copy the successor's value, then recursively delete the successor. |
| 7 | Successor read off the stopping node | Wrong answer whenever the node has no right child | The answer is the last node you turned left from; track it in a variable. |
| 8 | `kthSmallest` without an early exit | Full O(n) traversal, and a bad follow-up conversation | Stop as soon as the counter reaches k; mention the subtree-size augmentation. |
| 9 | Comparing all pairs for the minimum difference | O(n²) | In a BST the minimum gap is between inorder-adjacent nodes only. |
| 10 | Recovering a swapped BST by tracking one inversion | Wrong when the swapped nodes are not adjacent | `first` from the first inversion, `second` from the last. |
| 11 | Using the general LCA on a BST | Correct but O(n) and misses the point of the question | If it is a BST, descend by comparison — §3.A. |
| 12 | Building from a sorted array by inserting one at a time | Degenerates to a linked list, O(n²) | Recurse on the middle element. |

---

# 4 — RECOGNITION GUIDE

## 4.1 The decision procedure

Run these in order. Stop at the first match.

**Step 0 — Is it actually a binary tree?**
If the input is `n` nodes plus an edge list, it is a *tree as a graph*: build an adjacency list, pick a root, and pass the parent down to avoid revisiting. Half the "hard tree" problems are ordinary DFS wearing an unfamiliar input format. If the input is a `TreeNode`, continue.

**Step 1 — Is it a BST?**
Say it out loud, because it is the highest-leverage fact available. If yes, one comparison per node must eliminate a subtree — §3.A/G — and *inorder is sorted*, so any order-statistic question is a scan over a sorted sequence — §3.C. A BST problem solved with a general tree traversal is a wrong answer with the right output.

**Step 2 — Does the question mention distance, direction, or "nearest" in any sense that is not strictly downward?**
Ancestors, cousins, "within k of a node", spreading, burning, "closest leaf". → The tree is a graph. Parent map, BFS, `visited` — §1.F. No top-down recursion can answer these, and no amount of augmenting the return value will fix it.

**Step 3 — Does the answer depend on depth or level?**
Levels, rows, "each level", "the rightmost node", widths, zigzag. → BFS with the size snapshot — §1.C/D. The DFS alternative (carry `depth` down and index an accumulator by it) is usually shorter and O(h) space; know both and say which you chose and why.

**Step 4 — Does *every* node need its own answer?**
"For each node, compute…", or an answer array of length `n`. → Two passes: bottom-up to collect subtree facts, top-down to combine them with the outside-the-subtree part — §2.L. A single DFS here is O(n²).

**Step 5 — Otherwise it is a recursion. Answer the three questions before writing code.**

| Question | If the answer is… | Then |
|---|---|---|
| What does `dfs` return? | one fact about the subtree | **§2.A** bottom-up aggregate |
| | the value the *parent* needs, while the answer is recorded on the side | **§2.C** augmented return |
| | a small tuple, one entry per state | **§2.K** tree DP |
| | the rebuilt or rewired subtree | **§2.H / §2.J** |
| What flows *down*? | a running max, a running number, a bound | **§2.D** inherited state |
| | a mutable path or map that must be undone | **§2.E / §2.F** backtracking |
| What is the `null` value? | not obvious | you have not finished designing the state. Go back. |

**Step 6 — Is there an O(1)-space constraint, or a follow-up asking for one?**
→ Morris threading for traversal (§1.G), the splice-based flatten (§2.J), or the "previous level is the queue" trick (#60). These are the only three O(1)-space tree techniques worth memorising.

**Step 7 — Is the tree given as a serialized string, or must you produce one?**
→ Preorder with explicit null markers, one shared cursor for reading — §2.I. Inorder alone can never work; level-order works but is longer to write.

---

## 4.2 Signal → pattern cheat table

| Signal in the problem statement | Most likely | Watch out for |
|---|---|---|
| "level", "row", "each level", "zigzag" | BFS with the size snapshot | The DFS-with-depth version is often shorter |
| "rightmost/leftmost node of each level" | BFS last-of-level, or DFS right-first | Right-first DFS records on *first* arrival at a depth |
| "distance k from a node", "burning", "cousins" | Parent map + BFS + `visited` | A pure top-down DFS cannot express it at all |
| "root-to-leaf" | Backtracking, §2.E | A leaf is `left == null && right == null` |
| "any path" / "path between any two nodes" | Augmented return, §2.C | Record the bend, return the continuation |
| "number of paths summing to K" | Prefix map on the root path, §2.F | Undo the map entry on the way up |
| "for each node, compute X" | Rerooting, two passes, §2.L | One DFS is O(n²) |
| "the tree is complete / perfect / balanced" | The shape *is* the algorithm | 222 is O(log²n), not O(n) |
| "BST" + "k-th / closest / successor / minimum difference" | Inorder scan with one `prev` variable, §3.C/D | The answer is often not at the node you stop on |
| "BST" + "range / trim / greater sum" | Pruned descent, §3.G | Returning `null` for an out-of-range node deletes valid descendants |
| "validate BST" | Inherited `(low, high)` bounds | Parent comparison is the classic wrong answer |
| "serialize", "encode", "same structure" | Preorder + null markers, §2.I | Inorder is not uniquely decodable |
| "constant extra space" on a traversal | Morris threading, §1.G | You must undo the thread |
| "n nodes, edges[i] = [a, b]" | Adjacency list + DFS with a parent parameter | There is no root until you pick one |
| "children" (plural, a list) | N-ary generalization, §1.H | The identity element for an empty child list |
| "sorted array/list" → tree | Middle element as root, §3.F | Inserting one at a time degenerates to a list |

---

## 4.3 Trap cases — where the obvious approach is wrong

| Problem | The obvious (wrong) read | Why it fails | Correct approach |
|---|---|---|---|
| **111. Minimum Depth** | `1 + min(left, right)` | The absent child returns 0 and wins the min, so a one-child node reports depth 1 | Handle the one-child case explicitly; better, BFS and stop at the first leaf |
| **222. Count Complete Tree Nodes** | Traverse and count | Correct output, wrong complexity — the word "complete" is the whole problem | Compare spine heights, discard a perfect half in O(1) → O(log²n) |
| **543. Diameter** | Return the diameter from `dfs` | A parent cannot extend a path that already bent | Return the height, record `left + right` on the side |
| **863. All Nodes Distance K** | DFS down from the target | Distance also runs upward through the parent | Parent map, then BFS with `visited` |
| **987. Vertical Order Traversal** | BFS and bucket by column | Traversal order does not order equal `(row, col)` nodes | Collect `(col, row, val)` triples and sort by all three |
| **98. Validate BST** | Compare each node with its parent | The constraint is against every ancestor | Inherit `(low, high)` bounds, or check that inorder strictly increases |
| **235 vs 236 (LCA)** | Use the general algorithm on the BST | O(n) where O(h) was available, and it ignores the one fact you were given | Descend by comparison |
| **669. Trim a BST** | Return `null` for an out-of-range node | Its surviving subtree is discarded with it | Return the trimmed subtree from the side that can still be in range |
| **297. Serialize** | Inorder, or preorder without markers | Neither is uniquely decodable | Preorder with `#` markers and one shared read cursor |

---

# 5 — MASTERY CHECKPOINTS

Each gate is **pass/fail, no partial credit**. Gate conditions are things you do *without an IDE, without hints, and without looking at your own notes.* A gate you "mostly" pass is a gate you failed.

## 5.1 Traversal

| Gate | You may advance when you can... | Fail action |
|---|---|---|
| **A → B** | Write all three recursive orders from one skeleton and state, in one sentence, why postorder is the only order that can compute a subtree aggregate. | Redo #1–#3 in a single sitting. |
| **B → C** | Write iterative inorder blind and state the stack invariant. Then write LC 173 and explain why `next()` is amortized O(1). | Redo #5, then #7. Hand-trace the stack on a 5-node tree. |
| **C → D** | Write the level-order skeleton blind, including the size snapshot and the null-root guard, and explain why LC 111 breaks the naive recursion. | Redo #9 and #10 together; the pair is the lesson. |
| **D → E** | Write LC 199 *both* ways — BFS last-of-level and right-first DFS — and say which is O(h) and which is O(w). | Redo #12. |
| **E → F** | State the heap-index rule and why per-level normalization is required, then explain the third sort key in LC 987 without looking. | Redo #17, then #18. |
| **F → G** | Given a new problem mentioning distance in a tree, say "parent map + BFS + visited" **before** writing code, and explain why the visited set is mandatory. | This is the most transferable gate in the pattern. Redo #20, then solve #21 cold. |
| **G → H** | Write Morris inorder blind, including the undo, and prove the tree is unmodified at the end. | Redo #23 daily until the undo is reflexive. |
| **H → done** | Generalize any of A–D to a child list without re-deriving, and state the identity element for the aggregate. | Redo #24 and #25. |

## 5.2 Tree Recursion

| Gate | You may advance when you can... | Fail action |
|---|---|---|
| **A → B** | Answer the three questions (return / null / recorded-or-returned) out loud for LC 104, and write LC 110's sentinel version explaining the complexity difference. | Redo #27, #28. |
| **B → C** | Write the two-tree base case blind and explain why the crossed pairing in LC 101 is a parameter and not a different algorithm. | Redo #31, #32. |
| **C → D** | State the record/return distinction for LC 543 *unprompted*, then write LC 124 with the clamp and justify it on an all-negative tree. | You have the code but not the pattern. Re-derive both on paper before touching another problem. |
| **D → E** | Write LC 1448 blind and explain why sub-variant D needs no backtracking while E does. | Redo #40. |
| **E → F** | Write LC 113 blind with exactly one `removeLast` per `addLast` and the copy-on-record, and state the leaf condition without hesitating. | Redo #43, #44, #45 in that order. |
| **F → G** | Explain LC 437 as LC 560 transplanted onto the root path, including why the map entry must be decremented. | If the transfer isn't obvious, re-read the prefix-sum section of the companion document, then redo #47. |
| **G → H** | Write LC 236 blind and defend the "both sides non-null ⇒ this node" step, including the ancestor-of-the-other case. | Redo #48. |
| **H → I** | Write LC 105 blind and then LC 106 immediately after, and state the one difference between them from memory. | Redo both, back to back, two days running. |
| **I → J** | Explain why preorder needs null markers and inorder cannot work at all, then write serialize/deserialize with one shared cursor. | Redo #55. |
| **J → K** | Write LC 114's O(1)-space version and LC 117's dummy-head loop blind. | Redo #59, then #60. |
| **K → L** | Design the state tuple for LC 968 from scratch — three states, the transition, and the `null` value — without recalling the code. | This is the hardest gate in the document. Redo #63, #64, #65 in order across three days. |
| **L → done** | Derive `ans[c] = ans[p] + n - 2 * size[c]` on a blank page and say what each term counts. | Redo #67. If the derivation fails, the problem is not the problem — draw a 5-node tree and move the root by hand. |

## 5.3 Binary Search Trees

| Gate | You may advance when you can... | Fail action |
|---|---|---|
| **A → B** | Write iterative search and BST-LCA blind, and state what the ordering bought you in each. | Redo #69, #70. |
| **B → C** | Write LC 98 both ways — inherited bounds and inorder-`prev` — and explain why `Integer.MIN_VALUE` sentinels are a bug. | This is the foundation gate. Do not proceed. Rewrite both until they are muscle memory. |
| **C → D** | State "the minimum difference is between inorder-adjacent nodes" unprompted, and describe LC 99's two-inversion rule from memory. | Redo #75, then #76. |
| **D → E** | Write successor blind and explain why the answer is the last left-turn rather than the node you stopped on. | Redo #79 and hand-trace it on a tree where the target has no right child. |
| **E → F** | Write LC 450 blind with all three cases and justify the recursive delete of the successor rather than a pointer splice. | Redo #81, then #82 daily until the two-child case is instant. |
| **F → G** | Write LC 108 blind, then explain LC 1008's O(n) solution as the LC 98 bound trick running forward. | Redo #83, #84. |
| **G → H** | Explain why LC 669 must return a subtree rather than `null`, with a concrete 4-node counterexample. | Redo #89. |
| **H → done** | Solve LC 653 with two iterators rather than a hash set, and name the two-pointer sub-variant it corresponds to. | You are treating BSTs as a topic rather than a tool. Redo #91, then read §3.1 again. |

---

## 5.4 Revisit rule for ★ problems

Log every starred problem with an outcome the moment you finish it. The interval depends **only** on how you solved it, never on how you felt about it.

| Outcome | Next revisit | Then | Then | Graduates when |
|---|---|---|---|---|
| **Clean** — unaided, optimal, first submission accepted, ≤ 25 min | +14 days | +45 days | done | 2 consecutive clean runs |
| **Slow** — unaided and optimal, but > 40 min or multiple failed submissions | +7 days | +21 days | +45 days | 2 consecutive clean runs |
| **Hinted** — you read a hint, a tag, or the pattern name | +3 days | +10 days | +30 days | 2 consecutive **clean** runs (slow doesn't count) |
| **Solved** — you read the editorial or any solution code | +1 day | +4 days | +12 days | 3 consecutive clean runs |
| **Suboptimal** — accepted but wrong complexity | Treat as **Hinted**, and additionally re-solve the *previous* starred problem in the same sub-variant | | | |

**Additional rules that matter more than the intervals:**

1. **Three questions first.** On every revisit of a Pattern 2 problem, answer *what does `dfs` return / what is the `null` value / is the answer returned or recorded* **before** opening the editor. Getting those wrong downgrades the attempt to *Hinted* regardless of how the code goes.
2. **Two strikes → step back.** Any starred problem that fails to reach *Clean* on two consecutive revisits: stop, go back one sub-variant, and re-solve its last two starred problems. The failure is almost always upstream.
3. **Failure-mode tagging.** When a revisit isn't clean, tag it with the row number from the relevant §*.4 Failure Modes table. After ten problems you will have two or three dominant tags — those are your actual weaknesses, and they're worth more than any problem count.
4. **The sub-variant transfer test.** Once per sub-variant, take an *unseen* problem from the Extra Reps list and solve it cold. If the core problems are clean but the transfer fails, you learned the problems, not the pattern.
5. **Draw the tree.** Any tree bug that survives two readings of the code gets a hand-drawn 5-to-7-node counterexample. Trees are the one topic where the drawing finds the bug faster than the debugger, every time.
6. **Never revisit an unstarred problem** unless it's serving as a transfer test. Optional problems have no spaced-repetition schedule; that is what makes them optional.
7. **Cap the queue at 12 due items.** If more than 12 come due, do the oldest 12 and push the rest. A backlog you avoid is worse than an interval you stretch.

---

## Appendix — Coverage summary

| Pattern | Sub-variants | ★ core | ⚠ anti-pattern | ○ optional |
|---|---|---|---|---|
| Traversal | 8 | 14 | 3 (LC 111, 987, 863) | 9 |
| Tree Recursion | 12 | 24 | 2 (LC 222, 543) | 16 |
| Binary Search Trees | 8 | 14 | 1 (LC 98) | 10 |
| **Total** | **28** | **52** | **6** | **35** |

The six ⚠ problems are the highest-value items in the document. They are the only ones that teach you when *not* to trust the obvious recursion, which is the difference between someone who has done 300 tree problems and someone who can solve an unseen one.

**Where this document connects to the others.** LC 437 is LC 560 on a root path. LC 653 is LC 167 on two iterators. LC 220 is an ordered-multiset sliding window that happens to use a BST. LC 230 and LC 2476 are binary search with pointers instead of indices. If those four sentences read as obvious, the patterns have transferred; if any of them reads as a surprise, that is the next thing to study.
