"""Add the six semantic role tokens to a tree page's :root and dark blocks.

The tree pages predate the role palette, so tree-engine.css falls back to
near-monochrome on them. A call-stack lab has five states live at once
(active / on-path / returned / pruned / never-called); monochrome can carry
about three. Values are identical to the ones every array-and-string page
already uses, so a role means the same thing library-wide.

    python add_roles.py <file.html> [more.html ...]
    python add_roles.py --check <file.html>
"""
import re, sys

LIGHT = """
  /* semantic pointer/state roles — shared with the array & string pages */
  --r-anchor:  #9c3a1c; --r-anchor-wash:  rgba(156,58,28,.10);  --r-anchor-line:  rgba(156,58,28,.42);
  --r-anchor2: #a8306b; --r-anchor2-wash: rgba(168,48,107,.10); --r-anchor2-line: rgba(168,48,107,.42);
  --r-left:    #2f5fa8; --r-left-wash:    rgba(47,95,168,.10);  --r-left-line:    rgba(47,95,168,.42);
  --r-right:   #6b3a8f; --r-right-wash:   rgba(107,58,143,.10); --r-right-line:   rgba(107,58,143,.42);
  --r-window:  #12666e; --r-window-wash:  rgba(18,102,110,.10); --r-window-line:  rgba(18,102,110,.42);
  --r-hit:     #1f6b52; --r-hit-wash:     rgba(31,107,82,.10);  --r-hit-line:     rgba(31,107,82,.42);
"""

DARK = """
  --r-anchor:  #e3865f; --r-anchor-wash:  rgba(227,134,95,.14);  --r-anchor-line:  rgba(227,134,95,.46);
  --r-anchor2: #f091bd; --r-anchor2-wash: rgba(240,145,189,.14); --r-anchor2-line: rgba(240,145,189,.46);
  --r-left:    #7fb0f0; --r-left-wash:    rgba(127,176,240,.14); --r-left-line:    rgba(127,176,240,.46);
  --r-right:   #bd94e8; --r-right-wash:   rgba(189,148,232,.14); --r-right-line:   rgba(189,148,232,.46);
  --r-window:  #63c6d4; --r-window-wash:  rgba(99,198,212,.14);  --r-window-line:  rgba(99,198,212,.46);
  --r-hit:     #5fc9a3; --r-hit-wash:     rgba(95,201,163,.14);  --r-hit-line:     rgba(95,201,163,.46);
"""


def block(css, pattern):
    """the outermost {...} of the first rule matching pattern"""
    m = re.search(pattern, css)
    if not m:
        return None
    i = css.index("{", m.start())
    depth = 0
    for j in range(i, len(css)):
        if css[j] == "{":
            depth += 1
        elif css[j] == "}":
            depth -= 1
            if depth == 0:
                return (i, j)
    return None


def apply(path, check_only=False):
    t = open(path, encoding="utf-8").read()
    if "--r-anchor" in t:
        print("  %-46s already has the role palette" % path.split("/")[-1])
        return False
    s, e = t.index("<style>"), t.index("</style>")
    css = t[s:e]
    root = block(css, r":root\s*\{")
    dark = block(css, r'html\[data-theme="dark"\]\s*\{')
    if not root or not dark:
        print("  %-46s !! could not find :root and/or dark block" % path.split("/")[-1])
        return False
    if check_only:
        print("  %-46s ready (root@%d dark@%d)" % (path.split("/")[-1], root[0], dark[0]))
        return True
    # insert into the later block first so the earlier offset stays valid
    first, second = sorted([(root, LIGHT), (dark, DARK)], key=lambda x: x[0][1], reverse=True)
    for (i, j), text in (first, second):
        css = css[:j] + text + css[j:]
    open(path, "w", encoding="utf-8").write(t[:s] + css + t[e:])
    print("  %-46s role palette added" % path.split("/")[-1])
    return True


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    chk = "--check" in sys.argv
    n = sum(bool(apply(a, chk)) for a in args)
    print("\n%s %d file(s)" % ("ready:" if chk else "updated:", n))
