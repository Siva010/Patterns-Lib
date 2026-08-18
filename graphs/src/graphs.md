# Graphs, No Gaps

Traversal & Connectivity · Ordering, Partitions & Spanning Structure · Weighted Paths —
a complete, prerequisite-ordered path through 31 sub-variants, with Java 21 templates,
failure-mode tables, a recognition guide, and per-sub-variant mastery gates.

**Calibration:** written for an advanced backend engineer doing FAANG prep in **Java 21**,
LeetCode-numbered, and shaped as the third companion to *Three Patterns, No Gaps* and
*Trees, No Gaps*. The level bracket is left open, so the doc is tiered instead of guessed:
the **★ core path is the minimum sufficient set** (a strong beginner can follow it linearly),
**○ marks optional depth**, and the ○ problems double as the Extra Reps / transfer-test pool —
skip them if the starred problem in the same sub-variant went clean the first time.

**Total core: 64 problems** — 54 ★ plus 10 ⚠︎, out of 104 listed. This is the library
convention: ★ and ⚠︎ are both must-solve, and the bundle card in the library index reports
the ★ figure with ⚠︎ shown beside it, exactly as Bundles 01 and 02 do.
Everything else is explicitly labelled optional. Nothing here is padding; if a problem is
listed, there is exactly one thing it teaches that no earlier problem taught.

---

## How to read the tables

| Marker | Meaning |
| ------ | ------- |
| ★ | Core. Must solve unaided, from scratch, before advancing. |
| ○ | Optional. Solve only if the gate check for that sub-variant fails, or you want depth. |
| PRO | LeetCode Premium. Free substitute given where one exists. |
| ↻ | Re-solve of a problem already listed elsewhere, under a different machine. Not counted twice. |
| ⚠︎ | **Anti-pattern problem.** Included specifically because the obvious machine is *wrong*. These are the highest-value problems in the entire document. |

Problems within a sub-variant are in strict prerequisite order. Sub-variants themselves are
in prerequisite order.

Three conventions used throughout, because they remove more bugs than anything else:

- **Name the machine before you write code.** Every graph question is answered by exactly one
  of six machines: *traverse* (DFS/BFS), *order* (topological sort), *partition* (DSU),
  *span* (MST), *relax* (Dijkstra/Bellman-Ford/Floyd), or *search the answer* (binary search
  or an offline sweep). Saying which one out loud is most of the skill.
- **`visited` is set on push, not on pop.** Every wrong-answer-that-looks-right in BFS traces
  back to this line. Setting it on pop lets the same node enter the queue many times, which
  turns O(V+E) into something worse and can report a non-minimal distance.
- **The node is whatever uniquely determines the future.** If two situations differ in
  anything that affects what is reachable from them — remaining budget, keys held, parity of
  the step count — they are different nodes, and `visited` must be keyed by all of it.

---

## 1 — TRAVERSAL & CONNECTIVITY

*The machine: mark on push, visit once, never revisit. Everything in this pattern is O(V+E),
and the only design decisions are what a node is and what you carry.*

### 1.1 Sub-variant map

| | Sub-variant | The one idea |
| - | ----------- | ------------ |
| **A** | Flood fill on a grid | The graph is implicit — neighbours are computed, never stored |
| **B** | Boundary seeding / invert the question | Start from outside and keep what you *didn't* reach |
| **C** | Grid BFS — unweighted shortest path | Levels are distances; DFS cannot do this |
| **D** | Multi-source BFS | Every source sits in the queue at distance 0 before the first pop |
| **E** | Explicit graphs — building the adjacency list | The input format is the problem; the traversal is trivial |
| **F** | Cycle detection in undirected graphs | Skip the parent, not the whole visited set |
| **G** | Bipartite / 2-colouring | Colour on push; a conflict is a same-colour edge |
| **H** | Traversal that copies or keys by node | `visited` is a `Map`, and it is also the memo |
| **I** | Enumerating paths (backtracking) | The mark must be undone — and on a DAG there is no mark at all |
| **J** | State-space BFS | The node is a tuple; the graph is never materialised |
| **K** | Word-ladder family & bidirectional BFS | Build the neighbour buckets once; expand the smaller frontier |

### 1.2 Problems

#### 1.A — Flood fill on a grid
*Neighbours are computed, not stored. The four-direction loop and the in-bounds guard are one unit.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 1 | 733 | Flood Fill | Easy | ★ | The atom. The same-colour guard that prevents infinite recursion when `newColor == oldColor` |
| 2 | 200 | Number of Islands | Medium | ★ | Component counting. Sink-as-you-go vs. a separate `visited[][]` — know why sinking is legal here |
| 3 | 695 | Max Area of Island | Medium | ★ | The DFS returns a value instead of `void`; `1 + sum(children)` on a grid |
| 4 | 463 | Island Perimeter | Easy | ○ | Not a traversal at all — count edges facing water. Included because the instinct to DFS is wrong |
| 5 | 1254 | Number of Closed Islands | Medium | ○ | The border test folded into the recursive return |
| 6 | 827 | Making A Large Island | Hard | ★⚠︎ | Re-flooding from every `0` is O((mn)²). Label each island once with an id → size map, then sum distinct neighbour ids |

#### 1.B — Boundary seeding / invert the question
*You cannot mark "enclosed" directly. Mark "escapes", then take the complement.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 7 | 130 | Surrounded Regions | Medium | ★ | Seed from the border, mark survivors, then flip in a second pass |
| 8 | 1020 | Number of Enclaves | Medium | ★ | Same machine, count instead of flip — the pairing makes the abstraction visible |
| 9 | 417 | Pacific Atlantic Water Flow | Medium | ★ | Two *reverse* traversals (uphill from each ocean), then intersect. Forward-from-every-cell is O((mn)²) |
| 10 | 1905 | Count Sub Islands | Medium | ○ | Two grids in lockstep; the disqualifying cell must not short-circuit the traversal |

#### 1.C — Grid BFS, unweighted shortest path
*A BFS level is a distance. DFS finds a path; only BFS finds the shortest one.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 11 | 1091 | Shortest Path in Binary Matrix | Medium | ★ | Eight directions, and the level-size snapshot. Mark on push — the canonical demonstration |
| 12 | 1926 | Nearest Exit from Entrance in Maze | Medium | ★ | The entrance is not an exit; the boundary predicate is the whole difficulty |
| 13 | 909 | Snakes and Ladders | Medium | ○ | Index ↔ boustrophedon coordinate mapping is the entire problem; the BFS is four lines |
| 14 | 490 | The Maze | Medium | ○ PRO | The edge is a *roll to the wall*, not a step. Free substitute: 1926 with a modified neighbour function |

#### 1.D — Multi-source BFS
*Put every source in the queue before the first pop and the levels come out right for free.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 15 | 994 | Rotting Oranges | Medium | ★ | The atom. Count remaining fresh to distinguish "unreachable" from "done" |
| 16 | 542 | 01 Matrix | Medium | ★ | Distance-to-nearest, not reachability. Know the two-pass DP alternative and why BFS is the safer default |
| 17 | 1162 | As Far from Land as Possible | Medium | ★ | The answer is the *last* level reached, not a per-cell value |
| 18 | 934 | Shortest Bridge | Medium | ★ | Two machines composed: DFS to identify one component, then multi-source BFS from all of it |
| 19 | 286 | Walls and Gates | Medium | ○ PRO | Multi-source in its purest form. Free substitute: 542 |

#### 1.E — Explicit graphs, building the adjacency list
*The traversal is trivial. Converting `int[][] edges` or an `n × n` matrix into `List<Integer>[]` is the skill.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 20 | 547 | Number of Provinces | Medium | ★ | Adjacency *matrix* input; component counting without ever building a list |
| 21 | 841 | Keys and Rooms | Medium | ★ | Reachability from a fixed source — the answer is "did visited fill up" |
| 22 | 1466 | Reorder Routes to Make All Paths Lead to the City Zero | Medium | ★ | Store both directions with a sign, traverse ignoring direction, count the wrong-way edges. The single most reusable trick in this sub-variant |
| 23 | 1971 | Find if Path Exists in Graph | Easy | ○ | The bare minimum; useful as a template check |
| 24 | 323 | Number of Connected Components in an Undirected Graph | Medium | ○ PRO | Free substitute: 547 or 2316 |
| 25 | 2316 | Count Unreachable Pairs of Nodes in an Undirected Graph | Medium | ○ | Component *sizes*, and the running-sum trick that avoids O(k²) over components |

#### 1.F — Cycle detection in undirected graphs
*Skip the parent edge, not the parent node. And a cycle-free graph is a forest, not necessarily a tree.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 26 | 684 | Redundant Connection | Medium | ★ | The first edge whose endpoints already share a component. The DSU version is the point; the DFS version is the check |
| 27 | 261 | Graph Valid Tree | Medium | ★⚠︎ PRO | "No cycle" is only half the answer — a forest is acyclic. Needs `edges == n − 1` **and** exactly one component. Free substitute: 2685, or 1319 with `n − 1` asserted by hand |

#### 1.G — Bipartite / 2-colouring
*A conflict is an edge between two nodes of the same colour. Iterate over all components — the graph may be disconnected.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 28 | 785 | Is Graph Bipartite? | Medium | ★ | Colour on push. The outer loop over unvisited nodes is not optional |
| 29 | 886 | Possible Bipartition | Medium | ★ | Identical machine on a graph you build yourself — the recognition step is the whole exercise |

#### 1.H — Traversal that copies or keys by node
*`visited` stops being a boolean array and becomes a map — and the map is simultaneously the memo and the output.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 30 | 133 | Clone Graph | Medium | ★ | `Map<Node, Node>`: put the clone in the map *before* recursing on neighbours, or a cycle recurses forever |

#### 1.I — Enumerating paths (backtracking on a graph)
*Shortest path uses a permanent mark. Enumerating paths must undo it. On a DAG there is no mark at all.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 31 | 797 | All Paths From Source to Target | Medium | ★⚠︎ | The input is a DAG, so a `visited` set is not merely unnecessary — it is *wrong*, silently dropping every path through an already-seen node |
| 32 | 79 | Word Search | Medium | ★ | Mark, recurse, unmark — exactly one unmark per mark. In-place marking beats a `boolean[][]` |
| 33 | 212 | Word Search II | Hard | ○ | Trie-pruned backtracking; pruning dead trie branches is what makes it pass, not the trie itself |
| 34 | 980 | Unique Paths III | Hard | ○ | The "must cover every empty cell" counter carried down and restored |

#### 1.J — State-space BFS
*The node is a tuple. Nothing is materialised; you write `neighbours(state)` and let BFS do the rest.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 35 | 752 | Open the Lock | Medium | ★ | The node is a 4-digit string. Deadends go into `visited` before the search starts |
| 36 | 1293 | Shortest Path in a Grid with Obstacles Elimination | Hard | ★ | The node is `(r, c, k)`. `visited[r][c]` alone gives a wrong answer, not just a slow one |
| 37 | 864 | Shortest Path to Get All Keys | Hard | ★ | The node is `(r, c, keyMask)`. Bitmask in the state — the ceiling of this sub-variant |
| 38 | 847 | Shortest Path Visiting All Nodes | Hard | ○ | `(node, mask)` with *n* simultaneous sources; revisiting nodes is allowed and required |
| 39 | 773 | Sliding Puzzle | Hard | ○ | The whole board serialised to a string is the node; the neighbour table is precomputed |
| 40 | 1345 | Jump Game IV | Hard | ○ | Clear the value → indices bucket after using it once, or the same bucket is scanned O(n) times |

#### 1.K — Word-ladder family & bidirectional BFS
*Building the neighbour relation costs more than the search. Then expand whichever frontier is smaller.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 41 | 127 | Word Ladder | Hard | ★ | Wildcard pattern buckets (`h*t`) beat pairwise comparison. Then the two-ended search and its termination condition |
| 42 | 433 | Minimum Genetic Mutation | Medium | ○ | Same shape, smaller alphabet — the transfer test for 127 |
| 43 | 126 | Word Ladder II | Hard | ○ | BFS to build the layer graph, DFS to reconstruct. Two machines, and the parents map between them |
| 44 | 815 | Bus Routes | Hard | ○ | The *route* is the node, not the stop. Model-choice is the entire problem |

### 1.3 Templates

```java
// A/B — grid DFS. Sink as you go; the visited array is the grid itself.
static final int[][] DIRS = {{1,0},{-1,0},{0,1},{0,-1}};

int dfs(char[][] g, int r, int c) {
    if (r < 0 || r >= g.length || c < 0 || c >= g[0].length || g[r][c] != '1') return 0;
    g[r][c] = '0';                       // mark BEFORE recursing
    int size = 1;
    for (int[] d : DIRS) size += dfs(g, r + d[0], c + d[1]);
    return size;
}
```

```java
// C — grid BFS. Distance is the level index. Mark on push.
int bfs(int[][] g, int sr, int sc, int tr, int tc) {
    int m = g.length, n = g[0].length;
    boolean[][] seen = new boolean[m][n];
    Deque<int[]> q = new ArrayDeque<>();
    q.add(new int[]{sr, sc});
    seen[sr][sc] = true;                 // on push, not on pop
    for (int dist = 0; !q.isEmpty(); dist++) {
        for (int sz = q.size(); sz > 0; sz--) {
            int[] cur = q.poll();
            if (cur[0] == tr && cur[1] == tc) return dist;
            for (int[] d : DIRS) {
                int nr = cur[0] + d[0], nc = cur[1] + d[1];
                if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                if (seen[nr][nc] || g[nr][nc] == 1) continue;
                seen[nr][nc] = true;
                q.add(new int[]{nr, nc});
            }
        }
    }
    return -1;
}
```

```java
// D — multi-source BFS. Every source is seeded before the first pop.
Deque<int[]> q = new ArrayDeque<>();
for (int r = 0; r < m; r++)
    for (int c = 0; c < n; c++)
        if (isSource(g[r][c])) { q.add(new int[]{r, c}); seen[r][c] = true; }
// ...then the identical level loop as above.
```

```java
// E — adjacency list from an edge list. Undirected adds both directions.
List<Integer>[] build(int n, int[][] edges, boolean directed) {
    List<Integer>[] adj = new List[n];
    for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
    for (int[] e : edges) {
        adj[e[0]].add(e[1]);
        if (!directed) adj[e[1]].add(e[0]);
    }
    return adj;
}
```

```java
// F — undirected cycle detection. Skip the parent, not the visited set.
boolean hasCycle(List<Integer>[] adj, int u, int parent, boolean[] seen) {
    seen[u] = true;
    for (int v : adj[u]) {
        if (v == parent) continue;                     // the one exception
        if (seen[v]) return true;
        if (hasCycle(adj, v, u, seen)) return true;
    }
    return false;
}
// A graph is a TREE iff edges == n - 1 AND one DFS from node 0 marks every node.
```

```java
// G — bipartite check. 0 = unvisited, 1 / -1 = the two colours.
boolean isBipartite(List<Integer>[] adj, int n) {
    int[] color = new int[n];
    for (int s = 0; s < n; s++) {
        if (color[s] != 0) continue;                   // disconnected components
        Deque<Integer> q = new ArrayDeque<>(List.of(s));
        color[s] = 1;
        while (!q.isEmpty()) {
            int u = q.poll();
            for (int v : adj[u]) {
                if (color[v] == color[u]) return false;
                if (color[v] == 0) { color[v] = -color[u]; q.add(v); }
            }
        }
    }
    return true;
}
```

```java
// J — state-space BFS. Only the encode/decode changes between problems.
int bfs(String start, String target, Set<String> blocked) {
    if (blocked.contains(start)) return -1;
    Set<String> seen = new HashSet<>(List.of(start));
    Deque<String> q = new ArrayDeque<>(List.of(start));
    for (int dist = 0; !q.isEmpty(); dist++) {
        for (int sz = q.size(); sz > 0; sz--) {
            String cur = q.poll();
            if (cur.equals(target)) return dist;
            for (String nxt : neighbours(cur)) {
                if (seen.contains(nxt) || blocked.contains(nxt)) continue;
                seen.add(nxt);
                q.add(nxt);
            }
        }
    }
    return -1;
}
```

### 1.4 Failure modes

| # | Failure | Symptom | Fix |
| - | ------- | ------- | --- |
| 1.1 | `visited` marked on pop | TLE, or a distance larger than the true minimum | Mark on push, in the same statement that enqueues |
| 1.2 | Bounds checked after indexing | `ArrayIndexOutOfBounds` on row 0 | Order the guard: bounds first, then contents |
| 1.3 | Recursive DFS on a 1000×1000 grid | `StackOverflowError` on a snake-shaped input | Convert to an explicit stack, or use BFS |
| 1.4 | Forward traversal where reverse was intended | O((mn)²), TLE on 417 / 827 | Ask "who can reach me" instead of "who can I reach" |
| 1.5 | Missing outer loop over components | Correct on connected tests, wrong on the hidden disconnected one | Loop `for s in 0..n-1: if not seen[s]` in every component-level algorithm |
| 1.6 | Undirected edge added once | Half the graph is unreachable | Add both directions at build time, once, in one place |
| 1.7 | Parent skipped by *node* rather than by *edge* | False negative on a multigraph (two edges between the same pair) | Track the edge index, not the parent id, when duplicates are possible |
| 1.8 | `visited` keyed by position when the state carries a budget | Wrong answer, not just slow (1293, 864) | Key by the full tuple; size the array `[m][n][k+1]` |
| 1.9 | Backtracking without an unmark | Only the first path is found | Exactly one unmark per mark, on the line after the recursive call |
| 1.10 | Clone put in the map after recursing | Infinite recursion on a cycle (133) | Insert the shell into the map before touching neighbours |
| 1.11 | DFS used for an unweighted shortest path | A path is returned, but not the shortest | BFS. There is no DFS fix |

---

## 2 — ORDERING, PARTITIONS & SPANNING STRUCTURE

*The machine: impose a linear order on a DAG, or maintain a partition under merges. Both are
about structure over the whole graph rather than a walk through it.*

### 2.1 Sub-variant map

| | Sub-variant | The one idea |
| - | ----------- | ------------ |
| **A** | Directed cycle detection — three colours | `visited` is not enough; "in progress" and "finished" are different facts |
| **B** | Kahn's algorithm | Indegree-zero queue; a short output *is* the cycle report |
| **C** | Topological sort as a modelling exercise | The edges are not given — deriving them is the problem |
| **D** | DP over a DAG | Acyclic ⇒ memoise, no `visited` |
| **E** | Union-Find — the structure itself | Union by size + path compression, or it is not O(α) |
| **F** | Union-Find for counting and grouping | The answer is usually `n − components` or `edges − (n − components)` |
| **G** | Union-Find over time / with extra state | Merges arrive in an order you choose or are given |
| **H** | Minimum spanning tree | Cheapest connection, not shortest path |
| **I** | Bridges & articulation points | One DFS with low-links replaces E connectivity checks |
| **J** | Functional graphs (out-degree exactly 1) | Every component is a rho; label by visit time |
| **K** | Eulerian path | Every *edge* once. Append on the way out, then reverse |

### 2.2 Problems

#### 2.A — Directed cycle detection, three colours
*White = untouched, grey = on the current stack, black = fully explored. Grey-to-grey is a cycle; grey-to-black is not.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 45 | 207 | Course Schedule | Medium | ★ | The atom. Both the 3-colour DFS and the Kahn answer; write both |
| 46 | 802 | Find Eventual Safe States | Medium | ★⚠︎ | A single `visited` set conflates "currently on the stack" with "proved safe", and reports unsafe nodes as safe. 3-colour, or Kahn on the *reversed* graph |

#### 2.B — Kahn's algorithm
*Indegree-zero queue. If the emitted order is shorter than n, the remainder is a cycle — you get detection for free.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 47 | 210 | Course Schedule II | Medium | ★ | The template. Decrement on pop, enqueue at zero, compare `order.size()` to `n` |
| 48 | 2050 | Parallel Courses III | Hard | ★ | Critical path: `finish[v] = max(finish[u]) + time[v]` accumulated along the topological order |
| 49 | 1136 | Parallel Courses | Medium | ○ PRO | The level count *is* the answer. Free substitute: 2050 with all durations set to 1 |

#### 2.C — Topological sort as a modelling exercise
*The traversal is 15 lines. Deriving the edge set from prose is the entire difficulty.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 50 | 2115 | Find All Possible Recipes from Given Supplies | Medium | ★ | Nodes of two kinds (recipes and supplies) in one graph; indegree counted only over missing ingredients |
| 51 | 269 | Alien Dictionary | Hard | ★⚠︎ PRO | Only the **first differing character** of *adjacent* words is an edge — every other char pair is noise. And `["abc","ab"]` is invalid input, not an empty edge set. Free substitute: 2392 for the same "derive edges from constraints" step |
| 52 | 310 | Minimum Height Trees | Medium | ★ | Topological *peeling* on an undirected tree: repeatedly strip degree-1 nodes. The answer is the last 1 or 2 standing. Not a real topological sort — know why it still terminates |
| 53 | 444 | Sequence Reconstruction | Medium | ○ PRO | The order is unique iff the queue never holds more than one node |
| 54 | 851 | Loud and Rich | Medium | ○ | Memoised DFS over the "richer than" DAG — the bridge to 2.D |
| 55 | 1203 | Sort Items by Groups Respecting Dependencies | Hard | ○ | Two nested topological sorts, groups then items. Ungrouped items each need their own synthetic group |
| 56 | 2392 | Build a Matrix With Conditions | Hard | ○ | Two independent topological sorts producing two coordinate axes |

#### 2.D — DP over a DAG (memoised DFS)
*If the graph is acyclic, memoisation is legal and a `visited` set is a bug.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 57 | 329 | Longest Increasing Path in a Matrix | Hard | ★⚠︎ | The grid *looks* like it needs `visited`. Strict increase makes it a DAG, so paths can safely reuse cells across branches — `visited` would prune correct answers. Memo, not mark |
| 58 | 1857 | Largest Color Value in a Directed Graph | Hard | ★ | 26 counters carried along the topological order; the cycle check and the DP are the same pass |

#### 2.E — Union-Find, the structure itself
*Union by size and path compression are not optimisations, they are the definition. Without both it is O(n) per find.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 59 | 990 | Satisfiability of Equality Equations | Medium | ★ | Process every `==` first, then check every `!=`. The ordering *is* the algorithm |
| 60 | 2685 | Count the Number of Complete Components | Medium | ★ | Per-component node count and edge count together — the arithmetic that 261 needed |
| — | 547 | Number of Provinces | Medium | ↻ | Re-solve #20 with DSU. The calibration problem: if the DSU version is longer than 20 lines, the template is wrong |

#### 2.F — Union-Find for counting and grouping
*Nearly every answer here is `n − components` or `spareEdges` vs `components − 1`.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 61 | 721 | Accounts Merge | Medium | ★ | Union on a key that is not an index (email → id map). The most common real-world shape |
| 62 | 947 | Most Stones Removed with Same Row or Column | Medium | ★ | Union rows to columns, not stones to stones. Answer is `n − components` |
| 63 | 1319 | Number of Operations to Make Network Connected | Medium | ★ | Spare edges vs `components − 1`. The feasibility check before the count |
| 64 | 2492 | Minimum Score of a Path Between Two Cities | Medium | ★ | The path is irrelevant — anything in the component is reachable. Recognising that is the problem |
| 65 | 1202 | Smallest String With Swaps | Medium | ○ | Sort within each component; indices and characters gathered separately |
| 66 | 839 | Similar String Groups | Hard | ○ | O(n²·len) pairwise unions — when the quadratic build is the intended solution |
| 67 | 128 | Longest Consecutive Sequence | Medium | ○ | Solvable with DSU, but the hash-set scan is O(n) and simpler. Included so you know when *not* to reach for DSU |
| — | 684 | Redundant Connection | Medium | ↻ | Re-solve #26 with DSU and compare to the DFS version |

#### 2.G — Union-Find over time / with extra state
*Merges arrive in an order — sometimes given, sometimes chosen by you.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 68 | 305 | Number of Islands II | Hard | ★ PRO | Incremental components: activate a cell, then union with up to four already-active neighbours. Free substitute: 2092, or 827 for the label-once idea |
| 69 | 1101 | The Earliest Moment When Everyone Become Friends | Medium | ○ PRO | Sort by timestamp, union, stop when the count hits 1. Free substitute: 1697 |
| 70 | 959 | Regions Cut By Slashes | Medium | ○ | Split each cell into four triangles — the modelling trick, not the DSU |
| 71 | 685 | Redundant Connection II | Hard | ○ | Directed: two distinct failure modes (indegree 2, and a cycle) that can co-occur. Pure case analysis |
| 72 | 2092 | Find All People With Secret | Hard | ○ | Union *and un-union* within a timestamp group — DSU with a rollback |

#### 2.H — Minimum spanning tree
*Cheapest way to connect everything. Not shortest path; the MST path between two nodes is often not the shortest.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 73 | 1584 | Min Cost to Connect All Points | Medium | ★ | Kruskal on the complete graph (n² edges sorted) vs. Prim in O(n²) with no heap. On a dense graph Prim wins — know which you wrote and why |
| 74 | 1135 | Connecting Cities With Minimum Cost | Medium | ○ PRO | Sparse Kruskal, plus the infeasibility check. Free substitute: 1584 |
| 75 | 1489 | Find Critical and Pseudo-Critical Edges in MST | Hard | ○ | Run MST forcing an edge out, then in. The definition of critical/pseudo-critical made executable |

#### 2.I — Bridges & articulation points
*One DFS with discovery times and low-links. Brute-force removal is E times slower and never necessary.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 76 | 1192 | Critical Connections in a Network | Hard | ★⚠︎ | Remove-each-edge-and-recheck is O(E·(V+E)). Tarjan: `low[v] > disc[u]` means the edge `u–v` is a bridge, in one O(V+E) pass |

#### 2.J — Functional graphs (out-degree exactly 1)
*Every component is a tail leading into exactly one cycle. Generic cycle detection is the wrong tool.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 77 | 2360 | Longest Cycle in a Graph | Hard | ★ | Label each node with the step index at which this walk reached it; a repeat within the *current* walk gives the cycle length in O(1) |
| 78 | 2359 | Find Closest Node to Given Two Nodes | Medium | ★ | Two walks, one distance array each, then minimise `max(d1, d2)` |
| 79 | 457 | Circular Array Loop | Medium | ○ | Floyd on a functional graph, plus direction consistency and the length-1 exclusion |
| 80 | 565 | Array Nesting | Medium | ○ | The components partition the array, so a global `visited` makes it a single O(n) pass |

#### 2.K — Eulerian path
*Every edge exactly once. The greedy that works for vertices does not work for edges.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 81 | 332 | Reconstruct Itinerary | Hard | ★⚠︎ | Lexicographic greedy DFS *strands* you: the smallest next airport can consume the only exit. Hierholzer — append the node when it has no edges left, then reverse |
| 82 | 753 | Cracking the Safe | Hard | ○ | de Bruijn sequence as an Eulerian circuit on the (n−1)-prefix graph |

### 2.3 Templates

```java
// A — three-colour directed cycle detection.
static final int WHITE = 0, GREY = 1, BLACK = 2;

boolean hasCycle(List<Integer>[] adj, int u, int[] color) {
    color[u] = GREY;
    for (int v : adj[u]) {
        if (color[v] == GREY) return true;                     // back edge
        if (color[v] == WHITE && hasCycle(adj, v, color)) return true;
    }
    color[u] = BLACK;                                          // finished, and safe
    return false;
}
```

```java
// B — Kahn. A short order is a cycle report; no separate detection needed.
int[] topo(int n, List<Integer>[] adj) {
    int[] indeg = new int[n];
    for (int u = 0; u < n; u++) for (int v : adj[u]) indeg[v]++;
    Deque<Integer> q = new ArrayDeque<>();
    for (int u = 0; u < n; u++) if (indeg[u] == 0) q.add(u);
    int[] order = new int[n];
    int k = 0;
    while (!q.isEmpty()) {
        int u = q.poll();
        order[k++] = u;
        for (int v : adj[u]) if (--indeg[v] == 0) q.add(v);
    }
    return k == n ? order : new int[0];                        // empty ⇒ cycle
}
```

```java
// E — DSU. Union by size + path compression. Both, or it is not near-constant.
final class DSU {
    private final int[] parent, size;
    int components;

    DSU(int n) {
        parent = new int[n];
        size = new int[n];
        components = n;
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }
    }

    int find(int x) {
        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
    }

    boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;                            // already together
        if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        size[ra] += size[rb];
        components--;
        return true;
    }

    int sizeOf(int x) { return size[find(x)]; }
}
```

```java
// H — Kruskal. Sort, union, stop at n-1 accepted edges.
long kruskal(int n, int[][] edges) {          // edges[i] = {u, v, w}
    Arrays.sort(edges, Comparator.comparingInt(e -> e[2]));
    DSU dsu = new DSU(n);
    long total = 0;
    int used = 0;
    for (int[] e : edges) {
        if (dsu.union(e[0], e[1])) { total += e[2]; if (++used == n - 1) break; }
    }
    return used == n - 1 ? total : -1;                         // -1 ⇒ disconnected
}

// H — Prim, O(n^2), no heap. Correct choice when the graph is complete.
long prim(int[][] pts) {
    int n = pts.length;
    int[] best = new int[n];
    boolean[] in = new boolean[n];
    Arrays.fill(best, Integer.MAX_VALUE);
    best[0] = 0;
    long total = 0;
    for (int it = 0; it < n; it++) {
        int u = -1;
        for (int v = 0; v < n; v++) if (!in[v] && (u == -1 || best[v] < best[u])) u = v;
        in[u] = true;
        total += best[u];
        for (int v = 0; v < n; v++)
            if (!in[v]) best[v] = Math.min(best[v], cost(pts, u, v));
    }
    return total;
}
```

```java
// I — Tarjan bridges. disc = discovery time, low = highest ancestor reachable.
int timer = 0;

void bridges(int u, int parent, List<Integer>[] adj,
             int[] disc, int[] low, List<List<Integer>> out) {
    disc[u] = low[u] = ++timer;
    for (int v : adj[u]) {
        if (v == parent) continue;
        if (disc[v] == 0) {
            bridges(v, u, adj, disc, low, out);
            low[u] = Math.min(low[u], low[v]);
            if (low[v] > disc[u]) out.add(List.of(u, v));      // nothing below v climbs past u
        } else {
            low[u] = Math.min(low[u], disc[v]);                // disc[v], not low[v]
        }
    }
}
```

```java
// K — Hierholzer. Append on the way OUT, then reverse.
void euler(String u, Map<String, PriorityQueue<String>> adj, LinkedList<String> route) {
    PriorityQueue<String> next = adj.get(u);
    while (next != null && !next.isEmpty()) euler(next.poll(), adj, route);
    route.addFirst(u);                                          // post-order insert
}
```

### 2.4 Failure modes

| # | Failure | Symptom | Fix |
| - | ------- | ------- | --- |
| 2.1 | `visited` instead of three colours | Cycles reported where none exist, or unsafe nodes called safe (802) | GREY vs BLACK are different facts. Never collapse them |
| 2.2 | Indegree decremented on push instead of pop | Nodes emitted before their prerequisites | Decrement when `u` is dequeued, enqueue `v` only at zero |
| 2.3 | Kahn's cycle case unhandled | Empty or truncated order returned as if valid | Always compare `order.size()` to `n` |
| 2.4 | DSU without union by size | Long chain input degrades to O(n) per find, TLE | Union by size *and* path compression; both are two lines |
| 2.5 | `parent[a] = b` written instead of `parent[find(a)] = find(b)` | Silently merges the wrong sets | Union roots, never raw nodes |
| 2.6 | `components` decremented on every union call | Count too low when the union was a no-op | Decrement only inside the `ra != rb` branch |
| 2.7 | MST used where shortest path was asked | Correct-looking output, wrong problem | MST minimises total edge weight, not any path |
| 2.8 | Kruskal without the `used == n − 1` check | A disconnected graph returns a partial forest's cost | Count accepted edges and report infeasible |
| 2.9 | `low[u] = min(low[u], low[v])` on a back edge | Bridges missed | Back edges use `disc[v]`; tree edges use `low[v]` |
| 2.10 | Alien Dictionary: edges from every char pair | Wrong order, or a spurious cycle | Only the first differing char of adjacent words |
| 2.11 | Alien Dictionary: prefix case ignored | Accepts `["abc","ab"]` | Longer-word-first with a shared prefix is invalid, return `""` |
| 2.12 | Eulerian path via plain backtracking | Exponential, or a stranded partial route | Hierholzer, post-order append, reverse at the end |
| 2.13 | Functional graph run through generic DFS cycle detection | Correct but O(n²) across all starts | Label by visit step; each node is touched once globally |

---

## 3 — WEIGHTED PATHS & SEARCH ON THE ANSWER

*The machine: relax edges until no relaxation improves anything — or stop asking for the
optimum and start asking whether a candidate is feasible.*

### 3.1 Sub-variant map

| | Sub-variant | The one idea |
| - | ----------- | ------------ |
| **A** | Dijkstra — the template | The first pop of a node is final, and only if weights are non-negative |
| **B** | Dijkstra on implicit grids | The graph is `m × n` cells; the relaxation is the parameter |
| **C** | Augmented-state shortest path | `dist` is indexed by the whole state, not just the node |
| **D** | 0-1 BFS | Weights in {0,1} — a deque replaces the heap and the log disappears |
| **E** | Bellman-Ford | Negative edges, or a cap on the number of edges used |
| **F** | Floyd–Warshall & all-pairs | `n ≤ ~400`, and the `k` loop is outermost |
| **G** | Binary search on the answer + connectivity | Feasibility is monotone in the threshold |
| **H** | Offline queries + DSU sweep | Sort the queries too, and answer them all in one pass |
| **I** | ⚠︎ Anti-patterns — when shortest path is the wrong machine | Each one runs the wrong algorithm until it visibly fails |

### 3.2 Problems

#### 3.A — Dijkstra, the template
*A heap of `(dist, node)`, lazy deletion, skip stale pops. The relaxation operator is the only thing that varies.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 83 | 743 | Network Delay Time | Medium | ★ | The atom. `if (d > dist[u]) continue;` is the lazy deletion — omit it and it still works but degrades |
| 84 | 1514 | Path with Maximum Probability | Medium | ★ | Max-heap, multiply instead of add. Dijkstra is still valid because products of values in `[0,1]` are monotone non-increasing — say why out loud |
| 85 | 1976 | Number of Ways to Arrive at Destination | Medium | ★ | Counting paths *during* relaxation: `<` overwrites the count, `==` adds to it. The two branches are the problem |
| 86 | 2642 | Design Graph With Shortest Path Calculator | Hard | ○ | Dijkstra as an API rather than a one-shot answer; edge additions between queries |

#### 3.B — Dijkstra on implicit grids
*Same template, but neighbours are computed and `dist` is a 2-D array. The relaxation is often not a sum.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 87 | 1631 | Path With Minimum Effort | Medium | ★⚠︎ | Grid DP is the wrong instinct: 4-directional movement means there is no evaluation order in which every predecessor is already computed. **Bottleneck relaxation**: `max(dist[u], |h[u]−h[v]|)` |
| 88 | 778 | Swim in Rising Water | Hard | ★ | Same bottleneck shape, `max(dist[u], grid[v])`. Three valid solutions (Dijkstra, binary search + BFS, DSU by time) — know all three and when each is cleanest |
| 89 | 505 | The Maze II | Medium | ○ PRO | The edge is a roll; its weight is the roll length. Free substitute: 1631 |
| 90 | 2577 | Minimum Time to Visit a Cell In a Grid | Hard | ○ | The parity wait: if you arrive too early you bounce between two cells, so add 0 or 1 to fix parity |

#### 3.C — Augmented-state shortest path
*If two arrivals at the same node differ in anything that affects the future, they are different states.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 91 | 1129 | Shortest Path with Alternating Colors | Medium | ★ | The state is `(node, lastColour)`. The layered-graph idea in its smallest form |
| 92 | 1786 | Number of Restricted Paths From First to Last Node | Medium | ★ | Two machines composed: Dijkstra to get `dist[]`, then memoised DAG DP over the strictly-decreasing edges |
| 93 | 1928 | Minimum Cost to Reach Destination in Time | Hard | ○ | `dist[node][timeUsed]` — a genuinely 2-D distance table |
| — | 1293 / 864 | (see §1.J) | | ↻ | The unweighted versions of the same idea. Solve those first |

#### 3.D — 0-1 BFS
*Weights in {0,1}: push zero-cost neighbours to the front, cost-1 to the back. Correct for the same reason Dijkstra is, minus the heap.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 94 | 1368 | Minimum Cost to Make at Least One Valid Path in a Grid | Hard | ★ | The atom. Following the arrow costs 0, any other direction costs 1 |
| 95 | 2290 | Minimum Obstacle Removal to Reach Corner | Hard | ★ | Empty cell 0, obstacle 1. The transfer test for 1368 — if it takes more than ten minutes, redo 1368 |

#### 3.E — Bellman-Ford
*Relax every edge, V−1 times. Slower than Dijkstra and strictly more general: negative weights, and edge-count constraints.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 96 | 787 | Cheapest Flights Within K Stops | Medium | ★⚠︎ | Dijkstra is *wrong* here, not just awkward: with a stop budget the first pop of a node is no longer final — a cheap arrival with too many stops blocks an expensive arrival that could still finish. Bellman-Ford with `k+1` rounds over a **snapshot** of the previous round's distances |
| — | 743 | Network Delay Time | Medium | ↻ | Re-solve #83 with Bellman-Ford; compare `O(E log V)` to `O(V·E)` on the given constraints |

#### 3.F — Floyd–Warshall & all-pairs
*Three nested loops with `k` outermost. `n ≤ ~400` in the constraints is the tell.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 97 | 1334 | Find the City With the Smallest Number of Neighbors at a Threshold Distance | Medium | ★ | The template, and the tie-break on the largest index |
| 98 | 399 | Evaluate Division | Medium | ★ | Multiplicative relaxation on a weighted undirected graph. Solvable by DFS, Floyd, or weighted DSU — write at least two |
| 99 | 1462 | Course Schedule IV | Medium | ★ | Transitive closure as boolean Floyd — reachability with the same three loops |
| 100 | 2101 | Detonate the Maximum Bombs | Medium | ○ | Build a *directed* graph from geometry (range is not symmetric), then reachability from each node |

#### 3.G — Binary search on the answer + a connectivity check
*If `feasible(x)` is monotone, you never need the optimum — only a predicate. This is §3.G/H of Bundle 01 with BFS as the check.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 101 | 2812 | Find the Safest Path in a Grid | Medium | ★ | Multi-source BFS to compute the safety field, then binary search the threshold with a BFS feasibility check. Two machines, cleanly separated |
| 102 | 1102 | Path With Maximum Minimum Value | Medium | ○ PRO | Maximin path. Free substitute: 778 |
| — | 1631 | Path With Minimum Effort | Medium | ↻ | Second solve: binary search the effort, BFS over edges within it. Write the mapping to the Dijkstra version explicitly |
| — | 778 | Swim in Rising Water | Hard | ↻ | Third solve: DSU adding cells in elevation order until 0 and n²−1 connect |

#### 3.H — Offline queries + DSU sweep
*Sorting the queries is allowed. Sort both, sweep once, and a per-query O(E) becomes one O(E α) pass.*

| # | LC | Problem | Diff | | Teaches |
| - | -- | ------- | ---- | - | ------- |
| 103 | 1697 | Checking Existence of Edge Length Limited Paths | Hard | ★ | The canonical form: sort edges by weight, sort queries by limit, union forward, answer in original index order |
| 104 | 2503 | Maximum Number of Points From Grid Queries | Hard | ★ | The same sweep with a heap instead of a sort for the edges — grid cells enter by value |

#### 3.I — ⚠︎ Anti-patterns: when the shortest-path machine is wrong
*No new problems. Re-run each of these with the wrong algorithm first, watch it fail, then fix it. That failure is the lesson.*

| Case | The wrong machine | Why it fails | Right machine |
| ---- | ----------------- | ------------ | ------------- |
| **787** (#96) | Dijkstra | Finality invariant is void once a stop budget exists | Bellman-Ford, `k+1` snapshot rounds |
| **1631** (#87) | Grid DP | 4-directional movement admits no evaluation order | Dijkstra, or binary search + BFS |
| **1091** (#11) | DFS | DFS returns *a* path, never the shortest | BFS |
| **Any negative edge** | Dijkstra | A shorter route may be discovered after the node was finalised | Bellman-Ford; detect negative cycles with a V-th round |
| **All-pairs at n = 2000** | Floyd–Warshall | `O(n³)` = 8×10⁹ | Dijkstra from each source, or reconsider the question |
| **128** (#67) | DSU | Correct, but heavier than the O(n) hash-set scan | Hash set, walking up only from sequence starts |
| **MST for "shortest path between u and v"** | Kruskal/Prim | The MST path between two nodes is frequently not the shortest path | Dijkstra |

### 3.3 Templates

```java
// A — Dijkstra. Lazy deletion; the first pop of a node is final.
long[] dijkstra(int n, List<int[]>[] adj, int src) {   // adj[u] = {v, w}
    long[] dist = new long[n];
    Arrays.fill(dist, Long.MAX_VALUE);
    dist[src] = 0;
    PriorityQueue<long[]> pq = new PriorityQueue<>(Comparator.comparingLong(a -> a[0]));
    pq.add(new long[]{0, src});
    while (!pq.isEmpty()) {
        long[] top = pq.poll();
        int u = (int) top[1];
        if (top[0] > dist[u]) continue;                // stale entry
        for (int[] e : adj[u]) {
            long nd = dist[u] + e[1];                  // ← the relaxation is the parameter
            if (nd < dist[e[0]]) { dist[e[0]] = nd; pq.add(new long[]{nd, e[0]}); }
        }
    }
    return dist;
}
// Bottleneck variant (778, 1631, 1102): nd = Math.max(dist[u], w)
// Probability variant (1514): max-heap, nd = dist[u] * w, keep the larger
```

```java
// D — 0-1 BFS. Deque replaces the heap; zero-cost to the front, one-cost to the back.
int[] zeroOneBfs(int n, List<int[]>[] adj, int src) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    Deque<Integer> dq = new ArrayDeque<>();
    dq.addFirst(src);
    while (!dq.isEmpty()) {
        int u = dq.pollFirst();
        for (int[] e : adj[u]) {
            int v = e[0], w = e[1];                    // w is 0 or 1
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                if (w == 0) dq.addFirst(v); else dq.addLast(v);
            }
        }
    }
    return dist;
}
```

```java
// E — Bellman-Ford with at most k edges. The snapshot is mandatory.
int cheapest(int n, int[][] flights, int src, int dst, int k) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    for (int round = 0; round <= k; round++) {
        int[] prev = dist.clone();                     // ← without this, one round
        for (int[] f : flights) {                      //    can chain many edges
            if (prev[f[0]] == Integer.MAX_VALUE) continue;
            dist[f[1]] = Math.min(dist[f[1]], prev[f[0]] + f[2]);
        }
    }
    return dist[dst] == Integer.MAX_VALUE ? -1 : dist[dst];
}
// Drop the k cap and run V-1 rounds for plain Bellman-Ford.
// A V-th round that still improves anything ⇒ a negative cycle.
```

```java
// F — Floyd-Warshall. k MUST be the outer loop.
void floyd(int[][] d, int n) {                         // d[i][j] preloaded, INF elsewhere
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++) {
            if (d[i][k] == INF) continue;
            for (int j = 0; j < n; j++) {
                if (d[k][j] == INF) continue;
                d[i][j] = Math.min(d[i][j], d[i][k] + d[k][j]);
            }
        }
}
```

```java
// H — offline queries + DSU sweep.
boolean[] answer(int n, int[][] edges, int[][] queries) {   // q = {u, v, limit}
    Arrays.sort(edges, Comparator.comparingInt(e -> e[2]));
    Integer[] order = new Integer[queries.length];
    for (int i = 0; i < order.length; i++) order[i] = i;
    Arrays.sort(order, Comparator.comparingInt(i -> queries[i][2]));

    DSU dsu = new DSU(n);
    boolean[] out = new boolean[queries.length];
    int e = 0;
    for (int qi : order) {                                  // queries in limit order
        while (e < edges.length && edges[e][2] < queries[qi][2]) {
            dsu.union(edges[e][0], edges[e][1]);
            e++;
        }
        out[qi] = dsu.find(queries[qi][0]) == dsu.find(queries[qi][1]);
    }
    return out;                                             // answers in ORIGINAL order
}
```

### 3.4 Failure modes

| # | Failure | Symptom | Fix |
| - | ------- | ------- | --- |
| 3.1 | `int` distance accumulator | Overflow on `1e5` edges of weight `1e4` | `long` for distances, always |
| 3.2 | No stale-entry skip in Dijkstra | Works, but the heap grows to `O(E)` and TLEs on dense inputs | `if (d > dist[u]) continue;` as the first line after the pop |
| 3.3 | `visited[]` used instead of comparing distances | A better route arriving later is discarded | Dijkstra needs no visited array; the `nd < dist[v]` test is the guard |
| 3.4 | Dijkstra on a graph with negative weights | Wrong answer, no error | Bellman-Ford |
| 3.5 | Bellman-Ford without the per-round snapshot | A single round chains multiple edges; the `k` cap is silently ignored | `int[] prev = dist.clone()` at the top of each round |
| 3.6 | Floyd with `k` in the inner loop | Wrong answers on paths of length ≥ 3 | `k` outermost. There is no exception |
| 3.7 | `INF + w` overflow in Floyd | Negative distances appear | Skip when either operand is INF, or use `INF = 1e9` with `long` |
| 3.8 | 0-1 BFS with a general weight | Wrong answer, since the deque no longer holds a monotone frontier | Only weights in {0, 1}; anything else needs Dijkstra |
| 3.9 | `feasible(x)` not proved monotone before binary searching | Converges to garbage that passes small tests | Prove monotonicity on paper first — Bundle 01 §4.1 Step 2 |
| 3.10 | Offline sweep answering in sorted order | Answers correct but permuted | Keep the original query index and write back to `out[qi]` |
| 3.11 | Augmented state stored as `dist[node]` | Too-large answer or an infinite loop | Index by the full state tuple |

---

## 4 — RECOGNITION GUIDE

### 4.1 The decision procedure

Run these in order. Stop at the first match.

**Step 0 — Is there a graph at all?** Signals: an `edges[][]` list, an `n × n` relation matrix,
a grid, a set of strings one edit apart, an array where `a[i]` is itself an index, a set of
prerequisites / equations / dependencies. If the problem names a set of objects and a relation
between them, it is a graph. Build the adjacency list *before* you think about which algorithm
to run — half of "hard graph" problems are ordinary BFS in an unfamiliar input format.

**Step 1 — Directed or undirected?** Say it out loud. It decides cycle detection
(parent-skip vs. three colours), whether `visited` alone is sufficient, and whether topological
sort is even legal.

**Step 2 — Are the edges weighted?**

| Weights | Machine |
| ------- | ------- |
| None (every step costs 1) | **BFS.** Never DFS |
| Non-negative | **Dijkstra** (§3.A) |
| All in `{0, 1}` | **0-1 BFS** with a deque (§3.D) |
| Negative present, or a cap on edge count | **Bellman-Ford** (§3.E) |
| All pairs needed, `n ≤ ~400` | **Floyd–Warshall** (§3.F) |
| Weights exist but you only need "can I connect everything cheaply" | **MST** (§2.H) |

**Step 3 — What is actually being asked?**

| Ask | Machine |
| --- | ------- |
| Reachability — "can I get there" | DFS or BFS, either is fine |
| Component count / grouping / merging | DFS component count (§1.E) or DSU (§2.E–G) |
| Shortest path, unweighted | BFS (§1.C/D) |
| Shortest path, weighted | Dijkstra family (§3) |
| *All* paths, or a count of ways | Backtracking with an undo (§1.I), or DAG DP (§2.D) |
| A valid order / schedule | Topological sort (§2.B/C) |
| "Is there a cycle" | Three colours if directed (§2.A); parent-skip DFS or DSU if not (§1.F) |
| Cheapest set of edges connecting everything | MST (§2.H) |
| Edges whose removal disconnects | Bridges, Tarjan (§2.I) |
| Use every *edge* exactly once | Eulerian path, Hierholzer (§2.K) |
| The answer is a threshold and feasibility is monotone | Binary search + BFS (§3.G), or an offline DSU sweep (§3.H) |

**Step 4 — Is the graph implicit?** Grid, board position, word, lock combination, bitmask of
collected keys. Do not materialise an adjacency list — write `neighbours(state)` and let the
search call it. The node is whatever uniquely determines the future.

**Step 5 — Does the state need augmenting?** If the same physical position can be reached
twice with a different remaining budget, key set, colour, or parity, then `visited` keyed by
position is a **wrong answer**, not a slow one. Size the array by the whole tuple.

**Step 6 — Is the graph a DAG?** If yes: no `visited` set is needed for path enumeration,
memoisation is legal, and the topological order is a valid DP evaluation order. Most
"hard graph DP" is a DAG you failed to notice — strict inequalities in the movement rule
(329) and "prerequisites" phrasing are the two tells.

**Step 7 — Does every node have out-degree exactly 1?** `nums[i] = j`, `edges[i]` is a single
int, "each person points to one other". Functional graph: every component is a rho. Label by
visit step rather than running generic cycle detection (§2.J).

**Step 8 — Are the queries offline?** A batch of queries with thresholds, and no requirement
to answer in order. Sort the edges *and* the queries, sweep once with a DSU, write answers
back by original index (§3.H).

### 4.2 Signal → pattern cheat table

| Signal in the problem statement | Most likely | Watch out for |
| ------------------------------- | ----------- | ------------- |
| "grid", "islands", "regions", "provinces" | Grid DFS/BFS or DSU | Mark on push |
| "shortest", no weights mentioned | BFS | DFS returns *a* path, not the shortest |
| "minimum cost / time / effort", non-negative | Dijkstra | Heap of `(dist, node)`, skip stale pops |
| "at most k stops / edges / moves" | Bellman-Ford, `k+1` rounds | Dijkstra's finality invariant is void |
| "prerequisites", "order", "dependencies", "before" | Topological sort | Detect the cycle; do not assume a DAG |
| "connected", "groups", "merge", "same set" | DSU | Union by size + path compression, or it is O(n) per find |
| "minimum cost to connect all" | MST | This is not shortest path |
| "maximise the minimum edge on a path" / "minimise the maximum" | Bottleneck Dijkstra, or DSU by sorted weight, or binary search | Three valid solutions — pick deliberately |
| "each node points to exactly one other" | Functional graph | Not generic cycle detection |
| "all pairs", `n ≤ 400` | Floyd–Warshall | `k` outermost |
| "remove one edge and the network splits" | Bridges (Tarjan) | Not brute-force removal |
| "use every ticket / every edge once" | Hierholzer | Not plain backtracking |
| "how many ways / how many paths" | DAG DP, or counting during relaxation | Not a shortest-path variant |
| "you may break / remove k walls" | State BFS on `(r, c, k)` | `visited[r][c]` is a wrong answer |
| "two groups", "dislikes", "cannot be together" | Bipartite 2-colouring | Loop over all components |
| "strictly increasing path in a matrix" | Memoised DFS on a DAG | No `visited` set |
| Batch of queries each with a limit | Offline sort + DSU sweep | Answer by original index |
| "cost is 0 if you keep going, 1 if you turn" | 0-1 BFS | Dijkstra also works, one log slower |
| "n nodes, `edges[i] = [a, b]`" and the word "tree" | Tree-as-graph (Bundle 02, §1.F) | There is no root until you pick one |

### 4.3 Trap cases — where the obvious machine is wrong

| Problem | The obvious (wrong) read | Why it fails | Correct approach |
| ------- | ------------------------ | ------------ | ---------------- |
| **797. All Paths From Source to Target** | Traversal ⇒ `visited` set | It is a DAG; a global `visited` silently drops every path through an already-seen node | Backtracking with no mark at all |
| **261. Graph Valid Tree** | Check for a cycle | A forest is acyclic and is not a tree | `edges == n − 1` **and** one component |
| **827. Making A Large Island** | Flood fill from every `0` | `O((mn)²)` | Label islands once with sizes, then sum distinct neighbour ids |
| **802. Find Eventual Safe States** | DFS with `visited` | `visited` conflates "on the stack" with "proved safe" | Three colours, or Kahn on the reversed graph |
| **269. Alien Dictionary** | Edge from every character pair | Only the first differing char of *adjacent* words is an edge | And reject `["abc","ab"]` explicitly |
| **329. Longest Increasing Path** | BFS/DFS with `visited` | Cells are legitimately reused across different paths | Strict increase ⇒ DAG ⇒ memoise |
| **1192. Critical Connections** | Remove each edge, recheck connectivity | `O(E·(V+E))` | Tarjan low-links, one DFS |
| **332. Reconstruct Itinerary** | Lexicographic greedy DFS | The smallest next airport can consume your only exit and strand the walk | Hierholzer: post-order append, then reverse |
| **1631. Path With Minimum Effort** | Grid DP | 4-directional movement admits no valid evaluation order | Dijkstra with `max` relaxation, or binary search + BFS |
| **787. Cheapest Flights Within K Stops** | Dijkstra | With a stop budget, the first pop of a node is no longer final | Bellman-Ford, `k+1` snapshot rounds |
| **1091. Shortest Path in Binary Matrix** | DFS | DFS gives a path, not the shortest | BFS |
| **Any grid BFS marking `visited` on pop** | "same thing, later" | The same cell enters the queue many times → TLE and non-minimal distances | Mark in the same statement that enqueues |
| **Dijkstra with any negative edge** | "still a shortest path" | Finality requires non-negative weights | Bellman-Ford |
| **1293 / 864 with `visited[r][c]`** | "a cell is a cell" | Two arrivals with different budgets are different states | Key `visited` by the full tuple |
| **128. Longest Consecutive Sequence** with DSU | "it's a grouping problem" | Correct but heavier than needed | Hash set, walk up only from sequence starts |
| **MST for "shortest path from u to v"** | "minimum edges, minimum path" | The MST path between two nodes is often not the shortest | Dijkstra |

---

## 5 — MASTERY CHECKPOINTS

Each gate is **pass/fail, no partial credit**. Gate conditions are things you do *without an
IDE, without hints, and without looking at your own notes.* A gate you "mostly" pass is a gate
you failed.

### 5.1 Traversal & Connectivity

| Gate | You may advance when you can... | Fail action |
| ---- | ------------------------------- | ----------- |
| **A → B** | Write the grid DFS blind including the four-guard order (bounds, then contents), and state why sinking the cell is a legal substitute for a `visited` array in 200 but not in 79 | Redo #1–#3 |
| **B → C** | State the inversion — "mark what escapes, then take the complement" — unprompted, and explain why 417 traverses *uphill from the oceans* rather than downhill from every cell | Re-derive the complexity of the forward version on paper before touching another problem |
| **C → D** | Write the level-snapshot BFS blind, and explain in one sentence why marking on pop is wrong rather than merely slow | Redo #11, then hand-trace a 3×3 grid where the pop-marking version reports a larger distance |
| **D → E** | Seed a multi-source BFS from memory and say what the answer is: the last level, a per-cell distance, or a count | Redo #15–#17 in one sitting; the three answers are the lesson |
| **E → F** | Turn `int[][] edges` into `List<Integer>[]` blind in under two minutes, and reproduce 1466's signed-edge trick without re-deriving | Redo #22 |
| **F → G** | State both conditions for a tree and produce a 4-node counterexample that is acyclic and not a tree | Redo #27. This is the cheapest gate to fail and the most embarrassing to fail in an interview |
| **G → H** | Write the 2-colour BFS blind *with* the outer component loop, and say what a conflict looks like | Redo #28, then run it on a disconnected test you construct yourself |
| **H → I** | Explain why the clone must enter the map before recursing, using a 2-node cycle | Redo #30 |
| **I → J** | State the rule "permanent mark for shortest path, undone mark for enumeration, no mark on a DAG" and place 797, 79 and 1091 correctly into it without hesitating | Redo #31 and #32 back to back. If 797 still feels like it needs `visited`, that is the whole gate |
| **J → K** | Given a new grid problem with a budget, name the state tuple and the `visited` dimensions **before** writing code | The most transferable gate in the pattern. Redo #36, then solve #37 cold |
| **K → done** | Explain why pattern buckets beat pairwise comparison in 127, and state the termination condition of the two-ended search | Redo #41; if the bidirectional version is unclear, write the one-directional version first and diff them |

### 5.2 Ordering, Partitions & Spanning Structure

| Gate | You may advance when you can... | Fail action |
| ---- | ------------------------------- | ----------- |
| **A → B** | Write the three-colour DFS blind and say what GREY→BLACK means that GREY→GREY does not | Redo #45, then #46. The pair is the lesson |
| **B → C** | Write Kahn blind, including the `order.size() == n` cycle report, in under four minutes | This is the foundation gate. Do not proceed. Rewrite daily until it is muscle memory |
| **C → D** | Given a prose description of dependencies, produce the node set and the edge set **on paper** before writing any code, and state the cycle semantics for that domain | Redo #50, then #51 with only the constraints section visible |
| **D → E** | Explain why 329 needs a memo and not a `visited` set, in terms of the graph being acyclic | You have the code but not the pattern. Re-derive on paper before touching another problem |
| **E → F** | Write the DSU class blind — `find` with path compression, `union` by size, a `components` counter decremented in the right branch — in under four minutes with zero compile errors | The second foundation gate. Do not proceed |
| **F → G** | Given a new grouping problem, say whether the answer is `n − components`, `components − 1`, or a per-component aggregate, **before** coding | Redo #62 and #63 side by side |
| **G → H** | Explain what union-by-time buys you in 305 that a fresh traversal per step does not | Redo #68 (or its free substitute) and state the complexity of the naive version out loud |
| **H → I** | State the difference between MST and shortest path in one sentence, and give a 4-node graph where the MST path between two nodes is longer than the shortest path | Redo #73 both ways, Kruskal and Prim, and say which suits a complete graph |
| **I → J** | Write the bridge DFS blind and correctly justify `disc[v]` on the back edge and `low[v]` on the tree edge | Redo #76. Hand-trace a 4-cycle with one pendant edge |
| **J → K** | Recognise a functional graph from the *input signature alone* and state why one global pass suffices | Redo #77 |
| **K → done** | Explain, with a concrete 3-airport counterexample, why lexicographic greedy strands the walk in 332 | Redo #81. If the counterexample does not come to hand, you memorised Hierholzer without understanding it |

### 5.3 Weighted Paths & Search on the Answer

| Gate | You may advance when you can... | Fail action |
| ---- | ------------------------------- | ----------- |
| **A → B** | Write Dijkstra blind in under five minutes with `long` distances and the stale-pop skip, and state the finality invariant and its precondition | This is the foundation gate. Do not proceed. Rewrite daily |
| **B → C** | Change the relaxation from `dist[u] + w` to `max(dist[u], w)` and explain why Dijkstra is still correct under it | Redo #87 and #88 back to back, in that order, in one sitting |
| **C → D** | Given a new problem, decide whether the state needs augmenting **before** writing code, and name every dimension | Redo #91, then #92. If 1293 (§1.J) does not feel like the same idea, re-read §4.1 Step 5 |
| **D → E** | Write 0-1 BFS blind and explain why the deque frontier stays monotone | Redo #94, then solve #95 cold in under ten minutes |
| **E → F** | State — unprompted — exactly which invariant 787 breaks, then write Bellman-Ford blind with the snapshot and explain what happens without it | 787 is the capstone anti-pattern of this bundle. If it fails, run the Dijkstra version against the failing test until you can see the finalisation happen |
| **F → G** | Write Floyd blind with `k` outermost and the INF guards, and name the `n` at which it stops being viable | Redo #97, then #99 |
| **G → H** | Given any "maximise the minimum" graph problem, produce all three solutions — Dijkstra, binary search + BFS, DSU by weight — and say which you would write in an interview and why | Redo #88 three ways and write the mapping between them explicitly |
| **H → done** | Explain why sorting the queries is legal, and write the sweep with answers restored to original index order | Redo #103, then #104. If the index restoration is the bug, that is the whole sub-variant |

### 5.4 Revisit rule for ★ problems

Log every starred problem with an outcome the moment you finish it. The interval depends
**only** on how you solved it, never on how you felt about it.

| Outcome | Next revisit | Then | Then | Graduates when |
| ------- | ------------ | ---- | ---- | -------------- |
| **Clean** — unaided, optimal, first submission accepted, ≤ 25 min | +14 days | +45 days | done | 2 consecutive clean runs |
| **Slow** — unaided and optimal, but > 40 min or multiple failed submissions | +7 days | +21 days | +45 days | 2 consecutive clean runs |
| **Hinted** — you read a hint, a tag, or the pattern name | +3 days | +10 days | +30 days | 2 consecutive **clean** runs (slow doesn't count) |
| **Solved** — you read the editorial or any solution code | +1 day | +4 days | +12 days | 3 consecutive clean runs |
| **Suboptimal** — accepted but wrong complexity | Treat as **Hinted**, and additionally re-solve the *previous* starred problem in the same sub-variant | | | |

**Additional rules that matter more than the intervals:**

1. **Name the machine first.** On every revisit, say which of the six machines this is — traverse,
   order, partition, span, relax, search the answer — **before** opening the editor. Naming it
   wrong downgrades the attempt to *Hinted* regardless of how the code goes.
2. **Say where `visited` is set.** Push or pop, and keyed by what. If you cannot answer both
   parts instantly, the attempt is *Hinted*.
3. **Blind template first.** Write the sub-variant's template from memory before reading the
   problem. A wrong template downgrades the attempt on its own.
4. **Two strikes → step back.** Any starred problem that fails to reach *Clean* on two
   consecutive revisits: stop, go back one sub-variant, re-solve its last two starred problems.
   The failure is almost always upstream.
5. **Failure-mode tagging.** When a revisit isn't clean, tag it with the row number from the
   relevant §*.4 table. After ten problems you will have two or three dominant tags — those
   are your actual weaknesses, and they are worth more than any problem count.
6. **Draw the graph.** Any graph bug that survives two readings of the code gets a hand-drawn
   6-node counterexample with exactly one cycle. As with trees, the drawing finds the bug
   faster than the debugger.
7. **The sub-variant transfer test.** Once per sub-variant, take an unseen ○ problem from the
   same sub-variant and solve it cold. If the core problems are clean but the transfer fails,
   you learned the problems, not the pattern.
8. **Never revisit an unstarred problem** unless it is serving as a transfer test.
9. **Cap the queue at 12 due items.** If more than 12 come due, do the oldest 12 and push the
   rest. A backlog you avoid is worse than an interval you stretch.

---

### Appendix A — Coverage summary

| Pattern | Sub-variants | ★ core | ⚠︎ (inside core) | Core total | ○ optional | Listed |
| ------- | ------------ | ------ | ---------------- | ---------- | ---------- | ------ |
| Traversal & Connectivity | 11 | 24 | 3 (827, 261, 797) | 27 | 17 | 44 |
| Ordering, Partitions & Spanning | 11 | 16 | 5 (802, 269, 329, 1192, 332) | 21 | 17 | 38 |
| Weighted Paths & Search on the Answer | 9 | 14 | 2 (1631, 787) | 16 | 6 | 22 |
| **Total** | **31** | **54** | **10** | **64** | **40** | **104** |

Premium problems: 12 listed, of which 3 are core (261, 269, 305). Free substitutes are
named in the table row for each.

The ten ⚠︎ problems are the highest-value items in the document. They are the only ones that
teach you when *not* to reach for the obvious machine, which is the difference between someone
who has done 400 graph problems and someone who can solve an unseen one.

### Appendix B — Deliberately out of scope

Named here so that "no gaps" means what it says. None of these has appeared on a FAANG loop
in recent memory; each is one search away if you need it.

| Topic | Why it is out | Know that |
| ----- | ------------- | --------- |
| Max flow / min cut (Dinic, Edmonds–Karp) | Effectively untested at this level | Max-flow = min-cut; bipartite matching reduces to it |
| Bipartite matching (Hopcroft–Karp, Hungarian) | Same | Kőnig's theorem links matching to vertex cover |
| Strongly connected components (Kosaraju, Tarjan) | Almost never the intended solution on LeetCode | Condensing a digraph by SCC yields a DAG; that is the one useful fact |
| 2-SAT | Competitive programming only | It is an SCC problem on the implication graph |
| Heavy-light decomposition, centroid decomposition | Competitive programming only | |
| LCA by binary lifting | Appears on trees, not general graphs | Bundle 02 covers the recursive LCA |
| A\* and heuristic search | No LeetCode problem requires the heuristic | It is Dijkstra with `f = g + h`, admissible `h` |
| Johnson's algorithm | Superseded by Floyd at the tested input sizes | |

### Appendix C — Where this bundle connects to the others

- **LC 329** (longest increasing path) is memoised DFS on a DAG — the same "return what
  composes, record what does not" split as tree recursion, Bundle 02 §2.C.
- **LC 2360** (longest cycle in a functional graph) is **LC 287**'s argument from Bundle 01
  §1.G with a different termination proof: the array *was* a linked list there too.
- **LC 778 / 1631 / 1102** are binary search on the answer — Bundle 01 §3.G/H — with a BFS
  standing in for the feasibility predicate. **LC 1697 / 2503** are the offline version of
  the same idea.
- **LC 310** (minimum height trees) is topological peeling: the same strip-the-frontier motion
  as multi-source BFS in §1.D, run on degree instead of distance.
- **LC 863** (all nodes distance K, Bundle 02 §1.F) is a tree converted into an undirected
  graph — which is Step 0 of §4.1 here, arriving from the other direction.
- **LC 133**'s `Map<Node, Node>` is **LC 138**'s random-pointer map: `visited` and the memo
  being the same object is a pattern, not a coincidence.
- **LC 787** breaks Dijkstra for exactly the reason a non-monotone `feasible(x)` breaks binary
  search in Bundle 01 §4.3: the algorithm's correctness rests on an invariant, and the problem
  quietly removes it.

If those seven sentences read as obvious, the patterns have transferred. If any of them reads
as a surprise, that is the next thing to study.
