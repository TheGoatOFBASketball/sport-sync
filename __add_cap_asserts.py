#!/usr/bin/env python3
"""Insert a console.assert freshness check next to the cap-data anchors in
nba.html and nba-contracts.html. Idempotent (skips if marker present).

Adopts reviewer feedback:
  - nba.html assert reads the CANONICAL LEAGUE_CAP.cap/lt/apr1/apr2 (not the
    legacy aliases), so this becomes the first real consumer of LEAGUE_CAP and
    the single source of truth is enforced at startup.
  - marker is a single-line // comment to match the surrounding style.

Anchors via brace-tracking to find the actual data-block close (the teams
array isn't the last field inside NBA_CONTRACTS_DATA)."""
import sys

EDIT_MARKER = "// __cap_freshness_check__"
CAP_URL = "https://www.nba.com/news/nba-salary-cap-set-2025-26"
STALE_MSG = f"NBA cap figures are out of date for current season — refresh from {CAP_URL}"

def patch(path, find_anchor, build_insert, label):
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    if EDIT_MARKER in text:
        print(f"[skip] {label}: already patched")
        return
    start, end = find_anchor(text)
    insert = build_insert()
    new_text = text[:end] + ("\n\n" if text[end-1] != "\n" else "\n") + insert + text[end:]
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(new_text)
    print(f"[OK]   {label}: inserted console.assert at offset {end}")

# ----------------------------------------------------------------------------
# nba.html — find the closing `};` of `const NBA_CONTRACTS_DATA = {` via
# brace-tracking, then insert the assert there. Works regardless of how many
# extra fields sit between the teams array and the data-block close.
# ----------------------------------------------------------------------------
def find_nba_data_block_close(text):
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
        if ch in ('"', "'"):
            in_str = ch; i += 1; continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return idx, i + 1  # include the '}' and ';'
        i += 1
    raise SystemExit("nba.html: never found end of NBA_CONTRACTS_DATA")

def build_nba_insert():
    return (
        f"{EDIT_MARKER}\n"
        "console.assert(\n"
        "  NBA_CONTRACTS_DATA.LEAGUE_CAP.cap  === 154647000 &&\n"
        "  NBA_CONTRACTS_DATA.LEAGUE_CAP.lt   === 187895000 &&\n"
        "  NBA_CONTRACTS_DATA.LEAGUE_CAP.apr1 === 195945000 &&\n"
        "  NBA_CONTRACTS_DATA.LEAGUE_CAP.apr2 === 207824000,\n"
        f'  "{STALE_MSG}"\n'
        ");"
    )

patch(
    "/home/numberc/Desktop/sports sync/nba.html",
    find_nba_data_block_close,
    build_nba_insert,
    "nba.html NBA_CONTRACTS_DATA close",
)

# ----------------------------------------------------------------------------
# nba-contracts.html — anchor on the unique `const CAP = 154647000;` line
# (preceded by 12 spaces of indent inside the script tag).
# ----------------------------------------------------------------------------
def find_contracts_cap(text):
    needle = "            const CAP = 154647000;  // 2025-26 actual"
    if needle not in text:
        raise SystemExit("nba-contracts.html: const CAP line not found")
    return None, text.index(needle) + len(needle)  # end of the line

def build_contracts_insert():
    return (
        "\n"
        f"{EDIT_MARKER}\n"
        "console.assert(\n"
        "  CAP === 154647000,\n"
        f'  "{STALE_MSG}"\n'
        ");"
    )

patch(
    "/home/numberc/Desktop/sports sync/nba-contracts.html",
    find_contracts_cap,
    build_contracts_insert,
    "nba-contracts.html const CAP",
)
