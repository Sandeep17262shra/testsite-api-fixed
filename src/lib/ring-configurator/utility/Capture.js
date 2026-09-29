/* eslint-disable react/prop-types */
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useEffect } from 'react';

export function Capture({ targetGroup }) {
  const { gl, scene, camera, size } = useThree();

  useEffect(() => {
    if (!targetGroup.current) return;

    // 📦 Bounding box and fitting
    const bbox = new THREE.Box3().setFromObject(targetGroup.current);
    const center = bbox.getCenter(new THREE.Vector3());
    const sizeBox = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(sizeBox.x, sizeBox.y, sizeBox.z);

    const fov = camera.fov * (Math.PI / 180);
    const fitDistance = maxDim / (2 * Math.tan(fov / 2));
    const distance = 1.5 * fitDistance;

    // Views: Top (Y+), Side (X+), Front (Z+)
    const views = [
      { name: 'top', position: new THREE.Vector3(center.x, center.y + distance, center.z), lookAt: center },
      { name: 'side', position: new THREE.Vector3(center.x + distance, center.y, center.z), lookAt: center },
      { name: 'front', position: new THREE.Vector3(center.x, center.y, center.z + distance), lookAt: center }
    ];

    // Use SQUARE dimensions for all views
    const viewSize = 500;

    const captureView = (view) => {
      const reflector = scene.getObjectByName('reflector');
      const originalReflectorVisible = reflector?.visible;
      if (reflector) reflector.visible = false;

      const originalBackground = scene.background;
      const originalEnvironment = scene.environment;
      const originalClearColor = gl.getClearColor(new THREE.Color());
      const originalClearAlpha = gl.getClearAlpha();

      scene.background = new THREE.Color('#ffffff');
      scene.environment = null;

      // Save original camera settings
      const originalCameraAspect = camera.aspect;
      
      // Set camera to SQUARE aspect ratio
      camera.aspect = 1;
      camera.position.copy(view.position);
      camera.lookAt(view.lookAt);
      camera.updateProjectionMatrix();

      targetGroup.current.traverse(child => child.layers.set(1));
      const previousMask = camera.layers.mask;
      camera.layers.set(1);

      // Use SQUARE render target
      const renderTarget = new THREE.WebGLRenderTarget(viewSize, viewSize, {
        format: THREE.RGBAFormat,
        stencilBuffer: false,
        depthBuffer: true,
        samples: gl.capabilities.maxSamples,
      });

      const previousRenderTarget = gl.getRenderTarget();
      gl.setRenderTarget(renderTarget);
      gl.setClearColor('#ffffff', 1);
      gl.clear();
      gl.render(scene, camera);
      gl.setRenderTarget(previousRenderTarget);

      const pixelBuffer = new Uint8Array(viewSize * viewSize * 4);
      gl.readRenderTargetPixels(renderTarget, 0, 0, viewSize, viewSize, pixelBuffer);

      // Flip image vertically
      const rowSize = viewSize * 4;
      const flippedBuffer = new Uint8ClampedArray(pixelBuffer.length);
      for (let y = 0; y < viewSize; y++) {
        const src = y * rowSize;
        const dest = (viewSize - 1 - y) * rowSize;
        for (let i = 0; i < rowSize; i++) {
          flippedBuffer[dest + i] = pixelBuffer[src + i];
        }
      }

      // Convert from linear to sRGB color space (gamma correction)
      const gamma = 2.2;
      for (let i = 0; i < flippedBuffer.length; i += 4) {
        flippedBuffer[i] = Math.min(255, 255 * Math.pow(flippedBuffer[i] / 255, 1 / gamma));
        flippedBuffer[i + 1] = Math.min(255, 255 * Math.pow(flippedBuffer[i + 1] / 255, 1 / gamma));
        flippedBuffer[i + 2] = Math.min(255, 255 * Math.pow(flippedBuffer[i + 2] / 255, 1 / gamma));
      }

      // Create canvas from buffer
      const canvas = document.createElement('canvas');
      canvas.width = viewSize;
      canvas.height = viewSize;
      const ctx = canvas.getContext('2d');
      const imageData = new ImageData(flippedBuffer, viewSize, viewSize);
      ctx.putImageData(imageData, 0, 0);

      // Cleanup and restore
      renderTarget.dispose();
      camera.layers.mask = previousMask;
      targetGroup.current.traverse(child => child.layers.set(0));
      
      // Restore camera aspect ratio
      camera.aspect = originalCameraAspect;
      camera.updateProjectionMatrix();

      scene.background = originalBackground;
      scene.environment = originalEnvironment;
      gl.setClearColor(originalClearColor, originalClearAlpha);
      if (reflector) reflector.visible = originalReflectorVisible;

      return canvas;
    };

    // ⏺ Capture all views
    const [topCanvas, sideCanvas, frontCanvas] = views.map(captureView);

    // 🧩 Final canvas setup (T-shape with spacing)
    const spacing = 1;
    const topOffset = 20;
    const bottomMargin = 40;

    const finalCanvas = document.createElement('canvas');
    // Calculate dimensions based on SQUARE viewSize
    finalCanvas.width = viewSize * 2 + spacing;
    finalCanvas.height = viewSize * 2 + spacing + bottomMargin;
    const finalCtx = finalCanvas.getContext('2d');

    // Fill background
    finalCtx.fillStyle = '#ffffff';
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    // Position views (top centered, side & front below)
    const topX = (finalCanvas.width - viewSize) / 2;
    const topY = topOffset;

    const sideX = 0;
    const sideY = viewSize + spacing;

    const frontX = viewSize + spacing;
    const frontY = viewSize + spacing;

    finalCtx.drawImage(topCanvas, topX, topY);
    finalCtx.drawImage(sideCanvas, sideX, sideY);
    finalCtx.drawImage(frontCanvas, frontX, frontY);

    // ✍️ Add watermark at bottom-right
    const watermarkText = '© POWERED BY KEYIDEAS';
    finalCtx.fillStyle = '#999';
    finalCtx.font = '20px sans-serif';
    const textWidth = finalCtx.measureText(watermarkText).width;
    finalCtx.fillText(watermarkText, finalCanvas.width - textWidth - 20, finalCanvas.height - 10);

    // 💾 Trigger download
    finalCanvas.toBlob(blob => {
      const link = document.createElement('a');
      link.download = `tshape-views-${Date.now()}.png`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/png');

  }, [gl, scene, camera, size, targetGroup]);

  return null;
}