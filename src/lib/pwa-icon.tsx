export function pwaIconMark(
  size: number,
  { padding = 0.18, radius = 0.22 }: { padding?: number; radius?: number } = {}
) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#c8763a",
        borderRadius: radius * size,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: size * (1 - padding * 2),
          fontWeight: 800,
          color: "#ffffff",
          fontFamily: "sans-serif",
          lineHeight: 1,
        }}
      >
        F
      </div>
    </div>
  );
}
