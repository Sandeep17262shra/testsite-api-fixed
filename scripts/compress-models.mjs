/**
 * Draco-compress the configurator's GLB models and regenerate their `.enc`
 * counterparts.
 *
 * The models shipped as raw float32 POSITION + NORMAL with uint32 indices and
 * no compression extension at all, which is why a single head could be 4-7 MB.
 * Every GLB in the app is already parsed through a GLTFLoader with a DRACO
 * decoder attached (see utility/gltfParser.js), so compressing them needs no
 * runtime change — only smaller bytes on the wire.
 *
 * Originals are MOVED to ./model-sources/<same relative path> before the
 * compressed file is written, so nothing is destroyed and the script can be
 * re-run against the pristine source at any time.
 *
 * Build-time tooling only — nothing here ships to the browser, so its
 * dependencies are deliberately NOT kept in package.json. Install them when you
 * need to process a new batch of models, then remove them again:
 *
 *   npm i --no-save @gltf-transform/core @gltf-transform/extensions \
 *                   @gltf-transform/functions draco3dgltf
 *   node scripts/compress-models.mjs [--dry]
 *
 * Re-running is safe: files already Draco-compressed are left alone and only
 * get a missing `.enc` written. Originals are recoverable from git history.
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, draco } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const BACKUP_DIR = path.join(ROOT, 'model-sources');
const DRY = process.argv.includes('--dry');

// Must match SECRET_KEY in src/lib/ring-configurator/utility/modelLoader.js
const SECRET_KEY = 'r!ng$3cur3K3y#2024XoR';

const TARGET_DIRS = [
  '3d-models/RING-HEAD',
  '3d-models/RING-SHANK',
  '3d-models/SIDE-RING-SETTING',
  '3d-models/WEDDING-BANDS',
  '3d-models/DIAMONDWISE',
  'all_diamonds',
];

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'draco3d.encoder': await draco3d.createEncoderModule(),
  });

function xorEncrypt(buffer) {
  const key = Buffer.from(SECRET_KEY, 'utf8');
  const out = Buffer.allocUnsafe(buffer.length);
  for (let i = 0; i < buffer.length; i += 1) out[i] = buffer[i] ^ key[i % key.length];
  return out;
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.glb')) acc.push(full);
  }
  return acc;
}

const files = TARGET_DIRS.flatMap((rel) => {
  const dir = path.join(PUBLIC_DIR, rel);
  return fs.existsSync(dir) ? walk(dir) : [];
}).sort();

let totalBefore = 0;
let totalAfter = 0;
let skipped = 0;
let failed = 0;

console.log(`${files.length} GLB files\n`);

for (const file of files) {
  const rel = path.relative(PUBLIC_DIR, file);
  const before = fs.statSync(file).size;
  try {
    const doc = await io.read(file);
    const already = doc.getRoot()
      .listExtensionsUsed()
      .some((ext) => ext.extensionName === 'KHR_draco_mesh_compression');
    if (already) {
      // Nothing to compress, but every model must still have an `.enc`: the
      // configurator fetches only `.enc`, so a GLB without one would have to be
      // served raw and unprotected.
      const encPath = file.replace(/\.glb$/i, '.enc');
      if (!DRY && !fs.existsSync(encPath)) {
        fs.writeFileSync(encPath, xorEncrypt(fs.readFileSync(file)));
        console.log(`enc    ${rel} (already Draco, wrote .enc)`);
      } else {
        console.log(`skip   ${rel} (already Draco)`);
      }
      skipped += 1;
      continue;
    }

    const namesBefore = doc.getRoot().listNodes().map((n) => n.getName()).join('|');
    await doc.transform(
      weld(),
      draco({ method: 'edgebreaker', quantizePosition: 14, quantizeNormal: 10 })
    );
    const namesAfter = doc.getRoot().listNodes().map((n) => n.getName()).join('|');
    if (namesBefore !== namesAfter) {
      throw new Error('node names changed - refusing to write (mesh names drive material selection)');
    }

    const out = Buffer.from(await io.writeBinary(doc));
    totalBefore += before;
    totalAfter += out.length;

    if (!DRY) {
      const backup = path.join(BACKUP_DIR, rel);
      fs.mkdirSync(path.dirname(backup), { recursive: true });
      if (!fs.existsSync(backup)) fs.renameSync(file, backup);
      fs.writeFileSync(file, out);
      fs.writeFileSync(file.replace(/\.glb$/i, '.enc'), xorEncrypt(out));
    }

    console.log(
      `ok     ${rel}  ${(before / 1e6).toFixed(2)}MB -> ${(out.length / 1e6).toFixed(2)}MB` +
      `  (${(before / out.length).toFixed(1)}x)`
    );
  } catch (error) {
    failed += 1;
    console.error(`FAIL   ${rel}: ${error.message}`);
  }
}

console.log(
  `\n${(totalBefore / 1e6).toFixed(1)}MB -> ${(totalAfter / 1e6).toFixed(1)}MB` +
  `  (${totalBefore ? (totalBefore / totalAfter).toFixed(1) : 0}x)` +
  `  skipped=${skipped} failed=${failed}${DRY ? '  [dry run]' : ''}`
);
