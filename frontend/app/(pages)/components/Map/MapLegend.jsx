/** Scale legend for the store map: size = net sales, color = stock-out rate. */
export const MapLegend = () => {
  return (
    <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-3 rounded-xl border bg-card/95 p-3 text-xs shadow-lg backdrop-blur sm:flex-row sm:gap-5">
      <div>
        <p className="mb-1.5 font-medium text-foreground">Net sales</p>
        <div className="flex items-end gap-3 text-muted-foreground">
          {[
            { size: 8, label: "Low" },
            { size: 16, label: "Mid" },
            { size: 26, label: "High" },
          ].map((s) => (
            <span key={s.label} className="flex flex-col items-center gap-1">
              <span
                aria-hidden
                className="rounded-full border border-foreground/20 bg-foreground/10"
                style={{ width: s.size, height: s.size }}
              />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <div className="min-w-44">
        <p className="mb-1.5 font-medium text-foreground">Stock-out rate</p>
        <div
          aria-hidden
          className="h-2 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, var(--status-good), var(--status-serious) 50%, var(--status-critical))",
          }}
        />
        <div className="mt-1 flex justify-between tabular-nums text-muted-foreground">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};
