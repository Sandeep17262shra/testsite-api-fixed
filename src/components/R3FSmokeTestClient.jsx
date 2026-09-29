"use client";

import { Canvas } from "@react-three/fiber";

export default function R3FSmokeTestClient() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111318",
        color: "#f8fafc",
        display: "grid",
        gridTemplateRows: "auto 1fr",
      }}
    >
      <div style={{ padding: "16px 20px", fontFamily: "Arial, sans-serif" }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>R3F Smoke Test</h1>
        <p style={{ margin: "6px 0 0", color: "#cbd5e1" }}>
          Simple Canvas, lights, and one mesh.
        </p>
      </div>
      <Canvas camera={{ position: [3, 2, 4], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 5, 6]} intensity={1.6} />
        <mesh>
          <boxGeometry args={[1.6, 1.6, 1.6]} />
          <meshStandardMaterial color="#d8b46a" roughness={0.35} metalness={0.2} />
        </mesh>
      </Canvas>
    </main>
  );
}
