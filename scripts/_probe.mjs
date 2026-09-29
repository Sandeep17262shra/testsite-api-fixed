import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { weld, draco } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import fs from 'node:fs';

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'draco3d.decoder': await draco3d.createDecoderModule(),
    'draco3d.encoder': await draco3d.createEncoderModule(),
  });

const src = process.argv[2];
const doc = await io.read(src);
const before = fs.statSync(src).size;
const names = doc.getRoot().listMeshes().map((m) => m.getName());
await doc.transform(weld(), draco({ method: 'edgebreaker', quantizePosition: 14, quantizeNormal: 10 }));
const out = await io.writeBinary(doc);
const names2 = doc.getRoot().listMeshes().map((m) => m.getName());
console.log(src);
console.log('  size', (before/1e6).toFixed(2)+'MB ->', (out.byteLength/1e6).toFixed(2)+'MB', '(' + (before/out.byteLength).toFixed(1) + 'x)');
console.log('  meshes before:', JSON.stringify(names));
console.log('  meshes after :', JSON.stringify(names2));
