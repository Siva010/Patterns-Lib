*Part of **Three Patterns, No Gaps**. [Home](index.md) · [Two Pointers](two-pointers.md) · [Sliding Window](sliding-window.md) · [Binary Search](binary-search.md)*

---

# PATTERN 3 — BINARY SEARCH

## 3.1 Pattern Breakdown

Every binary search is the same thing: **find the boundary of a monotone boolean predicate over an ordered search space.** Sorted arrays are just the special case where the space is the index range and the predicate is `a[i] >= target`. Once you internalize the predicate framing, rotated arrays, answer-space search, and 2D search all stop being separate techniques.

| # | Sub-variant | Search space | Predicate | Answer |
|---|---|---|---|---|
| **A** | Exact match | indices | `a[i] == t` | index or −1 |
| **B** | Lower / upper bound | indices `[0, n]` | `a[i] >= t` / `a[i] > t` | first true |
| **C** | **Generic monotone predicate** | any integer range | user-supplied `ok(x)` | first/last true |
| **D** | Rotated sorted arrays | indices | derived from a pivot comparison | index / minimum |
| **E** | Unimodal / peak | indices | `a[i] < a[i+1]` (slope) | local max |
| **F** | Index-vs-value correspondence | indices | drift between `a[i]` and `i` | the k-th missing / the unpaired |
| **G** | Answer space — **minimize the maximum** | candidate answers | `feasible(x)` where bigger `x` = easier | smallest feasible |
| **H** | Answer space — **maximize the minimum** | candidate answers | `feasible(x)` where bigger `x` = harder | largest feasible |
| **I** | Counting predicate (k-th smallest) | value range | `countLE(x) >= k` | smallest such value |
| **J** | 2D matrices | flattened index / value range / staircase | depends on the sortedness guarantee | index or value |
| **K** | Partition across two arrays | split point in the shorter array | `aL <= bR && bL <= aR` | the balanced split |
| **L** | Floating-point | real interval | `feasible(x)` | fixed-iteration convergence |
| **M** | BS as a subroutine | an auxiliary sorted structure | `lower_bound` | inside LIS / prefix sums / offline queries |

**The easily-missed sub-variants.** Each of these is routinely folded into a neighbouring pattern, taught under a different heading, or skipped altogether — and each earns its own row because it teaches something none of the others do:
- **E** peak finding. The array is *not sorted*, yet binary search is valid, because the predicate "the slope at `i` is upward" is monotone-ish in exactly the way that matters. This is the best problem for proving to yourself that binary search needs a monotone *predicate*, not a sorted *array*.
- **F** index-vs-value correspondence. `1539` and `540` are both "binary search on the drift between where a value is and where it should be." Very commonly asked, rarely taught as a category.
- **I** counting predicates. Distinct from G/H: the search space is the **value** range and the predicate is a *count*, not a feasibility simulation. This is how you get k-th smallest out of an implicit collection you cannot materialize.
- **K** partition binary search. Only one common problem (LC 4), but it's a famous one and the technique is unique.
- **M** binary search as a subroutine — patience-sorting LIS, prefix-sum lookups, `TreeMap.floorKey`. This is the form that actually shows up most often in real interview answers, disguised.
- **Exponential / galloping search** for unbounded or unknown-length spaces (folded into A/M below).
- ⚠ **Ternary search** — the boundary of the pattern. When the function is unimodal but you need the *extremum value* over a continuous domain, binary search on the derivative sign or ternary search; plain binary search on the value is wrong.

---

## 3.2 Problem Table

### A/B/C — Boundaries and the generic predicate

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★76 | **704. Binary Search** | Easy | A | Establishes one loop shape. Pick `[lo, hi]` inclusive or `[lo, hi)` half-open and then **never mix them again**. |
| ★77 | **35. Search Insert Position** | Easy | B | The insight that `lo` after the loop is the insertion point — i.e. `lowerBound`. Everything in B/C is this. |
| ★78 | **34. Find First and Last Position of Element** | Medium | B | Forces you to write both `lowerBound` and `upperBound` and to see that `upper − lower` is the count. |
| ★79 | **278. First Bad Version** | Easy | C | First problem where there is no array — only a predicate. The abstraction step. |
| ★80 | **981. Time Based Key-Value Store** | Medium | B + M | `upperBound − 1` = "greatest key ≤ t". The most common real-world binary search there is. |
| ○81 | 744. Find Smallest Letter Greater Than Target | Easy | B | `upperBound` with wraparound. Two-minute rep. |
| ○82 | 702. Search in a Sorted Array of Unknown Size 🔒 | Medium | A | Exponential/galloping bound-finding. Free equivalent: implement `bound = 1; while (get(bound) < t) bound <<= 1;` yourself. |

### D — Rotated sorted arrays

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★83 | **153. Find Minimum in Rotated Sorted Array** | Medium | D | Compare `a[mid]` to **`a[hi]`**, never `a[lo]`. Understand why the `a[lo]` version breaks on a non-rotated array. |
| ★84 | **33. Search in Rotated Sorted Array** | Medium | D | Identify the sorted half first, then decide if the target lies inside it. Note `a[lo] <= a[mid]` — the `=` matters when `lo == mid`. |
| ★85 | **154. Find Minimum in Rotated Sorted Array II** | Hard | D | Duplicates destroy the pivot test; the `hi--` fallback degrades to O(n). Understanding *why* worst case is O(n) is the point. |
| ○86 | 81. Search in Rotated Sorted Array II | Medium | D | #84 + #85 combined. Skip if both parents were clean. |

### E — Unimodal / peak

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★87 | **162. Find Peak Element** | Medium | E | Binary search on an **unsorted** array. Proves the pattern needs a monotone predicate, not sorted data. |
| ○88 | 1095. Find in Mountain Array | Hard | E + A | Peak, then two directional searches, under an API call budget. Excellent composition rep. |

### F — Index-vs-value correspondence

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★89 | **1539. Kth Missing Positive Number** | Easy | F | The predicate is `a[i] - (i+1) < k` — "missing count so far." Deceptively hard to get the final `+k` right. |
| ★90 | **540. Single Element in a Sorted Array** | Medium | F | Predicate on **index parity**: pairs are aligned before the single element and shifted after. |

### G — Answer space, minimize the maximum

> **Intuition.** The answer is a number in a huge range and you cannot compute it — but you can **check** it. So search the answer space: guess a value, ask *is this good enough?*, and let monotonicity do the rest.

**Mental model.** *"I cannot construct the optimal schedule. But given a proposed capacity I can simulate greedily and say yes or no. And if capacity `x` works then `x + 1` works too — so the yeses form a suffix, and I want its first element."*

The tell is in the wording and the constraints together: phrases like *minimum possible maximum*, *minimize the largest*, *minimum time / speed / capacity / days to...*, combined with `n <= 10^5` but an answer range up to `10^9`. The `log` has nowhere else to come from.

Before writing a line, three things must be settled — and two of them are where the bugs live.

```
   the search space is ANSWER VALUES, not indices

   feasible(x) :   F   F   F   F   T   T   T   T
                                   ^ first true = the answer

   CHECKLIST, before any code:
     1. lo = the smallest value that could conceivably be LEGAL
     2. hi = a value that is DEFINITELY feasible (so the search cannot fall off the end)
     3. prove  feasible(x)  =>  feasible(x+1)

   LC 1011:  lo = max(weights)   NOT 1   -- one item must fit in one trip
             hi = sum(weights)           -- one giant trip always works
```

*Item 1 is the classic bound bug and item 3 is the classic silent-wrongness bug. Item 2 just keeps the search in range.*

**Recognition — reach for this when:**

- ✓ The phrase **minimum possible maximum**, *minimize the largest*, or *minimum X such that*.
- ✓ `n` is small but the **answer range** is huge — the intended complexity is `O(n log(range))`.
- ✓ You can write `feasible(x)` in `O(n)` without knowing the optimum.
- ✗ But **not** if bigger `x` makes life *harder*. That is the mirror case and belongs in sub-variant **H**.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★91 | **875. Koko Eating Bananas** | Medium | G | The gateway. Search over *speeds*, not indices. Bounds: `lo = 1`, `hi = max(piles)`; be able to justify both. |
| ★92 | **1011. Capacity To Ship Packages Within D Days** | Medium | G | `lo = max(w)` (must fit the biggest single item) vs `hi = sum(w)`. Getting `lo` wrong here is the classic bound bug. |
| ★93 | **410. Split Array Largest Sum** | Hard | G | Identical to #92 with the problem statement scrambled. If you don't see the equivalence within 60 seconds, redo #92. |
| ★94 | **1482. Minimum Number of Days to Make m Bouquets** | Medium | G | Feasibility over *time*, with a greedy scan. Overflow trap: `m * k` needs `long`. |
| ○95 | 1760. Minimum Limit of Balls in a Bag | Medium | G | Feasibility uses a ceiling-division count. Good if #94 was rough. |
| ○96 | 2064. Minimized Maximum of Products Distributed to Any Store | Medium | G | Same shape as #95. Pick one. |

#### Why it works — the three-item checklist, and why each item matters

Answer-space search is easy to write and easy to get subtly wrong. Each checklist item corresponds to a specific, named failure.

1. **Establish the direction.** Bigger `x` makes the constraint easier to satisfy, so `feasible` reads `F...F T...T` and you want the **first true**.
2. **`lo` must be the smallest **legal** candidate.** Not simply 1. In LC 1011 a single package must fit in one trip, so any capacity below `max(weights)` is infeasible *forever* — and starting there lets the search return an impossible answer.
3. **`hi` must be provably feasible.** Choose something you can argue always works: the sum of all weights (one giant trip), the maximum pile (one pile per hour), the full range. Otherwise the search can converge past the end of the feasible region and return an infeasible value silently.
4. **Prove the implication.** `feasible(x)` must imply `feasible(x+1)`. If it does not, the predicate is not monotone and the search converges to an arbitrary point in the valid region — with no crash to warn you.

> **The bound bug this sub-variant exists to teach:** `lo` is the smallest **legal** candidate, not 1. In LC 1011 a single item must fit in one trip, so `lo = max(weights)`; and `hi` must be a value you can *prove* always works, such as `sum(weights)` — one giant trip.

**LC 875 Koko bounds:** `lo = 1` because speed 0 eats nothing, and `hi = max(piles)` because one pile per hour always finishes in time. Verified: `([3,6,7,11], 8)` gives 4; `([30,11,23,4,20], 5)` gives 30.

**Ceiling division has its own trap.** Write `(v + speed - 1) / speed` in `long`, not `v / speed + 1` — the naive form is off by one whenever the division is exact.

**Overflow lives inside `feasible`, not in the search.** Every accumulation in the predicate needs `long`: `mid * mid`, `m * k`, sums of weights. The failure is a wrong feasibility verdict, so it produces a wrong answer with no crash.

#### Walkthrough — LC 875 — Koko eating [3, 6, 7, 11] in 8 hours

`lo = 1`, `hi = max(piles) = 11`. `hours(speed)` sums the ceiling divisions; the search is a plain first-true over the answer space.

```
piles = [3, 6, 7, 11]      h = 8

hours(speed) = ceil(3/s) + ceil(6/s) + ceil(7/s) + ceil(11/s)
```

| # | lo, hi | mid | hours(mid) | `<= 8` ? | Update |
|---|---|---|---|---|---|
| 1 | 1, 11 | 6 | `1+1+2+2` = 6 | **feasible** | `hi = mid` = 6 |
| 2 | 1, 6 | 3 | `1+2+3+4` = 10 | no | `lo = mid + 1` = 4 |
| 3 | 4, 6 | 5 | `1+2+2+3` = 8 | **feasible** | `hi = mid` = 5 |
| 4 | 4, 5 | 4 | `1+2+2+3` = 8 | **feasible** | `hi = mid` = 4, then `lo == hi` → return **4** |

Answer 4. Notice that speeds 4 and 5 both finish in exactly 8 hours — the search does not stop at the first feasible value it meets, it keeps narrowing to the *smallest* one. That is what distinguishes a first-true search from a linear scan that returns early.

#### Key observations — what interviewers are listening for

- **Name `lo`, `hi` and `feasible` before writing any code.** That is the gate, word for word — plus a justification for why `hi` is always feasible. Doing it out loud also catches the `lo` bug before it exists.
- **The `lo` bug is the signature error of this sub-variant.** Capacity problems need `lo = max(item)`. Starting at 1 returns an answer that cannot pack a single item, and small tests often miss it.
- **Monotonicity is a proof obligation.** *Write out `feasible(x)` implies `feasible(x+1)` before coding.* Non-monotone predicates fail silently, which is the worst failure mode in this whole pattern.
- **LC 410 is LC 1011 with different nouns.** The gate says so directly: if 410 does not feel like 1011, you learned the problem rather than the pattern. Write the mapping between them explicitly.
- **Say the complexity as `O(n log(range))`.** It makes clear you know the `log` comes from the answer space, not from the data.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| `lo` too low — e.g. 1 in LC 1011 | returns an impossible answer; a single item never fits. | `lo` is the smallest **legal** candidate. For capacity problems that is `max(weights)`. |
| `hi` not provably feasible | the search converges past the feasible region and returns an infeasible value, silently. | Pick `hi` you can argue always works: sum of all, max element, full range. |
| Non-monotone `feasible` | converges to an arbitrary point inside the valid region — no crash, wrong answer. | Prove `feasible(x)` implies `feasible(x+1)` on paper first. |
| Ceiling division as `v / speed + 1` | off by one whenever the division is exact. | `(v + speed - 1) / speed`, accumulated in `long`. |

#### Key takeaway

- **Trigger:** *minimize the maximum* wording, huge answer range, cheap `feasible(x)`.
- **Direction:** bigger `x` is easier → `F...FT...T` → **first true**.
- **Checklist:** `lo` smallest legal, `hi` provably feasible, and prove `feasible(x)` implies `feasible(x+1)`.
- **Traps:** `lo = max(item)` for capacity; ceiling division as `(v + s - 1) / s`; `long` inside the predicate.
- **Gate:** name `lo`, `hi` and `feasible` before coding, and justify `hi`. Then LC 410 in fifteen minutes having seen LC 1011. See [§5.3](index.md#57-binary-search).


### H — Answer space, maximize the minimum

> **Intuition.** The mirror of G. Bigger guesses are now **harder**, so the yeses form a prefix and you want its last element — and that single flip is where the infamous ceiling-mid trap lives.

**Mental model.** *"Same machine, reversed. If a gap of `x` is achievable then every smaller gap is too, so the trues are on the left and I want the rightmost one."*

Everything from G carries over: name `lo`, `hi` and `feasible`, prove the implication, watch for overflow. Only the **direction** changes — and with it, one line of loop mechanics.

This is the one place in the entire pattern where the mid formula changes, which is why it gets its own sub-variant rather than a footnote under G.

```
   G  minimize the maximum     feasible :  F F F F T T T T   ->  FIRST true
   H  maximize the minimum     feasible :  T T T T F F F F   ->  LAST  true

   with `while (lo < hi)` and `lo = mid` you MUST use the ceiling:

       mid = lo + (hi - lo + 1) / 2        <- the +1 is not optional

   without it, when hi == lo + 1 the floor mid equals lo,
   so `lo = mid` changes nothing and the loop hangs forever.

   OR: call lastTrue(lo, hi, ok) from sub-variant C and never think about it again.
```

*Floor mid pairs with `hi = mid`; ceiling mid pairs with `lo = mid`. Crossing them is an infinite loop, in either direction.*

**Recognition — reach for this when:**

- ✓ The phrase **maximize the minimum**, *maximum possible minimum*, *largest X such that*.
- ✓ Bigger candidate answers are **harder** to satisfy, not easier.
- ✓ A greedy check can verify a candidate without constructing the optimum.
- ✗ But **not** if bigger is easier — that is G, and the direction reverses along with the mid formula.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★97 | **1552. Magnetic Force Between Two Balls** | Medium | H | The mirror image of G: `feasible(x)` is now *decreasing* in `x`, so you search for the **last** true. Writing this immediately after #91 is the fastest way to stop confusing the two. |
| ○98 | 1231. Divide Chocolate 🔒 | Hard | H | Same as #97. Free substitute: 1552 is sufficient. |
| ○99 | 1898. Maximum Number of Removable Characters | Medium | H | Feasibility check is itself a two-pointer subsequence test. Nice cross-pattern composition. |

#### Why it works — the direction flip, and the hang it causes

The correctness argument is G's, mirrored. The interesting part is the mechanical failure that the mirroring introduces.

1. **Establish the direction.** Bigger `x` is harder, so `feasible` reads `T...T F...F` and the answer is the **last true**.
2. **The natural loop shape needs `lo = mid`.** To keep a feasible `mid` as a candidate while searching right, you write `lo = mid` rather than `lo = mid + 1` — because `mid` itself might be the answer.
3. **That is exactly what hangs.** When `hi == lo + 1`, floor mid gives `mid == lo`. So `lo = mid` leaves `lo` unchanged, `hi` unchanged, and the loop spins forever on a two-element range.
4. **The fix, and the general rule.** Use the ceiling: `mid = lo + (hi - lo + 1) / 2`, which lands on `hi` instead of `lo`. The rule underneath: floor mid pairs with `hi = mid`; ceiling mid pairs with `lo = mid`.

> **The one place the mid formula changes — and how to never need it:** with `lo < hi` and `lo = mid` you must write `mid = lo + (hi - lo + 1) / 2`, the ceiling, or the loop hangs when `hi == lo + 1`. If you would rather never think about this again, use `lastTrue(lo, hi, ok)` from §C. Recommended.

**LC 1552's greedy check is the other half of the problem.** `canPlace(gap)` places balls leftmost-first and counts them; greedy leftmost placement is optimal, because delaying a placement can never allow more balls later.

**The gate accepts either answer.** Explain why the ceiling mid is needed, *or* explain why `lastTrue` sidesteps the issue entirely. Both demonstrate you understand the trap.

**Everything from G still applies** — `lo` and `hi` justification, monotonicity proof, `long` inside the predicate. Only the direction and the mid formula differ.

#### Walkthrough — LC 1552 — maximise the minimum gap, 3 balls in [1, 2, 3, 4, 7]

`lo = 1`, `hi = 7 - 1 = 6`. Every `mid` below is a **ceiling** mid — watch step 3, where the floor version would have hung.

```
positions = [1, 2, 3, 4, 7]      m = 3 balls

canPlace(gap): place leftmost-first, count how many fit
```

| # | lo, hi | ceiling mid | canPlace(mid) | Update |
|---|---|---|---|---|
| 1 | 1, 6 | `1 + 6/2` = 4 | places 1, 7 → only 2 balls, **no** | `hi = mid - 1` = 3 |
| 2 | 1, 3 | `1 + 3/2` = 2 | places 1, 3, 7 → 3 balls, **yes** | `lo = mid` = 2 |
| 3 | 2, 3 | `2 + 2/2` = 3 | places 1, 4, 7 → 3 balls, **yes** | `lo = mid` = 3, then `lo == hi` → return **3** |

Answer 3. Step 3 is the trap made concrete: with `lo = 2, hi = 3`, the **floor** mid would be `2 + (3-2)/2 = 2`, so `lo = mid` would set `lo = 2` — unchanged — and the loop would spin forever. The ceiling gives 3 instead, and the search terminates.

#### Key observations — what interviewers are listening for

- **The hang is the lesson, so be able to construct it.** `lo = 2, hi = 3`, floor mid is 2, `lo = mid` is a no-op. Having that two-element example ready is worth more than remembering the formula.
- **State the pairing rule, not just the fix.** *Floor mid with `hi = mid`; ceiling mid with `lo = mid`.* One rule covers both directions and both failure modes.
- **`lastTrue` is a legitimate answer to the gate.** Preferring the `res`-tracking template because it has no mid-formula trap is a judgement call, and saying so explicitly reads better than silently avoiding the topic.
- **Justify the greedy inside `feasible`.** For LC 1552, leftmost placement is optimal. Interviewers often probe the checker rather than the search, because that is where the real reasoning is.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Floor mid with `lo = mid` | **infinite loop** whenever `hi == lo + 1`. | Ceiling mid: `mid = lo + (hi - lo + 1) / 2`. Or use `lastTrue` and never write `lo = mid`. |
| Ceiling mid with `hi = mid` | infinite loop, the mirror image. | Never cross the pairing: floor with `hi = mid`, ceiling with `lo = mid`. |
| Using G's first-true search on a maximise problem | returns the smallest feasible value — typically the trivial answer. | Establish the direction first. Bigger harder means last-true. |
| An unjustified greedy inside `feasible` | a plausible checker that is subtly not optimal, so the whole search is wrong. | Argue the greedy. For 1552, leftmost placement can never do worse than delaying. |

#### Key takeaway

- **Trigger:** *maximize the minimum* wording; bigger candidates are harder.
- **Direction:** `T...TF...F` → **last true**.
- **The trap:** `lo = mid` demands the ceiling mid, or it hangs at `hi == lo + 1`.
- **The rule:** floor mid with `hi = mid`; ceiling mid with `lo = mid`. Never cross.
- **Gate:** write LC 1552 and explain why it needs the ceiling mid — or why `lastTrue` avoids the issue. See [§5.3](index.md#57-binary-search).


### I — Counting predicates (k-th smallest in an implicit set)

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★100 | **378. Kth Smallest Element in a Sorted Matrix** | Medium | I + J | Search the **value** range; `countLE(mid)` via a staircase walk. Also: understand why the returned `lo` is guaranteed to be an actual matrix element. |
| ★101 | **719. Find K-th Smallest Pair Distance** | Hard | I | `countLE` is itself a sliding window. The clearest example of composing two patterns. |
| ○102 | 668. Kth Smallest Number in a Multiplication Table | Hard | I | `countLE` via a closed-form row sum. Only if you want a third rep. |
| ○103 | 1201. Ugly Number III | Medium | I | `countLE` via inclusion–exclusion with LCM. Nice but niche. |

### J — 2D matrices

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★104 | **74. Search a 2D Matrix** | Medium | J | Fully sorted when flattened → one binary search over `[0, m*n)` with `/n` and `%n`. |
| ★105 | ⚠ **240. Search a 2D Matrix II** | Medium | J | Rows and columns are sorted but the flattening is **not** sorted, so #104's trick is illegal. Correct answer is the O(m+n) staircase from the top-right. This pair is a precision test on reading the constraints. |

### K — Partition binary search

> **Intuition.** Do not merge the two arrays — **split** them. Search for the split point where everything on the left is at most everything on the right, and the median is sitting at that boundary.

**Mental model.** *"I am choosing how many elements to take from the shorter array. That single number forces everything else, and I only have to check whether the two cross-comparisons hold."*

The search space is not an index into a sorted array — it is `i`, the **number of elements taken from the shorter array**, ranging over `[0, m]`. Once `i` is chosen, `j = half - i` is forced.

This is described in the gates as the hardest single template in the document, and the advice is to budget three separate attempts across a week. The difficulty is entirely in the bookkeeping, not the idea.

```
   A (shorter)   [ aL | aR ]        i elements on the left
   B             [ bL | bR ]        j = half - i  on the left

   VALID SPLIT:   aL <= bR   AND   bL <= aR
       -> every element on the left side is <= every element on the right side

   aL > bR   ->  took too many from A  ->  hi = i - 1
   otherwise ->  took too few from A   ->  lo = i + 1

   half = (m + n + 1) / 2       the +1 puts the extra element on the LEFT when odd
   sentinels: aL = -inf if i == 0,  aR = +inf if i == m   (same for B)
   swap first so A is the shorter array, or j can fall outside [0, n]
```

*The two cross-comparisons are necessary and sufficient. The sentinels exist so that the empty-side cases need no separate code at all.*

**Recognition — reach for this when:**

- ✓ Two **sorted** arrays, and you need an order statistic across both — classically the median.
- ✓ The required complexity is `O(log(m + n))` or better, ruling out a merge.
- ✓ You can express the answer as a **balanced split** rather than a position.
- ✗ But **not** if a two-pointer merge is fast enough. Merging is `O(m + n)` and far easier to get right when the constraints allow it.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★106 | **4. Median of Two Sorted Arrays** | Hard | K | Search over the *split point* of the shorter array. The sentinel trick (`MIN_VALUE`/`MAX_VALUE` at the edges) is what makes it writable without a wall of edge cases. |

#### Why it works — the split condition and the conventions that remove the edge cases

Almost every line of this template exists to eliminate a special case. Knowing which case each one kills is what makes it writable from memory.

1. **The search space.** `i` in `[0, m]` — how many elements to take from `A`. Then `j = half - i` is determined, so one variable searches a two-dimensional-looking problem.
2. **Why swap so `A` is shorter.** If `A` were the longer array, `j = half - i` could fall outside `[0, n]` for legal values of `i`, and the sentinels would not save you. The initial swap makes that impossible.
3. **The validity test.** `aL <= bR && bL <= aR`. Because each array is internally sorted, these two cross-comparisons are exactly the condition that *everything left is at most everything right*.
4. **Which way to move.** `aL > bR` means the left side holds something too large — you took too many from `A`, so `hi = i - 1`. Otherwise you took too few, so `lo = i + 1`.

> **The convention that makes the odd case free:** `half = (m + n + 1) / 2` puts the extra element on the **left** when the total is odd, so the median is simply `max(aL, bL)` with no separate branch. The `±infinity` sentinels remove every empty-side edge case.

**Verified:** `([1,3], [2])` gives 2.0; `([1,2], [3,4])` gives 2.5; `([], [1])` gives 1.0. The last one is the case the sentinels exist for.

**The even-case average overflows in `int`.** `Integer.MIN_VALUE + Integer.MAX_VALUE` is reachable when both sentinels appear, so cast: `(Math.max(aL, bL) + (long) Math.min(aR, bR)) / 2.0`.

**The gate asks specifically for the swap.** Being able to explain *why* `A` must be the shorter array is the difference between having typed this template and understanding it.

#### Walkthrough — LC 4 — median of [1, 3] and [2]

After the swap, `A = [2]` (m = 1) and `B = [1, 3]` (n = 2), so `half = (1 + 2 + 1) / 2 = 2`. The search runs over `i` in `[0, 1]`.

```
A = [2]        m = 1        half = 2
B = [1, 3]     n = 2        j = half - i
```

| # | i | j | aL, aR | bL, bR | Valid? | Action |
|---|---|---|---|---|---|---|
| 1 | 0 | 2 | `-inf`, `2` | `3`, `+inf` | `bL <= aR`? `3 <= 2` **no** | took too few from A → `lo = i + 1` = 1 |
| 2 | 1 | 1 | `2`, `+inf` | `1`, `3` | `2 <= 3` and `1 <= inf` → **yes** | total is odd → return `max(aL, bL)` = **2.0** |

Two iterations. Notice how much the sentinels absorbed: at `i = 0` the left side of `A` is empty, and at `i = 1` its right side is — both handled by `±infinity` rather than by branching. Strip the sentinels out and this template roughly doubles in length.

#### Key observations — what interviewers are listening for

- **Budget multiple attempts, deliberately.** The gate calls this the hardest single template in the document and recommends three separate attempts across a week. Treating it as a one-sitting problem is how it never sticks.
- **Explain the swap unprompted.** It is not an optimisation — it is what keeps `j` inside `[0, n]`. That is the detail the gate names.
- **The sentinels are the design, not a detail.** Every empty-side case disappears into `±infinity`. Pointing that out shows you see why the template is short.
- **`half` with the `+1` handles parity for free.** Odd totals put the extra element on the left, so the odd case is a single `max`. Without the `+1` you need two branches.
- **Know when not to reach for it.** If `O(m + n)` passes, merge. This template is for when the constraints explicitly forbid that.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Not swapping so `A` is the shorter array | `j` falls outside `[0, n]` and the sentinels cannot rescue it. | `if (A.length > B.length) return solve(B, A);` as the first line. |
| Omitting the `±infinity` sentinels | index-out-of-bounds on every empty-side case, or a thicket of special-case branches. | `aL = -inf` when `i == 0`, `aR = +inf` when `i == m`, and the same for `B`. |
| Using `half = (m + n) / 2` | the odd case needs a separate branch and usually gets it wrong. | `(m + n + 1) / 2` puts the extra element on the left so the odd median is just `max(aL, bL)`. |
| Averaging in `int` | overflow when both sentinels participate. | Cast one operand: `(max(aL, bL) + (long) min(aR, bR)) / 2.0`. |

#### Key takeaway

- **Trigger:** an order statistic across two sorted arrays in `O(log(m + n))`.
- **Search space:** `i` = how many to take from the **shorter** array; `j = half - i` is forced.
- **Valid split:** `aL <= bR && bL <= aR`.
- **Conventions:** swap for the shorter array, `half = (m+n+1)/2`, `±infinity` sentinels, `long` on the average.
- **Gate:** LC 4 blind with the sentinels and the `half` convention, plus an explanation of the initial swap. See [§5.3](index.md#57-binary-search).


### L — Floating-point search

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★107 | **69. Sqrt(x)** | Easy | L (integer form) | Integer answer, but forces `mid * mid` overflow handling (`long`, or compare via division). |
| ○108 | 774. Minimize Max Distance to Gas Station 🔒 | Hard | L | The canonical real-valued answer search. Free stand-in: **1300. Sum of Mutated Array Closest to Target** (integer, with a tie-breaking trap). |

### M — Binary search as a subroutine

> **Intuition.** The form that actually shows up most often in real interviews — **disguised**. There is no *binary search problem*; there is a sorted auxiliary structure and a `lowerBound` call sitting inside a larger algorithm.

**Mental model.** *"The binary search is not the algorithm. It is the inner loop of the algorithm — the thing that turns an `O(n^2)` scan into `O(n log n)`."*

This is the form the breakdown flags as *the one that actually shows up most often in real interview answers, disguised* — patience-sorting LIS, prefix-sum lookups, `TreeMap.floorKey`, offline query processing.

The canonical case is LIS, and it carries a trap that the gate targets directly: the array you build is **not** the subsequence.

```
   LIS in O(n log n):
       tails[k] = the SMALLEST possible tail of an increasing subsequence of length k+1
       tails is always sorted  ->  binary searchable
       for each v: overwrite the first tail >= v      (that is lowerBound)
                   if it landed at the end, the LIS got longer

       tails is NOT the LIS. Only its LENGTH is meaningful.

   galloping / exponential search, for an unbounded space:
       bound = 1
       while (get(bound) < target) bound <<= 1        O(log answer)
       then binary search within [bound / 2, bound]
```

*Keeping every tail as small as possible is what maximises the chance of extending later — which is why overwriting with `lowerBound` is the right move.*

**Recognition — reach for this when:**

- ✓ A larger algorithm has a **sorted auxiliary structure** you keep querying.
- ✓ An `O(n^2)` solution exists and the constraints demand `O(n log n)`.
- ✓ The search space is **unbounded** or of unknown length — gallop first, then search.
- ✗ But **not** as a way to dress up a problem. If nothing in the algorithm is sorted, there is nothing to search.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★109 | **300. Longest Increasing Subsequence** | Medium | M | Patience sorting: `lowerBound` into a tails array to get O(n log n). The tails array is **not** the LIS — know that. |
| ★110 | **528. Random Pick with Weight** | Medium | M | Prefix sums + `upperBound`. The standard "weighted sampling" answer. |
| ○111 | 354. Russian Doll Envelopes | Hard | M | LIS after a sort with a descending tiebreak. The tiebreak *is* the problem. |
| ○112 | 1044. Longest Duplicate Substring | Hard | C + hashing | Binary search on answer length + rolling hash. Only for hard-tier prep. |
| ○113 | 658. Find K Closest Elements | Medium | B | Binary search on the *window start* in `[0, n-k]`. Elegant and unintuitive; a great final exam for boundary reasoning. |


#### Why it works — why `tails` works, and why it is not the answer

LIS by patience sorting is four lines and almost everyone can reproduce them. The gate is about whether you know what the array actually contains.

1. **The definition.** `tails[k]` is the **smallest possible tail** of any increasing subsequence of length `k + 1`. Not a particular subsequence — the best possible ending value for that length.
2. **Why it is sorted.** A longer increasing subsequence must end at least as high as a shorter one can, so `tails` is non-decreasing by construction — which is what makes it binary searchable.
3. **Why you overwrite the first tail `>= v`.** That is `lowerBound(v)`. Replacing it keeps every entry as small as possible, maximising the chance that some future element can extend that length. If the position is past the end, the LIS has grown.
4. **Why the array is not the subsequence.** Entries are written at different times from different positions, and nothing forces them to be mutually compatible. `tails` can hold values that could never coexist in one increasing run through the original array.

> **The thing the gate asks you to explain:** `tails` is **not** the actual subsequence — its entries can come from positions that could never coexist in one increasing run. Only its **length** is meaningful.

**Strict versus non-strict changes the boundary function.** For a non-strictly increasing subsequence you want `upperBound` semantics rather than `lowerBound`.

**Prefer your own bounds to `Arrays.binarySearch` whenever duplicates exist.** The library call finds *an* equal element, which is not necessarily the boundary you need, and it encodes misses as `-(insertionPoint) - 1` — decode with `if (i < 0) i = -(i + 1);`.

**Galloping handles unbounded spaces.** Double a bound until it overshoots, then binary search the bracket `[bound/2, bound]`. Total cost `O(log answer)`, with no need to know the size in advance.

#### Walkthrough — LIS on [4, 5, 6, 1, 2] — where `tails` is visibly not a subsequence

Watch the final `tails`. It has the right **length**, and it is not a subsequence of the input at all.

```
input:  4   5   6   1   2
```

| # | v | lowerBound in tails | tails after | size |
|---|---|---|---|---|
| 1 | 4 | 0 (empty, past the end) | `[4]` | 1 |
| 2 | 5 | 1 (past the end) | `[4, 5]` | 2 |
| 3 | 6 | 2 (past the end) | `[4, 5, 6]` | **3** |
| 4 | 1 | 0 → overwrite `4` | `[1, 5, 6]` | 3 |
| 5 | 2 | 1 → overwrite `5` | `[1, 2, 6]` | 3 |

The answer is 3, which is correct — the LIS is `[4, 5, 6]`. But the final `tails` is `[1, 2, 6]`, and that is **not** a subsequence of the input: `6` occurs at index 2, before the `1` at index 3 and the `2` at index 4. The length survived; the contents did not. That is exactly what the gate wants you to be able to say.

#### Key observations — what interviewers are listening for

- **This is the form that actually appears in interviews.** Rarely as *solve this binary search*; usually as a harder problem whose intended solution has a `lowerBound` in the middle of it. Recognising the opening is the skill.
- **Be precise about what `tails` holds.** *The smallest possible tail for each length* — not a subsequence, not the answer. The counterexample above is worth keeping in your head.
- **Prefer hand-written bounds over the library call.** `Arrays.binarySearch` is a liability with duplicates and needs miss-decoding. Your own `lowerBound` has neither problem.
- **Galloping is the answer to *unbounded*.** Doubling to find a bracket, then searching it, is the standard move for unknown-length or infinite spaces — and it stays `O(log answer)`.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Returning `tails` as the subsequence | a plausible-looking array that is not a subsequence of the input. | Only the **length** is meaningful. Reconstructing the actual LIS needs parent pointers. |
| `Arrays.binarySearch` with duplicates | an arbitrary matching index rather than the boundary you wanted. | Write your own `lowerBound` / `upperBound`. |
| Forgetting to decode a negative return | a negative number used directly as an index. | `if (i < 0) i = -(i + 1);` |
| Using `lowerBound` for a non-strict LIS | equal elements are treated as unable to extend, so the length comes out short. | Non-strict wants `upperBound` semantics. |

#### Key takeaway

- **Trigger:** a larger algorithm with a sorted auxiliary structure and an `O(n log n)` target.
- **LIS:** `tails[k]` = smallest tail for length `k+1`; overwrite the first tail `>= v`.
- **The trap:** `tails` is not the subsequence — only its length is meaningful.
- **Unbounded spaces:** gallop by doubling, then binary search the bracket.
- **Gate:** LIS in `O(n log n)` blind, plus an explanation of why `tails` is not the actual subsequence. See [§5.3](index.md#57-binary-search).

---

### Extra Reps — Binary search (only if a gate fails)

| Problem | Targets |
|---|---|
| 367. Valid Perfect Square | Same as #107 with an exact test. |
| 852. Peak Index in a Mountain Array | Strictly easier #87. |
| 1268. Search Suggestions System | Repeated `lowerBound` over a sorted word list. |
| 1802. Maximum Value at a Given Index in a Bounded Array | Answer search with an arithmetic-series feasibility check. |
| 1235 / 1751 (DP + binary search) | Binary search inside a DP transition. |

---

## 3.3 Templates

> **Pick one loop shape and commit.** Mixing `[lo, hi]` and `[lo, hi)` between problems is the single largest source of binary-search bugs. Below, boundary search uses half-open; predicate search uses the `res`-tracking inclusive form. Both are infinite-loop-proof.

### A — Exact match

> **Intuition.** The binary search everyone already knows — and the one you should almost never write. Exact match answers *is it here* and nothing else; a **boundary** search answers that question and four more.

**Mental model.** *"Halve, compare, repeat. But the moment there are duplicates, or the value is absent, *found it* stops being a useful answer — and what I actually wanted was a boundary."*

The framing that organises this entire pattern: **every binary search finds the boundary of a monotone boolean predicate over an ordered search space.** Sorted arrays are just the special case where the space is the index range and the predicate is `a[i] >= t`.

Sub-variant A is the odd one out, because `a[i] == t` is **not monotone** — it reads `F F T F F`, a point rather than a boundary. That is precisely why A does not generalise and B does, and why the two are grouped together in the problem table.

```
   a = [1, 2, 2, 2, 5]        target = 2

   A   "is 2 present?"        -> SOME index: 1, 2 or 3. Which one is arbitrary.

   B   lowerBound(2) = 1      -> the FIRST 2            a real boundary
       upperBound(2) = 4      -> one past the LAST 2    a real boundary

       count of 2  =  upperBound - lowerBound  =  3     <- A cannot answer this
       a[i] == 2 :   F  T  T  T  F      not monotone -- no single boundary exists
```

*Equality is a point test. Everything richer than *does it exist* — first, last, count, floor, ceiling — is a boundary question, which is sub-variant **B**.*

**Recognition — reach for this when:**

- ✓ Sorted data, and you only need a yes/no on presence.
- ✓ Values are distinct, so *an* index and *the* index are the same thing.
- ✗ But **not** when duplicates exist — the returned index is arbitrary among them.
- ✗ And **not** when you need first, last, count, floor or ceiling. Those are boundaries; use `lowerBound` and derive them.


#### Why it works — why A is grouped with B and C rather than standing alone

A is worth understanding mainly for what it *cannot* do, because that is what motivates every other sub-variant in this pattern.

1. **The general framing.** A binary search locates the boundary of a monotone predicate over an ordered space. Monotone means the predicate flips **exactly once** as you move right.
2. **Equality is not monotone.** On `[1,2,2,2,5]` with `t = 2`, the test `a[i] == t` reads `F T T T F`. It flips twice, so there is no single boundary to find.
3. **So A returns an arbitrary hit.** The search stops at whichever matching index it happens to land on. With duplicates that is unpredictable, and it is why `Arrays.binarySearch` is unsafe for boundary questions.
4. **Every richer question is a boundary question.** First occurrence, last occurrence, count, floor, ceiling — all of them are `lowerBound` or `upperBound` with at most one subtraction. So learn those, and get A for free.

> **The practical consequence:** derive existence from the boundary rather than the other way round — `int i = lowerBound(a, t); i < n && a[i] == t` — and the other four operations come with it at no extra cost.

**Never write `mid = (lo + hi) / 2`.** It overflows to a negative index at scale, which surfaces as an `ArrayIndexOutOfBounds` far from the cause. Always `lo + (hi - lo) / 2`, or `(lo + hi) >>> 1` in Java.

**`Arrays.binarySearch` has two traps**: with duplicates it returns an arbitrary matching index rather than a boundary, and on a miss it encodes the insertion point as `-(insertionPoint) - 1`, which must be decoded with `if (i < 0) i = -(i + 1);`.

**After any boundary search, re-verify before treating the result as a hit.** `lo` is a position, not a promise — check `lo < n && a[lo] == target`.

#### Walkthrough — the same array, two different questions

`a = [1, 2, 2, 2, 5]`. Row 1 is exact match; rows 2-5 are `lowerBound(2)` on the same input. Compare what each one returns.

```
index   0   1   2   3   4
value   1   2   2   2   5
```

| # | Search | lo, hi | mid | a[mid] | Outcome |
|---|---|---|---|---|---|
| 1 | `exact(2)` | 0, 4 | 2 | 2 | hit → returns index **2**, the middle duplicate. Not the first, not the last. |
| 2 | `lowerBound(2)` | 0, 5 | 2 | 2 | not `< 2` → `hi = 2` |
| 3 | `lowerBound(2)` | 0, 2 | 1 | 2 | not `< 2` → `hi = 1` |
| 4 | `lowerBound(2)` | 0, 1 | 0 | 1 | `1 < 2` → `lo = 1` |
| 5 | `lowerBound(2)` | 1, 1 | -- | -- | `lo == hi` → returns **1**, the first 2 |

Exact match returned 2; the boundary search returned 1. Both are *correct* answers to different questions — but only the second one composes. With `upperBound(2) = 4` you also get the count (`4 - 1 = 3`), the floor and the ceiling, none of which exact match can provide.

#### Key observations — what interviewers are listening for

- **Lead with the predicate framing, not the array.** *Binary search finds the boundary of a monotone predicate over an ordered space.* Saying that first makes rotated arrays, answer-space search and 2D search sound like the same technique — which they are.
- **Know why equality is the exception.** It is the one test in this pattern that is not monotone, which is exactly why it cannot answer positional questions.
- **Prefer your own bounds to the library call.** `Arrays.binarySearch` is fine for distinct values and a yes/no. For anything else it is a liability, and saying so unprompted reads as experience.
- **The overflow-safe mid is not optional.** It costs nothing and prevents a bug that only appears at scale, which is the worst kind.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| `mid = (lo + hi) / 2` | integer overflow at scale → negative index → `ArrayIndexOutOfBounds`, far from the cause. | Always `lo + (hi - lo) / 2`. In Java `(lo + hi) >>> 1` also works. |
| Using `Arrays.binarySearch` when duplicates exist | an arbitrary matching index, so first/last/count answers are silently wrong. | Write your own `lowerBound` / `upperBound`. |
| Forgetting the `-(insertionPoint) - 1` decoding | a negative number used as a real index. | `if (i < 0) i = -(i + 1);` immediately after the call. |
| Treating a boundary result as a hit without checking | a bogus index returned instead of *not found*. | Re-verify: `lo < n && a[lo] == target`. |

#### Key takeaway

- **Trigger:** sorted, distinct data, and you need only a yes/no on presence.
- **The limitation:** `a[i] == t` is not monotone, so A returns an arbitrary hit and answers nothing else.
- **Prefer:** `lowerBound`, then verify — it gives existence *plus* first, last, count, floor and ceiling.
- **Always:** `lo + (hi - lo) / 2`, never `(lo + hi) / 2`.
- **Gate:** A has no gate of its own — the foundation gate is B's, and it is the one that matters. See [§5.3](index.md#57-binary-search).


### B — Lower / upper bound (half-open, `[lo, hi)`)

> **Intuition.** Stop searching for a **value** and start searching for a **boundary**. `lowerBound` and `upperBound` mark the two ends of a run of equal values — and every other sorted-array question is one subtraction away from them.

**Mental model.** *"I am not asking *where is 2*. I am asking *where does the region of things at least 2 begin*. That question always has an answer, even when 2 is not in the array at all."*

This is the foundation gate of the whole pattern, and the reason is compositional: two functions, one operator apart, generate **four** derived operations. Learning them as four separate algorithms is the mistake.

The convention matters as much as the code. These use **half-open** `[lo, hi)` with `hi = a.length`, because `n` is a legal answer — it means *no element qualifies*.

```
   a = [1, 2, 2, 2, 5]        target = 2

   a[i] >= 2 :   F   T   T   T   T
                     ^ lowerBound = 1        first TRUE, the START of the run

   a[i] >  2 :   F   F   F   F   T
                                 ^ upperBound = 4        one PAST the run

   the two bounds fence the run of equal values --
   which is why count, floor and ceiling are all one subtraction away
```

*One operator separates the two functions: `a[mid] < target` for lower, `a[mid] <= target` for upper. Everything else in the template is identical.*

**Recognition — reach for this when:**

- ✓ Sorted data, and the question is positional — first, last, count, floor, ceiling.
- ✓ Duplicates exist and you need a specific end of the run.
- ✓ The target may be **absent**, and you still need a meaningful answer.
- ✗ But **not** when the space is not an index range. A predicate over an arbitrary integer range is sub-variant **C**.


```java
// lowerBound: first index i with a[i] >= target. Returns a.length if none.
// INVARIANT: everything in [0, lo) is < target; everything in [hi, n) is >= target.
// TERMINATION: mid is always in [lo, hi-1], so `hi = mid` strictly decreases hi
//              and `lo = mid + 1` strictly increases lo. No infinite loop is possible.
// BOUNDARY: hi starts at a.length (EXCLUSIVE) because n is a legal answer.
static int lowerBound(int[] a, int target) {
    int lo = 0, hi = a.length;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;        // never (lo + hi) / 2 — overflow
        if (a[mid] < target) lo = mid + 1;   // mid cannot be the answer
        else                 hi = mid;       // mid MIGHT be the answer — keep it in range
    }
    return lo;                               // lo == hi
}

// upperBound: first index i with a[i] > target. Change one operator.
static int upperBound(int[] a, int target) {
    int lo = 0, hi = a.length;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] <= target) lo = mid + 1;
        else                  hi = mid;
    }
    return lo;
}
```

**Derived operations — memorize these four lines, not four separate algorithms:**

| Question | Expression |
|---|---|
| does `t` exist? | `int i = lowerBound(a,t); i < n && a[i] == t` |
| count of `t` | `upperBound(a,t) - lowerBound(a,t)` |
| greatest element `<= t` (floor) | `upperBound(a,t) - 1` (−1 ⇒ none) |
| least element `>= t` (ceil) | `lowerBound(a,t)` (n ⇒ none) |

#### Why it works — the invariant, and why the loop cannot hang

Three design choices carry this template, and each one is a line you should be able to justify on request.

1. **The invariant.** Everything in `[0, lo)` is `< target`; everything in `[hi, n)` is `>= target`. The answer is the boundary between them, which is why `lo == hi` at exit **is** the answer.
2. **Why `hi` starts at `n`, exclusive.** `n` is a legal return value — it means no element qualifies. Starting at `n - 1` makes that answer unrepresentable and collapses *not found* into *last index*.
3. **Why the branches are asymmetric.** `a[mid] < target` proves `mid` cannot be the answer, so `lo = mid + 1` skips it. Otherwise `mid` **might** be the answer, so `hi = mid` keeps it inside the range.
4. **Termination.** `mid` is always in `[lo, hi-1]`, so `hi = mid` strictly decreases `hi` and `lo = mid + 1` strictly increases `lo`. The interval shrinks every iteration — no infinite loop is possible.

> **One operator apart, and the invariant that makes both correct:** `lowerBound` tests `a[mid] < target`; `upperBound` tests `a[mid] <= target`. Everything below `lo` is under the boundary and everything from `hi` up is at or above it — so `lo == hi` at exit is the boundary itself.

**Verified on `[1,2,2,2,5]`:** `lowerBound(2) = 1`, `upperBound(2) = 4`, `lowerBound(0) = 0`, `lowerBound(9) = 5`. Worth checking any implementation against all four, especially the two out-of-range cases.

**Memorise the four derived lines, not four algorithms.** Existence, count, floor and ceiling all fall out of the two bounds, and the gate asks you to derive all four.

**A boundary is a position, not a hit.** After the search, `a[lo]` may not equal the target at all — always re-verify before reporting *found*.

#### Walkthrough — `lowerBound(3)` on an array that does not contain 3

`a = [1, 2, 2, 2, 5]`, target `3`. The target is absent, and the search still returns something useful — which is the entire point of a boundary.

```
index   0   1   2   3   4          hi starts at 5 (= n), not 4
value   1   2   2   2   5
```

| # | lo, hi | mid | a[mid] | `a[mid] < 3` ? | Update |
|---|---|---|---|---|---|
| 1 | 0, 5 | 2 | 2 | yes | `lo = mid + 1` = 3 |
| 2 | 3, 5 | 4 | 5 | no | `hi = mid` = 4 |
| 3 | 3, 4 | 3 | 2 | yes | `lo = mid + 1` = 4 |
| 4 | 4, 4 | -- | -- | `lo == hi` | return **4** |

Returns 4 — the position where a 3 *would* go, and the index of the least element `>= 3`. Note `a[4] = 5`, not 3, so an existence check correctly reports absent. Had `hi` started at `n - 1 = 4`, a target larger than every element could never return 5 and *not found* would be indistinguishable from *last index*.

#### Key observations — what interviewers are listening for

- **This is the foundation gate, and it is timed.** Both functions blind, under three minutes, zero compile errors, plus all four derived operations. The gate says explicitly: do not proceed past it.
- **State the invariant, not the code.** *Below `lo` everything is less; from `hi` up everything is at least.* That sentence reconstructs the template from scratch if you blank.
- **The exclusive `hi` is a correctness decision.** It exists so that *no element qualifies* is representable. Candidates who use `n - 1` here usually have not thought about the absent case.
- **Half-open versus inclusive is a per-file policy.** Mixing the two between problems is called out as the single largest source of binary-search bugs. Pick one shape and commit.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Starting `hi` at `n - 1` | `lowerBound` can never return `n`, so *not found* collapses into *last index*. | Boundary searches use `hi = n`, exclusive. `n` is a legal answer. |
| Writing `while (lo <= hi)` with `hi = mid` | infinite loop. | `<` pairs with `hi = mid`; `<=` pairs with `mid ± 1` on **both** branches. Never cross them. |
| `hi = mid - 1` in a lower-bound search | the answer is skipped whenever `mid` is itself the boundary. | `mid` might be the answer, so it stays in range: `hi = mid`. |
| Reporting `lo` as a hit without checking | a valid index returned for a value that is not present. | `i < n && a[i] == t` — the boundary tells you *where*, not *whether*. |

#### Key takeaway

- **Trigger:** sorted data, positional question, duplicates or absent targets in play.
- **Invariant:** `[0, lo)` all `< target`; `[hi, n)` all `>= target`; `lo == hi` is the boundary.
- **Two functions:** `a[mid] < t` for lower, `a[mid] <= t` for upper — one operator apart.
- **Four derived ops:** exists, count, floor, ceiling — all from those two.
- **Gate:** both blind in under three minutes with all four derivations. The foundation gate; do not proceed past it. See [§5.3](index.md#57-binary-search).


### C — Generic monotone predicate

> **Intuition.** Throw away the array. A binary search needs only an **ordered range** and a predicate that flips from false to true exactly once. `firstTrue` and `lastTrue` are the whole pattern — everything after this sub-variant is just choosing `lo`, `hi` and `ok()`.

**Mental model.** *"I do not need sorted data. I need a question whose answer flips exactly once as I move right. Find where it flips, and I am done."*

This is the generalisation that makes the rest of the pattern collapse. Once you internalise the predicate framing, **rotated arrays, answer-space search and 2D search all stop being separate techniques** — they are this template with a different `ok()`.

The `res`-tracking form is deliberately chosen because it is **infinite-loop-proof**: both branches move a bound by `mid ± 1`, so the interval shrinks unconditionally, whatever the predicate does.

```
   firstTrue :   F   F   F   T   T   T
                             ^ res, the first TRUE

   lastTrue  :   T   T   T   F   F   F
                         ^ res, the last TRUE

   both branches move a bound by mid +/- 1
       -> the interval shrinks EVERY iteration, unconditionally
       -> no infinite loop is possible, whatever ok() does

   sentinels:  firstTrue returns hi + 1 if never true
               lastTrue  returns lo - 1 if never true
```

*The `res` variable is what lets both branches use `mid ± 1`. That is the trade: one extra variable buys immunity from the entire class of mid-formula hangs.*

**Recognition — reach for this when:**

- ✓ You can phrase the question as a predicate that is false-then-true (or true-then-false).
- ✓ The search space is any ordered integer range — indices, values, candidate answers.
- ✓ You can **prove** `ok(x)` implies `ok(x+1)` (or the reverse).
- ✗ But **not** if the predicate flips more than once. A non-monotone predicate converges to an arbitrary point in the valid region, silently.


```java
// FIRST TRUE in a F F F T T T space. Returns hi+1 if the predicate is never true.
static int firstTrue(int lo, int hi, IntPredicate ok) {
    int res = hi + 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (ok.test(mid)) { res = mid; hi = mid - 1; }   // found one; look for an earlier one
        else              { lo = mid + 1; }
    }
    return res;
}

// LAST TRUE in a T T T F F F space. Returns lo-1 if the predicate is never true.
static int lastTrue(int lo, int hi, IntPredicate ok) {
    int res = lo - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (ok.test(mid)) { res = mid; lo = mid + 1; }   // found one; look for a later one
        else              { hi = mid - 1; }
    }
    return res;
}
```


#### Why it works — the two templates, and why neither can hang

The gate for this sub-variant asks specifically why these cannot infinite-loop. Here is the argument, plus the trap in the alternative form.

1. **The requirement.** `ok()` must be monotone over `[lo, hi]` — `F...F T...T` for `firstTrue`, `T...T F...F` for `lastTrue`. Exactly one flip.
2. **`firstTrue`.** On a hit, record `mid` in `res` and search **left** for an earlier one (`hi = mid - 1`). On a miss, go right (`lo = mid + 1`).
3. **`lastTrue`.** The mirror: on a hit, record and search **right** (`lo = mid + 1`); on a miss, go left (`hi = mid - 1`).
4. **Why neither can hang.** Every branch of both templates moves a bound by at least one. The interval `[lo, hi]` is therefore strictly smaller on every iteration and must reach empty.

> **Why the `res`-tracking form, and the one policy that saves you:** both branches strictly move a bound (`mid ± 1`), so the interval shrinks every iteration unconditionally. The alternative `while (lo < hi)` plus `lo = mid` form requires the **ceiling mid** `mid = lo + (hi - lo + 1) / 2` or it hangs forever when `hi == lo + 1`. Simplest policy: never write `lo = mid`.

**Verified on `[1,3,5,7]`:** `lastTrue(a[i] <= 5) = 2`, `firstTrue(a[i] >= 5) = 2`, `firstTrue(a[i] >= 99) = 4`, which is `hi + 1` — the never-true sentinel.

**Handle the sentinel at the call site.** `hi + 1` and `lo - 1` are out-of-range by construction, so the caller must check before indexing with the result.

#### Walkthrough — `firstTrue` with `ok(i) = a[i] >= 5`

`a = [1, 3, 5, 7]`, `lo = 0`, `hi = 3`, `res` initialised to `hi + 1 = 4`. Watch `res` get written once and then improved on.

```
index   0   1   2   3
value   1   3   5   7        ok(i) = a[i] >= 5   ->   F  F  T  T
```

| # | lo, hi | mid | a[mid] | ok(mid)? | Update | res |
|---|---|---|---|---|---|---|
| 1 | 0, 3 | 1 | 3 | false | `lo = mid + 1` = 2 | 4 |
| 2 | 2, 3 | 2 | 5 | **true** | `res = 2`; `hi = mid - 1` = 1 | **2** |
| 3 | 2, 1 | -- | -- | -- | `lo > hi`, loop ends | **2** |

Returns 2. Run the same template with `ok(i) = a[i] >= 99` and no branch ever fires the `true` case, so `res` keeps its initial `hi + 1 = 4` — an out-of-range sentinel meaning *never true*. The caller must check for it rather than indexing blindly.

#### Key observations — what interviewers are listening for

- **This template retires most of the pattern.** Sub-variants D through M are almost entirely *choose `lo`, `hi` and `ok()`*. If you own C, the rest is problem modelling rather than new algorithms.
- **Be able to state the no-hang argument.** The gate asks for it directly. *Both branches move a bound by one, so the interval strictly shrinks* is the whole answer.
- **Know the mid-formula rule even though you avoid it.** Floor mid pairs with `hi = mid`; ceiling mid pairs with `lo = mid`. The gate asks for the rule precisely because the alternative form is common in other people's code.
- **Monotonicity is a proof obligation, not a vibe.** *Write out `ok(x)` implies `ok(x+1)` before coding.* If you cannot, it is not a binary search — and the failure mode is a confident, wrong answer rather than a crash.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| `lo = mid` with floor mid | **infinite loop** whenever `hi == lo + 1`. | If you write `lo = mid`, you must write `mid = lo + (hi - lo + 1) / 2`. Or use the `res` form and never write `lo = mid` at all. |
| `hi = mid` with ceiling mid | infinite loop — the mirror of the above. | Floor mid pairs with `hi = mid`; ceiling mid pairs with `lo = mid`. Never cross them. |
| Mixing `[lo, hi]` and `[lo, hi)` between problems | sporadic off-by-one that passes some tests and fails others. | Pick one convention per template and label it in a comment. |
| Running it on a non-monotone predicate | converges to an arbitrary point inside the valid region — no crash, just a wrong answer. | Prove the implication before coding. If it will not prove, it is not binary search. |

#### Key takeaway

- **Trigger:** any ordered integer range plus a predicate that flips exactly once.
- **Two templates:** `firstTrue` for `F...FT...T`, `lastTrue` for `T...TF...F`.
- **Why they are safe:** both branches move a bound by `mid ± 1`, so the interval always shrinks.
- **Policy:** never write `lo = mid`, and you never need the ceiling-mid rule.
- **Gate:** both blind, plus an explanation of why neither can hang and what the mid-formula rule is. See [§5.3](index.md#57-binary-search).


### D — Rotated arrays

> **Intuition.** A rotated array is **two sorted runs**. You cannot compare against a global order any more — but at any midpoint at least one half is a clean sorted run, and that is enough to halve the space.

**Mental model.** *"I cannot ask *is the target bigger than mid* globally. But I can always tell which half is clean, and then ask whether the target lives inside that clean half. If it does, go there. If not, it must be in the other one."*

Two different questions live here and they use different predicates. **LC 153** finds the pivot (the minimum) by comparing `a[mid]` against `a[hi]`. **LC 33** searches for a value by identifying the sorted half and testing containment.

The comparison must be against `a[hi]`, and the reason is a specific failure on unrotated input — which is the single most-tested detail in this sub-variant.

```
   [4, 5, 6, 7, 0, 1, 2]        a rotation = two sorted runs

     run 1          run 2
     4  5  6  7  |  0  1  2
                 ^ the pivot (the minimum)

   at ANY mid, at least one side is a clean sorted run:
       a[lo] <= a[mid]   ->  the LEFT half is sorted
       else              ->  the RIGHT half is sorted

   153 (find the pivot):   a[mid] > a[hi]  ->  the minimum is strictly right of mid
```

*Comparing against `a[hi]` works whether or not the array is actually rotated. Comparing against `a[lo]` does not — see the proof below.*

**Recognition — reach for this when:**

- ✓ A sorted array that has been **rotated** by an unknown amount.
- ✓ You need the minimum (the pivot), or you need to find a value.
- ✓ The problem promises `O(log n)`, which rules out a linear scan for the pivot.
- ✗ But **not** with duplicates if you still expect `O(log n)`. LC 154 degrades to `O(n)` in the worst case, and you should say so out loud.


```java
// 153. Minimum of a rotated sorted array (distinct values).
// INVARIANT: the minimum is always inside [lo, hi].
// WHY a[hi] AND NOT a[lo]: on a non-rotated array [1,2,3], a[mid] > a[lo] is true and would
//   send you right — wrong. Comparing to a[hi] is correct in both rotated and unrotated cases.
int lo = 0, hi = a.length - 1;
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (a[mid] > a[hi]) lo = mid + 1;   // min is strictly to the right of mid
    else                hi = mid;       // mid could BE the min
}
return a[lo];
```

```java
// 154. With duplicates: a[mid] == a[hi] gives no information. Shrink by one and continue.
if (a[mid] > a[hi])      lo = mid + 1;
else if (a[mid] < a[hi]) hi = mid;
else                     hi--;          // O(n) worst case, e.g. [1,1,1,...,1,0,1,...]
```

```java
// 33. Search in a rotated sorted array.
// At any mid, at least ONE half is sorted. Identify it, then test containment.
int lo = 0, hi = a.length - 1;
while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;
    if (a[mid] == t) return mid;
    if (a[lo] <= a[mid]) {                       // <= matters: when lo == mid the left half
        if (a[lo] <= t && t < a[mid]) hi = mid-1;//   is the single element a[lo], still "sorted"
        else                          lo = mid+1;
    } else {                                     // right half is sorted
        if (a[mid] < t && t <= a[hi]) lo = mid+1;
        else                          hi = mid-1;
    }
}
return -1;
```

#### Why it works — why the comparison must be against `a[hi]`

Both halves of this sub-variant hinge on one comparison choice, and the argument against the obvious alternative is concrete.

1. **The structure.** A rotation splits the array into two sorted runs, and the minimum sits at the boundary between them — the pivot.
2. **The LC 153 predicate.** `a[mid] > a[hi]` means `mid` is inside the **left** run, so the pivot is strictly to the right: `lo = mid + 1`. Otherwise `mid` could itself be the minimum, so `hi = mid` keeps it.
3. **Why not `a[lo]`.** On a non-rotated array such as `[1,2,3]`, `a[mid] > a[lo]` is true — and would send the search right, away from the minimum at index 0. The unrotated array is a legal input, so the comparison is simply wrong.
4. **LC 33's sorted-half test.** `a[lo] <= a[mid]` identifies the sorted half. The `<=` matters: when `lo == mid` the left half is the single element `a[lo]`, which is still trivially sorted, and a strict `<` misclassifies it.

> **The comparison that must be against `a[hi]`:** on a non-rotated array `[1,2,3]`, `a[mid] > a[lo]` is true and would send you right — wrong. Comparing to `a[hi]` is correct in both the rotated and the unrotated case.

**LC 154 — duplicates destroy the guarantee.** When `a[mid] == a[hi]` the comparison carries **zero information**: the pivot could be on either side. The only safe move is `hi--`, shrinking by one, which gives `O(n)` worst case on input like `[1,1,1,...,1,0,1,...]`. State that worst case rather than claiming `O(log n)`.

**Verified:** `[4,5,6,7,0,1,2]` gives `find(0) = 4` and `find(3) = -1`; the single-element array `[1]` gives `find(1) = 0`.

**The two problems are genuinely different.** LC 153 is a boundary search on a derived predicate; LC 33 is a containment test inside a known-sorted half. Learning one does not give you the other.

#### Walkthrough — LC 33 — find 0 in [4, 5, 6, 7, 0, 1, 2]

At every step, identify the sorted half first, then ask whether the target is inside it. That ordering is the algorithm.

```
index   0   1   2   3   4   5   6
value   4   5   6   7   0   1   2        target = 0
```

| # | lo, hi | mid | a[mid] | Sorted half | Target inside it? | Update |
|---|---|---|---|---|---|---|
| 1 | 0, 6 | 3 | 7 | left (`a[0]=4 <= 7`) | `4 <= 0 < 7`? **no** | `lo = mid + 1` = 4 |
| 2 | 4, 6 | 5 | 1 | left (`a[4]=0 <= 1`) | `0 <= 0 < 1`? **yes** | `hi = mid - 1` = 4 |
| 3 | 4, 4 | 4 | 0 | -- | `a[mid] == target` | return **4** |

Found at index 4. Notice step 2: the *left* half `[0, 1]` was the sorted one even though we were in the second run — the test is about the window `[lo, hi]`, not about the original array. Getting that right is why the containment check uses `a[lo]` and `a[hi]` rather than any global reasoning.

#### Key observations — what interviewers are listening for

- **The `a[hi]` argument is the gate.** *Write LC 153 blind and explain why comparing to `a[lo]` breaks.* The counterexample is the unrotated array, and it is worth having `[1,2,3]` ready to say.
- **Say the `<=` out loud in LC 33.** `a[lo] <= a[mid]`, because at `lo == mid` the left half is one element and still counts as sorted. A strict `<` fails on two-element windows.
- **Duplicates change the complexity, not just the code.** Volunteering *LC 154 is `O(n)` worst case, because `a[mid] == a[hi]` carries no information* is a strong signal. Claiming `O(log n)` there is a weak one.
- **This is sub-variant C with a derived predicate.** Nothing about the loop is new — only `ok()` changed. Framing it that way is the payoff of learning C properly.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Comparing `a[mid]` to `a[lo]` in the pivot search | fails on a non-rotated array, which is a legal input. | Always compare `a[mid]` to `a[hi]`. |
| Writing `a[lo] < a[mid]` (strict) in LC 33 | fails whenever `lo == mid`, i.e. on two-element windows. | Use `a[lo] <= a[mid]` — a single element is trivially a sorted half. |
| Claiming `O(log n)` for LC 154 | an incorrect complexity claim on duplicate-heavy input. | `a[mid] == a[hi]` gives no information, so you shrink by one: `O(n)` worst case. Say it. |
| Testing containment before identifying the sorted half | the containment test is meaningless on an unsorted range. | Identify the clean half **first**, then test the target against its two ends. |

#### Key takeaway

- **Trigger:** a sorted array rotated by an unknown amount; find the pivot or find a value.
- **Key comparison:** `a[mid]` versus `a[hi]` — correct rotated **and** unrotated.
- **LC 33:** identify the sorted half with `a[lo] <= a[mid]`, then test containment inside it.
- **Duplicates:** `a[mid] == a[hi]` carries no information — `hi--`, and `O(n)` worst case.
- **Gate:** LC 153 blind plus the `a[lo]` counterexample, then LC 33's sorted-half logic including the `<=`. See [§5.3](index.md#57-binary-search).


### E — Peak on an unsorted array

> **Intuition.** The array is **not sorted**, and binary search still works — because binary search needs a monotone **predicate**, not sorted **data**. Here the predicate is the slope.

**Mental model.** *"If the ground rises to my right, a peak must exist somewhere to the right — however chaotic the terrain in between. So everything to my left can go."*

This is the best problem in the document for convincing yourself of the pattern's real requirement. There is no sorted array anywhere, no target value, and the search is still perfectly valid.

What makes it valid is an **invariant**, not an ordering: `[lo, hi]` always contains a peak, given the sentinels `a[-1] = a[n] = -infinity`.

```
   a = [1, 2, 1, 3, 5, 6, 4]        sorted nowhere

   slope  a[i] < a[i+1] :   T   F   T   T   T   F

       ascending  (a[mid] < a[mid+1])  ->  a peak exists STRICTLY right of mid
       otherwise                       ->  mid itself could BE the peak, keep it

   sentinels a[-1] = a[n] = -infinity
       -> the ends always fall away, so a peak always exists inside [lo, hi]
```

*The invariant *a peak exists in `[lo, hi]`* is preserved by both branches. That is the entire correctness argument — no ordering required.*

**Recognition — reach for this when:**

- ✓ You need a **local** maximum, not a global one, and any peak will do.
- ✓ Neighbouring elements are guaranteed unequal, or a flat top counts as a peak.
- ✓ The problem demands `O(log n)` on data that is obviously not sorted — which is the tell.
- ✗ But **not** for a global maximum. That needs a full scan; binary search finds *a* peak, not *the* largest.


```java
// 162. INVARIANT: [lo, hi] always contains a peak, given a[-1] = a[n] = -infinity.
// PREDICATE: "a[mid] < a[mid+1]" is the slope. Where the slope turns from up to down, a peak sits.
int lo = 0, hi = a.length - 1;
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;      // floor mid ⇒ mid+1 <= hi is always safe here
    if (a[mid] < a[mid + 1]) lo = mid + 1;  // ascending: a peak exists strictly to the right
    else                     hi = mid;      // descending or flat-top: mid could be the peak
}
return lo;
```
Note `lo < hi` (not `<=`): with `<=` you would read `a[mid+1]` out of bounds when `mid == n-1`.

#### Why it works — why this is a legal binary search on unsorted data

The argument is short and it is exactly what the gate asks for, so it is worth being able to give verbatim.

1. **The invariant.** `[lo, hi]` always contains a peak, given `a[-1] = a[n] = -infinity`. That is what is being maintained — not any ordering of the values.
2. **The ascending branch.** If `a[mid] < a[mid+1]` the values rise going right. Since the far right eventually falls away to the `-infinity` sentinel, something must turn over: a peak exists strictly right of `mid`, so `lo = mid + 1` preserves the invariant.
3. **The descending branch.** If `a[mid] >= a[mid+1]` the values fall going right, so the rise that led to `mid` has already turned over — `mid` itself could be the peak. `hi = mid` keeps it in range.
4. **The bound must be strict.** `lo < hi`, not `<=`. With `<=` you would read `a[mid + 1]` out of bounds when `mid == n - 1`; with `<`, floor mid guarantees `mid + 1 <= hi` always.

> **The sentence the gate is asking for:** binary search needs a monotone **predicate**, not sorted **data**. The invariant *a peak exists in `[lo, hi]`* is preserved by both branches, and that is the whole proof.

**LC 852 is the same machine on a guaranteed mountain.** Nothing changes except that the input promises exactly one peak, so any peak you find is *the* peak.

**LC 1095 composes it.** Find the peak, then run two ordinary boundary searches — one ascending and one descending. A good demonstration that these sub-variants stack.

**Flat tops need care.** The template treats `a[mid] >= a[mid+1]` as *keep mid*, which is correct when the problem guarantees distinct neighbours. If plateaus are allowed, re-read the problem's definition of a peak before reusing this.

#### Walkthrough — LC 162 on a deliberately chaotic array

`a = [1, 2, 1, 3, 5, 6, 4]`. Nothing is sorted, and the search still converges in three steps.

```
index   0   1   2   3   4   5   6
value   1   2   1   3   5   6   4
```

| # | lo, hi | mid | a[mid] vs a[mid+1] | Slope | Update |
|---|---|---|---|---|---|
| 1 | 0, 6 | 3 | `3 < 5` | ascending | `lo = mid + 1` = 4 |
| 2 | 4, 6 | 5 | `6 > 4` | descending | `hi = mid` = 5 |
| 3 | 4, 5 | 4 | `5 < 6` | ascending | `lo = mid + 1` = 5 |
| 4 | 5, 5 | -- | -- | `lo == hi` | return **5**, and `a[5] = 6` is indeed a peak |

Returns index 5. Note that index 1 is *also* a peak (`a[1] = 2` beats both neighbours) and the search never looked at it — which is fine, because the problem asks for *a* peak. If it asked for the largest, this approach would be invalid.

#### Key observations — what interviewers are listening for

- **Lead with the invariant, not the code.** *A peak exists in `[lo, hi]`* is what the gate wants, and it is what makes an unsorted binary search sound rather than lucky.
- **This is the proof that the pattern is about predicates.** If someone believes binary search requires a sorted array, this problem is the counterexample to hand them.
- **The strict bound is a real bug prevention.** `lo < hi` exists so that `a[mid + 1]` is always in range. It is not a style choice.
- **Any peak, not the best peak.** Saying that distinction unprompted shows you understand what the invariant does and does not promise.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Using `while (lo <= hi)` | reads `a[mid + 1]` out of bounds at the last index. | Peak search uses `lo < hi`, which makes `mid + 1 <= hi` always true with floor mid. |
| Assuming the input must be sorted | you reject a valid approach and fall back to an `O(n)` scan. | The requirement is a monotone predicate. The slope qualifies; the data does not have to. |
| Expecting the global maximum | wrong answers on arrays with several peaks. | The invariant only guarantees *a* peak inside the window. |
| Comparing against `a[mid - 1]` instead | an out-of-bounds read at index 0, and a mirrored set of boundary problems. | Compare forwards, `a[mid]` against `a[mid + 1]`, and let the strict bound protect it. |

#### Key takeaway

- **Trigger:** find a local maximum in `O(log n)` on data that is not sorted.
- **Predicate:** the slope, `a[mid] < a[mid + 1]`.
- **Invariant:** `[lo, hi]` always contains a peak, given `-infinity` sentinels at both ends.
- **Bound:** `lo < hi`, strictly, so `a[mid + 1]` is always readable.
- **Gate:** explain why LC 162 is a valid binary search on an unsorted array, in terms of that invariant. See [§5.3](index.md#57-binary-search).


### F — Index-vs-value drift

> **Intuition.** When a sorted array is *supposed* to look a particular way, search the **difference** between what you see and what you would expect. That difference is monotone even when nothing else obviously is.

**Mental model.** *"In a perfect array of positives, `a[i]` would equal `i + 1`. However far it has drifted from that is how many numbers are missing — and drift only ever grows."*

Both problems in this sub-variant are *binary search on the drift between where a value is and where it should be*. It is very commonly asked and very rarely taught as a category, which is why it gets its own row.

The search itself is ordinary sub-variant C. The skill being tested is **constructing the monotone function** — and the gate asks you to derive it yourself, not to recall it.

```
   1539:  a    = [ 2,  3,  4,  7, 11]
          i    =    0   1   2   3   4
          a[i] - (i+1) = 1   1   1   3   6      <- missing count, NON-DECREASING

          find the first index with missing(i) >= k,  then answer = res + k

   540:   pairs are (even, odd) BEFORE the single element
                    (odd, even) AFTER it
          -> snap mid DOWN to an even index, then test a[mid] == a[mid+1]
             pairing intact  -> single is to the right
             pairing broken  -> single is at or left of mid
```

*Neither drift function is given to you by the problem. Deriving one is the entire difficulty; once it exists, the search is a plain first-true.*

**Recognition — reach for this when:**

- ✓ A sorted array with a **structural expectation** — consecutive positives, adjacent pairs.
- ✓ Something is missing, duplicated, or unpaired, and you need to locate it in `O(log n)`.
- ✓ You can define a function that measures deviation and is provably monotone.
- ✗ But **not** if the deviation can go both ways. A drift function that rises and falls is not searchable.


```java
// 1539. Kth Missing Positive.
// missing(i) = a[i] - (i + 1)   ← how many positives are absent at or before index i.
// missing() is non-decreasing ⇒ binary search for the first index with missing(i) >= k.
int lo = 0, hi = a.length - 1, res = a.length;    // res = "all elements are before the answer"
while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;
    if (a[mid] - (mid + 1) >= k) { res = mid; hi = mid - 1; }
    else                         { lo = mid + 1; }
}
return res + k;      // res elements precede the answer; the answer is the k-th missing after them
```

```java
// 540. Single Element in a Sorted Array. Pairs are (even, odd) aligned BEFORE the single
//      element and (odd, even) after it. Force mid even, then test the pairing.
int lo = 0, hi = a.length - 1;
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (mid % 2 == 1) mid--;                       // snap to the even index of a pair
    if (a[mid] == a[mid + 1]) lo = mid + 2;        // pairing intact ⇒ single is to the right
    else                      hi = mid;            // pairing broken ⇒ single is at or left of mid
}
return a[lo];
```

#### Why it works — constructing the drift function

Two different structural expectations, two different drift functions — and the same search underneath both.

1. **LC 1539 — define the drift.** `missing(i) = a[i] - (i + 1)` counts how many positive integers are absent at or before index `i`. In a gapless array it would be zero everywhere.
2. **Show it is monotone.** `a` is strictly increasing, so each step right adds at least one to the value while adding exactly one to the index. `missing()` therefore never decreases — which makes it searchable.
3. **Read off the answer.** Find the first index with `missing(i) >= k`. That index has `res` array elements before it, so the k-th missing number is `res + k`. Initialise `res = a.length`, meaning *every element precedes the answer*.
4. **LC 540 — a parity drift.** Before the single element, pairs sit at (even, odd) indices; after it, at (odd, even). So snap `mid` down to an even index and test `a[mid] == a[mid + 1]`: intact pairing means the single element is to the right, broken means it is at or left of `mid`.

> **The move that defines this sub-variant:** construct a **drift function** — the gap between where a value is and where it ought to be — and binary search that. The search is ordinary; building the monotone function is the skill.

**The `res + k` return surprises people.** `res` counts the array elements that come before the answer, and `k` counts the missing numbers up to it. Their sum is the value itself. The gate asks you to explain that, not just to write it.

**LC 540's `mid % 2 == 1` snap is doing the parity alignment.** Without it, `mid` may point at the second half of a pair and the pairing test compares across a boundary rather than within a pair.

**Both problems degrade gracefully to `O(n)` scans**, which is what makes the `O(log n)` requirement the signal that a drift function is wanted.

#### Walkthrough — LC 1539 — the 5th missing positive

`a = [2, 3, 4, 7, 11]`, `k = 5`. The drift row is the whole trick; once it is written down the search is a plain first-true.

```
index          0   1   2   3    4
value          2   3   4   7   11
a[i] - (i+1)   1   1   1   3    6        <- non-decreasing
```

| # | lo, hi | mid | a[mid] | missing(mid) | `>= 5` ? | Update |
|---|---|---|---|---|---|---|
| 1 | 0, 4 | 2 | 4 | `4 - 3` = 1 | no | `lo = mid + 1` = 3 |
| 2 | 3, 4 | 3 | 7 | `7 - 4` = 3 | no | `lo = mid + 1` = 4 |
| 3 | 4, 4 | 4 | 11 | `11 - 5` = 6 | **yes** | `res = 4`; `hi = mid - 1` = 3 |
| 4 | 4, 3 | -- | -- | -- | -- | `lo > hi`, loop ends |

`res = 4`, so the answer is `res + k = 4 + 5 = 9`. Check it by hand: the array holds 2, 3, 4, 7, 11, so the missing positives are 1, 5, 6, 8, 9, ... and the fifth is indeed 9. Four array elements precede it, which is exactly what `res` counted.

#### Key observations — what interviewers are listening for

- **Derive the drift function out loud, do not recall it.** The gate is explicit: derive `a[i] - (i+1)` yourself and explain the `res + k` return. Recalling the formula without the derivation is what it is designed to catch.
- **Monotonicity comes from strict increase.** Each step adds at least one to the value and exactly one to the index, so the gap can never shrink. That one sentence licenses the whole search.
- **Parity is just another structural expectation.** LC 540 measures drift in *pairing alignment* rather than in value. Same category, different quantity — which is the transfer worth noticing.
- **This category is under-taught and over-asked.** Recognising *index-vs-value drift* as a named thing is most of the benefit of the taxonomy here.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Searching the values instead of the drift | no monotone predicate exists over the raw values, so the search converges to nonsense. | Build the drift function first, confirm it is non-decreasing, then search it. |
| Returning `res` instead of `res + k` | an index returned where a value was asked for. | `res` elements precede the answer; the answer is the k-th missing number after them. |
| Forgetting the even-snap in LC 540 | the pairing test straddles two different pairs and the result is arbitrary. | `if (mid % 2 == 1) mid--;` before testing `a[mid] == a[mid + 1]`. |
| Initialising `res` to `-1` or `0` | wrong answer when every element precedes the target. | `res = a.length` — the case where the k-th missing number is beyond the whole array. |

#### Key takeaway

- **Trigger:** a sorted array with a structural expectation, and something missing or unpaired.
- **The move:** define a **drift function** measuring deviation, prove it is monotone, search it.
- **LC 1539:** `missing(i) = a[i] - (i+1)`; find first `>= k`; answer is `res + k`.
- **LC 540:** drift in pairing parity — snap `mid` even, then test `a[mid] == a[mid+1]`.
- **Gate:** derive the drift function yourself and explain the `res + k` return. See [§5.3](index.md#57-binary-search).


### G — Answer space, minimize the maximum

```java
// TEMPLATE: feasible(x) is FALSE for small x and TRUE for large x  → find the FIRST true.
// CHECKLIST before writing:
//   1. lo = the smallest value that could conceivably be legal
//   2. hi = a value that is DEFINITELY feasible (so the search cannot fall off the end)
//   3. prove feasible(x) ⇒ feasible(x+1)
int lo = LOWEST_CANDIDATE, hi = ALWAYS_FEASIBLE;
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (feasible(mid)) hi = mid;    // mid works — maybe something smaller does too
    else               lo = mid + 1;
}
return lo;   // lo == hi == smallest feasible value
```

```java
// 875. Koko.  lo = 1 (speed 0 eats nothing).  hi = max(piles) (one pile per hour, always OK).
int lo = 1, hi = Arrays.stream(piles).max().getAsInt();
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (hours(piles, mid) <= h) hi = mid; else lo = mid + 1;
}
return lo;
static long hours(int[] p, int speed) {
    long t = 0;
    for (int v : p) t += (v + speed - 1L) / speed;   // ceiling division; long to avoid overflow
    return t;
}
```

```java
// 1011 / 410 bounds — the classic bound bug lives here:
int lo = Arrays.stream(w).max().getAsInt();   // NOT 1. A single item must fit in one trip.
int hi = Arrays.stream(w).sum();              // one giant trip is always feasible.
```

### H — Answer space, maximize the minimum

```java
// MIRROR IMAGE: feasible(x) is TRUE for small x and FALSE for large x → find the LAST true.
// Using `lo < hi` here REQUIRES the ceiling mid, or it hangs. This is the one place
// where the mid formula changes.
int lo = LOWEST_CANDIDATE, hi = HIGHEST_CANDIDATE;
while (lo < hi) {
    int mid = lo + (hi - lo + 1) / 2;   // ← CEILING. Without the +1, lo = mid loops forever.
    if (feasible(mid)) lo = mid;        // mid works — try bigger
    else               hi = mid - 1;
}
return lo;
```

```java
// 1552. Magnetic Force Between Two Balls — place m balls, maximise the minimum gap.
Arrays.sort(pos);
int lo = 1, hi = pos[pos.length - 1] - pos[0];
while (lo < hi) {
    int mid = lo + (hi - lo + 1) / 2;
    if (canPlace(pos, m, mid)) lo = mid; else hi = mid - 1;
}
return lo;
static boolean canPlace(int[] pos, int m, int gap) {
    int count = 1, last = pos[0];
    for (int i = 1; i < pos.length; i++)
        if (pos[i] - last >= gap) { count++; last = pos[i]; }
    return count >= m;                   // greedy leftmost placement is optimal
}
```


### I — Counting predicate (k-th smallest of an implicit set)

> **Intuition.** When you cannot build the collection, search its **values** instead of its positions — and use a **counting function** as the predicate.

**Mental model.** *"I cannot materialise every element to sort them. But for any value `v` I can count how many elements are at most `v`. That count only grows as `v` grows, so it is monotone, so I can binary search it."*

This is genuinely distinct from **G** and **H**, and the difference is worth naming: there the predicate is a *feasibility simulation*; here it is a **count**. The search space is the value range rather than a set of candidate answers.

It is how you get the k-th smallest out of a collection you could never afford to construct — an `n x n` matrix of sums, a multiplication table, all pairwise distances.

```
   search the VALUE range, not the index range

   countLE(v) >= k :   F   F   F   T   T   T
                                   ^ first true = the k-th smallest

   staircase count, O(n) per call, from the BOTTOM-LEFT:
       m[r][c] <= v   ->   the whole column above qualifies:  cnt += r + 1,  c++
       else           ->   r--

   lo = m[0][0]        hi = m[n-1][n-1]
```

*The predicate is monotone because `countLE` can only increase as `v` increases — no property of the collection is needed beyond that.*

**Recognition — reach for this when:**

- ✓ You need the **k-th smallest** of a collection you cannot afford to build.
- ✓ You can count how many elements are `<= v` in far less time than enumerating them.
- ✓ The value range is bounded and searchable, even though the collection is not.
- ✗ But **not** when the collection is small enough to sort. This is a technique for implicit sets, and reaching for it otherwise is overengineering.


```java
// 378. Kth Smallest in a Sorted Matrix.
// SEARCH SPACE: the VALUE range, not indices. PREDICATE: countLE(v) >= k, which is
// non-decreasing in v ⇒ monotone ⇒ binary searchable.
int lo = m[0][0], hi = m[n-1][n-1];
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (countLE(m, mid) >= k) hi = mid; else lo = mid + 1;
}
return lo;

// staircase count: start bottom-left, O(n) per call
static int countLE(int[][] m, int v) {
    int n = m.length, r = n - 1, c = 0, cnt = 0;
    while (r >= 0 && c < n) {
        if (m[r][c] <= v) { cnt += r + 1; c++; }   // whole column above (r+1) qualifies
        else                r--;
    }
    return cnt;
}
```


#### Why it works — the counting predicate, and why the answer is a real element

The search is straightforward. The part that gets asked as a follow-up is why the returned value is guaranteed to actually exist in the collection.

1. **The space.** Values, bounded below by the smallest element and above by the largest. For a sorted matrix that is `m[0][0]` and `m[n-1][n-1]`.
2. **The predicate.** `countLE(v) >= k`. It is non-decreasing in `v`, because raising `v` can only add elements to the count — never remove them. Monotone, therefore searchable.
3. **The search.** First-true gives the smallest `v` for which at least `k` elements are `<= v`. That is the definition of the k-th smallest.
4. **Why `lo` is a real element.** This is the follow-up. If `lo` were absent from the collection, then nothing lies between `lo - 1` and `lo`, so `countLE(lo - 1) == countLE(lo) >= k` — meaning `lo - 1` also satisfies the predicate, contradicting the minimality of `lo`.

> **Why the returned `lo` is guaranteed to be a real matrix element — have this ready:** `lo` is the smallest value `v` with `countLE(v) >= k`. If `v` were not in the matrix, then `countLE(v-1) == countLE(v) >= k`, so `v-1` would also satisfy the predicate — contradicting minimality.

**The staircase counter is sub-variant J's technique, reused as a predicate.** That composition — one sub-variant supplying the `ok()` for another — is the clearest sign the taxonomy is carving at real joints.

**Cost is `O(n log(range))`**, not `O(n^2 log n)`. The counting call is linear and the search adds a log over the *value* range.

**The third 2D case belongs here.** A matrix sorted only *within* rows cannot be flattened or walked as a staircase — you binary search the value range with a per-row `upperBound` count.

#### Walkthrough — LC 378 — 8th smallest in a sorted matrix

`m = [[1,5,9],[10,11,13],[12,13,15]]`, `k = 8`. `lo = 1`, `hi = 15`. Note that `mid` need not be a matrix element at all — only the final answer must be.

```
     1   5   9
    10  11  13          k = 8
    12  13  15
```

| # | lo, hi | mid | countLE(mid) | `>= 8` ? | Update |
|---|---|---|---|---|---|
| 1 | 1, 15 | 8 | 2 | no | `lo = mid + 1` = 9 |
| 2 | 9, 15 | 12 | 6 | no | `lo = mid + 1` = 13 |
| 3 | 13, 15 | 14 | 8 | **yes** | `hi = mid` = 14 |
| 4 | 13, 14 | 13 | 8 | **yes** | `hi = mid` = 13, then `lo == hi` → return **13** |

Answer 13. Step 3 is the reason the follow-up argument matters: `mid = 14` satisfied the predicate, but 14 is not in the matrix. The search kept narrowing, and the value it finally settled on — the *smallest* satisfying value — is guaranteed to be real, by the contradiction argument above.

#### Key observations — what interviewers are listening for

- **Have the realness argument ready before you are asked.** The gate is explicit: explain why the returned value is a real matrix element. A correct program you cannot defend is what it is designed to catch.
- **Name the difference from G and H.** There the predicate simulates feasibility; here it counts. Same template, genuinely different modelling — which is why it is its own row.
- **Intermediate `mid` values need not exist.** That surprises people and is worth saying explicitly, because it is exactly what makes the final-answer argument necessary.
- **The counting function is where the cleverness lives.** The binary search is boilerplate. Writing an `O(n)` counter for an `O(n^2)` collection is the actual work.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Assuming `mid` must be a matrix element | you constrain the search unnecessarily, or doubt a correct answer. | The search runs over the **value range**. Only the final answer is guaranteed real, and there is a proof for that. |
| Counting with an `O(n^2)` scan | correct answers, and the complexity advantage is thrown away. | Use the staircase: `O(n)` per call, `cnt += r + 1` when the cell qualifies. |
| Using `countLE(v) > k` instead of `>= k` | off by one — you find the value after the k-th. | `>= k` — you want the smallest `v` with at least `k` elements below or equal. |
| Applying it to a small collection | a complicated solution where sorting would do. | This is for collections you cannot materialise. If you can build it, build it. |

#### Key takeaway

- **Trigger:** k-th smallest of a collection too large to construct.
- **Space:** the **value** range, not indices.
- **Predicate:** `countLE(v) >= k`, non-decreasing in `v` and therefore monotone.
- **The follow-up:** the answer is real because a missing value would make `v-1` satisfy the predicate too.
- **Gate:** explain why LC 378's returned value is guaranteed to be a real matrix element. See [§5.3](index.md#57-binary-search).


### J — 2D matrices, three different problems

> **Intuition.** *2D sorted* means **three different things**, and each one has a different algorithm. Read the constraint sentence before you write a line.

**Mental model.** *"The question is not *how do I binary search a matrix*. It is *what exactly is guaranteed sorted here* — and the answer picks the algorithm for me."*

The three guarantees, in decreasing strength: **fully sorted when flattened** (each row starts after the previous row ends), **rows and columns sorted independently** (but the flattening is not sorted), and **rows only**.

They map to three different techniques — flatten and search, staircase, and value-range search — and picking the wrong one gives confidently wrong answers on inputs that look fine.

```
   74   row starts CONTINUE the previous row      ->  FLATTEN and binary search
        [ 1   3   5]
        [ 7  10  11]      7 > 5, so the flat order IS sorted
        index with  mid / n  and  mid % n,   n = COLUMN count

   240  rows and columns sorted, flattening is NOT  ->  STAIRCASE, O(m + n)
        [ 1   4   7]
        [ 2   5   8]      2 < 4, so the flat order is NOT sorted
        from the top-right: bigger -> c--,  smaller -> r++

   rows only                                       ->  sub-variant I
        binary search the VALUE range with a per-row upperBound count
```

*The difference between 74 and 240 is a single sentence in the constraints. Everything else about the two problems looks identical.*

**Recognition — reach for this when:**

- ✓ A matrix with some sortedness guarantee and a search or count question.
- ✓ You have **read the constraints** and can say which of the three guarantees you have.
- ✗ But **not** by pattern-matching on shape. Two matrices that look the same on the page need different algorithms.
- ✗ And **not** flattening unless `row[i][0] > row[i-1][last]` is explicitly guaranteed.


```java
// 74. FULLY sorted when flattened (each row's first > previous row's last).
int lo = 0, hi = m * n;                       // half-open over the FLAT index
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    int v = mat[mid / n][mid % n];            // /n and %n, where n = COLUMN count
    if (v < t) lo = mid + 1; else hi = mid;
}
return lo < m * n && mat[lo / n][lo % n] == t;
```

```java
// 240. Rows and columns sorted, but the flattening is NOT sorted → #78 is ILLEGAL here.
// Staircase from the top-right: each step eliminates a whole row or column. O(m + n).
int r = 0, c = n - 1;
while (r < m && c >= 0) {
    if (mat[r][c] == t) return true;
    if (mat[r][c] > t) c--;    // this entire column below is too big
    else               r++;    // this entire row to the left is too small
}
return false;
```


#### Why it works — which guarantee licenses which technique

Each technique needs a specific promise. Naming the promise is the work; the code is short either way.

1. **Case 1 — the flattening guarantee.** If every row starts after the previous row ends, then reading the matrix row by row produces a sorted 1D array. An ordinary boundary search over `[0, m*n)` applies directly.
2. **Indexing the flattening.** `mat[mid / n][mid % n]` where `n` is the **column** count. Using the row count here produces garbage indices that often stay in bounds, so it fails silently.
3. **Case 2 — why flattening is illegal.** When only rows and columns are sorted, row starts are not globally ordered: in the example above `2` follows `7` in flat order. There is no monotone predicate over the flat index, so there is nothing to binary search.
4. **The staircase instead.** Start at the top-right. If the cell is too big, the entire column below it is too big — drop the column. If it is too small, the entire row to its left is too small — drop the row. Each comparison removes a full row or column, giving `O(m + n)`.

> **The distinction that decides everything — and the gate:** read the constraint sentence: is `row[i][0] > row[i-1][last]` guaranteed? If yes, flatten. If only rows **and** columns are sorted, flattening is illegal and you want the staircase. Stating which is which from the constraints alone is the gate.

**The staircase is strictly `O(m + n)`, not `O(log)`.** That is optimal for this guarantee, and saying so pre-empts the *can you do better?* follow-up — you cannot, in general.

**Corner choice matters.** Top-right (or bottom-left) works because both directions are informative there. Starting at the top-left gives you two directions that both increase, so no comparison eliminates anything.

**The counting form starts bottom-left** — see sub-variant **I**, where the same walk is reused as `countLE` rather than as a search.

**After a flattened boundary search, re-verify:** `lo < m*n && mat[lo/n][lo%n] == t`.

#### Walkthrough — LC 240 — staircase search for 5

`[[1,4,7],[2,5,8],[3,6,9]]`. Flatten it and you get `1,4,7,2,5,8,3,6,9` — not sorted, so LC 74's approach is illegal here. The staircase starts top-right.

```
      c=0  c=1  c=2
 r=0    1    4    7   <- start here (top-right)
 r=1    2    5    8
 r=2    3    6    9        target = 5
```

| # | r, c | mat[r][c] | vs 5 | Eliminates | Update |
|---|---|---|---|---|---|
| 1 | 0, 2 | 7 | too big | the whole column below 7 | `c--` → 1 |
| 2 | 0, 1 | 4 | too small | the whole row left of 4 | `r++` → 1 |
| 3 | 1, 1 | 5 | **equal** | -- | found, return **true** |

Three comparisons for a nine-cell matrix. Each step discarded an entire row or column rather than a single cell, which is where the `O(m + n)` comes from. Had you flattened instead, the binary search would have compared against a sequence that is not sorted and returned a confident, wrong answer.

#### Key observations — what interviewers are listening for

- **The gate is a reading exercise, not a coding one.** *Look at LC 74 and LC 240 and state, from the constraints alone, which one may be flattened.* The failure mode is writing code before reading the guarantee.
- **Say why the corner is top-right.** Both directions carry information there. From the top-left, everything to the right and everything below is larger, so no comparison eliminates anything.
- **`n` is the column count, always.** The `/n` and `%n` decomposition is the one line where row and column counts get swapped, and the result usually stays in bounds — so it fails quietly.
- **Three guarantees, three techniques, one family.** Naming all three unprompted shows you have a taxonomy rather than a memorised pair of problems.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Flattening LC 240 as if it were LC 74 | wrong answers on staircase-sorted matrices; the code looks perfectly reasonable. | Read the constraint: is `row[i][0] > row[i-1][last]` guaranteed? If not, flattening is invalid. |
| `mid / n` using the row count | garbage indices that often remain in bounds, so it fails silently. | `n` is the number of **columns**. |
| Starting the staircase at the top-left | no comparison eliminates anything and the walk degenerates. | Start top-right for search, bottom-left for counting. Both directions must be informative. |
| Returning the flattened boundary without verifying | a position reported as a hit for an absent value. | `lo < m*n && mat[lo/n][lo%n] == t`. |

#### Key takeaway

- **Trigger:** a matrix search — but first, read which sortedness is guaranteed.
- **Fully sorted flat:** flatten over `[0, m*n)`; index `mid/n`, `mid%n` with `n` = columns.
- **Rows and columns:** staircase from the top-right, `O(m + n)`. Flattening is illegal.
- **Rows only:** binary search the value range — sub-variant **I**.
- **Gate:** state from the constraints alone which of LC 74 and LC 240 may be flattened. See [§5.3](index.md#57-binary-search).


### K — Partition binary search

```java
// 4. Median of Two Sorted Arrays. O(log min(m, n)).
// SEARCH SPACE: i = how many elements to take from the SHORTER array A. i ∈ [0, m].
// j is then forced: j = half - i.
// GOAL: aL <= bR and bL <= aR, i.e. every element on the left side <= every element on the right.
// SENTINELS: ±infinity at the edges remove all the empty-side edge cases.
static double findMedianSortedArrays(int[] A, int[] B) {
    if (A.length > B.length) return findMedianSortedArrays(B, A);   // ensures j stays in [0, n]
    int m = A.length, n = B.length, half = (m + n + 1) / 2;         // +1 ⇒ left side holds the
    int lo = 0, hi = m;                                             //   extra element when odd
    while (lo <= hi) {
        int i = lo + (hi - lo) / 2, j = half - i;
        int aL = (i == 0) ? Integer.MIN_VALUE : A[i - 1];
        int aR = (i == m) ? Integer.MAX_VALUE : A[i];
        int bL = (j == 0) ? Integer.MIN_VALUE : B[j - 1];
        int bR = (j == n) ? Integer.MAX_VALUE : B[j];
        if (aL <= bR && bL <= aR) {
            if (((m + n) & 1) == 1) return Math.max(aL, bL);
            return (Math.max(aL, bL) + (long) Math.min(aR, bR)) / 2.0;   // long: MIN+MAX overflows
        } else if (aL > bR) hi = i - 1;   // took too many from A
        else                lo = i + 1;   // took too few from A
    }
    throw new IllegalArgumentException("inputs not sorted");
}
```

### L — Floating-point

> **Intuition.** On the reals there is no `mid + 1` and no exact equality, so the usual termination logic does not apply. Run a **fixed number of halvings** instead — and stop worrying about convergence.

**Mental model.** *"I cannot step by one, and I cannot wait for `lo` to meet `hi`, because floating-point subtraction stops shrinking before they ever do. So I will halve a hundred times, which is far more precision than a double can hold anyway."*

The rule that governs integer binary search — *never write `lo = mid`* — **inverts** here. On reals, `lo = mid` is both correct and safe, precisely because there is no termination condition for it to stall.

One hundred halvings of a `10^9` range reaches roughly `10^-21`, which is well past what a double can represent. The iteration count is not a tuning parameter; it is simply *more than enough*.

```
   integer search                real search
   -------------------------     ----------------------------------
   lo = mid + 1                  lo = mid           <- legal here
   while (lo < hi)               for (100 times)    <- fixed count, cannot stall
   exact termination             no termination condition at all

   why an epsilon loop is wrong:
       once hi - lo drops below double precision, the subtraction
       stops shrinking -- and while (hi - lo > eps) never exits

   why 100: halving a 1e9 range 100 times reaches ~1e-21
```

*A fixed iteration count converts a termination problem into an arithmetic one, and the arithmetic is trivially in your favour.*

**Recognition — reach for this when:**

- ✓ The answer is a **real number** — a rate, a ratio, a root, an average.
- ✓ You have a monotone `feasible(x)` over a continuous interval.
- ✓ The problem states a tolerance such as `10^-5`.
- ✗ But **not** for a continuous **extremum**. Binary search finds boundaries; the maximum of a unimodal function needs ternary search or a search on the derivative's sign.


```java
// Use a FIXED ITERATION COUNT, not an epsilon loop. 100 halvings of a 1e9 range reaches
// ~1e-21, far past double precision — and it cannot stall on a value where hi - lo
// stops shrinking due to floating-point representation.
double lo = 0, hi = 1e9;
for (int iter = 0; iter < 100; iter++) {
    double mid = lo + (hi - lo) / 2;
    if (feasible(mid)) hi = mid; else lo = mid;   // note: `lo = mid`, NOT `mid + 1`
}
return lo;
```

```java
// 69. Sqrt(x) — integer answer, but overflow is the real lesson.
int lo = 0, hi = x;
while (lo < hi) {
    int mid = lo + (hi - lo + 1) / 2;        // last-true form ⇒ ceiling mid
    if ((long) mid * mid <= x) lo = mid;     // cast to long, or compare mid <= x / mid
    else                       hi = mid - 1;
}
return lo;
```

#### Why it works — why the integer rules invert

Three of this pattern's habits are wrong on reals, and understanding why is more useful than memorising the replacement.

1. **There is no smallest step.** `mid + 1` is meaningless on the reals, so the integer trick of excluding `mid` by stepping past it has no analogue. `lo = mid` is the only option.
2. **An epsilon loop can hang.** Once `hi - lo` falls below what a double can represent, the subtraction stops producing a smaller value. `while (hi - lo > eps)` then never terminates.
3. **A fixed count cannot stall.** With `for (int i = 0; i < 100; i++)` there is no condition to fail. The loop runs, converges as far as the representation allows, and stops.
4. **So `lo = mid` becomes safe.** The thing that made it dangerous in an integer search — being the loop's termination condition — is simply absent.

> **The rule that inverts on the reals:** `lo = mid` would be an infinite-loop bug in an integer search, but here it is correct **and** safe: there is no termination condition to stall, because the loop runs a fixed 100 times regardless.

**LC 69 `Sqrt(x)` has an integer answer but teaches the overflow lesson.** `mid * mid` overflows `int`, so either cast — `(long) mid * mid <= x` — or restructure as `mid <= x / mid`. It also uses the last-true form, so it needs the **ceiling** mid from sub-variant H.

**Never write an epsilon loop**, even when it seems to work. It is the difference between code that passes and code that hangs on one adversarial input.

#### Walkthrough — square root of 2 by fixed-iteration halving

`lo = 0`, `hi = 2`, `feasible(x) = x*x <= 2`. Five of the hundred iterations are shown; the interval is already narrowing on 1.41421...

```
feasible(x) = (x*x <= 2)        lo = 0, hi = 2
```

| # | lo | hi | mid | mid squared | `<= 2` ? | New interval |
|---|---|---|---|---|---|---|
| 1 | 0 | 2 | 1.0 | 1.0 | yes | `lo = mid` → [1.0, 2.0] |
| 2 | 1.0 | 2.0 | 1.5 | 2.25 | no | `hi = mid` → [1.0, 1.5] |
| 3 | 1.0 | 1.5 | 1.25 | 1.5625 | yes | `lo = mid` → [1.25, 1.5] |
| 4 | 1.25 | 1.5 | 1.375 | 1.8906 | yes | `lo = mid` → [1.375, 1.5] |
| 5 | 1.375 | 1.5 | 1.4375 | 2.0664 | no | `hi = mid` → [1.375, 1.4375] |

After five halvings the interval has width 0.0625 and brackets 1.41421. After a hundred it is narrower than a double can distinguish — so returning either endpoint is equally correct. Nowhere in the loop is there a condition that could fail to be met.

#### Key observations — what interviewers are listening for

- **The inverted rule is the memorable part.** *`lo = mid` is a bug in integers and correct on reals.* Knowing why — there is no termination condition — is the actual understanding.
- **Justify 100 with arithmetic, not superstition.** A `10^9` range halved 100 times is about `10^-21`, far past double precision. That is a sentence, not a guess.
- **Name the epsilon-loop failure precisely.** It hangs when `hi - lo` stops shrinking at the limits of representation — not merely *it might be slow*.
- **Know the boundary of the technique.** Binary search finds boundaries. A continuous maximum needs ternary search or a search on the sign of the derivative — reaching for plain binary search there is simply wrong.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Using an epsilon loop | hangs when `hi - lo` stops shrinking at double precision. | Fixed iteration count, 100 halvings. No termination condition, no stall. |
| Writing `lo = mid + 1` on reals | skips the answer by a whole unit, which is meaningless in a continuous space. | `lo = mid`. The integer rule does not apply here. |
| `mid * mid` in `int` for LC 69 | silent overflow and a wrong result on large inputs. | `(long) mid * mid <= x`, or restructure as `mid <= x / mid`. |
| Binary searching for a continuous extremum | converges to an arbitrary point rather than the maximum. | Ternary search, or binary search on the sign of the derivative. |

#### Key takeaway

- **Trigger:** a real-valued answer with a monotone `feasible(x)` and a stated tolerance.
- **Loop:** fixed 100 iterations — no termination condition, so no stall.
- **Inverted rule:** `lo = mid` is correct here, and would be an infinite loop in an integer search.
- **LC 69:** integer answer, but `(long) mid * mid` and the ceiling mid from H.
- **Gate:** shares the K → L/M gate. See [§5.3](index.md#57-binary-search).


### M — Binary search as a subroutine

```java
// 300. LIS in O(n log n). tails[k] = smallest possible tail of an increasing subsequence
//      of length k+1. tails is always sorted ⇒ binary searchable.
// NOTE: tails is NOT the LIS itself. Only its LENGTH is meaningful.
int[] tails = new int[a.length];
int size = 0;
for (int v : a) {
    int i = Arrays.binarySearch(tails, 0, size, v);
    if (i < 0) i = -(i + 1);        // Java returns -(insertionPoint) - 1 on miss
    tails[i] = v;                   // overwrite the first tail >= v  (== lowerBound)
    if (i == size) size++;
}
return size;
```

```java
// Exponential / galloping search for an unbounded or unknown-length space.
int bound = 1;
while (get(bound) < target) bound <<= 1;      // O(log answer)
// now the answer is in [bound / 2, bound] — run a normal binary search there
```

---

## 3.4 Failure Modes — Binary Search

| # | Bug | Symptom | Prevention |
|---|---|---|---|
| 1 | `mid = (lo + hi) / 2` | Overflow → negative index → `ArrayIndexOutOfBounds` at scale | Always `lo + (hi - lo) / 2`. In Java also available: `(lo + hi) >>> 1`. |
| 2 | `lo = mid` with floor mid | **Infinite loop** whenever `hi == lo + 1` | If you write `lo = mid`, you must write `mid = lo + (hi - lo + 1) / 2`. Or just use the `res`-tracking template and never write `lo = mid`. |
| 3 | `hi = mid` with ceiling mid | Infinite loop, the mirror of #3 | Floor mid pairs with `hi = mid`; ceiling mid pairs with `lo = mid`. Never cross them. |
| 4 | Mixing `[lo, hi]` and `[lo, hi)` between problems | Sporadic off-by-one; passes some tests | Pick one convention per template and label the file with it. |
| 5 | `hi = n - 1` when `n` is a legal answer | `lowerBound` can never return `n`; "not found" collapses into "last index" | Boundary searches use `hi = n` (exclusive). |
| 6 | `while (lo <= hi)` with `hi = mid` | Infinite loop | `<=` pairs with `mid ± 1` on both branches; `<` pairs with `hi = mid`. |
| 7 | Answer-space `hi` not guaranteed feasible | Returns an infeasible value silently | Choose `hi` as a value you can *prove* always works (sum of all, max element, full range). |
| 8 | Answer-space `lo` too low (e.g. `1` in LC 1011) | Returns an impossible answer | `lo` must be the smallest **legal** candidate — for capacity problems that is `max(weights)`. |
| 9 | Non-monotone `feasible` | Converges to a random point in the valid region | Write out `feasible(x) ⇒ feasible(x+1)` before coding. If you can't prove it, it's not binary search. |
| 10 | Overflow inside `feasible` | Wrong feasibility → wrong answer, no crash | `long` for every accumulation inside the predicate. `mid * mid`, `m * k`, `sum of weights`. |
| 11 | Ceiling division written as `v / speed + 1` | Off by one when it divides evenly | `(v + speed - 1) / speed`, in `long`. |
| 12 | Comparing to `a[lo]` in rotated-array search | Fails on a non-rotated array | Always compare `a[mid]` to `a[hi]`. |
| 13 | `a[lo] < a[mid]` (strict) in LC 33 | Fails when `lo == mid` (2-element window) | Use `a[lo] <= a[mid]`. |
| 14 | Reading `a[mid + 1]` under `lo <= hi` in peak search | Out of bounds at the last index | Peak search uses `lo < hi` so `mid + 1 <= hi` always. |
| 15 | Epsilon loop on floats | Hangs when `hi - lo` stops shrinking at double precision | Fixed iteration count (100). |
| 16 | `Arrays.binarySearch` with duplicates | Returns an arbitrary matching index, not a boundary | Write your own `lowerBound`/`upperBound`. |
| 17 | Forgetting `-(insertionPoint) - 1` decoding | Negative index used as a real index | `if (i < 0) i = -(i + 1);` |
| 18 | Flattening LC 240 as if it were LC 74 | Wrong answers on staircase-sorted matrices | Read the constraint sentence: is `row[i][0] > row[i-1][last]` guaranteed? |
| 19 | `mid / n` using the row count instead of the column count | Garbage indices in 2D flattening | `n` is the number of **columns**. |
| 20 | Returning `lo` when the space had no valid answer | Returns a bogus boundary instead of −1 | After a boundary search, always re-verify: `lo < n && a[lo] == target`. |

---

---

**Mastery gates for this pattern** live in the home document: [§5.3 Binary Search](index.md#57-binary-search) — together with the revisit rule for ★ problems.

