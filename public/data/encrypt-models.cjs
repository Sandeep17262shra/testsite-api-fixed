const fs = require('fs');
const path = require('path');
const SECRET_KEY = 'r!ng$3cur3K3y#2024XoR';
function xorEncrypt(buffer, key) {
  const keyBytes = Buffer.from(key, 'utf8');
  const result = Buffer.alloc(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    result[i] = buffer[i] ^ keyBytes[i % keyBytes.length];
  }
  return result;
}
const models = [
  // Diamonds
  'public/all_diamonds/round.glb',
];
let success = 0;
let failed = 0;
let skipped = 0;
for (const modelPath of models) {
  const fullPath = path.resolve(__dirname, '..', '..', modelPath); // <-- fixed line
  const encPath = fullPath.replace(/\.(glb|obj)$/, '.enc');
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  Not found: ${modelPath}`);
    failed++;
    continue;
  }
  if (fs.existsSync(encPath)) {
    console.log(`⏭️  Already exists: ${path.basename(encPath)}`);
    skipped++;
    continue;
  }
  const buffer = fs.readFileSync(fullPath);
  const encrypted = xorEncrypt(buffer, SECRET_KEY);
  fs.writeFileSync(encPath, encrypted);
  console.log(`✅ Encrypted: ${path.basename(modelPath)}`);
  success++;
}
console.log(`\nDone: ${success} encrypted, ${skipped} skipped, ${failed} not found`);