import fs from "fs";
import path from "path";

const outDir = path.resolve("public/beeds-assets/styles");
fs.mkdirSync(outDir, { recursive: true });

const cx = 32;
const cy = 32;
const rx = 26;
const ry = 22;

const beadGrad =
  '<radialGradient id="bg" cx="35%" cy="30%" r="65%"><stop offset="0%" stop-color="#f5f5f5"/><stop offset="55%" stop-color="#d2d2d2"/><stop offset="100%" stop-color="#a8a8a8"/></radialGradient>';
const spacerGrad =
  '<radialGradient id="sg" cx="35%" cy="30%" r="65%"><stop offset="0%" stop-color="#f0d4d4"/><stop offset="100%" stop-color="#c84b4b"/></radialGradient>';

function pt(t) {
  return { x: cx + rx * Math.cos(t), y: cy + ry * Math.sin(t) };
}

function bead(x, y, r, fill = "url(#bg)") {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
}

function ring() {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#1a1a1a" stroke-width="1.6" stroke-linecap="round"/>`;
}

function wrap(body, defs = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true">${defs}${body}</svg>`;
}

fs.writeFileSync(path.join(outDir, "empty.svg"), wrap(ring()));

let full = ring();
const fullCount = 36;
for (let i = 0; i < fullCount; i += 1) {
  const t = -Math.PI / 2 + (2 * Math.PI * i) / fullCount;
  const p = pt(t);
  full += bead(p.x, p.y, 2.55);
}
fs.writeFileSync(path.join(outDir, "full-bead.svg"), wrap(full, `<defs>${beadGrad}</defs>`));

let style1 = ring();
const style1Count = 14;
for (let i = 0; i < style1Count; i += 1) {
  const t = -Math.PI / 2 + (2 * Math.PI * i) / style1Count;
  const p = pt(t);
  style1 += bead(p.x, p.y, 3.1);
}
fs.writeFileSync(path.join(outDir, "style-1.svg"), wrap(style1, `<defs>${beadGrad}</defs>`));

let style2 = ring();
const groups = 8;
for (let g = 0; g < groups; g += 1) {
  for (let j = 0; j < 3; j += 1) {
    const index = g * 3 + j;
    const t = -Math.PI / 2 + (2 * Math.PI * index) / (groups * 3);
    const p = pt(t);
    if (j === 2) {
      style2 += bead(p.x, p.y, 1.5, "url(#sg)");
    } else {
      style2 += bead(p.x, p.y, 3);
    }
  }
}
fs.writeFileSync(
  path.join(outDir, "style-2.svg"),
  wrap(style2, `<defs>${beadGrad}${spacerGrad}</defs>`)
);

console.log("Created:", fs.readdirSync(outDir).join(", "));
