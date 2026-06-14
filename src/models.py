"""Win-probability models for the series-aware playoff predictor.

Trains on the one-row-per-playoff-game table from notebook 02
(``playoff_features.parquet``), predicting ``home_win``. Everything here is
deliberately rudimentary: a logistic-regression baseline with a time-based
split so we never train on the future, light calibration, and a small bit of
series math to turn per-game win probabilities into P(title) / P(series ends
in 5, 6, 7) for the 2026 Finals.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, log_loss, roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from .features import FEATURE_COLS, FEATURES_PATH, TARGET_COL


def load_features() -> pd.DataFrame:
    """The training table built in notebook 02, ordered by game date."""
    df = pd.read_parquet(FEATURES_PATH)
    return df.sort_values("gameDate").reset_index(drop=True)


def time_split(df: pd.DataFrame, test_season: int = 2015) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Split by season so the test set is strictly *after* the train set.

    ``test_season`` is the first season held out for testing. Default 2015
    leaves roughly the last quarter of playoff history for evaluation.
    """
    train = df[df["season"] < test_season].reset_index(drop=True)
    test = df[df["season"] >= test_season].reset_index(drop=True)
    return train, test


def _xy(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    return df[FEATURE_COLS], df[TARGET_COL]


def make_baseline() -> Pipeline:
    """Standardize features, then plain L2 logistic regression."""
    return Pipeline(
        [
            ("scale", StandardScaler()),
            ("lr", LogisticRegression(max_iter=1000)),
        ]
    )


def train_baseline(train: pd.DataFrame) -> Pipeline:
    model = make_baseline()
    X, y = _xy(train)
    model.fit(X, y)
    return model


def train_calibrated(train: pd.DataFrame, estimator=None, method: str = "isotonic") -> CalibratedClassifierCV:
    """Wrap an estimator (default: the logistic baseline) in cross-validated calibration."""
    X, y = _xy(train)
    cal = CalibratedClassifierCV(estimator or make_baseline(), method=method, cv=5)
    cal.fit(X, y)
    return cal


def evaluate(model, test: pd.DataFrame, label: str = "model") -> dict:
    """Probabilistic + classification metrics on the held-out test set."""
    X, y = _xy(test)
    p = model.predict_proba(X)[:, 1]
    return {
        "model": label,
        "n": len(test),
        "accuracy": float(((p >= 0.5).astype(int) == y).mean()),
        "log_loss": float(log_loss(y, p)),
        "brier": float(brier_score_loss(y, p)),
        "auc": float(roc_auc_score(y, p)),
    }


def baseline_constant_metrics(train: pd.DataFrame, test: pd.DataFrame) -> dict:
    """The dumb baseline to beat: always predict the train-set home win rate."""
    rate = float(train[TARGET_COL].mean())
    y = test[TARGET_COL]
    p = np.full(len(test), rate)
    return {
        "model": f"always {rate:.1%} (home base rate)",
        "n": len(test),
        "accuracy": float(((p >= 0.5).astype(int) == y).mean()),
        "log_loss": float(log_loss(y, p, labels=[0, 1])),
        "brier": float(brier_score_loss(y, p)),
        "auc": float("nan"),  # constant prediction has no ROC ranking
    }


def coefficients(model: Pipeline) -> pd.Series:
    """Logistic-regression weights on standardized features (importance-ish)."""
    lr = model.named_steps["lr"]
    return (
        pd.Series(lr.coef_[0], index=FEATURE_COLS)
        .sort_values(key=np.abs, ascending=False)
    )


def reliability_table(model, test: pd.DataFrame, bins: int = 10) -> pd.DataFrame:
    """Predicted vs actual home-win rate in probability buckets (calibration)."""
    X, y = _xy(test)
    p = model.predict_proba(X)[:, 1]
    edges = np.linspace(0, 1, bins + 1)
    bucket = pd.cut(p, edges, include_lowest=True)
    return (
        pd.DataFrame({"p_pred": p, "actual": y.values})
        .groupby(bucket, observed=True)
        .agg(n=("actual", "size"), mean_pred=("p_pred", "mean"), actual=("actual", "mean"))
        .reset_index(drop=True)
    )


# ----------------------------------------------------------- model zoo

def make_random_forest() -> RandomForestClassifier:
    """The random forest config used both in the model comparison and as the final model."""
    return RandomForestClassifier(
        n_estimators=400, max_depth=6, min_samples_leaf=20, random_state=0, n_jobs=-1
    )


def train_random_forest(train: pd.DataFrame) -> RandomForestClassifier:
    model = make_random_forest()
    X, y = _xy(train)
    model.fit(X, y)
    return model


def feature_importances(model: RandomForestClassifier) -> pd.Series:
    """Random forest impurity-based feature importances, sorted descending."""
    return pd.Series(model.feature_importances_, index=FEATURE_COLS).sort_values(ascending=False)


def make_models() -> dict:
    """Candidate classifiers to compare on the same time split.

    Logistic regression is scaled (it cares about feature magnitude); the
    tree ensembles don't, so they take the raw features. xgboost is optional
    — skipped gracefully if the package isn't installed.
    """
    models: dict[str, object] = {
        "logistic regression": make_baseline(),
        "random forest": make_random_forest(),
        "gradient boosting": GradientBoostingClassifier(
            n_estimators=300, max_depth=3, learning_rate=0.03, random_state=0
        ),
    }
    try:
        from xgboost import XGBClassifier

        models["xgboost"] = XGBClassifier(
            n_estimators=400,
            max_depth=3,
            learning_rate=0.03,
            subsample=0.8,
            colsample_bytree=0.8,
            eval_metric="logloss",
            random_state=0,
            n_jobs=-1,
        )
    except ImportError:
        pass
    return models


def compare_models(train: pd.DataFrame, test: pd.DataFrame) -> pd.DataFrame:
    """Fit every candidate, score it on the test set, plus the constant floor.

    Returns a metrics table sorted by log loss (the honest-probability score).
    """
    Xtr, ytr = _xy(train)
    rows = [baseline_constant_metrics(train, test)]
    for name, model in make_models().items():
        model.fit(Xtr, ytr)
        rows.append(evaluate(model, test, name))
    return (
        pd.DataFrame(rows)
        .set_index("model")
        .sort_values("log_loss")
    )


# ---------------------------------------------------- 2026 Finals scenarios

def score_scenarios(model, scenarios: pd.DataFrame) -> pd.DataFrame:
    """Add P(home win) and P(NYK win) to the scenario rows from notebook 02."""
    out = scenarios.copy()
    p_home = model.predict_proba(out[FEATURE_COLS])[:, 1]
    out["p_home_win"] = p_home
    out["p_knicks_win"] = np.where(out["knicks_home"], p_home, 1 - p_home)
    return out


def series_outcome(scored: pd.DataFrame) -> dict:
    """Chain the three conditional games into series-level probabilities.

    NYK lead 3-1, so they win the title by taking *any* of games 5/6/7. The
    scenario rows are ordered game 5, 6, 7; ``p_knicks_win`` is each game's
    win prob conditional on it being played at all.
    """
    s = scored.sort_values("game_num")
    p5, p6, p7 = s["p_knicks_win"].to_numpy()[:3]

    in5 = p5
    in6 = (1 - p5) * p6
    in7 = (1 - p5) * (1 - p6) * p7
    spurs_comeback = (1 - p5) * (1 - p6) * (1 - p7)
    return {
        "p_title": float(in5 + in6 + in7),
        "p_in_5": float(in5),
        "p_in_6": float(in6),
        "p_in_7": float(in7),
        "p_spurs_comeback": float(spurs_comeback),
    }
