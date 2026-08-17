"""essay_check.py <page.html> [...] — the "essay survived" assertions."""
import re, sys

EXPECT = ['id="top"', 'id="s1"', 'id="s2"', 'id="s3"', 'id="s4"',
          'class="rail"', 'id="railList"', 'class="appbar"', 'class="tmpl"',
          '<div id="lab"></div>', 'tree-engine.css', 'tree-engine.js']

bad = 0
for p in sys.argv[1:]:
    t = open(p, encoding="utf-8").read()
    probs = []
    for e in EXPECT:
        if e not in t:
            probs.append("missing " + e)
    if t.count("<style>") != 1 or t.count("</style>") != 1:
        probs.append("style count %d/%d" % (t.count("<style>"), t.count("</style>")))
    if t.count("</html>") != 1:
        probs.append("</html> count %d" % t.count("</html>"))
    if t.count('id="lab"') != 1:
        probs.append('id="lab" count %d' % t.count('id="lab"'))
    if "VizKit.stepper" in t:
        probs.append("an old VizKit stepper is still driving something")
    if 'class="viz"' in t:
        probs.append('an old figure.viz block is still present')
    heads = re.findall(r'<h[234] class="(?:pattern|sec|sub)" id="([^"]+)"', t)
    if t.count("<script") - t.count("</script>") != 0:
        probs.append("unbalanced script tags")
    print("%-46s %s   headings: %s" % (p.split("/")[-1], "OK" if not probs else "!! " + "; ".join(probs), ",".join(heads)))
    bad += len(probs)
print("\n%d problem(s)" % bad)
sys.exit(1 if bad else 0)
