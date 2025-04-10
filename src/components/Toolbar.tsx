import React from "react";

interface ToolbarProps {
  controls: React.RefObject<{
    reset: () => void;
    zoomToFit: () => void;
    toggleClipping: () => void;
  } | null>;
}

export function Toolbar({ controls }: ToolbarProps) {
  const buttonStyle: React.CSSProperties = {
    padding: "8px 16px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "background-color 0.2s",
  };

  const handleMouseOver = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "#1d4ed8";
  };

  const handleMouseOut = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "#2563eb";
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "32px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        background: "white",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        gap: "12px",
      }}
    >
      <button
        onClick={() => controls?.current?.reset()}
        style={buttonStyle}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        Zurücksetzen
      </button>
      <button
        onClick={() => controls?.current?.zoomToFit()}
        style={buttonStyle}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.92 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
        Zoom
      </button>
      <button
        onClick={() => controls?.current?.toggleClipping()}
        style={buttonStyle}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 6H3" />
          <path d="M3 12h18" />
          <path d="M21 18H3" />
        </svg>
        Schnitt
      </button>
    </div>
  );
} 