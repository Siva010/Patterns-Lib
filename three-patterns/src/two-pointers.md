*Part of **Three Patterns, No Gaps**. [Home](index.md) · [Two Pointers](two-pointers.md) · [Sliding Window](sliding-window.md) · [Binary Search](binary-search.md)*

---

# PATTERN 1 — TWO POINTERS

## 1.1 Pattern Breakdown

Two pointers is not one technique. It is a family united by a single idea: **maintain an invariant over a shrinking or advancing region so that each element is visited O(1) times amortized.** The sub-variants differ in *what the invariant is*.

| # | Sub-variant | Invariant maintained | Movement rule |
|---|---|---|---|
| **A** | **Converging on sorted data** | Every pair `(i,j)` with `i < l` or `j > r` has been proven impossible | Compare against target, move the side that can only improve |
| **B** | **Converging with a discard proof (greedy)** | The optimal answer never uses the pointer we are about to discard | Move the *limiting* side (shorter wall, smaller value) |
| **C** | **k-Sum reduction** | Fix `k−2` indices by loop, reduce to variant A on the remainder | Outer loops + inner converge; dedup at every level |
| **D** | **Read/write compaction (same direction)** | `a[0..w)` is the finished output prefix; `a[w..rd)` is discarded garbage | `rd` always advances; `w` advances only on keep |
| **E** | **Two-sequence advance** | Both cursors only move forward; the pair `(i,j)` is the frontier of an unmatched suffix | Advance whichever cursor cannot possibly match |
| **F** | **Backward-writing merge** | The write head is always at or ahead of both read heads → no clobbering | Write from the tail toward the head |
| **G** | **Fast/slow (Floyd) + gap pointers** | Fixed speed ratio or fixed index offset between the two pointers | Advance both, one faster or one delayed |
| **H** | **Partitioning** | Region boundaries define value classes (`<pivot`, `=pivot`, `>pivot`, unknown) | Swap across boundaries; shrink the unknown region |
| **I** | **Expand around center** | `[l,r]` is a valid palindrome at all times inside the expand loop | Push both outward while the invariant holds |
| **J** | **Cyclic sort (index-as-hash)** | Once `a[i] == i+1`, position `i` is permanently correct | Swap value to its home index; only advance when stuck |
| **K** | **Counting pairs on sorted data** | For a fixed right pointer, all `r − l` positions are simultaneously valid | Batch-count instead of enumerating |

**The easily-missed sub-variants.** Each of these is routinely folded into a neighbouring pattern, taught under a different heading, or skipped altogether — and each earns its own row because it teaches something none of the others do:
- **B** (discard proof) is distinct from **A**. In A you move because the sum is too small; in B you move because you can *prove* the discarded pointer is never in an optimal answer. Different reasoning, and B is where people fail interviews — they write the code but cannot justify it.
- **F** backward-writing merge — the general trick "write from the end when the destination overlaps the source."
- **I** expand around center — usually taught under "strings/DP" but it is mechanically a two-pointer.
- **J** cyclic sort — the O(1)-space workhorse for "array of n elements in range [1,n]."
- **K** counting pairs — the `r − l` batching insight that later transfers directly to sliding-window counting.
- **G2** gap pointers (fixed offset, not fixed speed ratio) — different from Floyd, same family.

---

## 1.2 Problem Table

### A — Converging pointers on sorted data

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★1 | **167. Two Sum II — Input Array Is Sorted** | Easy | A | The atom. Establishes `while (l < r)` and the "move the side that can only help" rule. Everything in this pattern is a mutation of this. |
| ○2 | 1099. Two Sum Less Than K 🔒 | Easy | A | Two Sum II with a bound instead of a target: keep the best sum under `k` rather than stopping on equality. Free substitute: **259. 3Sum Smaller** with k=2. |
| ★3 | **125. Valid Palindrome** | Easy | A | Converging with *skip conditions* inside the loop. Teaches that pointers can advance without a comparison. |
| ★4 | **977. Squares of a Sorted Array** | Easy | A + F | First problem where the extremes matter, not the middle. Also your first backward write. |
| ★5 | **680. Valid Palindrome II** | Easy | A | Branch-on-mismatch: one failure allows two sub-checks. Introduces "converge, then delegate." |
| ○6 | 344. Reverse String | Easy | A | Only if the mechanics are still shaky. Teaches nothing new after #1. |
| ○7 | 345. Reverse Vowels of a String | Easy | A | Same converging scan as #6, except each pointer must *skip* until it lands on a vowel. The skip loop is the lesson. |

### B — Converging with a discard proof (greedy)

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★8 | **11. Container With Most Water** | Medium | B | *The* proof problem. You must be able to say out loud: moving the taller wall can never increase area, because width shrinks and height is capped by the shorter wall. If you can't prove it, you don't have this sub-variant. |
| ★9 | **42. Trapping Rain Water** | Hard | B | Extends the proof to a *maintained maximum on each side*. The insight — the side with the smaller wall is fully determined — is reused in dozens of hard problems. |

### C — k-Sum reduction

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★10 | **15. 3Sum** | Medium | C | Sort + fix + converge, plus the three separate dedup sites. The single most-asked two-pointer problem. |
| ★11 | **16. 3Sum Closest** | Medium | C | Converging when there is *no* exact target — you track a best instead of returning on equality. |
| ★12 | **18. 4Sum** | Medium | C | Generalizes to k-sum recursion and forces `long` overflow handling. After this, k-sum is closed. |
| ○13 | Generalized kSum — companion page | Medium | C | The recursion that #10 and 4Sum are both instances of: peel one index, recurse on k−1, bottom out at the two-pointer scan. Not a LeetCode problem. |
| ○14 | 259. 3Sum Smaller 🔒 | Medium | C + K | Counting variant. Free substitute: **611. Valid Triangle Number**. |
| ⚠15 | **1. Two Sum** | Easy | *not* two pointers | Included as a trap: output is **indices**, so sorting destroys the answer. Hash map, not two pointers. Know why. |

### D — Read/write compaction

> **Intuition.** One pointer reads **every** element; a second writes only the keepers. The array becomes its own output buffer, so the filtering costs no extra space.

**Mental model.** *"Two heads on one tape. The read head is always at or ahead of the write head, so every cell the write head lands on has already been read — destroying it is free."*

The output is not a new array. It is the **prefix of the same array**, `a[0..w)`, growing behind the read head. That is the entire space saving, and it is why these functions return a **length** rather than an array: everything from `w` onward is officially garbage and the caller is told to ignore it.

The subtle part is not the mechanics — it is *what the keep-test is allowed to look at*. Once the keep-condition depends on history, it must consult the **output** you have built, never the input you are reading.

```
                w                        rd
                v                         v
   a = [ 1   2   3 | x   x   x   x   x   x | 4   ...  ]
        \_________/ \_____________________/
         finished     already read, safe to overwrite
         a[0..w)             a[w..rd)

   w advances only on a keep.   rd advances every single iteration.
```

*`w <= rd` is not a coincidence to be checked — it is guaranteed by the fact that `rd` moves every iteration and `w` moves at most once. That inequality *is* the safety proof.*

**Recognition — reach for this when:**

- ✓ In-place filter, dedup, or compaction, returning the **new length**.
- ✓ `O(1)` extra space is demanded, or the problem says *modify the array in-place*.
- ✓ The keep-decision can be made from the current element plus what you have **already written**.
- ✗ But **not** when the relative order of kept elements must change, or when the discarded elements are themselves part of the answer.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★16 | **27. Remove Element** | Easy | D | The write-pointer template in its purest form. |
| ★17 | **26. Remove Duplicates from Sorted Array** | Easy | D | Keep-condition now depends on already-written output (`a[w-1]`), not just the input. |
| ★18 | **80. Remove Duplicates from Sorted Array II** | Medium | D | Generalizes to "keep at most k" via `a[w-k]`. Once you see this, all compaction problems collapse into one line. |
| ○19 | 283. Move Zeroes | Easy | D | Same as #16 plus a zero-fill tail. Do it only as a 2-minute warm-up. |
| ○20 | 443. String Compression | Medium | D + E | In-place write while reading a run. Good if you want one harder rep. |

#### Why it works — why overwriting your own input is safe

Compaction looks reckless — you are writing into an array you are still reading. Four lines make it airtight.

1. **The invariant.** `a[0..w)` is the finished, correct output. `a[w..rd)` is garbage you are free to overwrite. `a[rd..n)` is untouched input.
2. **Why the write is safe.** `w <= rd` at all times, because `rd` advances exactly once per iteration while `w` advances at most once. So the cell at `a[w]` has already been read on some earlier iteration.
3. **Termination.** `rd` advances on **every** iteration regardless of which branch is taken, so the loop is `O(n)` and cannot stall — unlike the converging variants, there is no branch that leaves both pointers where they were.
4. **Why the keep-test reads the output.** For *keep at most K copies*, the real question is **have I already written K of these?** That is a fact about `a[w-K]`, the output. The input still physically contains the copies you rejected, so `a[rd-K]` answers a different, wrong question.

> **The one line that separates LC 26 from LC 80:** `if (w < K || a[w - K] != v) a[w++] = v;` — compare against the **output**, never the input. The `w < K` term must come first: it short-circuits the array access while the output is still shorter than K, and Java evaluates left to right.

**Once you see this, the whole sub-variant collapses into one line.** `K = 1` is LC 26, `K = 2` is LC 80, and an unconditional predicate with no history at all is LC 27.

**The keep-condition may legitimately consult the output.** LC 26 tests against `a[w-1]` — the last value written — rather than against the previous input element. Same principle, K of 1.

**LC 283 is this plus a tail.** Compact the non-zeros, then fill `a[w..n)` with zeros. The compaction half is identical.

#### Walkthrough — LC 80 — keep at most two copies

`a = [1, 1, 1, 2, 2, 3]`, `K = 2`. Watch row 3: the input has three 1s available, but the **output** is what gets asked.

```
input   1   1   1   2   2   3
index   0   1   2   3   4   5
```

| # | rd | v | w | Test | Write? | Output a[0..w) |
|---|---|---|---|---|---|---|
| 1 | 0 | 1 | 0 | `w < 2` → true | yes | [1] |
| 2 | 1 | 1 | 1 | `w < 2` → true | yes | [1, 1] |
| 3 | 2 | 1 | 2 | `a[w-2]` = `a[0]` = 1, equals v | **no** | [1, 1] |
| 4 | 3 | 2 | 2 | `a[0]` = 1 != 2 | yes | [1, 1, 2] |
| 5 | 4 | 2 | 3 | `a[1]` = 1 != 2 | yes | [1, 1, 2, 2] |
| 6 | 5 | 3 | 4 | `a[2]` = 2 != 3 | yes | [1, 1, 2, 2, 3] |

Returns `w = 5`. Row 3 is the whole lesson: three 1s were sitting in the input at that moment, but the test asked the *output* how many it had accepted. Ask the input instead — `a[rd-K]` — and this row wrongly writes a third 1.

#### Key observations — what interviewers are listening for

- **State the safety proof, do not just rely on it.** *The write head never outruns the read head, so I can only ever overwrite something I have already consumed.* One sentence, and it retires the interviewer's obvious follow-up.
- **The keep-condition may depend on already-written output.** LC 26 compares against `a[w-1]`, not against the previous input element. Recognising that the output is a legitimate source of truth is the step from LC 27 to LC 26.
- **`a[w-K]` generalises the whole family.** Once the test is expressed against the output at offset K, *keep at most k copies* is a parameter change rather than a new algorithm.
- **The return value is a length, and the tail is deliberately stale.** Judges compare only `a[0..w)`. Candidates who try to clean up the tail are usually revealing that they have not internalised what the contract actually is.
- **LC 443 composes D with a run-scan.** Writing compressed output in place while reading a run is compaction plus sub-variant E's advance rule — a good integration rep once D itself is automatic.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Comparing against the input instead of the output | wrong on any run longer than K, correct everywhere else — so it passes casual testing. | `a[w - K] != v`, **not** `a[rd - K] != v`. The output knows what you accepted; the input does not. |
| Dropping the `w < K` short-circuit | `ArrayIndexOutOfBounds` on the first K elements, before the output is long enough. | The guard must be the **first** operand of the `||`. Java short-circuits left to right, which is what keeps `a[w-K]` from being evaluated. |
| Advancing `w` unconditionally | rejected elements land in the output; the returned prefix is garbage. | `rd` advances every iteration; `w` advances **only** on a keep. That asymmetry is the algorithm. |
| Treating the tail beyond `w` as meaningful | confusion when the array still visibly contains old values after the call. | `a[w..n)` is defined garbage. Return `w` and let the caller ignore the rest. |

#### Key takeaway

- **Trigger:** in-place filter, dedup or compaction, `O(1)` space, return the new length.
- **Rule:** `rd` reads everything; `w` writes only keepers. `w <= rd` is what makes overwriting safe.
- **Test against the output:** `a[w-K]`, never `a[rd-K]` — and guard it with `w < K` first.
- **Cost:** `O(n)` time, `O(1)` space, single pass, guaranteed to terminate because `rd` always moves.
- **Gate:** D is yours when the *keep at most K* one-liner comes out blind and you can explain why it compares against `a[w-K]`. See [§5.1](index.md#55-two-pointers).


### E — Two-sequence advance

> **Intuition.** Two ordered streams, one cursor each. Whoever can no longer match **anything** ahead gets dropped — and neither cursor ever moves backward, so the whole thing is a single pass.

**Mental model.** *"I am at the front of two queues. If the person facing me here cannot possibly be served by anyone left in the other queue, they leave — and nobody ever rejoins."*

The family resemblance to **merge sort** is exact: this is the merge step, generalised. What changes from problem to problem is only the definition of *cannot possibly match* — ends first, is smaller, is already consumed.

Because both cursors are monotone, the total work is bounded by `m + n` no matter which branch runs. That is the whole cost argument, and it is worth stating rather than assuming.

```
A:  [ ..... A[i] ................ ]        Advance whichever cursor cannot
                ^i                            participate in any FUTURE match.

B:  [ .. B[j] ..................... ]       986: drop whichever interval ENDS first
             ^j                             392: text advances always,
                                                 pattern advances only on a match
```

*One skeleton, three step rules. Learning the skeleton is what stops these from feeling like three unrelated problems.*

**Recognition — reach for this when:**

- ✓ **Two** sequences, each already in order.
- ✓ You are looking for matches, intersections, or a subsequence relation between them.
- ✓ For any facing pair you can name which side **can never match again**.
- ✗ But **not** if you need to revisit an element after passing it. That breaks monotonicity — precompute index lists and binary search instead (see Binary Search §M).


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★21 | **392. Is Subsequence** | Easy | E | Two cursors on two strings, one advancing conditionally. The follow-up (many queries) is the doorway to binary search on index lists — see Binary Search §M. |
| ★22 | **986. Interval List Intersections** | Medium | E | Advance the interval that ends first. The canonical "advance whoever can't match" rule. |
| ★23 | **844. Backspace String Compare** | Easy | E | Backward two-sequence advance with variable-length skips. Nastiest boundary conditions in this sub-variant. |
| ○24 | 1855. Maximum Distance Between a Pair of Values | Medium | E | Same-direction pointers where `l` never resets. Good monotonicity rep. |

#### Why it works — why dropping a cursor loses nothing

The correctness argument is the same discard logic as sub-variant A, transplanted onto two sequences instead of two ends of one.

1. **The invariant.** Both cursors only ever move forward, so the pair `(i, j)` is the frontier of an as-yet unmatched suffix of each sequence.
2. **The rule.** Advance the cursor that cannot possibly participate in a future match.
3. **Why that is safe.** Suppose `A[i]` ends before `B[j]` begins. It cannot match `B[j]`. And because `B` only ever moves **forward**, everything after `B[j]` starts even later — so `A[i]` cannot match any of those either. `A[i]` is finished, and dropping it discards nothing.
4. **Cost.** Every iteration advances at least one cursor and neither ever resets, so the loop runs at most `m + n` times.

> **The canonical form of the rule:** advance the interval that **ends first**. Whatever ends first cannot overlap anything that starts later — which is the entire content of LC 986.

**`lo <= hi`, not `lo < hi`.** A single shared point is a legal intersection: `[3,3]` counts. Using a strict comparison silently drops every touching pair.

**LC 392 is the same rule, specialised.** The text cursor advances unconditionally; the pattern cursor advances only on a match. *Cannot match* here means *this text character is not the one the pattern needs*.

**LC 844 runs the skeleton backward** with variable-length skips for the backspaces — the nastiest boundary conditions in this sub-variant, and the reason it is starred.

**The LC 392 follow-up is a doorway out of the pattern.** Once you have many queries against one text, two pointers stops being right: precompute per-character index lists and binary search them. That is Binary Search §M.

#### Walkthrough — LC 986, including the single-point case

`A = [[0,2], [5,10]]`, `B = [[1,5], [8,12]]`. Row 2 is why the emit test is `<=` and not `<`.

```
A:   0---2        5---------10
B:      1------5        8--------12
        ^^^^            ^^^^^^^
        [1,2]    [5,5]   [8,10]
```

| # | A[i] | B[j] | lo .. hi | Emit | Advance |
|---|---|---|---|---|---|
| 1 | [0, 2] | [1, 5] | max(0,1)=1 .. min(2,5)=2 | `[1,2]` | `A` ends first (2 < 5) → `i++` |
| 2 | [5, 10] | [1, 5] | max(5,1)=5 .. min(10,5)=5 | `[5,5]` | `lo == hi`: a **single shared point** is a real intersection. `B` ends first (5 < 10) → `j++` |
| 3 | [5, 10] | [8, 12] | max(5,8)=8 .. min(10,12)=10 | `[8,10]` | `A` ends first (10 < 12) → `i++`, and `A` is exhausted |

Three iterations for four intervals. Notice that no cursor was ever compared against anything it had already passed — that is monotonicity doing the work, and it is why this is `O(m + n)` rather than `O(m * n)`.

#### Key observations — what interviewers are listening for

- **This is the merge step, generalised.** Saying so out loud immediately explains the cost and the shape of the loop, and it tells the interviewer you see the family rather than the instance.
- **Only the step rule changes between problems.** The skeleton — two cursors, a `while` on both bounds, advance the loser — is identical in LC 392, 986 and 844. Recognising the invariant part is what makes the sub-variant transferable.
- **State the cost argument as a sentence.** *Each iteration advances at least one cursor and neither ever resets, so the work is bounded by `m + n`.* That is more convincing than asserting `O(m + n)`.
- **The inclusive bound is a real interview trap.** `lo <= hi` on the emit test. Touching intervals are the test case that separates a correct solution from one that looks correct.
- **Backward is still forward.** LC 844 walks from the ends inward, but each cursor is still monotone in its own direction, so the same argument applies unchanged.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Emitting with `lo < hi` instead of `lo <= hi` | every single-point intersection is silently dropped. | `[3,3]` is a valid intersection. The bound is inclusive. |
| Advancing **both** cursors after a match | valid pairs get skipped when one interval overlaps several on the other side. | Advance only the one you proved is finished. In LC 986 a long interval must stay put while several short ones pass it. |
| Advancing the cursor that ends **later** | misses overlaps, and the error is not obvious on small inputs. | Drop whoever ends **first** — that is the one with no possible future partner. |
| Resetting a cursor to re-scan | quietly degrades to `O(m * n)` and passes every correctness test. | Neither cursor may move backward. If the problem seems to demand it, you need a different tool. |

#### Key takeaway

- **Trigger:** two ordered sequences, looking for matches, intersections or a subsequence relation.
- **Rule:** advance the cursor that cannot possibly match anything ahead — classically, the one that **ends first**.
- **Bound:** `lo <= hi` when emitting. Single points count.
- **Cost:** `O(m + n)`, because each iteration advances at least one monotone cursor.
- **Gate:** E is yours when you can state the advance rule and apply it to LC 986 without re-deriving it. See [§5.1](index.md#55-two-pointers).


### F — Backward-writing merge

> **Intuition.** When the destination overlaps the source, write from the **end**. The tail is empty space, so the write head can never land on input you have not read yet.

**Mental model.** *"The front of this array is crowded — every cell there still holds data I need. The back is slack. So I will fill from the back, largest value first, and the write head will stay ahead of both read heads the whole way."*

Forward merging fails for a concrete, mechanical reason: the write head starts at `a[0]`, which is unread input, and clobbers it on the very first step. Backward merging is the *same algorithm with the direction reversed*, and the reversal is precisely what makes it legal.

The reusable rule is bigger than LC 88: **write from the tail whenever the destination overlaps the source.** It reappears in in-place shifts, string building and array resizing.

```
   a = [ 1   3   5 | _   _   _ ]        m = 3 real values, n = 3 slots of slack
   b = [ 2   4   6 ]

   forward :  write a[0] <- ...   lands on unread input          X clobbers
   backward:  write a[5] <- ...   lands on slack                 OK

                 i           w
   a = [ 1   3   5   _   _   _ ]      w starts past every real value,
                 ^       ^            and falls no faster than i
```

*`w >= i` is not luck. `w` starts `n` cells further right and both decrement by at most one per step, so the gap can never close.*

**Recognition — reach for this when:**

- ✓ The destination buffer **is** one of the sources, with slack at the end.
- ✓ You are merging two ordered runs and must not allocate a second array.
- ✓ A forward pass would overwrite something you still need to read.
- ✗ But **not** when the destination is a separate array — then direction is a free choice and forward is more readable.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★25 | **88. Merge Sorted Array** | Easy | F | The whole point: writing forward clobbers unread input; writing backward cannot. Also: the loop condition depends only on `j`. |

#### Why it works — why the write head can never clobber

One inequality carries the whole sub-variant. Everything else is bookkeeping around it.

1. **The invariant.** `w >= i` and `w >= j` at all times, so the write head never lands on unread input.
2. **Why `w >= i` holds.** `w` starts at `m + n - 1` and `i` at `m - 1`, a gap of `n`. Each iteration decrements `w` by exactly one and **at most one** of `i` or `j`. So `w` falls no faster than `i`, and the gap never closes.
3. **Why the loop tests `j` only.** If `j` runs out, whatever remains in `a[0..i]` is already sorted **and already sitting in its final position**. There is literally nothing to do, so the loop should stop.
4. **Why the `i >= 0` guard is inside the ternary.** If `i` runs out first, the remaining elements of `b` still need copying. The guard makes the ternary fall through to `b[j--]` and drains `b` correctly.

> **The rule worth generalising past this problem:** write from the tail whenever destination and source overlap. LC 88 is the smallest instance of a move you will reuse for in-place shifts and any resize-in-place.

**The asymmetric loop condition surprises people.** Looping on `j` alone looks like a bug until you say the reason out loud: leftover `a` values are already home; leftover `b` values are not.

**Guard order matters.** `(i >= 0 && a[i] > b[j])` — Java short-circuits left to right, so the bounds check must come first or the comparison reads `a[-1]`.

#### Walkthrough — LC 88 — every write, from the back

`a = [1, 3, 5, _, _, _]` with `m = 3`, `b = [2, 4, 6]` with `n = 3`. Watch `w` stay strictly ahead of `i` in every single row.

```
a = [ 1   3   5   _   _   _ ]        b = [ 2   4   6 ]
              ^i          ^w                      ^j
```

| # | w | i | j | Compare | Write | a after the write |
|---|---|---|---|---|---|---|
| 1 | 5 | 2 | 2 | `a[2]=5 > b[2]=6`? no | `a[5] = 6`, `j--` | [1, 3, 5, _, _, 6] |
| 2 | 4 | 2 | 1 | `a[2]=5 > b[1]=4`? yes | `a[4] = 5`, `i--` | [1, 3, 5, _, 5, 6] |
| 3 | 3 | 1 | 1 | `a[1]=3 > b[1]=4`? no | `a[3] = 4`, `j--` | [1, 3, 5, 4, 5, 6] |
| 4 | 2 | 1 | 0 | `a[1]=3 > b[0]=2`? yes | `a[2] = 3`, `i--` | [1, 3, 3, 4, 5, 6] |
| 5 | 1 | 0 | 0 | `a[0]=1 > b[0]=2`? no | `a[1] = 2`, `j--` | [1, 2, 3, 4, 5, 6] |

`j` hits `-1`, the loop exits, and `a[0] = 1` was never touched — it was already in its final position, which is exactly what step 3 of the proof predicted. Note row 2: `a[4]` was written with the value read from `a[2]`, and `a[2]` was not needed again until row 4 had already consumed it.

#### Key observations — what interviewers are listening for

- **Name the failure before you name the fix.** *Forward merge clobbers `a[i]` before I read it.* Stating the bug first makes the backward choice sound derived rather than memorised.
- **The invariant is a single inequality.** `w >= i`. If you can produce that and its one-line justification, the rest of the code writes itself.
- **The loop condition is the interesting line.** Looping on `j` only is the part interviewers probe. Have the reason ready: leftover `a` is already in place.
- **This generalises well beyond merging.** *Destination overlaps source, so write from the end* is the transferable sentence — it applies any time you compact or expand an array in place.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Merging forward into the shared array | the first write destroys `a[0]`, and the output is scrambled in a way that still looks plausible on sorted-ish input. | Write **backward** whenever the destination and source overlap. |
| Looping on `i` instead of `j` | leftover `b` values never get copied, so the head of the array keeps stale zeros. | Loop on `j`. Leftover `a` is already home; leftover `b` is not. |
| Dropping the `i >= 0` guard | `ArrayIndexOutOfBounds` as soon as `a` is exhausted before `b`. | Keep the guard **first** inside the ternary — Java short-circuits left to right. |

#### Key takeaway

- **Trigger:** merge into a buffer that is also a source, with slack at the end.
- **Rule:** start `w` at `m + n - 1` and write the **larger** value, moving backward.
- **Invariant:** `w >= i` and `w >= j`, so the write head never lands on unread input.
- **Loop on `j` only:** leftover `a` values are already in their final positions.
- **Gate:** F is yours when you can explain why forward merge clobbers and backward does not, in terms of the `w >= i` invariant. See [§5.1](index.md#55-two-pointers).


### G — Fast/slow and gap pointers

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★26 | **876. Middle of the Linked List** | Easy | G | Speed-ratio pointers. Note which middle you get for even length depending on the loop condition. |
| ★27 | **141. Linked List Cycle** | Easy | G | Floyd detection. |
| ★28 | **142. Linked List Cycle II** | Medium | G | Floyd *entry point*. You must be able to derive `2(a+b) = a+b+kc` on a whiteboard, not memorize the reset step. |
| ★29 | **287. Find the Duplicate Number** | Medium | G | Floyd on an **implicit functional graph** (`i → a[i]`). This is the transfer step — cycle detection without a linked list. |
| ★30 | **19. Remove Nth Node From End** | Medium | G2 | Gap pointers (fixed offset, not speed ratio) + the dummy-head idiom. |
| ○31 | 202. Happy Number | Easy | G | Floyd on a number sequence. Same idea as #29, cheaper. |
| ○32 | 143. Reorder List | Medium | G + reverse | Composition: find middle → reverse → merge. Good integration rep. |
| ○33 | 234. Palindrome Linked List | Easy | G + reverse | Same composition, easier. Pick one of #32/#33, not both. |

### H — Partitioning

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★34 | **75. Sort Colors** | Medium | H | Dutch national flag. Three-way partition with a 4-region invariant and the "don't advance `mid` after a high swap" trap. |
| ★35 | **215. Kth Largest Element in an Array** | Medium | H | Quickselect: partitioning as a *search* primitive, with expected O(n). Also the standard "can you do better than a heap?" follow-up. |
| ○36 | 905. Sort Array By Parity | Easy | H | Two-way partition. Redundant if #34 is solid. |

### I — Expand around center

> **Intuition.** Every palindrome has a centre. There are only `2n-1` possible centres, so try each one and grow outward for as long as the characters keep matching.

**Mental model.** *"Instead of asking *is this substring a palindrome?* for all n-squared substrings, I ask *how far does the palindrome centred here reach?* — and the answer falls out of the growing itself."*

`2n-1` centres, because a palindrome can be centred on a **character** (odd length, n of those) or in the **gap between two characters** (even length, n-1 of those). Forgetting the even centres is the classic omission and it fails on inputs as small as `"aa"`.

Mechanically this is a two-pointer like any other: `l` and `r` start together and move **outward** while the invariant holds. The only novelty is that the loop deliberately overshoots, so the result needs a correction.

```
   s =   a     b     a          n = 3, so 2n-1 = 5 centres
        ^  ^  ^  ^  ^
        |  |  |  |  |
  odd      0     1     2         expand(c, c)
  even        0     1            expand(c, c+1)

   inside the loop:  s[l..r] is a palindrome
   after the loop:   the loop has stepped ONE TOO FAR on each side
```

*Two calls per index is the whole cost of covering both parities — and it is why the outer loop runs `n` times but there are `2n-1` centres.*

**Recognition — reach for this when:**

- ✓ The answer is a **palindromic substring** — longest, count, or a specific one.
- ✓ Contiguity matters. Palindromic *subsequences* are a different problem entirely (that is DP).
- ✓ You can afford `O(n^2)` — which the constraints will usually tell you.
- ✗ But **not** if you genuinely need `O(n)`. That is Manacher's algorithm, which is rarely what an interview is testing.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★37 | **5. Longest Palindromic Substring** | Medium | I | Odd and even centers, and the post-loop `[l+1, r-1]` correction. |
| ★38 | **647. Palindromic Substrings** | Medium | I | Counting instead of maximizing; each successful expansion is `+1`. |

#### Why it works — the overshoot, and the correction it forces

The expansion loop is trivially correct. The bug surface is entirely in what the loop leaves behind when it stops.

1. **The invariant.** Inside the expand loop, `s[l..r]` is a palindrome. That is what the loop maintains and it is true at every check.
2. **The growth rule.** If `s[l-1] == s[r+1]`, then wrapping those two characters around a palindrome yields a longer palindrome. So push both pointers outward.
3. **The exit condition overshoots.** The loop stops the moment the test fails — but it has **already decremented `l` and incremented `r`**. So at exit, `s[l..r]` is *not* the palindrome; it is one character too wide on each side.
4. **The correction.** The real palindrome is `[l+1, r-1]`, and its length is `(r-1) - (l+1) + 1 = r - l - 1`. Both the bounds and the length formula come from the same off-by-one.

> **The correction everybody gets wrong exactly once:** the loop exits one step too far on **each** side, so the palindrome is `[l+1, r-1]` and its length is `r - l - 1` — not `r - l + 1`.

**LC 647 counts instead of maximising.** Every *successful* expansion corresponds to exactly one distinct palindromic substring, so the body becomes `count++` and no correction is needed at all — you are counting iterations, not measuring a final window.

**The out-of-bounds guards double as the exit.** `l >= 0 && r < s.length()` sits in the same condition as the character comparison, so running off either end simply ends the expansion. No separate boundary case is required.

**Cost is `O(n^2)` worst case** — for example `"aaaa..."`, where every centre expands the full width. That is expected and acceptable here; `O(n)` requires Manacher's, which is almost never the point of the question.

#### Walkthrough — both parities on the string "aba"

Two calls, showing the successful odd centre and an even centre that dies immediately. Watch the final row of each: the returned bounds are **not** the loop's exit bounds.

```
index   0   1   2
char    a   b   a
```

| # | Call | l | r | Test | Outcome |
|---|---|---|---|---|---|
| 1 | `expand(1,1)` | 1 | 1 | `s[1]=='b'` vs itself → match | expand: `l--`, `r++` |
| 2 | `expand(1,1)` | 0 | 2 | `s[0]=='a'` vs `s[2]=='a'` → match | expand: `l--`, `r++` |
| 3 | `expand(1,1)` | -1 | 3 | `l >= 0` fails → stop | Return `[l+1, r-1]` = `[0, 2]`, length `r-l-1` = `3-(-1)-1` = **3** → `"aba"` |
| 4 | `expand(0,1)` | 0 | 1 | `s[0]=='a'` vs `s[1]=='b'` → no match | Loop body never runs |
| 5 | `expand(0,1)` | 0 | 1 | stop immediately | Return `[1, 0]`, length `1-0-1` = **0** → empty, correctly |

Row 3 is the correction doing real work: the loop exited at `l = -1, r = 3`, which is not even a valid range. Row 5 shows the same formula degrading gracefully to length zero when the centre fails on the first test — no special case needed.

#### Key observations — what interviewers are listening for

- **State the correction before you write the loop.** `[l+1, r-1]`, length `r - l - 1`. Writing it down first stops you from deriving it under pressure, which is when the sign errors happen.
- **Both parities, always.** `expand(c, c)` and `expand(c, c+1)` on every index. A solution that handles only odd centres fails on `"aa"` — one of the first tests any interviewer reaches for.
- **This is mechanically a two-pointer, taught elsewhere as a string or DP problem.** Recognising it as the same family — an invariant maintained over a growing region — is exactly the kind of connection the pattern breakdown is built to surface.
- **Counting and maximising need different bookkeeping.** LC 5 needs the corrected bounds; LC 647 needs only a counter incremented per successful expansion. Same skeleton, different read-off.
- **Know that Manacher's exists, and that it is not the answer here.** Naming the `O(n)` algorithm and then explaining why `O(n^2)` is appropriate for the constraints reads as judgement. Reaching for Manacher's unprompted usually does not.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Using `[l, r]` after the loop | off-by-two on **every** answer — the returned substring is always two characters too long. | The loop overshoots by one on each side. Use `[l+1, r-1]`, length `r - l - 1`. |
| Only expanding odd centres | fails on any even-length palindrome, starting with `"aa"`. | Two calls per index: `expand(c, c)` and `expand(c, c+1)`. |
| Computing length as `r - l + 1` | consistently two too large, which then corrupts the best-so-far comparison. | After the overshoot the length is `r - l - 1`. Derive it from `(r-1) - (l+1) + 1`. |
| Checking bounds outside the loop condition | either an out-of-bounds read or a clumsy special case for the string's ends. | Put `l >= 0 && r < s.length()` in the **same** condition as the character test. |

#### Key takeaway

- **Trigger:** palindromic **substring** — longest, count, or locate.
- **Rule:** try all `2n-1` centres; grow outward while `s[l] == s[r]`.
- **Correction:** the loop overshoots, so the answer is `[l+1, r-1]` with length `r - l - 1`.
- **Cost:** `O(n^2)` time, `O(1)` space. Manacher's is the `O(n)` alternative, rarely required.
- **Gate:** I is yours when the `[l+1, r-1]` correction comes from memory and you compute the length as `r - l - 1`. See [§5.1](index.md#55-two-pointers).


### J — Cyclic sort

> **Intuition.** Value `v` belongs at index `v-1`. Keep sending whatever you are holding to its home and picking up whatever was there — and only step forward when the thing in your hand has nowhere to go.

**Mental model.** *"Numbered books, numbered shelves. I pick up a book, put it on its own shelf, and pick up whatever was already there. I move to the next shelf only when the book in my hand is already home, or does not belong in this library at all."*

This is **index-as-hash**: the array *is* the hash table. That is the entire source of the `O(1)` space, and it is why the pattern only applies when the values are constrained to roughly `[1..n]` — the value has to name a legal index.

The subtle part is termination. The inner `while` can swap several times at the same `i`, so the loop is not obviously linear. It is, and the reason is worth saying: **every swap places at least one value in its permanent home**, and there are only `n` homes.

```
   value v   ->   home index v-1

   a = [3, 4, -1, 1]     n = 4
        ^i=0   a[0]=3 wants index 2, and a[2] != 3   -> swap
   a = [-1, 4, 3, 1]
        ^i=0   a[0]=-1 is out of range               -> i++

   swap phase puts values home;  a SECOND PASS reads off the answer:
   first index k with a[k] != k+1   ->   the answer is k+1
```

*Two phases, and the second is not optional. Placing values home does not answer the question — the verification pass does.*

**Recognition — reach for this when:**

- ✓ An array of `n` elements whose values are confined to roughly `[1..n]`.
- ✓ The question is *missing*, *duplicate*, or *first absent positive*.
- ✓ `O(1)` extra space is demanded — otherwise a boolean array or a set is simpler and clearer.
- ✗ But **not** when values are unbounded or sparse. Then the value cannot name an index and the whole premise collapses.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★39 | **448. Find All Numbers Disappeared in an Array** | Easy | J | Index-as-hash. Introduces the O(1)-space alternative to a boolean array. |
| ★40 | **41. First Missing Positive** | Hard | J | The full form: out-of-range guarding, duplicate guarding (`a[i] != a[correct]`, **never** index comparison), and the second verification pass. Solve this and J is closed. |
| ○41 | 442. Find All Duplicates in an Array | Medium | J | Sign-marking variant of the same idea. |
| ○42 | 268. Missing Number | Easy | J | Trivial after #39; XOR/sum solutions are better anyway. |

#### Why it works — termination, and the two guards that protect it

Cyclic sort is one of the few patterns here where the **loop terminating at all** is the non-obvious claim, and where a plausible-looking guard causes an infinite loop.

1. **The invariant.** Once `a[i] == i + 1`, index `i` is permanently correct and is never disturbed again.
2. **Termination.** Every swap places at least one value in its final home. There are `n` homes, so there are at most `n` swaps in total across the entire run — the algorithm is `O(n)` despite the nested `while`.
3. **Why you must compare **values**.** With duplicates, two equal values want the same home. The index test `i != correct` stays true forever and the loop spins. The value test `a[i] != a[correct]` sees that the home is already occupied by the right value and moves on.
4. **Why the range guard must come first.** `correct = a[i] - 1` is only a legal index when `a[i]` is in `[1..n]`. The guard `a[i] >= 1 && a[i] <= n` must be evaluated **before** `a[correct]` is touched — short-circuit order is doing real work here, not just tidiness.

> **The two guards that make it both safe and finite:** `a[i] >= 1 && a[i] <= n && a[i] != a[correct]` — range **first** so the index is legal, and compare **values**, never indices.

**The verification pass is the actual answer.** The swap phase only arranges; it does not report. Scan for the first `k` with `a[k] != k + 1` and return `k + 1`; if every slot is correct, the answer is `n + 1`.

**Same machine, different read-off.** LC 448 collects *all* indices that fail the check; LC 41 returns only the first. The arrangement phase is identical.

**LC 442 is the sign-marking cousin.** Instead of moving values, negate `a[|v|-1]` to record *seen*. Same index-as-hash idea, different encoding — worth knowing that both exist.

#### Walkthrough — LC 41 on [3, 4, -1, 1]

`n = 4`. Note how `i` refuses to advance while a swap is still productive, and how the out-of-range value at index 0 is simply stepped over.

```
index   0    1    2    3
value   3    4   -1    1        n = 4
```

| # | i | a[i] | Decision | Array after |
|---|---|---|---|---|
| 1 | 0 | 3 | home is index 2; `a[2] = -1` != 3 → **swap**, `i` stays | [-1, 4, 3, 1] |
| 2 | 0 | -1 | out of range → `i++` | [-1, 4, 3, 1] |
| 3 | 1 | 4 | home is index 3; `a[3] = 1` != 4 → **swap**, `i` stays | [-1, 1, 3, 4] |
| 4 | 1 | 1 | home is index 0; `a[0] = -1` != 1 → **swap**, `i` stays | [1, -1, 3, 4] |
| 5 | 1 | -1 | out of range → `i++` | [1, -1, 3, 4] |
| 6 | 2 | 3 | home is index 2 — already correct → `i++` | [1, -1, 3, 4] |
| 7 | 3 | 4 | home is index 3 — already correct → `i++`, loop ends | [1, -1, 3, 4] |
| 8 | -- | -- | **Verification pass:** `a[0] = 1` is correct; `a[1] = -1` != 2 → **return 2** | answer = 2 |

Four swaps for four elements, exactly as the termination argument predicts. Rows 3 and 4 are a chain — one swap enabling the next at the same index — which is precisely the case that makes the linear bound look doubtful until you count *placements* rather than iterations.

#### Key observations — what interviewers are listening for

- **Count placements, not iterations, when you argue the cost.** *Each swap puts at least one value permanently home, and there are only n homes.* That single sentence answers the obvious objection to the nested loop.
- **The value-versus-index comparison is the whole trap.** `a[i] != a[correct]`, never `i != correct`. Duplicates make the index form spin forever, and the difference is invisible on duplicate-free test data.
- **Short-circuit order is load-bearing, not stylistic.** The range guard protects the array access that follows it in the same expression. Reordering the conditions turns correct code into an exception.
- **Two phases, and the second is where the answer lives.** Candidates who stop after the swap loop have arranged the data and answered nothing.
- **LC 41 is the hardest gate in this pattern.** It needs the range guard, the value guard and the verification pass all correct simultaneously. The table is explicit that solving it closes the sub-variant.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Comparing indices: `i != correct` | infinite loop the moment the input contains a duplicate. | Compare **values**: `a[i] != a[correct]`. The home is satisfied when it holds the right value, regardless of which copy got there. |
| Omitting the range guard | `ArrayIndexOutOfBounds` on negatives or on values larger than `n`. | Guard `a[i] >= 1 && a[i] <= n` **first** — short-circuit order is what protects the index. |
| Advancing `i` after a swap | values get stranded, because the value you just swapped in has not been examined. | `i` advances **only** when no productive swap is available: out of range, or already home. |
| Skipping the verification pass | the array ends up arranged but the function returns nothing meaningful. | Scan for the first `k` where `a[k] != k + 1`, return `k + 1`, and return `n + 1` if the scan completes. |

#### Key takeaway

- **Trigger:** `n` elements with values in `[1..n]`, asking for a missing or duplicate value in `O(1)` space.
- **Rule:** send `a[i]` to index `a[i] - 1`; advance `i` only when the value is out of range or already home.
- **Two guards:** range **first**, then compare **values** (`a[i] != a[correct]`), never indices.
- **Two phases:** arrange, then verify — the verification pass is the answer.
- **Gate:** J is yours when LC 41 comes out blind with the range guard, the value guard and the verification pass all correct. This is the hardest gate in the pattern. See [§5.1](index.md#55-two-pointers).


### K — Counting pairs on sorted data

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★43 | **611. Valid Triangle Number** | Medium | K | Fix the largest side, converge, and count `r − l` at once instead of one at a time. This batching insight is the bridge to sliding-window counting (§2.F). |

---

### Extra Reps — Two Pointers (only if a gate fails)

| Problem | Targets |
|---|---|
| 31. Next Permutation | Backward scan + converge-reverse. Very commonly asked; not pattern-novel. |
| 189. Rotate Array (reversal method) | Three-reversal trick. |
| 581. Shortest Unsorted Continuous Subarray | Two independent sweeps with running max/min. |
| 763. Partition Labels | Greedy boundary extension, two-pointer-shaped. |
| 923. 3Sum With Multiplicity | Combinatorial counting on top of variant C. |
| 349 / 350. Intersection of Two Arrays I/II | Basic variant E reps. |

---

## 1.3 Templates

### A — Converging on sorted data

> **Intuition.** Put a finger on each end of a **sorted** array. The sum you are looking at tells you which finger is useless — drop it, and you drop **every pair it could ever have formed** along with it.

**Mental model.** *"I am looking at the smallest and the largest value still in play. If even this pair overshoots the target, then the largest value overshoots with every partner that is left — so it is not part of any answer. Gone. Same logic, mirrored, if the pair undershoots."*

Think of every possible pair as one cell in a grid. Brute force visits all `n²/2` cells. Converging pointers never visit a cell at all — each comparison deletes an entire **row** or an entire **column**. There are only `2n` rows and columns to delete, which is the whole reason this is linear.

```
                      right pointer r →
               1    2    5    9   12   14
         1  |    |  3 |  3 |  3 |  2 |  1 |    digit = the step that
         2  |    |    | ·  | 11 |  2 |  1 |    eliminated that pair
    l    5  |    |    |    | ·  |  2 |  1 |
    ↓    9  |    |    |    |    |  2 |  1 |    11 = the hit
        12  |    |    |    |    |    |  1 |    ·  = never examined
        14  |    |    |    |    |    |    |
```

*a = [1, 2, 5, 9, 12, 14], target 11. Fifteen real pairs (the upper triangle); four comparisons resolve all of them. The pointers are not scanning, they are slicing.*

**Recognition — reach for this when:**

- ✓ The data is **sorted**, or you are allowed to sort it.
- ✓ The answer is a **pair**, or a verdict about the two ends (palindrome, container, match).
- ✓ Moving one end changes the quantity you care about in a **predictable direction** — that is what makes a discard provable.
- ✗ But **not** if the answer must report **original indices**. Sorting destroys them. That is LC 1 versus LC 167, the single most common misread in this pattern — use a hash map instead.


```java
// INVARIANT: every pair (i, j) with i < l or j > r has been proven not to be the answer.
// BOUNDARY: l < r  (strict). l == r would be a single element, not a pair.
//           Use l <= r ONLY if a pair of one element with itself is legal.
int l = 0, r = a.length - 1;
while (l < r) {
    int sum = a[l] + a[r];
    if (sum == target) return new int[]{l, r};
    if (sum < target) l++;      // a[l] is too small with EVERY remaining partner → discard it
    else               r--;     // a[r] is too big with EVERY remaining partner → discard it
}
return new int[]{-1, -1};
```

#### Why it works — the discard proof

Everything rests on one claim: **when you move a pointer you are not skipping candidates, you are eliminating proven-impossible ones.** In full, for the case `a[l] + a[r] < target`:

1. **The invariant.** Every pair `(i, j)` with `i < l` or `j > r` has already been proven not to be the answer. At the start this is vacuously true — nothing is outside the window yet.
2. **The situation.** Suppose `a[l] + a[r] < target`. The partner currently paired with `l` is the *largest value still available*.
3. **The consequence of sortedness.** For every remaining `j <= r` we know `a[j] <= a[r]`. Therefore `a[l] + a[j] <= a[l] + a[r] < target`.
4. **The discard.** So `a[l]` falls short against *every* partner that remains. No pair containing `l` can be the answer. Advancing `l` deletes that whole row and restores the invariant. The case `a[l] + a[r] > target` is the mirror image.

> **Say it in one sentence:** if `a[l] + a[r] < target` then for all `j <= r`, `a[l] + a[j] <= a[l] + a[r] < target`, so `l` participates in no valid pair among the remaining candidates. That sentence is the whole proof — be able to say it out loud, unprompted.

**Termination and cost.** Every iteration moves exactly one pointer inward, so `r - l` strictly decreases. The loop runs at most `n - 1` times — `O(n)` after an `O(n log n)` sort, `O(1)` extra space.

**Why the bound is strict.** `l < r`, not `l <= r`. At `l == r` you are looking at one element, not a pair. Use `l <= r` *only* when pairing an element with itself is legal in that problem.

#### Walkthrough — every pointer move, and why it is safe

`a = [1, 2, 5, 9, 12, 14]`, `target = 11`. Read the last column as the sentence you would say to an interviewer.

```
index   0    1    2    3    4    5
value   1    2    5    9    12   14
        ↑l                      ↑r
```

| # | Window | Sum | vs 11 | Move | What you just proved |
|---|---|---|---|---|---|
| 1 | `l=0 (1) · r=5 (14)` | 15 | too big | `r--` | 14 is paired with the *smallest* value left and still overshoots → 14 overshoots with everything. Its whole column is dead. |
| 2 | `l=0 (1) · r=4 (12)` | 13 | too big | `r--` | Same argument, one column over. 12 is out. |
| 3 | `l=0 (1) · r=3 (9)` | 10 | too small | `l++` | Now flipped: 1 is paired with the *largest* value left and still falls short → 1 falls short with everything. Its whole row is dead. |
| 4 | `l=1 (2) · r=3 (9)` | 11 | **hit** | `return` | Found. Note LC 167 wants **1-based** indices — return `{2, 4}`, not `{1, 3}`. |

**Fifteen pairs existed. You evaluated four.** The other eleven were not skipped by luck — step 1 disposed of five at once, step 2 of four, step 3 of three. That is row/column deletion happening one line at a time.

#### Key observations — what interviewers are listening for

- **The proof is the deliverable, not the code.** The loop is six lines and everyone can write it. What separates candidates is justifying the move rule without being asked. Volunteer it.
- **"Move the side that can only improve" is the entire movement rule**, and every later sub-variant is a different answer to the question *which side can only improve?* In B it becomes a greedy argument about walls; in C it runs inside two fixed loops; in K it stops moving and starts counting.
- **Pointers may advance without a comparison.** LC 125 skips non-alphanumeric characters inside the loop — the converging skeleton stays identical while the step rule gains a guard. Recognising that the skeleton is invariant is what makes the family feel like one technique instead of eleven.
- **Sortedness is the load-bearing assumption**, not a convenience. Step 3 of the proof is the *only* place it is used, and without it the discard is invalid. If a problem is not sorted, either sort it and pay `O(n log n)`, or accept that this pattern does not apply.
- **Read the required output type before you reach for a sort.** This costs more interviews than any algorithmic error — see the anti-pattern note under LC 1 in the table above.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| `while (l <= r)` on a pair problem | Returns a "pair" made of one element with itself | Ask explicitly: **is `l == r` a legal state here?** For pairs it is not, so the bound is strict. |
| Sorting when the answer needs original indices | Correct values, wrong output — the classic wrong answer on LC 1 | Before sorting, ask **does the output reference positions?** If yes, sorting is off the table; use a hash map. |
| Moving both pointers after a miss | Intermittently misses valid pairs, passes small tests | The proof justifies discarding **exactly one** end — the one you just tested. The other was never shown impossible, so it stays. |
| Expecting it to enumerate *all* matching pairs | Duplicate results once the array contains repeated values | Plain A returns one pair. Enumerating every distinct pair needs the dedup discipline of sub-variant **C** — do not improvise it here. |

#### Key takeaway

- **Trigger:** sorted data + the answer is a pair + no original indices required.
- **Rule:** compare against the target, then discard the end that provably cannot help.
- **Proof, in one breath:** if `a[l] + a[r] < target`, then `a[l]` is too small for every partner that remains.
- **Bound:** `l < r` is strict for pair problems. `O(n)` time, `O(1)` space.
- **Gate:** you own A when you can write the template blind and state that proof in one sentence — see [§5.1](index.md#55-two-pointers).

### B — Converging with a discard proof

> **Intuition.** Same two fingers walking inward — but now arithmetic cannot tell you which one to move. You have to **prove** that one end is dead weight before you are allowed to drop it.

**Mental model.** *"One of these two walls is the short one. It caps my height no matter what I do next, and every container I can still build is narrower than this one. So this wall's best possible future is worse than what I have already written down. Drop it."*

In sub-variant **A** the comparison against the target *computes* the answer for you. Here there is no target — the objective is a quantity you are maximising, and the only way to justify a move is a **discard argument**: every future candidate that still uses this pointer is worse on *every* factor at once.

For LC 11 the objective is `area(l, r) = min(h[l], h[r]) * (r - l)`. It has exactly two factors, and moving inward can only shrink one of them while the shorter wall caps the other. That is the whole lever.

```
   h = [1, 7, 3, 6, 4]

        |         7                        width r-l = 4
        |         |         6              height = min(1, 4) = 1   <- capped by the SHORT wall
        |         |    4    |    4         area = 4
        |    1    |    |    |    |
        +----#----+----+----+----#----
             l                   r

   Move l (the short wall). Keeping it means: narrower AND still capped at 1.
```

*The short wall is not a bottleneck you can widen — it is a ceiling on every container that still touches it. That is why discarding it loses nothing.*

**Recognition — reach for this when:**

- ✓ Two ends, and the objective depends on **both** of them at once.
- ✓ One end is the **limiter** — the shorter wall, the smaller running maximum, the binding constraint.
- ✓ Moving the non-limiting end can only make things worse, and you can say *why* in one sentence.
- ✗ But **not** if moving either end could improve the objective. Then no discard is provable and you are looking at a different pattern entirely.


```java
// 11. Container With Most Water
// INVARIANT: the optimal answer is always inside the still-open window [l, r].
// BOUNDARY: l < r. Area of a zero-width container is 0, so l == r is meaningless.
int l = 0, r = h.length - 1, best = 0;
while (l < r) {
    int height = Math.min(h[l], h[r]);
    best = Math.max(best, height * (r - l));
    // Discard the SHORTER wall. Any container still using it would have smaller
    // width AND height capped by the same value → it can never beat what we just recorded.
    if (h[l] < h[r]) l++;
    else             r--;      // tie: either side is safe
}
```

```java
// 42. Trapping Rain Water
// INVARIANT: leftMax  = max of h[0..l]   (fully known)
//            rightMax = max of h[r..n-1] (fully known)
// KEY: the side with the SMALLER max is fully determined — the other side is guaranteed
//      to have a wall at least as tall, so water above it depends only on its own max.
int l = 0, r = h.length - 1, leftMax = 0, rightMax = 0, water = 0;
while (l < r) {
    if (h[l] < h[r]) {                          // left side is the limiting one
        leftMax = Math.max(leftMax, h[l]);
        water  += leftMax - h[l];               // never negative, by the line above
        l++;
    } else {
        rightMax = Math.max(rightMax, h[r]);
        water   += rightMax - h[r];
        r--;
    }
}
```

#### Why it works — the discard argument for LC 11

Assume `h[l] < h[r]`, so the left wall is the shorter one. We show that **no container using `l` can ever beat the one we just recorded**, which makes advancing `l` lossless.

1. **The objective.** `area(l, r) = min(h[l], h[r]) * (r - l)` — a width factor and a height factor.
2. **The candidates at risk.** Discarding `l` throws away every pair `(l, r')` with `r' < r`. Those are the only containers we lose, so those are the only ones we must rule out.
3. **Width strictly shrinks.** `r' < r`, so `r' - l < r - l`. Every surviving candidate that uses `l` is narrower.
4. **Height cannot grow.** `min(h[l], h[r']) <= h[l]`, and `h[l] = min(h[l], h[r])` because `h[l]` was the shorter wall. So the height factor is capped at exactly the value it already had — *whatever* `h[r']` turns out to be.
5. **Therefore the discard is safe.** Smaller width times no-larger height gives `area(l, r') < area(l, r)`, and `area(l, r)` is already in `best`. Nothing is lost by advancing `l`.

> **Say it in one sentence:** moving the taller wall can never increase area, because width shrinks and height is capped by the shorter wall. If you cannot say that out loud, unprompted, you do not have this sub-variant.

**Ties are free.** When `h[l] == h[r]` both walls cap the height identically, so either side may be discarded — the code's `else` branch picks one arbitrarily and stays correct.

**Record before you move.** `best` must be updated at the top of the loop body. Discard first and you can throw away the very window that held the maximum.

**LC 42 is the same argument one level up.** The invariant becomes `leftMax = max of h[0..l]` and `rightMax = max of h[r..n-1]`, both fully known. The key: the side with the **smaller max** is fully determined — the other side is guaranteed to have a wall at least as tall, so the water above the current cell depends only on its own side's max. That is why `water += leftMax - h[l]` is never negative: `leftMax` was updated to include `h[l]` on the line above.

#### Walkthrough — LC 11 on a five-bar skyline

`h = [1, 7, 3, 6, 4]`. Read the last column as the justification you would volunteer to an interviewer *before* they ask.

```
index   0    1    2    3    4
height  1    7    3    6    4
        ^l                  ^r
```

| # | Window | Area | Move | What you just proved |
|---|---|---|---|---|
| 1 | l=0 (1) . r=4 (4) | min(1,4) x 4 = 4 | l++ | 1 is the shorter wall. Any container still using it is narrower *and* still capped at height 1 — it cannot beat 4. |
| 2 | l=1 (7) . r=4 (4) | min(7,4) x 3 = 12 | r-- | New best. Now 4 is the shorter wall, so the argument mirrors: discard the right. |
| 3 | l=1 (7) . r=3 (6) | min(7,6) x 2 = 12 | r-- | Ties the best. 6 is shorter than 7, so the right side goes again. |
| 4 | l=1 (7) . r=2 (3) | min(7,3) x 1 = 3 | r-- | Pointers meet, loop exits. Answer 12, found at step 2 and confirmed at step 3. |

Ten containers exist for five bars. You evaluated four, and at no point did you compare a candidate against another candidate — each move was justified on its own, which is exactly what makes the greedy sound.

#### Key observations — what interviewers are listening for

- **This is the sub-variant that decides interviews.** In **A** you move because the sum is too small; in **B** you move because you can *prove* the discarded pointer is never in an optimal answer. Different reasoning — and B is where candidates fail, because they write the code correctly but cannot justify it.
- **The proof always has the same shape.** *Every future candidate that still uses this pointer is worse on every factor simultaneously.* If you cannot phrase your discard that way, the greedy is probably unsound.
- **"Fully determined" is the transferable idea.** LC 42's insight — that the side with the smaller maximum can be resolved *now*, because the other side is guaranteed to hold it up — is reused in dozens of hard problems. It is worth more than the problem it came from.
- **Order of operations is load-bearing.** Record, then discard. Update the running max, then accumulate. Both LC 11 and LC 42 have a line that is silently wrong if you swap the two statements.
- **An O(n squared) instinct passes the samples.** Checking all pairs works on small tests and then times out. Recognising that the objective admits a discard proof is the entire difference.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Discarding the **taller** wall | quietly wrong maximum — and it passes plenty of small tests. | The proof only licenses dropping the **limiting** side. Reverse it and you are throwing away candidates you never ruled out. |
| Recording the area *after* moving a pointer | off-by-one maximum; misses the answer exactly when the optimum is the current window. | Compute and store `best` at the **top** of the loop body, before any branch. |
| In LC 42, accumulating water before updating the max | negative contributions silently subtracting from the total. | `leftMax = Math.max(leftMax, h[l])` **first**, then `water += leftMax - h[l]` — which is then non-negative by construction. |
| Writing `while (l <= r)` | a zero-width container contributing area 0, or a phantom single-wall answer. | `l < r`. A container needs two distinct walls, so `l == r` is meaningless here. |

#### Key takeaway

- **Trigger:** two ends, an objective that depends on both, and one end is provably the limiter.
- **Rule:** discard the limiting side — the shorter wall, the smaller running max.
- **Proof, in one breath:** moving the taller wall can never increase area, because width shrinks and height is capped by the shorter wall.
- **LC 42 extension:** the side with the smaller max is fully determined; its water depends only on its own max.
- **Gate:** B is yours when you can prove *both* — LC 11's discard and LC 42's determination — out loud and unprompted. See [§5.1](index.md#55-two-pointers).


### C — k-Sum reduction (3Sum with all three dedup sites)

> **Intuition.** Freeze the outer indices with ordinary `for` loops and the innermost two collapse straight into sub-variant **A**. k-Sum is Two Sum wearing `k-2` loops.

**Mental model.** *"I am not solving 3Sum. I am solving n separate Two Sum problems, one per anchor value — and my only extra job is refusing to report the same triple twice."*

Sorting does **two** jobs here, and people only notice the first. It makes the inner converge valid, because A's discard proof needs sorted data. It also makes equal values **adjacent**, which is what turns duplicate-suppression into a comparison with a neighbour instead of a hash set.

The cost follows directly: one loop per fixed index, one linear converge at the bottom, so `O(n^(k-1))` — `O(n^2)` for 3Sum, `O(n^3)` for 4Sum.

```
for i ...                          <- DEDUP SITE 1: a[i] == a[i-1]  -> skip this anchor
    l = i+1,  r = n-1
    while l < r:
        ... on a hit:
        record the triple
        l++;  r--                      <- BOTH, always. Moving one loops or repeats.
        while (l < r && a[l] == a[l-1]) l++    <- DEDUP SITE 2   look BACKWARD
        while (l < r && a[r] == a[r+1]) r--    <- DEDUP SITE 3   look BACKWARD
```

*Three sites, not one. Site 1 stops a repeated anchor; sites 2 and 3 stop a repeated partner. All three compare against the value they just *left*.*

**Recognition — reach for this when:**

- ✓ `k` numbers summing to a target, with `k >= 3`.
- ✓ The answer is a set of **values**, so sorting is legal.
- ✓ Duplicate values exist in the input and duplicate tuples must not be reported.
- ✗ But **not** when `k = 2` and the output is **indices** — that is LC 1, and sorting destroys the answer. Hash map, one pass.


```java
Arrays.sort(a);
List<List<Integer>> res = new ArrayList<>();
for (int i = 0; i + 2 < a.length; i++) {
    if (a[i] > 0) break;                          // prune: sorted, so no negative sum possible
    if (i > 0 && a[i] == a[i - 1]) continue;      // DEDUP SITE 1: skip repeated anchor
    int l = i + 1, r = a.length - 1;
    while (l < r) {
        int s = a[i] + a[l] + a[r];               // use long if values can reach ~2^31
        if (s < 0)      l++;
        else if (s > 0) r--;
        else {
            res.add(List.of(a[i], a[l], a[r]));
            l++; r--;                             // MUST move both: fixing one loops forever
            while (l < r && a[l] == a[l - 1]) l++; // DEDUP SITE 2 (look BACKWARD, not forward)
            while (l < r && a[r] == a[r + 1]) r--; // DEDUP SITE 3
        }
    }
}
```


#### Why it works — the reduction, and why all three dedup sites are load-bearing

The algorithm is two claims stacked: that fixing an anchor leaves a genuine sub-variant A problem, and that adjacency after sorting makes dedup a constant-time test.

1. **The reduction.** Fix `a[i]`. What remains is *find two numbers in `a[i+1..n-1]` summing to `target - a[i]`* — literally sub-variant A, on a suffix.
2. **The inner converge stays valid.** A suffix of a sorted array is still sorted, so A's discard proof carries over unchanged. Nothing about the reduction weakens it.
3. **Sorting solves dedup too.** After sorting, equal values sit next to each other. So *have I already used this value in this position?* becomes a comparison with the immediate neighbour — no set, no extra space.
4. **Both pointers must move on a hit.** Advance neither and the loop spins forever. Advance only `l` and `(l+1, r)` can re-form the same sum with an equal value, re-recording the triple. `l++; r--;` is the only safe move.
5. **Dedup must look backward.** `a[l-1]` is the value you just stepped off, so it is guaranteed to exist. `a[l+1]` may be past the end of the array on the final iteration.

> **The rule that prevents the single most common 3Sum bug:** dedup by comparing to the element you just **left** (`a[l-1]`, `a[r+1]`), not the one ahead. Comparing forward reads out of bounds on the last iteration.

**The `a[i] > 0` prune is target-specific.** It is valid for 3Sum because the target is zero and the array is sorted — once the anchor is positive, everything after it is too, so no triple can reach zero. Change the target and the prune changes with it.

**4Sum forces `long`.** Four `int` values near `2^31` overflow silently and produce wrong answers only on adversarial input. Accumulate the sum in `long`.

**3Sum Closest changes the exit, not the movement.** There is no equality to return on, so you track a running best and never early-exit. The converge rule itself is untouched — which is the point of learning the family as one skeleton with different step rules.

#### Walkthrough — 3Sum on an array that contains duplicates

`a = [-1, 0, 1, 2, -1, -4]`, sorted to `[-4, -1, -1, 0, 1, 2]`, target `0`. Watch the highlighted row — that is a dedup site actually firing.

```
index    0     1     2     3     4     5
value   -4    -1    -1     0     1     2
```

| # | Anchor | l . r | Sum | Action |
|---|---|---|---|---|
| 1 | i=0 (-4) | l=1 → 4, r=5 | always < 0 | `l++` every time; no triple can use -4. Inner loop ends. |
| 2 | i=1 (-1) | l=2 (-1) . r=5 (2) | -1 + -1 + 2 = 0 | **Record** `[-1,-1,2]`, then `l++; r--`. |
| 3 | i=1 (-1) | l=3 (0) . r=4 (1) | -1 + 0 + 1 = 0 | **Record** `[-1,0,1]`, then `l++; r--` — pointers cross, inner loop ends. |
| 4 | i=2 (-1) | not entered | — | **SITE 1 fires:** `a[2] == a[1]`, so the whole anchor is skipped. Without this line you emit `[-1,-1,2]` a second time. |
| 5 | i=3 (0) | l=4 (1) . r=5 (2) | 0 + 1 + 2 = 3 > 0 | `r--`, pointers cross. Done. |

Result: `[[-1,-1,2], [-1,0,1]]`. Site 1 did visible work here. Sites 2 and 3 stay quiet on this input, but they fire the moment the array holds two copies of a *partner* rather than of an anchor — for example `[-2, 0, 0, 2, 2]`.

#### Key observations — what interviewers are listening for

- **The dedup discipline is what is actually being tested.** 3Sum is the single most-asked two-pointer problem, and everyone can write the converge. The signal is whether all three sites appear, correctly, on the first attempt.
- **Name the three sites out loud while coding.** Anchor, left partner, right partner. Candidates who narrate them almost never miss one; candidates who treat dedup as a single vague concern usually do.
- **Sorting is doing double duty.** Validity of the converge *and* adjacency of duplicates. Saying that unprompted demonstrates you understand why the approach works rather than that you have memorised it.
- **The generalisation is recursive.** k-Sum is *fix one index, solve (k-1)-Sum on the suffix*, with the base case being sub-variant A. After 4Sum the whole family is closed.
- **Every dedup `while` needs its own `l < r` guard.** The dedup loops can themselves run the pointers past each other, and the outer condition has already been checked by then.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Advancing only one pointer after a hit | infinite loop, or the same triplet recorded repeatedly. | After recording, always `l++; r--;` **before** the dedup loops run. |
| Deduping by looking forward (`a[l] == a[l+1]`) | `ArrayIndexOutOfBounds` on the last element. | Always dedup against the element you just left: `a[l-1]`, `a[r+1]`. |
| Dedup loops missing the `l < r` guard | pointers cross and you read garbage. | Every inner dedup `while` re-tests `l < r` as part of its own condition. |
| Summing in `int` on 4Sum | silent overflow — correct on the samples, wrong on adversarial input. | Accumulate in `long`. Four values near `2^31` is all it takes. |

#### Key takeaway

- **Trigger:** `k >= 3` numbers summing to a target, answer reported as values.
- **Rule:** sort, fix `k-2` indices with loops, converge on the final two.
- **Three dedup sites:** anchor, left partner, right partner — every one comparing **backward**.
- **Cost:** `O(n^(k-1))` time, dominated by the nested loops, plus the sort.
- **Gate:** C is yours when 3Sum comes out blind with all three sites correct on the first run, then 4Sum inside twelve minutes. See [§5.1](index.md#55-two-pointers).


### D — Read/write compaction

```java
// INVARIANT: a[0..w) is the finished, correct output. a[w..rd) is garbage we may overwrite.
// BOUNDARY: rd advances every iteration (guaranteed termination); w advances only on keep.
//           w <= rd always, so we never overwrite something we haven't read.
int w = 0;
for (int rd = 0; rd < a.length; rd++) {
    if (keep(a[rd])) a[w++] = a[rd];
}
return w;   // new logical length
```

```java
// "Keep at most K copies of each value" — 26 is K=1, 80 is K=2.
int w = 0;
for (int v : a) {
    if (w < K || a[w - K] != v) a[w++] = v;   // compare against the OUTPUT, not the input
}
return w;
```

### E — Two-sequence advance

```java
// INVARIANT: both cursors only ever move forward → O(m + n).
// RULE: advance the cursor that cannot possibly participate in a future match.
int i = 0, j = 0;
while (i < A.length && j < B.length) {
    if (match(A[i], B[j])) { consume(A[i], B[j]); i++; j++; }
    else if (A[i] endsFirst B[j]) i++;   // A[i] can never match anything later in B
    else                          j++;
}
```

```java
// 986. Interval List Intersections — the concrete form
while (i < A.length && j < B.length) {
    int lo = Math.max(A[i][0], B[j][0]);
    int hi = Math.min(A[i][1], B[j][1]);
    if (lo <= hi) res.add(new int[]{lo, hi});   // <=, not <: [3,3] is a valid intersection
    if (A[i][1] < B[j][1]) i++; else j++;       // drop whichever ENDS first
}
```

### F — Backward-writing merge

```java
// INVARIANT: w >= i and w >= j at all times → the write head never lands on unread input.
// BOUNDARY: loop on j only. If j runs out, the remaining a[0..i] is already in place.
//           If i runs out first, the ternary's (i >= 0) guard drains b correctly.
int i = m - 1, j = n - 1, w = m + n - 1;
while (j >= 0) {
    a[w--] = (i >= 0 && a[i] > b[j]) ? a[i--] : b[j--];
}
```

### G — Floyd and gap pointers

> **Intuition.** Two pointers on the **same** sequence, held either at a fixed **speed ratio** or a fixed **distance apart**. That one constraint answers *is there a cycle*, *where is the middle* and *what is n-th from the end* in a single pass, with no length precomputation.

**Mental model.** *"Two runners on one track. If the track loops, the faster runner laps the slower one and they collide — and I never needed to know how long the track was to find that out."*

Two different mechanisms share this name, which is why the breakdown lists them separately. **Speed ratio** (Floyd) answers cycle questions. **Fixed gap** (G2) answers positional questions. Same family, different constraint.

LC 287 is the transfer step, and the reason this sub-variant matters more than it looks: the *next* function is `i -> a[i]`, an **implicit functional graph**. There is no linked list anywhere in the problem, and Floyd still applies verbatim.

```
SPEED RATIO (Floyd)          slow += 1,  fast += 2
                             a collision proves a cycle exists

FIXED GAP (G2)               fast starts n nodes ahead, then both move by 1
                             when fast reaches the end, slow is exactly n from it

   dummy -> [1] -> [2] -> [3] -> [4] -> [5] -> null
              ^slow              ^fast          gap = 3, so slow lands on
                                                the PREDECESSOR of the target
```

*The gap form needs a dummy head so that deleting the real head requires no special case — `slow` ends on the predecessor, and a predecessor of the head has to exist.*

**Recognition — reach for this when:**

- ✓ A linked list, or any sequence with a **successor function** you can apply repeatedly.
- ✓ The question is about a cycle, a midpoint, or a position measured **from the end**.
- ✓ `O(1)` space is required, or you are told not to modify the input.
- ✗ But **not** when you need arbitrary random access or repeated queries — one pass is the point, and re-running it per query throws the advantage away.


```java
// Cycle detection. BOUNDARY: check fast != null && fast.next != null BEFORE the double hop.
ListNode slow = head, fast = head;
while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow == fast) {                 // meeting point reached
        // ENTRY POINT: let a = head→entry, b = entry→meet, c = cycle length.
        // fast travelled 2(a+b) = a+b+kc  ⇒  a+b = kc  ⇒  a = kc − b
        // ⇒ walking a steps from head and a steps from meet lands on the same node.
        ListNode p = head;
        while (p != slow) { p = p.next; slow = slow.next; }
        return p;
    }
}
return null;
```

```java
// Implicit functional graph (287): the "next" function is i -> a[i].
int slow = a[0], fast = a[a[0]];
while (slow != fast) { slow = a[slow]; fast = a[a[fast]]; }
slow = 0;
while (slow != fast) { slow = a[slow]; fast = a[fast]; }
return slow;
```

```java
// Gap pointers (19). Dummy head so that deleting the actual head needs no special case.
ListNode dummy = new ListNode(0, head), fast = dummy, slow = dummy;
for (int k = 0; k < n; k++) fast = fast.next;   // open a gap of exactly n
while (fast.next != null) { fast = fast.next; slow = slow.next; }
slow.next = slow.next.next;                     // slow is now the PREDECESSOR of the target
return dummy.next;
```

#### Why it works — Floyd's entry point, derived

Detection is easy to believe: a faster runner on a loop must eventually collide with a slower one. The **entry point** is the part worth deriving, and you should be able to do it on a blank page rather than recalling the reset step.

1. **Name the three distances.** `a` = head to entry, `b` = entry to the meeting point, `c` = cycle length.
2. **Write down what each pointer travelled.** At the meeting, `slow` has travelled `a + b`. `fast` has travelled `2(a + b)` because it moves twice as fast — and it has also travelled `a + b + kc`, having gone round the loop `k` times.
3. **Equate the two expressions for `fast`.** `2(a+b) = a+b+kc`, so `a + b = kc`, so `a = kc - b`.
4. **Read what that means.** Walking `a` steps from the head, and `a` steps onward from the meeting point, lands on the **same node** — the entry. So reset one pointer to the head and advance both one step at a time until they agree.

> **Derive this, never memorise it:** `2(a+b) = a+b+kc` gives `a+b = kc` gives `a = kc - b`, so walking `a` steps from head and `a` steps from the meeting point lands on the same node.

**Hop first, compare second.** Both pointers start at the head, so testing `slow == fast` before the first move reports a cycle on every input, including a single node.

**Both guards, in that order.** `fast != null && fast.next != null` — the second dereference is only safe because Java short-circuits left to right. Drop either and even-length acyclic lists throw.

**LC 876 has a deliberate ambiguity.** Which middle you land on for even-length lists depends on the loop condition; decide which one the problem wants before you write it.

**LC 287 rewrites the pointers as values.** `slow = a[0]`, `fast = a[a[0]]`, and the step becomes `slow = a[slow]`. Same algorithm, no nodes.

#### Walkthrough — cycle entry on a six-node list

`1 -> 2 -> 3 -> 4 -> 5 -> 3` (the tail links back to node 3). So `a = 2`, the entry is node 3, and the cycle `3 -> 4 -> 5` has length `c = 3`.

```
   [1] -> [2] -> [3] -> [4] -> [5]
                   ^             |
                   +-------------+
   a = 2 (head to entry)      c = 3 (cycle length)
```

| # | Phase | slow | fast | What it means |
|---|---|---|---|---|
| 0 | detect | 1 | 1 | Both start at the head. Do **not** compare yet — hop first. |
| 1 | detect | 2 | 3 | `slow` +1, `fast` +2. |
| 2 | detect | 3 | 5 | Still apart. |
| 3 | detect | 4 | 4 | **Collision.** A cycle exists. Here `b = 1`, and the identity checks out: `a = kc - b` gives `2 = 1*3 - 1`. |
| 4 | locate | 2 | 5 | Reset one pointer to the head; now both advance by **one**. |
| 5 | locate | 3 | 3 | They agree at node 3 — the entry. Return it. |

Phase two took exactly `a = 2` steps, which is what the derivation promised. If you can produce that promise before you write phase two, you are deriving the algorithm rather than recalling it.

#### Key observations — what interviewers are listening for

- **Derive the entry formula, do not recall it.** The mastery gate for this sub-variant is specifically *derive `a = kc - b` on a blank page*. Interviewers ask why the reset works far more often than they ask for the code.
- **LC 287 is the point of the whole sub-variant.** Applying Floyd to `i -> a[i]` without being told it is a linked-list problem is the transfer. The signal it sends is that you see cycle detection as a property of functional graphs, not of a data structure.
- **Speed ratio and fixed gap are different tools.** Ratio answers *is there a loop*; gap answers *how far from the end*. Conflating them produces confident, wrong code.
- **The dummy head is not decoration.** It removes the special case where the node to delete is the head itself. Reaching for it unprompted is a small, strong signal about linked-list fluency.
- **Composition problems are cheap once G is solid.** LC 143 and LC 234 are both *find middle, reverse, merge*. Pick one as an integration rep; doing both teaches nothing extra.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Comparing `slow == fast` before the first hop | reports a cycle immediately on every input — both pointers start at the head. | Hop first, compare second. The check belongs after the two moves, not before. |
| Guarding with only `fast != null` | `NullPointerException` on even-length acyclic lists, when `fast.next` is null but `fast` is not. | Both guards, in order: `fast != null && fast.next != null`. |
| Memorising the reset step without the derivation | you produce the right code and then cannot answer *why does that work?*, which is the actual question. | Derive `a = kc - b` from `2(a+b) = a+b+kc` every time until it is automatic. |
| Using a speed ratio where a fixed gap is wanted | off-by-one on *n-th from the end*, or a midpoint that is one node off. | Positional questions want a **gap**; cycle questions want a **ratio**. |

#### Key takeaway

- **Trigger:** cycle, midpoint, or position-from-the-end, in `O(1)` space and one pass.
- **Two mechanisms:** **speed ratio** for cycles (Floyd), **fixed gap** for positions (G2).
- **The derivation:** `2(a+b) = a+b+kc` gives `a = kc - b` — reset to head, then step both by one.
- **Guards:** `fast != null && fast.next != null`, in that order. Hop first, compare second.
- **Gate:** G is yours when you can derive the entry formula on a blank page and apply Floyd to LC 287 without being told it is a cycle problem. See [§5.1](index.md#55-two-pointers).


### H — Dutch national flag

> **Intuition.** Sweep once and file every element into one of three growing regions. The **unknown** region in the middle is squeezed from both sides until nothing is left unclassified.

**Mental model.** *"I am maintaining four regions at once: settled zeros, settled ones, a shrinking unknown middle, and settled twos at the back. Every iteration removes exactly one element from the unknown region and files it where it belongs."*

Three pointers, four regions. Every design decision in this algorithm — including the one that trips everybody — follows from a single question: **where did the value I just swapped in come from?** If it came from a classified region you already know what it is. If it came from the unknown region you do not.

LC 215 uses the same primitive as a **search** rather than a sort: partition once, then recurse only into the side that contains index `k`. That gives expected `O(n)`, and it is the standard answer to *can you do better than a heap?*

```
   [0, lo)     == 0            settled
   [lo, mid)   == 1            settled
   [mid, hi]   == UNKNOWN      <- shrinking, and CLOSED at both ends
   (hi, n)     == 2            settled

        0 0 0 | 1 1 | ? ? ? ? | 2 2
              ^lo   ^mid     ^hi

   low  swap: incoming value came from [lo, mid)  -> it is a 1 -> mid++  OK
   high swap: incoming value came from [mid, hi]  -> UNKNOWN   -> mid stays
```

*The unknown region is closed at both ends, which is why the loop condition is `mid <= hi` and not `mid < hi` — at `mid == hi` there is still one element nobody has looked at.*

**Recognition — reach for this when:**

- ✓ Elements fall into a small fixed number of **value classes** (two or three).
- ✓ In-place rearrangement with `O(1)` extra space and a single pass.
- ✓ Or: you need the k-th order statistic and want to beat a heap — partition as a search step.
- ✗ But **not** if the relative order **within** a class must be preserved. Partitioning is not stable; that needs a counting pass and a second array.


```java
// INVARIANT: [0, lo)   == 0
//            [lo, mid) == 1
//            [mid, hi] == UNKNOWN   ← the shrinking region
//            (hi, n)   == 2
// BOUNDARY: mid <= hi, NOT mid < hi. When mid == hi there is still one unexamined element.
int lo = 0, mid = 0, hi = a.length - 1;
while (mid <= hi) {
    if (a[mid] == 0)      { swap(a, lo++, mid++); }  // swapped-in value came from [lo,mid) ⇒ it's a 1 ⇒ safe to advance mid
    else if (a[mid] == 1) { mid++; }
    else                  { swap(a, mid, hi--); }    // swapped-in value came from the UNKNOWN region ⇒ do NOT advance mid
}
```


#### Why it works — the asymmetry, derived rather than memorised

The `mid++` on one swap and not the other is the entire problem. It is not arbitrary — it falls straight out of the region invariants.

1. **The four regions.** `[0, lo)` are zeros, `[lo, mid)` are ones, `[mid, hi]` is unknown, `(hi, n)` are twos. Note the unknown region is **closed** on both sides.
2. **The low swap advances `mid`.** When `a[mid] == 0` you swap it with `a[lo]`. The value swapped **back** into `mid` came from `[lo, mid)` — the region you have already classified as ones. So it is a 1, it is already in the right region, and `mid` may safely advance.
3. **The high swap does **not** advance `mid`.** When `a[mid] == 2` you swap it with `a[hi]`. The value swapped back came from `[mid, hi]` — the **unknown** region. Nobody has looked at it. Advancing `mid` would leave it forever unclassified.
4. **The loop bound follows.** Because the unknown region is closed, `mid == hi` still contains one unexamined element. The condition must be `mid <= hi`.

> **The asymmetry is the entire problem:** `mid++` on the low swap, no `mid++` on the high swap. Derive it from where the incoming value came from — do not memorise it.

**Quickselect reuses the primitive as a search.** Partition, look at where the pivot landed, and recurse into **only** the side containing `k`. Discarding one side each time gives expected `O(n)` rather than the `O(n log n)` of a full sort.

**LC 905 is the degenerate two-way case** and teaches nothing new once three-way is solid — which is exactly why the table marks it optional.

#### Walkthrough — DNF on [2, 0, 2, 1, 1, 0]

Watch rows 1 and 4. Both are high swaps, and in both `mid` deliberately stays where it is.

```
index   0   1   2   3   4   5
value   2   0   2   1   1   0
        ^lo,mid                 ^hi
```

| # | lo | mid | hi | a[mid] | Action | Array after |
|---|---|---|---|---|---|---|
| 1 | 0 | 0 | 5 | 2 | high swap with `a[5]`; `hi--`; **`mid` stays** — the incoming 0 is unexamined | [0, 0, 2, 1, 1, 2] |
| 2 | 0 | 0 | 4 | 0 | low swap with `a[0]` (no-op); `lo++`, `mid++` | [0, 0, 2, 1, 1, 2] |
| 3 | 1 | 1 | 4 | 0 | low swap with `a[1]` (no-op); `lo++`, `mid++` | [0, 0, 2, 1, 1, 2] |
| 4 | 2 | 2 | 4 | 2 | high swap with `a[4]`; `hi--`; **`mid` stays** again | [0, 0, 1, 1, 2, 2] |
| 5 | 2 | 2 | 3 | 1 | it is a 1, already in place; `mid++` | [0, 0, 1, 1, 2, 2] |
| 6 | 2 | 3 | 3 | 1 | same; `mid++` → now `mid = 4 > hi = 3`, loop exits | [0, 0, 1, 1, 2, 2] |

Row 1 is the whole lesson. Had `mid` advanced there, the 0 swapped in from the unknown region would never have been examined, and it would have been left sitting in the ones region — a silent, plausible-looking wrong answer.

#### Key observations — what interviewers are listening for

- **Derive the asymmetry out loud.** *Low swap pulls from a classified region, high swap pulls from the unknown region.* That one sentence is what the mastery gate asks for, and it is the difference between understanding DNF and having memorised it.
- **The closed unknown region forces `mid <= hi`.** Half-open versus closed regions is the recurring source of off-by-one bugs across this entire document. Write the region bounds down before writing the loop.
- **Partitioning is a search primitive, not just a sort step.** That reframing is what makes quickselect obvious rather than clever: you are binary searching over positions, using a partition as the test.
- **Partitioning is not stable.** If the problem cares about relative order inside a class, this pattern is wrong. Worth saying before you are asked.
- **Quickselect's `O(n)` is *expected*, not worst case.** Adversarial pivots give `O(n^2)`. Naming that unprompted, along with random pivot selection as the mitigation, is a strong signal.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Advancing `mid` after the high swap | unsorted output, silently — and small inputs often still come out right. | Trace where the swapped-in value came from. The high swap pulls from the **unknown** region, so it must be classified next iteration. |
| Writing `mid < hi` instead of `mid <= hi` | the last element is never classified. | The unknown region is **closed**: `[mid, hi]`. At `mid == hi` there is still work to do. |
| Advancing `lo` without advancing `mid` on the low swap | the ones region gets corrupted and elements are re-examined. | Both move together on a low swap: `swap(a, lo++, mid++)`. |
| Assuming quickselect must fully sort a side | you rebuild `O(n log n)` and lose the entire advantage. | Recurse into **only** the side containing `k`. Discarding the other half is where the speed comes from. |

#### Key takeaway

- **Trigger:** a small fixed set of value classes, in place, one pass, `O(1)` space.
- **Regions:** `[0,lo)` zeros, `[lo,mid)` ones, `[mid,hi]` **unknown and closed**, `(hi,n)` twos.
- **The asymmetry:** `mid++` on the low swap only — the high swap pulls an unexamined value into `mid`.
- **Bound:** `mid <= hi`, because the unknown region is closed at both ends.
- **Gate:** H is yours when you can write DNF blind with the correct bound and justify the missing `mid++` instantly. See [§5.1](index.md#55-two-pointers).


### I — Expand around center

```java
for (int c = 0; c < s.length(); c++) {
    expand(s, c, c);      // odd-length centers
    expand(s, c, c + 1);  // even-length centers
}

// INVARIANT: inside the loop, s[l..r] is a palindrome.
// BOUNDARY: the loop exits one step TOO FAR. The real palindrome is [l+1, r-1],
//           length = (r-1) - (l+1) + 1 = r - l - 1.
private int[] expand(String s, int l, int r) {
    while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) { l--; r++; }
    return new int[]{l + 1, r - 1};
}
```

### J — Cyclic sort

```java
// INVARIANT: once a[i] == i + 1, index i is permanently correct and never touched again.
// TERMINATION: every swap places at least one value in its final home ⇒ at most n swaps ⇒ O(n).
// CRITICAL: compare VALUES (a[i] != a[correct]), never indices (i != correct).
//           With duplicates, the index test spins forever.
int n = a.length, i = 0;
while (i < n) {
    int correct = a[i] - 1;                                  // home index for value a[i]
    if (a[i] >= 1 && a[i] <= n && a[i] != a[correct]) swap(a, i, correct);
    else i++;                                                // out of range, or already correct
}
for (int k = 0; k < n; k++) if (a[k] != k + 1) return k + 1; // verification pass
return n + 1;
```

### K — Counting pairs

> **Intuition.** When the answer is a **count**, stop enumerating pairs one at a time. For a fixed right pointer, everything from `l` to `r-1` qualifies **simultaneously** — so add `r - l` and move on.

**Mental model.** *"I have just proved this pair works. But `a[l]` is the *smallest* value left in the window, so every value between `l` and `r-1` works with `a[r]` too. That is `r - l` pairs, and I can bank them all in one step instead of walking them."*

The converge itself is unchanged from sub-variant **A** — same window, same discard logic. The only thing that changes is the **bookkeeping**: one `count += r - l` in place of a loop that would have counted them individually. That is what collapses a cubic enumeration to quadratic.

This is the last sub-variant of the pattern for a reason: the batching insight is the **bridge** to sliding-window counting (§2.F), where the identical trick reappears with a different window definition.

```
   sorted, with the LARGEST side a[k] fixed by the outer loop

   [ ... a[l] ......... a[r] ... ]   a[k]
         ^l              ^r

   a[l] + a[r] > a[k]
       =>  every l' in [l, r-1] also works, because a[l'] >= a[l]
       =>  count += r - l          NOT count++

   a[l] + a[r] <= a[k]
       =>  a[l] is too small with every partner <= a[r]
       =>  l++                     (sub-variant A's discard, unchanged)
```

*Fixing the **largest** side is what reduces the three triangle inequalities to a single test — the other two hold automatically on sorted data.*

**Recognition — reach for this when:**

- ✓ The answer is a **count** of pairs or triples, not the pairs themselves.
- ✓ The data is sorted and the predicate is **monotone** in each pointer.
- ✓ Enumerating one at a time would be an order too slow.
- ✗ But **not** when the problem wants the pairs listed. Batching gives you the number, not the members.


```java
// 611. Fix the LARGEST side, then converge.
Arrays.sort(a);
int count = 0;
for (int k = a.length - 1; k >= 2; k--) {          // a[k] is the longest side
    int l = 0, r = k - 1;
    while (l < r) {
        if (a[l] + a[r] > a[k]) {
            count += r - l;   // BATCH: every l' in [l, r-1] also works, since a[l'] >= a[l]
            r--;
        } else {
            l++;              // a[l] is too small with EVERY partner <= a[r]
        }
    }
}
```



#### Why it works — why a whole block of pairs can be counted at once

The batch is not an optimisation bolted on afterwards — it is a direct consequence of sortedness, in the same way the discard was in sub-variant A.

1. **Fix the largest side.** The outer loop pins `a[k]` as the longest side. For a valid triangle you need `a[l] + a[r] > a[k]` with `l < r < k` — and because the array is sorted, the other two triangle inequalities hold automatically. One test instead of three.
2. **The success case batches.** If `a[l] + a[r] > a[k]`, then for **every** `l'` in `[l, r-1]` we have `a[l'] >= a[l]`, so `a[l'] + a[r] > a[k]` as well. All of those pairs are valid, right now, without checking them.
3. **Count them and retire `r`.** That block is `(r-1) - l + 1 = r - l` pairs. Add them, then `r--`: `a[r]` has been fully accounted for as a partner within this window.
4. **The failure case is A's discard.** If `a[l] + a[r] <= a[k]`, then `a[l]` is too small with every partner up to `a[r]`, so `l++`. That is exactly sub-variant A's rule, unchanged.

> **The transferable line:** `count += r - l` instead of `count++`. The same trick reappears verbatim in sliding-window counting (§2.F) — which is why this sub-variant closes the pattern.

**`r - l` versus `r - l + 1` is the whole K-to-done gate.** Here the pairs are `(l, r), (l+1, r), ..., (r-1, r)` — the partner `r` itself is excluded because the problem requires `l < r`. In LC 713 the window `[l, r]` is a **subarray** whose right endpoint counts as a member, giving `r - l + 1`. Same batching idea, different membership rule.

**Know which quantity you are counting before you write the `+=`.** Pairs inside a window, or windows ending at `r`? Getting that wrong produces an answer that is off by exactly the number of iterations, which is maddening to debug.

#### Walkthrough — LC 611 on [2, 2, 3, 4]

Sorted already. The outer loop walks `k` down from the largest side; the inner converge does the counting.

```
index   0   1   2   3
value   2   2   3   4
```

| # | k (largest) | l . r | Test | Action | count |
|---|---|---|---|---|---|
| 1 | k=3 (4) | l=0 (2) . r=2 (3) | 2 + 3 = 5 > 4 → **valid** | `count += r - l` = 2, then `r--` | 2 |
| 2 | k=3 (4) | l=0 (2) . r=1 (2) | 2 + 2 = 4 > 4? **no** | `l++` → pointers meet, inner loop ends | 2 |
| 3 | k=2 (3) | l=0 (2) . r=1 (2) | 2 + 2 = 4 > 3 → **valid** | `count += r - l` = 1, then `r--` → ends | 3 |

Answer 3, and the triangles are `(2,2,3)`, `(2,3,4)` and `(2,3,4)` using the other 2. Row 1 banked **two** triangles from a single comparison — had you written `count++` there, you would have returned 2 and the bug would look like an off-by-one rather than a missing batch.

#### Key observations — what interviewers are listening for

- **Fixing the **largest** side is the setup that makes it work.** It reduces three triangle inequalities to one test. Fixing the smallest side instead leaves you checking all three and the converge no longer applies.
- **`count += r - l` is the sentence to remember.** The mastery gate asks you to explain why it is correct **and** to connect it to `count += r - l + 1` in LC 713. Having the code without that connection is having the problem, not the pattern.
- **The batch follows from sortedness, not from cleverness.** *Everything to the left of a working `l` also works, because it is at least as large.* Same shape of argument as A's discard proof, used to count rather than to eliminate.
- **This is the bridge out of the pattern.** The identical `at-most` batching drives sliding-window counting in §2.F. Recognising it there for free is the payoff for learning it here.
- **Counting problems rarely want the members.** If you find yourself materialising the pairs to count them, you have already lost the complexity argument.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Writing `count++` instead of `count += r - l` | undercounts badly, and the result still looks like a plausible near-miss. | One successful comparison certifies an entire **block** of partners. Count the block. |
| Using `r - l + 1` for pair counting | overcounts by exactly one per successful step — it counts `(r, r)`, which is not a pair. | Pairs need `l < r`, so the partner `r` itself is excluded: `r - l`. The `+1` form belongs to subarray counting like LC 713. |
| Fixing the smallest side in the outer loop | you now need all three triangle inequalities and the converge no longer justifies a discard. | Fix the **largest** side. Sortedness then makes the other two inequalities free. |
| Moving `l` after a successful batch | double-counts pairs that the batch already covered. | After banking `r - l`, retire the **right** pointer: `r--`. `a[r]` is finished as a partner in this window. |

#### Key takeaway

- **Trigger:** a **count** of pairs or triples over sorted data with a monotone predicate.
- **Setup:** fix the **largest** element in an outer loop, converge on the remaining two.
- **The batch:** `count += r - l` — one comparison certifies a whole block of partners.
- **Off-by-one:** `r - l` for pairs (`l < r`); `r - l + 1` for subarrays where `r` is a member (LC 713).
- **Gate:** K is yours when you can explain why `count += r - l` is correct in LC 611 and connect it to `count += r - l + 1` in LC 713. See [§5.1](index.md#55-two-pointers).

---

## 1.4 Failure Modes — Two Pointers

| # | Bug | Symptom | Prevention |
|---|---|---|---|
| 1 | `while (l <= r)` on a pair problem | Returns a "pair" of an element with itself | Ask: is `l == r` a legal state? For pairs, no → strict `<`. |
| 2 | Advancing only one pointer after a 3Sum hit | Infinite loop or duplicate triplets | After recording, always `l++; r--;` **before** the dedup loops. |
| 3 | Dedup by looking forward (`a[l] == a[l+1]`) | `ArrayIndexOutOfBounds` on the last element | Always dedup against the element you just left: `a[l-1]`, `a[r+1]`. |
| 4 | Dedup loops missing the `l < r` guard | Pointers cross, garbage reads | Every inner dedup `while` re-tests `l < r`. |
| 5 | Advancing `mid` after the high swap in DNF | Unsorted output, silently | Trace where the swapped-in value came from. High swap pulls from the *unknown* region. |
| 6 | `mid < hi` instead of `mid <= hi` in DNF | Last element never classified | The unknown region is **closed** `[mid, hi]`. |
| 7 | Cyclic sort with `i != correct` | Infinite loop on duplicate input | Compare values: `a[i] != a[correct]`. |
| 8 | Cyclic sort without the range guard | `ArrayIndexOutOfBounds` on negatives / huge values | Guard `a[i] >= 1 && a[i] <= n` first, short-circuit order matters. |
| 9 | Forward merge in 88 | Overwrites unread `a[i]` | Write backward whenever destination and source overlap. |
| 10 | Floyd checking `slow == fast` before the first hop | Reports a cycle immediately (both start at head) | Hop first, compare second. |
| 11 | Floyd missing `fast.next != null` | NPE on even-length acyclic lists | Both guards, in that order — Java short-circuits left to right. |
| 12 | Expand-around-center using `[l, r]` after the loop | Off-by-two on every answer | The loop overshoots by one on each side: use `[l+1, r-1]`, length `r - l - 1`. |
| 13 | Compaction comparing to input instead of output | Wrong on runs longer than K | `a[w - K] != v`, not `a[rd - K] != v`. |
| 14 | 4Sum summing in `int` | Silent overflow, wrong answers on adversarial input | Accumulate in `long`. |
| 15 | Sorting when the answer needs original indices | Wrong output on Two Sum I | Before sorting, ask: does the output reference positions? |

---
---

---

**Mastery gates for this pattern** live in the home document: [§5.1 Two Pointers](index.md#55-two-pointers) — together with the revisit rule for ★ problems.

