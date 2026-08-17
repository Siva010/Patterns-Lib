"""Add the 19 new Sliding Window pages to Pattern 4 of Visuals/index.html.

Existing sections: A B C E I. New: D F G H K. Appends to A B C E I.
Final order must be A B C D E F G H I J K (J has no pages — skip it).
"""
import re

DIFF = {"Easy": "diff-easy", "Medium": "diff-medium", "Hard": "diff-hard"}

def card(f, num, title, d, blurb):
    return ('<a class="card" href="%s"><span class="num">%s</span><span class="t">%s</span>'
            '<span class="diff %s">%s</span><span class="d">%s</span></a>'
            % (f, num, title, DIFF[d], d, blurb))

APPEND = {
 "A": [("1456-maximum-number-of-vowels-in-a-substring-of-given-length.html", "1456",
        "Maximum Number of Vowels in a Substring", "Medium", "add the entering, drop the leaving"),
       ("1052-grumpy-bookstore-owner.html", "1052", "Grumpy Bookstore Owner", "Medium",
        "banked + rescued, as two separate totals"),
       ("2134-minimum-swaps-to-group-all-1s-together-ii.html", "2134",
        "Minimum Swaps to Group All 1&rsquo;s Together II", "Medium",
        "width is derived, and the array is circular")],
 "B": [("340-longest-substring-with-at-most-k-distinct-characters.html", "340",
        "Longest Substring with At Most K Distinct", "Medium", "delete the key at count zero"),
       ("1493-longest-subarray-of-1s-after-deleting-one-element.html", "1493",
        "Longest Subarray of 1&rsquo;s After Deleting One", "Medium", "the &minus;1 you still owe")],
 "C": [("209-minimum-size-subarray-sum.html", "209", "Minimum Size Subarray Sum", "Medium",
        "record inside the shrink loop"),
       ("1234-replace-the-substring-for-balanced-string.html", "1234",
        "Replace the Substring for Balanced String", "Medium", "test the counts outside the window")],
 "E": [],
 "I": [("1438-longest-continuous-subarray-with-absolute-diff-less-than-or-equal-to-limit.html", "1438",
        "Longest Subarray with Absolute Diff &le; Limit", "Medium", "two deques: one for max, one for min")],
}

# (letter, label, note, insert-before-this-letter, cards)
NEW = [
 ("D", "Non-shrinking windows", "the window slides but never contracts", "E", [
   ("424-longest-repeating-character-replacement.html", "424",
    "Longest Repeating Character Replacement", "Medium",
    "a stale maxCount that cannot corrupt the answer")]),
 ("F", "Counting windows", "a valid window contributes r &minus; l + 1", "I", [
   ("713-subarray-product-less-than-k.html", "713", "Subarray Product Less Than K", "Medium",
    "every suffix of the window, banked at once"),
   ("1358-number-of-substrings-containing-all-three-characters.html", "1358",
    "Substrings Containing All Three Characters", "Medium",
    "min of the three last-occurrences is the boundary")]),
 ("G", "At-most-K &rarr; exactly-K", "exactly(k) = atMost(k) &minus; atMost(k&minus;1)", "I", [
   ("930-binary-subarrays-with-sum.html", "930", "Binary Subarrays With Sum", "Medium",
    "run the window twice, subtract"),
   ("992-subarrays-with-k-different-integers.html", "992",
    "Subarrays with K Different Integers", "Hard", "the flagship of the decomposition"),
   ("1248-count-number-of-nice-subarrays.html", "1248", "Count Number of Nice Subarrays", "Medium",
    "map to parity and it becomes 930")]),
 ("H", "Complement / inverse windows", "the ends are not a window, but the middle is", "I", [
   ("1423-maximum-points-you-can-obtain-from-cards.html", "1423",
    "Maximum Points You Can Obtain from Cards", "Medium",
    "minimise the fixed-width middle you leave"),
   ("1658-minimum-operations-to-reduce-x-to-zero.html", "1658",
    "Minimum Operations to Reduce X to Zero", "Medium",
    "maximise the variable-width middle you keep")]),
 ("K", "&#9888; Anti-patterns &mdash; when the window is illegal",
  "each page runs the naive window until it visibly fails", None, [
   ("862-shortest-subarray-with-sum-at-least-k.html", "862",
    "Shortest Subarray with Sum at Least K", "Hard",
    "negatives break it; monotonic deque on prefixes"),
   ("560-subarray-sum-equals-k.html", "560", "Subarray Sum Equals K", "Medium",
    "no monotonicity, so no window at all"),
   ("395-longest-substring-with-at-least-k-repeating-characters.html", "395",
    "Longest Substring with At Least K Repeating", "Medium",
    "fix a parameter to restore monotonicity")]),
]


def main():
    p = "Visuals/index.html"
    t = open(p, encoding="utf-8").read()
    s, e = t.index('<h2 class="part" id="p4">'), t.index('<h2 class="part" id="p5">')
    pre, part, post = t[:s], t[s:e], t[e:]

    def sec(letter):
        return re.compile(r'<h3><span class="sv">%s</span>.*?</div>\s*' % re.escape(letter), re.S)

    for letter, items in APPEND.items():
        if not items:
            continue
        m = sec(letter).search(part)
        assert m, "append target %s missing" % letter
        blk = m.group(0)
        add = "".join("\n" + card(*c) for c in items)
        part = part[:m.start()] + blk.replace("</div>", add + "\n</div>", 1) + part[m.end():]

    for letter, label, note, before, items in NEW:
        html = ('<h3><span class="sv">%s</span> %s<span class="note">%s</span></h3>\n<div class="grid">\n'
                % (letter, label, note))
        html += "\n".join(card(*c) for c in items) + "\n</div>\n\n"
        if before is None:                       # K goes last in the part
            part = part.rstrip() + "\n\n" + html
        else:
            m = sec(before).search(part)
            assert m, "anchor %s missing for new %s" % (before, letter)
            part = part[:m.start()] + html + part[m.start():]

    n = len(re.findall(r'<a class="card"', part))
    part = part.replace("has to give ground. Eight pages.", "has to give ground. %d pages." % n)
    t = pre + part + post
    with open(p, "w", encoding="utf-8") as fh:
        fh.write(t)
    print("Pattern 4 now lists %d cards" % n)
    print("sub-variant order:", re.findall(r'<h3><span class="sv">([^<]+)</span>', part))


if __name__ == "__main__":
    main()
