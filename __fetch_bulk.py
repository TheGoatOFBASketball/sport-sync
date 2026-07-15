#!/usr/bin/env python3
"""Fetch player measurements via commonplayerinfo with retries & partial save."""

import re, json, os, time
from concurrent.futures import ThreadPoolExecutor, as_completed
import cloudscraper
from nba_api.stats.static import players as static_players

HTML = "/home/numberc/Desktop/sports sync/nba.html"
CACHE = "/tmp/player_info_cache.json"


def normalize(s):
    s = s.lower().strip()
    s = s.replace("'", "").replace(".", "").replace("-", " ").replace("_", " ")
    s = re.sub(r"\s+", " ", s)
    for sfx in [" iii", " ii", " jr", " sr"]:
        s = s.replace(sfx, "")
    return s.strip()


def fmt_ht(ht):
    if not ht:
        return ""
    p = ht.split("-")
    if len(p) == 2:
        try:
            return f"{p[0]}'{p[1]}\""
        except:
            pass
    return ht


def fetch_one(scraper, pid):
    url = f"https://stats.nba.com/stats/commonplayerinfo?PlayerID={pid}"
    for attempt in range(2):
        try:
            r = scraper.get(url, timeout=20)
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
                    return {
                        "height": fmt_ht(ht),
                        "weight": wt,
                        "school": h.get("SCHOOL", "") or "",
                    }
        except:
            time.sleep(1)
    return None


def main():
    t0 = time.time()

    # Load existing cache
    cache = {}
    if os.path.exists(CACHE):
        with open(CACHE) as f:
            cache = json.load(f)
    print(f"Cache: {len(cache)} entries")

    # Build name->pid map
    all_players = static_players.get_players()
    name_pid = {}
    for p in all_players:
        name_pid[normalize(p["full_name"])] = p["id"]

    # Extract pre-2026 names
    with open(HTML) as f:
        content = f.read()
    m = re.search(
        r"const NBA_DRAFT_DATA = ({.*?});\s*\n\s*(?:const|var|let|renderDraft)",
        content,
        re.DOTALL,
    )
    js = m.group(1)
    ym = list(re.finditer(r'"(\d{4})"\s*:\s*\[', js))
    idx = None
    for i, m2 in enumerate(ym):
        if m2.group(1) == "2026" and i + 1 < len(ym):
            idx = ym[i + 1].start()
            break
    pre = js[idx:] if idx else js
    names = set(re.findall(r'player:"([^"]+)"', pre))
    print(f"{len(names)} pre-2026 names")

    # Determine who to fetch
    to_fetch = []
    for name in sorted(names):
        key = normalize(name)
        if key in name_pid and str(name_pid[key]) not in cache:
            to_fetch.append((name, name_pid[key]))
    print(f"Need to fetch: {len(to_fetch)}")

    if not to_fetch:
        print("Nothing to fetch")
    else:
        scraper = cloudscraper.create_scraper()
        done = 0
        errors = 0
        batch_sz = 3
        for i in range(0, min(len(to_fetch), 500), batch_sz):
            batch = to_fetch[i : i + batch_sz]
            with ThreadPoolExecutor(max_workers=batch_sz) as ex:
                futures = {
                    ex.submit(fetch_one, scraper, pid): name for name, pid in batch
                }
                for f in as_completed(futures):
                    name = futures[f]
                    r = f.result()
                    if r:
                        cache[str(name_pid[normalize(name)])] = {"name": name, **r}
                    else:
                        errors += 1
                    done += 1

            if i % 60 == 0:
                elapsed = time.time() - t0
                print(f"  {done}/{len(to_fetch)} err={errors} {elapsed:.0f}s")
                with open(CACHE, "w") as f:
                    json.dump(cache, f, indent=2)

        with open(CACHE, "w") as f:
            json.dump(cache, f, indent=2)
        print(f"Done: {done} processed, {errors} errors, {time.time() - t0:.0f}s")

    # Update HTML
    print("Updating HTML...")
    with open(HTML) as f:
        content = f.read()

    # Build lookup from cache
    lookup = {}
    for pid, info in cache.items():
        lookup[normalize(info["name"])] = info

    # Find and replace player objects
    def fix_entry(m):
        obj = m.group(0)
        pname = m.group(1)
        key = normalize(pname)
        if key not in lookup:
            return obj
        info = lookup[key]
        obj = re.sub(
            r'(ht:)"[^"]*"', lambda m2: f'{m2.group(1)}"{info["height"]}"', obj
        )
        if info["weight"] is not None:
            obj = re.sub(r"(wt:)(null)", f"wt:{info['weight']}", obj)
        return obj

    draft_match = re.search(
        r"(NBA_DRAFT_DATA = \{.*?\});\s*\n\s*(?:const|var|let|renderDraft)",
        content,
        re.DOTALL,
    )
    if draft_match:
        draft_js = draft_match.group(1)
        # Find pre-2026 part
        ym = list(re.finditer(r'"(\d{4})"\s*:\s*\[', draft_js))
        pre_idx = None
        for i, m2 in enumerate(ym):
            if m2.group(1) == "2026" and i + 1 < len(ym):
                pre_idx = ym[i + 1].start()
                break
        if pre_idx:
            pre_part = draft_js[pre_idx:]
            pre_2026_end = draft_js.find('"2026"')
            before_2026 = draft_js[:pre_idx]
            new_pre = re.sub(
                r'(\{pick:\d+.*?player:"([^"]+)".*?\})',
                fix_entry,
                pre_part,
                flags=re.DOTALL,
            )
            new_draft = before_2026 + new_pre
            content = content.replace(draft_js, new_draft)
            with open(HTML, "w") as f:
                f.write(content)
            print("HTML updated!")
        else:
            print("Could not find pre-2026 boundary")
    else:
        print("Draft data not found")


if __name__ == "__main__":
    main()
