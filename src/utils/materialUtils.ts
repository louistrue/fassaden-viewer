import {
  MeshStandardMaterial,
  Color,
} from "three";
import {
  WOOD_TYPES,
  SURFACE_TYPES,
  WOOD_COLORS,
  StringMap,
  WoodColors,
} from "../config/constants";

export function createMaterial(
  woodType: string,
  surface: string,
  age: number,
  treatment: string = "Unbehandelt",
  finishColor?: string
): MeshStandardMaterial {
  // Get the wood type key and base color
  const woodKey = (WOOD_TYPES as StringMap)[woodType] || "spruce";
  const baseColor = (WOOD_COLORS as WoodColors)[
    woodKey as keyof typeof WOOD_COLORS
  ];

  const mat = new MeshStandardMaterial({
    color: new Color(baseColor[0], baseColor[1], baseColor[2]),
    roughness: 0.65,
    metalness: 0.0,
    envMapIntensity: 1.0,
  });

  // Apply surface effects first
  const surfaceKey = (SURFACE_TYPES as StringMap)[surface];
  switch (surfaceKey) {
    case "rough": // Sägerau
      mat.roughness = 0.9;
      mat.metalness = 0.02;
      mat.envMapIntensity = 0.5;
      break;
    case "grooved": // Gerillt
      mat.roughness = 0.75;
      mat.metalness = 0.05;
      mat.envMapIntensity = 0.8;
      break;
    case "planed": // Geohobelt
      mat.roughness = 0.4;
      mat.metalness = 0.1;
      mat.envMapIntensity = 1.2;
      break;
    case "smooth": // Gehobelt
      mat.roughness = 0.55;
      mat.metalness = 0.08;
      mat.envMapIntensity = 1.0;
      break;
  }

  // Apply treatment effects
  switch (treatment) {
    case "Vorvergraut":
      const greyTint = new Color(0.75, 0.75, 0.77);
      mat.color.lerp(greyTint, 0.7);
      mat.roughness = Math.min(mat.roughness + 0.15, 1.0);
      mat.metalness = Math.max(mat.metalness - 0.02, 0);
      mat.envMapIntensity *= 0.7;
      break;

    case "Lasur (UV-Schutz)":
      if (finishColor) {
        const color = new Color(finishColor);
        mat.color.lerp(color, 0.4);
        mat.roughness = Math.max(mat.roughness - 0.1, 0);
        mat.metalness = Math.min(mat.metalness + 0.05, 1);
        mat.envMapIntensity *= 1.2;
      }
      break;

    case "Deckend (Pigmentiert)":
      if (finishColor) {
        const color = new Color(finishColor);
        mat.color.lerp(color, 0.85);
        mat.roughness = Math.max(mat.roughness - 0.2, 0);
        mat.metalness = Math.min(mat.metalness + 0.08, 1);
        mat.envMapIntensity *= 1.3;
      }
      break;

    case "Hydrophobiert":
      mat.color.multiplyScalar(0.95);
      mat.roughness = Math.max(mat.roughness - 0.15, 0);
      mat.metalness = Math.min(mat.metalness + 0.1, 1);
      mat.envMapIntensity *= 1.4;
      break;

    case "Thermisch behandelt":
      const darkTint = new Color(0.3, 0.2, 0.15);
      mat.color.lerp(darkTint, 0.6);
      mat.roughness = Math.min(mat.roughness + 0.1, 1.0);
      mat.metalness = Math.min(mat.metalness + 0.06, 1);
      mat.envMapIntensity *= 0.9;
      break;
  }

  // Apply aging effects last
  if (age > 1) {
    const agingFactor = Math.min((age - 1) / 9, 1);
    const greyColor = new Color(0.7, 0.7, 0.72);

    let agingIntensity = agingFactor;
    if (treatment === "Vorvergraut") {
      agingIntensity *= 1.2;
    } else if (
      treatment === "Lasur (UV-Schutz)" ||
      treatment === "Hydrophobiert"
    ) {
      agingIntensity *= 0.6;
    } else if (treatment === "Deckend (Pigmentiert)") {
      agingIntensity *= 0.4;
    }

    mat.color.lerp(greyColor, agingIntensity);
    mat.roughness = Math.min(mat.roughness + agingIntensity * 0.3, 1.0);
    mat.metalness = Math.max(mat.metalness - agingIntensity * 0.05, 0);
    mat.envMapIntensity *= 1 - agingIntensity * 0.3;
  }

  return mat;
} 