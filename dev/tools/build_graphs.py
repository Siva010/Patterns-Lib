"""Render graphs/src/graphs.md into the four Bundle 03 study pages.

The bundle pages are the markdown, rendered into the house page design. Nothing
is authored here that is not in the markdown: the generator adds structure
(ids, anchors, the rail, the progress checkboxes, cross-links) and never prose.

The page shell — the editorial stylesheet, the appbar, the search layer and the
whole behaviour script — is taken verbatim from a donor page so that a fix to the
house chrome propagates instead of forking. Only the storage namespace, the
titles and the navigation differ.

    python dev/tools/build_graphs.py            # dry run, reports sizes
    python dev/tools/build_graphs.py --apply

Refuses rather than guessing: if the donor does not have the expected markers,
or a problem row does not parse, nothing is written.
"""
import html
import io
import os
import re
import sys

MD = "graphs/src/graphs.md"
DONOR = "trees/bst.html"
OUTDIR = "graphs"

NS = "graphpat.v1."
BUNDLE = "Graphs, No Gaps"
SUBTITLE = ("Traversal &amp; Connectivity \u00b7 Ordering, Partitions &amp; Spanning Structure "
            "\u00b7 Weighted Paths")
DESCRIPTION = ("A complete FAANG-prep path through graphs: 31 sub-variants, 64 core problems, "
               "Java 21 templates, failure modes, a recognition guide and mastery gates.")

# pattern number -> (file, short nav label, rail label, page title, storage key, row context)
PATTERNS = {
    1: ("traversal.html", "Traversal", "Traversal &amp; Connectivity",
        "Traversal &amp; Connectivity", "gt", "Traversal & Connectivity"),
    2: ("ordering.html", "Ordering", "Ordering &amp; Partitions",
        "Ordering, Partitions &amp; Spanning Structure", "go", "Ordering & Partitions"),
    3: ("weighted-paths.html", "Weighted Paths", "Weighted Paths",
        "Weighted Paths &amp; Search on the Answer", "gw", "Weighted Paths"),
}
HUB = "index.html"

# LeetCode slugs that are not the kebab-case of the title as written in the doc.
SLUG_FIX = {
    1489: "find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree",
}

BADGE = {
    "core": ('<span class="badge core" data-tip="Core \u2014 must solve unaided before advancing" '
             'role="img" aria-label="Core \u2014 must solve unaided before advancing">\u2605</span>'),
    "opt": ('<span class="badge opt" data-tip="Optional depth \u2014 solve only if a gate check fails" '
            'role="img" aria-label="Optional depth \u2014 solve only if a gate check fails">\u25cb</span>'),
    "anti": ('<span class="badge anti" data-tip="Anti-pattern \u2014 the obvious machine is wrong here" '
             'role="img" aria-label="Anti-pattern \u2014 the obvious machine is wrong here">\u26a0\ufe0e</span>'),
    "pro": ('<span class="badge pro" data-tip="LeetCode Premium \u2014 subscription required" '
            'role="img" aria-label="LeetCode Premium \u2014 subscription required">PRO</span>'),
    "resolve": ('<span class="badge" data-tip="Re-solve of a problem listed earlier, under a different '
                'machine \u2014 not counted twice" role="img" aria-label="Re-solve of a problem listed '
                'earlier \u2014 not counted twice">\u21bb</span>'),
}


# ----------------------------------------------------------------- markdown

def read_blocks(text):
    """Split the markdown into (kind, payload) blocks."""
    lines = text.split("\n")
    blocks = []
    i = 0
    n = len(lines)
    while i < n:
        ln = lines[i]
        s = ln.strip()

        if not s:
            i += 1
            continue

        if s.startswith("```"):
            lang = s[3:].strip()
            body = []
            i += 1
            while i < n and not lines[i].strip().startswith("```"):
                body.append(lines[i])
                i += 1
            i += 1
            blocks.append(("code", (lang, "\n".join(body))))
            continue

        if re.match(r"^-{3,}$", s):
            blocks.append(("hr", None))
            i += 1
            continue

        m = re.match(r"^(#{1,4})\s+(.*)$", s)
        if m:
            blocks.append(("h%d" % len(m.group(1)), m.group(2).strip()))
            i += 1
            continue

        if s.startswith("|"):
            rows = []
            while i < n and lines[i].strip().startswith("|"):
                rows.append(lines[i].strip())
                i += 1
            blocks.append(("table", parse_table(rows)))
            continue

        if re.match(r"^[-*]\s+", s):
            items, i = collect_list(lines, i, r"^[-*]\s+")
            blocks.append(("ul", items))
            continue

        if re.match(r"^\d+\.\s+", s):
            items, i = collect_list(lines, i, r"^\d+\.\s+")
            blocks.append(("ol", items))
            continue

        para = []
        while i < n and lines[i].strip() and not lines[i].strip().startswith(("|", "#", "```", "- ")) \
                and not re.match(r"^-{3,}$", lines[i].strip()) \
                and not re.match(r"^\d+\.\s+", lines[i].strip()):
            para.append(lines[i].strip())
            i += 1
        blocks.append(("p", " ".join(para)))
    return blocks


def collect_list(lines, i, marker):
    """Gather a list, folding indented continuation lines into their item."""
    items = []
    n = len(lines)
    while i < n:
        raw = lines[i]
        s = raw.strip()
        if not s:
            nxt = lines[i + 1] if i + 1 < n else ""
            if re.match(marker, nxt.strip()) or (nxt.startswith(("  ", "\t")) and nxt.strip()):
                i += 1
                continue
            break
        m = re.match(marker, s)
        if m:
            items.append(s[m.end():])
            i += 1
            continue
        if raw.startswith((" ", "\t")) and items:
            items[-1] = items[-1] + " " + s
            i += 1
            continue
        break
    return items, i


def parse_table(rows):
    """(header, rows) with the alignment row dropped."""
    grid = []
    for r in rows:
        cells = r.strip().strip("|").split("|")
        grid.append([c.strip() for c in cells])
    if len(grid) >= 2 and all(re.match(r"^:?-{1,}:?$", c) or not c for c in grid[1]):
        return grid[0], grid[2:]
    return grid[0], grid[1:]


# ------------------------------------------------------------------ inline

SEC_RE = re.compile(r"\u00a7(\d)\.([A-Z])((?:\s*[/\u2013\u2014-]\s*[A-Z])?)")
SECNUM_RE = re.compile(r"\u00a7(\d)\.(\d)")
PROB_RE = re.compile(r"#(\d{1,3})\b")


def inline(s, ctx):
    """Markdown inline -> HTML.

    Code spans are lifted out to placeholders first, because emphasis routinely
    straddles one (`**`visited` is set on push**`) and splitting on backticks
    would leave the asterisks unpaired on both sides.
    """
    if not s:
        return ""
    spans = []

    def stash(m):
        spans.append('<code class="inl">%s</code>' % html.escape(m.group(1), quote=False))
        return "\x00%d\x00" % (len(spans) - 1)

    t = re.sub(r"`([^`]*)`", stash, s)
    t = html.escape(t, quote=False)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<!\*)\*([^*]+?)\*(?!\*)", r"<em>\1</em>", t)
    t = link_sections(t, ctx)
    t = link_problems(t, ctx)
    t = badges(t)
    return re.sub(r"\x00(\d+)\x00", lambda m: spans[int(m.group(1))], t)


GLYPH = {"★": "core", "○": "opt", "⚠︎": "anti", "⚠": "anti",
         "↻": "resolve"}
GLYPH_RE = re.compile("(" + "|".join(sorted(GLYPH, key=len, reverse=True)) + ")")


def badges(t):
    """The marker glyphs are the document's legend; render them as the house badge.

    One pass, so a badge's own glyph is never re-substituted.
    """
    if t.strip() == "PRO":
        return t.replace("PRO", BADGE["pro"])
    return GLYPH_RE.sub(lambda m: BADGE[GLYPH[m.group(1)]], t)


def other_bundle(text, at):
    """True when the reference just before `at` names a different bundle."""
    return "Bundle 0" in text[max(0, at - 22):at]


def link_sections(t, ctx):
    def sub(m):
        if other_bundle(t, m.start()):
            return m.group(0)
        pat, letter = int(m.group(1)), m.group(2)
        if pat not in PATTERNS:
            return m.group(0)
        href = "%s#s%d-2-%s" % (PATTERNS[pat][0], pat, letter.lower())
        if ctx["file"] == PATTERNS[pat][0]:
            href = href[href.index("#"):]
        return '<a class="xref" href="%s">%s</a>' % (href, m.group(0))

    def subnum(m):
        if other_bundle(t, m.start()):
            return m.group(0)
        pat, sec = int(m.group(1)), m.group(2)
        if pat in PATTERNS:
            href = "%s#s%d-%s" % (PATTERNS[pat][0], pat, sec)
        elif pat in (4, 5):
            href = "%s#s%d-%s" % (HUB, pat, sec)
        else:
            return m.group(0)
        if ctx["file"] == href.split("#")[0]:
            href = href[href.index("#"):]
        return '<a class="xref" href="%s">%s</a>' % (href, m.group(0))

    return SECNUM_RE.sub(subnum, SEC_RE.sub(sub, t))


def link_problems(t, ctx):
    def sub(m):
        num = int(m.group(1))
        info = ctx["problems"].get(num)
        if not info:
            return m.group(0)
        href = "%s#p%d" % (info["file"], num)
        if ctx["file"] == info["file"]:
            href = "#p%d" % num
        return '<a class="xref" href="%s" title="%s">%s</a>' % (
            href, html.escape(info["title"], quote=True), m.group(0))
    return PROB_RE.sub(sub, t)


# -------------------------------------------------------------------- java

JKEY = set("""abstract assert boolean break byte case catch char class const continue default do
double else enum extends final finally float for goto if implements import instanceof int
interface long native new package private protected public return short static strictfp super
switch synchronized this throw throws transient try void volatile while var record sealed
permits yield true false null""".split())

JTOK = re.compile(
    r"(//[^\n]*|/\*.*?\*/|\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\])*'"
    r"|@\w+|\b\d[\w.]*\b|\b[A-Za-z_$][\w$]*\b|.)", re.S)


def java(src):
    out = []
    for m in JTOK.finditer(src):
        tok = m.group(0)
        esc = html.escape(tok, quote=False)
        if tok.startswith("//") or tok.startswith("/*"):
            cls = "tok-com"
        elif tok[0] in "\"'":
            cls = "tok-str"
        elif tok.startswith("@"):
            cls = "tok-ann"
        elif tok[0].isdigit():
            cls = "tok-num"
        elif tok in JKEY:
            cls = "tok-key"
        elif re.match(r"^[A-Z][\w$]*$", tok):
            cls = "tok-typ"
        else:
            out.append(esc)
            continue
        out.append('<span class="%s">%s</span>' % (cls, esc))
    return "".join(out)


# ----------------------------------------------------------------- headings

def slugify(s):
    s = re.sub(r"<[^>]+>", "", s)
    s = s.replace("&amp;", "and")
    s = re.sub(r"[^\w\s-]", "", s, flags=re.U).strip().lower()
    return re.sub(r"[\s_]+", "-", s)


def heading(tag, cls, hid, inner, plain):
    return ('<h%s class="%s" id="%s" data-spy data-plain="%s">%s'
            '<a class="anchor" href="#%s" aria-label="Copy link to this section">#</a></h%s>'
            % (tag, cls, hid, html.escape(plain, quote=True), inner, hid, tag))


# -------------------------------------------------------------------- rows

def lc_slug(num, title):
    if num in SLUG_FIX:
        return SLUG_FIX[num]
    s = title.lower()
    s = s.replace("&", " and ")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def marker_of(cell):
    anti = "\u26a0" in cell
    star = "\u2605" in cell
    opt = "\u25cb" in cell
    if "\u21bb" in cell:
        return "resolve"
    if anti:
        return "anti"
    if star:
        return "core"
    if opt:
        return "opt"
    raise ValueError("unrecognised marker cell %r" % cell)


def problem_row(cells, pat, letter, ctx):
    num, lc, title, diff, mark, why = (cells + [""] * 6)[:6]
    kind = marker_of(mark)
    pro = "PRO" in mark
    key = PATTERNS[pat][4]
    ctxlabel = "%s \u00b7 %s" % (PATTERNS[pat][5], letter)

    title_txt = re.sub(r"\*", "", title).strip()
    single = re.match(r"^\d+$", lc.strip())
    # "547" + "Number of Provinces" -> "547. Number of Provinces"
    # "1293 / 864" + "(see §1.J)"   -> "1293 / 864 (see §1.J)", so search still finds it
    full = (("%s. %s" % (lc.strip(), title_txt)) if single
            else ("%s %s" % (lc.strip(), title_txt)).strip())

    badges = ""
    if kind == "anti":
        if "\u2605" in mark:
            badges += BADGE["core"]
        badges += BADGE["anti"]
    elif kind == "resolve":
        badges = BADGE["resolve"]
    else:
        badges = BADGE[kind]

    if single:
        lcnum = int(lc.strip())
        locked = ' data-locked="1"' if pro else ""
        prob = ('<a class="lc ptitle" href="https://leetcode.com/problems/%s/" target="_blank" '
                'rel="noopener" data-lcnum="%d"%s>%s</a>'
                % (lc_slug(lcnum, title_txt), lcnum, locked, html.escape(full, quote=False)))
    else:
        prob = inline(title, ctx)
        if lc.strip():
            prob = "<strong>%s</strong> %s" % (html.escape(lc.strip(), quote=False), prob)
    if pro:
        prob += " " + BADGE["pro"]

    diffcell = ('<span class="diff" data-d="%s">%s</span>' % (diff, diff)) if diff else ""

    if kind == "resolve":
        # A re-solve row points at a problem listed elsewhere, so it must never reach a
        # tally \u2014 "resolve" is not one of the shell's marker groups, so it never does.
        # It still needs a data-pid and the data-* the shell reads, or the row is
        # invisible to the search index and untouched by the filters, which leaves it
        # on screen under a filter that has hidden everything around it.
        ctx["nresolve"] += 1
        rid = "x-%s-%d" % (key, ctx["nresolve"] - 1)
        return ('<tr data-pid="%s" data-marker="resolve" data-anti="0" data-diff="%s" '
                'data-lc="%s" data-pattern="%s" data-title="%s" data-ctx="%s" id="%s" '
                'class="resolve">'
                '<td class="c-chk" data-label=""></td>'
                '<td class="c-num" data-label="No."><span class="n">\u2014</span>%s</td>'
                '<td class="c-prob" data-label="Problem">%s</td>'
                '<td class="c-diff" data-label="Difficulty">%s</td>'
                '<td class="c-sub" data-label="Sub-variant">%s</td>'
                '<td class="c-why" data-label="Why">%s</td></tr>'
                % (rid, diff, lc.strip() if single else "", key,
                   html.escape(full, quote=True), html.escape(ctxlabel, quote=True), rid,
                   badges, prob, diffcell, letter, inline(why, ctx)))

    pid = "p%s" % num.strip()
    esc_title = html.escape(full, quote=True)
    return ('<tr data-pid="%s" data-marker="%s" data-anti="%d" data-diff="%s" data-lc="%s" '
            'data-pattern="%s" data-title="%s" data-ctx="%s" id="%s"%s>'
            '<td class="c-chk" data-label=""><input class="chk" type="checkbox" '
            'aria-label="Mark %s as solved"></td>'
            '<td class="c-num" data-label="No."><span class="n">%s</span>%s</td>'
            '<td class="c-prob" data-label="Problem">%s</td>'
            '<td class="c-diff" data-label="Difficulty">%s</td>'
            '<td class="c-sub" data-label="Sub-variant">%s</td>'
            '<td class="c-why" data-label="Why">%s</td></tr>'
            % (pid, kind, 1 if kind == "anti" else 0, diff, lc.strip(), key,
               esc_title, html.escape(ctxlabel, quote=True), pid,
               ' class="anti"' if kind == "anti" else "",
               esc_title, num.strip(), badges, prob, diffcell, letter, inline(why, ctx)))


PROBLEM_HEAD = ("#", "LC", "Problem", "Diff", "", "Teaches")

COLGROUP = ('<colgroup><col class="c-chk"><col class="c-num"><col class="c-prob">'
            '<col class="c-diff"><col class="c-sub"><col></colgroup>')
THEAD = ('<thead><tr><th scope="col"><span class="vh">Solved</span></th><th scope="col">#</th>'
         '<th scope="col">Problem</th><th scope="col">Diff</th><th scope="col">Sub-variant</th>'
         '<th scope="col">Why it&#39;s essential</th></tr></thead>')


def render_table(head, rows, pat, letter, ctx):
    if tuple(head) == PROBLEM_HEAD:
        body = "".join(problem_row(r, pat, letter, ctx) for r in rows)
        return ('<div class="tablewrap" data-hascount data-empty="false">'
                '<p class="tcount" aria-live="polite"></p><p class="emptynote"></p>'
                '<table class="problems">%s%s<tbody>%s</tbody></table></div>'
                % (COLGROUP, THEAD, body))

    th = "".join('<th scope="col">%s</th>' % inline(h, ctx) for h in head)
    trs = []
    for r in rows:
        tds = "".join('<td data-label="%s">%s</td>'
                      % (html.escape(re.sub(r"<[^>]+>", "", inline(head[i] if i < len(head) else "",
                                                                   ctx)), quote=True),
                         inline(c, ctx))
                      for i, c in enumerate(r))
        trs.append("<tr>%s</tr>" % tds)
    return ('<div class="tablewrap"><table class="plain"><thead><tr>%s</tr></thead>'
            '<tbody>%s</tbody></table></div>' % (th, "".join(trs)))


# ------------------------------------------------------------------- pages

def collect_problems(blocks):
    """number -> {file, title} for every numbered problem row in the document."""
    out = {}
    pat = None
    for kind, payload in blocks:
        if kind == "h2":
            m = re.match(r"^(\d)\s+\u2014", payload)
            pat = int(m.group(1)) if m and int(m.group(1)) in PATTERNS else None
        elif kind == "table" and pat:
            head, rows = payload
            if tuple(head) != PROBLEM_HEAD:
                continue
            for r in rows:
                num, lc, title = (r + [""] * 3)[:3]
                if not re.match(r"^\d+$", num.strip()):
                    continue
                t = re.sub(r"\*", "", title).strip()
                full = "%s. %s" % (lc.strip(), t) if re.match(r"^\d+$", lc.strip()) else t
                out[int(num)] = {"file": PATTERNS[pat][0], "title": full}
    return out


def render(blocks, want, problems):
    """Render the blocks belonging to `want` (a pattern number, or 'hub')."""
    file = HUB if want == "hub" else PATTERNS[want][0]
    ctx = {"file": file, "problems": problems, "nresolve": 0}
    # Template open/closed state is stored per bundle as NS + "tmpl." + tid, so a tid
    # that repeats on another page makes the two templates share one saved state.
    tidpre = "gx" if want == "hub" else "g%d" % want
    out = []
    toc = []           # rail entries: (level, id, label, letter)
    pat = None         # pattern currently being read
    sec = None         # current N.X section number
    letter = None
    tid = [0]
    in_scope = (want == "hub")
    prev_head = None

    for kind, payload in blocks:
        if kind == "h1":
            if want == "hub":
                out.append('<h1 id="top" data-plain="%s">%s</h1>'
                           % (html.escape(payload, quote=True),
                              html.escape(payload, quote=False).replace(" No", "&nbsp;No")))
            prev_head = "h1"
            continue

        if kind == "h2":
            m = re.match(r"^(\d)\s+\u2014\s+(.*)$", payload)
            if m and int(m.group(1)) in PATTERNS:
                pat, sec, letter = int(m.group(1)), None, None
                in_scope = (want == pat)
                if in_scope:
                    hid = "pattern-%d-%s" % (pat, slugify(m.group(2)))
                    text = "PATTERN %d \u2014 %s" % (pat, html.escape(m.group(2), quote=False))
                    out.append(heading("2", "pattern", hid, text,
                                       "PATTERN %d \u2014 %s" % (pat, m.group(2))))
                prev_head = "h2"
                continue
            pat, letter = None, None
            in_scope = (want == "hub")
            if in_scope:
                if m:                                    # 4 — RECOGNITION GUIDE, 5 — …
                    sec = int(m.group(1))
                    hid = "%d-%s" % (sec, slugify(m.group(2)))
                    out.append(heading("2", "pattern", hid, inline(payload, ctx), payload))
                    toc.append(("grp", "g%d" % sec, payload, None))
                else:
                    sec = None
                    hid = slugify(payload)
                    out.append(heading("3", "sec", hid, inline(payload, ctx), payload))
                    toc.append(("sec", hid, payload, None))
            prev_head = "h2"
            continue

        if kind == "h3":
            m = re.match(r"^(\d)\.(\d)\s+(.*)$", payload)
            if m:
                num, sub, title = int(m.group(1)), m.group(2), m.group(3)
                if num in PATTERNS:
                    pat, letter = num, None
                    in_scope = (want == num)
                else:
                    in_scope = (want == "hub")
                if in_scope:
                    hid = "s%d-%s" % (num, sub)
                    out.append(heading("3", "sec", hid, inline(payload, ctx), payload))
                    toc.append(("sec", hid, payload, None))
            else:
                in_scope = (want == "hub")
                if in_scope:
                    hid = slugify(payload)
                    out.append(heading("3", "sec", hid, inline(payload, ctx), payload))
                    toc.append(("sec", hid, payload, None))
                letter = None
            prev_head = "h3"
            continue

        if kind == "h4":
            m = re.match(r"^(\d)\.([A-Z])\s+\u2014\s+(.*)$", payload)
            if not m:
                raise ValueError("unexpected h4 %r" % payload)
            num, letter, title = int(m.group(1)), m.group(2), m.group(3)
            in_scope = (want == num)
            if in_scope:
                hid = "s%d-2-%s" % (num, letter.lower())
                inner = ('<span class="letter">%s</span>%s'
                         % (letter, inline(title, ctx)))
                out.append(heading("4", "sub", hid, inner, "%s \u2014 %s" % (letter, title)))
                toc.append(("sub", hid, title, letter))
            prev_head = "h4"
            continue

        if not in_scope:
            prev_head = None
            continue

        if kind == "hr":
            out.append('<hr class="rule">')
        elif kind == "p":
            body = payload
            lone_em = re.match(r"^\*([^*].*)\*$", body)
            if lone_em and prev_head in ("h2", "h3", "h4"):
                out.append('<div class="intuition"><span class="ibulb" aria-hidden="true">'
                           '&#9679;</span><p>%s</p></div>' % inline(lone_em.group(1), ctx))
            else:
                out.append("<p>%s</p>" % inline(body, ctx))
        elif kind == "ul":
            out.append('<ul class="md">%s</ul>'
                       % "".join("<li>%s</li>" % inline(i, ctx) for i in payload))
        elif kind == "ol":
            out.append('<ol class="md">%s</ol>'
                       % "".join("<li>%s</li>" % inline(i, ctx) for i in payload))
        elif kind == "table":
            head, rows = payload
            out.append(render_table(head, rows, pat, letter, ctx))
        elif kind == "code":
            lang, src = payload
            tid[0] += 1
            first = src.split("\n")[0].strip()
            hint = first[2:].strip() if first.startswith("//") else ""
            nlines = len([l for l in src.split("\n") if l.strip()])
            out.append('<details class="tmpl" data-tid="%st%d" open><summary>'
                       '<span class="arw" aria-hidden="true">\u25b6</span>'
                       '<span class="tw">%s</span><span class="hint">%s</span>'
                       '<span class="cnt">%d lines</span>'
                       '<button class="copy" type="button" aria-label="Copy this template to the '
                       'clipboard">Copy</button></summary><div class="code"><pre><code>%s</code>'
                       '</pre></div></details>'
                       % (tidpre, tid[0], "Java" if lang in ("java", "") else html.escape(lang),
                          html.escape(hint, quote=False), nlines, java(src)))
        prev_head = None

    return "\n".join(out), toc


# --------------------------------------------------------------------- rail

def rail(page, toc):
    pages = [(HUB, "\u2302", "Home")] + [
        (PATTERNS[i][0], "%02d" % i, PATTERNS[i][2]) for i in (1, 2, 3)]
    plist = "".join(
        '<li><a class="pageline %s" href="%s"%s><span class="pn">%s</span>%s</a></li>'
        % ("on" if f == page else "", f, ' aria-current="page"' if f == page else "", pn, label)
        for f, pn, label in pages)

    if page == HUB:
        top = '<li><a class="toplink" href="#top">Title &amp; how to read</a></li>'
    else:
        top = '<li><a class="toplink" href="index.html#top">Title &amp; how to read</a></li>'

    items = []
    if page == HUB:
        front = [t for t in toc if t[0] == "sec" and not re.match(r"^s\d-\d$", t[1])
                 and t[1] == "how-to-read-the-tables"]
        if front:
            items.append('<li class="grp" data-grp="g0"><button type="button" aria-expanded="true">'
                         '<span class="caret" aria-hidden="true">\u25bc</span><span>Front matter</span>'
                         '</button><ul><li><a href="#%s">%s</a></li></ul></li>'
                         % (front[0][1], html.escape(front[0][2], quote=False)))
        group, kids = None, []
        for t in toc:
            if t[0] == "grp":
                if group:
                    items.append(grp_html(group, kids))
                group, kids = t, []
            elif group and t[1] != "how-to-read-the-tables":
                kids.append(t)
        if group:
            items.append(grp_html(group, kids))
    else:
        pat = [k for k, v in PATTERNS.items() if v[0] == page][0]
        label = "PATTERN %d \u2014 %s" % (pat, PATTERNS[pat][3].upper())
        head = ('<button type="button" aria-expanded="true"><span class="caret" aria-hidden="true">'
                '\u25bc</span><span>%s</span><span class="tally" data-pattern="%s"></span></button>'
                % (label, PATTERNS[pat][4]))
        items.append('<li class="grp" data-grp="g%d">%s<ul>%s</ul></li>'
                     % (pat, head, "".join(toc_link(t) for t in toc)))

    return plist, top + "".join(items)


def grp_html(group, kids):
    return ('<li class="grp" data-grp="%s"><button type="button" aria-expanded="true">'
            '<span class="caret" aria-hidden="true">\u25bc</span><span>%s</span></button>'
            '<ul>%s</ul></li>'
            % (group[1], html.escape(group[2], quote=False), "".join(toc_link(t) for t in kids)))


def toc_link(t):
    level, hid, label, letter = t
    if level == "sub":
        return ('<li><a href="#%s" style="padding-left:37px"><span class="sv">%s</span>%s</a></li>'
                % (hid, letter, html.escape(label, quote=False)))
    return '<li><a href="#%s">%s</a></li>' % (hid, html.escape(label, quote=False))


# -------------------------------------------------------------------- shell

def donor_parts():
    t = io.open(DONOR, encoding="utf-8").read()
    for marker in ("<body>", '<main id="main">', "</main>"):
        if marker not in t:
            raise SystemExit("donor %s has no %s \u2014 refusing" % (DONOR, marker))
    head = t[:t.index("<body>") + len("<body>")]
    tail = t[t.rindex("</main>") + len("</main>"):]

    head = head.replace("treepat.v1.", NS)
    head = re.sub(r"<title>.*?</title>", "<title>{{TITLE}}</title>", head, flags=re.S)
    head = re.sub(r'(<meta name="description" content=")[^"]*(">)',
                  r"\g<1>" + DESCRIPTION + r"\g<2>", head)
    head = head.replace("Three Patterns, No Gaps \u2014 editorial stylesheet",
                        "Graphs, No Gaps \u2014 editorial stylesheet")

    tail = tail.replace("treepat.v1.", NS)
    tail = tail.replace("Trees, No Gaps \u2014 behaviour", BUNDLE + " \u2014 behaviour")
    return head, tail


CHROME = '''

<a class="skip" href="#main">Skip to content</a>

<header class="appbar">
  <button class="iconbtn" id="tocBtn" type="button" aria-expanded="false" aria-controls="rail" aria-label="Toggle table of contents">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
  </button>
  <a class="brand" href="index.html">{BUNDLE} <span class="dim">\u2014 {SUBTITLE}</span></a>
  <nav class="pnavwrap" aria-label="Patterns">{PNAV}</nav>
  <a class="liblink" href="../index.html" title="All study bundles"><span aria-hidden="true">\u2190</span><span class="liblbl">Library</span></a>
  <button class="iconbtn" id="searchBtn" type="button" aria-haspopup="dialog" aria-expanded="false" aria-label="Search problems and sections">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
    <span class="lbl">Search</span><span class="kbd">/</span>
  </button>
  <button class="iconbtn" id="themeBtn" type="button" aria-label="Switch theme">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.4"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6"/></svg>
    <span class="lbl">Auto</span>
  </button>
  <div class="progress" aria-hidden="true"><i id="progressBar"></i></div>
</header>

<div class="scrim" id="scrim"></div>

<div class="layout">
  <nav class="rail" id="rail" aria-label="Table of contents" data-shown="false">
    <h2>Documents</h2>
    <ul class="pagelist">{PAGELIST}</ul>
    <h2 class="secondhead">On this page</h2>
    <ul>
      {TOC}
    </ul>
<div class="railfoot">
      <p class="pagecount" id="pageCount" aria-live="polite"></p>
      <p>Checkbox state, filters, theme and open templates are stored in this browser only.</p>
      <p class="storagenote" id="storageNote" hidden></p>
      <div class="railio"><button type="button" id="exportBtn">Export progress</button><button type="button" id="importBtn">Import progress</button><input type="file" id="importFile" accept="application/json,.json" hidden></div>
      <button type="button" id="resetBtn">Reset solved progress</button>
    </div>
  </nav>

  <main id="main">
    <div class="wrap">'''


def pnav(page):
    out = ['<a class="pnav %s" href="%s"%s>Home</a>'
           % ("on" if page == HUB else "", HUB, ' aria-current="page"' if page == HUB else "")]
    for i in (1, 2, 3):
        f, short = PATTERNS[i][0], PATTERNS[i][1]
        out.append('<a class="pnav %s" href="%s"%s>%s</a>'
                   % ("on" if f == page else "", f,
                      ' aria-current="page"' if f == page else "", short))
    return "".join(out)


def build_page(page, title, body, toc, head, tail):
    plist, tochtml = rail(page, toc)
    chrome = (CHROME.replace("{BUNDLE}", BUNDLE).replace("{SUBTITLE}", SUBTITLE)
              .replace("{PNAV}", pnav(page)).replace("{PAGELIST}", plist)
              .replace("{TOC}", tochtml))
    return head.replace("{{TITLE}}", title) + chrome + "\n" + body + "\n    </div>\n  </main>\n" + tail


def main():
    apply = "--apply" in sys.argv
    if not os.path.exists(MD):
        raise SystemExit("run from the repository root \u2014 %s not found" % MD)

    text = io.open(MD, encoding="utf-8").read()
    blocks = read_blocks(text)
    problems = collect_problems(blocks)
    head, tail = donor_parts()

    targets = [("hub", HUB, BUNDLE)]
    for i in (1, 2, 3):
        targets.append((i, PATTERNS[i][0], "%s \u2014 %s" % (PATTERNS[i][2], BUNDLE)))

    for want, fname, title in targets:
        body, toc = render(blocks, want, problems)
        out = build_page(fname, title, body, toc, head, tail)
        path = os.path.join(OUTDIR, fname)
        print("%-22s %7d bytes  %3d toc entries" % (fname, len(out), len(toc)))
        if apply:
            io.open(path, "w", encoding="utf-8", newline="\n").write(out)

    core = sorted(n for n, i in problems.items())
    print("\n%d numbered problems parsed (1..%d)" % (len(core), max(core)))
    if not apply:
        print("dry run \u2014 pass --apply to write")


if __name__ == "__main__":
    main()
