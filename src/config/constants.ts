// Types
export interface WoodColors {
  [key: string]: readonly [number, number, number];
}

export interface ColorMap {
  [key: string]: string;
}

export interface StringMap {
  [key: string]: string;
}

// Constants
export const WOOD_TYPES: StringMap = {
  "Fichte/Tanne": "spruce",
  Lärche: "larch",
  Douglasie: "douglas",
} as const;

export const SURFACE_TYPES: StringMap = {
  Geschliffen: "smooth",
  Sägerau: "rough",
  Gerillt: "grooved",
  Gehobelt: "planed",
} as const;

export const WOOD_COLORS: WoodColors = {
  spruce: [0.8, 0.7, 0.5],
  larch: [0.75, 0.6, 0.4],
  douglas: [0.7, 0.5, 0.3],
} as const;

export const TREATMENT_TYPES: StringMap = {
  Unbehandelt: "untreated",
  Vorvergraut: "pre_aged",
  "Lasur (UV-Schutz)": "glazed",
  "Deckend (Pigmentiert)": "opaque",
  Hydrophobiert: "hydrophobic",
  "Thermisch behandelt": "thermo",
} as const;

export const LASUR_COLORS: ColorMap = {
  Natur: "#c4a484",
  Honig: "#e3a857",
  Nussbaum: "#654321",
  Eiche: "#8b7355",
  Palisander: "#4a2932",
} as const;

export const PIGMENT_COLORS: ColorMap = {
  Weiß: "#f5f5f5",
  Hellgrau: "#d3d3d3",
  Anthrazit: "#383838",
  Schwarz: "#1a1a1a",
  Braun: "#654321",
  Terracotta: "#c66b3d",
} as const; 