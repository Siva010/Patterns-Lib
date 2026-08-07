*Part of **Three Patterns, No Gaps**. [Home](index.md) · [Two Pointers](two-pointers.md) · [Sliding Window](sliding-window.md) · [Binary Search](binary-search.md)*

---

# PATTERN 2 — SLIDING WINDOW

## 2.1 Pattern Breakdown

A sliding window is legal **only when the validity predicate is monotone in the window**. Formally, one of these must hold:

- **Shrink-monotone:** if `[l, r]` is valid, every sub-window of it is valid. (→ maximize length)
- **Grow-monotone:** if `[l, r]` satisfies the requirement, every super-window does too. (→ minimize length)

If neither holds, sliding window is the wrong tool and no amount of pointer-fiddling will fix it. **Test this explicitly before writing a single line.** Sub-variant K exists entirely to teach you what the failure looks like.

| # | Sub-variant | Window size | Shrink rule | Answer form |
|---|---|---|---|---|
| **A** | **Fixed-size** | exactly `k` | unconditional, one out per one in | agg over each window |
| **B** | **Variable — maximize length** | grows | `while (invalid) shrink` | `max(r − l + 1)` |
| **C** | **Variable — minimize length** | grows then collapses | `while (satisfied) record & shrink` | `min(r − l + 1)` |
| **D** | **Non-shrinking (amortized)** | monotone non-decreasing | `if (invalid) shrink by 1` | final window size |
| **E** | **Frequency-map matching** | fixed or variable | driven by a `matched` counter | existence / all positions |
| **F** | **Counting windows** | variable | shrink to validity, then `+= r − l + 1` | count of subarrays |
| **G** | **At-most-K → exactly-K** | two windows | `f(K) − f(K−1)` | exact count |
| **H** | **Complement / inverse windows** | window over what you *exclude* | as B or C | total − window answer |
| **I** | **Monotonic deque windows** | fixed or prefix-indexed | expire by index, pop by value | window max/min, or shortest-at-least-K with negatives |
| **J** | **Ordered-multiset windows** | fixed | balanced structure / lazy-deletion heaps | median, k-th in window |
| **K** | ⚠ **Non-monotone predicates** | — | **window is invalid** | prefix-sum hash map, or fix a parameter and run many windows |

**The easily-missed sub-variants.** Each of these is routinely folded into a neighbouring pattern, taught under a different heading, or skipped altogether — and each earns its own row because it teaches something none of the others do:
- **D** the non-shrinking window. Most people write 424 and 1004 with a `while` shrink and never learn that the `if` version is both correct and strictly simpler for max-length questions. It also generalizes: *any* max-length window can be written this way.
- **F** counting windows. `count += r − l + 1` is a distinct skill from maximizing/minimizing and is required before **G** makes sense.
- **H** complement windows — "take k cards from either end" is a *minimum window of size n−k in the middle*. Recognizing the inversion is the whole problem.
- **J** ordered-multiset windows — where the window aggregate cannot be maintained in O(1) or by a deque.
- Circular windows (a special case of **A**/**H**, handled by index modulo or array doubling).

---

## 2.2 Problem Table

### A — Fixed-size window

> **Intuition.** The window never changes size. One element enters on the right, exactly one leaves on the left, and you **repair** the aggregate in `O(1)` instead of recomputing it.

**Mental model.** *"I am not summing a window. I am maintaining a sum: add what arrived, subtract what left. The window is a queue I never have to look inside."*

That is the entire saving. Recomputing each window costs `O(nk)`; repairing it costs `O(n)`, because every element is added once and removed once across the whole run.

The bug surface is almost entirely **two boundary conditions that use different indices**. They look similar, they are not the same, and mixing them up is the classic fixed-window bug.

```
   k = 3
   index    0    1    2    3    4
            [  window  ]                  first COMPLETE window ends at index k-1
                 [  window  ]

   r = 2  ->  first full window  ->  RECORD when  r >= k - 1
   r = 3  ->  a[0] falls out     ->  EVICT  when  r >= k,  the leaver is a[r - k]
```

*`r >= k` for the eviction, `r >= k - 1` for the record. Memorise them as two separate lines; deriving them under pressure is where the off-by-ones come from.*

**Recognition — reach for this when:**

- ✓ The window size `k` is **given by the problem**, not discovered from a constraint.
- ✓ The aggregate can be repaired in `O(1)` on entry and exit — a sum, a count, a predicate tally.
- ✓ The answer is that aggregate over each window, or the best of them.
- ✗ But **not** when the window length is what you are solving for. A size that responds to a constraint is sub-variant **B** or **C**.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★44 | **643. Maximum Average Subarray I** | Easy | A | The two boundary conditions that everyone gets wrong: evict at `r >= k`, record at `r >= k-1`. |
| ○45 | 2841. Maximum Sum of Distinct Subarrays With Length K | Medium | A | A fixed-size window carrying *two* invariants at once — a running sum and a distinctness map. Shows the fixed window is a frame you hang state on. |
| ★46 | **1456. Maximum Number of Vowels in a Substring of Given Length** | Medium | A | Same skeleton with a predicate-count aggregate instead of a sum. |
| ★47 | **1052. Grumpy Bookstore Owner** | Medium | A | Fixed window over a *delta* (the gain from the window) plus a constant baseline. Teaches "window the difference, not the value." |
| ○48 | 1343. Number of Sub-arrays of Size K With Average ≥ Threshold | Medium | A | Pure rep. Skip if 41–43 were clean. |

#### Why it works — the two boundary conditions

Both conditions fall out of one fact: the window that ends at index `r` is `[r-k+1, r]`. Everything else is reading that interval carefully.

1. **The window at `r`.** It spans `[r-k+1, r]`, which is `k` elements ending at `r`.
2. **Repair instead of recompute.** Add `a[r]` on entry. If the window has just overflowed past size `k`, subtract the element that fell off the left.
3. **Which element fell off.** When `r` arrives, the element leaving is the one at `r - k` — it was the left end of the *previous* window and is now outside. So the eviction fires when `r >= k`.
4. **When the first record is legal.** The first **complete** window ends at index `k - 1`. Recording earlier reports a partial window; recording from `r >= k` silently drops the first one.

> **Two different indices, and they are not interchangeable:** evict when `r >= k` — the leaver is `a[r - k]`; record when `r >= k - 1` — the first full window ends at index `k-1`.

**The window does not have to measure a total.** LC 1052 runs a fixed window over a *delta* — the gain the window would produce — on top of a constant baseline. Recognising that the window can measure an improvement rather than a quantity is what makes that problem easy.

**Overflow is real here.** Sums over `10^5` elements of `10^4` and up need `long`, and the failure is silent.

**Circular fixed windows** index with `% n` and loop to `n + k`. Do not physically double the array — see sub-variant **H** and LC 2134.

#### Walkthrough — a fixed window of size 3

`a = [2, 1, 5, 1, 3]`, `k = 3`. Watch the two conditions firing at different moments — the first record happens one step before the first eviction.

```
index   0   1   2   3   4
value   2   1   5   1   3        k = 3
```

| # | r | sum after add | evict? (r >= 3) | record? (r >= 2) | best |
|---|---|---|---|---|---|
| 1 | 0 | 2 | no | no | -- |
| 2 | 1 | 3 | no | no | -- |
| 3 | 2 | 8 | no | **yes** — first complete window `[0,2]` | 8 |
| 4 | 3 | 9 → `-a[0]=2` → 7 | **yes**, leaver is `a[r-3] = a[0]` | yes | 8 |
| 5 | 4 | 10 → `-a[1]=1` → 9 | yes, leaver is `a[1]` | yes | **9** |

Answer 9, the window `[5, 1, 3]`. Row 3 is the one to notice: the record fires while the eviction does not, because at `r = 2` the window has only just become complete and nothing has fallen out yet. Shift either condition by one and you lose either the first window or the alignment of every window after it.

#### Key observations — what interviewers are listening for

- **Say both boundary conditions before you write the loop.** The gate for this sub-variant is stating `r >= k` and `r >= k-1` **without deriving them**. They are the whole difficulty of an otherwise trivial pattern.
- **"Repair, don't recompute" is the transferable sentence.** It is why the pattern is linear, and it is the same idea that makes every other sub-variant here work — each element enters and leaves at most once.
- **A fixed window can measure a delta.** LC 1052's window measures the *gain* from suppressing the grumpy minutes, added to a constant baseline. Windows do not have to sum the thing the problem is about.
- **This skeleton is the base for E and H.** Frequency matching is this loop plus a `matched` counter; complement windows are this loop with the size flipped to `n - k`. Getting A automatic pays off twice more.
- **Overflow deserves a sentence, unprompted.** `long` for products and for sums over large arrays. Saying it before you are asked is cheap and reads as experience.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Evicting `a[r - k + 1]` instead of `a[r - k]` | off-by-one on **every** window, so every answer is wrong in the same quiet way. | The window is `[r-k+1, r]`. The element that just *left* is the one before that: `a[r-k]`. |
| Recording at `r >= k` instead of `r >= k - 1` | the first complete window is silently dropped — and it is often the answer. | The first full window ends at index `k-1`, so that is when recording becomes legal. |
| Recomputing the aggregate for each window | correct answers, `O(nk)` time, and a time-limit failure on the real constraints. | Add the entrant, subtract the leaver. Never look inside the window. |
| Accumulating in `int` | silent wrong answers on large inputs; the samples all pass. | `long` for any sum over `10^5` elements of `10^4`+, and for every product window. |

#### Key takeaway

- **Trigger:** the problem hands you a fixed `k` and an aggregate you can repair in `O(1)`.
- **Rule:** add the entrant, subtract the leaver, read the aggregate.
- **The two bounds:** evict when `r >= k` (leaver is `a[r-k]`); record when `r >= k-1`.
- **Cost:** `O(n)` time, `O(1)` space — each element enters and leaves exactly once.
- **Gate:** A is yours when the skeleton comes out blind and you can state both boundary conditions without deriving them. See [§5.2](index.md#56-sliding-window).


### B — Variable window, maximize length

> **Intuition.** Grow greedily on the right. The moment the window turns invalid, shrink from the left until it is valid again — and what you are holding is the **longest** valid window ending here.

**Mental model.** *"For this right endpoint, what is the leftmost start that still works? I shrink until valid and stop. I never need to consider a start further left, because those windows are only longer and therefore also invalid."*

That last sentence is not a convenience — it is the **precondition**. The pattern is legal only when validity is **shrink-monotone**: if `[l, r]` is valid, every sub-window of it is valid. Without that, 'shrink until valid and stop' has no justification.

Two details carry all the bugs: shrink with **`while`**, not `if`, because one insertion can require several evictions; and record **after** the shrink loop, because before it the window may still be invalid.

```
   for r in 0..n-1:
       add(a[r])
       while (!valid) { remove(a[l]); l++ }      <- WHILE, not if
       best = max(best, r - l + 1)               <- record AFTER the loop

   C does the opposite on both counts. That pairing is the thing to keep straight.
```

*Shrink **while invalid**, record **after**. Sub-variant C shrinks *while satisfied* and records *inside* — and confusing the two is the most common permanent error in this pattern.*

**Recognition — reach for this when:**

- ✓ The answer is a **longest** or **maximum-length** contiguous run.
- ✓ Validity is **shrink-monotone** — chopping elements off a valid window keeps it valid.
- ✓ The constraint reads like a **budget**: at most `k` distinct, at most `k` zeros, no repeats.
- ✗ But **not** if adding an element can *repair* an invalid window. That is non-monotone, and it is sub-variant **K** — LC 395 exactly.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★49 | **3. Longest Substring Without Repeating Characters** | Medium | B | The canonical expand/shrink. Do it *both* ways — `while`-shrink and index-jump — and know why the index-jump version needs `l = max(l, seen[c] + 1)`. |
| ★50 | **340. Longest Substring with At Most K Distinct Characters** 🔒 | Medium | B | The distinct-count window with a map whose keys must be **removed at zero**, not left at zero. Free substitute: **904. Fruit Into Baskets** (identical, K=2). |
| ★51 | **1004. Max Consecutive Ones III** | Medium | B | Window validity as a *budget* (`zeros <= k`). This reframing — "how much violation can I afford?" — unlocks a whole class. |
| ★52 | **1493. Longest Subarray of 1's After Deleting One Element** | Medium | B | Same as #51 with `k = 1` and a forced deletion, so the answer is `r − l` not `r − l + 1`. Exactly the off-by-one this section exists for. |

#### Why it works — why stopping at the first valid window is correct

The loop makes one greedy decision per right endpoint. Shrink-monotonicity is what makes that decision safe.

1. **The invariant.** At the bottom of each iteration `[l, r]` is valid, and `l` is the **smallest** left boundary for which that holds. So `r - l + 1` is the best window ending at `r`.
2. **Why you may stop shrinking as soon as it is valid.** Shrink-monotonicity: any further shrink is also valid but strictly shorter. There is nothing to gain by continuing, so the first valid position is the best one.
3. **Why `while` and not `if`.** A single insertion can violate the constraint by more than one eviction's worth — adding one character may require evicting a whole run before validity returns.
4. **Why the record comes after.** Inside or before the loop, the window may still be invalid, so you would record a window that is too large and does not satisfy the constraint.

> **The two halves of the loop shape:** shrink **while invalid**, record **after**. Sub-variant C inverts both — it shrinks while *satisfied* and records *inside*. Being able to write both back to back, and say the difference out loud, is the gate.

**Map hygiene is not optional.** When a count reaches zero the key must be **removed**, or `map.size()` overcounts distinct values and the window never shrinks: `if (map.merge(c, -1, Integer::sum) == 0) map.remove(c);`. With an `int[26]` the equivalent is an explicit `distinct` counter decremented at zero.

**Validity as a budget is the reframing worth stealing.** LC 1004 is not *count the ones* — it is *how much violation can I afford?* (`zeros <= k`). That reframing turns a family of differently-worded problems into one template.

**LC 1493 forces a deletion**, so the answer is `r - l`, not `r - l + 1`. Same window, different read-off — and an easy off-by-one to leave in.

#### Walkthrough — LC 3 on "abba" — where `if` would fail

Longest substring without repeating characters. Step 3 needs **two** evictions in a row, which is exactly the case an `if` cannot handle.

```
index   0   1   2   3
char    a   b   b   a
```

| # | r | char in | Window before shrink | Shrink | Window after | best |
|---|---|---|---|---|---|---|
| 1 | 0 | a | `a` | valid, none | `a` | 1 |
| 2 | 1 | b | `ab` | valid, none | `ab` | 2 |
| 3 | 2 | b | `abb` | evict `a` (l=1) → `bb` still invalid → evict `b` (l=2) | `b` | 2 |
| 4 | 3 | a | `ba` | valid, none | `ba` | 2 |

Answer 2. Row 3 is the whole argument for `while`: one insertion invalidated the window by enough that a single eviction did not fix it. An `if` would have left `bb` in place and the window would have reported a length containing a duplicate.

#### Key observations — what interviewers are listening for

- **The precondition is the first thing to say, not the last.** *Is validity shrink-monotone?* If you cannot answer that, you cannot justify stopping the shrink loop — and sub-variant K exists to show what happens when the answer is no.
- **B and C are mirror images and must be learned as a pair.** The gate explicitly asks for both, written back to back in one sitting. They differ in the shrink condition *and* the record position, and getting one right does not protect the other.
- **Budgets generalise better than counts.** *At most `k` violations* covers LC 1004, 1493, 424 and 340 with one skeleton. Candidates who reframe to a budget stop seeing four problems.
- **Zero-count keys are a real correctness bug, not tidiness.** A stale zero entry makes `size()` lie, the shrink condition never fires, and the answer is too large. It is invisible on inputs without repeats.
- **Some B problems have a slicker non-shrinking form.** Any max-length window can be written as sub-variant **D**, which never shrinks at all. Knowing both, and why D is legal, is the D gate.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Using `if` instead of `while` on the shrink loop | the window stays invalid, and maxima come out too large. | One addition can require many evictions. `while` for B and C; `if` **only** in the deliberate non-shrinking template D. |
| Recording before the shrink loop | records an invalid, too-large window. | In B the record goes **after** the `while`. In C it goes inside. Fix the pair in your head once and it stops being a coin flip. |
| Leaving zero-count keys in the frequency map | `map.size()` overcounts distinct keys, so the window never shrinks. | `if (map.merge(c, -1, Integer::sum) == 0) map.remove(c);` — or an explicit `distinct` counter for array-backed frequencies. |
| Returning `r - l + 1` on LC 1493 | answer exactly one too large. | That problem forces a deletion, so the answer is `r - l`. Read the required output before reusing the template's last line. |

#### Key takeaway

- **Trigger:** longest contiguous run, with **shrink-monotone** validity — usually a budget.
- **Rule:** grow on the right; `while (!valid) shrink`; record after.
- **Invariant:** `l` is the smallest left boundary keeping `[l, r]` valid, so `r - l + 1` is best-ending-at-`r`.
- **Hygiene:** delete zero-count keys, or `size()` lies and the window never shrinks.
- **Gate:** B is yours when you can write B and C back to back and articulate the difference. See [§5.2](index.md#56-sliding-window).


### C — Variable window, minimize length

> **Intuition.** Grow until the window **satisfies** the requirement, then give elements back for as long as it still satisfies — writing down the size before each giveback. The last size you wrote is the smallest window ending here.

**Mental model.** *"The moment I satisfy the requirement I start handing elements back, and I write the size down **before** each handback — because at that instant the window is still valid, and one step later it may not be."*

The precondition is the mirror of B's. This needs **grow-monotone** validity: if `[l, r]` satisfies the requirement, every super-window does too. That is what makes *shrink while satisfied* terminate exactly at the boundary of satisfaction.

B and C differ in **both** places — the loop condition and the record position — and the table below is worth more than any amount of prose about it.

```
   B  (maximize length)                  C  (minimize length)
   ------------------------              ------------------------
   add(a[r])                             add(a[r])
   while (!valid) {                      while (satisfied) {
       remove(a[l]); l++                     record        <- INSIDE, before remove
   }                                         remove(a[l]); l++
   record          <- AFTER the loop     }

   shrink WHILE INVALID                  shrink WHILE SATISFIED
   record AFTER                          record INSIDE
```

*Both differences at once. B stops shrinking when the window becomes legal; C keeps shrinking while it is still legal, and the last legal size it saw is the answer.*

**Recognition — reach for this when:**

- ✓ The answer is a **shortest** or **minimum-length** contiguous run.
- ✓ Validity is **grow-monotone** — once satisfied, adding more cannot un-satisfy it.
- ✓ The requirement is a **debt to clear**: reach a sum, cover a multiset of characters.
- ✗ But **not** with negative numbers in a sum problem. Growing can then *decrease* the sum, monotonicity fails, and you need a deque over prefix sums — LC 862, sub-variant **I**.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★53 | **209. Minimum Size Subarray Sum** | Medium | C | Shrink-**while-satisfied**, record *before* shrinking. Opposite loop shape from B; write them back to back until the difference is reflexive. |
| ★54 | **76. Minimum Window Substring** | Hard | C + E | The hardest correct-by-construction window. Introduces the `have`/`need` counter so validity is O(1) instead of O(Σ). |
| ★55 | **1234. Replace the Substring for Balanced String** | Medium | C | Validity depends on what is **outside** the window. Inverts your mental model of what the window "contains." |

#### Why it works — why the record goes inside the shrink loop

One placement decision separates a correct C from a subtly wrong one, and it follows directly from when the window is actually valid.

1. **The precondition.** Grow-monotone validity: satisfying at `[l, r]` implies satisfying at every super-window. So *still satisfied* is a legitimate loop condition — it can only turn off once, at the boundary.
2. **The invariant.** We shrink while the window **still** satisfies the requirement, so the last size recorded before it stops is the smallest window ending at `r`.
3. **Why record before the remove.** At the top of the loop body the window is valid. After `remove(a[l])` it may not be. Recording after the removal records a window that does not satisfy the requirement — always too small, always wrong.
4. **The sentinel.** If the requirement is never satisfied, `best` is untouched. Return `0` (or the empty string) rather than leaking `Integer.MAX_VALUE` to the caller.

> **Record placement is the entire difference from B:** in C, record **inside** the `while`, before `remove`. Recording after the shrink records an invalid window.

**LC 76's `have`/`need` counter makes validity `O(1)`.** `required` is the number of characters still owed, multiplicity included; only a *needed* character reduces the debt, and only removing a *needed* character re-owes it.

**`need[c]` is allowed to go negative, and that is the point.** Surplus characters push the entry below zero, which is exactly what makes the `> 0` and `== 0` tests correct without a second map. Being able to explain that is the C gate.

**LC 1234 inverts the mental model**: validity depends on what is **outside** the window, not inside it. Same loop shape, and a genuinely different way of reading the predicate.

#### Walkthrough — LC 209 — minimum subarray with sum at least 7

`a = [2, 3, 1, 2, 4, 3]`, `target = 7`. Steps 4 and 5 each shrink more than once, recording before every removal.

```
index   0   1   2   3   4   5
value   2   3   1   2   4   3        target = 7
```

| # | r | sum after add | Shrink loop (record, then remove) | best |
|---|---|---|---|---|
| 1 | 0-2 | 2, 5, 6 | never reaches 7 — loop does not run | -- |
| 2 | 3 | 8 | record 4 (`[0,3]`); remove `a[0]`=2 → sum 6, stop | 4 |
| 3 | 4 | 10 | record 4; remove 3 → 7, still satisfied; record **3**; remove 1 → 6, stop | 3 |
| 4 | 5 | 9 | record 3; remove 2 → 7, still satisfied; record **2**; remove 4 → 3, stop | **2** |

Answer 2, the window `[4, 3]`. Notice what would happen with the record moved after the `remove`: on the final step you would record the window `[5,5]` of size 1, whose sum is 3 — and confidently return an answer that does not satisfy the requirement at all.

#### Key observations — what interviewers are listening for

- **Grow-monotonicity is the licence, and negatives revoke it.** LC 209 works because the values are positive. LC 862 is the same question with negatives allowed, and the window collapses — that is why 862 lives in sub-variant I, not here.
- **The record position is the single most-tested detail.** Interviewers who know the pattern watch for it specifically, because it separates people who derived the loop from people who half-remember it.
- **`need[]` going negative is a feature worth narrating.** It encodes *surplus*, which is what lets one array answer both 'do I still owe this character?' and 'can I afford to drop it?' without a second structure.
- **Validity can live outside the window.** LC 1234 asks whether what *remains* outside is balanced. The loop is untouched; only the predicate moves. Recognising that is worth more than the problem.
- **Always handle the never-satisfied case explicitly.** A sentinel `Integer.MAX_VALUE` escaping into the return value is a common and embarrassing failure on the empty-answer test.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Recording after the shrink | records an invalid, too-small window — and the returned length cannot actually be achieved. | In C, record **inside** the `while`, before `remove`. |
| Using B's loop condition | shrinking *while invalid* never fires here, so the window never contracts and you return the first satisfying length rather than the smallest. | C shrinks **while satisfied**. Write B and C side by side until the pairing is automatic. |
| Applying C to a sum problem with negatives | wrong answers on mixed-sign input; every positive-only test passes. | Ask first: *does adding an element monotonically move the aggregate?* If not, prefix sums plus a deque — LC 862. |
| Returning the sentinel | `Integer.MAX_VALUE` or a garbage substring on inputs with no valid window. | `return best == Integer.MAX_VALUE ? 0 : best;` — and the empty string for LC 76. |

#### Key takeaway

- **Trigger:** shortest contiguous run, with **grow-monotone** validity — a debt to clear.
- **Rule:** grow on the right; `while (satisfied) { record; shrink; }`.
- **The pairing:** B shrinks while **invalid** and records **after**; C shrinks while **satisfied** and records **inside**.
- **LC 76:** `have`/`need` gives `O(1)` validity, and `need[]` goes negative to encode surplus.
- **Gate:** C is yours when LC 76 comes out blind and you can explain why `need[]` may go negative. See [§5.2](index.md#56-sliding-window).


### D — Non-shrinking windows

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★56 | **424. Longest Repeating Character Replacement** | Medium | D | The famous "stale `maxFreq` is still correct" argument. You must be able to explain why never decreasing `maxFreq` cannot produce a wrong answer. |

### E — Frequency-map matching

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★57 | **567. Permutation in String** | Medium | E | Fixed-size window + a `matched` counter that increments/decrements on exact equality. |
| ★58 | **438. Find All Anagrams in a String** | Medium | E | #57 collecting all positions instead of returning early. |
| ○59 | 30. Substring with Concatenation of All Words | Hard | E | Word-granular windows: `wordLen` separate window phases. Only if you want the hard rep. |
| ○60 | 727. Minimum Window Subsequence 🔒 | Hard | C + E | Forward-then-backward two-pass window. Genuinely different, but premium and rare. |

### F — Counting windows

> **Intuition.** Do not count valid subarrays one at a time. Once the window is settled at `r`, an **entire block of start positions** is valid at once — add the size of the block and move on.

**Mental model.** *"This is the same batching move as counting pairs in two pointers. One shrink, then one addition that banks a whole family of subarrays instead of walking them."*

There are exactly **two** formulas, and you do not choose between them by reading the problem's wording — you choose by asking which direction validity is monotone in. Get that backwards and the count is wrong in a way that looks like an off-by-one.

This is the window form of the `count += r - l` batching from two pointers §1.K. Same insight, different window definition — which is exactly why that sub-variant closes its pattern.

```
   F1   validity is SHRINK-monotone      ("at most" style: product < k, at most K distinct)
        after shrinking, every subarray ending at r and starting in [l, r] is valid
        ->  count += r - l + 1

   F2   validity is GROW-monotone        ("contains all of X" style)
        shrink while STILL valid; then every start in [0, l-1] also works
        ->  count += l
```

*The `+1` in F1 is because the block of valid starts **includes** `l` itself. In F2 the shrink has already stepped one past the last valid start, so `l` is the count.*

**Recognition — reach for this when:**

- ✓ The answer is a **count of subarrays**, not a length and not the subarrays themselves.
- ✓ Validity is monotone in one direction, and you can say which.
- ✓ Enumerating each valid subarray individually would be an order too slow.
- ✗ But **not** when the problem wants the subarrays listed, or wants a longest/shortest. Batching gives you the number only.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★61 | **713. Subarray Product Less Than K** | Medium | F | `count += r − l + 1`. First appearance of the batching rule in window form. Watch the `k <= 1` edge case. |
| ★62 | **1358. Number of Substrings Containing All Three Characters** | Medium | F | Counting the *other* direction: `count += l` (all left extensions), because validity is grow-monotone. Knowing which of the two counting formulas applies is the skill. |

#### Why it works — why a whole block of starts is valid at once

Both formulas are direct consequences of monotonicity — the same reasoning, applied in opposite directions.

1. **F1 — the setup.** Validity is shrink-monotone, and we shrink until `[l, r]` is valid. Every sub-window of a valid window is valid.
2. **F1 — the block.** So every subarray ending at `r` and starting anywhere in `[l, r]` is valid. That is `r - l + 1` subarrays, certified by one comparison.
3. **F2 — the setup.** Validity is grow-monotone, and we shrink **while still valid**. The loop therefore stops with `l` one position past the last start that worked.
4. **F2 — the block.** Every start in `[0, l-1]` gives a super-window of a valid window, so all of them are valid too. That is `l` subarrays.

> **Pick the formula from the monotonicity, not from the wording:** `count += r - l + 1` when validity is **shrink**-monotone (at-most style); `count += l` when it is **grow**-monotone (contains-all style).

**LC 713 needs `k <= 1` guarded.** No product of positive integers is below 1, so without the early return the shrink loop divides past `l = r` and misbehaves.

**Products overflow.** Accumulate in `long`, and remember that the division-based shrink is only valid because every element is positive.

**F is a prerequisite for G, not a sibling.** The at-most-K subtraction identity is defined over *counts of subarrays* — which is precisely what F1 produces. Learning G first is why people misapply the identity to lengths.

#### Walkthrough — LC 713 — subarrays with product below 100

`a = [10, 5, 2, 6]`, `k = 100`. One comparison per step, and each one banks several subarrays at once.

```
index    0    1    2    3
value   10    5    2    6        k = 100
```

| # | r | product after add | Shrink | l | count += | total |
|---|---|---|---|---|---|---|
| 1 | 0 | 10 | none, 10 < 100 | 0 | `r - l + 1` = 1 | 1 |
| 2 | 1 | 50 | none | 0 | 2 | 3 |
| 3 | 2 | 100 | 100 >= 100 → divide by `a[0]`=10 → 10, `l=1` | 1 | 2 | 5 |
| 4 | 3 | 60 | none | 1 | 3 | 8 |

Answer 8. Step 4 banked three subarrays — `[6]`, `[2,6]`, `[5,2,6]` — from a single comparison. Writing `count++` there instead would return 4, which looks like a small bug and is actually a missing batch.

#### Key observations — what interviewers are listening for

- **Name the monotonicity before you pick the formula.** The gate asks exactly this: when `count += r - l + 1` versus `count += l`, and how each ties to shrink- or grow-monotonicity. Memorising the two lines without the tie is how they get swapped.
- **The `+1` has a reason, and it is worth saying.** F1 counts a block that includes `l`; F2's shrink already stepped past the last valid start. Two different geometries, not two arbitrary formulas.
- **This is two pointers §1.K in window clothing.** One comparison certifying a block of candidates. If that transferred for free, the pattern structure is doing its job.
- **Counting and measuring are different questions.** A counting window and a longest-window can look identical and need different bookkeeping. Read the required output first.
- **Guards and overflow deserve a sentence each.** `k <= 1` and `long` are both silent failures on LC 713, and both are cheap to mention before being asked.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Writing `count++` instead of the batch | severe undercount that reads like an off-by-one. | One settled window certifies a whole block of start positions. Count the block. |
| Using `r - l + 1` where validity is grow-monotone | wrong counts on contains-all problems, in the right ballpark. | Grow-monotone means the shrink stopped past the last valid start: the answer is `count += l`. |
| Forgetting the `k <= 1` early return in LC 713 | the shrink loop runs past `l = r` and divides by the wrong element. | `if (k <= 1) return 0;` — no positive product is below 1. |
| Accumulating the product in `int` | silent overflow, plausible-looking wrong answer. | `long` for the running product, always. |

#### Key takeaway

- **Trigger:** count of subarrays, with validity monotone in a nameable direction.
- **F1 (shrink-monotone):** shrink to validity, then `count += r - l + 1`.
- **F2 (grow-monotone):** shrink while still valid, then `count += l`.
- **Prerequisite:** F1 is what sub-variant **G**'s subtraction identity is defined over.
- **Gate:** F is yours when you can state which formula applies and tie each to its monotonicity. See [§5.2](index.md#56-sliding-window).


### G — At-most-K → exactly-K

> **Intuition.** *Exactly K* usually cannot be maintained by a single window — but *at most K* always can. So count at most K, count at most K-1, and let the subtraction isolate the difference.

**Mental model.** *"I cannot shrink toward exactly-K, because a window with fewer than K is not **invalid** — it is just not what I want. There is nothing to shrink against. So I count two easier things and subtract."*

This is the sub-variant that teaches a genuinely different move: when a predicate is not monotone, look for a **monotone relaxation** of it whose counts you can difference. Exactly-K is not monotone; at-most-K is.

The identity has a precondition, and it is not optional. `atMost` must be monotone non-decreasing in K, and it must count **subarrays** — formula F1 — not lengths.

```
   exactly(K) = atMost(K) - atMost(K-1)

   why a single window fails:
       "at most K distinct"   invalid when count > K   ->  something to shrink against
       "exactly K distinct"   a window with K-1 is not invalid, merely wrong
                              ->  no shrink rule exists

   PRECONDITION: atMost must be monotone non-decreasing in K,
                 and must count SUBARRAYS (F1), never lengths.
```

*Two runs of the same `atMost` machine, differing only in the parameter. The subtraction is doing the work that no single window could.*

**Recognition — reach for this when:**

- ✓ The problem says **exactly** K — distinct values, odd numbers, a target sum.
- ✓ The answer is a **count of subarrays**.
- ✓ You can write an `atMost(K)` window that is clearly monotone in K.
- ✗ But **not** for *longest with exactly K*. The identity is defined over counts; applied to lengths it produces nonsense.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★63 | **930. Binary Subarrays With Sum** | Medium | G | The cleanest introduction to `exactly(S) = atMost(S) − atMost(S−1)`. |
| ★64 | **992. Subarrays with K Different Integers** | Hard | G | The same identity where "exactly" is genuinely unreachable with one window. This is the problem that proves *why* the subtraction trick must exist. |
| ★65 | **1248. Count Number of Nice Subarrays** | Medium | G | Recognizing that "k odd numbers" is a relabelling of #63. Transfer test — if you don't see it instantly, redo #63. |

#### Why it works — the identity and its precondition

The subtraction is obvious once stated and easy to misapply, so the precondition matters as much as the identity.

1. **What `atMost(K)` counts.** Every subarray whose distinct-count (or sum, or odd-count) is `<= K`. A plain F1 counting window computes it.
2. **What `atMost(K-1)` counts.** Every subarray at `<= K-1`. Because the constraint is strictly tighter, this set is a **subset** of the first.
3. **The difference.** Subarrays counted by the first and not the second are exactly those with a value of precisely `K`. That is the answer.
4. **Why it must be counts.** The set-difference argument works because both terms count the *same kind of object*. Lengths are not additive over sets, so subtracting two maxima is meaningless.

> **The identity, and the precondition that makes it legal:** `exactly(K) = atMost(K) - atMost(K-1)`, valid **only** when `atMost` counts subarrays (formula F1) and is monotone non-decreasing in K. It does **not** work for 'longest with exactly K'.

**LC 930 and 1248 are the same shell.** Replace `f.size() > k` with `sum > k` or `oddCount > k` and nothing else changes. LC 1248 is the transfer test: if you do not see that *k odd numbers* is a relabelling of *sum of a 0/1 array*, the pattern has not landed.

**LC 992 is the one that cannot be faked.** *Exactly K distinct* is genuinely unreachable with one window, which is why the gate asks you to explain **why**, not just to produce the code.

**Verified reference values:** `[1,2,1,2,3]` with `k = 2` gives 7; `[1,2,1,3,4]` with `k = 3` gives 3. Useful for checking an implementation before submitting.

#### Walkthrough — LC 992 on [1, 2, 1, 2, 3] with K = 2

Two runs of the same machine, side by side. Each column shows the window **after** shrinking and the batch it contributes.

```
index    0    1    2    3    4
value    1    2    1    2    3        K = 2
```

| # | r | atMost(2) window | + | atMost(1) window | + |
|---|---|---|---|---|---|
| 1 | 0 | `[1]` | 1 | `[1]` | 1 |
| 2 | 1 | `[1,2]` | 2 | `[2]` | 1 |
| 3 | 2 | `[1,2,1]` | 3 | `[1]` | 1 |
| 4 | 3 | `[1,2,1,2]` | 4 | `[2]` | 1 |
| 5 | 4 | `[2,3]` | 2 | `[3]` | 1 |

`atMost(2) = 12`, `atMost(1) = 5`, so `exactly(2) = 7` — matching the verified value above. Look at row 5: the at-most-2 window had to evict three elements to admit the `3`, while the at-most-1 window evicted everything. Neither run ever needed to know what *exactly two* means.

#### Key observations — what interviewers are listening for

- **Be ready to explain why one window cannot do it.** The gate asks for this directly. The answer: a window below K is not invalid, so the shrink loop has no condition to fire on — there is nothing to shrink against.
- **State the precondition unprompted.** *`atMost` is monotone in K and counts subarrays.* Both halves matter, and the second is what stops people applying the identity to length problems.
- **The relabelling is the transfer test.** LC 1248's *k odd numbers* is LC 930's *sum equals S* over a 0/1 array. Seeing that without being told is the point of including both.
- **Monotone relaxation is a general technique.** When a predicate is not monotone, look for a monotone one whose counts differ by what you want. That idea outlives this pattern.
- **Two passes is still linear.** Candidates sometimes resist the double run as wasteful. `2 * O(n)` is `O(n)`, and the alternative is a window that does not exist.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Applying the identity to a **length** answer | nonsense output — subtracting two maxima means nothing. | The identity is valid only for **counts of subarrays**. For *longest with exactly K* you need a different approach entirely. |
| Writing `atMost` with a length-style record | the subtraction silently operates on the wrong quantity. | `atMost` must use formula **F1**: `count += r - l + 1` after shrinking. |
| Assuming `atMost` is monotone without checking | the difference can go negative or overcount. | Confirm that raising K can only admit more subarrays. If it cannot, the identity does not apply. |
| Trying to shrink toward exactly-K with one window | an infinite loop, or a shrink condition that never fires. | There is no such condition. That is the entire reason this sub-variant exists. |

#### Key takeaway

- **Trigger:** **exactly** K, where the answer is a count of subarrays.
- **Identity:** `exactly(K) = atMost(K) - atMost(K-1)`.
- **Precondition:** `atMost` monotone non-decreasing in K, and counting subarrays (F1) not lengths.
- **Why one window fails:** a window below K is not invalid, so no shrink rule exists.
- **Gate:** G is yours when you can explain why LC 992 needs two windows and state the precondition. See [§5.2](index.md#56-sliding-window).


### H — Complement / inverse windows

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★66 | **1423. Maximum Points You Can Obtain from Cards** | Medium | H | "Take k from the ends" = "minimize a fixed window of size n−k in the middle." The inversion insight. |
| ★67 | **1658. Minimum Operations to Reduce X to Zero** | Medium | H | "Shortest prefix+suffix summing to x" = "longest middle subarray summing to `total − x`". Note the `x == total` edge case. |
| ★68 | **2134. Minimum Swaps to Group All 1's Together II** | Medium | A + H | Circular fixed window. Learn the `i % n` idiom rather than physically doubling the array. |

### I — Monotonic deque windows

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★69 | **239. Sliding Window Maximum** | Hard | I | The deque-of-indices template. Indices, not values — you cannot expire by value. |
| ★70 | **1438. Longest Continuous Subarray With Absolute Diff ≤ Limit** | Medium | I | **Two** deques (max and min) inside a variable window. Both must be popped during the shrink. |
| ★71 | ⚠ **862. Shortest Subarray with Sum at Least K** | Hard | I + K | Negatives break the plain window. The fix — monotonic deque over the *prefix-sum array* — is the single most instructive hard problem in this pattern. Note the loop runs to `i == n` inclusive. |

### J — Ordered-multiset windows

> **Intuition.** When the window's aggregate is a **median or a k-th value**, neither an `O(1)` counter nor a deque can maintain it. You need a structure that keeps the window **ordered** as elements arrive and leave.

**Mental model.** *"A deque works because max is decided by domination — one element can make another permanently irrelevant. A median has no such relation. Every element in the window can still matter, so I have to keep the whole window sorted, not just the candidates."*

This is the honest boundary of the cheap techniques. Sub-variant **I** eliminates candidates; here nothing can be eliminated, so you pay `O(log k)` per step instead of `O(1)`.

Two standard realisations: **two heaps** — a max-heap holding the lower half and a min-heap holding the upper half, rebalanced so their sizes differ by at most one — or a `TreeMap` used as a multiset. Both problems here are marked optional; the table is explicit that this is for a higher bar.

```
   deque works when   an older, smaller element can NEVER matter again   (max, min)
   deque fails when   every element in the window can affect the answer   (median, k-th)

   two heaps:     [ max-heap: lower half ] | [ min-heap: upper half ]
                                    median sits at the boundary
                  rebalance so the sizes differ by at most 1

   lazy deletion: a binary heap cannot remove an arbitrary element,
                  so mark it dead and discard it when it reaches the top
```

*The dividing line between I and J is whether a domination relation exists. Max and min have one; medians and k-th values do not.*

**Recognition — reach for this when:**

- ✓ The window aggregate is a **median, a k-th smallest, or a rank query**.
- ✓ No element can be ruled out in advance — there is no domination argument to make.
- ✓ `O(n log k)` is acceptable under the stated constraints.
- ✗ But **not** for max or min. Those have a domination relation and belong in sub-variant **I** at `O(1)` amortised.


| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ○72 | 480. Sliding Window Median | Hard | J | Two heaps with lazy deletion, or a `TreeMap` multiset. Include only if you're targeting a bar where hard-tier data-structure composition shows up. |
| ○73 | 1425. Constrained Subsequence Sum | Hard | I + DP | Monotonic deque optimizing a DP recurrence. The natural next step after #69 if you want depth. |

#### Why it works — why the deque does not generalise

It is worth being precise about *why* the cheaper structure fails here, because the same question decides the tool on every window problem with an unusual aggregate.

1. **What the deque relied on.** Domination: an element that is both older and smaller than another can never again be the answer. That is what let the deque throw most of the window away.
2. **Medians admit no domination.** The median depends on the *whole distribution*. A small element is not irrelevant — it is part of what determines where the middle sits. Nothing can be discarded.
3. **So keep the window fully ordered.** Two heaps split it at the median: the max-heap holds the lower half, the min-heap the upper. Rebalance after every insertion and removal so the sizes differ by at most one.
4. **Lazy deletion handles the eviction.** A binary heap cannot remove an arbitrary interior element. So mark the outgoing element as dead and physically discard it only when it surfaces at the top.

> **The dividing line between I and J:** reach for a deque when an older element can be **dominated** into irrelevance; reach for an ordered multiset when it cannot. Max and min dominate; medians and k-th values do not.

**The cost is `O(n log k)`, and that is the signal.** If the constraints do not allow a log factor, the intended solution is probably not a window at all — re-run the monotonicity test from §2.1 before committing.

**Median arithmetic overflows.** For an even-sized window the median is the mean of two middles; compute it as `lo + (hi - lo) / 2.0` rather than `(lo + hi) / 2` to avoid overflowing on large values.

**A `TreeMap` multiset is often the shorter answer under time pressure.** It sidesteps lazy deletion entirely at the cost of a constant factor — worth knowing as the pragmatic fallback.

#### Walkthrough — sliding window median, k = 3

`a = [1, 3, -1, -3, 5]`, `k = 3`. The heaps are shown as *lower half* | *upper half*; for an odd window the lower half carries the extra element, so the median is its top.

```
index    0    1    2    3    4
value    1    3   -1   -3    5        k = 3
```

| # | Window | Sorted | max-heap (low) | min-heap (high) | Median |
|---|---|---|---|---|---|
| 1 | `[1, 3, -1]` | `[-1, 1, 3]` | `{-1, 1}` top **1** | `{3}` | **1** |
| 2 | `[3, -1, -3]` | `[-3, -1, 3]` | `{-3, -1}` top **-1** | `{3}` | **-1** |
| 3 | `[-1, -3, 5]` | `[-3, -1, 5]` | `{-3, -1}` top **-1** | `{5}` | **-1** |

Medians `[1, -1, -1]`. Notice step 3: the outgoing element was `3`, which sat in the min-heap, and the incoming `5` replaced it there — but in a real implementation `3` is not removed immediately. It is marked dead and discarded when it next reaches a heap top, which is what lazy deletion buys you.

#### Key observations — what interviewers are listening for

- **Name the missing domination relation.** *Max has one, median does not* is the whole reason this sub-variant exists. It is a better answer than *medians are harder*.
- **Rebalancing is an invariant, not a cleanup step.** The size difference must be restored after **every** insertion and removal, or the median is read from the wrong side.
- **Lazy deletion is a heap workaround, not a window idea.** It exists because binary heaps lack arbitrary removal. Saying that distinguishes the data structure's limitation from the algorithm's.
- **Know the pragmatic alternative.** A `TreeMap` multiset trades a constant factor for much less code. Under interview time pressure that is often the better call, and saying so reads as judgement.
- **Both problems here are optional by design.** The table marks them `○`. Skipping them is a legitimate choice unless you are targeting a bar that asks for them.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Reaching for a deque because the window is a maximum-like query | the deque discards elements the median still depends on, and the answers are quietly wrong. | Ask whether a domination relation exists. If it does not, the deque is invalid. |
| Forgetting to rebalance after removal | the heaps drift out of size balance and the median is read from the wrong heap. | Rebalance after every insertion **and** every removal, as part of the same operation. |
| Eagerly removing an arbitrary element from a heap | `O(k)` per removal, which turns the whole solution quadratic. | Use lazy deletion: mark it dead, discard it when it reaches the top. |
| Computing an even-window median as `(lo + hi) / 2` | integer overflow on large values, and integer truncation on odd sums. | `lo + (hi - lo) / 2.0`. |

#### Key takeaway

- **Trigger:** the window aggregate is a median, k-th value, or rank query.
- **Why not a deque:** no domination relation exists — every element still affects the answer.
- **Structure:** two heaps split at the median with lazy deletion, or a `TreeMap` multiset.
- **Cost:** `O(n log k)`. If the constraints forbid the log factor, re-check that it is a window at all.
- **Gate:** shares the deque gate — see [§5.2](index.md#56-sliding-window). Both problems here are optional.


### K — ⚠ Anti-patterns: when the window is illegal

| # | Problem | Diff | Sub-variant | Why it's essential |
|---|---|---|---|---|
| ★74 | ⚠ **560. Subarray Sum Equals K** | Medium | K | With negatives, growing the window does not grow the sum → **no monotonicity → no window**. Correct tool: prefix sum + hash map. This problem is here to inoculate you against exactly that reflex. |
| ★75 | ⚠ **395. Longest Substring with At Least K Repeating Characters** | Medium | K | "At least" makes validity non-monotone: adding a char can *fix* an invalid window. Fix: iterate `d = 1..26`, run a normal window constrained to exactly `d` distinct chars. The general recovery move — **freeze a parameter to restore monotonicity** — is worth more than the problem. |

---

### Extra Reps — Sliding Window (only if a gate fails)

| Problem | Targets |
|---|---|
| 159. Longest Substring with At Most Two Distinct Characters 🔒 | Easier twin of #50. |
| 2461. Maximum Sum of Distinct Subarrays With Length K | A + E composition. |
| 1695. Maximum Erasure Value | Variant B with a sum aggregate. |
| 1208. Get Equal Substrings Within Budget | Variant B with a cost budget; near-identical to #51. |
| 2090. K Radius Subarray Averages | Fixed window with an index-offset output. |

---

## 2.3 Templates

### A — Fixed-size window

```java
// BOUNDARY RULES (memorize these two lines separately, they are NOT the same index):
//   evict  when r >= k       → the element leaving is a[r - k]
//   record when r >= k - 1   → the first full window ends at index k-1
long sum = 0, best = Long.MIN_VALUE;
for (int r = 0; r < n; r++) {
    sum += a[r];                       // add the entering element
    if (r >= k)     sum -= a[r - k];   // remove the leaving element
    if (r >= k - 1) best = Math.max(best, sum);
}
```

### B — Variable window, maximize length

```java
// INVARIANT (at the bottom of each iteration): [l, r] is VALID, and l is the smallest
//   left boundary for which that holds. Therefore r - l + 1 is the best window ending at r.
// BOUNDARY: shrink with `while`, not `if` — one insertion may require several evictions.
//           Record AFTER the shrink loop.
int l = 0, best = 0;
for (int r = 0; r < n; r++) {
    add(a[r]);
    while (!valid()) { remove(a[l]); l++; }
    best = Math.max(best, r - l + 1);
}
```

```java
// Concrete: 340 / 904 — at most K distinct.
Map<Character, Integer> f = new HashMap<>();
int l = 0, best = 0;
for (int r = 0; r < s.length(); r++) {
    f.merge(s.charAt(r), 1, Integer::sum);
    while (f.size() > k) {
        char c = s.charAt(l);
        if (f.merge(c, -1, Integer::sum) == 0) f.remove(c);   // REMOVE at zero.
        l++;                                                  // Leaving it makes size() lie.
    }
    best = Math.max(best, r - l + 1);
}
```

### C — Variable window, minimize length

```java
// INVARIANT: we shrink while the window STILL satisfies the requirement, so the last
//   recorded size is the smallest window ending at r.
// BOUNDARY: record BEFORE removing. Recording after the shrink records an invalid window.
int l = 0, best = Integer.MAX_VALUE;
for (int r = 0; r < n; r++) {
    add(a[r]);
    while (satisfied()) {
        best = Math.min(best, r - l + 1);   // ← record here
        remove(a[l]); l++;
    }
}
return best == Integer.MAX_VALUE ? 0 : best;
```

```java
// Concrete: 76. Minimum Window Substring — the have/need counter makes validity O(1).
int[] need = new int[128];
for (char c : t.toCharArray()) need[c]++;
int required = t.length();          // total characters still owed (multiplicity included)
int l = 0, bestLen = Integer.MAX_VALUE, bestL = 0;
for (int r = 0; r < s.length(); r++) {
    if (need[s.charAt(r)]-- > 0) required--;      // only a NEEDED char reduces the debt
    while (required == 0) {
        if (r - l + 1 < bestLen) { bestLen = r - l + 1; bestL = l; }
        if (need[s.charAt(l)]++ == 0) required++; // only removing a needed char re-owes it
        l++;
    }
}
return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestL, bestL + bestLen);
```


### D — Non-shrinking window

> **Intuition.** For a **longest**-window question the window never needs to get smaller. When it goes invalid, slide it right by one — same size — and let it grow only when it finds something genuinely better.

**Mental model.** *"The window's size **is** the best answer so far. If it is invalid I just shift it along; if it can grow, the answer improved. I never shrink, so I never have to restore anything."*

This is the sub-variant most people never learn, because LC 424 and 1004 can both be written with B's `while`-shrink and pass. The `if` version is not a trick for those two problems — **any** max-length window can be written this way.

Two consequences, both surprising the first time: the shrink is an `if`, not a `while`; and there is **no record inside the loop at all**. The answer is `n - l` at the end.

```
   invalid at r  ->  remove(a[l]); l++       size UNCHANGED, the window SLID right
   valid   at r  ->  window grew by one       the answer improved

   for r in 0..n-1:
       add(a[r])
       if (!valid) { remove(a[l]); l++ }      <- IF, not while
   return n - l                               <- no recording anywhere
```

*The window is a ratchet. It can grow, and it can slide, but it can never contract — so its final width is the largest width that was ever legal.*

**Recognition — reach for this when:**

- ✓ The answer is a **maximum length** — and nothing else about the window is needed.
- ✓ You would otherwise write sub-variant **B**. D is always available as the simpler form.
- ✓ Validity is shrink-monotone, exactly as B requires.
- ✗ But **not** for minimum-length questions, counts, or when you need the window's actual contents. The window is only guaranteed correct in its *width*.


```java
// INVARIANT: the window size never decreases. It equals the best answer found so far.
// WHY IT WORKS: we only care about MAX length. A window that becomes invalid slides
//   right by exactly one, preserving its size; if a longer valid window exists later,
//   the window will grow into it.
// BOUNDARY: `if`, not `while`. Do not record inside the loop — the answer is n - l.
int l = 0;
for (int r = 0; r < n; r++) {
    add(a[r]);
    if (!valid()) { remove(a[l]); l++; }
}
return n - l;
```

```java
// Concrete: 424. Longest Repeating Character Replacement
int[] f = new int[26];
int l = 0, maxF = 0;
for (int r = 0; r < s.length(); r++) {
    maxF = Math.max(maxF, ++f[s.charAt(r) - 'A']);   // NEVER decreased on shrink
    if (r - l + 1 - maxF > k) { f[s.charAt(l) - 'A']--; l++; }
}
return s.length() - l;
```


#### Why it works — why never shrinking still finds the maximum

The claim looks too good: the window can be invalid for long stretches, yet its final size is exactly right. Four steps show why.

1. **Only the maximum length matters.** We are not asked for the window, its contents, or where it sits — only how wide the best legal one was.
2. **An invalid window slides, preserving its size.** Adding one element and removing one element leaves the width unchanged. So the window never loses ground it has already won.
3. **It grows only into genuinely better territory.** The width increases exactly when a step keeps the window valid — which means a legal window of the new, larger size actually exists at that moment.
4. **Therefore the final width is the answer.** The window is a high-water mark. It never contracts, and it only expands on legal ground, so `n - l` at the end equals the maximum legal width.

> **Why a stale `maxF` is safe in LC 424 — reconstruct this, interviewers ask:** if `maxF` is stale it is an *overestimate* of the current window's best frequency, which makes `size - maxF` an *underestimate* of the replacement cost, which makes the window look *more* valid than it is. So the window can only fail to shrink — never shrink wrongly. And it cannot report a size larger than a genuinely achievable one, because the recorded size was achievable back when `maxF` was accurate.

**`maxF` is deliberately never decreased on a slide.** Recomputing it would cost `O(26)` per step and buy nothing, precisely because of the argument above. Leaving it stale is a decision, not an oversight — say so.

**There is no `best` variable.** Candidates often add one out of habit and then wonder why it always equals `n - l`. It does, by construction.

#### Walkthrough — LC 424 on "AABABBA" with k = 1

Longest repeating character replacement, one replacement allowed. From step 5 onward `maxF` is **stale** — and the answer is still exactly right.

```
index   0   1   2   3   4   5   6
char    A   A   B   A   B   B   A        k = 1
```

| # | r | char | maxF | width | cost = width - maxF | Action |
|---|---|---|---|---|---|---|
| 1 | 0 | A | 1 | 1 | 0 | valid, window grows |
| 2 | 1 | A | 2 | 2 | 0 | valid, window grows |
| 3 | 2 | B | 2 | 3 | 1 | valid (cost = k), grows |
| 4 | 3 | A | 3 | 4 | 1 | valid, grows — widest legal window seen |
| 5 | 4 | B | 3 | 5 | 2 > 1 | invalid → slide: drop `a[0]`, `l=1`. `maxF` stays **3**, now stale |
| 6 | 5 | B | 3 | 5 | 2 > 1 | still invalid → slide again, `l=2` |
| 7 | 6 | A | 3 | 5 | 2 > 1 | slide again, `l=3`. Return `7 - 3` = **4** |

Answer 4 — the window `AABA` found at step 4. From step 5 the window is never valid again, so it simply slides three times without changing width. `maxF` stayed at 3 the whole way, overstating the true best frequency, and the overstatement only ever made the window *slower* to slide, never wrong.

#### Key observations — what interviewers are listening for

- **The stale-`maxF` argument is the gate, not the code.** The gate says explicitly: explain why a stale `maxFreq` cannot produce a wrong answer. If you can only reproduce the code, you memorised it.
- **The error is one-directional, which is why it is safe.** Overestimating `maxF` underestimates cost, which makes the window *look* more valid. It can only delay a slide. A stale value that could make the window look *less* valid would be a bug.
- **D generalises past its two famous problems.** *Any* max-length window can be written non-shrinking. Most people learn it as a quirk of LC 424 and never transfer it.
- **No recording means no off-by-one.** The whole class of record-position bugs that plague B and C simply does not exist here, which is a real argument for the form.
- **The window's contents are meaningless at the end.** Only the width is guaranteed. If the problem wants the actual substring, use B.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Using `while` instead of `if` | still correct, but you have quietly rebuilt sub-variant B and lost the simplification. | `if` is the point. `while` is right for B and C; D is the deliberate exception. |
| Recording a `best` inside the loop | harmless but redundant — and it signals you have not understood why `n - l` works. | There is no record. The answer is the final width. |
| Recomputing `maxF` on every slide | `O(26n)` instead of `O(n)`, and it suggests the staleness argument was never made. | Leave it stale, on purpose, and be ready to justify it. |
| Using D for a minimum-length or counting question | nonsense output — the window is only meaningful as a high-water mark. | D answers *maximum width* and nothing else. |

#### Key takeaway

- **Trigger:** a maximum-length window where only the width is needed.
- **Rule:** `if (!valid) slide by one`. Never shrink, never record.
- **Answer:** `n - l` at the end — the window is a high-water mark.
- **The famous argument:** a stale `maxF` overestimates frequency, underestimates cost, and can only delay a slide — never cause a wrong one.
- **Gate:** D is yours when you can explain why a stale `maxFreq` in LC 424 cannot produce a wrong answer. See [§5.2](index.md#56-sliding-window).


### E — Frequency matching with a `matched` counter

> **Intuition.** Replace *do these two frequency maps agree?* with a single integer. `matched` counts how many distinct keys currently sit at **exactly** the right count — and the window is valid the instant that number equals how many keys you need.

**Mental model.** *"I never compare maps. I keep a score of how many keys are exactly satisfied right now. Adding or removing one character can only move that score by one, so I repair it in `O(1)`."*

Without the counter, every window position costs `O(26)` or `O(k)` to validate. With it, validity is a single equality test. That is the whole reason the sub-variant exists.

The bug surface is entirely in the transitions. There are **four**, not two: a key can move *into* exact and *out of* exact, and both can happen on an **add** and on a **remove**.

```
   matched = number of distinct keys whose window count EXACTLY equals the need
   valid  <=>  matched == distinctNeeded

   ADD a char c:
       win[c] becomes need[c]        ->  matched++     just became exact
       win[c] becomes need[c] + 1    ->  matched--     just OVERSHOT

   REMOVE a char d:
       win[d] was need[d]            ->  matched--     leaving exact
       win[d] was need[d] + 1        ->  matched++     dropping back INTO exact
```

*The two `need + 1` branches are where this template is normally written wrong. Overshooting must **un**-match a key, or a window holding too many of one character reads as valid.*

**Recognition — reach for this when:**

- ✓ You are matching a **multiset** — an anagram, a permutation, a required character count.
- ✓ The window is fixed-size (567, 438) or the requirement is exact rather than at-least.
- ✓ A naive check would re-scan the whole alphabet at every position.
- ✗ But **not** when the requirement is *at least* rather than *exactly*. That is a debt, and a `have`/`need` counter as in sub-variant **C** is the right tool.


```java
// INVARIANT: `matched` = number of distinct keys whose window count EXACTLY equals the need.
//   Window is valid iff matched == distinctNeeded.  O(1) validity check.
int[] need = new int[26], win = new int[26];
int distinct = 0;
for (char c : p.toCharArray()) { if (need[c-'a']++ == 0) distinct++; }

int matched = 0;
for (int r = 0; r < s.length(); r++) {
    int c = s.charAt(r) - 'a';
    win[c]++;
    if (win[c] == need[c]) matched++;
    else if (win[c] == need[c] + 1) matched--;   // we just OVERSHOT a satisfied key

    int l = r - p.length() + 1;
    if (l < 0) continue;
    if (matched == distinct) res.add(l);

    int d = s.charAt(l) - 'a';                    // evict for the next iteration
    if (win[d] == need[d]) matched--;
    else if (win[d] == need[d] + 1) matched++;    // dropping back from overshoot
    win[d]--;
}
```


#### Why it works — the four transitions, and why exactness matters

The counter is only correct if it tracks **exact** equality. Tracking *at least* silently accepts windows with too many of a character.

1. **The definition.** `matched` = the number of distinct keys whose window count is **exactly** the required count. Not at least — exactly.
2. **The validity test.** The window is valid iff `matched == distinctNeeded`. One integer comparison, `O(1)`, no scanning.
3. **Why exact and not at-least.** If overshooting left a key counted as matched, a window with three `a`s where two are needed would read as valid. So passing `need[c]` must **decrement** `matched` again.
4. **Four branches, not two.** Symmetry: on add, a key can cross *into* exact (`== need`) or *out of* exact (`== need + 1`). On remove, it can cross out of exact (was `== need`) or back into it (was `== need + 1`). All four must be handled.

> **Where this template is normally written incorrectly:** the two symmetric `need + 1` branches. Both transitions — *into* exact and *out of* exact — must be handled on **both** add and remove.

**LC 438 is LC 567 that keeps going.** Same machine; one returns on the first match, the other collects every start position. If 567 is solid, 438 is free.

**LC 30 moves to word granularity.** The window slides by whole words, so you run `wordLen` separate window phases — one per offset. The counter logic is unchanged; only the unit is.

**`matched` may legitimately go negative** while the window is full of irrelevant characters. That is fine — it is a signed score, not a count of successes, and it repairs itself as those characters are evicted.

#### Walkthrough — LC 567 — is a permutation of "ab" inside "eidba"?

`need = {a:1, b:1}`, `distinct = 2`, window size 2. Watch `matched` dip negative on irrelevant characters and recover as they are evicted.

```
index   0   1   2   3   4
char    e   i   d   b   a        pattern = "ab", window size 2
```

| # | r | in | Transition on add | matched | Evict | Verdict |
|---|---|---|---|---|---|---|
| 1 | 0 | e | `win[e]` hits `need[e]+1` = 1 → overshoot | -1 | window not full yet | -- |
| 2 | 1 | i | same overshoot | -2 | evict `e`: back off overshoot → `matched++` | -1 after evict |
| 3 | 2 | d | overshoot | -2 | evict `i`: `matched++` | -1 after evict |
| 4 | 3 | b | `win[b]` hits `need[b]` = 1 → **exact** | 0 | evict `d`: `matched++` | 1 after evict |
| 5 | 4 | a | `win[a]` hits `need[a]` = 1 → **exact** | 2 | -- | `matched == distinct` → **permutation found at index 3** |

Found at index 3, the substring `ba`. The negative excursion is not a bug: irrelevant characters overshoot their need of zero, and every one of them is undone by the matching evict branch. Drop either `need + 1` branch and the counter never returns to a truthful value.

#### Key observations — what interviewers are listening for

- **Count the branches out loud while writing.** The gate asks for **all four** transitions. Candidates who narrate *into-exact and out-of-exact, on add and on remove* essentially never miss one.
- **Exactness is what makes the counter sound.** An at-least counter is a different tool for a different job — see LC 76 in sub-variant C. Mixing the two produces code that passes anagram tests and fails on surplus characters.
- **This is sub-variant A plus a counter.** The fixed-window skeleton is unchanged; only the aggregate got cleverer. Saying that shows the family rather than the instance.
- **`O(1)` validity is the whole point.** If you find yourself comparing arrays inside the loop, you have written the naive version with extra steps.
- **Word-granular windows are the same idea rescaled.** LC 30's `wordLen` phases surprise people, but nothing about the counter changes — only what counts as one element.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Handling only the `== need` branches | windows with a surplus of one character are accepted as valid. | Both `need + 1` branches are required, on add **and** on remove. Four branches total. |
| Tracking *at least* instead of *exactly* | same failure, arrived at differently — overshoot never un-matches. | `matched` counts keys at **exact** equality. At-least logic belongs in C's `have`/`need` form. |
| Forgetting to evict before the next iteration | the window grows past its fixed size and every later verdict is meaningless. | In the fixed-size form, evict `s[r - len + 1]` at the bottom of each iteration. |
| Leaving stale zero entries when using a map | distinct-key counts drift and the validity test silently stops firing. | Remove keys at zero, or maintain an explicit `distinct` counter alongside the array. |

#### Key takeaway

- **Trigger:** matching a multiset — anagram, permutation, exact character requirement.
- **Rule:** keep `matched` = number of keys at **exactly** the needed count; valid iff `matched == distinctNeeded`.
- **Four transitions:** into-exact and out-of-exact, on **both** add and remove.
- **Cost:** `O(1)` validity, `O(n)` overall — versus `O(26n)` for the naive comparison.
- **Gate:** E is yours when you write the `matched` counter with all four transition branches. See [§5.2](index.md#56-sliding-window).


### F — Counting windows

Two formulas. Pick by asking which direction validity is monotone in.

```java
// (F1) Validity is SHRINK-monotone ("at most" style: product < k, at most K distinct).
//      After shrinking, every subarray ending at r and starting in [l, r] is valid.
count += r - l + 1;
```

```java
// (F2) Validity is GROW-monotone ("contains all of X" style).
//      Shrink while STILL valid; then every start in [0, l-1] also gives a valid subarray.
count += l;
```

```java
// Concrete F1: 713. Subarray Product Less Than K
if (k <= 1) return 0;                 // no positive product is < 1; guards the div loop
long prod = 1; int l = 0, count = 0;
for (int r = 0; r < a.length; r++) {
    prod *= a[r];
    while (prod >= k) { prod /= a[l]; l++; }   // safe: l <= r because a[r] < k is possible
    count += r - l + 1;
}
```

```java
// Concrete F2: 1358. Substrings containing all of a, b, c
int[] cnt = new int[3]; int l = 0, count = 0;
for (int r = 0; r < s.length(); r++) {
    cnt[s.charAt(r) - 'a']++;
    while (cnt[0] > 0 && cnt[1] > 0 && cnt[2] > 0) cnt[s.charAt(l++) - 'a']--;
    count += l;                        // l = number of valid start positions
}
```

### G — At-most-K → exactly-K

```java
// IDENTITY: exactly(K) = atMost(K) - atMost(K-1)
// PRECONDITION: atMost must be MONOTONE NON-DECREASING in K, and must count SUBARRAYS
//   (formula F1), not lengths. This does NOT work for "longest with exactly K".
int exactly(int[] a, int k) { return atMost(a, k) - atMost(a, k - 1); }

int atMost(int[] a, int k) {
    Map<Integer,Integer> f = new HashMap<>();
    int l = 0, count = 0;
    for (int r = 0; r < a.length; r++) {
        f.merge(a[r], 1, Integer::sum);
        while (f.size() > k) {
            if (f.merge(a[l], -1, Integer::sum) == 0) f.remove(a[l]);
            l++;
        }
        count += r - l + 1;
    }
    return count;
}
```


### H — Complement window

> **Intuition.** When the thing you want is split across both ends, flip the question and describe what you **leave behind**. What you leave behind is contiguous — and a contiguous thing is a window.

**Mental model.** *"Taking k cards from either end sounds like two windows at once. But whatever I do not take is one solid block in the middle. So I will minimise that block instead, and subtract."*

The inversion **is** the problem. Once you see it, the window itself is an ordinary sub-variant A (fixed size `n - k`) or B/C — nothing new to implement.

The mastery gate is explicitly about speed of recognition: look at LC 1423 and see *minimum window of size `n - k`* within thirty seconds.

```
   take k from the ENDS              leave a contiguous block of n - k
   [ x x |  . . . . .  | x ]    ->    [     |  window n-k  |     ]
    take     leave      take                 minimise this

   answer = total - minWindow

   LC 1658 is the same flip:
       "shortest prefix+suffix summing to x"
    =  "longest middle subarray summing to total - x"
```

*Two disjoint pieces at the ends are hard to slide. Their complement is a single block that slides trivially — so solve the complement and subtract.*

**Recognition — reach for this when:**

- ✓ The quantity you want is taken from **both ends**, or is a prefix plus a suffix.
- ✓ The leftover is contiguous, with a size or sum determined by the problem.
- ✓ You catch yourself trying to run two windows at once.
- ✗ But **not** when the pieces you take are non-contiguous in an unstructured way. The flip only helps when the complement is a single block.


```java
// 1423. Take k cards from either end, maximise total.
// REFRAME: you leave behind a CONTIGUOUS block of size n - k. Minimise it.
int n = a.length, keep = n - k;
int total = 0; for (int v : a) total += v;
if (keep == 0) return total;                    // taking everything
int win = 0, minWin = Integer.MAX_VALUE;
for (int r = 0; r < n; r++) {
    win += a[r];
    if (r >= keep) win -= a[r - keep];
    if (r >= keep - 1) minWin = Math.min(minWin, win);
}
return total - minWin;
```

```java
// 2134. Circular fixed window — index with % n, never physically double the array.
int ones = 0; for (int v : a) ones += v;
int cur = 0;
for (int i = 0; i < ones; i++) cur += a[i];
int best = cur;
for (int i = ones; i < n + ones; i++) {         // note: n + ones, to wrap fully
    cur += a[i % n] - a[(i - ones) % n];
    best = Math.max(best, cur);
}
return ones - best;                             // zeros inside the best window = swaps needed
```

#### Why it works — why the complement is the easy object

The reframing is a one-line argument, and once made, the implementation is a sub-variant you already own.

1. **What you take is two pieces.** A prefix of length `i` and a suffix of length `k - i`. Sliding those jointly is awkward — there is no single boundary to move.
2. **What you leave is one piece.** Everything not taken is the contiguous block between them, of size exactly `n - k`. One block, two boundaries that move together.
3. **The objective inverts cleanly.** The total of the array is fixed. Maximising what you take is therefore exactly minimising what you leave.
4. **So the answer is a subtraction.** `answer = total - minWindow`, where `minWindow` is a plain fixed window of size `n - k`.

> **The recognition that is the whole problem:** 'take k from either end' is 'minimise a fixed window of size `n - k` in the middle'. Seeing that inside thirty seconds is the gate.

**Guard `keep == 0`.** When `k == n` you take everything and there is no window at all; without the early return the loop records nothing and the answer comes back as a sentinel.

**LC 1658 flips a sum instead of a size.** *Shortest prefix + suffix summing to `x`* becomes *longest middle subarray summing to `total - x`* — and a longest-subarray-with-target-sum window is sub-variant B.

**Circular windows are a cousin, not the same thing.** Index with `% n` and loop from `k` to `n + k`. Never physically double the array — and if you do double it, remember to double the bounds too, which is the classic half-fix that misses every wrap-around window.

#### Walkthrough — LC 1423 — take 3 cards from the ends

`a = [1, 2, 3, 4, 5, 6, 1]`, `k = 3`, so `total = 22` and the block you leave has size `n - k = 4`. Just slide it.

```
index   0   1   2   3   4   5   6
value   1   2   3   4   5   6   1        total = 22, keep = 4
```

| # | Window of size 4 | Sum | min so far |
|---|---|---|---|
| 1 | `[1, 2, 3, 4]` | 10 | **10** |
| 2 | `[2, 3, 4, 5]` | 14 | 10 |
| 3 | `[3, 4, 5, 6]` | 18 | 10 |
| 4 | `[4, 5, 6, 1]` | 16 | 10 |

`answer = total - minWindow = 22 - 10 = 12` — take `1, 2` from the front and `1` from the back. Four window positions and one subtraction, versus enumerating every split of `k` between the two ends.

#### Key observations — what interviewers are listening for

- **The recognition is timed, and deliberately so.** The gate is *thirty seconds*, because in an interview the flip either arrives immediately or you spend the slot fighting two pointers that will not cooperate.
- **Say the invariant that licenses the flip.** *The total is fixed, so maximising what I take is minimising what I leave.* One sentence, and the rest is a fixed window.
- **The flip generalises past sizes to sums.** LC 1658 inverts a target sum rather than a length. Same move, different quantity — which is the sign you have the pattern and not the problem.
- **Circular indexing beats array doubling.** `% n` is less code and cannot desynchronise the bounds. Doubling the array while forgetting to double the loop bound is a specific, common bug.
- **Watch for the degenerate case in the problem statement.** `k == n` is legal in LC 1423 and it makes the window vanish. Handle it before the loop.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Trying to slide two windows at the ends | tangled index arithmetic and an off-by-one you cannot locate. | Flip to the complement. One block, two boundaries that move together. |
| Forgetting the `keep == 0` guard | the minimum is never recorded and a sentinel value escapes. | If `k == n` you take the whole array — return `total` before entering the loop. |
| Doubling the array without doubling the bounds | every wrap-around window is missed, and the answer is right on non-circular inputs. | Loop `i` from `k` to `n + k` and index with `% n`. Better still, do not double at all. |
| Applying the flip when the complement is not contiguous | the window is meaningless and the subtraction is arbitrary. | The flip is only valid when what you leave behind is a **single block**. |

#### Key takeaway

- **Trigger:** the quantity is taken from both ends, or is a prefix plus a suffix.
- **Rule:** solve for the **complement** — the contiguous block you leave — then subtract.
- **LC 1423:** `answer = total - minWindow`, window size `n - k`.
- **Circular:** index with `% n`, loop to `n + k`; do not physically double the array.
- **Gate:** H is yours when LC 1423 reads as *minimum window of size n-k* within thirty seconds. See [§5.2](index.md#56-sliding-window).


### I — Monotonic deque

> **Intuition.** A plain window cannot maintain a maximum, because when the current max leaves you have no idea what the next one is. A deque fixes that by keeping **only the elements that could still become the max**, in order.

**Mental model.** *"If a newer element is at least as large as an older one still in the window, that older one can never be the answer again — it is both older *and* smaller. Dead weight. Throw it out."*

That sentence is a **domination** argument, and it is what the whole structure rests on. What survives in the deque is a decreasing sequence, so the front is always the window's maximum.

Store **indices, not values**. You expire elements because they fall out of the window, and that is a fact about position — you cannot expire by value.

```
   dq holds INDICES; the values a[dq] are strictly decreasing front -> back
   front is therefore always the max of the current window

   ORDER OF OPERATIONS, and it matters:
       push    while a[dq.last] <= a[r]: pollLast     a[r] dominates them
               addLast(r)
       expire  if dq.first <= r - k: pollFirst        fell out of the window
       read    a[dq.first]                            once r >= k - 1
```

*Push, expire, read — in that order. Expiring by **index** is the reason the deque stores indices rather than values.*

**Recognition — reach for this when:**

- ✓ The window aggregate is a **max or a min**, and it must be maintained as the window moves.
- ✓ An older element can be made permanently irrelevant by a newer one — the domination test.
- ✓ Or: a subarray-sum problem with **negatives**, where the plain window has collapsed.
- ✗ But **not** for aggregates with no domination relation — medians, k-th values. Every element still matters there, which is sub-variant **J**.


```java
// 239. Sliding Window Maximum
// INVARIANT: dq holds INDICES; the values a[dq] are strictly decreasing front → back.
//   Front is always the max of the current window.
// ORDER OF OPERATIONS: push (popping smaller tails) → expire the front → read.
//   Expiring by index is why we store indices, not values.
Deque<Integer> dq = new ArrayDeque<>();
int[] out = new int[n - k + 1];
for (int r = 0; r < n; r++) {
    while (!dq.isEmpty() && a[dq.peekLast()] <= a[r]) dq.pollLast();  // a[r] dominates them
    dq.addLast(r);
    if (dq.peekFirst() <= r - k) dq.pollFirst();                      // front fell out of window
    if (r >= k - 1) out[r - k + 1] = a[dq.peekFirst()];
}
```

```java
// 862. Shortest Subarray with Sum at Least K — NEGATIVES ALLOWED.
// Why the plain window dies: with negatives, extending r can DECREASE the sum,
//   so "sum >= K" is not grow-monotone and there is nothing to shrink against.
// Fix: work on prefix sums P. We want the smallest i - j with P[i] - P[j] >= K.
// INVARIANT: dq holds indices with P strictly INCREASING.
//   - Pop from FRONT while the pair already qualifies: that j can never be beaten
//     by a later i (any later i gives a longer subarray).
//   - Pop from BACK while P[last] >= P[i]: index i is both later AND has a smaller
//     prefix, so `last` is dominated on both axes and is dead weight.
long[] P = new long[n + 1];
for (int i = 0; i < n; i++) P[i + 1] = P[i] + a[i];
Deque<Integer> dq = new ArrayDeque<>();
int best = n + 1;
for (int i = 0; i <= n; i++) {                 // NOTE: i <= n, prefix array has n+1 entries
    while (!dq.isEmpty() && P[i] - P[dq.peekFirst()] >= K) best = Math.min(best, i - dq.pollFirst());
    while (!dq.isEmpty() && P[dq.peekLast()] >= P[i])      dq.pollLast();
    dq.addLast(i);
}
return best == n + 1 ? -1 : best;
```

#### Why it works — domination, and why the front is the answer

One observation eliminates almost everything, and what is left is trivially ordered.

1. **The domination rule.** If `j < i` and `a[j] <= a[i]`, then `j` can never be the maximum of any window that contains `i` — `i` is both later and at least as large, so it survives every window `j` does.
2. **What survives.** Discarding every dominated index leaves a sequence whose values are strictly decreasing from front to back. Nothing else can be the max of anything.
3. **So the front is the max.** The front holds the largest surviving value, and by construction every survivor is still a live candidate.
4. **Expiry is positional.** The only other way an element stops mattering is by falling out of the window — a fact about its **index**. Hence indices in the deque, and `dq.first <= r - k` as the expiry test.

> **Order of operations, and why indices:** push (popping dominated tails) → expire the front by **index** → read. Expiring by index is the reason the deque stores indices, not values.

**LC 862 is why this sub-variant also owns the negatives case.** With negatives, extending `r` can *decrease* the sum, so `sum >= K` is not grow-monotone and there is nothing to shrink against — the plain window of LC 209 simply dies.

**The fix is a deque over prefix sums.** Work on `P`, wanting the smallest `i - j` with `P[i] - P[j] >= K`. The deque holds indices with `P` strictly **increasing**. Pop from the **front** while the pair already qualifies — that `j` can never be beaten by a later `i`, since any later `i` gives a longer subarray. Pop from the **back** while `P[last] >= P[i]` — index `i` is both later *and* has a smaller prefix, so `last` is dominated on both axes and is dead weight.

**Loop `i <= n`, not `i < n`.** The prefix array has `n + 1` entries, and stopping early misses the full-array answer.

**LC 1438 runs two deques**, one for the max and one for the min, inside a variable window. Both must expire against the **same** `l`, or they desynchronise and the window's spread is computed from two different windows.

**Verified reference values for 862:** `[2,-1,2], K=3` gives 3; `[1,2], K=4` gives -1; `[84,-37,32,40,95], K=167` gives 3.

#### Walkthrough — LC 239 — sliding window maximum, k = 3

`a = [1, 3, -1, -3, 5]`, `k = 3`. Watch step 5 evict the entire deque in one go — that is domination clearing out three dead candidates at once.

```
index    0    1    2    3    4
value    1    3   -1   -3    5        k = 3
```

| # | r | a[r] | Pops from back | Deque (indices) | Expire front? | Window max |
|---|---|---|---|---|---|---|
| 1 | 0 | 1 | none | `[0]` | no | window incomplete |
| 2 | 1 | 3 | pop 0 (`a[0]=1 <= 3`) | `[1]` | no | window incomplete |
| 3 | 2 | -1 | none (`3 > -1`) | `[1, 2]` | no | `a[1]` = **3** |
| 4 | 3 | -3 | none (`-1 > -3`) | `[1, 2, 3]` | no (`1 > 0`) | `a[1]` = **3** |
| 5 | 4 | 5 | pop 3, 2, 1 — all dominated by 5 | `[4]` | no | `a[4]` = **5** |

Output `[3, 3, 5]`. Step 5 is the domination argument paying off: indices 1, 2 and 3 were all older and smaller than the incoming 5, so all three became permanently irrelevant in a single sweep. Across the whole run each index is pushed once and popped once — which is why the total cost is `O(n)` even though one step popped three.

#### Key observations — what interviewers are listening for

- **Amortise the cost out loud.** Each index enters the deque once and leaves once, so the inner `while` does not make this quadratic. Interviewers do ask, and *`O(n)` amortised* with that one-line reason is the answer.
- **Indices, always — and say why.** You cannot expire by value, because you would not know *which* copy fell out of the window. That is the reason, and it is short.
- **The order of operations is part of the template.** Push, expire, read. Reading before expiring returns a max that has already left the window.
- **862 is the capstone of the whole pattern.** It is where the monotonicity test, prefix sums and the deque all have to be held at once — which is exactly why the gate names it and says to re-read the deque invariant on failure.
- **Two deques must share one left boundary.** In LC 1438 the max-deque and min-deque both expire against the same `l`. Expiring only one is a desynchronisation bug that produces plausible, wrong spreads.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Storing values instead of indices | you cannot tell when an element leaves the window, so expiry becomes impossible. | Always store indices; read the value as `a[dq.peekFirst()]`. |
| Using `<` instead of `<=` when popping the tail | duplicates linger in the deque — usually still correct for a plain max, and broken the moment you count maxima. | Use `<=` for a strictly decreasing deque, and make it a deliberate choice rather than a coin flip. |
| Expiring only one deque in the two-deque form | the max and min deques drift apart and describe different windows. | Both deques expire against the same `l`, every iteration. |
| Looping `i < n` in LC 862 | the full-array answer is missed. | The prefix array has `n + 1` entries — loop `i <= n`. |

#### Key takeaway

- **Trigger:** a max/min aggregate over a moving window, or a sum problem with negatives.
- **Rule:** keep a deque of **indices** whose values are strictly decreasing; the front is the max.
- **Order:** push (popping dominated tails) → expire by index → read.
- **Negatives:** prefix sums plus a deque, popping the front on qualification and the back on domination.
- **Gate:** I is yours when the template comes out blind with the right operation order, and you can say why 209's approach dies on negatives. See [§5.2](index.md#56-sliding-window).


### J — Ordered-multiset windows

### K — The recovery moves when the window is illegal

> **Intuition.** Before writing a window, **prove the predicate is monotone**. If it is not, no amount of pointer-fiddling will save it — and this sub-variant is the catalogue of what to reach for instead.

**Mental model.** *"Adding an element has to move the aggregate in one direction, always. If it can move either way, there is nothing to shrink against, and *shrink until valid* is not even a meaningful instruction."*

This sub-variant exists to teach you what failure looks like, which is why it is the only one in the pattern marked with a warning. Both of its problems are windows that a competent person writes by reflex and that are **wrong**.

Each failure has a named cause and a named fix. Learning the pairs is what turns *this feels off* into *this is not monotone, so it is a prefix-sum problem*.

```
   Does adding an element move the aggregate MONOTONICALLY?

       yes  ->  a window is legal

       no   ->  why not?
                negatives in a sum          ->  prefix sums + hash map      (560)
                "at least k of each"        ->  freeze a parameter,
                                                run 26 monotone windows     (395)
                need MIN length + negatives ->  monotonic deque on prefix
                                                sums                        (862, sub-variant I)
```

*Three failures, three different fixes. The diagnosis is always the same question, asked before any code is written.*

**Recognition — reach for this when:**

- ✓ You are about to write a window over a **sum with negatives**.
- ✓ The requirement says **at least** k of something, per distinct element.
- ✓ You cannot state which direction validity is monotone in — which is itself the answer.
- ✗ This is the sub-variant you hope **not** to need. Its value is recognising the situation before writing code, not after the tests fail.


```java
// 560. Subarray Sum Equals K, negatives allowed → prefix sums + hash map.
// INVARIANT: seen maps a prefix-sum value → how many indices produced it.
//   seed with (0 → 1) so that a prefix that itself equals k is counted.
Map<Long,Integer> seen = new HashMap<>();
seen.put(0L, 1);
long p = 0; int count = 0;
for (int v : a) {
    p += v;
    count += seen.getOrDefault(p - k, 0);
    seen.merge(p, 1, Integer::sum);
}
```

```java
// 395. Non-monotone validity → FREEZE A PARAMETER to restore monotonicity.
// For each fixed target number of distinct chars d, "at most d distinct" IS monotone,
// so a normal window works; inside it, require every present char to have count >= k.
int best = 0;
for (int d = 1; d <= 26; d++) {
    int[] f = new int[26];
    int l = 0, distinct = 0, atLeastK = 0;
    for (int r = 0; r < s.length(); r++) {
        if (f[s.charAt(r)-'a']++ == 0)     distinct++;
        if (f[s.charAt(r)-'a'] == k)       atLeastK++;
        while (distinct > d) {
            if (f[s.charAt(l)-'a']-- == k) atLeastK--;
            if (f[s.charAt(l)-'a'] == 0)   distinct--;
            l++;
        }
        if (distinct == d && atLeastK == d) best = Math.max(best, r - l + 1);
    }
}
```


#### Why it works — the two failures and their two fixes

Both problems look like textbook windows. Understanding precisely which monotonicity each one breaks is what makes the correct tool obvious.

1. **The contract a window requires.** Either **shrink-monotone** (valid implies every sub-window valid) or **grow-monotone** (satisfying implies every super-window satisfying). One of the two must hold.
2. **LC 560 breaks both.** With negatives allowed, growing `r` can *decrease* the sum. So `sum == k` is neither shrink- nor grow-monotone, and there is no shrink rule that could exist. The correct tool is a **prefix sum plus a hash map**, seeded with `(0 -> 1)` so that a prefix which itself equals `k` is counted.
3. **LC 395 breaks shrink-monotonicity specifically.** *At least k repeats* can be **repaired** by adding a character — a window that is invalid now may become valid as it grows. So shrinking on invalidity is exactly the wrong move.
4. **The 395 fix is to restore monotonicity by force.** **Freeze a parameter.** For each fixed target number of distinct characters `d` from 1 to 26, *at most `d` distinct* **is** monotone, so an ordinary window works; inside it, additionally require every present character to have count `>= k`. Twenty-six legal windows replace one illegal one.

> **The test to run before writing a single line:** does adding an element monotonically move the aggregate? If no, it is not a window — and the gate for this pattern is saying so **before** you write code, not after it fails.

**The `(0 -> 1)` seed in LC 560 is not decoration.** Without it, a prefix that itself equals `k` — a subarray starting at index 0 — is never counted, and the answer is short by exactly those cases.

**Freezing a parameter is a general escape hatch.** When a predicate is non-monotone in one variable, fixing that variable often restores monotonicity in the rest. The cost is a factor of however many values you must try — 26 here, which is a constant.

**LC 395 also has a divide-and-conquer solution**: split on any character occurring fewer than `k` times, since no valid substring can cross it. Worth knowing as the alternative.

**LC 862 is the third member of this family** but lives in sub-variant **I**, because its fix is a monotonic deque rather than a hash map or a frozen parameter.

#### Walkthrough — LC 560 — and why a window cannot do it

`a = [1, -1, 1, 2]`, `k = 2`. Look at step 2 first: the running sum **falls** as the window grows, which is the monotonicity failure in one line.

```
index    0    1    2    3
value    1   -1    1    2        k = 2

prefix   1    0    1    3        <- note it goes DOWN at index 1
```

| # | v | prefix p | look up `p - k` | count += | seen after |
|---|---|---|---|---|---|
| 1 | 1 | 1 | `seen[-1]` = 0 | 0 | `{0:1, 1:1}` |
| 2 | -1 | 0 | `seen[-2]` = 0 | 0 | `{0:2, 1:1}` — the prefix **decreased**; a window has nothing to shrink against |
| 3 | 1 | 1 | `seen[-1]` = 0 | 0 | `{0:2, 1:2}` |
| 4 | 2 | 3 | `seen[1]` = **2** | **2** | `{0:2, 1:2, 3:1}` |

Answer 2 — the subarrays `[-1, 1, 2]` and `[2]`. Step 4 found both at once: two earlier prefixes equalled 1, so two different start points produce a sum of 2 ending here. A window could never have found the first of those, because reaching it requires *shrinking past* a point where the sum went down.

#### Key observations — what interviewers are listening for

- **The gate here is about restraint, not technique.** *Given a new subarray problem with negatives, correctly say 'not a window' before writing code.* Failing that gate means you are pattern-matching on shape instead of monotonicity.
- **Name which monotonicity broke, not just that something did.** 560 breaks both directions; 395 breaks shrink-monotonicity only. The distinction points straight at the fix.
- **The seed value is a real correctness detail.** `(0 -> 1)` in the prefix map is the difference between counting subarrays that start at index 0 and silently dropping them.
- **Freezing a parameter is the transferable move.** It reappears well beyond windows: when something is not monotone in one dimension, fix that dimension and pay a constant factor.
- **These two problems are the highest-value items in the pattern.** They are the only ones that teach when **not** to reach for the window — which is the difference between someone who has done the problems and someone who can solve an unseen one.

#### Common mistakes

| ✗ Trap | Symptom | Prevention |
|---|---|---|
| Applying a window to a sum problem with negatives | wrong answers on mixed-sign input; every positive-only test passes. | Before writing: *does adding an element monotonically move the aggregate?* If no, prefix map or deque. |
| Omitting the `(0 -> 1)` seed in the prefix map | every subarray starting at index 0 is missed. | Seed `seen.put(0L, 1)` before the loop. |
| Shrinking on invalidity in LC 395 | the window discards a prefix that a later character would have repaired. | *At least k* is not shrink-monotone. Freeze the distinct count and run one monotone window per value of `d`. |
| Concluding *no window* and stopping there | a correct diagnosis with no answer attached. | Each failure has a named fix: hash map for 560, frozen parameter for 395, deque on prefix sums for 862. |

#### Key takeaway

- **Trigger:** you are about to write a window and cannot name the monotonicity.
- **The test:** does adding an element move the aggregate in one direction, always?
- **560:** negatives break both directions → prefix sums + hash map, seeded `(0 -> 1)`.
- **395:** *at least k* breaks shrink-monotonicity → freeze `d = 1..26` and run monotone windows.
- **Gate:** K is yours when you can say *not a window* **before** writing code, on an unseen problem. See [§5.2](index.md#56-sliding-window).

---

## 2.4 Failure Modes — Sliding Window

| # | Bug | Symptom | Prevention |
|---|---|---|---|
| 1 | `if` instead of `while` on a shrink-to-valid loop | Window stays invalid; wrong maxima | One addition can require many evictions. Use `while` for B and C; `if` **only** in the deliberate non-shrinking template D. |
| 2 | Recording after the shrink in a *minimize* problem | Records an invalid (too small) window | In C, record **inside** the `while`, before `remove`. |
| 3 | Recording before the shrink in a *maximize* problem | Records an invalid (too large) window | In B, record **after** the `while`. |
| 4 | Evict index `r - k + 1` instead of `r - k` | Off-by-one on every fixed window | The window is `[r-k+1, r]`; the element that just left is `r-k`. |
| 5 | Recording at `r >= k` instead of `r >= k - 1` | First window silently dropped | First complete window ends at index `k-1`. |
| 6 | Leaving zero-count keys in the frequency map | `map.size()` overcounts distinct → window never shrinks | `if (map.merge(c,-1,Integer::sum) == 0) map.remove(c);` |
| 7 | Using `size()` on an `int[26]` counter mentally | Same as #8, harder to see | Maintain an explicit `distinct` counter and decrement it at zero. |
| 8 | Storing values instead of indices in the deque | Cannot expire elements leaving the window | Always store indices; read the value as `a[dq.peekFirst()]`. |
| 9 | Deque `<` instead of `<=` when popping the tail | Duplicates linger; usually still correct for max, breaks for "count of maxima" | Use `<=` for a strictly decreasing deque. Be deliberate. |
| 10 | Only popping one deque during a two-deque shrink (1438) | Min and max deques desynchronize | Both deques must expire against the same `l`. |
| 11 | Looping to `i < n` in 862 | Misses the full-array answer | The prefix array has `n+1` entries; loop `i <= n`. |
| 12 | Applying a window to a sum problem with negatives | Wrong answers on mixed-sign input, passes the positive-only tests | Before writing: "does adding an element monotonically move the aggregate?" If no → prefix map or deque. |
| 13 | Using `atMost(K) − atMost(K−1)` for a *length* answer | Nonsense output | The identity is only valid for **counts of subarrays**. |
| 14 | Off-by-one in "must delete one element" (1493) | Answer one too large | The answer is `r − l`, not `r − l + 1`. |
| 15 | `k <= 1` not guarded in 713 | Division by the wrong element / infinite shrink | Early-return `0`. |
| 16 | Circular window doubling the array but not the bounds | Misses wrap-around windows | Loop `i` from `k` to `n + k`, index with `% n`. |
| 17 | Integer overflow in product/sum windows | Silent wrong answer | `long` for products and any sum over 10^5 elements of 10^4+. |

---
---

---

**Mastery gates for this pattern** live in the home document: [§5.2 Sliding Window](index.md#56-sliding-window) — together with the revisit rule for ★ problems.

