"""Data gathering for the Knicks Finals predictor.

Two sources:
  * nba_api (stats.nba.com) for current-season / live playoff data.
    Every fetch is snapshot-cached to data/cache/*.parquet; if the API is
    unreachable we fall back to the last cached snapshot.
  * Manually downloaded Kaggle dumps for 1980-present history, dropped
    into data/raw/ (see data/raw/README.md for the shopping list).
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
CACHE_DIR = DATA_DIR / "cache"

KNICKS_ID = 1610612752
KNICKS_ABBR = "NYK"
CURRENT_SEASON = "2025-26"

# NBA Finals 2-2-1-1-1 format: the home-court-advantage team hosts these games.
HCA_TEAM_GAMES = {1, 2, 5, 7}


# ---------------------------------------------------------------- caching

def cached_fetch(name: str, fetch_fn, refresh: bool = False) -> pd.DataFrame:
    """Return cached parquet if present (and not refresh), else fetch.

    A successful fetch overwrites the snapshot. A failed fetch falls back
    to the existing snapshot when there is one.
    """
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path = CACHE_DIR / f"{name}.parquet"
    if path.exists() and not refresh:
        return pd.read_parquet(path)
    try:
        df = fetch_fn()
    except Exception as exc:  # noqa: BLE001 - any API failure falls back
        if path.exists():
            print(f"[warn] fetch '{name}' failed ({exc}); using cached snapshot")
            return pd.read_parquet(path)
        raise
    df.to_parquet(path, index=False)
    return df


# ---------------------------------------------------------------- nba_api

def _key(*parts: str) -> str:
    return "_".join(p.replace(" ", "_").replace("-", "_").lower() for p in parts)


def fetch_team_stats(
    season: str = CURRENT_SEASON,
    season_type: str = "Regular Season",
    measure: str = "Advanced",
    refresh: bool = False,
) -> pd.DataFrame:
    """League-wide per-team stats (one row per team)."""

    def _fetch() -> pd.DataFrame:
        from nba_api.stats.endpoints import leaguedashteamstats

        return leaguedashteamstats.LeagueDashTeamStats(
            season=season,
            season_type_all_star=season_type,
            measure_type_detailed_defense=measure,
            timeout=30,
        ).get_data_frames()[0]

    return cached_fetch(_key("team_stats", season, season_type, measure), _fetch, refresh)


def fetch_league_game_log(
    season: str = CURRENT_SEASON,
    season_type: str = "Playoffs",
    refresh: bool = False,
) -> pd.DataFrame:
    """One row per team per game for the given season/season-type."""

    def _fetch() -> pd.DataFrame:
        from nba_api.stats.endpoints import leaguegamefinder

        df = leaguegamefinder.LeagueGameFinder(
            season_nullable=season,
            season_type_nullable=season_type,
            league_id_nullable="00",
            timeout=30,
        ).get_data_frames()[0]
        return df.sort_values("GAME_DATE").reset_index(drop=True)

    return cached_fetch(_key("game_log", season, season_type), _fetch, refresh)


def knicks_series_state(refresh: bool = False) -> dict:
    """Current playoff series state for the Knicks.

    Derived from the current-season playoff game log: opponent, series
    score, next game number, and who hosts the next game / game 6 / game 7
    (2-2-1-1-1 format, inferred from who hosted game 1).
    """
    games = fetch_league_game_log(CURRENT_SEASON, "Playoffs", refresh=refresh)
    nyk = games[games["TEAM_ID"] == KNICKS_ID].sort_values("GAME_DATE")
    if nyk.empty:
        raise RuntimeError(f"No {CURRENT_SEASON} playoff games found for the Knicks")

    opponent = nyk.iloc[-1]["MATCHUP"].split()[-1]
    series = nyk[nyk["MATCHUP"].str.endswith(opponent)]
    wins = int((series["WL"] == "W").sum())
    losses = int((series["WL"] == "L").sum())
    games_played = len(series)
    next_game = games_played + 1

    knicks_hca = series.iloc[0]["MATCHUP"].startswith(f"{KNICKS_ABBR} vs.")

    def knicks_home(game_num: int) -> bool:
        return knicks_hca == (game_num in HCA_TEAM_GAMES)

    return {
        "season": CURRENT_SEASON,
        "opponent": opponent,
        "series_record": f"{wins}-{losses}",
        "wins": wins,
        "losses": losses,
        "games_played": games_played,
        "next_game_num": next_game,
        "knicks_has_hca": knicks_hca,
        "knicks_home_next": knicks_home(next_game) if next_game <= 7 else None,
        "knicks_home_g6": knicks_home(6),
        "knicks_home_g7": knicks_home(7),
        "elimination_game_next": wins == 3 or losses == 3,
        "last_game_date": str(series.iloc[-1]["GAME_DATE"]),
    }


# ---------------------------------------------------------------- raw dumps

def list_raw_files() -> list[Path]:
    """Files manually dropped into data/raw/ (csv or parquet), any depth."""
    if not RAW_DIR.exists():
        return []
    return sorted(
        p for p in RAW_DIR.rglob("*") if p.suffix.lower() in {".csv", ".parquet"}
    )


def _find_raw(filename: str) -> Path:
    matches = [
        p
        for p in list_raw_files()
        if p.name == filename or str(p.relative_to(RAW_DIR)) == filename
    ]
    if not matches:
        available = ", ".join(str(p.relative_to(RAW_DIR)) for p in list_raw_files())
        raise FileNotFoundError(
            f"'{filename}' not in data/raw/. Available: {available or '(none)'}"
        )
    if len(matches) > 1:
        raise ValueError(
            f"'{filename}' is ambiguous: {[str(p.relative_to(RAW_DIR)) for p in matches]};"
            " pass the subfolder too, e.g. 'nba_stats/Games.csv'"
        )
    return matches[0]


def load_raw(filename: str, **read_kwargs) -> pd.DataFrame:
    """Load a raw file by name (or 'subfolder/name'), searching subfolders."""
    path = _find_raw(filename)
    if path.suffix.lower() == ".parquet":
        return pd.read_parquet(path, **read_kwargs)
    return pd.read_csv(path, low_memory=False, **read_kwargs)


def preview_raw(path: Path, nrows: int = 3) -> tuple[pd.DataFrame, int]:
    """(head, total_rows) without loading the whole file.

    Some raw files run to hundreds of MB (890 MB play-by-play parquet), so
    parquet row counts come from file metadata and csv counts from a raw
    newline scan rather than a full pandas parse.
    """
    if path.suffix.lower() == ".parquet":
        import pyarrow.parquet as pq

        pf = pq.ParquetFile(path)
        head = next(pf.iter_batches(batch_size=nrows)).to_pandas()
        return head, pf.metadata.num_rows
    head = pd.read_csv(path, nrows=nrows)
    with open(path, "rb") as f:
        n_lines = sum(chunk.count(b"\n") for chunk in iter(lambda: f.read(1 << 20), b""))
    return head, max(n_lines - 1, 0)  # minus header


def data_inventory() -> pd.DataFrame:
    """Summary of everything gathered so far (cache snapshots + raw dumps)."""
    rows = []
    for folder, kind in ((CACHE_DIR, "cache"), (RAW_DIR, "raw")):
        if not folder.exists():
            continue
        for p in sorted(folder.rglob("*")):
            if p.suffix.lower() not in {".csv", ".parquet"}:
                continue
            rows.append(
                {
                    "kind": kind,
                    "file": str(p.relative_to(folder)),
                    "size_mb": round(p.stat().st_size / 1e6, 2),
                }
            )
    return pd.DataFrame(rows)
