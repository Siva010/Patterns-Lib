"""Wire any newly-added Visuals/<lc>-<slug>.html into the study tables.

Idempotent and generic: scans Visuals/, finds study rows whose data-lc has a
matching file but no .viz anchor yet, and adds one. Also installs the a.viz CSS
and print rule on any page that lacks them (trees/bst.html does).

    python integrate.py            # dry run, reports what it would do
    python integrate.py --apply
"""
import re, os, sys, glob

PAGES = ["three-patterns/two-pointers.html", "three-patterns/sliding-window.html",
         "three-patterns/binary-search.html", "trees/traversal.html",
         "trees/tree-recursion.html", "trees/bst.html"]

SVG = ('<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" '
       'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
       '<circle cx="8" cy="2.6" r="1.9"/><circle cx="3" cy="12.4" r="1.9"/>'
       '<circle cx="13" cy="12.4" r="1.9"/><path d="M6.6 4.2 4.2 10.7M9.4 4.2l2.4 6.5"/></svg>')

VIZ_CSS = '''a.viz {
  display: inline-flex; align-items: center; justify-content: center;
  width: 19px; height: 18px; margin-left: 6px; vertical-align: 1px;
  border: 1px solid var(--accent-line); border-radius: 4px;
  color: var(--accent); background: var(--accent-wash);
  text-decoration: none; flex: none; position: relative; cursor: pointer;
  transition: background .13s ease, border-color .13s ease, color .13s ease;
}
a.viz svg { width: 11px; height: 11px; display: block; }
a.viz:hover, a.viz:focus-visible { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); }
a.viz[data-tip]::after {
  content: attr(data-tip);
  position: absolute; bottom: calc(100% + 7px); left: 50%; transform: translateX(-50%);
  background: var(--fg); color: var(--bg);
  font-family: var(--sans); font-size: 11px; font-weight: 450; letter-spacing: 0;
  padding: 5px 9px; border-radius: 4px; white-space: nowrap;
  opacity: 0; pointer-events: none; transition: opacity .12s ease; z-index: 30;
}
a.viz[data-tip]:hover::after, a.viz[data-tip]:focus-visible::after { opacity: 1; }
@media (max-width: 700px) { a.viz[data-tip]::after { display: none; } }
tr.done td.c-prob a.viz { opacity: .7; }

'''


def viz_files():
    """lc number -> filename, for every Visuals page named <lc>-<slug>.html"""
    out = {}
    for p in glob.glob("Visuals/*.html"):
        f = os.path.basename(p)
        m = re.match(r'^(\d+)-', f)
        if m:
            out.setdefault(int(m.group(1)), f)
    return out


def anchor(fname):
    tip = "Interactive visualizer"
    return ('<a class="viz" href="../Visuals/%s" target="_blank" rel="noopener" '
            'data-tip="%s" aria-label="%s" title="%s">%s</a>' % (fname, tip, tip, tip, SVG))


def main(apply):
    have = viz_files()
    grand = 0
    for path in PAGES:
        t = open(path, encoding="utf-8").read()
        before = t
        notes = []

        # CSS + print rule, if this page has never carried viz icons
        if "a.viz {" not in t:
            if "a.xref {" in t:
                t = t.replace("a.xref {", VIZ_CSS + "a.xref {", 1)
                notes.append("installed a.viz CSS")
            else:
                notes.append("!! no a.xref anchor to insert CSS before")
        if "a.viz { display: none; }" not in t and "  a.lc[href]::after {" in t:
            t = t.replace("  a.lc[href]::after {",
                          "  a.viz { display: none; }\n  a.lc[href]::after {", 1)
            notes.append("added print rule")

        added = []

        def fix(mm):
            row = mm.group(0)
            m = re.search(r'data-lc="(\d+)"', mm.group(1))
            if not m:
                return row
            lc = int(m.group(1))
            if lc not in have or 'class="viz"' in row:
                return row
            new = re.sub(r'(<a class="lc ptitle"[^>]*>.*?</a>|<span class="ptitle"[^>]*>.*?</span>)',
                         lambda x: x.group(1) + anchor(have[lc]), row, count=1, flags=re.S)
            if new != row:
                added.append(lc)
            return new

        t = re.sub(r'<tr\s([^>]*)>.*?</tr>', fix, t, flags=re.S)
        if added:
            notes.append("wired %d rows: %s" % (len(added), sorted(added)))
        grand += len(added)
        if apply and t != before:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(t)
        print("  %-34s %s" % (os.path.basename(path), "; ".join(notes) or "nothing to do"))
    print("\n%s %d anchors" % ("added" if apply else "WOULD add", grand))
    if not apply:
        print("(dry run — pass --apply to write)")


if __name__ == "__main__":
    main("--apply" in sys.argv)
