#!/usr/bin/env python3
"""Fetch height/weight/birthdate from Wikipedia for all pre-2026 draft picks,
calculate age at draft, and update nba.html. Uses batch queries with
(basketball) suffix fallback and exponential backoff on rate limits."""

import re, json, sys, time, os, urllib.request, urllib.parse
from datetime import date
from collections import OrderedDict

HTML = "/home/numberc/Desktop/sports sync/nba.html"
CACHE = "/tmp/wiki_data_cache.json"
HEADERS = {"User-Agent": "SportsSync/1.0 (research project; contact@example.com)"}
BATCH_SIZE = 50
BASE_DELAY = 1.0


def log(msg):
    print(msg, flush=True)


def fetch_json(url, retries=5):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            resp = urllib.request.urlopen(req, timeout=20)
            return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = (2**attempt) * BASE_DELAY
                log(f"    429: waiting {wait:.0f}s (attempt {attempt + 1}/{retries})")
                time.sleep(wait)
            else:
                raise
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(BASE_DELAY)
            else:
                raise


def parse_wikitext(wt):
    """Parse Wikipedia infobox for height/weight/birth_date."""
    result = {}
    ht_ft = re.search(r"\|\s*height_ft\s*=\s*(\d+)", wt)
    ht_in = re.search(r"\|\s*height_in\s*=\s*(\d+)", wt)
    if ht_ft and ht_in:
        result["height"] = f"{ht_ft.group(1)}'{ht_in.group(1)}\""
    else:
        ht_alt = re.search(
            r"\|\s*height\s*=\s*(\d+)\s*ft\s*(\d+)\s*in", wt, re.IGNORECASE
        )
        if ht_alt:
            result["height"] = f"{ht_alt.group(1)}'{ht_alt.group(2)}\""
    wt_lb = re.search(r"\|\s*weight_lbs?\s*=\s*(\d+)", wt)
    if wt_lb:
        result["weight"] = int(wt_lb.group(1))
    else:
        wt_alt = re.search(r"\|\s*weight\s*=\s*(\d+)\s*lb", wt, re.IGNORECASE)
        if wt_alt:
            result["weight"] = int(wt_alt.group(1))
    bday = re.search(
        r"\|\s*birth_date\s*=\s*\{\{birth\s*date\s*(?:and\s*age)?[^}]*?\|(\d{4})\|(\d{1,2})\|(\d{1,2})",
        wt,
        re.IGNORECASE,
    )
    if bday:
        result["birth_date"] = (
            f"{bday.group(1)}-{bday.group(2).zfill(2)}-{bday.group(3).zfill(2)}"
        )
    return result


def calc_age_at_draft(birth_date_str, draft_year):
    try:
        parts = birth_date_str.split("-")
        bd = date(int(parts[0]), int(parts[1]), int(parts[2]))
        draft_date = date(int(draft_year), 6, 25)
        age_years = (
            draft_date.year
            - bd.year
            - ((draft_date.month, draft_date.day) < (bd.month, bd.day))
        )
        bd_this_year = date(draft_date.year, bd.month, bd.day)
        days_since_bday = (draft_date - bd_this_year).days
        return round(age_years + days_since_bday / 365.0, 1)
    except:
        return None


def generate_candidates(name):
    """Generate possible Wikipedia page titles for a player name."""
    cands = []
    # 1. As-is
    cands.append(name)
    # 2. (basketball) suffix
    cands.append(name + " (basketball)")
    # 3. Remove Jr./Sr./III
    base = re.sub(r"\s+(?:Jr\.?|Sr\.?|III|II|IV)$", "", name, flags=re.I).strip()
    if base != name:
        cands.append(base)
        cands.append(base + " (basketball)")
    # 4. Remove all periods
    no_periods = name.replace(".", "")
    if no_periods != name:
        cands.append(no_periods)
        cands.append(no_periods + " (basketball)")
    # 5. Add periods after initials (e.g., "AJ Griffin" -> "A.J. Griffin")
    if "." not in name:
        parts = name.split()
        if len(parts) >= 2 and all(
            len(p) <= 2 and p.isalpha() and p.isupper() for p in parts[:-1]
        ):
            with_periods = ". ".join(p[0] for p in parts[:-1]) + ". " + parts[-1]
            cands.append(with_periods)
            cands.append(with_periods + " (basketball)")
    # 6. Handle initials like "A.W." -> "A. W."
    if "." in name:
        # Try adding spaces after periods: "A.W." -> "A. W."
        spaced = re.sub(r"\.(\w)", r". \1", name)
        if spaced != name:
            cands.append(spaced)
            cands.append(spaced + " (basketball)")
    # Deduplicate preserving order
    seen = set()
    return [c for c in cands if not (c in seen or seen.add(c))]


def main():
    t0 = time.time()
    cache = {}
    if os.path.exists(CACHE):
        with open(CACHE) as f:
            cache = json.load(f)
    log(f"Wiki cache: {len(cache)} entries")

    # ---------------------------------------------------------------
    # 1. Extract pre-2026 player names + draft years
    # ---------------------------------------------------------------
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
    pre_part = js[pre_idx:]

    player_year_pairs = []
    for ym2 in re.finditer(r'"(\d{4})"\s*:\s*\[', pre_part):
        year = ym2.group(1)
        start = ym2.end()
        depth = 1
        i = start
        while i < len(pre_part) and depth > 0:
            if pre_part[i] == "[":
                depth += 1
            elif pre_part[i] == "]":
                depth -= 1
            i += 1
        year_content = pre_part[start : i - 1]
        for pm in re.finditer(r'player:"([^"]+)"', year_content):
            player_year_pairs.append((pm.group(1), year))

    seen_players = OrderedDict()
    for pname, pyear in player_year_pairs:
        if pname not in seen_players:
            seen_players[pname] = pyear
    unique_players = list(seen_players.items())
    log(f"Unique pre-2026 players: {len(unique_players)}")

    # ---------------------------------------------------------------
    # 2. Batch fetch from Wikipedia
    # ---------------------------------------------------------------
    to_fetch = [
        (n, y)
        for n, y in unique_players
        if n.lower().strip() not in cache
        or not (cache[n.lower().strip()] and isinstance(cache[n.lower().strip()], dict))
    ]
    log(f"Need to fetch: {len(to_fetch)}")

    if to_fetch:
        # Build candidate titles
        candidate_map = OrderedDict()
        for pname, pyear in to_fetch:
            key = pname.lower().strip()
            if key in cache and cache[key] and isinstance(cache[key], dict):
                continue
            candidate_map[key] = (generate_candidates(pname), pyear)

        # Collect unique titles to fetch
        unique_titles = []
        title_to_keys = {}
        for key, (candidates, _) in candidate_map.items():
            for c in candidates:
                if c not in title_to_keys:
                    unique_titles.append(c)
                    title_to_keys[c] = []
                title_to_keys[c].append(key)

        log(f"Unique Wikipedia titles to try: {len(unique_titles)}")
        log(
            f"Total candidate-title lookups: {sum(len(c) for c, _ in candidate_map.values())}"
        )

        # Process in batches
        total_batches = (len(unique_titles) + BATCH_SIZE - 1) // BATCH_SIZE
        found_count = 0

        for batch_idx in range(total_batches):
            batch = unique_titles[batch_idx * BATCH_SIZE : (batch_idx + 1) * BATCH_SIZE]
            titles_str = "|".join(batch)

            try:
                url = (
                    f"https://en.wikipedia.org/w/api.php?action=query"
                    f"&titles={urllib.parse.quote(titles_str)}"
                    f"&prop=revisions&rvprop=content&rvsection=0"
                    f"&redirects=1&format=json"
                )
                data = fetch_json(url)
                pages = data.get("query", {}).get("pages", {})
                redirects = data.get("query", {}).get("redirects", [])
                redirect_map = {}
                for r in redirects:
                    redirect_map[r.get("from", "")] = r.get("to", "")

                for pid, page in pages.items():
                    title = page.get("title", "")
                    if not title:
                        continue
                    wt = page.get("revisions", [{}])[0].get("*", "")
                    source_titles = [t for t in title_to_keys if t == title]
                    if not source_titles:
                        source_titles = [
                            t for t in title_to_keys if redirect_map.get(t) == title
                        ]
                    affected_keys = set()
                    for st in source_titles:
                        affected_keys.update(title_to_keys.get(st, []))

                    if wt and pid != "-1":
                        parsed = parse_wikitext(wt)
                        if parsed:
                            for k in affected_keys:
                                if k not in cache or not (
                                    cache[k] and isinstance(cache[k], dict)
                                ):
                                    cache[k] = parsed
                                    found_count += 1
                        else:
                            for k in affected_keys:
                                if k not in cache:
                                    cache[k] = None
                    else:
                        for k in affected_keys:
                            if k not in cache:
                                cache[k] = None
            except Exception as e:
                log(f"  Batch {batch_idx + 1}/{total_batches} error: {e}")
                time.sleep(2)

            if batch_idx % 3 == 0 or batch_idx == total_batches - 1:
                elapsed = time.time() - t0
                succ = sum(1 for v in cache.values() if v and isinstance(v, dict))
                log(
                    f"  batch {batch_idx + 1}/{total_batches} found={found_count} ok={succ} {elapsed:.0f}s"
                )
                with open(CACHE, "w") as f:
                    json.dump(cache, f)

            time.sleep(BASE_DELAY)

        # Save cache
        with open(CACHE, "w") as f:
            json.dump(cache, f)
        succ = sum(1 for v in cache.values() if v and isinstance(v, dict))
        log(f"Phase 1 complete: {succ} cached successes")

        # Phase 2: Search-based fallback for remaining
        unfound = [
            (n, y)
            for n, y in to_fetch
            if n.lower().strip() not in cache
            or not (
                cache[n.lower().strip()] and isinstance(cache[n.lower().strip()], dict)
            )
        ]
        log(f"Phase 2: searching for {len(unfound)} remaining players...")

        search_count = 0
        for pname, pyear in unfound:
            key = pname.lower().strip()
            if key in cache and cache[key] and isinstance(cache[key], dict):
                continue
            try:
                search_url = (
                    f"https://en.wikipedia.org/w/api.php?action=query&list=search"
                    f"&srsearch={urllib.parse.quote(pname + ' (basketball)')}"
                    f"&srlimit=1&format=json"
                )
                sdata = fetch_json(search_url)
                results = sdata.get("query", {}).get("search", [])
                if results:
                    found_title = results[0]["title"]
                    # Skip if title was already tried
                    if found_title in title_to_keys:
                        cache[key] = None
                        continue
                    page_url = (
                        f"https://en.wikipedia.org/w/api.php?action=query"
                        f"&titles={urllib.parse.quote(found_title)}"
                        f"&prop=revisions&rvprop=content&rvsection=0"
                        f"&redirects=1&format=json"
                    )
                    pdata = fetch_json(page_url)
                    pages = pdata.get("query", {}).get("pages", {})
                    for pid, page in pages.items():
                        wt = page.get("revisions", [{}])[0].get("*", "")
                        if wt and pid != "-1":
                            parsed = parse_wikitext(wt)
                            if parsed:
                                cache[key] = parsed
                            else:
                                cache[key] = None
                        else:
                            cache[key] = None
                else:
                    cache[key] = None
                search_count += 1
                time.sleep(0.8)
            except Exception as e:
                log(f"  Search error {pname}: {e}")
                cache[key] = None
                time.sleep(2)

        with open(CACHE, "w") as f:
            json.dump(cache, f)
        succ = sum(1 for v in cache.values() if v and isinstance(v, dict))
        log(f"Total cache: {succ} successes / {len(cache)} entries")

    # ---------------------------------------------------------------
    # 3. Update nba.html
    # ---------------------------------------------------------------
    log("\nUpdating nba.html...")
    draft_match = re.search(
        r"(NBA_DRAFT_DATA = \{.*?\});\s*\n\s*(?:const|var|let|renderDraft)",
        content,
        re.DOTALL,
    )
    draft_js = draft_match.group(1)

    all_entries = []
    for ym2 in re.finditer(r'"(\d{4})"\s*:\s*\[', draft_js):
        year = ym2.group(1)
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
    log(f"Total entries: {len(all_entries)}")

    def escape_ht(ht_val):
        return ht_val.replace('"', '\\"')

    entry_replacements = OrderedDict()
    for year, entry_str, pname in all_entries:
        key = pname.lower().strip()
        info = cache.get(key)
        if not info or not isinstance(info, dict):
            continue
        modified = entry_str
        if info.get("height"):
            modified = re.sub(
                r'(ht:)"[^"]*"', lambda m: f'ht:"{escape_ht(info["height"])}"', modified
            )
        if info.get("weight") is not None:
            modified = re.sub(r"(wt:)(null)", f"wt:{info['weight']}", modified)
        age_val = info.get("age")
        if age_val is None and info.get("birth_date"):
            age_val = calc_age_at_draft(info["birth_date"], year)
        if age_val is not None:
            modified = re.sub(r"age:null", f"age:{age_val}", modified)
        if modified != entry_str:
            entry_replacements[entry_str] = modified

    log(f"Entries to update: {len(entry_replacements)}")
    if entry_replacements:
        new_js = draft_js
        for old, new in entry_replacements.items():
            new_js = new_js.replace(old, new, 1)
        if new_js != draft_js:
            content = content.replace(draft_js, new_js, 1)
            with open(HTML, "w") as f:
                f.write(content)
            log("HTML updated!")
        else:
            log("No changes")

    elapsed = time.time() - t0
    log(f"\nTotal time: {elapsed:.0f}s")


if __name__ == "__main__":
    main()
