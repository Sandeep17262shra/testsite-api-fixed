"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";

const ALPHA_THRESHOLD = 30;
const MARCH_STEP = 3;
const MIN_HOLE_AREA = 400;

function removeSolidBackground(ctx, w, h) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  const px = (x, y) => {
    const i = (y * w + x) * 4;
    return [d[i], d[i + 1], d[i + 2], d[i + 3]];
  };
  const corners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]].map(([x, y]) => px(x, y));
  if (corners.some((c) => c[3] < 200)) return false;
  const [r0, g0, b0] = corners[0];
  const tol = 20;
  if (!corners.every(([r, g, b]) => Math.abs(r - r0) <= tol && Math.abs(g - g0) <= tol && Math.abs(b - b0) <= tol)) {
    return false;
  }
  const visited = new Uint8Array(w * h);
  const stack = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const idx = y * w + x;
    if (visited[idx]) continue;
    visited[idx] = 1;
    const i = idx * 4;
    if (d[i + 3] < 150 || Math.abs(d[i] - r0) > tol || Math.abs(d[i + 1] - g0) > tol || Math.abs(d[i + 2] - b0) > tol) {
      continue;
    }
    d[i + 3] = 0;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  ctx.putImageData(imageData, 0, 0);
  return true;
}

function getOpaqueBBox(data, width, height) {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = false;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }
  return found ? { minX, minY, maxX, maxY } : null;
}

function buildMask(data, width, height) {
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i += 1) {
    mask[i] = data[i * 4 + 3] > ALPHA_THRESHOLD ? 1 : 0;
  }
  return mask;
}

function floodFillRegions(mask, width, height) {
  const visited = new Int32Array(width * height).fill(-1);
  const regions = [];
  let id = 0;
  for (let sy = 0; sy < height; sy += 1) {
    for (let sx = 0; sx < width; sx += 1) {
      const si = sy * width + sx;
      if (mask[si] !== 1 || visited[si] !== -1) continue;
      const pixels = [];
      const queue = [si];
      visited[si] = id;
      while (queue.length) {
        const idx = queue.pop();
        pixels.push(idx);
        const x = idx % width;
        const y = (idx / width) | 0;
        for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const ni = ny * width + nx;
          if (mask[ni] === 1 && visited[ni] === -1) {
            visited[ni] = id;
            queue.push(ni);
          }
        }
      }
      regions.push({ id, pixels });
      id += 1;
    }
  }
  return regions;
}

function traceBoundary(pixels, width, height) {
  if (!pixels.length) return [];
  const set = new Set(pixels);
  let start = pixels[0];
  for (const p of pixels) {
    if (p < start) start = p;
  }
  const startX = start % width;
  const startY = (start / width) | 0;
  const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const boundary = [];
  let cx = startX;
  let cy = startY;
  let prevDir = 6;
  const maxSteps = pixels.length * 4 + 10;
  let steps = 0;
  do {
    boundary.push({ x: cx, y: cy });
    let found = false;
    for (let d = 0; d < 8; d += 1) {
      const tryDir = (prevDir + 6 + d) % 8;
      const [dx, dy] = dirs[tryDir];
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx >= 0 && ny >= 0 && nx < width && ny < height && set.has(ny * width + nx)) {
        cx = nx;
        cy = ny;
        prevDir = tryDir;
        found = true;
        break;
      }
    }
    if (!found) break;
    steps += 1;
  } while ((cx !== startX || cy !== startY || boundary.length < 3) && steps < maxSteps);
  const simplified = [];
  for (let i = 0; i < boundary.length; i += MARCH_STEP) simplified.push(boundary[i]);
  return simplified.length >= 3 ? simplified : boundary.filter((_, i) => i % MARCH_STEP === 0);
}

function markBackgroundFromBorder(mask, width, height) {
  const bg = new Uint8Array(width * height);
  const stack = [];
  for (let x = 0; x < width; x += 1) {
    if (!mask[x]) {
      bg[x] = 1;
      stack.push(x);
    }
    const bot = (height - 1) * width + x;
    if (!mask[bot]) {
      bg[bot] = 1;
      stack.push(bot);
    }
  }
  for (let y = 0; y < height; y += 1) {
    const left = y * width;
    const right = y * width + width - 1;
    if (!mask[left]) {
      bg[left] = 1;
      stack.push(left);
    }
    if (!mask[right]) {
      bg[right] = 1;
      stack.push(right);
    }
  }
  while (stack.length) {
    const idx = stack.pop();
    const x = idx % width;
    const y = (idx / width) | 0;
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const ni = ny * width + nx;
      if (!mask[ni] && !bg[ni]) {
        bg[ni] = 1;
        stack.push(ni);
      }
    }
  }
  return bg;
}

function extractContours(imageData) {
  const { data, width, height } = imageData;
  const mask = buildMask(data, width, height);
  const opaqueRegions = floodFillRegions(mask, width, height);
  opaqueRegions.sort((a, b) => b.pixels.length - a.pixels.length);
  const outerRegion = opaqueRegions[0];
  if (!outerRegion) return { outer: null, holes: [] };
  const outerPts = traceBoundary(outerRegion.pixels, width, height);
  const bg = markBackgroundFromBorder(mask, width, height);
  const holeMask = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i += 1) {
    if (!mask[i] && !bg[i]) holeMask[i] = 1;
  }
  const holeRegions = floodFillRegions(holeMask, width, height);
  const holes = [];
  for (const hr of holeRegions) {
    if (hr.pixels.length < MIN_HOLE_AREA) continue;
    const pts = traceBoundary(hr.pixels, width, height);
    if (pts.length >= 3) holes.push(pts);
  }
  return { outer: outerPts, holes };
}

function pxToWorld(pts, texW, texH, W, H) {
  return pts.map(({ x, y }) => ({
    wx: (x / texW - 0.5) * W,
    wy: (0.5 - y / texH) * H,
  }));
}

function centroid(worldPts) {
  const n = worldPts.length;
  let cx = 0;
  let cy = 0;
  for (const { wx, wy } of worldPts) {
    cx += wx;
    cy += wy;
  }
  return { cx: cx / n, cy: cy / n };
}

function makeBodyGeo(outerWorld, holesWorld, offsetX, offsetY, charmDepth) {
  const shape = new THREE.Shape();
  outerWorld.forEach(({ wx, wy }, i) => {
    const x = wx - offsetX;
    const y = wy - offsetY;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  for (const holePts of holesWorld) {
    const path = new THREE.Path();
    holePts.forEach(({ wx, wy }, i) => {
      const x = wx - offsetX;
      const y = wy - offsetY;
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    });
    path.closePath();
    shape.holes.push(path);
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: charmDepth,
    bevelEnabled: false,
    curveSegments: 12,
    steps: 1,
  });
  geo.translate(0, 0, -charmDepth / 2);
  return geo;
}

/**
 * Build extruded charm meshes from a PNG (same approach as bracelet ThickImageCharm).
 */
export function useThickCharmAssets(imagePath, charmHeight, charmDepth, bodyColor = "#c4c4c4") {
  const [assets, setAssets] = useState(null);

  useEffect(() => {
    if (!imagePath) {
      setAssets(null);
      return undefined;
    }

    let alive = true;
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (!alive) return;
      const full = document.createElement("canvas");
      full.width = img.naturalWidth || img.width;
      full.height = img.naturalHeight || img.height;
      const fullCtx = full.getContext("2d");
      fullCtx.drawImage(img, 0, 0);
      try {
        removeSolidBackground(fullCtx, full.width, full.height);
      } catch {
        /* optional */
      }

      let texCanvas = full;
      let texW = full.width;
      let texH = full.height;
      try {
        const fullData = fullCtx.getImageData(0, 0, full.width, full.height);
        const bbox = getOpaqueBBox(fullData.data, full.width, full.height);
        if (bbox) {
          const cw = bbox.maxX - bbox.minX + 1;
          const ch = bbox.maxY - bbox.minY + 1;
          const c = document.createElement("canvas");
          c.width = cw;
          c.height = ch;
          c.getContext("2d").drawImage(full, bbox.minX, bbox.minY, cw, ch, 0, 0, cw, ch);
          texCanvas = c;
          texW = cw;
          texH = ch;
        }
      } catch {
        /* use full canvas */
      }

      const aspect = texW / texH;
      const H = charmHeight;
      const W = H * aspect;

      let outerWorld = [
        { wx: -W / 2, wy: -H / 2 },
        { wx: W / 2, wy: -H / 2 },
        { wx: W / 2, wy: H / 2 },
        { wx: -W / 2, wy: H / 2 },
      ];
      let holesWorld = [];
      try {
        const croppedData = texCanvas.getContext("2d").getImageData(0, 0, texW, texH);
        const { outer, holes } = extractContours(croppedData);
        if (outer && outer.length >= 3) {
          outerWorld = pxToWorld(outer, texW, texH, W, H);
          holesWorld = holes.map((h) => pxToWorld(h, texW, texH, W, H));
        }
      } catch {
        /* rectangular fallback */
      }

      const { cx: offX, cy: offY } = centroid(outerWorld);

      let bodyGeo;
      try {
        bodyGeo = makeBodyGeo(outerWorld, holesWorld, offX, offY, charmDepth);
      } catch {
        bodyGeo = new THREE.BoxGeometry(W, H, charmDepth);
      }

      const bodyMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(bodyColor),
        metalness: 0.35,
        roughness: 0.45,
        envMapIntensity: 0.9,
        side: THREE.DoubleSide,
      });

      const faceTex = new THREE.CanvasTexture(texCanvas);
      faceTex.colorSpace = THREE.SRGBColorSpace;
      faceTex.flipY = true;
      faceTex.needsUpdate = true;

      const backFaceTex = new THREE.CanvasTexture(texCanvas);
      backFaceTex.colorSpace = THREE.SRGBColorSpace;
      backFaceTex.flipY = true;
      backFaceTex.repeat.set(-1, 1);
      backFaceTex.offset.set(1, 0);
      backFaceTex.needsUpdate = true;

      const faceMat = new THREE.MeshBasicMaterial({
        map: faceTex,
        transparent: true,
        alphaTest: 0.05,
        side: THREE.FrontSide,
        depthWrite: true,
        toneMapped: false,
      });

      const backFaceMat = new THREE.MeshBasicMaterial({
        map: backFaceTex,
        transparent: true,
        alphaTest: 0.05,
        side: THREE.FrontSide,
        depthWrite: true,
        toneMapped: false,
      });

      setAssets({ bodyGeo, bodyMat, faceMat, backFaceMat, faceTex, backFaceTex, W, H, offX, offY });
    };

    img.onerror = () => {
      if (alive) setAssets(null);
    };
    img.src = imagePath;

    return () => {
      alive = false;
      setAssets((prev) => {
        if (prev) {
          prev.bodyGeo?.dispose();
          prev.bodyMat?.dispose();
          prev.faceTex?.dispose();
          prev.faceMat?.dispose();
          prev.backFaceTex?.dispose();
          prev.backFaceMat?.dispose();
        }
        return null;
      });
    };
  }, [imagePath, charmHeight, charmDepth, bodyColor]);

  return assets;
}

/** Depth relative to pendant height — matches bracelet charm proportions at bead scale. */
export function resolveBeadsCharmExtrudeDepth(charmHeight) {
  return Math.max(charmHeight * 0.075, 0.0032);
}
