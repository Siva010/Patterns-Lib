/* ============================================================================
   tree-engine.js — the shared Tree Recursion lab engine.

   One global: `TreeLab`. Classic script, no modules, no build step, no network.
   Works from file://.  Pair it with tree-engine.css.

   A page mounts a lab with:

       TreeLab.mount({ mountEl:"#lab", presets:[...], variants:[...], run:fn });

   Everything the engine does is a pure function of `trace.events[0..i]`:
   `TreeLab.replayTo(trace, i)` rebuilds the whole world from index 0 every
   time, holds no mutable state of its own, and is what makes step-back and the
   scrubber exactly correct.  Do not add incremental state beside it.

   ---------------------------------------------------------------------------
   TRACE FORMAT (do not change)
   ---------------------------------------------------------------------------
   A trace is { events:[...], maxDepth, calls, result, variantId }.

     type     fields                                              replay effect
     -------  --------------------------------------------------  ---------------
     START    line?                                               started = true
     CALL     key,parentKey,side,depth,isNull,val,args,line        push a frame
     BASE     key,line,value                                      phase = "base"
     EVAL     key,side,line,childVal?                             phase = "wait-<side>"
     CHECK    key,line,...custom                                  frame.check = event
     PRUNE    key,skipped:[keys],line                             mark keys pruned
     RETURN   key,parentKey,side,depth,value,line,reason           pop; fill parent
     DONE     line,...custom                                      done = event

   Frame shape:
     { key, parentKey, side, depth, isNull, val, args,
       left, right, phase, check, result, pruned }
     phase in: enter | base | wait-left | wait-right | returned
   ============================================================================ */

(function (global) {
  "use strict";

  var SVGNS = "http://www.w3.org/2000/svg";
  var VERSION = "1.1.0";

  /* ======================================================== small utilities */

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /** Render a value for display: real minus sign for negatives. */
  function fmtVal(v) {
    if (v === undefined || v === null) return "";
    if (typeof v === "number" && v < 0) return "−" + String(-v);
    return String(v);
  }

  function assign(a, b) {
    if (b) for (var k in b) if (Object.prototype.hasOwnProperty.call(b, k)) a[k] = b[k];
    return a;
  }

  function pick(v, d) { return v === undefined || v === null ? d : v; }

  function svgEl(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    return e;
  }

  /* ================================================================ parsing */

  /**
   * parseTokens(str) -> array of int|null
   * LeetCode level-order list. Tolerant of brackets, commas and whitespace.
   * Throws an Error with a readable message on anything else.
   */
  function parseTokens(str) {
    var cleaned = String(str == null ? "" : str).replace(/[\[\]()]/g, " ").trim();
    if (!cleaned) return [];
    return cleaned.split(/[\s,]+/).filter(function (s) { return s.length; }).map(function (t) {
      if (/^(null|nil|none|n|#|x|_|\-)$/i.test(t)) return null;
      if (!/^-?\d+$/.test(t)) throw new Error('"' + t + '" is not an integer or null');
      return parseInt(t, 10);
    });
  }

  /**
   * buildTree(tokens, opts) -> root | null
   * Node shape: { val, left, right, key, depth }.  `key` is the root-path
   * string: "R" for the root, then "L"/"R" appended per step down.
   * opts: { maxNodes = 31, maxHeight = 6 }
   */
  function buildTree(tokens, opts) {
    opts = opts || {};
    var maxNodes = pick(opts.maxNodes, 31), maxHeight = pick(opts.maxHeight, 6);
    if (!tokens || tokens.length === 0) return null;
    if (tokens[0] === null) throw new Error("the root cannot be null");
    function mk(v) { return { val: v, left: null, right: null, key: "", depth: 0 }; }
    var root = mk(tokens[0]), q = [root], i = 1, count = 1;
    while (q.length && i < tokens.length) {
      var n = q.shift(), sides = ["left", "right"];
      for (var s = 0; s < 2; s++) {
        if (i >= tokens.length) break;
        var v = tokens[i++];
        if (v !== null) {
          var c = mk(v);
          n[sides[s]] = c;
          q.push(c);
          count++;
          if (count > maxNodes) throw new Error("keep it to " + maxNodes + " nodes so the tree stays drawable");
        }
      }
    }
    if (i < tokens.length) throw new Error("too many values — the extras have no parent to hang from");
    (function walk(n, key, d) {
      if (!n) return;
      n.key = key; n.depth = d;
      walk(n.left, key + "L", d + 1);
      walk(n.right, key + "R", d + 1);
    })(root, "R", 0);
    var h = treeHeight(root);
    if (h > maxHeight) throw new Error("that tree is " + h + " levels deep — cap is " + maxHeight);
    return root;
  }

  function treeHeight(n) { return n ? 1 + Math.max(treeHeight(n.left), treeHeight(n.right)) : 0; }
  function countNodes(n) { return n ? 1 + countNodes(n.left) + countNodes(n.right) : 0; }

  /**
   * subtreeKeys(node, key) -> every call-tree key in the subtree rooted at
   * `node`, including the null-pointer leaves. Exactly what a PRUNE event's
   * `skipped` array wants.
   */
  function subtreeKeys(node, key) {
    var out = [];
    (function w(n, k) {
      out.push(k);
      if (n) { w(n.left, k + "L"); w(n.right, k + "R"); }
    })(node, key);
    return out;
  }

  /* ================================================================ layouts */

  /**
   * layoutCallTree(root, opts) — the recursion tree: every real node
   * contributes two child calls, and every null pointer is a leaf.
   * -> { map:{key:{key,depth,parent,side,isNull,val,x,y}}, w, h, count }
   */
  function layoutCallTree(root, opts) {
    opts = opts || {};
    var XG = pick(opts.gapX, 62), YG = pick(opts.gapY, 76);
    var map = {}, leaf = 0, maxD = 0;
    function place(node, key, depth, parent, side) {
      var rec = {
        key: key, depth: depth, parent: parent, side: side, isNull: !node,
        val: node ? node.val : null, x: 0, y: depth * YG
      };
      map[key] = rec;
      if (depth > maxD) maxD = depth;
      if (!node) { rec.x = leaf * XG; leaf++; return rec; }
      var l = place(node.left, key + "L", depth + 1, key, "left");
      var r = place(node.right, key + "R", depth + 1, key, "right");
      rec.x = (l.x + r.x) / 2;
      return rec;
    }
    place(root, "R", 0, null, null);
    return { map: map, w: Math.max(leaf - 1, 0) * XG, h: maxD * YG, count: Object.keys(map).length };
  }

  /**
   * layoutTree(root, opts) — the real binary tree: real nodes only, x from the
   * inorder position, y from the depth.
   * -> { map:{key:{key,val,x,y,depth,left,right}}, w, h }
   */
  function layoutTree(root, opts) {
    opts = opts || {};
    var XG = pick(opts.gapX, 56), YG = pick(opts.gapY, 66);
    var map = {}, idx = 0, maxD = 0;
    (function place(n, depth) {
      if (!n) return;
      place(n.left, depth + 1);
      map[n.key] = {
        key: n.key, val: n.val, x: idx * XG, y: depth * YG, depth: depth,
        left: n.left ? n.left.key : null, right: n.right ? n.right.key : null
      };
      idx++;
      if (depth > maxD) maxD = depth;
      place(n.right, depth + 1);
    })(root, 0);
    return { map: map, w: Math.max(idx - 1, 0) * XG, h: maxD * YG };
  }

  /* ================================================================= REPLAY

     THE contract of this engine. Pure: no closure state, no memo, no cache.
     replayTo(trace, i) rebuilds everything from events[0] each call, so
     stepping forward i times and replaying to i are the same thing by
     construction.
     ====================================================================== */

  function replayTo(trace, i) {
    var evs = (trace && trace.events) || [];
    var stack = [], frames = {}, pruned = {}, executed = {};
    var callsSoFar = 0, returning = null, justFilled = null, done = null, started = false;
    if (i < 0) i = 0;
    if (i > evs.length - 1) i = evs.length - 1;

    for (var k = 0; k <= i; k++) {
      var e = evs[k];
      if (!e) continue;
      if (k < i && e.line) executed[e.line] = true;
      returning = null; justFilled = null;
      switch (e.type) {
        case "START":
          started = true;
          break;
        case "CALL": {
          var f = {
            key: e.key, parentKey: e.parentKey, side: e.side, depth: e.depth,
            isNull: e.isNull, val: e.val, args: e.args,
            left: undefined, right: undefined,
            /* refs: which real nodes, in which rendered tree, this call is
               looking at — [{t:0,key:"RL"},{t:1,key:"R"}]. Only dual-tree and
               two-cursor pages emit it; everything else leaves it null and the
               structure panel keys off the frame key exactly as before. */
            refs: e.refs || null,
            phase: "enter", check: null, result: undefined, pruned: false
          };
          frames[e.key] = f; stack.push(f); callsSoFar++;
          break;
        }
        case "BASE":
          if (frames[e.key]) frames[e.key].phase = "base";
          break;
        case "EVAL":
          if (frames[e.key]) frames[e.key].phase = "wait-" + e.side;
          break;
        case "CHECK":
          if (frames[e.key]) frames[e.key].check = e;
          break;
        case "PRUNE": {
          if (frames[e.key]) frames[e.key].pruned = true;
          var sk = e.skipped || [];
          for (var s = 0; s < sk.length; s++) pruned[sk[s]] = true;
          break;
        }
        case "RETURN": {
          var fr = frames[e.key];
          if (fr) {
            fr.result = e.value; fr.phase = "returned";
            stack.pop();
            if (e.parentKey && frames[e.parentKey]) {
              frames[e.parentKey][e.side] = e.value;
              justFilled = { parentKey: e.parentKey, side: e.side, value: e.value };
            }
            returning = fr;
          }
          break;
        }
        case "DONE":
          done = e;
          break;
      }
    }

    var top = stack.length ? stack[stack.length - 1] : null;
    var cur = evs[i] || {};
    return {
      event: cur, index: i, stack: stack, frames: frames, pruned: pruned,
      executed: executed, callsSoFar: callsSoFar, returning: returning,
      justFilled: justFilled, done: done, started: started, top: top,
      curLine: cur.line || 0,
      curDepth: top ? top.depth : (returning ? returning.depth : 0)
    };
  }

  /* =================================================== syntax highlighting */

  var JAVA_KEY = /\b(abstract|boolean|break|byte|case|catch|char|class|continue|default|do|double|else|enum|extends|final|finally|float|for|if|implements|import|instanceof|int|interface|long|new|null|package|private|protected|public|return|short|static|super|switch|this|throw|throws|true|false|try|void|while|var|record)\b/;
  var JAVA_TYP = /\b([A-Z][A-Za-z0-9_]*)\b/;
  var JAVA_NUM = /\b(\d+)\b/;

  /**
   * hlJava(line) -> HTML. Uses the house --t-* token colours through the
   * .tl-k / .tl-y / .tl-n / .tl-s / .tl-c classes.
   */
  function hlJava(line) {
    line = String(line == null ? "" : line);
    var idx = line.indexOf("//");
    var code = idx >= 0 ? line.slice(0, idx) : line;
    var cm = idx >= 0 ? line.slice(idx) : "";
    var out = esc(code).replace(
      new RegExp("(&quot;.*?&quot;)|" + JAVA_KEY.source + "|" + JAVA_TYP.source + "|" + JAVA_NUM.source, "g"),
      function (m, str, key, typ, num) {
        if (str) return '<span class="tl-s">' + str + "</span>";
        if (key) return '<span class="tl-k">' + key + "</span>";
        if (typ) return '<span class="tl-y">' + typ + "</span>";
        return '<span class="tl-n">' + num + "</span>";
      }
    );
    if (cm) out += '<span class="tl-c">' + esc(cm) + "</span>";
    return out;
  }

  /* ============================================================== defaults */

  function defaultIsFail(v) { return v === -1; }

  function defaultNodeState(key, st) {
    var f = st.frames[key];
    if (f) {
      if (f.result !== undefined) return "done";
      if (st.top && st.top.key === key) return "active";
      return "path";
    }
    if (st.pruned[key]) return "pruned";
    return "ghost";
  }

  /**
   * hole(frame, side, state, opts) -> HTML for one slot of a pending
   * expression. Unfilled slots show the hole glyph; a slot filled by the very
   * last event flashes.  opts: { isFail, glyph }
   */
  function hole(f, side, st, opts) {
    opts = opts || {};
    var isFail = opts.isFail || defaultIsFail;
    var glyph = pick(opts.glyph, "▢");
    var v = f[side];
    if (v === undefined) return '<span class="tl-hole">' + glyph + "</span>";
    var neg = isFail(v);
    var filled = st.justFilled && st.justFilled.parentKey === f.key && st.justFilled.side === side;
    return '<span class="' + (neg ? "tl-neg" : "tl-v") +
      (filled ? " tl-fill" + (neg ? " tl-neg" : "") : "") + '">' + fmtVal(v) + "</span>";
  }

  function defaultExpr(f, st, opts) {
    if (f.result !== undefined) {
      return '<span class="' + (opts.isFail(f.result) ? "tl-neg" : "tl-v") + '">return ' +
        fmtVal(f.result) + "</span>";
    }
    if (f.isNull) return '<span class="tl-hole">base case</span>';
    return "(" + hole(f, "left", st, opts) + ", " + hole(f, "right", st, opts) + ")";
  }

  function defaultNarrate(st, opts) {
    var e = st.event, f = e.key ? st.frames[e.key] : null;
    var who = f ? (f.args || opts.title) : opts.title;
    switch (e.type) {
      case "START":
        return { tag: "start", text: "Start — " + opts.title + " is called on the root." };
      case "CALL":
        return {
          tag: "call",
          text: "Call " + esc(e.args || opts.title) + " at depth " + e.depth +
            (e.isNull ? " — a null child still costs a frame, and it is the base case." : " — push a frame.")
        };
      case "BASE":
        return { tag: "base", text: "Base case — this frame returns " + fmtVal(e.value) + " immediately." };
      case "EVAL":
        return { tag: "descend", text: esc(who) + " cannot finish until it knows its " + e.side + " result, so it recurses." };
      case "CHECK":
        return { tag: "check", text: esc(who) + " tests its guard before combining." };
      case "PRUNE":
        return { tag: "skip", text: "Short-circuit — " + ((e.skipped || []).length) + " call(s) are never made at all." };
      case "RETURN":
        return {
          tag: "return",
          text: esc(who) + " returns " + fmtVal(e.value) +
            (e.parentKey ? " and fills the " + e.side + " hole in its parent." : ", and that is the answer for the whole tree.")
        };
      case "DONE":
        return { tag: "done", text: "Finished — the result is " + fmtVal(e.value) + "." };
    }
    return { tag: "", text: "" };
  }

  var DEFAULT_SPEEDS = [1400, 1100, 900, 750, 600, 480, 380, 300, 220, 150, 90];

  var DEFAULT_LEGEND = [
    { state: "active", label: "active frame" },
    { state: "path", label: "on the current path" },
    { state: "done", label: "returned" },
    { state: "pruned", label: "skipped by short-circuit" },
    { state: "ghost", label: "not called yet" }
  ];

  var ICON = {
    reset: "⟲",
    back: "◀",
    play: "▶ play",
    pause: "‖ pause",
    fwd: "▶"
  };

  /* ================================================================== mount */

  function mount(config) {
    if (!config) throw new Error("TreeLab.mount(config): config is required");

    /* ---------------------------------------------------- resolve container */
    var el = typeof config.mountEl === "string"
      ? document.querySelector(config.mountEl)
      : config.mountEl;
    if (!el) throw new Error("TreeLab.mount: mountEl " + JSON.stringify(config.mountEl) + " matched nothing");

    /* ------------------------------------------------------ resolve config */
    var cfg = {
      title: pick(config.title, "f()"),
      subtitle: pick(config.subtitle, ""),
      tag: pick(config.tag, "interactive"),
      lang: pick(config.lang, "Java"),

      presets: config.presets || [],
      defaultPreset: pick(config.defaultPreset, 0),
      variants: config.variants || [],
      defaultVariant: pick(config.defaultVariant, 0),

      run: config.run,
      doneFields: config.doneFields || null,

      expr: config.expr || null,
      checkText: config.checkText || null,
      narrate: config.narrate || null,
      stats: config.stats || null,
      verdict: config.verdict || null,
      nodeState: config.nodeState || null,
      nodeResult: config.nodeResult || null,
      isFail: config.isFail || defaultIsFail,

      maxNodes: pick(config.maxNodes, 31),
      maxHeight: pick(config.maxHeight, 6),
      maxEvents: pick(config.maxEvents, 4000),

      speeds: config.speeds || DEFAULT_SPEEDS,
      defaultSpeed: pick(config.defaultSpeed, 6),

      showStructure: config.showStructure !== false,
      showSource: config.showSource !== false,
      showStack: config.showStack !== false,
      showCallTree: config.showCallTree !== false,
      showCustom: config.showCustom !== false,
      builtinStats: config.builtinStats !== false,

      legend: config.legend === false ? [] : (config.legend || DEFAULT_LEGEND),
      callTreeNote: pick(config.callTreeNote, ""),
      structureNote: pick(config.structureNote, "the recursion tree above is this, plus one leaf per null"),
      /* dual-tree support. treeLabels captions the panels; dualSep lets the one
         custom-input box carry both trees as "[1,2] | [1,2]". */
      treeLabels: config.treeLabels || null,
      dualSep: pick(config.dualSep, "|"),
      customPlaceholder: pick(config.customPlaceholder, "[3,9,20,null,null,15,7]"),
      holeGlyph: pick(config.holeGlyph, "▢"),
      nullGlyph: pick(config.nullGlyph, "∅"),

      keyboard: pick(config.keyboard, true),
      autoplay: !!config.autoplay,
      onLoad: config.onLoad || null,
      onStep: config.onStep || null
    };

    if (!cfg.presets.length) throw new Error("TreeLab.mount: presets must have at least one entry");
    if (typeof cfg.run !== "function") throw new Error("TreeLab.mount: run must be a function");
    if (!cfg.variants.length) throw new Error("TreeLab.mount: variants must have at least one entry");

    /* normalise presets and variants */
    cfg.presets = cfg.presets.map(function (p, i) {
      if (typeof p === "string") p = { tokens: p };
      return {
        label: pick(p.label, p.tokens), tokens: String(pick(p.tokens, "")),
        /* tokens2: a second tree, for problems that walk two at once. */
        tokens2: (p.tokens2 === undefined || p.tokens2 === null) ? null : String(p.tokens2),
        note: pick(p.note, "")
      };
    });
    cfg.variants = cfg.variants.map(function (v, i) {
      return {
        id: pick(v.id, "v" + i),
        label: pick(v.label, "variant " + (i + 1)),
        java: v.java || v.lines_src || [],
        lines: v.lines || {}
      };
    });

    var exprOpts = { isFail: cfg.isFail, glyph: cfg.holeGlyph, title: cfg.title };

    /* --------------------------------------------------------- build the DOM */
    el.classList.add("tl");
    el.innerHTML = shell(cfg);

    var q = function (sel) { return el.querySelector(sel); };
    var ui = {
      preset: q(".tl-preset"),
      custom: q(".tl-custom"),
      load: q(".tl-load"),
      variant: q(".tl-variantbtn"),
      err: q(".tl-err"),
      presetNote: q(".tl-presetnote"),
      reset: q(".tl-reset"),
      back: q(".tl-back"),
      play: q(".tl-play"),
      fwd: q(".tl-fwd"),
      scrub: q(".tl-scrub"),
      stepNo: q(".tl-stepno"),
      speed: q(".tl-speed"),
      stats: q(".tl-stats"),
      narration: q(".tl-narration"),
      src: q(".tl-src"),
      srcNote: q(".tl-srcnote"),
      stack: q(".tl-stack"),
      callWrap: q(".tl-callwrap"),
      callSvg: q(".tl-callsvg"),
      treeWrap: q(".tl-treewrap-structure"),
      treeSvg: q(".tl-treesvg"),
      zIn: q(".tl-zin"),
      zOut: q(".tl-zout"),
      zFit: q(".tl-zfit")
    };

    /* ------------------------------------------------------------ lab state */
    var S = {
      root: null, trace: null, cl: null, tl: null,
      step: 0, zoom: 1, playing: false, timer: null,
      presetIdx: Math.max(0, Math.min(cfg.defaultPreset, cfg.presets.length - 1)),
      variantIdx: 0,
      tokensStr: "",
      note: ""
    };
    (function () {
      var dv = cfg.defaultVariant;
      if (typeof dv === "string") {
        for (var i = 0; i < cfg.variants.length; i++) if (cfg.variants[i].id === dv) S.variantIdx = i;
      } else if (typeof dv === "number" && dv >= 0 && dv < cfg.variants.length) S.variantIdx = dv;
    })();

    var inst = {
      el: el,
      config: cfg,
      variant: function () { return cfg.variants[S.variantIdx]; },
      get variantIndex() { return S.variantIdx; },
      get index() { return S.step; },
      get trace() { return S.trace; },
      get root() { return S.root; },
      state: function () { return S.trace ? replayTo(S.trace, S.step) : null; },
      render: function (i) { render(i); },
      step: function (d) { render(S.step + d); },
      play: function () { startPlay(); },
      pause: function () { stopPlay(); },
      reset: function () { stopPlay(); render(0); },
      load: function (str, note) { return tryLoad(str, note); },
      setVariant: function (idOrIndex) { setVariant(idOrIndex); },
      refit: function () { fitZoom(); render(S.step); },
      destroy: destroy
    };

    /* ==================================================== trace construction */

    function buildTrace(root) {
      var variant = inst.variant();
      var L = variant.lines || {};
      var topLine = L.TOP || L.ENTER || 0;
      var events = [], sawDone = false;

      function emit(e) {
        if (!e || typeof e.type !== "string") {
          throw new Error("emit() needs an event object with a string .type");
        }
        if (e.type === "DONE") sawDone = true;
        events.push(e);
        if (events.length > cfg.maxEvents) {
          throw new Error("that trace is longer than " + cfg.maxEvents + " steps — try a smaller tree");
        }
        return e;
      }

      var opts = {
        variant: variant, id: variant.id, index: S.variantIdx,
        L: L, lines: L, root: root, instance: inst,
        root2: S.root2 || null,
        maxNodes: cfg.maxNodes, maxHeight: cfg.maxHeight
      };

      var result = cfg.run(root, emit, opts);

      if (!events.length || events[0].type !== "START") {
        events.unshift({ type: "START", line: topLine, depth: 0 });
      }
      if (!sawDone) {
        events.push(assign({ type: "DONE", line: topLine, depth: 0, value: result },
          cfg.doneFields ? cfg.doneFields(result, opts) : null));
      }

      var maxDepth = 0, calls = 0;
      for (var i = 0; i < events.length; i++) {
        if (events[i].type === "CALL") {
          calls++;
          if (events[i].depth > maxDepth) maxDepth = events[i].depth;
        }
      }
      return {
        events: events, maxDepth: maxDepth, calls: calls,
        result: result, variantId: variant.id, variantIndex: S.variantIdx
      };
    }

    /* ============================================================ rendering */

    function renderSource(st) {
      if (!cfg.showSource || !ui.src) return;
      var variant = inst.variant(), lines = variant.java || [], html = "";
      for (var i = 0; i < lines.length; i++) {
        var ln = i + 1;
        var cls = "tl-ln" + (ln === st.curLine ? " tl-cur" : (st.executed[ln] ? " tl-done" : ""));
        html += '<div class="' + cls + '" data-tl-line="' + ln + '"><span class="tl-g">' + ln +
          '</span><span class="tl-code">' + (lines[i] ? hlJava(lines[i]) : "&nbsp;") + "</span></div>";
      }
      ui.src.innerHTML = html;
      var cur = ui.src.querySelector(".tl-cur");
      if (cur) {
        var cb = ui.src.getBoundingClientRect(), rb = cur.getBoundingClientRect();
        var want = ui.src.scrollTop + (rb.top - cb.top) - ui.src.clientHeight / 2 + rb.height / 2;
        ui.src.scrollTop = Math.max(0, want);
      }
      if (ui.srcNote) ui.srcNote.textContent = cfg.lang + " · " + variant.label;
    }

    function exprHtml(f, st) {
      return cfg.expr ? cfg.expr(f, st, exprOpts) : defaultExpr(f, st, exprOpts);
    }

    function frameHtml(f, st, o) {
      o = o || {};
      var neg = cfg.isFail(f.result);
      var cls = "tl-frame" +
        (o.returning ? " tl-ret" + (neg ? " tl-neg" : "") : (o.active ? " tl-active" : ""));
      var status = o.returning ? "returns " + fmtVal(f.result)
        : f.phase === "wait-left" ? "waiting on left"
        : f.phase === "wait-right" ? "waiting on right"
        : f.phase === "base" ? "base case"
        : o.active ? "running" : "";
      var h = '<div class="' + cls + '"><div class="tl-top">' +
        '<span class="tl-d">d' + f.depth + "</span>" +
        '<span class="tl-sig">' + esc(f.args == null ? "" : f.args) + "</span>" +
        '<span class="tl-st">' + status + "</span></div>" +
        '<div class="tl-expr">' + exprHtml(f, st) + "</div>";
      if (f.check && !o.returning && o.active && cfg.checkText) {
        var ct = cfg.checkText(f.check, st);
        if (ct) h += '<div class="tl-chk">' + ct + "</div>";
      }
      if (f.pruned) h += '<div class="tl-chk tl-prunetext">subtree skipped</div>';
      return h + "</div>";
    }

    function renderStack(st) {
      if (!cfg.showStack || !ui.stack) return;
      var out = "";
      if (st.returning) out += frameHtml(st.returning, st, { returning: true });
      for (var i = st.stack.length - 1; i >= 0; i--) {
        out += frameHtml(st.stack[i], st, { active: i === st.stack.length - 1 && !st.returning });
      }
      if (!out) {
        out = '<div class="tl-empty">' +
          (st.done ? "Stack empty — execution finished." : "Stack empty — nothing called yet.") +
          "</div>";
      }
      ui.stack.innerHTML = out;
    }

    function stateOf(key, st) {
      return (cfg.nodeState ? cfg.nodeState(key, st) : null) || defaultNodeState(key, st);
    }

    function resultLabel(f, st) {
      if (!f || f.result === undefined) return null;
      if (cfg.nodeResult) return cfg.nodeResult(f, st);
      return fmtVal(f.result);
    }

    function edgeClass(s) {
      return s === "ghost" ? "tl-edge tl-ghost"
        : s === "pruned" ? "tl-edge tl-pruned"
        : s === "done" ? "tl-edge tl-done"
        : "tl-edge tl-path";
    }

    function renderCallTree(st) {
      if (!cfg.showCallTree || !ui.callSvg || !S.cl) return;
      var lay = S.cl, PAD = 36;
      var W = lay.w + PAD * 2, H = lay.h + PAD * 2 + 20;
      var svg = ui.callSvg;
      svg.innerHTML = "";
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      svg.setAttribute("width", Math.round(W * S.zoom));
      svg.setAttribute("height", Math.round(H * S.zoom));
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "Recursion tree, one node per call");

      var keys = Object.keys(lay.map), i, rec;
      for (i = 0; i < keys.length; i++) {
        rec = lay.map[keys[i]];
        if (!rec.parent) continue;
        var p = lay.map[rec.parent];
        svg.appendChild(svgEl("path", {
          "class": edgeClass(stateOf(rec.key, st)),
          d: "M" + (p.x + PAD) + "," + (p.y + PAD + 16) +
             " C" + (p.x + PAD) + "," + (p.y + PAD + 46) +
             " " + (rec.x + PAD) + "," + (rec.y + PAD - 30) +
             " " + (rec.x + PAD) + "," + (rec.y + PAD - 16)
        }));
      }
      for (i = 0; i < keys.length; i++) {
        rec = lay.map[keys[i]];
        var s = stateOf(rec.key, st), f = st.frames[rec.key];
        var cx = rec.x + PAD, cy = rec.y + PAD, r = rec.isNull ? 11 : 16;
        if (s === "active" || (st.returning && st.returning.key === rec.key)) {
          svg.appendChild(svgEl("circle", { "class": "tl-pulse", cx: cx, cy: cy, r: 18 }));
        }
        var neg = !!(f && cfg.isFail(f.result));
        svg.appendChild(svgEl("circle", { "class": "tl-nd " + tlc(s) + (neg ? " tl-neg" : ""), cx: cx, cy: cy, r: r }));
        var lab = svgEl("text", {
          "class": "tl-nlab " + (rec.isNull ? "tl-nul " : "") + (s === "ghost" || s === "pruned" ? "tl-ghost" : ""),
          x: cx, y: cy + 4
        });
        lab.textContent = rec.isNull ? cfg.nullGlyph : rec.val;
        svg.appendChild(lab);
        var rl = resultLabel(f, st);
        if (rl !== null && rl !== undefined && rl !== "") {
          var res = svgEl("text", { "class": "tl-res" + (neg ? " tl-neg" : ""), x: cx, y: cy + r + 13 });
          res.textContent = rl;
          svg.appendChild(res);
        }
      }
      /* keep the active node in view */
      var focus = st.top ? st.top.key : (st.returning ? st.returning.key : null);
      if (focus && lay.map[focus] && ui.callWrap) {
        var w = ui.callWrap;
        var fx = (lay.map[focus].x + PAD) * S.zoom, fy = (lay.map[focus].y + PAD) * S.zoom;
        if (w.scrollWidth > w.clientWidth) w.scrollLeft = Math.max(0, fx - w.clientWidth / 2);
        if (w.scrollHeight > w.clientHeight) w.scrollTop = Math.max(0, fy - w.clientHeight / 2);
      }
    }

    /**
     * (t,key) -> the frame examining that node, built from every live frame's
     * `refs`. Pages that walk a single tree emit no refs, so this comes back
     * empty and every lookup below falls through to the original stateOf path.
     */
    function refMap(st) {
      var m = {}, ks = Object.keys(st.frames), i, j;
      for (i = 0; i < ks.length; i++) {
        var f = st.frames[ks[i]];
        if (!f.refs) continue;
        for (j = 0; j < f.refs.length; j++) {
          var r = f.refs[j];
          if (r && r.key !== undefined && r.key !== null) m[(r.t || 0) + ":" + r.key] = f;
        }
      }
      return m;
    }

    function frameFor(t, key, st, rm) {
      return rm[t + ":" + key] || (t === 0 ? st.frames[key] : null);
    }

    /* A node's state. With refs it is the state of the frame pointing at it;
       without, tree 0 keys off the frame of the same name (unchanged), and a
       second tree with nothing pointing at it stays un-entered. */
    function nodeStateIn(t, key, st, rm) {
      var f = rm[t + ":" + key];
      if (f) {
        var over = cfg.nodeState ? cfg.nodeState(f.key, st, { t: t, key: key, frame: f }) : null;
        return over || defaultNodeState(f.key, st);
      }
      if (t === 0 && !S.tl2) return stateOf(key, st);
      if (t === 0) return stateOf(key, st);
      return "ghost";
    }

    function renderStructure(st) {
      if (!cfg.showStructure || !ui.treeSvg || !S.tl) return;
      var PAD = 30, GAP = 52, svg = ui.treeSvg;
      var panels = [{ lay: S.tl, t: 0 }];
      if (S.tl2) panels.push({ lay: S.tl2, t: 1 });
      var labels = cfg.treeLabels || [];
      var CAP = (S.tl2 && labels.length) ? 20 : 0;   /* caption band, dual only */
      svg.innerHTML = "";

      var W = 0, Hmax = 0, i;
      for (i = 0; i < panels.length; i++) {
        panels[i].ox = W + PAD;
        W += panels[i].lay.w + PAD * 2 + (i < panels.length - 1 ? GAP : 0);
        Hmax = Math.max(Hmax, panels[i].lay.h);
      }
      var H = Hmax + PAD * 2 + 16 + CAP;
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", S.tl2 ? "The two binary trees" : "The binary tree itself");
      var wrap = ui.treeWrap;
      var avail = wrap ? wrap.clientWidth - 16 : W;
      var scale = Math.min(1, Math.max(0.25, avail / W || 1));
      svg.setAttribute("width", Math.round(W * scale));
      svg.setAttribute("height", Math.round(H * scale));

      var rm = refMap(st);

      for (var p = 0; p < panels.length; p++) {
        var lay = panels[p].lay, t = panels[p].t, ox = panels[p].ox;
        if (CAP && labels[t]) {
          var cap = svgEl("text", { "class": "tl-tcap", x: ox + lay.w / 2, y: 13 });
          cap.textContent = labels[t];
          svg.appendChild(cap);
        }
        var keys = Object.keys(lay.map), rec, j;

        for (j = 0; j < keys.length; j++) {
          rec = lay.map[keys[j]];
          /* the closure needs its own copies — p/t/ox move on the next pass */
          (function (rec, t, ox, lay) {
            ["left", "right"].forEach(function (side) {
              var ck = rec[side];
              if (!ck) return;
              var c = lay.map[ck];
              svg.appendChild(svgEl("line", {
                "class": edgeClass(nodeStateIn(t, ck, st, rm)),
                x1: rec.x + ox, y1: rec.y + PAD + CAP + 15,
                x2: c.x + ox, y2: c.y + PAD + CAP - 15
              }));
            });
          })(rec, t, ox, lay);
        }
        for (j = 0; j < keys.length; j++) {
          rec = lay.map[keys[j]];
          var s = nodeStateIn(t, rec.key, st, rm), f = frameFor(t, rec.key, st, rm);
          var cx = rec.x + ox, cy = rec.y + PAD + CAP, neg = !!(f && cfg.isFail(f.result));
          if (s === "active") svg.appendChild(svgEl("circle", { "class": "tl-pulse", cx: cx, cy: cy, r: 18 }));
          svg.appendChild(svgEl("circle", { "class": "tl-nd " + tlc(s) + (neg ? " tl-neg" : ""), cx: cx, cy: cy, r: 15 }));
          var lab = svgEl("text", {
            "class": "tl-nlab " + (s === "ghost" || s === "pruned" ? "tl-ghost" : ""), x: cx, y: cy + 4
          });
          lab.textContent = rec.val;
          svg.appendChild(lab);
          var rl = resultLabel(f, st);
          if (rl !== null && rl !== undefined && rl !== "") {
            var res = svgEl("text", { "class": "tl-res" + (neg ? " tl-neg" : ""), x: cx, y: cy + 28 });
            res.textContent = rl;
            svg.appendChild(res);
          }
        }
      }
    }

    function tlc(s) { return "tl-" + s; }

    function renderNarration(st) {
      if (!ui.narration) return;
      var n = (cfg.narrate ? cfg.narrate(st, exprOpts) : null) || defaultNarrate(st, exprOpts);
      ui.narration.innerHTML = '<span class="tl-ntag">' + esc(n.tag || "") + "</span><span>" + (n.text || "") + "</span>";
    }

    function renderStats(st) {
      if (!ui.stats) return;
      var chips = [];
      if (cfg.builtinStats) {
        chips.push("depth <b>" + st.curDepth + "</b> / max <b>" + S.trace.maxDepth + "</b>");
        chips.push("calls <b>" + st.callsSoFar + "</b> / <b>" + S.trace.calls + "</b>");
        chips.push("frames on stack <b>" + st.stack.length + "</b>");
        var np = Object.keys(st.pruned).length;
        if (np) chips.push('<span class="tl-pruned">calls skipped <b>' + np + "</b></span>");
      }
      if (cfg.stats) {
        (cfg.stats(st) || []).forEach(function (c) {
          if (!c) return;
          chips.push(esc(c.label) + " <b>" + (c.html || esc(String(c.value))) + "</b>");
        });
      }
      var html = chips.map(function (c) { return "<span>" + c + "</span>"; }).join("");
      var v = cfg.verdict ? cfg.verdict(st) : null;
      if (v && v.text) {
        html += '<span class="tl-verdict" data-tl-ok="' + (v.ok ? "true" : "false") + '">' + v.text + "</span>";
      } else {
        html += '<span class="tl-verdict"></span>';
      }
      ui.stats.innerHTML = html;
      if (ui.stepNo) ui.stepNo.textContent = "step " + (st.index + 1) + " / " + S.trace.events.length;
    }

    /* single entry point: everything is derived from events[0..i] */
    function render(i) {
      if (!S.trace) return;
      var last = S.trace.events.length - 1;
      S.step = Math.max(0, Math.min(i, last));
      var st = replayTo(S.trace, S.step);
      renderSource(st);
      renderStack(st);
      renderCallTree(st);
      renderStructure(st);
      renderNarration(st);
      renderStats(st);
      if (ui.scrub) { ui.scrub.max = String(last); ui.scrub.value = String(S.step); }
      if (ui.back) ui.back.disabled = S.step === 0;
      if (ui.fwd) ui.fwd.disabled = S.step === last;
      if (cfg.onStep) cfg.onStep(st, inst);
    }

    /* =========================================================== loading */

    function fitZoom() {
      if (!S.cl || !ui.callWrap) { S.zoom = 1; return; }
      var W = S.cl.w + 72;
      var z = (ui.callWrap.clientWidth - 16) / W;
      S.zoom = Math.min(1, z || 1);
      if (!isFinite(S.zoom) || S.zoom <= 0) S.zoom = 1;
    }

    function loadTokens(str, note, str2) {
      /* One text field can carry two trees: "[1,2,3] | [1,2,3]". Splitting here
         keeps the whole dual-tree feature out of the UI layer. */
      var sa = String(str), sb = str2;
      if (sb === undefined || sb === null) {
        var ix = sa.indexOf(cfg.dualSep);
        if (ix >= 0) { sb = sa.slice(ix + cfg.dualSep.length); sa = sa.slice(0, ix); }
      }
      var lim = { maxNodes: cfg.maxNodes, maxHeight: cfg.maxHeight };
      var root = buildTree(parseTokens(sa), lim);
      var hasB = !(sb === undefined || sb === null || String(sb).trim() === "");
      var root2 = hasB ? buildTree(parseTokens(sb), lim) : null;
      S.root = root;
      S.root2 = root2;
      S.tokensStr = hasB ? (sa.trim() + " " + cfg.dualSep + " " + String(sb).trim()) : String(str);
      S.note = note || "";
      S.cl = layoutCallTree(root);
      S.tl = layoutTree(root);
      S.tl2 = root2 ? layoutTree(root2) : null;
      S.trace = buildTrace(root);
      S.zoom = 1;
      fitZoom();
      stopPlay();
      if (ui.err) ui.err.textContent = "";
      if (ui.presetNote) ui.presetNote.textContent = S.note;
      render(0);
      if (cfg.onLoad) cfg.onLoad(inst, root);
      if (cfg.autoplay) startPlay();
      return true;
    }

    function tryLoad(str, note, str2) {
      try { return loadTokens(str, note, str2); }
      catch (e) {
        if (ui.err) ui.err.textContent = e && e.message ? e.message : String(e);
        return false;
      }
    }

    function rebuildTrace() {
      if (!S.trace) return;
      var keep = S.step;
      try {
        S.trace = buildTrace(S.root);
        if (ui.err) ui.err.textContent = "";
      } catch (e) {
        if (ui.err) ui.err.textContent = e && e.message ? e.message : String(e);
        return;
      }
      render(Math.min(keep, S.trace.events.length - 1));
    }

    function setVariant(idOrIndex) {
      var next = S.variantIdx;
      if (typeof idOrIndex === "number") next = idOrIndex;
      else if (typeof idOrIndex === "string") {
        for (var i = 0; i < cfg.variants.length; i++) if (cfg.variants[i].id === idOrIndex) next = i;
      } else {
        next = (S.variantIdx + 1) % cfg.variants.length;
      }
      if (next < 0 || next >= cfg.variants.length) return;
      S.variantIdx = next;
      syncVariantBtn();
      stopPlay();
      rebuildTrace();
    }

    function syncVariantBtn() {
      if (!ui.variant) return;
      ui.variant.textContent = inst.variant().label;
      if (S.variantIdx === 0) ui.variant.classList.remove("tl-on");
      else ui.variant.classList.add("tl-on");
      ui.variant.setAttribute("aria-pressed", S.variantIdx === 0 ? "false" : "true");
    }

    /* ========================================================== transport */

    function speedMs() {
      var i = ui.speed ? +ui.speed.value : cfg.defaultSpeed;
      return cfg.speeds[Math.max(0, Math.min(i, cfg.speeds.length - 1))] || 500;
    }
    function stopPlay() {
      S.playing = false;
      if (S.timer) { clearInterval(S.timer); S.timer = null; }
      if (ui.play) { ui.play.innerHTML = ICON.play; ui.play.setAttribute("aria-label", "Play"); }
    }
    function startPlay() {
      if (!S.trace) return;
      var last = S.trace.events.length - 1;
      if (S.step >= last) render(0);
      S.playing = true;
      if (ui.play) { ui.play.innerHTML = ICON.pause; ui.play.setAttribute("aria-label", "Pause"); }
      S.timer = setInterval(function () {
        if (S.step >= S.trace.events.length - 1) { stopPlay(); return; }
        render(S.step + 1);
      }, speedMs());
    }
    function togglePlay() { S.playing ? stopPlay() : startPlay(); }

    /* ============================================================== wiring */

    var listeners = [];
    function on(target, type, fn, opt) {
      target.addEventListener(type, fn, opt);
      listeners.push([target, type, fn, opt]);
    }

    if (ui.preset) {
      on(ui.preset, "change", function () {
        S.presetIdx = +ui.preset.value;
        if (ui.custom) ui.custom.value = "";
        var p = cfg.presets[S.presetIdx];
        tryLoad(p.tokens, p.note, p.tokens2);
      });
    }
    if (ui.load) {
      on(ui.load, "click", function () {
        var v = ui.custom ? ui.custom.value.trim() : "";
        if (!v) {
          if (ui.err) ui.err.textContent = "Type a level-order list, e.g. " + cfg.customPlaceholder;
          return;
        }
        tryLoad(v, "custom input · up to " + cfg.maxNodes + " nodes, " + cfg.maxHeight + " levels");
      });
    }
    if (ui.custom) {
      on(ui.custom, "keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); ui.load.click(); } });
    }
    if (ui.variant) on(ui.variant, "click", function () { setVariant(); });

    if (ui.back) on(ui.back, "click", function () { stopPlay(); render(S.step - 1); });
    if (ui.fwd) on(ui.fwd, "click", function () { stopPlay(); render(S.step + 1); });
    if (ui.reset) on(ui.reset, "click", function () { stopPlay(); render(0); });
    if (ui.play) on(ui.play, "click", togglePlay);
    if (ui.scrub) on(ui.scrub, "input", function () { stopPlay(); render(+ui.scrub.value); });
    if (ui.speed) on(ui.speed, "input", function () { if (S.playing) { stopPlay(); startPlay(); } });
    if (ui.zIn) on(ui.zIn, "click", function () { S.zoom = Math.min(1.8, S.zoom * 1.25); render(S.step); });
    if (ui.zOut) on(ui.zOut, "click", function () { S.zoom = Math.max(0.28, S.zoom / 1.25); render(S.step); });
    if (ui.zFit) on(ui.zFit, "click", function () { fitZoom(); render(S.step); });

    function keyHandler(e) {
      var t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowRight") { e.preventDefault(); stopPlay(); render(S.step + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); stopPlay(); render(S.step - 1); }
      else if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); togglePlay(); }
      else if (e.key === "Home") { e.preventDefault(); stopPlay(); render(0); }
      else if (e.key === "End") { e.preventDefault(); stopPlay(); render(S.trace ? S.trace.events.length - 1 : 0); }
    }
    if (cfg.keyboard) {
      el.setAttribute("tabindex", "0");
      /* focus-scoped by default so an essay page keeps its own arrow / space
         scrolling; pass keyboard:"document" for the standalone-lab behaviour. */
      on(cfg.keyboard === "document" ? document : el, "keydown", keyHandler);
    }

    var rafPending = false;
    function onResize() {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(function () { rafPending = false; if (S.trace) render(S.step); });
    }
    on(window, "resize", onResize, { passive: true });

    function destroy() {
      stopPlay();
      listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
      listeners.length = 0;
      el.innerHTML = "";
      el.classList.remove("tl");
    }

    /* ------------------------------------------------------------- first run */
    if (ui.preset) ui.preset.value = String(S.presetIdx);
    if (ui.speed) ui.speed.value = String(cfg.defaultSpeed);
    syncVariantBtn();
    var p0 = cfg.presets[S.presetIdx];
    tryLoad(p0.tokens, p0.note, p0.tokens2);

    return inst;
  }

  /* ============================================================ DOM shell */

  function shell(cfg) {
    var h = [];
    h.push('<div class="tl-head"><span class="tl-t">' + esc(cfg.title) + "</span>" +
      (cfg.subtitle ? '<span class="tl-sub">' + esc(cfg.subtitle) + "</span>" : "") +
      (cfg.tag ? '<span class="tl-tag">' + esc(cfg.tag) + "</span>" : "") + "</div>");

    h.push('<div class="tl-bar">');
    h.push('<span class="tl-lbl">Tree</span>' +
      '<select class="tl-preset" aria-label="Choose a tree">' +
      cfg.presets.map(function (p, i) {
        return '<option value="' + i + '">' + esc(p.label) + (p.note ? "  —  " + esc(p.note) : "") + "</option>";
      }).join("") + "</select>");
    if (cfg.showCustom) {
      h.push('<span class="tl-lbl">Custom</span>' +
        '<input class="tl-custom" type="text" spellcheck="false" aria-label="Custom level-order list" placeholder="' +
        esc(cfg.customPlaceholder) + '">' +
        '<button class="tl-load" type="button">Load</button>');
    }
    if (cfg.variants.length > 1) {
      h.push('<button class="tl-variantbtn" type="button" aria-pressed="false"></button>');
    }
    h.push('<span class="tl-err" role="status" aria-live="polite"></span>');
    h.push("</div>");

    h.push('<div class="tl-presetnote"></div>');

    h.push('<div class="tl-controls">' +
      '<button class="tl-reset" type="button" aria-label="Back to the first step" title="Reset">' + ICON.reset + "</button>" +
      '<button class="tl-back" type="button" aria-label="Previous step" title="Step back">' + ICON.back + "</button>" +
      '<button class="tl-play tl-primary" type="button" aria-label="Play" title="Play / pause">' + ICON.play + "</button>" +
      '<button class="tl-fwd" type="button" aria-label="Next step" title="Step forward">' + ICON.fwd + "</button>" +
      '<div class="tl-scrubwrap"><input class="tl-scrub" type="range" min="0" max="0" value="0" step="1" aria-label="Step">' +
      '<span class="tl-stepno"></span></div>' +
      '<span class="tl-lbl">Speed</span>' +
      '<input class="tl-speed" type="range" min="0" max="' + (cfg.speeds.length - 1) + '" value="' + cfg.defaultSpeed + '" aria-label="Playback speed">' +
      "</div>");

    h.push('<div class="tl-stats" role="status" aria-live="off"></div>');
    h.push('<div class="tl-narration" role="status" aria-live="polite"></div>');

    h.push('<div class="tl-grid">');

    h.push('<div class="tl-col">');
    if (cfg.showSource) {
      h.push('<section class="tl-panel"><h3 class="tl-h">Source <span class="tl-pnote tl-srcnote"></span></h3>' +
        '<div class="tl-src"></div></section>');
    }
    if (cfg.showStack) {
      h.push('<section class="tl-panel"><h3 class="tl-h">Call stack <span class="tl-pnote">newest on top</span></h3>' +
        '<div class="tl-body"><div class="tl-stack"></div></div></section>');
    }
    h.push("</div>");

    h.push('<div class="tl-col">');
    if (cfg.showCallTree) {
      h.push('<section class="tl-panel"><h3 class="tl-h">Recursion tree <span class="tl-pnote">' +
        (cfg.callTreeNote ? esc(cfg.callTreeNote) + " " : "") +
        '<button class="tl-zout" type="button" aria-label="Zoom out">−</button>' +
        '<button class="tl-zin" type="button" aria-label="Zoom in">+</button>' +
        '<button class="tl-zfit" type="button" aria-label="Fit to width">fit</button></span></h3>' +
        '<div class="tl-treewrap tl-callwrap"><svg class="tl-callsvg"></svg></div>' +
        (cfg.legend.length ? '<div class="tl-legend">' + cfg.legend.map(function (l) {
          return '<span><i data-tl-state="' + esc(l.state) + '"></i>' + esc(l.label) + "</span>";
        }).join("") + "</div>" : "") +
        "</section>");
    }
    if (cfg.showStructure) {
      h.push('<section class="tl-panel"><h3 class="tl-h">The binary tree itself' +
        (cfg.structureNote ? ' <span class="tl-pnote">' + esc(cfg.structureNote) + "</span>" : "") +
        '</h3><div class="tl-treewrap tl-small tl-treewrap-structure"><svg class="tl-treesvg"></svg></div></section>');
    }
    h.push("</div>");

    h.push("</div>");
    return h.join("");
  }

  /* ================================================================ export */

  global.TreeLab = {
    version: VERSION,
    mount: mount,
    /* parsing / trees */
    parseTokens: parseTokens,
    buildTree: buildTree,
    treeHeight: treeHeight,
    countNodes: countNodes,
    subtreeKeys: subtreeKeys,
    /* layouts */
    layoutTree: layoutTree,
    layoutCallTree: layoutCallTree,
    /* the contract */
    replayTo: replayTo,
    /* helpers adapters need */
    hlJava: hlJava,
    esc: esc,
    fmtVal: fmtVal,
    hole: hole,
    defaultNodeState: defaultNodeState,
    defaultNarrate: defaultNarrate,
    DEFAULT_SPEEDS: DEFAULT_SPEEDS,
    DEFAULT_LEGEND: DEFAULT_LEGEND
  };

  /* Node / test harness support: `require`-ing this file gives the same object
     without touching a DOM. */
  if (typeof module === "object" && module && module.exports) module.exports = global.TreeLab;

})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));
