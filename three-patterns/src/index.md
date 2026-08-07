# Three Patterns, No Gaps — Two Pointers · Sliding Window · Binary Search

**Calibration:** written for an advanced backend engineer doing FAANG prep in **Java 21**, LeetCode-numbered. The document is **tiered rather than pitched at a single level**: the **★ core path is the minimum sufficient set** (a strong beginner can follow it linearly), **○ marks optional depth**, and **Extra Reps** are pure repetition — skip them if the starred problem went clean the first time.

**Total core: 78 problems.** Everything else is explicitly labelled optional. Nothing here is padding; if a problem is listed, there is exactly one thing it teaches that no earlier problem taught.

All code templates in this document were compiled and executed against the listed test cases before being written down.

---

*Part of **Three Patterns, No Gaps**. [Home](index.md) · [Two Pointers](two-pointers.md) · [Sliding Window](sliding-window.md) · [Binary Search](binary-search.md)*

---

## The three patterns

| Pattern | Sub-variants | Core | File |
|---|---|---|---|
| **01 · Two Pointers** | 11 (A–K) | 28 | [two-pointers.md](two-pointers.md) |
| **02 · Sliding Window** | 11 (A–K) | 26 | [sliding-window.md](sliding-window.md) |
| **03 · Binary Search** | 13 (A–M) | 24 | [binary-search.md](binary-search.md) |

The cross-pattern material — the recognition guide, the mastery gates and the revisit schedule — stays on this page, because it only makes sense by comparison.

---

## How to read the tables

| Marker | Meaning |
|---|---|
| ★ | Core. Must solve unaided, from scratch, before advancing. |
| ○ | Optional. Solve only if the gate check for that sub-variant fails, or you want depth. |
| 🔒 | LeetCode Premium. Free substitute given where one exists. |
| ⚠ | **Anti-pattern problem.** Included specifically because the obvious pattern is *wrong*. These are the highest-value problems in the entire document. |

Problems within a sub-variant are in strict prerequisite order. Sub-variants themselves are in prerequisite order.

---
---

# 4 — RECOGNITION GUIDE

## 4.1 The decision procedure

Run these in order. Stop at the first match.

**Step 0 — Read the output type.**
Does the answer reference **original indices**? If yes, you may not sort. That kills two pointers and index-based binary search immediately (LC 1 vs LC 167). If the answer is a *set of values* or a *count* or a *length*, sorting is on the table.

**Step 1 — Is the answer a contiguous subarray/substring?**
If no → not sliding window. Subsequence problems are DP or greedy+binary search, never a window. ("Subsequence" and "subarray" being one letter apart in a problem statement has cost more interviews than any algorithm.)
If yes → go to Step 2.

**Step 2 — The monotonicity test. Do this on paper, always.**
Write down the validity predicate `V(l, r)` and answer **one** of these:
- Maximizing length: *if `[l,r]` is valid, is every sub-window valid?* (shrink-monotone)
- Minimizing length / counting: *if `[l,r]` is satisfying, is every super-window satisfying?* (grow-monotone)

| Test result | Tool |
|---|---|
| Monotone, window size fixed by the problem | **Fixed window** (§2.A) |
| Shrink-monotone, want longest | **Variable window B** or the non-shrinking form D |
| Grow-monotone, want shortest | **Variable window C** |
| Monotone, want a **count** | **Counting window F**, or **at-most-K subtraction G** if the constraint is "exactly" |
| **Not monotone**, sum-based with negatives | **Prefix sums + hash map** (exact) or **monotonic deque on prefix sums** (at-least) |
| **Not monotone**, some other reason | **Freeze a parameter** to restore monotonicity, then window (LC 395), or abandon the pattern |
| Monotone, but the aggregate is a max/min over the window | **Monotonic deque** (§2.I) |
| Monotone, aggregate is a median/k-th | **Ordered multiset / two heaps** (§2.J) |

**Step 3 — Is the answer a number in a large range, with a cheap feasibility check?**
Signals, in rough order of reliability:
- The phrase **"minimum possible maximum"**, **"maximum possible minimum"**, **"minimize the largest"**, **"smallest X such that"**, **"minimum time/speed/capacity/days to..."**
- `n <= 10^5` but the answer range is up to `10^9` — the intended complexity is `O(n log(range))`, and the `log` has nowhere else to come from.
- You can write a function `feasible(x)` in O(n) or O(n log n) that answers "is `x` good enough?" without needing to know the optimum.
- Greedy gets you a *check* but not a *construction*.

→ **Binary search on the answer**. Then decide direction: if bigger `x` makes life *easier*, it's **first-true** (§3.G). If bigger `x` makes life *harder*, it's **last-true** (§3.H).

**Step 4 — Is there sorted (or rotated-sorted, or unimodal) structure over an index range?**
→ Binary search on indices (§3.A–F). If you need the k-th smallest of a collection you cannot materialize, search the **value** range with a counting predicate (§3.I).

**Step 5 — Sorted data, and the answer is a pair/triple/relationship between elements?**
→ Two pointers. Converging if the target relationship has a direction (§1.A/B/C). Same-direction if you're comparing two sequences or compacting in place (§1.D/E/F).

**Step 6 — Constant extra space demanded on an array of `n` values in range `[1, n]`?**
→ Cyclic sort or sign-marking (§1.J).

**Step 7 — Cycle, repetition, or "find the duplicate in O(1) space"?**
→ Floyd on the implicit functional graph (§1.G).

---

## 4.2 Signal → pattern cheat table

| Signal in the problem statement | Most likely | Watch out for |
|---|---|---|
| "sorted array" + "two numbers" | Two pointers converging | Output is indices → hash map instead |
| "longest substring such that..." | Variable window B | Non-monotone constraint (LC 395) |
| "shortest subarray with sum at least K" | Variable window C | **Negatives present → deque on prefix sums** (LC 862) |
| "number of subarrays with exactly K..." | atMost(K) − atMost(K−1) | Only valid for counts, not lengths |
| "number of subarrays summing to K", negatives allowed | Prefix sum + hash map | Not a window at all |
| "minimum number of X such that all Y fit" | Binary search on answer, first-true | Bounds: is `lo` legal? Is `hi` guaranteed feasible? |
| "maximize the minimum distance/value" | Binary search on answer, last-true | Ceiling mid, or use `lastTrue` |
| "k-th smallest" over a structure you can't build | Binary search on the value range + count | The returned value is real — know why |
| "rotated sorted array" | Binary search vs `a[hi]` | Duplicates → O(n) worst case |
| "maximum in every window of size k" | Monotonic deque | Store indices, not values |
| "in-place", "O(1) extra space", array of `[1..n]` | Cyclic sort | Compare values, not indices |
| "find the duplicate, don't modify the array, O(1) space" | Floyd | Not a hash set, not sorting |
| "matrix sorted row-wise and column-wise" | Staircase O(m+n) | **Not** flattened binary search |
| "matrix where each row starts after the previous ends" | Flattened binary search | `/n` and `%n` with n = columns |
| "median of two sorted arrays in O(log)" | Partition binary search | Merge two pointers is O(m+n) — too slow |
| "longest increasing **subsequence**" | DP + binary search | Not a window (not contiguous) |
| "take k items from either end" | Complement fixed window | The window is what you *leave* |
| "circular array" + window | Modulo indexing | Loop to `n + k`, not `n` |

---

## 4.3 Trap cases — where the obvious pattern is wrong

| Problem | The obvious (wrong) read | Why it fails | Correct approach |
|---|---|---|---|
| **1. Two Sum** | Sort + converge | Output is indices; sorting loses them | Hash map, one pass |
| **560. Subarray Sum Equals K** | Sliding window | Negatives break grow-monotonicity: extending `r` can *decrease* the sum | Prefix sum + hash map |
| **862. Shortest Subarray Sum ≥ K** | Sliding window (it works for 209!) | 209 guarantees positives; 862 does not | Monotonic deque over prefix sums |
| **395. Longest Substring with At Least K Repeating** | Sliding window | "At least" is not shrink-monotone — adding a char can *repair* the window | Freeze the distinct count `d = 1..26`, run 26 windows; or divide & conquer |
| **240. Search a 2D Matrix II** | Flattened binary search (like LC 74) | Row starts are not globally ordered | Staircase from the top-right, O(m+n) |
| **4. Median of Two Sorted Arrays** | Two-pointer merge to the midpoint | O(m+n); the constraint demands O(log) | Partition binary search on the shorter array |
| **162. Find Peak Element** | "Array isn't sorted, so no binary search" | Binary search needs a monotone *predicate*, not sorted data | Binary search on the slope |
| **154 / 81. Rotated with duplicates** | "Binary search, so O(log n)" | `a[mid] == a[hi]` carries zero information | Still binary search, but state the O(n) worst case out loud |
| **300. LIS** | Sliding window over the array | Subsequence ≠ subarray | Patience sorting + `lowerBound` |
| **424 / 1004** | `while`-shrink window | Correct, but the `if`-shrink version is simpler and O(n) with no `maxFreq` recomputation | Non-shrinking window |
| **Any "minimize the maximum" with a *non-monotone* check** | Binary search on the answer | If `feasible(x)` isn't monotone the search converges to garbage | Prove monotonicity first; otherwise DP or greedy |
| **Unimodal function, continuous domain, want the extremum value** | Binary search | Binary search finds boundaries, not peaks of continuous functions | Ternary search, or binary search on the *derivative sign* |
| **11. Container With Most Water** with a DP instinct | O(n²) all pairs | Passes small tests, TLEs | Converging pointers with the discard proof |

---

# 5 — MASTERY CHECKPOINTS

Each gate is **pass/fail, no partial credit**. Gate conditions are things you do *without an IDE, without hints, and without looking at your own notes.* A gate you "mostly" pass is a gate you failed.

## 5.1 Two Pointers

| Gate | You may advance when you can... | Fail action |
|---|---|---|
| **A → B** | Write the converging template blind and state the discard proof for LC 167 in one sentence. Handle: empty array, 2 elements, all duplicates. | Redo #1–#4. |
| **B → C** | Prove — out loud, unprompted — why moving the shorter wall in LC 11 is safe, and why the smaller-max side in LC 42 is fully determined. | You have the code but not the pattern. Re-derive both proofs on paper before touching another problem. |
| **C → D** | Write 3Sum blind with all three dedup sites correct on the first run, including the `l < r` guards inside the dedup loops. Then write 4Sum in under 12 minutes. | Redo #8 from scratch two days running. |
| **D → E** | Write the "keep at most K copies" one-liner and explain why it compares against `a[w-K]` and not the input. | Redo #14, #15. |
| **E → F** | State the advance rule ("drop whoever ends first") and apply it to LC 986 without re-deriving. | Redo #19. |
| **F → G** | Explain why forward merge in LC 88 clobbers and backward does not, in terms of the `w >= i` invariant. | Redo #22. |
| **G → H** | Derive Floyd's entry-point formula (`a = kc − b`) on a blank page, then apply Floyd to LC 287 without being told it's a linked-list problem. | Redo #25 and #26 together. |
| **H → I** | Write DNF blind with the correct `mid <= hi` bound and correctly justify the missing `mid++` on the high swap. | Redo #31 daily until the justification is instant. |
| **I → J** | State the `[l+1, r-1]` correction from memory and compute the length as `r - l - 1`. | Redo #34. |
| **J → K** | Write LC 41 blind, including the range guard, the value-comparison guard, and the verification pass. | This is the hardest gate in the pattern. Redo #36 then #37. |
| **K → done** | Explain why `count += r - l` is correct in LC 611 and connect it to `count += r - l + 1` in LC 713. | You have the code without the transfer. Do #40 and #57 back to back. |

## 5.2 Sliding Window

| Gate | You may advance when you can... | Fail action |
|---|---|---|
| **A → B** | Write the fixed-window skeleton blind and state *both* boundary conditions (`r >= k` evict, `r >= k-1` record) without deriving them. | Redo #41, #42. |
| **B → C** | Write B and C **back to back in one sitting** and articulate the difference: B shrinks *while invalid* and records after; C shrinks *while satisfied* and records inside. | This is the most common permanent confusion in the pattern. Write both templates from memory once a day for three days. |
| **C → D** | Write LC 76 blind with the `have`/`need` counter and explain why `need[]` is allowed to go negative. | Redo #49, then #50. |
| **D → E** | Explain why a stale `maxFreq` in LC 424 cannot produce a wrong answer. | You memorized the code. Redo the argument, then re-solve. |
| **E → F** | Write the `matched` counter with **all four** transition branches (into-exact and out-of-exact, on both add and remove). | Redo #53. |
| **F → G** | State when to use `count += r - l + 1` vs `count += l`, and tie each to shrink- vs grow-monotonicity. | Redo #57 and #58 side by side. |
| **G → H** | Explain why LC 992 *cannot* be done with a single window, and state the precondition on `atMost` that makes the subtraction valid. | Redo #59, then #60. |
| **H → I** | Look at LC 1423 and see "minimum window of size n−k" within 30 seconds. | Redo #62 and #63. |
| **I → J/K** | Write the deque template blind with the correct operation order (push → expire → read) and explain why indices are stored. Then write LC 862 and explain why 209's approach dies on negatives. | 862 is the capstone. If it fails, redo #65 then #67, and re-read the deque invariant. |
| **K → done** | Given a new subarray problem with negatives, correctly say "not a window" **before** writing code. | You are still pattern-matching on shape instead of monotonicity. Redo Step 2 of §4.1 on ten random subarray problems, out loud, without coding any of them. |

## 5.3 Binary Search

| Gate | You may advance when you can... | Fail action |
|---|---|---|
| **B → C** | Write `lowerBound` and `upperBound` blind, in under three minutes, with zero compile errors, and derive all four operations (exists / count / floor / ceil) from them. | This is the foundation gate. Do not proceed. Rewrite both daily until they are muscle memory. |
| **C → D** | Write `firstTrue` and `lastTrue` blind and explain why neither can infinite-loop. Then state the mid-formula rule for the `lo = mid` form. | Redo #75. Then hand-trace both templates on a 2-element range. |
| **D → E** | Write LC 153 blind and explain why comparing to `a[lo]` breaks. Then write LC 33's sorted-half logic including the `<=`. | Redo #79, #80. |
| **E → F** | Explain why LC 162 is a valid binary search on an unsorted array, in terms of the invariant "a peak exists in `[lo, hi]`". | Redo #83 and re-read §3.E. |
| **F → G** | Derive the `a[i] - (i+1)` drift function for LC 1539 yourself, and explain the `res + k` return. | Redo #85. |
| **G → H** | Given any new "minimize the maximum" problem, name `lo`, `hi`, and `feasible` **before** writing code, and justify why `hi` is always feasible. Then solve LC 410 in under 15 minutes having seen LC 1011. | If 410 doesn't feel like 1011, you learned the problem, not the pattern. Redo both and write the mapping between them explicitly. |
| **H → I** | Write LC 1552 and explain — without looking — why it needs the ceiling mid (or why `lastTrue` avoids the issue). | Redo #87 and #93 back to back, in that order, in one sitting. |
| **I → J** | Explain why the value returned by LC 378's search is guaranteed to be a real matrix element. | You have a correct program you cannot defend. Redo the argument in §3.I, then re-solve. |
| **J → K** | Look at LC 74 and LC 240 and state, from the constraints alone, which one may be flattened. | Redo both, reading only the constraints section. |
| **K → L/M** | Write LC 4 blind with the sentinels and the `half = (m+n+1)/2` convention, and explain the initial swap. | The hardest single template in this document. Budget three separate attempts across a week. |
| **M → done** | Write LIS in O(n log n) blind, and explain why the `tails` array is not the actual subsequence. | Redo #105. |

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

1. **Blind template first.** On every revisit, write the sub-variant's template from memory *before* opening the problem. If the template is wrong, that alone downgrades the attempt to *Hinted* regardless of how the problem goes.
2. **Two strikes → step back.** Any starred problem that fails to reach *Clean* on two consecutive revisits: stop, go back one sub-variant, and re-solve its last two starred problems. The failure is almost always upstream.
3. **Failure-mode tagging.** When a revisit isn't clean, tag it with the row number from the relevant §*.4 Failure Modes table. After ten problems you will have two or three dominant tags — those are your actual weaknesses, and they're worth more than any problem count.
4. **The sub-variant transfer test.** Once per sub-variant, take an *unseen* problem from the Extra Reps list and solve it cold. If the sub-variant's core problems are clean but the transfer fails, you learned the problems, not the pattern.
5. **Never revisit an unstarred problem** unless it's serving as a transfer test. Optional problems have no spaced-repetition schedule; that is what makes them optional.
6. **Cap the queue at 12 due items.** If more than 12 come due, do the oldest 12 and push the rest. A backlog you avoid is worse than an interval you stretch.

---

## Appendix — Coverage summary

| Pattern | Sub-variants | ★ core | ○ optional | ⚠ anti-pattern (inside core) |
|---|---|---|---|---|
| Two Pointers | 11 | 28 | 11 | 1 (LC 1) |
| Sliding Window | 11 | 26 | 5 | 3 (LC 862, 560, 395) |
| Binary Search | 13 | 24 | 14 | 1 (LC 240) |
| **Total** | **35** | **78** | **30** | **5** |

The five ⚠ problems are the highest-value items in the document. They are the only ones that teach you when *not* to reach for the pattern, which is the difference between someone who has done 500 problems and someone who can solve an unseen one.
