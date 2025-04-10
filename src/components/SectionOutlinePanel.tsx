import { Vector2 } from "three";

interface SectionOutlinePanelProps {
  visible: boolean;
  points: Vector2[];
}

export function SectionOutlinePanel({
  visible,
  points,
}: SectionOutlinePanelProps) {
  if (!visible || points.length === 0) return null;

  // Calculate bounding box of points
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;
  points.forEach((p) => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });

  // Calculate scale to fit in panel
  const width = 200;
  const height = 300;
  const padding = 20;
  const panelWidth = width - padding * 2;
  const panelHeight = height - padding * 2 - 24; // Adjust for title height

  // Handle potential division by zero or infinite scale
  const rangeX = maxX - minX;
  const rangeY = maxY - minY;
  const scaleX = rangeX > 1e-6 ? panelWidth / rangeX : 1;
  const scaleY = rangeY > 1e-6 ? panelHeight / rangeY : 1;
  const scale = Math.min(scaleX, scaleY);

  // Center the drawing within the panel
  const drawingWidth = rangeX * scale;
  const drawingHeight = rangeY * scale;
  const offsetX = (panelWidth - drawingWidth) / 2 + padding;
  const offsetY = (panelHeight - drawingHeight) / 2 + padding + 24; // Add title padding

  // Transform points to panel coordinates
  const transformedPoints = points.map((p) => ({
    x: (p.x - minX) * scale + offsetX,
    y: height - ((p.y - minY) * scale + offsetY),
  }));

  return (
    <div
      style={{
        position: "fixed",
        right: "16px",
        bottom: "32px",
        width: `${width}px`,
        height: `${height}px`,
        background: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        padding: "16px",
        display: visible ? "block" : "none",
      }}
    >
      <div style={{ fontSize: "14px", marginBottom: "8px", fontWeight: 500 }}>
        Schnittansicht
      </div>
      <svg
        width={width - padding * 2}
        height={height - padding * 2 - 24} // Adjust height for title
        viewBox={`0 0 ${width - padding * 2} ${height - padding * 2 - 24}`}
        style={{ display: "block" }}
      >
        <path
          d={`M ${transformedPoints
            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x - padding} ${p.y - padding - 24}`)
            .join(" ")} Z`}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
} 