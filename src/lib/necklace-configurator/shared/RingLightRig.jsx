/* eslint-disable react/no-unknown-property */
// ─── Ring-matched light rig ─────────────────────────────────────────────────
// The ring configurator's lights (ring-configurator/Scene.jsx), light for
// light: a soft ambient fill, one strong top-down key that casts the shadows,
// and a gentle front fill. Metal reflections themselves come from the
// environment map (see metalMaterial.js), not from these lights.
const RingLightRig = () => (
  <>
    <ambientLight intensity={0.3} color="#e2e2e2" />
    <directionalLight
      position={[0, 20, 0]}
      intensity={15}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-near={1}
      shadow-camera-far={40}
      shadow-camera-left={-8}
      shadow-camera-right={8}
      shadow-camera-top={8}
      shadow-camera-bottom={-8}
      shadow-bias={-0.0001}
    />
    <directionalLight position={[0, 5, 10]} intensity={1} color="#ffffff" />
    <directionalLight position={[0, 5, -10]} intensity={1} color="#ffffff" />
  </>
);

export default RingLightRig;
