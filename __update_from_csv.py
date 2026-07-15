#!/usr/bin/env python3
"""Update nba.html with height/weight/age from Players.csv (Kaggle NBA dataset),
falling back to Wikipedia cache for players not in CSV."""

import re, json, csv, os
from datetime import date
from collections import OrderedDict

HTML = "/home/numberc/Desktop/sports sync/nba.html"
CSV_PATH = "/home/numberc/.cache/kagglehub/datasets/eoinamoore/historical-nba-data-and-player-box-scores/versions/515/Players.csv"
WIKI_CACHE = "/tmp/wiki_data_cache.json"


def log(msg):
    print(msg, flush=True)


def inches_to_ht_str(inches):
    """Convert inches (82) to height string (6'10\")."""
    try:
        in_val = int(inches)
        ft = in_val // 12
        rem = in_val % 12
        return f"{ft}'{rem}\""
    except:
        return None


def normalize(s):
    """Normalize name for matching: lowercase, strip."""
    return s.lower().strip()


def normalize_no_suffix(s):
    """Normalize name and remove Jr/Sr/III suffix."""
    s = s.lower().strip()
    s = re.sub(r"\s+(jr\.?|sr\.?|iii|ii|iv)$", "", s).strip()
    return s


def calc_age(birth_date_str, draft_year):
    """Calculate age at approx draft date (June 25 of draft year)."""
    try:
        parts = birth_date_str.split("-")
        bd = date(int(parts[0]), int(parts[1]), int(parts[2]))
        draft_date = date(int(draft_year), 6, 25)
        age_years = (
            draft_date.year
            - bd.year
            - ((draft_date.month, draft_date.day) < (bd.month, bd.day))
        )
        last_birthday = date(
            draft_date.year
            if (draft_date.month, draft_date.day) >= (bd.month, bd.day)
            else draft_date.year - 1,
            bd.month,
            bd.day,
        )
        days_since_bday = (draft_date - last_birthday).days
        return round(age_years + days_since_bday / 365.0, 1)
    except:
        return None


def load_csv_lookup():
    """Load Players.csv into lookups: by (name, draft_year) and by name alone."""
    exact_lookup = {}  # (normalized_name, draft_year) -> info
    name_lookup = {}  # normalized_name -> first info (fallback)
    with open(CSV_PATH) as f:
        reader = csv.DictReader(f)
        for row in reader:
            fn = row.get("firstName", "") or ""
            ln = row.get("lastName", "") or ""
            full_name = f"{fn} {ln}".strip()
            if not full_name:
                continue
            key = normalize(full_name)
            draft_yr = row.get("draftYear", "") or ""

            ht = (
                inches_to_ht_str(row.get("heightInches", ""))
                if row.get("heightInches")
                else None
            )
            wt = int(row["bodyWeightLbs"]) if row.get("bodyWeightLbs") else None
            bd = row.get("birthDate", "") or None

            if ht or wt or bd:
                info = {}
                if ht:
                    info["height"] = ht
                if wt:
                    info["weight"] = wt
                if bd:
                    info["birth_date"] = bd

                if draft_yr:
                    exact_lookup[(key, draft_yr)] = info

                if key not in name_lookup:
                    name_lookup[key] = info
                else:
                    for k, v in info.items():
                        if k not in name_lookup[key]:
                            name_lookup[key][k] = v
    return exact_lookup, name_lookup


def load_wiki_cache():
    if os.path.exists(WIKI_CACHE):
        with open(WIKI_CACHE) as f:
            return json.load(f)
    return {}


def escape_ht(ht_val):
    """Escape height for JS string: 6'9" -> 6'9\\'"""
    return ht_val.replace('"', '\\"')


def main():
    # Load data sources
    csv_exact, csv_name = load_csv_lookup()
    wiki_cache = load_wiki_cache()
    log(f"CSV exact: {len(csv_exact)} entries, name lookup: {len(csv_name)} players")
    log(f"Wiki cache: {len(wiki_cache)} entries")

    # Read HTML
    with open(HTML) as f:
        content = f.read()

    # Find NBA_DRAFT_DATA
    m = re.search(
        r"(NBA_DRAFT_DATA = \{.*?\});\s*\n\s*(?:const|var|let|renderDraft)",
        content,
        re.DOTALL,
    )
    draft_js = m.group(1)

    # Extract all entries with their draft year
    all_entries = []
    for ym2 in re.finditer(r'"(\d{4})"\s*:\s*\[', draft_js):
        year = ym2.group(1)
        if year == "2026":
            continue  # Skip 2026 (already has data)
        start = ym2.end()
        depth = 1
        i = start
        while i < len(draft_js) and depth > 0:
            if draft_js[i] == "[":
                depth += 1
            elif draft_js[i] == "]":
                depth -= 1
            i += 1
        year_content = draft_js[start : i - 1]
        for em in re.finditer(
            r'\{pick:\d+.*?player:"([^"]+)".*?\}', year_content, re.DOTALL
        ):
            all_entries.append((year, em.group(0), em.group(1)))

    log(f"Pre-2026 entries to process: {len(all_entries)}")

    # Process entries
    stats = {"csv_hit": 0, "wiki_hit": 0, "miss": 0, "updated": 0}
    entry_replacements = OrderedDict()

    for year, entry_str, pname in all_entries:
        key = normalize(pname)
        key_ns = normalize_no_suffix(pname)
        info = None
        source = None

        # Try CSV: exact (name + draft_year) match first
        exact_match = csv_exact.get((key, year))
        if exact_match:
            info = exact_match
            source = "csv_exact"
        else:
            exact_match_ns = csv_exact.get((key_ns, year))
            if exact_match_ns:
                info = exact_match_ns
                source = "csv_exact"
        # Fall back to CSV name-only lookup
        if not info:
            if key in csv_name:
                info = csv_name[key]
                source = "csv_name"
            elif key_ns in csv_name:
                info = csv_name[key_ns]
                source = "csv_name"
        # Try Wikipedia fallback
        if not info and key in wiki_cache:
            wc = wiki_cache[key]
            if wc and isinstance(wc, dict):
                info = wc
                source = "wiki"
        if not info and key_ns in wiki_cache:
            wc = wiki_cache[key_ns]
            if wc and isinstance(wc, dict):
                info = wc
                source = "wiki"

        if info:
            if source.startswith("csv"):
                stats["csv_hit"] = stats.get("csv_hit", 0) + 1
            else:
                stats["wiki_hit"] = stats.get("wiki_hit", 0) + 1
        if not info:
            stats["miss"] = stats.get("miss", 0) + 1
            continue

        if not info:
            stats["miss"] += 1
            continue

        modified = entry_str

        if info.get("height"):
            modified = re.sub(
                r'(ht:)"[^"]*"',
                lambda m2: f'ht:"{escape_ht(info["height"])}"',
                modified,
            )

        if info.get("weight") is not None:
            modified = re.sub(r"(wt:)(null)", f"wt:{info['weight']}", modified)

        age_val = info.get("age")
        if age_val is None and info.get("birth_date"):
            age_val = calc_age(info["birth_date"], year)
        if age_val is not None:
            modified = re.sub(r"age:null", f"age:{age_val}", modified)

        if modified != entry_str:
            entry_replacements[entry_str] = modified
            stats["updated"] += 1

    log(
        f"Stats: CSV={stats['csv_hit']} Wiki={stats['wiki_hit']} Miss={stats['miss']} Updated={stats['updated']}"
    )

    # Apply replacements
    if entry_replacements:
        new_js = draft_js
        for old, new in entry_replacements.items():
            new_js = new_js.replace(old, new, 1)
        content = content.replace(draft_js, new_js, 1)
        with open(HTML, "w") as f:
            f.write(content)
        log("HTML updated!")
    else:
        log("No changes made")


if __name__ == "__main__":
    main()
