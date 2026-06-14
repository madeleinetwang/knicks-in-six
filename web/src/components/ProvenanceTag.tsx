import type { Provenance } from "@/data/model";

/** Tiny honest label marking real data vs. model placeholder. */
export function ProvenanceTag({ src }: { src: Provenance }) {
  const real = src === "real";
  return (
    <span
      title={
        real
          ? "Real value from cached 2025-26 nba_api data"
          : "Placeholder: swap in real model output once trained"
      }
      className={`inline-flex items-center gap-1 font-grotesk text-[9px] font-bold uppercase tracking-widest ${
        real ? "text-royal" : "text-orange"
      }`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          real ? "bg-royal" : "bg-orange"
        }`}
      />
      {real ? "real data" : "placeholder"}
    </span>
  );
}
