import { useTexture } from "@react-three/drei";

interface SphericalBackgroundProps {
  url: string;
  visible: boolean;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

export function SphericalBackground({
  url,
  visible,
  position,
  rotation,
  scale,
}: SphericalBackgroundProps) {
  const texture = useTexture(url);

  if (!visible) return null;

  return (
    <mesh position={position} rotation={rotation}>
      <sphereGeometry args={[50 * scale, 64, 64]} />
      <meshBasicMaterial map={texture} side={2} transparent opacity={0.9} />
    </mesh>
  );
} 