#!/usr/bin/env python3
"""Repair the cap-freshness assert insertion in nba.html and nba-contracts.html.

Bugs from the prior pass:
  - nba.html: insert landed BEFORE the ';' in '};', producing ');;' (double semicolon).
  - nba-contracts.html: insert landed mid-line because the anchor needle didn't
    cover the rest of the const CAP line, leaving a stray
    '— refresh from ... 2025-26-season' tail after ');'.

This script removes the malformed blocks (when present) and re-inserts them
correctly anchored on the actual end-of-line / end-of-data-block positions.
"""
import re, sys

EDIT_MARKER = "// __cap_freshness_check__"
CAP_URL = "https://www.nba.com/news/nba-salary-cap-set-2025-26"
STALE_MSG = f"NBA cap figures are out of date for current season — refresh from {CAP_URL}"

F1 = "/home/numberc/Desktop/sports sync/nba.html"
F2 = "/home/numberc/Desktop/sports sync/nba-contracts.html"


def remove_broken_block(text):
    """Find the marker line and delete through the line that closes the broken
    console.assert block plus one trailing blank line. Idempotent: returns the
    text unchanged if the marker is not present."""
    if EDIT_MARKER not in text:
        return text, False
    lines = text.split("\n")
    start = next(i for i, l in enumerate(lines) if l.strip() == EDIT_MARKER)
    # Find the line that closes the assert: the one whose stripped form starts with ');'
    end = None
    for j in range(start + 1, len(lines)):
        s = lines[j].lstrip()
        if s.startswith(");") or s.startswith(");;"):
            end = j + 1  # include this line
            break
    if end is None:
        # Couldn't find a closing line; bail out and let the operator inspect.
        raise SystemExit("couldn't find closing ');' line after marker")
    # Eat the trailing blank line if present.
    if end < len(lines) and lines[end].strip() == "":
        end += 1
    new = "\n".join(lines[:start] + lines[end:])
    return new, True


# ----------------------------------------------------------------------------
# nba.html
# ----------------------------------------------------------------------------
with open(F1, encoding="utf-8") as fh:
    text = fh.read()
text, removed = remove_broken_block(text)
print(f"[nba.html] removed broken block: {removed}")

# Re-insert at the proper position: just AFTER the '}' AND ';' of the data
# block close (i + 2 in brace-tracking, not i + 1).
idx = text.index("const NBA_CONTRACTS_DATA = {") + len("const NBA_CONTRACTS_DATA = ")
depth = 0
in_str = None
i = idx
while i < len(text):
    ch = text[i]
    if in_str:
        if ch == "\\": i += 2; continue
        if ch == in_str: in_str = None
        i += 1; continue
    if ch in ('"', "'"): in_str = ch; i += 1; continue
    if ch == "{":
        depth += 1
    elif ch == "}":
        depth -= 1
        if depth == 0:
            # Skip past both '}' and the trailing ';'
            insert_pos = i + 2
            break
    i += 1
else:
    raise SystemExit("nba.html: never found end of NBA_CONTRACTS_DATA")

prefix = text[:insert_pos]
suffix = text[insert_pos:]
# Ensure a clean blank line before the assert block.
if not prefix.endswith("\n\n"):
    if prefix.endswith("\n"):
        sep = "\n"
    else:
        sep = "\n\n"
else:
    sep = ""

insert_nba = (
    f"{EDIT_MARKER}\n"
    "console.assert(\n"
    "  NBA_CONTRACTS_DATA.LEAGUE_CAP.cap  === 154647000 &&\n"
    "  NBA_CONTRACTS_DATA.LEAGUE_CAP.lt   === 187895000 &&\n"
    "  NBA_CONTRACTS_DATA.LEAGUE_CAP.apr1 === 195945000 &&\n"
    "  NBA_CONTRACTS_DATA.LEAGUE_CAP.apr2 === 207824000,\n"
    f'  "{STALE_MSG}"\n'
    ");"
)
new_text = prefix + sep + insert_nba + "\n" + suffix
with open(F1, "w", encoding="utf-8") as fh:
    fh.write(new_text)
print(f"[nba.html] re-inserted assert at offset {insert_pos + len(sep)}")

# ----------------------------------------------------------------------------
# nba-contracts.html
# ----------------------------------------------------------------------------
with open(F2, encoding="utf-8") as fh:
    text = fh.read()
text, removed = remove_broken_block(text)
print(f"[nba-contracts.html] removed broken block: {removed}")

# Anchor on the START of the const CAP line and find the END of that line
# (the next newline), so the insert lands AFTER the line, not in the middle.
needle = "const CAP = 154647000;  // 2025-26 actual"
start = text.index(needle)
end_of_line = text.index("\n", start)
insert_pos = end_of_line + 1  # just after the newline (start of blank line)

prefix = text[:insert_pos]
suffix = text[insert_pos:]
if prefix.endswith("\n\n"):
    sep = ""
elif prefix.endswith("\n"):
    sep = "\n"
else:
    sep = "\n\n"

insert_contracts = (
    f"{EDIT_MARKER}\n"
    "console.assert(\n"
    "  CAP === 154647000,\n"
    f'  "{STALE_MSG}"\n'
    ");"
)
new_text = prefix + sep + insert_contracts + "\n" + suffix
with open(F2, "w", encoding="utf-8") as fh:
    fh.write(new_text)
print(f"[nba-contracts.html] re-inserted assert at offset {insert_pos + len(sep)}")
