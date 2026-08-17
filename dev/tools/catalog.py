"""Phase 4 — fold the 36 array/string visualizers into Visuals/index.html,
link the 4 orphaned tree pages, and correct every stale count.
"""
import re, json, html

SECTIONS = [
 ("tp", "p3", "Pattern 3 &mdash; Two Pointers",
  "Two indices, and an argument for why moving one of them can never skip the answer. "
  "Nineteen pages.", [
   ("A", "Converging pointers on sorted data", "the discard argument is the whole pattern",
    [167, 1099, 125, 977, 680, 344, 345]),
   ("B", "Converging with a discard proof", "greedy: prove the smaller side can be dropped",
    [11, 42]),
   ("C", "k-Sum reduction", "peel an index, recurse, bottom out at two pointers",
    [15, 16, 18, 259, None]),
   ("G", "Fast &amp; slow, and gap pointers", "distance, not position", [141, 876, 19]),
   ("H", "Partitioning", "three regions, one pass", [75]),
   ("K", "Counting pairs on sorted data", "count the block, don't enumerate it", [611]),
  ]),
 ("sw", "p4", "Pattern 4 &mdash; Sliding Window",
  "One pass, two boundaries, and an invariant that decides when the window has to give ground. "
  "Eight pages.", [
   ("A", "Fixed-size window", "the frame never changes size", [643, 2841]),
   ("B", "Variable window, maximize length", "grow greedily, shrink only when invalid", [3, 1004]),
   ("C", "Variable window, minimize length", "shrink as far as it will go, then record", [76]),
   ("E", "Frequency-map matching", "a matched counter beats rescanning the map", [567, 438]),
   ("I", "Monotonic deque windows", "the front is always the answer", [239]),
  ]),
 ("bs", "p5", "Pattern 5 &mdash; Binary Search",
  "Halve the space each step &mdash; on an array, on a rotation, or on the answer itself. "
  "Nine pages.", [
   ("A/B/C", "Boundaries and the generic predicate", "lower bound is the one to memorise",
    [704, 35, 278]),
   ("D", "Rotated sorted arrays", "prove which half is still sorted", [33, 153]),
   ("E", "Unimodal / peak", "compare against the neighbour, not a target", [162]),
   ("G", "Answer space, minimize the maximum", "search the answer, test with a predicate",
    [875, 1011]),
   ("K", "Partition binary search", "search the split, not the value", [4]),
  ]),
]

# the 4 genuinely-orphaned tree pages, and where they belong
TREE_ORPHANS = {
 "C The record / return split": [
   ("687-longest-univalue-path.html", "687", "Longest Univalue Path", "Medium",
    "return the one-sided arm, record the join"),
 ],
 "B Two trees in lockstep": [
   ("617-merge-two-binary-trees.html", "617", "Merge Two Binary Trees", "Easy",
    "the pairing rule when either side may be null"),
   ("951-flip-equivalent-binary-trees.html", "951", "Flip Equivalent Binary Trees", "Medium",
    "match children in either order"),
 ],
 "A Postorder aggregation": [
   ("404-sum-of-left-leaves.html", "404", "Sum of Left Leaves", "Easy",
    "the parent knows which child it is"),
 ],
}

ALT_ADD = [
 ("balanced-binary-tree-visualizer.html", "110", "Balanced Binary Tree &mdash; standalone",
  "Alt", "predates the 110 page above"),
 ("count-complete-tree-nodes.html", "222", "Count Complete Tree Nodes &mdash; standalone",
  "Alt", "predates the 222 page above"),
]

DIFFCLASS = {"Easy": "diff-easy", "Medium": "diff-medium", "Hard": "diff-hard", "Alt": "diff-medium"}


def load_meta():
    """hook text from the old lab indexes, difficulty from the study tables"""
    meta = {}
    for lab in ["Two-Pointers_Problems", "Sliding-Window_Problems", "Binary-Search_Problems"]:
        t = open("DSA Problem Visuals/%s/index.html" % lab, encoding="utf-8").read()
        for m in re.finditer(r"\{\s*id:'([^']+)',\s*num:(\d+|null),\s*title:'([^']*)'"
                             r".*?hook:'([^']*)'", t, re.S):
            key = int(m.group(2)) if m.group(2) != 'null' else None
            meta[key] = {"title": m.group(3), "hook": m.group(4)}
    diff = {}
    for p in ["two-pointers", "sliding-window", "binary-search"]:
        t = open("three-patterns/%s.html" % p, encoding="utf-8").read()
        for m in re.finditer(r'<tr\s([^>]*)>', t):
            a = m.group(1)
            lc = re.search(r'data-lc="(\d+)"', a)
            d = re.search(r'data-diff="(\w+)"', a)
            if lc and d:
                diff[int(lc.group(1))] = d.group(1)
    return meta, diff


def card(href, num, title, d, blurb):
    return ('<a class="card" href="%s"><span class="num">%s</span><span class="t">%s</span>'
            '<span class="diff %s">%s</span><span class="d">%s</span></a>'
            % (href, num, title, DIFFCLASS.get(d, "diff-medium"), d, blurb))


def main():
    meta, diff = load_meta()
    man = {m["lc"]: m for m in json.load(open("Visuals/_incoming.json", encoding="utf-8"))}
    t = open("Visuals/index.html", encoding="utf-8").read()

    # ---- build the three new parts
    out = []
    for pat, pid, heading, sub, groups in SECTIONS:
        out.append('\n<h2 class="part" id="%s">%s</h2>' % (pid, heading))
        out.append('<p class="partsub">%s</p>\n' % sub)
        for letter, label, note, lcs in groups:
            out.append('<h3><span class="sv">%s</span> %s<span class="note">%s</span></h3>'
                       % (letter, label, note))
            out.append('<div class="grid">')
            for lc in lcs:
                rec = man[lc]
                mt = meta.get(lc, {})
                title = html.escape(mt.get("title") or rec["title"])
                blurb = html.escape(mt.get("hook", ""))
                if len(blurb) > 62:
                    blurb = blurb[:59].rsplit(" ", 1)[0] + "&hellip;"
                num = str(lc) if lc else "&#9670;"
                out.append(card(rec["file"], num, title, diff.get(lc, "Medium"), blurb))
            out.append('</div>\n')
    newparts = "\n".join(out)

    # ---- insert before "Also in this folder"
    anchor = '<h2 class="part" id="alt">'
    assert anchor in t
    t = t.replace(anchor, newparts + "\n" + anchor, 1)

    # ---- link the orphaned tree pages into their existing sections
    added = 0
    for sec, items in TREE_ORPHANS.items():
        letter, label = sec.split(" ", 1)
        m = re.search(r'(<h3><span class="sv">%s</span>\s*%s.*?<div class="grid">)'
                      % (re.escape(letter), re.escape(label)), t, re.S)
        if not m:
            print("   !! section not found:", sec)
            continue
        block = "".join("\n" + card(f, n, ti, d, b) for f, n, ti, d, b in items)
        t = t[:m.end()] + block + t[m.end():]
        added += len(items)

    # ---- the two superseded drafts go in "Also in this folder"
    m = re.search(r'<h2 class="part" id="alt">.*?<div class="grid">', t, re.S)
    t = t[:m.end()] + "".join("\n" + card(*a) for a in ALT_ADD) + t[m.end():]

    # ---- counts and nav
    total = len(re.findall(r'<a class="card" href="', t))
    t = t.replace("<title>Trees &mdash; 48 interactive visualizers</title>",
                  "<title>%d interactive visualizers</title>" % total)
    t = t.replace("<h1>Trees &mdash; interactive visualizers</h1>",
                  "<h1>Interactive visualizers</h1>")
    t = re.sub(r'Forty-eight pages, one house style\.',
               '%d pages, one house style.' % total, t)
    t = t.replace('<a href="#p2">Pattern 2 &mdash; Tree Recursion</a>',
                  '<a href="#p2">Pattern 2 &mdash; Tree Recursion</a><span>&middot;</span>'
                  '<a href="#p3">3 &mdash; Two Pointers</a><span>&middot;</span>'
                  '<a href="#p4">4 &mdash; Sliding Window</a><span>&middot;</span>'
                  '<a href="#p5">5 &mdash; Binary Search</a>')
    with open("Visuals/index.html", "w", encoding="utf-8") as fh:
        fh.write(t)
    print("added 36 array/string cards + %d orphaned tree pages + 2 alternates" % added)
    print("catalog now lists %d cards" % total)


if __name__ == "__main__":
    main()
