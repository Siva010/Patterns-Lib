> **Archived.** This is the README of the standalone *VisualDSAcode* repo, kept only as a
> record of what that project contained. Its 36 visualizers were merged into `Visuals/` on
> 2026-08-06 and renamed to `<lc-number>-<slug>.html`; the three `*_Problems/` lab folders and
> their galleries were retired in favour of `Visuals/index.html`. **Every path and link below is
> dead.** The one thing here that was never carried across is the `docs/Sliding-Window/`
> catalog — a prioritised study plan plus all 169 LeetCode sliding-window problems by method.
> If that is still wanted, it has to come from the original repo.

---

# 🎯 VisualDSAcode

<p align="center">
  <a href="index.html">
    <img src="assets/banner.jpg" width="100%" alt="VisualDSAcode - DSA Visualizer Labs">
  </a>
</p>

<p align="center">
  <img src="assets/logo.jpg" width="110" alt="VisualDSAcode Logo">
</p>

> **Interactive visualizations for Data Structures & Algorithms patterns** — step by step.

<p align="center">
  <a href="https://github.com/Siva010/VisualDSAcode/stargazers"><img src="https://img.shields.io/github/stars/Siva010/VisualDSAcode?style=for-the-badge&color=f6c453" alt="Stars"></a>
  <a href="https://github.com/Siva010/VisualDSAcode/network/members"><img src="https://img.shields.io/github/forks/Siva010/VisualDSAcode?style=for-the-badge&color=6ea8ff" alt="Forks"></a>
  <a href="index.html"><img src="https://img.shields.io/badge/Labs-3-37e0c4?style=for-the-badge" alt="Labs"></a>
  <a href="index.html"><img src="https://img.shields.io/badge/Visualizers-32-6ea8ff?style=for-the-badge" alt="Visualizers"></a>
  <a href="https://leetcode.com"><img src="https://img.shields.io/badge/LeetCode-FFA116?style=for-the-badge&logo=leetcode&logoColor=white" alt="LeetCode"></a>
</p>

<p align="center">
  <strong>Master DSA patterns with frame-by-frame animations.</strong><br>
  Each lab is a self-contained collection of visualizers — every solution traced against real test cases.
</p>

---

## 🎬 Interactive Labs

<p align="center">
  <strong>Two Pointers Lab</strong> — 19 visualizers<br>
  <strong>Sliding Window Lab</strong> — 8 visualizers · 4 sub-patterns<br>
  <strong>Binary Search Lab</strong> — 5 visualizers · 4 sub-patterns
</p>

**Experience the full interactive galleries:**

👉 **[Two Pointers Lab →](Two-Pointers_Problems/index.html)**  
👉 **[Sliding Window Lab →](Sliding-Window_Problems/index.html)**  
👉 **[Binary Search Lab →](Binary-Search_Problems/index.html)**

Each lab features:
- Real-time pointer / window / mid-index animations
- Search + filter by category
- Direct LeetCode links
- Clean, modern dark theme

---

## 📚 Labs & Visualizers

All visualizers are organized into focused labs (always up to date):

👉 **[Two Pointers Lab (19 visualizers) →](Two-Pointers_Problems/index.html)**  
👉 **[Sliding Window Lab (8 visualizers) →](Sliding-Window_Problems/index.html)**  
👉 **[Binary Search Lab (5 visualizers) →](Binary-Search_Problems/index.html)**

### Two Pointers
Includes Two Sum II, 3Sum / 4Sum / kSum, Container With Most Water, Trapping Rain Water, Valid Palindrome, Sort Colors, Fast & Slow linked-list problems, and more.

### Sliding Window
Four sub-patterns:

| Sub-pattern | Problems |
|-------------|----------|
| **Fixed-size window** | Maximum Average Subarray I, Max Sum of Distinct Subarrays with Length K |
| **Variable-size window** | Longest Substring Without Repeating Characters, Max Consecutive Ones III, Minimum Window Substring |
| **Character-frequency window** | Permutation in String, Find All Anagrams in a String |
| **Monotonic deque** | Sliding Window Maximum |

### Binary Search
| Sub-pattern | Problems |
|-------------|----------|
| **Classic** | Binary Search, Search Insert Position, First Bad Version |
| **Rotated arrays** | Search in Rotated Sorted Array, Find Minimum in Rotated Sorted Array |
| **Answer space** | *(coming soon)* Koko Eating Bananas, Capacity to Ship Packages |
| **Hard** | *(coming soon)* Find Peak Element, Median of Two Sorted Arrays |

> All visualizers are built and verified against real test cases.

### Sliding Window study guides
Beyond the interactive lab, the repo includes written pattern catalogs (Java templates + priority order):

| Guide | What it is |
|-------|------------|
| **[Prioritized catalog](docs/Sliding-Window/sliding-window-prioritized-categorized.md)** | High-ROI study plan (~24 P0 / ~40 P0+P1) — start here |
| **[Full catalog](docs/Sliding-Window/sliding-window-categorized.md)** | All **169** LeetCode Sliding Window problems by method |

---

## 🚀 Getting Started

No installation or build step required.

### Option 1 — Quick View (Recommended)
1. Clone the repo
   ```bash
   git clone https://github.com/Siva010/VisualDSAcode.git
   cd VisualDSAcode
   ```
2. Open the main hub:
   ```bash
   # On most systems this opens it in your default browser
   open "index.html"
   ```

   Or jump straight into a lab:
   - `Two-Pointers_Problems/index.html`
   - `Sliding-Window_Problems/index.html`
   - `Binary-Search_Problems/index.html`

### Option 2 — Direct on GitHub
Navigate to any `.html` file or the root `index.html` in the browser. GitHub will render the pages (best experience when cloned locally).

---

## 🧠 Core Patterns

This repo focuses on powerful, interview-favorite algorithmic patterns:

### Two Pointers
The **Two Pointers** technique is one of the most elegant patterns in algorithms:
- Reduces many **O(n²)** brute-force solutions to **O(n)**
- Works beautifully on **sorted arrays**, **linked lists**, and **strings**
- Powers solutions for famous problems like 3Sum, Trapping Rain Water, Container With Most Water, and more

### Sliding Window
Maintains a dynamic window that expands and contracts while tracking invariants in a single pass:
- **Fixed windows** slide one element at a time
- **Variable windows** grow/shrink based on a validity condition
- **Frequency windows** match character-count tables (anagrams & permutations)
- **Monotonic deques** keep candidates ordered so the window answer is always O(1) at the front

### Binary Search
Halve the search space each step — not only on sorted arrays, but on rotated arrays and answer spaces:
- Prove which half is still sorted after a rotation
- Compare `mid` against the right endpoint to find the pivot / minimum
- Search an answer range when the array itself is not the search domain

Each visualizer shows the pointers/window/mid index moving in real time so the patterns **click**.

---

## 📁 Project Structure

```
VisualDSAcode/
├── index.html                              # Main hub — DSA Visualizer Labs
├── Two-Pointers_Problems/
│   ├── index.html                          # Gallery + search (19 visualizers)
│   ├── two-sum-ii-visualizer.html
│   ├── 3sum-visualizer.html
│   ├── trapping-rain-water-visualizer.html
│   └── ...
├── Sliding-Window_Problems/
│   ├── index.html                          # Gallery + search (8 visualizers)
│   ├── max-average-subarray-visualizer.html
│   ├── longest-substring-no-repeat-visualizer.html
│   ├── max-consecutive-ones-iii-visualizer.html
│   ├── minimum-window-substring-visualizer.html
│   ├── permutation-in-string-visualizer.html
│   ├── find-all-anagrams-visualizer.html
│   ├── sliding-window-maximum-visualizer.html
│   └── ...
├── Binary-Search_Problems/
│   ├── index.html                          # Gallery + search (5 visualizers)
│   ├── binary-search-visualizer.html
│   ├── search-insert-position-visualizer.html
│   ├── first-bad-version-visualizer.html
│   ├── search-in-rotated-sorted-array-visualizer.html
│   └── find-min-rotated-sorted-array-visualizer.html
├── assets/
│   ├── banner.jpg
│   └── logo.jpg
├── docs/
│   └── Sliding-Window/
│       ├── sliding-window-prioritized-categorized.md   # study plan
│       └── sliding-window-categorized.md               # full 169 catalog
├── README.md
└── (more patterns coming soon)
```

---

## 🛠️ Tech Stack

- Pure **HTML + CSS + JavaScript** (no frameworks)
- Modern design with smooth animations
- Fully self-contained files — works offline

---

## 🌱 Roadmap

- [x] Two Pointers Lab (19 visualizers)
- [x] Sliding Window Lab (8 visualizers · fixed / variable / frequency / deque)
- [x] Sliding Window pattern catalogs (prioritized + full 169)
- [x] Binary Search Lab (5 visualizers · classic + rotated)
- [ ] More Binary Search (answer-space, hard)
- [ ] More patterns (Trees, Graphs, DP, Backtracking, etc.)
- [ ] Dark/light theme toggle
- [ ] Export animation as GIF
- [ ] Add Java/Python code panels alongside visuals

Have a favorite DSA problem you'd like visualized? Open an issue!

---

## 💖 Contributing

Contributions are welcome!

1. Fork the repo
2. Add a new visualizer (or entire lab) following the existing style
3. Update the lab's `index.html` with the new problem metadata
4. Bump the lab count on the root `index.html` hub if needed
5. Submit a PR

Each lab folder is self-contained.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/Siva010">Siva010</a><br>
  <sub>One pattern at a time.</sub>
</p>
