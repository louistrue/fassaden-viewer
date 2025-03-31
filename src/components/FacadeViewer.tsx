import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber";
import {
  OrbitControls,
  Stage,
  useTexture,
  Environment,
  Center,
  Bounds,
  Html,
} from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useControls, folder, button, Leva } from "leva";
import {
  MeshStandardMaterial,
  Color,
  BoxGeometry,
  TextureLoader,
  SphereGeometry,
  Box3,
  Vector3,
  Plane,
  Matrix4,
  Mesh,
  Vector2,
  BufferGeometry,
  Line,
  LineBasicMaterial,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Define the control types
interface Controls {
  Holzart: "Fichte/Tanne" | "Lärche" | "Douglasie";
  Oberfläche: "Gehobelt" | "Sägerau" | "Gerillt" | "Geohobelt";
  "Alter (Jahre)": number;
}

interface FacadeModelProps {
  woodType: string;
  surface: string;
  age: number;
  modelPath?: string;
  treatment: string;
  finishColor?: string;
}

const WOOD_TYPES = {
  "Fichte/Tanne": "spruce",
  Lärche: "larch",
  Douglasie: "douglas",
} as const;

const SURFACE_TYPES = {
  Geschliffen: "smooth",
  Sägerau: "rough",
  Gerillt: "grooved",
  Gehobelt: "planed",
} as const;

// Base colors for different wood types
const WOOD_COLORS = {
  spruce: [0.8, 0.7, 0.5] as const, // Light yellow-brown
  larch: [0.75, 0.6, 0.4] as const, // Medium brown
  douglas: [0.7, 0.5, 0.3] as const, // Darker brown
} as const;

const TREATMENT_TYPES = {
  Unbehandelt: "untreated",
  Vorvergraut: "pre_aged",
  "Lasur (UV-Schutz)": "glazed",
  "Deckend (Pigmentiert)": "opaque",
  Hydrophobiert: "hydrophobic",
  "Thermisch behandelt": "thermo",
} as const;

const LASUR_COLORS = {
  Natur: "#c4a484",
  Honig: "#e3a857",
  Nussbaum: "#654321",
  Eiche: "#8b7355",
  Palisander: "#4a2932",
} as const;

const PIGMENT_COLORS = {
  Weiß: "#f5f5f5",
  Hellgrau: "#d3d3d3",
  Anthrazit: "#383838",
  Schwarz: "#1a1a1a",
  Braun: "#654321",
  Terracotta: "#c66b3d",
} as const;

function createMaterial(
  woodType: string,
  surface: string,
  age: number,
  treatment: string = "Unbehandelt",
  finishColor?: string
) {
  console.log(`Creating material with:`, {
    woodType,
    surface,
    age,
    treatment,
    finishColor,
  });

  // Get the wood type key and base color
  const woodKey = WOOD_TYPES[woodType as keyof typeof WOOD_TYPES] || "spruce";
  const baseColor = WOOD_COLORS[woodKey as keyof typeof WOOD_COLORS];

  // Create base material
  const mat = new MeshStandardMaterial({
    color: new Color(baseColor[0], baseColor[1], baseColor[2]),
    roughness: 0.65, // Start with a more realistic wood roughness
    metalness: 0.0,
    envMapIntensity: 1.0,
  });

  // Apply surface effects first
  const surfaceKey = SURFACE_TYPES[surface as keyof typeof SURFACE_TYPES];
  switch (surfaceKey) {
    case "rough": // Sägerau
      mat.roughness = 0.9;
      mat.metalness = 0.02;
      mat.envMapIntensity = 0.5; // Less reflective
      break;
    case "grooved": // Gerillt
      mat.roughness = 0.75;
      mat.metalness = 0.05;
      mat.envMapIntensity = 0.8;
      break;
    case "planed": // Geohobelt
      mat.roughness = 0.4;
      mat.metalness = 0.1;
      mat.envMapIntensity = 1.2; // More reflective
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
      // Grey patina effect
      const greyTint = new Color(0.75, 0.75, 0.77);
      mat.color.lerp(greyTint, 0.7);
      mat.roughness = Math.min(mat.roughness + 0.15, 1.0);
      mat.metalness = Math.max(mat.metalness - 0.02, 0);
      mat.envMapIntensity *= 0.7;
      break;

    case "Lasur (UV-Schutz)":
      if (finishColor) {
        const color = new Color(finishColor);
        // Subtle blend with wood color for translucent effect
        mat.color.lerp(color, 0.4);
        mat.roughness = Math.max(mat.roughness - 0.1, 0);
        mat.metalness = Math.min(mat.metalness + 0.05, 1);
        mat.envMapIntensity *= 1.2; // Slightly more reflective
      }
      break;

    case "Deckend (Pigmentiert)":
      if (finishColor) {
        const color = new Color(finishColor);
        // Strong color but keep some wood texture
        mat.color.lerp(color, 0.85);
        mat.roughness = Math.max(mat.roughness - 0.2, 0);
        mat.metalness = Math.min(mat.metalness + 0.08, 1);
        mat.envMapIntensity *= 1.3; // More reflective
      }
      break;

    case "Hydrophobiert":
      // Water-repellent effect - slightly darker and more reflective
      mat.color.multiplyScalar(0.95);
      mat.roughness = Math.max(mat.roughness - 0.15, 0);
      mat.metalness = Math.min(mat.metalness + 0.1, 1);
      mat.envMapIntensity *= 1.4;
      break;

    case "Thermisch behandelt":
      // Darker, richer color with slight sheen
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

    // Different aging behavior based on treatment
    let agingIntensity = agingFactor;
    if (treatment === "Vorvergraut") {
      agingIntensity *= 1.2; // Faster aging
    } else if (
      treatment === "Lasur (UV-Schutz)" ||
      treatment === "Hydrophobiert"
    ) {
      agingIntensity *= 0.6; // Slower aging
    } else if (treatment === "Deckend (Pigmentiert)") {
      agingIntensity *= 0.4; // Very slow aging
    }

    mat.color.lerp(greyColor, agingIntensity);
    mat.roughness = Math.min(mat.roughness + agingIntensity * 0.3, 1.0);
    mat.metalness = Math.max(mat.metalness - agingIntensity * 0.05, 0);
    mat.envMapIntensity *= 1 - agingIntensity * 0.3;
  }

  console.log("Final material properties:", {
    color: mat.color,
    roughness: mat.roughness,
    metalness: mat.metalness,
    envMapIntensity: mat.envMapIntensity,
  });

  return mat;
}

function loadAvailableModels() {
  return [
    "/facades/FVG.092.glb",
    "/facades/FVG.073.glb",
    "/facades/FHG.015.glb",
    "/facades/FVG113.glb",
  ];
}

function SphericalBackground({
  url,
  visible,
  position,
  rotation,
  scale,
}: {
  url: string;
  visible: boolean;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}) {
  const texture = useTexture(url);

  if (!visible) return null;

  return (
    <mesh position={position} rotation={rotation}>
      <sphereGeometry args={[50 * scale, 64, 64]} />
      <meshBasicMaterial map={texture} side={2} transparent opacity={0.9} />
    </mesh>
  );
}

function FileSelector({
  onGlbSelect,
  onBackgroundSelect,
  availableModels,
}: {
  onGlbSelect: (files: string[]) => void;
  onBackgroundSelect: (file: string) => void;
  availableModels: string[];
}) {
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

function CustomModel({
  modelPath,
  woodType,
  surface,
  age,
  treatment,
  finishColor,
}: FacadeModelProps) {
  const gltf = useLoader(GLTFLoader, modelPath || "");
  const materialRef = useRef<MeshStandardMaterial | null>(null);

  // Apply material effects to loaded model
  useEffect(() => {
    if (gltf?.scene) {
      gltf.scene.traverse((child: any) => {
        if (child.isMesh) {
          const newMaterial = createMaterial(
            woodType,
            surface,
            age,
            treatment,
            finishColor
          );
          child.material = newMaterial;
          materialRef.current = newMaterial;
        }
      });
    }
  }, [gltf?.scene, woodType, surface, age, treatment, finishColor]);

  // Position the model correctly
  useEffect(() => {
    if (gltf?.scene) {
      // Center the model horizontally
      gltf.scene.position.set(0, 0, 0);

      // Calculate bounding box
      const box = new Box3().setFromObject(gltf.scene);
      const size = new Vector3();
      const center = new Vector3();
      box.getSize(size);
      box.getCenter(center);

      // Adjust position to center the model
      gltf.scene.position.y = -center.y;
    }
  }, [gltf?.scene]);

  if (!gltf?.scene) return null;
  return <primitive object={gltf.scene} />;
}

function Header() {
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "80px",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e5e5e5",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        padding: "0 32px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <img
        src="/Sagerei.png"
        alt="Sagerei Logo"
        style={{ height: "70px", marginRight: "48px" }}
      />
      <nav
        style={{
          display: "flex",
          gap: "32px",
          fontSize: "16px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <a href="#" style={{ color: "#333", textDecoration: "none" }}>
          Startseite
        </a>
        <a href="#" style={{ color: "#333", textDecoration: "none" }}>
          Produkte
        </a>
        <a href="#" style={{ color: "#333", textDecoration: "none" }}>
          Dienstleistungen
        </a>
        <a
          href="#"
          style={{
            color: "#2563eb",
            textDecoration: "none",
            fontWeight: "500",
          }}
        >
          Fassaden Viewer
        </a>
        <a href="#" style={{ color: "#333", textDecoration: "none" }}>
          Über uns
        </a>
        <a href="#" style={{ color: "#333", textDecoration: "none" }}>
          Kontakt
        </a>
      </nav>
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            fontSize: "14px",
            color: "#666",
          }}
        >
          <span>Telefon</span>
          <a
            href="mailto:info@saegerei"
            style={{ color: "#666", textDecoration: "none" }}
          >
            info@saegerei
          </a>
        </div>
      </div>
    </header>
  );
}

function SectionOutlinePanel({
  visible,
  points,
}: {
  visible: boolean;
  points: Vector2[];
}) {
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
  const scaleX = (width - padding * 2) / (maxX - minX);
  const scaleY = (height - padding * 2) / (maxY - minY);
  const scale = Math.min(scaleX, scaleY);

  // Transform points to panel coordinates
  const transformedPoints = points.map((p) => ({
    x: (p.x - minX) * scale + padding,
    y: height - ((p.y - minY) * scale + padding),
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
      <svg width={width} height={height - 24} style={{ display: "block" }}>
        <path
          d={`M ${transformedPoints
            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
            .join(" ")} Z`}
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

function SceneController({
  controls,
  onSectionUpdate,
}: {
  controls: any;
  onSectionUpdate: (points: Vector2[], enabled: boolean) => void;
}) {
  const { scene, camera } = useThree();
  const [clippingEnabled, setClippingEnabled] = useState(false);
  const [sectionMaterial] = useState(
    () =>
      new MeshStandardMaterial({
        color: new Color(0.2, 0.2, 0.2),
        side: 2,
        clippingPlanes: [],
        roughness: 0.4,
        metalness: 0.5,
      })
  );

  const handleReset = () => {
    if (camera) {
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);
    }

    if (clippingEnabled) {
      setClippingEnabled(false);
      onSectionUpdate([], false);
      if (scene) {
        scene.traverse((child: any) => {
          if (child.isMesh) {
            child.material.clippingPlanes = [];
            child.material.clipShadows = false;
            child.material.needsUpdate = true;
          }
        });

        const existingSection = scene.getObjectByName("sectionOutline");
        if (existingSection) {
          scene.remove(existingSection);
        }
      }
    }
  };

  const handleZoom = () => {
    if (camera && scene) {
      console.log("Camera found:", camera);
      console.log("Scene found:", scene);

      // Find the main facade mesh by looking for the largest mesh in the scene
      let facadeMesh = null;
      let maxArea = 0;

      console.log("Traversing scene...");
      scene.traverse((child: any) => {
        if (child.isMesh && child.geometry) {
          console.log("Found mesh:", child.name, child.type);
          const box = new Box3().setFromObject(child);
          const size = new Vector3();
          box.getSize(size);
          const area = size.x * size.y;
          console.log("Mesh dimensions:", {
            name: child.name,
            size: { x: size.x, y: size.y, z: size.z },
            area: area,
          });
          if (area > maxArea) {
            maxArea = area;
            facadeMesh = child;
          }
        }
      });

      console.log(
        "Selected facade mesh:",
        facadeMesh?.name,
        "with area:",
        maxArea
      );

      if (facadeMesh) {
        const box = new Box3().setFromObject(facadeMesh);
        const size = new Vector3();
        box.getSize(size);

        // Calculate the distance needed to fit the facade
        const maxDim = Math.max(size.x, size.y);
        const fov = camera.fov * (Math.PI / 180);
        const distance = Math.abs(maxDim / Math.sin(fov / 2));

        console.log("Camera calculations:", {
          maxDim,
          fov,
          distance,
          finalDistance: distance * 0.6,
        });

        // Keep current camera direction but adjust distance
        const direction = camera.position.clone().normalize();
        camera.position.copy(direction.multiplyScalar(distance * 0.6));

        console.log("Camera positioned at:", camera.position);
      } else {
        console.log("No facade mesh found, using default position");
        // Keep current camera direction but reset distance
        const direction = camera.position.clone().normalize();
        camera.position.copy(direction.multiplyScalar(5));
      }
    }
  };

  const toggleClipping = () => {
    console.log("Toggle clipping called, current state:", clippingEnabled);
    const newClippingState = !clippingEnabled;
    setClippingEnabled(newClippingState);

    if (!newClippingState) {
      onSectionUpdate([], false);
    }

    if (scene) {
      console.log("Scene found, searching for facade mesh...");
      let facadeMesh = null;
      let maxArea = 0;

      scene.traverse((child: any) => {
        if (child.isMesh && child.geometry) {
          const box = new Box3().setFromObject(child);
          const size = new Vector3();
          box.getSize(size);
          const area = size.x * size.y;
          console.log("Found mesh:", child.name, "with area:", area);
          if (area > maxArea) {
            maxArea = area;
            facadeMesh = child;
          }
        }
      });

      if (facadeMesh) {
        console.log("Found facade mesh, calculating clipping plane...");
        const box = new Box3().setFromObject(facadeMesh);
        const size = new Vector3();
        const center = new Vector3();
        box.getSize(size);
        box.getCenter(center);

        const bottomY = center.y - size.y / 2;
        const clipHeight = bottomY + 0.5;
        const clippingPlane = new Plane(new Vector3(0, -1, 0), clipHeight);

        // Calculate section points for 2D view
        if (newClippingState) {
          const geometry = facadeMesh.geometry;
          const position = geometry.attributes.position;
          const points: Vector2[] = [];
          const tempVec3 = new Vector3();

          // Get all vertices at the clip height
          for (let i = 0; i < position.count; i++) {
            tempVec3.fromBufferAttribute(position, i);
            tempVec3.applyMatrix4(facadeMesh.matrixWorld);
            if (Math.abs(tempVec3.y - clipHeight) < 0.01) {
              points.push(new Vector2(tempVec3.x, tempVec3.z));
            }
          }

          // Sort points to form outline
          if (points.length > 0) {
            const sortedPoints = [points[0]];
            points.splice(0, 1);

            while (points.length > 0) {
              const current = sortedPoints[sortedPoints.length - 1];
              let nearestIdx = 0;
              let nearestDist = Infinity;

              points.forEach((p, i) => {
                const dist = current.distanceTo(p);
                if (dist < nearestDist) {
                  nearestDist = dist;
                  nearestIdx = i;
                }
              });

              sortedPoints.push(points[nearestIdx]);
              points.splice(nearestIdx, 1);
            }

            onSectionUpdate(sortedPoints, true);
          }
        }

        // Remove existing section mesh if any
        const existingSection = scene.getObjectByName("sectionOutline");
        if (existingSection) {
          console.log("Removing existing section outline");
          scene.remove(existingSection);
        }

        if (newClippingState) {
          console.log("Creating new section outline");
          // Create section geometry from the facade mesh
          const sectionGeometry = facadeMesh.geometry.clone();
          sectionGeometry.translate(0, -clipHeight, 0);
          const sectionMesh = new Mesh(sectionGeometry, sectionMaterial);
          sectionMesh.name = "sectionOutline";
          sectionMesh.position.y = clipHeight;
          scene.add(sectionMesh);
        }

        // Apply to all materials in the scene
        scene.traverse((child: any) => {
          if (child.isMesh) {
            console.log("Applying clipping to mesh:", child.name);
            if (newClippingState) {
              child.material.clippingPlanes = [clippingPlane];
              child.material.clipShadows = true;
              child.material.needsUpdate = true;
            } else {
              child.material.clippingPlanes = [];
              child.material.clipShadows = false;
              child.material.needsUpdate = true;
            }
          }
        });
      } else {
        console.log("No facade mesh found");
      }
    } else {
      console.log("No scene found");
    }
  };

  // Expose functions to the parent through the controls ref
  if (controls?.current) {
    controls.current.zoomToFit = handleZoom;
    controls.current.toggleClipping = toggleClipping;
    controls.current.reset = handleReset;
  }

  return null;
}

function Toolbar({ controls }: { controls: any }) {
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
        onClick={() => controls?.current?.reset(true)}
        style={{
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
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "#1d4ed8")}
        onMouseOut={(e) => (e.currentTarget.style.background = "#2563eb")}
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
        style={{
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
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "#1d4ed8")}
        onMouseOut={(e) => (e.currentTarget.style.background = "#2563eb")}
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
        style={{
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
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "#1d4ed8")}
        onMouseOut={(e) => (e.currentTarget.style.background = "#2563eb")}
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

export function FacadeViewer() {
  const availableModels = useMemo(() => loadAvailableModels(), []);
  const [glbFiles, setGlbFiles] = useState<string[]>(availableModels);
  const [selectedModel, setSelectedModel] = useState<string>(
    availableModels[0]
  ); // Set first model as default
  const [backgroundImage, setBackgroundImage] = useState<string>();
  const [selectedTreatment, setSelectedTreatment] =
    useState<string>("Unbehandelt");
  const [selectedFinishColor, setSelectedFinishColor] = useState<
    string | undefined
  >();
  const controlsRef = useRef<any>(null);
  const [sectionPoints, setSectionPoints] = useState<Vector2[]>([]);
  const [clippingEnabled, setClippingEnabled] = useState(false);

  const woodControls = useControls("Holz", {
    Holzart: {
      options: Object.keys(WOOD_TYPES),
      value: "Fichte/Tanne",
      label: "Holzart",
    },
    Oberfläche: {
      options: Object.keys(SURFACE_TYPES),
      value: "Gehobelt",
    },
  });

  const treatmentControls = useControls(
    "Oberflächenbehandlung",
    () => ({
      Behandlung: {
        options: Object.keys(TREATMENT_TYPES),
        value: selectedTreatment,
        onChange: (value: string) => {
          console.log("Treatment changed to:", value);
          setSelectedTreatment(value);
        },
      },
      ...(selectedTreatment === "Lasur (UV-Schutz)"
        ? {
            Farbe: {
              options: Object.keys(LASUR_COLORS),
              value: Object.keys(LASUR_COLORS)[0],
              onChange: (value: string) => {
                console.log("Lasur color selected:", value);
                const color = LASUR_COLORS[value as keyof typeof LASUR_COLORS];
                setSelectedFinishColor(color);
              },
            },
          }
        : selectedTreatment === "Deckend (Pigmentiert)"
        ? {
            Farbe: {
              options: Object.keys(PIGMENT_COLORS),
              value: Object.keys(PIGMENT_COLORS)[0],
              onChange: (value: string) => {
                console.log("Pigment color selected:", value);
                const color =
                  PIGMENT_COLORS[value as keyof typeof PIGMENT_COLORS];
                setSelectedFinishColor(color);
              },
            },
          }
        : {}),
    }),
    [selectedTreatment]
  );

  // Update finish color when treatment changes (not color selection)
  useEffect(() => {
    if (selectedTreatment === "Lasur (UV-Schutz)") {
      const colorName = Object.keys(LASUR_COLORS)[0];
      const color = LASUR_COLORS[colorName as keyof typeof LASUR_COLORS];
      console.log("Setting initial Lasur color:", { colorName, color });
      setSelectedFinishColor(color);
    } else if (selectedTreatment === "Deckend (Pigmentiert)") {
      const colorName = Object.keys(PIGMENT_COLORS)[0];
      const color = PIGMENT_COLORS[colorName as keyof typeof PIGMENT_COLORS];
      console.log("Setting initial Pigment color:", { colorName, color });
      setSelectedFinishColor(color);
    } else {
      console.log("Clearing finish color");
      setSelectedFinishColor(undefined);
    }
  }, [selectedTreatment]);

  const ageControls = useControls("Alterung", {
    "Alter (Jahre)": {
      value: 1,
      min: 1,
      max: 10,
      step: 1,
    },
  });

  const modelControls = useControls("Fassade", {
    Auswahl: {
      options: ["Standard", ...glbFiles.map((f) => f.split("/").pop() || f)],
      value: "Standard",
    },
  });

  const backgroundControls = useControls(
    "Hintergrund",
    {
      Anzeigen: {
        value: true,
        label: "Hintergrund anzeigen",
      },
      "Vertikale Position": {
        value: 0,
        min: -10,
        max: 10,
        step: 0.1,
      },
      Rotation: {
        value: 0,
        min: -Math.PI,
        max: Math.PI,
        step: 0.1,
      },
      Größe: {
        value: 1,
        min: 0.1,
        max: 2,
        step: 0.1,
      },
      "Bild auswählen": button(() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const url = URL.createObjectURL(file);
            setBackgroundImage(url);
          }
        };
        input.click();
      }),
      Zurücksetzen: button(() => {
        setBackgroundImage(undefined);
      }),
    },
    { collapsed: true }
  );

  useEffect(() => {
    if (modelControls.Auswahl === "Standard") {
      setSelectedModel(availableModels[0]);
    } else {
      const fullPath = glbFiles.find((f) => f.endsWith(modelControls.Auswahl));
      setSelectedModel(fullPath || availableModels[0]);
    }
  }, [modelControls.Auswahl, glbFiles, availableModels]);

  const handleSectionUpdate = (points: Vector2[], enabled: boolean) => {
    setSectionPoints(points);
    setClippingEnabled(enabled);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "var(--nordic-bg)",
      }}
    >
      <Header />
      <div style={{ paddingTop: "80px", height: "100%" }}>
        <Canvas
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance",
            localClippingEnabled: true, // Enable clipping
          }}
          camera={{
            position: [0, 0, 5],
            fov: 50,
            near: 0.1,
            far: 1000,
          }}
          style={{ background: "var(--nordic-bg)" }}
        >
          <color attach="background" args={["#f5f5f5"]} />
          <Suspense fallback={null}>
            {backgroundImage && (
              <SphericalBackground
                url={backgroundImage}
                visible={backgroundControls.Anzeigen}
                position={[0, backgroundControls["Vertikale Position"], 0]}
                rotation={[0, backgroundControls.Rotation, 0]}
                scale={backgroundControls.Größe}
              />
            )}
            <Stage
              environment="sunset"
              intensity={1.0}
              adjustCamera={false}
              preset="portrait"
              shadows={{
                type: "contact",
                opacity: 0.7,
                blur: 3.0,
                resolution: 1024,
              }}
            >
              <CustomModel
                modelPath={selectedModel}
                woodType={woodControls.Holzart}
                surface={woodControls.Oberfläche}
                age={ageControls["Alter (Jahre)"]}
                treatment={selectedTreatment}
                finishColor={selectedFinishColor}
              />
            </Stage>
            <OrbitControls
              ref={controlsRef}
              makeDefault
              minPolarAngle={0}
              maxPolarAngle={Math.PI / 2}
              enableDamping
              dampingFactor={0.05}
              maxDistance={10}
              mouseButtons={{
                LEFT: 0, // Left mouse for rotation
                MIDDLE: 2, // Middle mouse for panning
                RIGHT: 1, // Right mouse for zooming
              }}
            />
            <SceneController
              controls={controlsRef}
              onSectionUpdate={handleSectionUpdate}
            />
          </Suspense>
        </Canvas>
        <div style={{ position: "fixed", top: "96px", right: "16px" }}>
          <Leva fill titleBar={{ title: "Einstellungen", filter: true }} />
        </div>
        <Toolbar controls={controlsRef} />
        <SectionOutlinePanel visible={clippingEnabled} points={sectionPoints} />
      </div>
    </div>
  );
}
