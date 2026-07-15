#!/usr/bin/env python3
"""Fetch height/weight/college/birthdate for pre-2026 draft players via nba_api."""

import re, json, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from nba_api.stats.static import players as static_players
from nba_api.stats.endpoints import commonplayerinfo

NBA_HTML = "/home/numberc/Desktop/sports sync/nba.html"


def normalize(s):
    s = s.lower().strip()
    s = s.replace("'", "").replace(".", "").replace("-", " ").replace("_", " ")
    s = re.sub(r"\s+", " ", s)
    for suffix in [" iii", " ii", " jr", " sr"]:
        s = s.replace(suffix, "")
    return s.strip()


def extract_pre2026_names():
    with open(NBA_HTML) as f:
        content = f.read()
    m = re.search(
        r"const NBA_DRAFT_DATA = ({.*?});\s*\n\s*(?:const|var|let|renderDraft)",
        content,
        re.DOTALL,
    )
    if not m:
        raise RuntimeError("NBA_DRAFT_DATA not found")
    js = m.group(1)
    names = set()
    year_matches = list(re.finditer(r'"(\d{4})"\s*:\s*\[', js))
    idx_2025 = None
    for i, m2 in enumerate(year_matches):
        if m2.group(1) == "2026" and i + 1 < len(year_matches):
            idx_2025 = year_matches[i + 1].start()
            break
    pre_block = js[idx_2025:] if idx_2025 else js
    for m3 in re.finditer(r'player:"([^"]+)"', pre_block):
        names.add(m3.group(1))
    return names, content


def fetch_info(name, pid):
    try:
        info = commonplayerinfo.CommonPlayerInfo(player_id=pid, timeout=60)
        df = info.get_data_frames()[0]
        row = df.iloc[0]
        ht = row.get("HEIGHT", "") or ""
        wt = row.get("WEIGHT", "") or ""
        if wt:
            try:
                wt = int(wt)
            except:
                pass
        else:
            wt = None
        school = row.get("SCHOOL", "") or ""
        bd = row.get("BIRTHDATE", "") or ""
        pos = row.get("POSITION", "") or ""
        return {
            "name": name,
            "height": ht,
            "weight": wt,
            "school": school,
            "birthdate": bd,
            "pos": pos,
        }
    except Exception as e:
        return {"name": name, "error": str(e)}


def main():
    print("Extracting pre-2026 player names...")
    names, full_content = extract_pre2026_names()
    print(f"Found {len(names)} unique pre-2026 player names")

    print("Building NBA player name map...")
    all_players = static_players.get_players()
    name_map = {}
    for p in all_players:
        key = normalize(p["full_name"])
        name_map[key] = p["id"]

    # Find matches
    matched = []
    unmatched = []
    for name in sorted(names):
        key = normalize(name)
        if key in name_map:
            matched.append((name, name_map[key]))
        else:
            unmatched.append(name)

    print(f"Matched {len(matched)} players, unmatched {len(unmatched)}")

    if not matched:
        print("No matches, exiting")
        return

    # Fetch info with concurrency
    results = {}
    errors = 0
    t0 = time.time()

    batch_size = 10
    for i in range(0, len(matched), batch_size):
        batch = matched[i : i + batch_size]
        with ThreadPoolExecutor(max_workers=batch_size) as ex:
            futures = {ex.submit(fetch_info, name, pid): name for name, pid in batch}
            for f in as_completed(futures):
                r = f.result()
                if "error" in r:
                    errors += 1
                else:
                    results[r["name"]] = r

        if (i // batch_size) % 10 == 0 or i + batch_size >= len(matched):
            elapsed = time.time() - t0
            rate = (i + batch_size) / elapsed if elapsed > 0 else 0
            pct = min(100, (i + batch_size) * 100 / len(matched))
            print(
                f"  {i + batch_size}/{len(matched)} ({pct:.0f}%) - {rate:.0f}/s, {errors} errors"
            )

    elapsed = time.time() - t0
    print(f"Done: {len(results)} results, {errors} errors in {elapsed:.0f}s")

    # Save to file
    out = {"players": results, "unmatched": sorted(unmatched)}
    with open("/tmp/player_measurements.json", "w") as f:
        json.dump(out, f, indent=2)
    print(
        f"Saved /tmp/player_measurements.json ({len(results)} players, {len(unmatched)} unmatched)"
    )


if __name__ == "__main__":
    main()
