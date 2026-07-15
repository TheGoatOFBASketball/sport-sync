#!/usr/bin/env python3
"""
Add inline `// __prior_salary_data_hole__` markers to the 21 RFA (TO) entries
that still have priorSalary: 0, then replace the verbose bottom block with a
one-line summary. Inline markers survive re-sorting.
"""
import subprocess

F = "/home/numberc/Desktop/sports sync/nba-contracts.html"
with open(F) as fh:
    text = fh.read()
original = text

# 21 names (RFA (TO) minors/rookies still at 0)
NAMES = [
    "Amari Williams", "Andre Jackson Jr.", "Bez Mbeng", "Craig Porter Jr.",
    "Daniss Jenkins", "GG Jackson", "Hayden Gray", "Jahmir Young",
    "Jonathan Mogbo", "Jordan Walsh", "Julian Phillips",
    "Leonard Miller", "Malachi Smith", "Max Shulga",
    "Mouhamed Gueye", "Pelle Larsson", "Ryan Nembhard", "Tolu Smith",
    "Trayce Jackson-Davis",
]
# Plus the 2 with faType "RFA (TO)" that have caron characters \u2014 Kobe Sanders and Karlo Matkovi\u0107
# are intentionally excluded from name-search; we handle them by entry shape below.

# Step 1: for each name, append the marker to the entry line.
# Each entry is single-line: { id: ..., name: "X", ..., priorSalary: 0, ..., faType: "RFA (TO)", ... },
# We add the marker just before the closing comma+brace.
added = 0
for name in NAMES:
    needle = f'name: "{name}"'
    idx = text.find(needle)
    if idx < 0:
        print(f"  [WARN] no match for {name!r}")
        continue
    # Find the closing }, of this entry
    close = text.find("},", idx)
    if close < 0:
        print(f"  [WARN] no close for {name!r}")
        continue
    # Only mark if not already marked
    if "// __prior_salary_data_hole__" in text[close:close+60]:
        continue
    text = text[:close] + "}, // __prior_salary_data_hole__" + text[close+2:]
    added += 1

# Handle the 2 with special chars by entry-shape match (faType: "RFA (TO)" + priorSalary: 0)
import re
def add_marker_to_fa_type(fa_type, marker="// __prior_salary_data_hole__"):
    global text, added
    pat = re.compile(
        r'((?:\{[^}]*?faType:\s*"' + re.escape(fa_type) + r'"[^}]*?\}))(\s*)$',
        re.M
    )
    def repl(m):
        body, tail = m.group(1), m.group(2)
        if marker in body[-80:]:
            return m.group(0)
        return body + ", " + marker + tail
    new, n = pat.subn(repl, text)
    text = new
    added += n

# Karlo Matkovi\u0107 and Kobe Sanders are RFA (TO) entries still at 0.
# But other RFA (TO) entries (Andre Jackson Jr., GG Jackson, etc.) are already
# handled by name. So we need to be careful not to double-mark.
# We mark by NAME first (above), then by faType but SKIP if already marked.
# To avoid double-mark, just skip the faType step \u2014 names cover all 21.
# (Names above include Karlo via "Karlo Matkovi\u0107"? No \u2014 I excluded it. Let me re-add.)

# Re-do: add Karlo and Kobe to the name list
for name in ["Karlo Matkovi\u0107", "Kobe Sanders"]:
    needle = f'name: "{name}"'
    idx = text.find(needle)
    if idx < 0:
        # Try without diacritics in case the file uses ASCII
        for alt in ["Karlo Matkovic", "Kobe Sanders"]:
            idx = text.find(f'name: "{alt}"')
            if idx >= 0: break
        if idx < 0:
            print(f"  [WARN] no match for {name!r}")
            continue
    close = text.find("},", idx)
    if close < 0: continue
    if "// __prior_salary_data_hole__" in text[close:close+60]:
        continue
    text = text[:close] + "}, // __prior_salary_data_hole__" + text[close+2:]
    added += 1

print(f"[ok] added {added} inline markers")

# Step 2: replace the bottom block with a one-line summary.
# Bottom block starts at "// __RFA_TO_DATA_HOLES__" (the second occurrence, line ~1740)
# and ends at the line "//   Trayce Jackson-Davis (TOR)" (the last data-holes line).
start_marker = "            // __RFA_TO_DATA_HOLES__\n"
end_marker_line = "            //   Trayce Jackson-Davis (TOR)\n"
start_idx = text.find(start_marker, text.find("const FREE_AGENTS"))  # 2nd occurrence
assert start_idx > 0, f"start marker not found"
end_idx = text.find(end_marker_line, start_idx)
assert end_idx > 0, f"end marker not found"
end_idx = text.find("\n", end_idx + len(end_marker_line)) + 1
replacement = (
    "            // RFA (TO) entries with // __prior_salary_data_hole__ are minor/rookie-scale;\n"
    "            // 2024-25 cap charges need per-player lookup. See inline markers on each row.\n"
)
text = text[:start_idx] + replacement + text[end_idx:]

with open(F, "w") as fh:
    fh.write(text)

# Verify
for cmd, label in [
    (["grep", "-cF", "// __prior_salary_data_hole__", F], "inline markers"),
    (["grep", "-cF", "//   Trayce Jackson-Davis (TOR)", F], "old block list"),
    (["grep", "-cF", "minor/rookie-scale", F], "new one-line summary"),
    (["grep", "-cE", "priorSalary:[[:space:]]*0[, }]", F], "remaining priorSalary:0 (expect 39)"),
    (["wc", "-c", F], "file size"),
]:
    r = subprocess.run(cmd, capture_output=True, text=True)
    print(f"  {label}: {r.stdout.strip()}")
