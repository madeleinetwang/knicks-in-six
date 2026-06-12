import type { ReactNode } from "react";

/** Retro browser / broadcast-graphic chrome around content. */
export function BrowserFrame({
  title = "knicks-model.exe",
  children,
  className = "",
  tone = "cream",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  tone?: "cream" | "royal";
}) {
  const body = tone === "royal" ? "bg-royal text-cream" : "bg-cream text-ink";
  return (
    <div
      className={`overflow-hidden border-[3px] border-ink shadow-hard-lg ${className}`}
    >
      <div className="flex items-center gap-2 border-b-[3px] border-ink bg-ink px-3 py-2">
        <span className="h-3 w-3 rounded-full border-2 border-cream bg-orange" />
        <span className="h-3 w-3 rounded-full border-2 border-cream bg-mint" />
        <span className="h-3 w-3 rounded-full border-2 border-cream bg-pink" />
        <span className="ml-3 truncate font-grotesk text-xs font-bold uppercase tracking-widest text-cream/90">
          {title}
        </span>
      </div>
      <div className={body}>{children}</div>
    </div>
  );
}
