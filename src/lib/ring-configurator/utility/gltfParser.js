import { GLTFLoader, DRACOLoader } from "three-stdlib";

// The DiamondWise GLBs are DRACO-compressed, so every GLB in the configurator
// is parsed through one shared loader that has a DRACO decoder attached — the
// same decoder build drei's `useGLTF` uses. One instance means the decoder
// worker is created (and warmed) once for the whole session.
const DRACO_DECODER_PATH = "/draco/gltf/";

let gltfLoader = null;

function getGLTFLoader() {
  if (!gltfLoader) {
    gltfLoader = new GLTFLoader();
    if (typeof window !== "undefined") {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
      gltfLoader.setDRACOLoader(dracoLoader);
    }
  }
  return gltfLoader;
}

export function parseGLTF(buffer) {
  return new Promise((resolve, reject) => {
    getGLTFLoader().parse(buffer, "", resolve, reject);
  });
}
