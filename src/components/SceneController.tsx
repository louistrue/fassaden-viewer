import { useState, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import {
  Box3,
  Vector3,
  Plane,
  Color,
  MeshStandardMaterial,
  Mesh,
  Vector2,
  PerspectiveCamera,
  Object3D,
  Scene,
  BufferGeometry,
} from "three";
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';


interface SceneControllerProps {
  controls: React.RefObject<OrbitControlsImpl | null>;
  onSectionUpdate: (points: Vector2[], enabled: boolean) => void;
}

interface FacadeMesh extends Mesh {
    geometry: BufferGeometry;
}


export function SceneController({
  controls,
  onSectionUpdate,
}: SceneControllerProps) {
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

  const findFacadeMesh = (targetScene: Scene): FacadeMesh | null => {
    let facadeMesh: FacadeMesh | null = null;
    let maxArea = 0;

    targetScene.traverse((child: Object3D) => {
        if (child instanceof Mesh && child.geometry) {
            const mesh = child as FacadeMesh;
            const box = new Box3().setFromObject(mesh);
            const size = new Vector3();
            box.getSize(size);
            const area = size.x * size.y;
            if (area > maxArea) {
                maxArea = area;
                facadeMesh = mesh;
            }
        }
    });
    return facadeMesh;
};

  const handleReset = () => {
    if (camera) {
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);
    }

    if (controls.current) {
        controls.current.target.set(0,0,0);
        controls.current.update();
    }

    if (clippingEnabled) {
      setClippingEnabled(false);
      onSectionUpdate([], false);
      if (scene) {
        scene.traverse((child: any) => {
          if (child instanceof Mesh && child.material) {
            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];
            materials.forEach((mat) => {
                if (mat) {
                    mat.clippingPlanes = [];
                    mat.clipShadows = false;
                    mat.needsUpdate = true;
                }
            });
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
      const facadeMesh = findFacadeMesh(scene);

      if (facadeMesh && camera instanceof PerspectiveCamera) {
        const box = new Box3().setFromObject(facadeMesh);
        const size = new Vector3();
        const center = new Vector3();
        box.getSize(size);
        box.getCenter(center);

        const maxDim = Math.max(size.x, size.y);
        const fov = camera.fov * (Math.PI / 180);
        let distance = Math.abs(maxDim / Math.sin(fov / 2));
        distance = distance * 0.6; // Add some padding

         // Calculate direction from camera to target
        const direction = new Vector3();
        camera.getWorldDirection(direction);
        direction.negate(); // Point towards the center

        // Position the camera along the direction vector
        camera.position.copy(center).addScaledVector(direction, distance);
        camera.lookAt(center);

        // Update orbit controls target
        if (controls.current) {
            controls.current.target.copy(center);
            controls.current.update();
        }

      } else {
        // Fallback zoom
        camera.position.set(0, 0, 5);
        camera.lookAt(0, 0, 0);
        if (controls.current) {
            controls.current.target.set(0,0,0);
            controls.current.update();
        }
      }
    }
  };

  const toggleClipping = () => {
    const newClippingState = !clippingEnabled;
    setClippingEnabled(newClippingState);

    if (!newClippingState) {
      onSectionUpdate([], false);
    }

    if (scene) {
        const facadeMesh = findFacadeMesh(scene);

      if (facadeMesh) {
        const box = new Box3().setFromObject(facadeMesh);
        const size = new Vector3();
        const center = new Vector3();
        box.getSize(size);
        box.getCenter(center);

        const bottomY = center.y - size.y / 2;
        const clipHeight = bottomY + 0.5; // Set clipping height slightly above the bottom
        const clippingPlane = new Plane(new Vector3(0, -1, 0), clipHeight);

        // Remove existing section mesh if any
        const existingSection = scene.getObjectByName("sectionOutline");
        if (existingSection) {
          scene.remove(existingSection);
        }

        if (newClippingState) {
           const geometry = facadeMesh.geometry;
           const position = geometry.attributes.position;
           const points: Vector2[] = [];
           const tempVec3 = new Vector3();
           const uniquePoints = new Map<string, Vector2>();

           // Get vertices close to the clip height, apply world matrix
           for (let i = 0; i < position.count; i++) {
               tempVec3.fromBufferAttribute(position, i);
               tempVec3.applyMatrix4(facadeMesh.matrixWorld);
               if (Math.abs(tempVec3.y - clipHeight) < 0.01) {
                   const key = `${tempVec3.x.toFixed(4)},${tempVec3.z.toFixed(4)}`;
                   if (!uniquePoints.has(key)) {
                       uniquePoints.set(key, new Vector2(tempVec3.x, tempVec3.z));
                   }
               }
           }
           points.push(...uniquePoints.values());

           // Sort points to form an outline (simple nearest neighbor approach)
           if (points.length > 1) {
               const sortedPoints = [points[0]];
               const remainingPoints = points.slice(1);

               while (remainingPoints.length > 0) {
                   const current = sortedPoints[sortedPoints.length - 1];
                   let nearestIdx = 0;
                   let nearestDistSq = Infinity;

                   for (let i = 0; i < remainingPoints.length; i++) {
                       const distSq = current.distanceToSquared(remainingPoints[i]);
                       if (distSq < nearestDistSq) {
                           nearestDistSq = distSq;
                           nearestIdx = i;
                       }
                   }
                   sortedPoints.push(remainingPoints[nearestIdx]);
                   remainingPoints.splice(nearestIdx, 1);
               }
               onSectionUpdate(sortedPoints, true);
           } else {
            onSectionUpdate([], true); // Handle case with 0 or 1 point
           }

           // Create a visual representation of the section cut (optional)
           // Consider using a dedicated library or more robust method for complex cuts
           const sectionGeometry = facadeMesh.geometry.clone();
           // Transformation might be needed depending on how you want to visualize
           const sectionMesh = new Mesh(sectionGeometry, sectionMaterial);
           sectionMesh.name = "sectionOutline";
           // Position it correctly if needed
           // scene.add(sectionMesh);
        }

        // Apply clipping plane to all materials in the scene
        scene.traverse((child: any) => {
          if (child instanceof Mesh && child.material) {
            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];
            materials.forEach((mat) => {
                if (mat) {
                    if (newClippingState) {
                        mat.clippingPlanes = [clippingPlane];
                        mat.clipShadows = true;
                    } else {
                        mat.clippingPlanes = [];
                        mat.clipShadows = false;
                    }
                    mat.needsUpdate = true;
                }
            });
          }
        });
      }
    }
  };

  // Expose functions via ref (alternative to prop drilling if needed)
  useEffect(() => {
    if (controls?.current) {
      // controls.current.zoomToFit = handleZoom; // Assign directly if needed
      // controls.current.toggleClipping = toggleClipping;
      // controls.current.reset = handleReset;
    }
  }, [controls]);

  // Expose control functions directly for the Toolbar
  // This avoids complex ref handling if the Toolbar is always present
  useEffect(() => {
    const controlsObject = controls.current as any;
    if (controlsObject) {
      controlsObject.zoomToFit = handleZoom;
      controlsObject.toggleClipping = toggleClipping;
      controlsObject.reset = handleReset;
    }
    // Cleanup function to remove methods when component unmounts
    return () => {
        if (controlsObject) {
            delete controlsObject.zoomToFit;
            delete controlsObject.toggleClipping;
            delete controlsObject.reset;
        }
    };
  }, [scene, camera, controls, clippingEnabled, sectionMaterial]); // Dependencies ensure functions update correctly

  return null; // This component doesn't render anything itself
} 