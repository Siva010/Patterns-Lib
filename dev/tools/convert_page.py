"""Perform the mechanical edits that turn an essay page into a lab page.

Five edits, nothing else:
  1. <link rel="stylesheet" href="tree-engine.css">  before </head>
  2. <script src="tree-engine.js"></script>          before </head>
  3. the old <figure class="viz" ...>...</figure>    ->  <div id="lab"></div>
  4. the inline driver <script> that fed it          ->  removed
  5. the adapter appended before </body>

Refuses rather than guessing: if the figure or the driver cannot be identified
unambiguously, nothing is written. Idempotent — a page that already has an
adapter is left alone.

    python convert_page.py <page.html> <adapter.html> --driver-start <line>
"""
import re
import sys


def find_figure(lines):
    """(start, end) 0-based inclusive of the <figure class="viz"...>...</figure>"""
    start = None
    for i, ln in enumerate(lines):
        if start is None and re.search(r'<figure[^>]*class="viz"', ln):
            start = i
        elif start is not None and "</figure>" in ln:
            return start, i
    return None


def convert(page, adapter, driver_start):
    src = open(page, encoding="utf-8").read()
    if ".mount(" in src:
        print("  %s already has an adapter — refusing" % page)
        return False

    lines = src.split("\n")

    fig = find_figure(lines)
    if not fig:
        print("  could not find a <figure class=\"viz\"> block — refusing")
        return False

    # the driver script: from the given 1-based line to its closing </script>
    ds = driver_start - 1
    if not lines[ds].lstrip().startswith("<script"):
        print("  line %d is not a <script> open — refusing" % driver_start)
        return False
    de = None
    for i in range(ds, len(lines)):
        if "</script>" in lines[i]:
            de = i
            break
    if de is None:
        print("  driver script has no </script> — refusing")
        return False
    if ds <= fig[1]:
        print("  driver script overlaps the figure — refusing")
        return False

    adp = open(adapter, encoding="utf-8").read().strip()
    if not (adp.startswith("<script>") and adp.endswith("</script>")):
        print("  adapter is not a single <script> block — refusing")
        return False

    # rebuild bottom-up so earlier indices stay valid
    out = list(lines)
    del out[ds:de + 1]
    out[fig[0]:fig[1] + 1] = ['<div id="lab"></div>']
    body = "\n".join(out)

    if "tree-engine.css" not in body:
        body = body.replace(
            "</head>",
            '<link rel="stylesheet" href="tree-engine.css">\n'
            '<script src="tree-engine.js"></script>\n</head>', 1)

    ix = body.rfind("</body>")
    body = body[:ix] + adp + "\n\n" + body[ix:]

    open(page, "w", encoding="utf-8").write(body)
    print("  %s: figure %d-%d -> #lab, driver %d-%d removed, adapter appended"
          % (page.split("/")[-1], fig[0] + 1, fig[1] + 1, driver_start, de + 1))
    return True


if __name__ == "__main__":
    a = sys.argv
    ds = int(a[a.index("--driver-start") + 1])
    sys.exit(0 if convert(a[1], a[2], ds) else 1)
