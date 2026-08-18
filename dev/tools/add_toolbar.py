"""Restore the filter toolbar to a study page that is missing it.

Bundle 01 ships a toolbar at the top of the content column - the Show / Core /
Anti-patterns / Unsolved and Easy / Medium / Hard chips, Expand all, and the
running count. Bundles 02 and 03 never had the markup, though they carry the
whole of its CSS and the behaviour script that drives it. So the feature is
there and simply unreachable, and one thing quietly breaks as well:

    thead th { position: sticky; top: calc(var(--h) + var(--toolbar-h)); }

The runtime measures the toolbar and writes --toolbar-h, but it returns early
when there is no toolbar, so the variable keeps its 46px placeholder. Sticky
table headers therefore park 46px below the appbar with nothing in the gap.

The block is lifted verbatim from the donor rather than retyped, so all three
bundles keep one toolbar rather than three that drift.

    python dev/tools/add_toolbar.py trees/*.html          # dry run
    python dev/tools/add_toolbar.py --apply trees/*.html

Idempotent, and refuses rather than guessing: a page that already has a toolbar
is left alone, and a page missing the anchor or the CSS it depends on is
reported and skipped.
"""
import io
import os
import re
import sys

DONOR = "three-patterns/two-pointers.html"

# the toolbar needs all of these to already be on the page
NEEDS = ['.toolbar {', '.grouplabel', '.chip[aria-pressed="true"]',
         'var(--toolbar-h)', 'var toolbarEl = $(".toolbar");']

ANCHOR = re.compile(r'(<main id="main">\s*\n\s*<div class="wrap">)')


# Anchored on the toolbar's own last child. Matching to the "next </div>" instead
# overshoots on any page whose toolbar is not followed by a newline, and quietly
# drags the page's first heading and prose along with it.
TOOLBAR_RE = re.compile(
    r'[ \t]*<div class="toolbar" role="group".*?</span>\s*\n\s*</div>', re.S)


def donor_toolbar():
    if not os.path.exists(DONOR):
        raise SystemExit("donor %s not found - run from the repository root" % DONOR)
    t = io.open(DONOR, encoding="utf-8").read()
    m = TOOLBAR_RE.search(t)
    if not m:
        raise SystemExit("donor %s has no toolbar block - refusing" % DONOR)
    block = m.group(0)
    if "</h" in block or "<table" in block:
        raise SystemExit("donor toolbar match ran past the toolbar - refusing")
    return block


def add(path, block, apply):
    t = io.open(path, encoding="utf-8").read()

    if 'class="toolbar"' in t:
        print("  %-34s already has one - skipped" % path)
        return 0
    missing = [n for n in NEEDS if n not in t]
    if missing:
        print("  %-34s REFUSED - missing %s" % (path, ", ".join(missing)))
        return 1
    if not ANCHOR.search(t):
        print("  %-34s REFUSED - no <main>/<div class=\"wrap\"> anchor" % path)
        return 1

    # trailing newline so the page's first heading starts on its own line, and so
    # the toolbar's </div> is unambiguously terminated for anyone reading it back
    out = ANCHOR.sub(lambda m: m.group(1) + "\n" + block.rstrip("\n") + "\n", t, count=1)
    if out == t:
        print("  %-34s REFUSED - substitution did nothing" % path)
        return 1
    print("  %-34s + %d bytes" % (path, len(out) - len(t)))
    if apply:
        io.open(path, "w", encoding="utf-8", newline="\n").write(out)
    return 0


def main():
    args = [a for a in sys.argv[1:] if a != "--apply"]
    apply = "--apply" in sys.argv
    if not args:
        raise SystemExit(__doc__)
    block = donor_toolbar()
    print("toolbar lifted from %s (%d bytes)\n" % (DONOR, len(block)))
    bad = sum(add(p, block, apply) for p in args)
    print("\n%s" % ("wrote" if apply else "dry run - pass --apply to write"))
    if bad:
        raise SystemExit("%d page(s) refused" % bad)


if __name__ == "__main__":
    main()
