/* eslint-disable react/prop-types */
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * A React Three Fiber component to capture a screenshot of a specific 3D object (targetGroup).
 * It isolates the object, renders it with a transparent background, crops it tightly,
 * and initiates a download of the resulting PNG image.
 *
 * @param {{ targetGroup: React.RefObject<THREE.Group> }} props
 */
export function Capture({ targetGroup }) {
  // Access the core R3F elements: WebGL renderer, scene, camera, and canvas size
  const { gl, scene, camera, size } = useThree();


  // Ensure the target group ref is valid
  if (!targetGroup.current) {
    console.error("Capture target group is not set.");
    return;
  }

  // --- ISOLATION & SETUP ---

  // Store the original properties that we'll be changing temporarily
  const originalBackground = scene.background;
  const previousCameraMask = camera.layers.mask;

  // --- FIX: HANDLE LIGHTS ---
  // This is the key fix. If we only render the object on layer 1, we also need
  // to render the lights on layer 1. Otherwise, the object will be black.
  const lightsToRestore = [];
  scene.traverse((node) => {
    // Find all light sources in the scene
    if (node.isLight) {
      // Store the light and its original layer mask so we can restore it later
      lightsToRestore.push({ light: node, originalMask: node.layers.mask });
      // Set the light to be on layer 1 for the capture render.
      // Using .set() ensures it's *only* on layer 1.
      node.layers.set(1);
    }
  });

  // Move the target object and all its children to layer 1
  targetGroup.current.traverse(child => child.layers.set(1));

  // Configure the camera to only render objects on layer 1
  camera.layers.set(1);

  // Set a transparent background for the capture
  scene.background = null;

  // --- RENDER TO TEXTURE ---

  // Use device pixel ratio for a higher resolution capture (supersampling)
  const dpr = gl.getPixelRatio();
  const width = Math.floor(size.width * dpr);
  const height = Math.floor(size.height * dpr);

  // Create a WebGLRenderTarget to render the scene to an off-screen buffer.
  // This allows us to capture the image without affecting the main view.
  const renderTarget = new THREE.WebGLRenderTarget(width, height, {
    format: THREE.RGBAFormat, // Use RGBA for transparency
    stencilBuffer: false,
    depthBuffer: true,
    // Use multisampling for anti-aliasing if the hardware supports it
    samples: gl.capabilities.maxSamples
  });

  // Temporarily switch the renderer's output to our off-screen render target
  const previousRenderTarget = gl.getRenderTarget();
  gl.setRenderTarget(renderTarget);
  gl.clear(); // Clear the render target to be transparent
  gl.render(scene, camera); // Render the isolated object (and lights) to the target

  // --- CROPPING LOGIC ---

  // Calculate the 3D bounding box of the target group to find its extent
  const bbox = new THREE.Box3().setFromObject(targetGroup.current);
  if (bbox.isEmpty()) {
    console.error("Could not compute bounding box of the target. Is it empty?");
    // Restore scene state before returning
    gl.setRenderTarget(previousRenderTarget);
    scene.background = originalBackground;
    camera.layers.mask = previousCameraMask;
    targetGroup.current.traverse(child => child.layers.set(0));
    lightsToRestore.forEach(({ light, originalMask }) => light.layers.mask = originalMask);
    renderTarget.dispose();
    return;
  }

  // Project the 8 corners of the 3D bounding box into 2D screen coordinates
  const vertices = [
    new THREE.Vector3(bbox.min.x, bbox.min.y, bbox.min.z),
    new THREE.Vector3(bbox.min.x, bbox.min.y, bbox.max.z),
    new THREE.Vector3(bbox.min.x, bbox.max.y, bbox.min.z),
    new THREE.Vector3(bbox.min.x, bbox.max.y, bbox.max.z),
    new THREE.Vector3(bbox.max.x, bbox.min.y, bbox.min.z),
    new THREE.Vector3(bbox.max.x, bbox.min.y, bbox.max.z),
    new THREE.Vector3(bbox.max.x, bbox.max.y, bbox.min.z),
    new THREE.Vector3(bbox.max.x, bbox.max.y, bbox.max.z)
  ];

  // Find the min/max screen coordinates to define the 2D crop area
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  vertices.forEach(v => {
    const vec = v.clone().project(camera);
    // Convert from normalized device coordinates (-1 to +1) to pixel coordinates (0 to width/height)
    const x = (vec.x + 1) / 2 * width;
    const y = (vec.y + 1) / 2 * height;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  });

  // Clamp coordinates to be within the canvas bounds and calculate crop dimensions
  minX = Math.floor(Math.max(minX, 0));
  minY = Math.floor(Math.max(minY, 0));
  const regionWidth = Math.floor(Math.min(maxX - minX, width - minX));
  const regionHeight = Math.floor(Math.min(maxY - minY, height - minY));

  if (regionWidth <= 0 || regionHeight <= 0) {
    console.error("Cropped region has zero or negative size. The object may be off-screen.");
    // Restore scene state before returning
    gl.setRenderTarget(previousRenderTarget);
    scene.background = originalBackground;
    camera.layers.mask = previousCameraMask;
    targetGroup.current.traverse(child => child.layers.set(0));
    lightsToRestore.forEach(({ light, originalMask }) => light.layers.mask = originalMask);
    renderTarget.dispose();
    return;
  }

  // --- PIXEL PROCESSING & DOWNLOAD ---

  // Create a buffer to hold the pixel data from the cropped region
  const pixelBuffer = new Uint8Array(regionWidth * regionHeight * 4);
  // Read the pixels from the render target into our buffer
  gl.readRenderTargetPixels(renderTarget, minX, minY, regionWidth, regionHeight, pixelBuffer);

  // The data read from WebGL is upside down, so we need to flip it vertically.
  const rowSize = regionWidth * 4;
  const flippedBuffer = new Uint8ClampedArray(pixelBuffer.length);
  for (let y = 0; y < regionHeight; y++) {
    const srcIndex = y * rowSize;
    const destIndex = (regionHeight - 1 - y) * rowSize;
    flippedBuffer.set(pixelBuffer.subarray(srcIndex, srcIndex + rowSize), destIndex);
  }

  // Apply gamma correction. This is necessary because we are reading from a render
  // target in linear color space, but the image file should be in sRGB.
  const gamma = 2.2;
  for (let i = 0; i < flippedBuffer.length; i += 4) {
    // Apply gamma correction to R, G, B channels. Alpha (i+3) is unchanged.
    flippedBuffer[i] = Math.pow(flippedBuffer[i] / 255, 1 / gamma) * 255;
    flippedBuffer[i + 1] = Math.pow(flippedBuffer[i + 1] / 255, 1 / gamma) * 255;
    flippedBuffer[i + 2] = Math.pow(flippedBuffer[i + 2] / 255, 1 / gamma) * 255;
  }

  // Create a 2D canvas to draw the final image
  const canvas = document.createElement('canvas');
  canvas.width = regionWidth;
  canvas.height = regionHeight;
  const ctx = canvas.getContext('2d');
  const imageData = new ImageData(flippedBuffer, regionWidth, regionHeight);
  ctx.putImageData(imageData, 0, 0);

  // Convert canvas to a Blob and trigger download
  canvas.toBlob((blob) => {
    const link = document.createElement('a');
    link.download = `capture-${Date.now()}.png`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href); // Clean up the object URL
  }, 'image/png');

  // --- CLEANUP ---

  // Dispose of the render target to free up GPU memory
  renderTarget.dispose();

  // Restore the renderer to its original state (drawing to the screen)
  gl.setRenderTarget(previousRenderTarget);

  // Restore the original scene background and camera layer mask
  scene.background = originalBackground;
  camera.layers.mask = previousCameraMask;

  // Restore the target group's children to their original layer (0)
  targetGroup.current.traverse(child => child.layers.set(0));

  // --- FIX: Restore original light layers ---
  lightsToRestore.forEach(({ light, originalMask }) => {
    light.layers.mask = originalMask;
  });

  // It's good practice to request a new frame to ensure the main scene
  // immediately reflects the restored state.
  gl.render(scene, camera);


  // This component does not render anything itself, it only provides the capture utility.
  return null;
}
