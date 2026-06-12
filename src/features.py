"""Feature engineering for the series-aware win-probability model.

Builds one training row per playoff game (1980-present) from the home
team's perspective; target is ``home_win``. Everything derives from the
eoinamoore tables in data/raw/nba_stats/ so historical and current-season
features come from one consistent source.

Era normalization: team-strength features are z-scored *within season*
(a 1986 team is measured against 1986, a 2026 team against 2026), so rows
from different eras are comparable.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from .data import DATA_DIR, KNICKS_ID, load_raw

FEATURES_PATH = DATA_DIR / "features" / "playoff_features.parquet"
FIRST_SEASON = 1980  # season end-year; 1979-80 = first three-point season

ID_COLS = ["gameId", "season", "gameDate", "gameLabel", "hometeamId", "awayteamId"]
FEATURE_COLS = [
    "game_num",
    "home_has_hca",
    "home_wins_before",
    "away_wins_before",
    "home_can_clinch",
    "home_facing_elim",
    "z_margin_diff",
    "z_win_pct_diff",
    "last10_margin_diff",
    "close_win_rate_diff",
    "rest_diff",
    "home_stars_playing",
    "away_stars_playing",
]
TARGET_COL = "home_win"


def _season_from_game_id(game_id: pd.Series) -> pd.Series:
    """Season end-year encoded in the nba.com game id (digits 4-5)."""
    start = game_id.astype(str).str.zfill(10).str[3:5].astype(int)
    return np.where(start >= 46, 1900 + start, 2000 + start) + 1


def load_games() -> pd.DataFrame:
    g = load_raw("Games.csv")
    g["gameDate"] = pd.to_datetime(g["gameDate"])
    g["season"] = _season_from_game_id(g["gameId"])
    g = g[g["gameType"].isin(["Regular Season", "Playoffs"])]
    g = g[g["season"] >= FIRST_SEASON]
    return g.sort_values("gameDate").reset_index(drop=True)


# ------------------------------------------------------- per-team features

def team_games_long(games: pd.DataFrame) -> pd.DataFrame:
    """One row per team per game, with margin from that team's perspective."""
    base = ["gameId", "gameDate", "season", "gameType"]
    home = games[base + ["hometeamId", "awayteamId", "homeScore", "awayScore"]].copy()
    home.columns = base + ["teamId", "oppId", "pts", "opp_pts"]
    away = games[base + ["awayteamId", "hometeamId", "awayScore", "homeScore"]].copy()
    away.columns = base + ["teamId", "oppId", "pts", "opp_pts"]
    long = pd.concat([home, away], ignore_index=True)
    long["margin"] = long["pts"] - long["opp_pts"]
    long["win"] = (long["margin"] > 0).astype(int)
    return long.sort_values(["teamId", "gameDate"]).reset_index(drop=True)


def team_season_strength(long: pd.DataFrame) -> pd.DataFrame:
    """Regular-season strength per team-season, z-scored within season."""
    rs = long[long["gameType"] == "Regular Season"]
    s = (
        rs.groupby(["season", "teamId"])
        .agg(win_pct=("win", "mean"), avg_margin=("margin", "mean"))
        .reset_index()
    )
    for col, z in (("avg_margin", "z_margin"), ("win_pct", "z_win_pct")):
        grp = s.groupby("season")[col]
        s[z] = (s[col] - grp.transform("mean")) / grp.transform(lambda x: x.std(ddof=0))
    return s


def add_team_form(long: pd.DataFrame) -> pd.DataFrame:
    """Pre-game form per team row: rest days, last-10 margin, close-game record.

    Everything is shifted so a row only sees games played *before* it.
    """
    long = long.copy()
    grp = long.groupby(["teamId", "season"])
    long["rest_days"] = grp["gameDate"].diff().dt.days.clip(upper=14)
    long["last10_margin"] = grp["margin"].transform(
        lambda x: x.shift().rolling(10, min_periods=3).mean()
    )
    close_win = long["win"].where(long["margin"].abs() <= 5)
    long["close_win_rate"] = (
        close_win.groupby([long["teamId"], long["season"]])
        .transform(lambda x: x.shift().expanding(min_periods=3).mean())
    )
    return long


# ----------------------------------------------------------- series context

def _wins_needed(season: pd.Series, game_label: pd.Series) -> pd.Series:
    """Wins to take the series: first round was Bo3 (<=1983), Bo5 (<=2002)."""
    first_round = game_label.fillna("").str.contains("First Round")
    out = pd.Series(4, index=season.index)
    out[first_round & (season <= 2002)] = 3
    out[first_round & (season <= 1983)] = 2
    return out


def playoff_series_context(games: pd.DataFrame) -> pd.DataFrame:
    """One row per playoff game with pre-game series state."""
    po = games[games["gameType"] == "Playoffs"].sort_values("gameDate").copy()
    a = np.minimum(po["hometeamId"], po["awayteamId"])
    po["series_id"] = (
        po["season"].astype(str) + "_" + a.astype(str) + "_"
        + np.maximum(po["hometeamId"], po["awayteamId"]).astype(str)
    )
    po["a_win"] = (po["winner"] == a).astype(int)
    grp = po.groupby("series_id")
    po["game_num"] = grp.cumcount() + 1
    a_wins_before = grp["a_win"].cumsum() - po["a_win"]
    b_wins_before = po["game_num"] - 1 - a_wins_before

    home_is_a = po["hometeamId"] == a
    po["home_wins_before"] = np.where(home_is_a, a_wins_before, b_wins_before)
    po["away_wins_before"] = np.where(home_is_a, b_wins_before, a_wins_before)
    need = _wins_needed(po["season"], po["gameLabel"])
    po["home_can_clinch"] = (po["home_wins_before"] == need - 1).astype(int)
    po["home_facing_elim"] = (po["away_wins_before"] == need - 1).astype(int)
    po["home_has_hca"] = (
        grp["hometeamId"].transform("first") == po["hometeamId"]
    ).astype(int)
    po["home_win"] = (po["winner"] == po["hometeamId"]).astype(int)
    return po


# ------------------------------------------------------------ star players

def star_availability() -> pd.DataFrame:
    """Per playoff game and team: how many of the team's top-3 regular-season
    scorers (total points that season) actually played (minutes > 0)."""
    ps = load_raw(
        "PlayerStatistics.csv",
        usecols=["personId", "gameId", "playerteamId", "gameType", "points", "numMinutes"],
    )
    ps["season"] = _season_from_game_id(ps["gameId"])
    ps = ps[ps["season"] >= FIRST_SEASON]
    ps["numMinutes"] = pd.to_numeric(ps["numMinutes"], errors="coerce").fillna(0)

    rs = ps[ps["gameType"] == "Regular Season"]
    top3 = (
        rs.groupby(["season", "playerteamId", "personId"])["points"].sum()
        .reset_index()
        .sort_values("points", ascending=False)
        .groupby(["season", "playerteamId"])
        .head(3)[["season", "playerteamId", "personId"]]
    )

    po = ps[(ps["gameType"] == "Playoffs") & (ps["numMinutes"] > 0)]
    stars_in_game = po.merge(top3, on=["season", "playerteamId", "personId"])
    counts = (
        stars_in_game.groupby(["gameId", "playerteamId"])
        .size()
        .rename("stars_playing")
        .reset_index()
    )
    return counts


# -------------------------------------------------------------- assembly

def build_training_table(save: bool = True) -> pd.DataFrame:
    games = load_games()
    long = add_team_form(team_games_long(games))
    strength = team_season_strength(long)
    ctx = playoff_series_context(games)
    stars = star_availability()

    form_cols = ["rest_days", "last10_margin", "close_win_rate"]
    form = long[["gameId", "teamId"] + form_cols]

    df = ctx
    for side, id_col in (("home", "hometeamId"), ("away", "awayteamId")):
        df = df.merge(
            form.rename(columns={c: f"{side}_{c}" for c in form_cols}),
            left_on=["gameId", id_col], right_on=["gameId", "teamId"], how="left",
        ).drop(columns="teamId")
        df = df.merge(
            strength[["season", "teamId", "z_margin", "z_win_pct"]].rename(
                columns={"z_margin": f"{side}_z_margin", "z_win_pct": f"{side}_z_win_pct"}
            ),
            left_on=["season", id_col], right_on=["season", "teamId"], how="left",
        ).drop(columns="teamId")
        df = df.merge(
            stars.rename(columns={"stars_playing": f"{side}_stars_playing"}),
            left_on=["gameId", id_col], right_on=["gameId", "playerteamId"], how="left",
        ).drop(columns="playerteamId")
        df[f"{side}_stars_playing"] = df[f"{side}_stars_playing"].fillna(0).astype(int)

    df["z_margin_diff"] = df["home_z_margin"] - df["away_z_margin"]
    df["z_win_pct_diff"] = df["home_z_win_pct"] - df["away_z_win_pct"]
    df["last10_margin_diff"] = df["home_last10_margin"] - df["away_last10_margin"]
    df["close_win_rate_diff"] = df["home_close_win_rate"] - df["away_close_win_rate"]
    df["rest_diff"] = df["home_rest_days"] - df["away_rest_days"]

    out = df[ID_COLS + FEATURE_COLS + [TARGET_COL]].reset_index(drop=True)
    if save:
        FEATURES_PATH.parent.mkdir(parents=True, exist_ok=True)
        out.to_parquet(FEATURES_PATH, index=False)
    return out


# ---------------------------------------------------- 2026 Finals scenarios

SPURS_ID = 1610612759


def finals_scenarios() -> pd.DataFrame:
    """Feature rows for the remaining 2026 Finals games.

    The series state of each remaining game is deterministic given it gets
    played at all (NYK lead 3-1): game 5 is at SAS; game 6 only happens if
    SAS win game 5 (3-2, at NYK); game 7 only if SAS also win game 6 (3-3,
    at SAS).

    Simplification: team form (last-10 margin, close-game rate, stars) is
    frozen at its post-game-4 value for all three scenarios, and rest is
    assumed to be the typical 2 days between Finals games.
    """
    games = load_games()
    long = add_team_form(team_games_long(games))
    strength = team_season_strength(long)
    season = int(games["season"].max())

    def latest(team_id: int) -> pd.Series:
        rows = long[(long["teamId"] == team_id) & (long["season"] == season)]
        return rows.sort_values("gameDate").iloc[-1]

    def strength_of(team_id: int) -> pd.Series:
        s = strength[(strength["teamId"] == team_id) & (strength["season"] == season)]
        return s.iloc[0]

    stars = star_availability()
    po = games[(games["gameType"] == "Playoffs") & (games["season"] == season)]

    def stars_last_game(team_id: int) -> int:
        team_po = po[(po["hometeamId"] == team_id) | (po["awayteamId"] == team_id)]
        last_gid = team_po.sort_values("gameDate").iloc[-1]["gameId"]
        row = stars[(stars["gameId"] == last_gid) & (stars["playerteamId"] == team_id)]
        return int(row["stars_playing"].iloc[0]) if len(row) else 0

    # (game_num, home_id, home_wins_before, away_wins_before)
    scenarios = [
        (5, SPURS_ID, 1, 3),  # NYK up 3-1, can clinch on the road
        (6, KNICKS_ID, 3, 2),  # only if SAS take game 5; NYK can clinch at MSG
        (7, SPURS_ID, 3, 3),  # only if SAS also take game 6
    ]
    rows = []
    for game_num, home_id, home_w, away_w in scenarios:
        away_id = KNICKS_ID if home_id == SPURS_ID else SPURS_ID
        h, a = strength_of(home_id), strength_of(away_id)
        hf, af = latest(home_id), latest(away_id)
        rows.append(
            {
                "scenario": f"Game {game_num} ({'NYK' if home_id == KNICKS_ID else 'SAS'} home)",
                "knicks_home": home_id == KNICKS_ID,
                "game_num": game_num,
                "home_has_hca": int(home_id == SPURS_ID),  # SAS hosted game 1
                "home_wins_before": home_w,
                "away_wins_before": away_w,
                "home_can_clinch": int(home_w == 3),
                "home_facing_elim": int(away_w == 3),
                "z_margin_diff": h["z_margin"] - a["z_margin"],
                "z_win_pct_diff": h["z_win_pct"] - a["z_win_pct"],
                "last10_margin_diff": hf["last10_margin"] - af["last10_margin"],
                "close_win_rate_diff": hf["close_win_rate"] - af["close_win_rate"],
                "rest_diff": 0.0,
                "home_stars_playing": stars_last_game(home_id),
                "away_stars_playing": stars_last_game(away_id),
            }
        )
    return pd.DataFrame(rows)
