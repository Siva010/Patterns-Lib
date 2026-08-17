"""Splice a saved adapter <script> block into its page, just before </body>.

Idempotent: if the page already contains a .mount( call it refuses, so running
this twice cannot produce two adapters.

    python splice.py <page.html> <adapter.html>
"""
import sys


def splice(page, adapter):
    t = open(page, encoding="utf-8").read()
    if ".mount(" in t:
        print("  %s already has an adapter — refusing" % page)
        return False
    a = open(adapter, encoding="utf-8").read().strip()
    if not a.startswith("<script>") or not a.endswith("</script>"):
        print("  %s is not a single <script> block — refusing" % adapter)
        return False
    ix = t.rfind("</body>")
    if ix < 0:
        print("  %s has no </body> — refusing" % page)
        return False
    out = t[:ix] + a + "\n" + t[ix:]
    open(page, "w", encoding="utf-8").write(out)
    print("  spliced %d bytes of adapter into %s" % (len(a), page))
    return True


if __name__ == "__main__":
    ok = splice(sys.argv[1], sys.argv[2])
    sys.exit(0 if ok else 1)
