import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Stage,
} from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useControls, button, Leva } from "leva";
import { Vector2 } from "three";
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

// Config & Utils
import {
  WOOD_TYPES,
  SURFACE_TYPES,
  LASUR_COLORS,
  PIGMENT_COLORS,
} from "../config/constants";
import { loadAvailableModels } from "../utils/modelUtils";

// Components
import { Header } from "./Header";
import { SphericalBackground } from "./SphericalBackground";
import { CustomModel } from "./CustomModel";
import { SceneController } from "./SceneController";
import { Toolbar } from "./Toolbar";
import { SectionOutlinePanel } from "./SectionOutlinePanel";

// Types (If not already in constants.ts or elsewhere)
interface ControlsRef {
  reset: () => void;
  zoomToFit: () => void;
  toggleClipping: () => void;
}

export function FacadeViewer() {
  const availableModels = useMemo(() => loadAvailableModels(), []);
  const [glbFiles] = useState<string[]>(availableModels);
  const [selectedModel, setSelectedModel] = useState<string>(
    availableModels[0]
  );
  const [backgroundImage, setBackgroundImage] = useState<string>();
  const [selectedTreatment, setSelectedTreatment] =
    useState<string>("Unbehandelt");
  const [selectedFinishColor, setSelectedFinishColor] = useState<
    string | undefined
  >();
  const controlsRef = useRef<OrbitControlsImpl | null>(null); // Use OrbitControlsImpl type
  const [sectionPoints, setSectionPoints] = useState<Vector2[]>([]);
  const [clippingEnabled, setClippingEnabled] = useState(false);

  // --- Leva Controls --- 

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

  // Add treatment controls to use setSelectedTreatment
  useControls("Behandlung", {
    Behandlung: {
      options: ["Unbehandelt", "Lasur (UV-Schutz)", "Deckend (Pigmentiert)"],
      value: selectedTreatment,
      onChange: (value: string) => {
        setSelectedTreatment(value);
      },
    },
  });

  // Update finish color automatically when treatment type changes, setting a default color.
  useEffect(() => {
    let defaultColor: string | undefined;
    if (selectedTreatment === "Lasur (UV-Schutz)") {
      const defaultColorName = Object.keys(LASUR_COLORS)[0];
      defaultColor = LASUR_COLORS[defaultColorName as keyof typeof LASUR_COLORS];
    } else if (selectedTreatment === "Deckend (Pigmentiert)") {
      const defaultColorName = Object.keys(PIGMENT_COLORS)[0];
      defaultColor = PIGMENT_COLORS[defaultColorName as keyof typeof PIGMENT_COLORS];
    } else {
        defaultColor = undefined;
    }
    setSelectedFinishColor(defaultColor);
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
      // Create user-friendly names, strip path and extension
      options: [
        "Standard",
        ...glbFiles.map((f) => f.split("/").pop()?.replace(".glb", "") || f),
      ],
      value: "Standard", // Default to standard
    },
  });

  const backgroundControls = useControls(
    "Hintergrund",
    {
      Anzeigen: {
        value: !!backgroundImage, // Reflect if background is loaded
        label: "Hintergrund anzeigen",
      },
      "Vertikale Position": {
        value: 0,
        min: -10,
        max: 10,
        step: 0.1,
        render: (get: (key: string) => any) => get("Hintergrund.Anzeigen"), // Only show if background is visible
      },
      Rotation: {
        value: 0,
        min: -Math.PI,
        max: Math.PI,
        step: 0.1,
        render: (get: (key: string) => any) => get("Hintergrund.Anzeigen"),
      },
      Größe: {
        value: 1,
        min: 0.1,
        max: 2,
        step: 0.1,
        render: (get: (key: string) => any) => get("Hintergrund.Anzeigen"),
      },
      "Bild auswählen": button(() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const url = URL.createObjectURL(file);
            setBackgroundImage(url); // This triggers re-render and visibility
            // Clean up previous object URL if exists
            // Note: Consider revoking `backgroundImage` URL in a cleanup useEffect
          }
        };
        input.click();
      }),
      Entfernen: button(
        () => {
          if (backgroundImage) {
             URL.revokeObjectURL(backgroundImage); // Clean up memory
          }
        setBackgroundImage(undefined);
        },
        // Cast settings to any to bypass strict type check for render
        { render: (get: (key: string) => any) => !!get("Hintergrund.Anzeigen") } as any 
      ),
    },
    { collapsed: true }, [backgroundImage] // Depend on backgroundImage for visibility updates
  );

  // --- Effects --- 

  // Update selected model based on Leva dropdown choice
  useEffect(() => {
    if (modelControls.Auswahl === "Standard") {
      setSelectedModel(availableModels[0]);
    } else {
      // Find the full path matching the display name
      const selectedFileName = `${modelControls.Auswahl}.glb`;
      const fullPath = glbFiles.find((f) => f.endsWith(selectedFileName));
      setSelectedModel(fullPath || availableModels[0]); // Fallback to default
    }
  }, [modelControls.Auswahl, glbFiles, availableModels]);

  // Callback for SceneController to update section state
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
        background: "var(--nordic-bg, #f5f5f5)", // Provide a fallback color
      }}
    >
      <Header />
      <div style={{ paddingTop: "80px", height: "calc(100% - 80px)" }}> {/* Adjust height */}
        <Canvas
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance",
            localClippingEnabled: true, // Ensure clipping is enabled in the renderer
          }}
          camera={{
            position: [0, 0, 5],
            fov: 50,
            near: 0.1,
            far: 1000,
          }}
          style={{ background: "transparent" }} // Canvas background transparent to show div bg
          shadows // Enable shadows globally
        >
          <color attach="background" args={["transparent"]} />
          <Suspense fallback={null}>
            {backgroundImage && backgroundControls.Anzeigen && (
              <SphericalBackground
                url={backgroundImage}
                visible={true} // Controlled by outer condition
                position={[0, backgroundControls["Vertikale Position"], 0]}
                rotation={[0, backgroundControls.Rotation, 0]}
                scale={backgroundControls.Größe}
              />
            )}
            <Stage
              environment="sunset" // Or choose another appropriate environment
              intensity={0.8}      // Adjust intensity as needed
              adjustCamera={false} // Keep manual camera control
              preset="portrait"
              shadows={{
                type: "contact", // Or 'accumulative'
                opacity: 0.6,
                blur: 2.5,
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
              maxPolarAngle={Math.PI / 1.9} // Slightly less than Pi/2 to avoid gimbal lock
              enableDamping
              dampingFactor={0.05}
              minDistance={0.5} // Prevent zooming too close
              maxDistance={15}  // Increase max distance slightly
              mouseButtons={{
                LEFT: 0,   // MOUSE.ROTATE
                MIDDLE: 2, // MOUSE.PAN
                RIGHT: 1,  // MOUSE.DOLLY
              }}
              target={[0, 0, 0]} // Initial target
            />
             {/* SceneController manages interactions and clipping */}
            <SceneController
              controls={controlsRef} // Pass the OrbitControls ref
              onSectionUpdate={handleSectionUpdate}
            />
          </Suspense>
        </Canvas>

        {/* UI Elements */}
        <div style={{ position: "fixed", top: "96px", right: "16px", zIndex: 1001 }}>
          <Leva fill titleBar={{ title: "Einstellungen", filter: true }} collapsed/>
        </div>
        <Toolbar controls={controlsRef as React.RefObject<ControlsRef | null>} />
        <SectionOutlinePanel visible={clippingEnabled} points={sectionPoints} />
      </div>
    </div>
  );
}
