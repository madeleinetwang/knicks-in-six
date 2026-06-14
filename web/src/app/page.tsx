import { Hero } from "@/components/Hero";
import { KeyFindings } from "@/components/KeyFindings";
import { PredictionExplorer } from "@/components/PredictionExplorer";
import { FeatureImportance } from "@/components/FeatureImportance";
import { ScoutingNotes } from "@/components/ScoutingNotes";
import { Takeaway } from "@/components/Takeaway";

export default function Home() {
  return (
    <main>
      <Hero />
      <KeyFindings />
      <PredictionExplorer />
      <FeatureImportance />
      <ScoutingNotes />
      <Takeaway />
    </main>
  );
}
