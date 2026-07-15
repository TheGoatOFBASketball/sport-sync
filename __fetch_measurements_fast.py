#!/usr/bin/env python3
"""Fetch height/weight/school for pre-2026 draft players via nba_api."""

import re, json, sys, time, os
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from nba_api.stats.static import players as static_players

NBA_HTML = "/home/numberc/Desktop/sports sync/nba.html"
CACHE_FILE = "/tmp/player_meas_cache.json"

REQ_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://www.nba.com/",
    "Accept": "application/json",
    "Accept-Encoding": "gzip, deflate",
}


def normalize(s):
    s = s.lower().strip()
    s = s.replace("'", "").replace(".", "").replace("-", " ").replace("_", " ")
    s = re.sub(r"\s+", " ", s)
    for sfx in [" iii", " ii", " jr", " sr"]:
        s = s.replace(sfx, "")
    return s.strip()


def fmt_height(ht):
    if not ht:
        return ""
    parts = ht.split("-")
    if len(parts) == 2:
        try:
            return f"{parts[0]}'{parts[1]}\""
        except:
            pass
    return ht


def fetch_one(pid):
    url = f"https://stats.nba.com/stats/commonplayerinfo?PlayerID={pid}"
    for attempt in range(3):
        try:
            r = requests.get(url, headers=REQ_HEADERS, timeout=20)
            if r.status_code != 200:
                continue
            data = r.json()
            for rs in data["resultSets"]:
                if rs["name"] == "CommonPlayerInfo":
                    row = rs["rowSet"][0]
                    h = dict(zip(rs["headers"], row))
                    ht = h.get("HEIGHT", "") or ""
                    wt = h.get("WEIGHT", "") or ""
                    if wt:
                        try:
                            wt = int(wt)
                        except:
                            wt = None
                    else:
                        wt = None
                    return {"height": fmt_height(ht), "weight": wt}
        except:
            if attempt < 2:
                time.sleep(1.5)
    return None


def main():
    t0 = time.time()
    cache = {}
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE) as f:
            cache = json.load(f)
        print(f"Loaded {len(cache)} cached")

    all_players = static_players.get_players()
    name_map = {}
    for p in all_players:
        name_map[normalize(p["full_name"])] = p["id"]
    print(f"Name map: {len(name_map)} entries")

    with open(NBA_HTML) as f:
        content = f.read()

    m = re.search(
        r"const NBA_DRAFT_DATA = ({.*?});\s*\n\s*(?:const|var|let|renderDraft)",
        content,
        re.DOTALL,
    )
    js = m.group(1)

    # Find pre-2026 portion
    year_matches = list(re.finditer(r'"(\d{4})"\s*:\s*\[', js))
    pre_idx = None
    for i, ym in enumerate(year_matches):
        if ym.group(1) == "2026" and i + 1 < len(year_matches):
            pre_idx = year_matches[i + 1].start()
            break
    pre_js = js[pre_idx:] if pre_idx else js

    # Extract unique names from pre-2026 data
    names = set(re.findall(r'player:"([^"]+)"', pre_js))
    print(f"{len(names)} unique pre-2026 names")

    # Determine who needs fetching
    to_fetch = []
    for name in sorted(names):
        key = normalize(name)
        if key in name_map and key not in cache:
            to_fetch.append((name, name_map[key]))
    print(f"Need to fetch: {len(to_fetch)}")

    if to_fetch:
        results = []
        batch_sz = 5
        errors = 0
        for i in range(0, len(to_fetch), batch_sz):
            batch = to_fetch[i : i + batch_sz]
            with ThreadPoolExecutor(max_workers=batch_sz) as ex:
                futures = {
                    ex.submit(fetch_one, pid): (name, pid) for name, pid in batch
                }
                for f in as_completed(futures):
                    name, pid = futures[f]
                    r = f.result()
                    if r:
                        cache[normalize(name)] = r
                        results.append(r)
                    else:
                        errors += 1

            if i % 100 == 0:
                done = min(i + batch_sz, len(to_fetch))
                pct = done * 100 / len(to_fetch)
                elapsed = time.time() - t0
                print(
                    f"  {done}/{len(to_fetch)} ({pct:.0f}%) err={errors} {elapsed:.0f}s"
                )
                with open(CACHE_FILE, "w") as f:
                    json.dump(cache, f)

        with open(CACHE_FILE, "w") as f:
            json.dump(cache, f)
        elapsed = time.time() - t0
        print(f"Done fetching: {len(cache)} cached, {errors} errors in {elapsed:.0f}s")

    # Now update HTML: for each player name, find and replace ht/wt in the draft data
    print("Updating HTML...")

    def replace_in_obj(m):
        obj = m.group(0)
        pname = m.group(1)
        key = normalize(pname)
        if key not in cache:
            return obj
        info = cache[key]
        # Replace ht
        obj = re.sub(
            r'(,\s*ht:)"[^"]*"', lambda m2: f'{m2.group(1)}"{info["height"]}"', obj
        )
        # Replace wt
        if info["weight"] is not None:
            obj = re.sub(
                r'(,\s*wt:)(null|"[^"]*")',
                lambda m2: f"{m2.group(1)}{info['weight']}",
                obj,
            )
        return obj

    # Match player objects in pre-2026 data
    pattern = re.compile(r'(\{pick:\d+[^}]*?player:"([^"]+)"[^}]*?\})')
    new_pre = pattern.sub(replace_in_obj, pre_js)

    new_js = js[:pre_idx] + new_pre if pre_idx else new_pre
    content = content.replace(m.group(1), new_js)

    with open(NBA_HTML, "w") as f:
        f.write(content)
    print("HTML updated!")


if __name__ == "__main__":
    main()
