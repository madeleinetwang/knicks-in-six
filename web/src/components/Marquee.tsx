export function Marquee({
  items,
  className = "",
  separator = "✦",
}: {
  items: string[];
  className?: string;
  separator?: string;
}) {
  const row = [...items, ...items];
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <div className="inline-flex animate-marquee">
        {row.map((item, i) => (
          <span key={i} className="mx-6 inline-flex items-center gap-6">
            <span className="font-display text-2xl uppercase tracking-tight">
              {item}
            </span>
            <span className="text-orange">{separator}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
