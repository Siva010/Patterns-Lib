"""Add the 14 new Two Pointers pages to Visuals/index.html.

Five sub-variants are new sections (D, E, F, I, J); G and H get appends.
Section order must follow the study doc: A B C D E F G H I J K.
"""
import re

DIFF = {"Easy": "diff-easy", "Medium": "diff-medium", "Hard": "diff-hard"}

def card(f, num, title, d, blurb):
    return ('<a class="card" href="%s"><span class="num">%s</span><span class="t">%s</span>'
            '<span class="diff %s">%s</span><span class="d">%s</span></a>'
            % (f, num, title, DIFF[d], d, blurb))

# new sections, inserted in order before the section whose letter follows
NEW_SECTIONS = [
 ("D", "Read/write compaction", "the prefix [0, write) is the answer so far", "G", [
   ("27-remove-element.html", "27", "Remove Element", "Easy", "the write head keeps only what survives"),
   ("26-remove-duplicates-from-sorted-array.html", "26", "Remove Duplicates from Sorted Array", "Easy", "compare against the last <em>kept</em>, not the last seen"),
   ("80-remove-duplicates-from-sorted-array-ii.html", "80", "Remove Duplicates from Sorted Array II", "Medium", "the write&minus;2 lookback, and how it generalises to k"),
 ]),
 ("E", "Two-sequence advance", "the whole design question is which pointer moves", "G", [
   ("392-is-subsequence.html", "392", "Is Subsequence", "Easy", "only <code>i</code> advances on a match"),
   ("986-interval-list-intersections.html", "986", "Interval List Intersections", "Medium", "retire whichever interval ends first"),
   ("844-backspace-string-compare.html", "844", "Backspace String Compare", "Easy", "scan right to left with a skip counter"),
 ]),
 ("F", "Backward-writing merge", "write from the back and you never clobber", "G", [
   ("88-merge-sorted-array.html", "88", "Merge Sorted Array", "Easy", "w = i + j + 1 is the proof it is safe"),
 ]),
 ("I", "Expand around center", "2n&minus;1 centers, not n", "K", [
   ("5-longest-palindromic-substring.html", "5", "Longest Palindromic Substring", "Medium", "keep the best span"),
   ("647-palindromic-substrings.html", "647", "Palindromic Substrings", "Medium", "same loop, count instead of max"),
 ]),
 ("J", "Cyclic sort", "value v belongs at index v&minus;1", "K", [
   ("448-find-all-numbers-disappeared-in-an-array.html", "448", "Find All Numbers Disappeared in an Array", "Easy", "swap each value home, then read the gaps"),
   ("41-first-missing-positive.html", "41", "First Missing Positive", "Hard", "the while-swap duplicate guard is the hard line"),
 ]),
]

# appends to sections that already exist
APPEND = {
 "G": [("142-linked-list-cycle-ii.html", "142", "Linked List Cycle II", "Medium", "phase two finds the entrance"),
       ("287-find-the-duplicate-number.html", "287", "Find the Duplicate Number", "Medium", "the array is secretly a linked list")],
 "H": [("215-kth-largest-element-in-an-array.html", "215", "Kth Largest Element in an Array", "Medium", "quickselect &mdash; recurse into one side only")],
}


def main():
    p = "Visuals/index.html"
    t = open(p, encoding="utf-8").read()

    # scope to the Pattern 3 part so we never touch the tree sections
    start = t.index('<h2 class="part" id="p3">')
    end = t.index('<h2 class="part" id="p4">')
    part, rest_before, rest_after = t[start:end], t[:start], t[end:]

    def sec_re(letter):
        return re.compile(r'<h3><span class="sv">%s</span>.*?</div>\s*' % re.escape(letter), re.S)

    # 1. appends
    for letter, items in APPEND.items():
        m = sec_re(letter).search(part)
        assert m, "section %s not found" % letter
        block = m.group(0)
        add = "".join("\n" + card(*c) for c in items)
        newblock = block.replace("</div>", add + "\n</div>", 1) if "</div>" in block else block
        part = part[:m.start()] + newblock + part[m.end():]

    # 2. new sections, each inserted before the named following section
    for letter, label, note, before, items in NEW_SECTIONS:
        m = sec_re(before).search(part)
        assert m, "anchor section %s not found for new %s" % (before, letter)
        html = ('<h3><span class="sv">%s</span> %s<span class="note">%s</span></h3>\n<div class="grid">\n'
                % (letter, label, note))
        html += "\n".join(card(*c) for c in items)
        html += "\n</div>\n\n"
        part = part[:m.start()] + html + part[m.start():]

    t = rest_before + part + rest_after

    # 3. refresh the part subtitle count
    n = len(re.findall(r'<a class="card"', part))
    t = t.replace("can never skip the answer. Nineteen pages.",
                  "can never skip the answer. %d pages." % n)
    with open(p, "w", encoding="utf-8") as fh:
        fh.write(t)
    print("Pattern 3 now lists %d cards" % n)


if __name__ == "__main__":
    main()
