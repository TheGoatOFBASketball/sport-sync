#!/usr/bin/env python3
"""
Idempotent comment update: clarify that the 'prior' field in the data shows
each player's CURRENT/2025-26 team (not their 2024-25 team), so future
maintainers understand where the 2024-25 cap charges were sourced from.
"""
F = "/home/numberc/Desktop/sports sync/nba-contracts.html"
with open(F) as fh:
    text = fh.read()

# Current comment (what Pass 1 wrote)
old_comment = (
    "            // Curated July 2025 snapshot. priorSalary = 2024-25 cap charge.\n"
    "            // priorSalary: 0 is now ONLY used when structurally correct:\n"
    "            //   (a) Two-way contracts (do not count against the cap), and\n"
    "            //   (b) players with no active NBA contract in 2024-25 (e.g.\n"
    "            //       waived + overseas, like Kevin Porter Jr.).\n"
    "            // Remaining data holes (RFA TO minors, rookies) flagged in\n"
    "            // __RFA_TO_DATA_HOLES__ below the array.\n"
)

# New comment: adds a critical note about 'prior' field semantic
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

if old_comment in text:
    text = text.replace(old_comment, new_comment, 1)
    with open(F, "w") as fh:
        fh.write(text)
    print(f"[ok] comment updated: +{len(new_comment) - len(old_comment)} bytes")
else:
    # Check if already updated
    if "shows each player's CURRENT/2025-26" in text:
        print("[skip] comment already updated to new form")
    else:
        print("[error] old comment not found; manual inspection needed")
        # Show what's there
        idx = text.find("Curated July 2025 snapshot")
        if idx > 0:
            print("  current text around the comment:")
            print("  " + text[idx:idx+600].replace("\n", "\n  "))
