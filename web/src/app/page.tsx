import { Hero } from "@/components/Hero";
import { KeyFindings } from "@/components/KeyFindings";

export default function Home() {
  return (
    <main>
      <Hero />
      <KeyFindings />
      {/* more sections coming after review: prediction explorer, feature
          importance, scouting notes, takeaway */}
    </main>
  );
}
