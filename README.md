# knicks-in-six

<img width="1069" height="769" alt="Screenshot 2026-06-11 at 5 55 17 PM" src="https://github.com/user-attachments/assets/ce719f11-cf40-4c53-97e6-2d47ef522ec0" />

_disclaimer: i'm just a casual nba enjoyer who happens to code a little. please forgive any naivete in the claims or the model._

thought this would be a cool project to compare what "history says" versus what actually happens in real life. athletics is one of the most amazing feats of human nature, especially in its variability. this may be one of the few things that LLMs and statistical models will never 100% accurately predict. so cool!

## what's here

- `01_data_gathering.ipynb` — pulls live 2025-26 stats via `nba_api` (snapshot-cached to parquet) and inventories historical kaggle dumps you drop into `data/raw/`
- `src/data.py` — the fetch/cache helpers the notebooks share

## run it

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/jupyter lab
```
