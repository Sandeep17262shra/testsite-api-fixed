"use client";

import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";

const MODEL_PATH = "/3d-models/RING-SHANK/PLAIN.glb";

function RingModel() {
  const groupRef = useRef(null);
  const { scene } = useGLTF(MODEL_PATH);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.35;
  });

  return (
    <group ref={groupRef} scale={0.45} rotation={[0.2, 0, 0]} data-testid="r3f-model-smoke-ring">
      <primitive object={scene} />
    </group>
  );
}

export default function R3FModelSmokeTestClient() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#101114",
        color: "#f8fafc",
        display: "grid",
        gridTemplateRows: "auto 1fr",
      }}
    >
      <div style={{ padding: "16px 20px", fontFamily: "Arial, sans-serif" }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>R3F Model Smoke Test</h1>
        <p style={{ margin: "6px 0 0", color: "#cbd5e1" }}>
          Loading {MODEL_PATH}
        </p>
      </div>
      <Canvas camera={{ position: [0, 1.2, 4], fov: 35 }}>
        <color attach="background" args={["#181a20"]} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 4]} intensity={2} />
        <Suspense fallback={null}>
          <RingModel />
        </Suspense>
        <OrbitControls enableDamping />
      </Canvas>
    </main>
  );
}

useGLTF.preload(MODEL_PATH);
