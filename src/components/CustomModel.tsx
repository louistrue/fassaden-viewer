import { useEffect, useRef } from "react";
import { useLoader } from "@react-three/fiber";
import { Box3, Vector3, MeshStandardMaterial } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createMaterial } from "../utils/materialUtils";

interface FacadeModelProps {
  modelPath?: string;
  woodType: string;
  surface: string;
  age: number;
  treatment: string;
  finishColor?: string;
}

export function CustomModel({
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
  return <primitive object={gltf.scene} />; // Cast necessary if strict mode is on
} 