#!/usr/bin/env python3
"""Fetch height/weight from B-R player pages for pre-2026 draft picks."""

import re, json, sys, time, os
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from nba_api.stats.static import players as static_players

HTML = "/home/numberc/Desktop/sports sync/nba.html"
CACHE = "/tmp/br_ht_wt_cache.json"
BR_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}


def normalize(s):
    s = s.lower().strip()
    s = s.replace("'", "").replace(".", "").replace("-", " ").replace("_", " ")
    s = re.sub(r"\s+", " ", s)
    for sfx in [" iii", " ii", " jr", " sr"]:
        s = s.replace(sfx, "")
    return s.strip()


def generate_br_url(player_name):
    parts = player_name.strip().split()
    if len(parts) < 2:
        return None
    first = re.sub(r"[^a-zA-Z]", "", parts[0]).lower()
    last = re.sub(r"[^a-zA-Z]", "", parts[-1]).lower()
    if not first or not last or not last[0]:
        return None
    return f"https://www.basketball-reference.com/players/{last[0]}/{last[:5]}{first[:2]}01.html"


def fetch_ht_wt(name, url):
    for attempt in range(2):
        try:
            r = requests.get(url, headers=BR_HEADERS, timeout=15)
            if r.status_code != 200:
                continue
            html = r.text
            m = re.search(r"<p><span>(\d+-\d+)</span>,&nbsp;<span>(\d+)lb</span>", html)
            if m:
                ht = m.group(1)
                wt = int(m.group(2))
                parts = ht.split("-")
                ht_fmt = f"{parts[0]}'{parts[1]}\"" if len(parts) == 2 else ht
                return {"height": ht_fmt, "weight": wt}
            # Try alternative pattern for empty weight
            m2 = re.search(r"<span>(\d+-\d+)</span>", html)
            if m2:
                parts = m2.group(1).split("-")
                ht_fmt = f"{parts[0]}'{parts[1]}\"" if len(parts) == 2 else m2.group(1)
                return {"height": ht_fmt, "weight": None}
        except:
            if attempt < 1:
                time.sleep(1)
    return None


def main():
    t0 = time.time()
    cache = {}
    if os.path.exists(CACHE):
        with open(CACHE) as f:
            cache = json.load(f)
    print(f"Cache: {len(cache)} entries")

    # Extract pre-2026 player names
    with open(HTML) as f:
        content = f.read()
    m = re.search(
        r"const NBA_DRAFT_DATA = ({.*?});\s*\n\s*(?:const|var|let|renderDraft)",
        content,
        re.DOTALL,
    )
    js = m.group(1)
    ym = list(re.finditer(r'"(\d{4})"\s*:\s*\[', js))
    pre_idx = None
    for i, m2 in enumerate(ym):
        if m2.group(1) == "2026" and i + 1 < len(ym):
            pre_idx = ym[i + 1].start()
            break
    pre = js[pre_idx:] if pre_idx else js
    names = list(set(re.findall(r'player:"([^"]+)"', pre)))
    print(f"{len(names)} pre-2026 names")

    # Generate URLs and filter out cached
    to_fetch = []
    for name in sorted(names):
        key = normalize(name)
        if key in cache:
            continue
        url = generate_br_url(name)
        if url:
            to_fetch.append((name, key, url))
    print(f"Need to fetch: {len(to_fetch)}")

    if not to_fetch:
        print("Nothing to fetch")
    else:
        session = requests.Session()
        done = 0
        errors = 0
        batch_sz = 10
        for i in range(0, min(len(to_fetch), 4000), batch_sz):
            batch = to_fetch[i : i + batch_sz]
            with ThreadPoolExecutor(max_workers=batch_sz) as ex:
                futures = {
                    ex.submit(fetch_ht_wt, name, url): (name, key)
                    for name, key, url in batch
                }
                for f in as_completed(futures):
                    name, key = futures[f]
                    r = f.result()
                    if r:
                        cache[key] = r
                    else:
                        cache[key] = None  # mark as attempted
                    done += 1

            if i % 200 == 0:
                elapsed = time.time() - t0
                succ = sum(1 for v in cache.values() if v is not None)
                print(
                    f"  {done}/{len(to_fetch)} succ={succ} err={errors} {elapsed:.0f}s"
                )
                with open(CACHE, "w") as f:
                    json.dump(cache, f)

        with open(CACHE, "w") as f:
            json.dump(cache, f)
        elapsed = time.time() - t0
        succ = sum(1 for v in cache.values() if v is not None and v)
        print(f"Done: {done} processed, {succ} successes, {elapsed:.0f}s")

    # Update HTML
    print("Updating HTML...")
    with open(HTML) as f:
        content = f.read()

    def fix_entry(m):
        obj = m.group(0)
        pname = m.group(1)
        key = normalize(pname)
        if key not in cache or not cache[key]:
            return obj
        info = cache[key]
        if info.get("height"):
            obj = re.sub(
                r'(ht:)"[^"]*"', lambda m2: f'{m2.group(1)}"{info["height"]}"', obj
            )
        if info.get("weight") is not None:
            obj = re.sub(r"(wt:)(null)", f"wt:{info['weight']}", obj)
        return obj

    draft_match = re.search(
        r"(NBA_DRAFT_DATA = \{.*?\});\s*\n\s*(?:const|var|let|renderDraft)",
        content,
        re.DOTALL,
    )
    if draft_match:
        draft_js = draft_match.group(1)
        ym = list(re.finditer(r'"(\d{4})"\s*:\s*\[', draft_js))
        pre_idx = None
        for i, m2 in enumerate(ym):
            if m2.group(1) == "2026" and i + 1 < len(ym):
                pre_idx = ym[i + 1].start()
                break
        if pre_idx:
            pre_part = draft_js[pre_idx:]
            new_pre = re.sub(
                r'(\{pick:\d+.*?player:"([^"]+)".*?\})',
                fix_entry,
                pre_part,
                flags=re.DOTALL,
            )
            new_draft = draft_js[:pre_idx] + new_pre
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
