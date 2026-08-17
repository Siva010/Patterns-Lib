"""Restyle the 36 incoming playground visualizers onto the house design system.

Strategy: don't rewrite each page's component CSS (35 different vocabularies).
Instead:
  1. swap the :root token block for house tokens + a 6-role semantic palette
  2. alias every old token name onto a new role, so component rules keep working
  3. substitute the ~20 hardcoded hexes that sit outside :root
  4. append a "house corrections" block that forces the chrome bits
"""
import re, json, os, sys

ROOT = r'''
:root {
  --serif: "Source Serif 4", "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
  --sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;

  --bg: #fbfaf8; --bg-sunk: #f4f2ed; --bg-code: #f6f4ef;
  --fg: #17171a; --fg-mid: #4a4842; --fg-dim: #6d6b64;
  --rule: #e3dfd7; --rule-hard: #cbc5b8;
  --accent: #9c3a1c; --accent-fg: #ffffff;
  --accent-wash: rgba(156,58,28,.07); --accent-line: rgba(156,58,28,.30);

  --t-key: #7c3aad; --t-typ: #1d5b7a; --t-str: #46682a;
  --t-num: #8a4b12; --t-com: #83807a; --t-ann: #8a4b12;

  /* ---- semantic pointer roles ------------------------------------
     anchor  fixed pointer (i, mid, pivot)     anchor2  second fixed (j)
     left    left / lo                         right    right / hi
     window  the live span between pointers    hit      found / recorded best
     A discarded cell gets no hue at all: dim + dashed, not alarm-red.
     Every role clears 4.5:1 on both --bg and --bg-sunk, both themes.
     ---------------------------------------------------------------- */
  --r-anchor:  #9c3a1c; --r-anchor-wash:  rgba(156,58,28,.10);  --r-anchor-line:  rgba(156,58,28,.42);
  --r-anchor2: #a8306b; --r-anchor2-wash: rgba(168,48,107,.10); --r-anchor2-line: rgba(168,48,107,.42);
  --r-left:    #2f5fa8; --r-left-wash:    rgba(47,95,168,.10);  --r-left-line:    rgba(47,95,168,.42);
  --r-right:   #6b3a8f; --r-right-wash:   rgba(107,58,143,.10); --r-right-line:   rgba(107,58,143,.42);
  --r-window:  #12666e; --r-window-wash:  rgba(18,102,110,.10); --r-window-line:  rgba(18,102,110,.42);
  --r-hit:     #1f6b52; --r-hit-wash:     rgba(31,107,82,.10);  --r-hit-line:     rgba(31,107,82,.42);

  /* recursion-depth ramp (generalized kSum): sequential, not categorical */
  --lvl0: #9c3a1c; --lvl1: #b05c33; --lvl2: #c07d54; --lvl3: #cc9c7c;
  --lvl0-deep: rgba(156,58,28,.12); --lvl1-deep: rgba(176,92,51,.12);
  --lvl2-deep: rgba(192,125,84,.12); --lvl3-deep: rgba(204,156,124,.12);

  /* ---- aliases: old token names -> new roles --------------------- */
  --ink: var(--bg); --ink-2: var(--bg-sunk); --panel: var(--bg); --panel-2: var(--bg-sunk);
  --line: var(--rule); --line-soft: var(--rule);
  --txt: var(--fg); --muted: var(--fg-mid); --muted-2: var(--fg-dim);
  --display: var(--sans);

  --gold:   var(--r-anchor);  --gold-deep:   var(--r-anchor-wash);
  --amber:  var(--r-anchor);  --amber-deep:  var(--r-anchor-wash);
  --rose:   var(--r-anchor2); --rose-deep:   var(--r-anchor2-wash);
  --blue:   var(--r-left);    --blue-deep:   var(--r-left-wash);
  --violet: var(--r-right);   --violet-deep: var(--r-right-wash);
  --mint:   var(--r-hit);     --mint-deep:   var(--r-hit-wash);
  --lime:   var(--r-window);  --lime-deep:   var(--r-window-wash);
  --sky:    var(--r-window);  --sky-deep:    var(--r-window-wash);
  --slate:  var(--r-window-wash);
  --coral:  var(--fg-dim);    --coral-deep:  var(--bg-sunk);

  /* structural, not semantic */
  --node: var(--bg-sunk); --node-line: var(--rule-hard); --dummy: var(--fg-dim);
  --bar: var(--rule-hard); --bar-line: var(--rule-hard);
  --water: var(--r-left); --water-soft: var(--r-left-wash);
  /* Dutch national flag buckets map onto the lo / mid / hi pointers */
  --red: var(--r-left);  --red-deep: var(--r-left-wash);
  --white: var(--fg-dim); --white-deep: var(--bg-sunk);
  --navy: var(--r-right); --navy-deep: var(--r-right-wash);
}

html[data-theme="dark"] {
  --bg: #121213; --bg-sunk: #1a1a1c; --bg-code: #1a1a1c;
  --fg: #e9e7e2; --fg-mid: #b8b4ac; --fg-dim: #93908a;
  --rule: #2b2b2e; --rule-hard: #3d3d41;
  --accent: #e3865f; --accent-fg: #16120f;
  --accent-wash: rgba(227,134,95,.10); --accent-line: rgba(227,134,95,.34);

  --t-key: #c191e8; --t-typ: #7bb8d6; --t-str: #9dc271;
  --t-num: #e0a86a; --t-com: #7c7a74; --t-ann: #e0a86a;

  --r-anchor:  #e3865f; --r-anchor-wash:  rgba(227,134,95,.14);  --r-anchor-line:  rgba(227,134,95,.46);
  --r-anchor2: #f091bd; --r-anchor2-wash: rgba(240,145,189,.14); --r-anchor2-line: rgba(240,145,189,.46);
  --r-left:    #7fb0f0; --r-left-wash:    rgba(127,176,240,.14); --r-left-line:    rgba(127,176,240,.46);
  --r-right:   #bd94e8; --r-right-wash:   rgba(189,148,232,.14); --r-right-line:   rgba(189,148,232,.46);
  --r-window:  #63c6d4; --r-window-wash:  rgba(99,198,212,.14);  --r-window-line:  rgba(99,198,212,.46);
  --r-hit:     #5fc9a3; --r-hit-wash:     rgba(95,201,163,.14);  --r-hit-line:     rgba(95,201,163,.46);

  --lvl0: #e3865f; --lvl1: #d9a184; --lvl2: #c9b3a0; --lvl3: #b8bdbb;
  --lvl0-deep: rgba(227,134,95,.16); --lvl1-deep: rgba(217,161,132,.16);
  --lvl2-deep: rgba(201,179,160,.16); --lvl3-deep: rgba(184,189,187,.16);
}
'''

# hardcoded hexes that live outside :root -> the token they should have been
HEX = {
  # green / found
  '#164e46':'var(--r-hit-line)', '#1c5b52':'var(--r-hit-line)', '#0f2f2c':'var(--r-hit-wash)',
  # blue / left
  '#0f1f3a':'var(--r-left-wash)', '#294066':'var(--r-window-line)', '#0f2740':'var(--bg-sunk)',
  # violet / right
  '#1c1430':'var(--r-right-wash)', '#3a2c58':'var(--r-right-line)',
  # amber / anchor
  '#4a3d17':'var(--r-anchor-line)',
  # teal / window
  '#1c4a5b':'var(--r-window-line)', '#3d4a1f':'var(--r-window-line)',
  # miss / fail borders
  '#4a2017':'var(--rule-hard)', '#5b1c1c':'var(--rule-hard)',
  '#5a221c':'var(--rule-hard)', '#4a1c17':'var(--rule-hard)',
  # text sitting on a filled chip
  '#04121f':'var(--accent-fg)', '#100420':'var(--accent-fg)', '#2b1a00':'var(--accent-fg)',
  '#1a2400':'var(--accent-fg)', '#052420':'var(--accent-fg)', '#2b0704':'var(--accent-fg)',
  '#04122b':'var(--accent-fg)', '#04202b':'var(--accent-fg)',
  # code pane
  '#3f5170':'var(--fg-dim)', '#c6d4ee':'var(--fg-mid)', '#ff9db1':'var(--t-key)',
  '#7fd0ff':'var(--t-typ)', '#f6c453':'var(--t-ann)',
}

CORRECTIONS = '''
/* ============================================================
   house corrections — these win over whatever the page set
   locally, so the chrome matches the study documents.
   ============================================================ */
html, body { background: var(--bg); color: var(--fg); }
body { font-family: var(--serif); font-size: 17px; line-height: 1.6; max-width: 1180px; padding: 0 24px 72px; }
h1 { font-family: var(--serif); font-weight: 600; letter-spacing: -.012em; }
h1 .thin { color: var(--fg-dim); font-weight: 400; }
.lede { font-family: var(--serif); color: var(--fg-mid); font-size: 17px; }

.appbar { display:flex; align-items:center; gap:14px; padding:14px 0 13px; margin-bottom:30px;
  border-bottom:1px solid var(--rule); font-family:var(--sans); font-size:13px; }
.appbar a.back { color: var(--accent); text-decoration: none; }
.appbar a.back:hover { text-decoration: underline; }
.appbar .spacer { flex: 1; }
.themebtn { font-family:var(--sans); font-size:12.5px; color:var(--fg-mid); background:transparent;
  border:1px solid var(--rule-hard); border-radius:7px; padding:5px 11px; cursor:pointer; }
.themebtn:hover { border-color: var(--accent-line); color: var(--accent); }

.eyebrow { font-family:var(--sans); font-size:11.5px; font-weight:600; letter-spacing:.09em;
  text-transform:uppercase; color:var(--fg-dim); }
.eyebrow .tag { font-family:var(--mono); font-weight:500; letter-spacing:.04em; text-transform:none;
  color:var(--accent); background:var(--accent-wash); border:1px solid var(--accent-line); }

input[type=text] { background:var(--bg-sunk); border:1px solid var(--rule-hard); color:var(--fg);
  border-radius:9px; font-size:15px; }
input[type=text]:focus { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-wash); }

.btn { font-family:var(--sans); font-weight:500; border:1px solid var(--rule-hard);
  background:var(--bg-sunk); color:var(--fg); border-radius:9px; height:46px; }
.btn:hover { background:var(--bg-sunk); border-color:var(--accent-line); color:var(--accent); }
.btn.primary { background:var(--accent); color:var(--accent-fg); border-color:var(--accent); font-weight:600; }
.btn.primary:hover { filter:brightness(1.08); color:var(--accent-fg); }
.btn:disabled:hover { border-color:var(--rule-hard); color:var(--fg); }

.chip { background:var(--bg-sunk); border:1px solid var(--rule); color:var(--fg-mid); }
.chip:hover { color:var(--accent); border-color:var(--accent-line); background:var(--accent-wash); }
.chip b { font-family:var(--sans); color:var(--fg-dim); }

.card { background:var(--bg); border:1px solid var(--rule-hard); border-radius:12px; }
.card-head { background:var(--bg-sunk); border-bottom:1px solid var(--rule); }
.card-head h2 { font-family:var(--sans); font-size:11.5px; font-weight:600; letter-spacing:.09em; color:var(--fg-dim); }
.transport { background:var(--bg-sunk); border-top:1px solid var(--rule); }
.legend { border-top:1px solid var(--rule); font-family:var(--sans); color:var(--fg-dim); }
.foot { font-family:var(--sans); color:var(--fg-dim); border-top:1px solid var(--rule);
  margin-top:24px; padding-top:18px; }

.message { font-family:var(--sans); font-size:14px; color:var(--fg-mid); }
.message b { color:var(--fg); }
.message .x, .lede .x { color:var(--fg-dim); }

.progress { background:var(--bg); border:1px solid var(--rule); }
.progress .bar { background:var(--accent); }
.step-count { color:var(--fg-dim); }
.speed { font-family:var(--sans); font-weight:600; letter-spacing:.09em; color:var(--fg-dim); }
.speed input { accent-color:var(--accent); }

.code { background:var(--bg-code); }
.code .tx { color:var(--fg-mid); }
.code .ln .no { color:var(--fg-dim); opacity:.65; }
.code .ln.exec { background:var(--accent-wash); }
.code .ln.exec .no { color:var(--accent); opacity:1; }
.code .ln.exec::before { background:var(--accent); width:2.5px; top:1px; bottom:1px; height:auto; }

/* a discarded cell recedes; it does not shout */
.cell.skipped, .cell.dupskip, .cell.mismatch, .cell.bad {
  border-style:dashed; border-color:var(--fg-dim); color:var(--fg-dim); background:var(--bg-sunk); }
.cell.skipped { opacity:.38; border-color:var(--rule); }

@media (prefers-reduced-motion: reduce) { .cell, .progress .bar { transition:none !important; } }
'''

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
 '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
 '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" media="print" onload="this.media=\'all\'">\n'
 '<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"></noscript>')

BOOT = '''<script>
/* set the theme before first paint. shares tpswbs.v1.theme with the
   three-patterns bundle so the setting carries across the doc -> viz seam. */
(function(){try{var p=JSON.parse(localStorage.getItem("tpswbs.v1.theme")||'"auto"');
var d=window.matchMedia("(prefers-color-scheme: dark)").matches;
document.documentElement.setAttribute("data-theme",p==="auto"?(d?"dark":"light"):p);}catch(e){}})();
</script>'''

TOGGLE = '''
<script>
(function(){
  var order=["auto","light","dark"], btn=document.getElementById("themeBtn");
  function cur(){try{return JSON.parse(localStorage.getItem("tpswbs.v1.theme")||'"auto"');}catch(e){return "auto";}}
  function apply(t){
    var d=window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme",t==="auto"?(d?"dark":"light"):t);
    if(btn) btn.textContent="Theme: "+t;
  }
  apply(cur());
  if(btn) btn.addEventListener("click",function(){
    var t=order[(order.indexOf(cur())+1)%order.length];
    try{localStorage.setItem("tpswbs.v1.theme",JSON.stringify(t));}catch(e){}
    apply(t);
  });
})();
</script>'''

APPBAR = ('\n<header class="appbar">\n'
          '  <a class="back" href="index.html">&larr; Visualizers</a>\n'
          '  <span class="spacer"></span>\n'
          '  <button class="themebtn" id="themeBtn" type="button">Theme</button>\n'
          '</header>\n')


def restyle(path):
    t = open(path, encoding="utf-8").read()
    s, e = t.index("<style>"), t.index("</style>")
    head, css, tail = t[:s], t[s + 7:e], t[e:]

    # 1. swap :root for the house tokens
    root = re.search(r':root\s*\{[^}]*\}', css)
    css = css[:root.start()] + ROOT + css[root.end():]

    # 2. kill gradients and shadows (house: neither)
    css = re.sub(r'background\s*:\s*radial-gradient\([^;]*?;', 'background: var(--bg);', css, flags=re.S)
    css = re.sub(r'linear-gradient\([^()]*(?:\([^()]*\)[^()]*)*\)', 'var(--accent)', css)
    # an inset box-shadow is a semantic ring (".this cell is the insert point"),
    # not decoration — keep it as an outline. Only drop the real drop-shadows.
    css = re.sub(r'box-shadow\s*:\s*inset\s+0\s+0\s+0\s+(\d+)px\s+(var\([^)]*\)|#[0-9a-fA-F]{3,8})\s*(;|(?=\}))',
                 r'outline:\1px solid \2;outline-offset:-\1px;', css)
    css = re.sub(r'box-shadow\s*:\s*[^;}]*(;|(?=\}))', lambda m: '' if m.group(1) == ';' else '', css)

    # 3. hardcoded hexes -> tokens
    for hx, tok in HEX.items():
        css = re.sub(re.escape(hx), tok, css, flags=re.I)

    # 4. leftover font stacks
    css = css.replace("'Space Grotesk','Segoe UI',system-ui,sans-serif", "var(--sans)")
    css = re.sub(r"'Space Grotesk'[^;]*", "var(--sans)", css)

    css += CORRECTIONS

    # 5. head: fonts + boot script
    head = re.sub(r'<link rel="preconnect"[^>]*>\s*', '', head)
    head = re.sub(r'<link href="https://fonts\.googleapis\.com[^>]*>\s*', '', head)
    head = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>\s*', '', head)
    head = head.replace('<html lang="en">', '<html lang="en" data-theme="light">')
    if 'data-theme' not in head:
        head = head.replace('<html', '<html data-theme="light"', 1)
    head = head.replace('<style>', FONTS + '\n<style>')

    # the original </head> lives in the tail; drop it, we re-emit one after BOOT
    tail = tail.replace('</head>', '', 1)
    tail = tail.replace('</style>', '</style>\n' + BOOT + '\n</head>', 1)
    out = head + '<style>' + css + tail
    out = out.replace('<body>', '<body>' + APPBAR, 1)
    out = out.replace('</body>', TOGGLE + '\n</body>', 1)
    return out


if __name__ == "__main__":
    man = json.load(open("Visuals/_incoming.json", encoding="utf-8"))
    done = 0
    for m in man:
        if m["file"] == "15-3sum.html":
            continue                              # already hand-built as the pilot
        p = "Visuals/" + m["file"]
        out = restyle(p)                          # read fully BEFORE opening for write
        with open(p, "w", encoding="utf-8") as fh:
            fh.write(out)
        done += 1
    print("restyled", done, "files")
