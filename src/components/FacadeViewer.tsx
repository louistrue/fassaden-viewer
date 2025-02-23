import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber";
import {
  OrbitControls,
  Stage,
  useTexture,
  Environment,
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
    "/facades/t_j.glb",
    "/facades/t_j_t.glb",
    "/facades/FVG102_j_t.glb",
    "/facades/FVG102_j.glb",
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
  const [glbFiles, setGlbFiles] = useState<string[]>([]);
  const [bgImage, setBgImage] = useState<string>("");

  useEffect(() => {
    setGlbFiles(availableModels);
    onGlbSelect(availableModels);
  }, [availableModels, onGlbSelect]);

  const handleGlbFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const glbUrls = files.map((file) => URL.createObjectURL(file));
      const newFiles = [...availableModels, ...glbUrls];
      setGlbFiles(newFiles);
      onGlbSelect(newFiles);
    }
  };

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
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ margin: "0 0 16px 0", color: "#333", fontSize: "18px" }}>
          Fassaden
        </h3>
        <div style={{ fontSize: "14px", marginBottom: "16px", color: "#666" }}>
          <strong style={{ color: "#333" }}>Verfügbare Profile:</strong>
          <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
            {availableModels.map((file, index) => (
              <li key={index} style={{ marginBottom: "4px" }}>
                {file.split("/").pop()}
              </li>
            ))}
          </ul>
        </div>
        <label
          style={{
            display: "inline-block",
            padding: "8px 16px",
            background: "#00a67c",
            color: "white",
            borderRadius: "4px",
            cursor: "pointer",
            marginTop: "8px",
          }}
        >
          Profil hinzufügen
          <input
            type="file"
            accept=".glb"
            multiple
            onChange={handleGlbFiles}
            style={{ display: "none" }}
          />
        </label>
      </div>
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

      // Adjust position to sit on the "ground"
      gltf.scene.position.y = -center.y + size.y / 2;
    }
  }, [gltf?.scene]);

  if (!gltf?.scene) return null;
  return <primitive object={gltf.scene} />;
}

function FacadeModel({
  woodType,
  surface,
  age,
  modelPath,
  treatment,
  finishColor,
  hasBackground,
}: FacadeModelProps & { hasBackground?: boolean }) {
  const materialRef = useRef<MeshStandardMaterial | null>(null);
  const updateCountRef = useRef(0);

  // Create geometries once
  const geometries = useMemo(
    () => ({
      main: new BoxGeometry(2, 3, 0.1),
      plank: new BoxGeometry(2, 0.45, 0.02),
    }),
    []
  );

  // Create initial material
  const material = useMemo(() => {
    console.log("Creating initial material");
    const mat = createMaterial(woodType, surface, age, treatment, finishColor);
    materialRef.current = mat;
    return mat;
  }, [woodType, surface, age, treatment, finishColor]);

  // Update material when props change
  useEffect(() => {
    updateCountRef.current += 1;
    console.log(`Material update #${updateCountRef.current}`, {
      woodType,
      surface,
      age,
      treatment,
      finishColor,
    });

    if (materialRef.current) {
      const newMaterial = createMaterial(
        woodType,
        surface,
        age,
        treatment,
        finishColor
      );
      console.log("Copying new material properties to existing material");
      materialRef.current.copy(newMaterial);
      newMaterial.dispose();
    }
  }, [woodType, surface, age, treatment, finishColor]);

  // Cleanup
  useEffect(() => {
    return () => {
      console.log("Cleaning up materials and geometries");
      material.dispose();
      geometries.main.dispose();
      geometries.plank.dispose();
    };
  }, [material, geometries]);

  // Force render on material updates
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.needsUpdate = true;
    }
  });

  if (modelPath) {
    return (
      <CustomModel
        modelPath={modelPath}
        woodType={woodType}
        surface={surface}
        age={age}
        treatment={treatment}
        finishColor={finishColor}
      />
    );
  }

  return (
    <group>
      {/* Only render the main background plane if no background image is active */}
      {!hasBackground && (
        <mesh
          geometry={geometries.main}
          material={material}
          position={[0, 0, 0]}
        />
      )}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh
          key={i}
          geometry={geometries.plank}
          material={material}
          position={[0, -1.5 + i * 0.5, 0.05]}
        />
      ))}
    </group>
  );
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
        backgroundColor: "#fff",
        borderBottom: "1px solid #e5e5e5",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        padding: "0 32px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <img
        src="/rueder-logo.webp"
        alt="Rueder Logo"
        style={{ height: "50px", marginRight: "48px" }}
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
          Home
        </a>
        <a href="#" style={{ color: "#333", textDecoration: "none" }}>
          Einsatzbereiche
        </a>
        <a href="#" style={{ color: "#333", textDecoration: "none" }}>
          Produkte
        </a>
        <a
          href="#"
          style={{
            color: "#00a67c",
            textDecoration: "none",
            fontWeight: "500",
          }}
        >
          Fassaden Viewer
        </a>
        <a href="#" style={{ color: "#333", textDecoration: "none" }}>
          Einkauf
        </a>
        <a href="#" style={{ color: "#333", textDecoration: "none" }}>
          Über uns
        </a>
        <a href="#" style={{ color: "#333", textDecoration: "none" }}>
          Offene Stellen
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

export function FacadeViewer() {
  const availableModels = useMemo(() => loadAvailableModels(), []);
  const [glbFiles, setGlbFiles] = useState<string[]>(availableModels);
  const [selectedModel, setSelectedModel] = useState<string>();
  const [backgroundImage, setBackgroundImage] = useState<string>();
  const [selectedTreatment, setSelectedTreatment] =
    useState<string>("Unbehandelt");
  const [selectedFinishColor, setSelectedFinishColor] = useState<
    string | undefined
  >();

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
      Zurücksetzen: button(() => {
        setBackgroundImage(undefined);
      }),
    },
    { collapsed: true }
  );

  useEffect(() => {
    if (modelControls.Auswahl === "Standard") {
      setSelectedModel(undefined);
    } else {
      const fullPath = glbFiles.find((f) => f.endsWith(modelControls.Auswahl));
      setSelectedModel(fullPath);
    }
  }, [modelControls.Auswahl, glbFiles]);

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
        <FileSelector
          availableModels={availableModels}
          onGlbSelect={setGlbFiles}
          onBackgroundSelect={setBackgroundImage}
        />
        <Canvas
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance",
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
              {selectedModel ? (
                <CustomModel
                  modelPath={selectedModel}
                  woodType={woodControls.Holzart}
                  surface={woodControls.Oberfläche}
                  age={ageControls["Alter (Jahre)"]}
                  treatment={selectedTreatment}
                  finishColor={selectedFinishColor}
                />
              ) : (
                <FacadeModel
                  woodType={woodControls.Holzart}
                  surface={woodControls.Oberfläche}
                  age={ageControls["Alter (Jahre)"]}
                  treatment={selectedTreatment}
                  finishColor={selectedFinishColor}
                  hasBackground={!!backgroundImage}
                />
              )}
            </Stage>
            <OrbitControls
              makeDefault
              minPolarAngle={0}
              maxPolarAngle={Math.PI / 2}
              enableDamping
              dampingFactor={0.05}
              minDistance={2}
              maxDistance={10}
            />
          </Suspense>
        </Canvas>
        <div style={{ position: "fixed", bottom: "16px", right: "16px" }}>
          <Leva fill titleBar={{ title: "Einstellungen", filter: true }} />
        </div>
      </div>
    </div>
  );
}
