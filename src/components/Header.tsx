import { useRef, useLayoutEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Mesh, Vector2, DoubleSide } from "three";

// Renders the logo image on a Plane mesh and rotates it around the X-axis
function ImageLogo() {
  const meshRef = useRef<Mesh>(null!);
  const texture = useTexture("/Sagerei.png", (loadedTexture) => {
    // Set center for rotation once texture is loaded
    loadedTexture.center = new Vector2(0.5, 0.5);
  });

  useLayoutEffect(() => {
    // Set mesh scale based on texture aspect ratio once loaded
    if (texture.image && meshRef.current) {
      const aspect = texture.image.naturalWidth / texture.image.naturalHeight;
      const desiredHeight = 4.0; // Keep larger height
      const scaleWidth = desiredHeight * aspect;
      meshRef.current.scale.set(scaleWidth, desiredHeight, 1);
    }
  }, [texture]);

  useFrame((_state, delta) => {
    // Rotate the mesh around the X-axis with a slight Y-axis wobble
    if (meshRef.current) {
      // Main rotation around X-axis
      meshRef.current.rotation.x -= delta * 0.5;
      
      // Add a slight wobble around Y-axis using a sine wave
      meshRef.current.rotation.y = Math.sin(_state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    // Use a Mesh with PlaneGeometry instead of Sprite
    <mesh ref={meshRef}>
      {/* PlaneGeometry args are width, height. We use 1,1 and scale the mesh */} 
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        map={texture} 
        transparent={true} 
        side={DoubleSide} // Render both sides
      />
    </mesh>
  );
}

export function Header() {
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
        padding: "0 24px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      {/* Container for the logo */}
      <div 
        style={{
            width: "120px", // Keep container size
            height: "70px",
            marginRight: "32px",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}
      >
        <Canvas 
            camera={{ position: [0, 0, 3], fov: 50 }} // Keep camera setup
            style={{ width: '100%', height: '100%' }}
            gl={{ antialias: true, alpha: true }} // Keep alpha for transparency
        >
             <ambientLight intensity={0.9} /> {/* Slightly brighter */} 
             {/* <pointLight position={[5, 5, 5]} intensity={0.3} /> */}{/* Less intense point light maybe not needed */} 
            <ImageLogo /> {/* Use the updated ImageLogo component */} 
        </Canvas>
      </div>
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