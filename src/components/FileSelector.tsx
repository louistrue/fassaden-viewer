import React, { useState } from "react";

interface FileSelectorProps {
  onBackgroundSelect: (file: string) => void;
}

export function FileSelector({
  onBackgroundSelect,
}: FileSelectorProps) {
  const [bgImage, setBgImage] = useState<string>("");

  const handleBackgroundImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setBgImage(url);
      onBackgroundSelect(url);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "96px",
        left: "32px",
        zIndex: 1000,
        background: "white",
        padding: "24px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        maxWidth: "320px",
      }}
    >
      <div>
        <h3 style={{ margin: "0 0 16px 0", color: "#333", fontSize: "18px" }}>
          Hintergrund
        </h3>
        <label
          style={{
            display: "inline-block",
            padding: "8px 16px",
            background: "#00a67c",
            color: "white",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Bild auswählen
          <input
            type="file"
            accept="image/*"
            onChange={handleBackgroundImage}
            style={{ display: "none" }}
          />
        </label>
        {bgImage && (
          <div style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>
            Hintergrundbild geladen
          </div>
        )}
      </div>
    </div>
  );
} 