# Knicks Model Report — site

A playful, editorial "data zine" front-end for the `knicks-in-six` predictive
model. Built with Next.js 16, React 19, Tailwind v4, Framer Motion, and Recharts.

## Run

```bash
cd web
npm install
npm run dev      # http://localhost:3000
npm run build    # static production build
```

## Where the data lives

Everything renders from a single file: `src/data/model.ts`.

Each value is tagged with a `src`:

- `"real"` — pulled from the project's cached 2025-26 `nba_api` snapshots
  (`../data/cache/*.parquet` via `../src/data.py`). Currently: record, off/def/net
  rating, true shooting, pace, etc.
- `"placeholder"` — invented stand-in until the predictive model is trained.
  Swap these (playoff odds, win-probability curve, feature importance) for real
  model outputs when available. The UI shows a small `real data` / `placeholder`
  tag next to each, so nothing is overstated.

To wire in real model output later: export your model results to JSON, then
update the matching fields in `src/data/model.ts` and flip `src` to `"real"`.

## Sections

1. Hero — oversized cropped headline, spinning basketball, marquee
2. Key Findings — trading-card stat stickers, count-up numbers
3. Spin the Model — interactive win-probability chart (scenario toggle)
4. What the Model Cares About — editorial feature-importance bars
5. Scouting Notes — coach's-clipboard plain-English explanation
6. The Verdict — closing takeaway + links (GitHub / methodology / portfolio)

## Components

Reusable in `src/components/`: `Hero`, `KeyFindings`, `PredictionExplorer`,
`FeatureImportance`, `ScoutingNotes`, `Takeaway`, plus primitives `Basketball`,
`Sticker`, `Marquee`, `Annotation`, `AnimatedNumber`, `BrowserFrame`,
`ProvenanceTag`.

## Notes

- Not affiliated with the NBA or any team. Colors and imagery are
  Knicks-_inspired_ placeholders — no official logos or trademarks are used.
- Deploys cleanly to Vercel (static prerender).
