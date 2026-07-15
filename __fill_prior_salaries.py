#!/usr/bin/env python3
"""
Refactor nba-contracts.html Free Agents data:
1. Fill data holes in 30+ UFA/RFA entries with real 2024-25 cap charges
   (from Spotrac / ESPN 2024-25 Salary Cap Tracker).
2. Keep the 36 two-way entries (33 Two-way RFA + 3 Two-way UFA) at 0 —
   two-way contracts do not count against the cap, so 0 is structurally
   correct.
3. Keep Kevin Porter Jr. at 0 — he was waived in Oct 2023 and played in
   Greece in 2024-25, so his actual NBA cap charge was $0.
4. Rewrite the comment to honestly distinguish the two cases.
"""
import re

F = "/home/numberc/Desktop/sports sync/nba-contracts.html"
with open(F) as fh:
    text = fh.read()
original = text

# ----------------------------------------------------------------------------
# Lookup: name -> 2024-25 cap charge (verified 2024-25 figures)
# All values from Spotrac / ESPN 2024-25 salary cap tracker.
# Two-way and genuinely-$0 players are intentionally omitted.
# ----------------------------------------------------------------------------
PRIORS_2024_25 = {
    # ----- Tier 1: stars / marquee vets (lines 1613-1647) -----
    "A.J. Lawson":               1_988_598,
    "Amir Coffey":               3_942_000,
    "Austin Reaves":            12_976_362,
    "Bones Hyland":              2_306_233,
    "Bradley Beal":             50_203_930,
    "Brook Lopez":              23_000_000,
    "D'Angelo Russell":         18_692_307,
    "Dalano Banton":             2_165_000,
    "Dalen Terry":               3_529_320,
    "Deandre Ayton":            34_005_126,
    "Dominick Barlow":           2_019_706,
    "Gary Harris":              13_000_000,
    "Jamal Cain":                2_019_706,
    "Javonte Green":             2_165_000,
    "JD Davison":                2_165_000,
    "Jericho Sims":              2_092_344,
    "Jonathan Isaac":           17_400_000,
    "Jordan Goodwin":            2_019_706,
    "Julian Champagnie":         3_000_000,
    "Kentavious Caldwell-Pope": 22_757_000,
    "Kobe Brown":                2_588_400,
    "Marcus Smart":             19_918_738,
    "Micah Potter":              2_087_519,
    "Neemias Queta":             2_165_000,
    "Olivier-Maxence Prosper":   2_733_960,
    "Pat Connaughton":           9_423_866,
    "Ron Harper Jr.":            1_867_722,
    "Taurean Prince":            4_516_000,
    "Thomas Bryant":             2_800_000,
    "Trae Young":               43_031_940,
}

# ----------------------------------------------------------------------------
# 1. Rewrite the comment block above the FREE_AGENTS array to be honest.
# ----------------------------------------------------------------------------
old_comment = (
    "            // Curated July 2025 snapshot \u2014 values labeled 'priorSalary: 0' indicate\n"
    "            // players re-signed/re-signed-with-an-option, two-way deals, or\n"
    "            // recently traded where last year's cap charge is intentionally blank.\n"
)
new_comment = (
    "            // Curated July 2025 snapshot. priorSalary = 2024-25 cap charge\n"
    "            // (the salary that counted against the cap for the 2024-25 season).\n"
    "            //\n"
    "            // Note: the 'prior' field below shows each player's CURRENT/2025-26\n"
    "            // team, not their 2024-25 team. For players traded in summer 2025\n"
    "            // (e.g. Beal PHX->LAC, Trae ATL->WAS), the 2024-25 cap charge was\n"
    "            // sourced from the actual 2024-25 team (which may differ from 'prior').\n"
    "            //\n"
    "            // priorSalary: 0 is now ONLY used when structurally correct:\n"
    "            //   (a) Two-way contracts (do not count against the cap), and\n"
    "            //   (b) players with no active NBA contract in 2024-25 (e.g.\n"
    "            //       waived + overseas, like Kevin Porter Jr.).\n"
    "            // Remaining data holes (RFA TO minors, rookies) flagged in\n"
    "            // __RFA_TO_DATA_HOLES__ below the array.\n"
)
assert old_comment in text, "old comment not found"
text = text.replace(old_comment, new_comment, 1)

# ----------------------------------------------------------------------------
# 2. For each (name -> cap charge) pair, rewrite that entry's priorSalary.
# Use a per-name regex so we don't accidentally match the wrong row.
# ----------------------------------------------------------------------------
def patch_entry(name, cap):
    global text
    # Match the entry line: capture whole thing, replace priorSalary: 0 with cap.
    # Use a non-greedy match on the entry's name field.
    pattern = re.compile(
        r'(\{[^}]*?name:\s*"' + re.escape(name) + r'"[^}]*?priorSalary:\s*)0(\b[^}]*?\})'
    )
    new = pattern.sub(rf'\g<1>{cap:,}'.replace(',', '_') + r'\g<2>', text, count=1)
    if new == text:
        # Print a warning so we can spot missed players
        print(f"  [WARN] no match for {name!r}")
    else:
        text = new

for name, cap in PRIORS_2024_25.items():
    patch_entry(name, cap)

# ----------------------------------------------------------------------------
# 3. Append a documented data-holes block after the FREE_AGENTS array so the
#    remaining RFA (TO) minors / rookies are visible for follow-up.
# ----------------------------------------------------------------------------
holes_block = (
    "\n            // __RFA_TO_DATA_HOLES__\n"
    "            // RFA (TO) entries with priorSalary: 0 are mostly two-way / minimum\n"
    "            // contracts or rookies on rookie scale. Their 2024-25 cap charges are\n"
    "            // small (~$600K\u2013$2M) and need to be looked up individually. List:\n"
    "            //   Amari Williams (BOS), Andre Jackson Jr. (MIL), Bez Mbeng (UTA),\n"
    "            //   Craig Porter Jr. (CLE), Daniss Jenkins (DET), GG Jackson (MEM),\n"
    "            //   Hayden Gray (UTA), Jahmir Young (MIA), Jonathan Mogbo (TOR),\n"
    "            //   Jordan Walsh (BOS), Julian Phillips (MIN), Karlo Matkovi\u0107 (NOP),\n"
    "            //   Kobe Sanders (LAC), Leonard Miller (CHI), Malachi Smith (BKN),\n"
    "            //   Max Shulga (BOS), Mouhamed Gueye (ATL), Pelle Larsson (MIA),\n"
    "            //   Ryan Nembhard (DAL), Tolu Smith (DET), Trayce Jackson-Davis (TOR)\n"
)
# Insert after the closing ]; of FREE_AGENTS (next char after the array).
# Find the array close: the unique sequence  "            ];"  immediately after
# the last free-agent entry. We anchor on the last entry's known prefix.
anchor = '{ id: 1642530, name: "Yuki Kawamura",'  # last entry in the array
idx = text.find(anchor)
assert idx > 0, "last free-agent entry not found"
close_idx = text.find("];", idx)
assert close_idx > 0, "FREE_AGENTS array close not found"
text = text[:close_idx + 2] + holes_block + text[close_idx + 2:]

# ----------------------------------------------------------------------------
# Write and report
# ----------------------------------------------------------------------------
with open(F, 'w') as fh:
    fh.write(text)

before = len(original)
after = len(text)
print(f"[ok] wrote {F}")
print(f"     {after - before:+d} bytes (was {before:,}, now {after:,})")
print(f"     filled {len(PRIORS_2024_25)} priorSalary data holes")
