# DiamondWise model integration

## Scope

This document records the first-pass integration of two client-provided DiamondWise complete ring models into the standalone Jewelith Ring Configurator app.

Implementation target:

- `Jewelry-configurator-rb`

Read-only/source models:

- `E:\Keyideas\Keyideas Ring Builder\JUL MA 02.glb`
- `E:\Keyideas\Keyideas Ring Builder\JU M 0031.glb`

No Shopify Liquid, backend, pricing, Add to Cart, StoreContext, AI resolver, share contract, or Ring Builder backend handoff logic was changed for this model integration.

## Asset paths

URL-safe project copies:

- `public/3d-models/DIAMONDWISE/jul-ma-02.glb`
- `public/3d-models/DIAMONDWISE/ju-m-0031.glb`

Encrypted runtime copies:

- `public/3d-models/DIAMONDWISE/jul-ma-02.enc`
- `public/3d-models/DIAMONDWISE/ju-m-0031.enc`

The `.enc` files were generated with the same XOR key and convention already used by `src/lib/ring-configurator/utility/modelLoader.js`. No new encryption algorithm was introduced.

The public GLB copies match the parent-folder source files by SHA-256:

- `jul-ma-02.glb`: `B360F3B60DF5E776F6120C23897089272A8917F6ACB4CBC49B00BF5633071088`
- `ju-m-0031.glb`: `DA2C9BB783D2E0DD60E6A20CD8962B2091531F83BE6FCB5A83CC56EBBFB6EF95`

## Design IDs

The design map lives in:

- `src/lib/ring-configurator/data/diamondwiseDesigns.js`

Designs:

| ID | Label | Source file | Runtime path |
| --- | --- | --- | --- |
| `diamondwise-design-01` | DiamondWise Design 01 | `JUL MA 02.glb` | `/3d-models/DIAMONDWISE/jul-ma-02.glb` |
| `diamondwise-design-02` | DiamondWise Design 02 | `JU M 0031.glb` | `/3d-models/DIAMONDWISE/ju-m-0031.glb` |

Paired preset option metadata:

| Design ID | Shank ID | Head ID | Center stone mesh | Reference carat |
| --- | --- | --- | --- | ---: |
| `diamondwise-design-01` | `dw-design-01-shank` | `dw-design-01-head` | `marquise1` | 10 |
| `diamondwise-design-02` | `dw-design-02-shank` | `dw-design-02-head` | `all-diamonds779` | 10 |

The 10 ct reference value is provisional. It is used only for visual center-stone scaling and must be confirmed through DiamondWise/client visual QA before it is treated as a physically verified model reference.

The logical shank/head IDs are display/control metadata only. They are not written into pricing-sensitive `ringShank` or `ringHead` state.

## Model structure audit

### JUL MA 02

- File size: 35,224,776 bytes (~33.6 MB)
- Bounds:
  - min: `[-11.9138, -10.4616, -7.9168]`
  - max: `[11.9138, 17.57, 8.0687]`
  - size: `[23.8276, 28.0316, 15.9855]`
  - center: `[0, 3.5542, 0.0759]`
- Mesh count: 33
- Approximate vertices: 1,231,789
- Approximate triangles: 493,904
- Important nodes/meshes:
  - `basket`
  - `shank`
  - `roundobj`
  - `all-diamonds1217`
  - `marquise1` through `marquise7`
  - `all-diamonds007` through `all-diamonds029`
- Materials:
  - metal: `18k_yellow_gold.006`
  - stones: `Material_1*` and unnamed marquise stone materials

Material classification:

- Metal meshes: `basket`, `shank`
- Center stone mesh: `marquise1`
- Side stone meshes: `marquise2` through `marquise7` and `all-diamonds*`

### JU M 0031

- File size: 57,210,744 bytes (~54.6 MB)
- Bounds:
  - min: `[-10.5194, -10.1829, -8.6368]`
  - max: `[10.5194, 16.1837, 8.2792]`
  - size: `[21.0389, 26.3666, 16.9161]`
  - center: `[0, 3.0004, -0.1788]`
- Mesh count: 3
- Approximate vertices: 1,896,098
- Approximate triangles: 975,387
- Important nodes/meshes:
  - `geometry_0`
  - `geometry_0001`
  - `all-diamonds779`
- Materials:
  - metal: `18k_yellow_gold.004`, `18k_yellow_gold.005`
  - stone: unnamed material on `all-diamonds779`

Material classification:

- Metal meshes: `geometry_0`, `geometry_0001`
- Center stone mesh: `all-diamonds779`
- Side stone meshes: none separately exposed

## Rendering approach

These DiamondWise assets are complete assembled models. They are intentionally not mapped into the existing `RING-SHANK`, `RING-HEAD`, side-setting, or diamond model slots.

The dedicated component is:

- `src/lib/ring-configurator/objects/DiamondWiseRing.jsx`

When a DiamondWise design is selected:

- the scene renders only `DiamondWiseRing`
- the current `Diamond`, `Head`, `Ring`, and `MatchingBand` components are not rendered
- this avoids duplicated head/shank/stone geometry

When no DiamondWise design is selected:

- the existing configurator render stack remains unchanged

## Material mapping

Current metal color/material is applied only to audited metal mesh names.

The center stone is rendered with the same `MeshRefractionMaterial` style used by the existing diamond preview:

- Colorless mode uses a colorless diamond material.
- Colored diamond mode uses the selected fancy diamond color/intensity.
- Gemstone mode uses the selected gemstone color.

Side stones are rendered as colorless refraction stones. Design 01 side stones do not inherit the center-stone color or gemstone material. Design 02 does not expose separate side-stone meshes.

Any unexpected mesh name preserves a clone of the supplied source material for the first pass.

This avoids classifying mesh material by index alone.

## Center-stone scaling

While a DiamondWise preset is active, shape is fixed to Marquise.

Only the audited center-stone mesh is scaled:

- Design 01: `marquise1`
- Design 02: `all-diamonds779`

The scaling uses the existing visual carat formula from the standalone diamond preview:

```text
visualSize(carat) = 0.30 + (carat - 1) * 0.015
centerStoneScaleRatio = visualSize(selectedCarat) / visualSize(referenceCarat)
```

The shank, head/basket, prongs, side stones, and complete GLB root scale remain unchanged.

## Scale, rotation, and position

Both designs currently use:

- scale: `0.25`
- position: `[0, 0, 0]`
- rotation: `[0, 0, 0]`

Reasoning:

- Existing default shank source bounds are roughly `15.6` units high and then scaled down in the legacy components.
- DiamondWise source bounds are roughly `26–28` units high.
- A `0.25` complete-model scale keeps the visual size close to the existing premium preview without modifying camera controls.

Further visual QA may tune these values after reviewing real device screenshots.

## UI/state behavior

Theme 3B now exposes DiamondWise presets as paired options inside the existing Theme 3 rows:

- DiamondWise shank options appear in Band / Ring Style.
- DiamondWise head options appear in Setting / Head.
- Selecting either paired option sets `diamondWiseDesignId` and visually activates both paired shank/head options.
- Selecting any standard shank or head clears `diamondWiseDesignId` and returns to the normal composed configurator.

Added state:

- `diamondWiseDesignId`

The selected design is included in:

- Theme 3 preview chips
- Theme 3B build summary
- Theme 3 share/restore config
- Theme 3 continue payload
- Theme 3 payload helper

Pricing remains unchanged. No SKU, variant ID, backend ID, or model-specific price was added.

Supported controls while a DiamondWise preset is active:

- Metal color
- Purity/karat
- Ring size for state and summary
- Stone Type
- Target Carat
- Cut and Clarity for diamond modes
- Colored diamond color/intensity
- Gemstone

Fixed or disabled/read-only controls while a DiamondWise preset is active:

- Shape is fixed to Marquise.
- Side setting is not separately configurable.
- Matching band is disabled/read-only.
- Bi-metal is disabled.
- Engraving is disabled/read-only.
- Alternative composed geometry options require selecting a standard shank or standard head first.

The UI displays: “This is a unique ring design with fixed setting geometry.”

## Performance findings

| Design | File size | Meshes | Approx. vertices | Approx. triangles | Risk |
| --- | ---: | ---: | ---: | ---: | --- |
| DiamondWise Design 01 | ~33.6 MB | 33 | 1,231,789 | 493,904 | Medium/high |
| DiamondWise Design 02 | ~54.6 MB | 3 | 1,896,098 | 975,387 | High |

`JU M 0031` is especially dense and may load slowly on lower-end devices. No destructive optimization was performed because no approved local optimization pipeline was present in the app.

Recommended future optimization, only after approval:

- create separate optimized copies
- keep originals untouched
- document tool/settings
- compare before/after file size, mesh count, triangle count, and visual fidelity

## Unsupported features and limitations

- No client SKU/product/variant IDs were provided.
- No approved model-specific pricing was provided.
- No compatibility matrix was provided for shapes, heads, shanks, metals, ring sizes, matching bands, or engraving.
- Existing Theme 3 option controls remain available; when a DiamondWise complete model is selected, the 3D preview uses the complete client model rather than re-composing those individual model parts.
- Engraving geometry is not applied to the complete DiamondWise model in this first pass.
- Matching band geometry is not separately added on top of DiamondWise complete models.
- Metal override is limited to audited metal mesh names.
- Raw public `.glb` files are not required by runtime loading because `fetchDecrypted()` resolves the configured `.glb` path to the encrypted `.enc` asset. They can be removed later to reduce deployment size only after an untouched external/source backup is explicitly confirmed.

## QA checklist

- Confirm `/` still renders the existing configurator.
- Confirm `/?theme=theme-3&flow=3A` still renders setting-only flow without the DiamondWise selector.
- Confirm `/?theme=theme-3&flow=3B` shows DiamondWise shank options in Band / Ring Style and DiamondWise head options in Setting / Head.
- Select DiamondWise Design 01 shank and verify the paired Design 01 head is active with no duplicated head/shank/diamond.
- Select DiamondWise Design 02 head and verify the paired Design 02 shank is active with no duplicated head/shank/diamond.
- Switch back to any standard shank/head and verify the normal render stack returns.
- Verify 360 rotation, manual rotate, zoom, view button, and reset still work.
- Verify current metal color updates only confirmed metal meshes.
- Verify center stone changes for Colorless, Colored Diamond, and Gemstone modes.
- Verify Design 01 side stones remain colorless.
- Verify target carat scales only the center-stone mesh.
- Verify Marquise remains fixed while a DiamondWise preset is active.
- Verify matching band, bi-metal, and engraving controls cannot change preset geometry.
- Verify share URL restores selected DiamondWise design.
- Verify Choose Diamond payload includes the selected DiamondWise design.
- Verify preview total and current pricing do not change because of DiamondWise selection.
- Watch console for GLB loading errors.
- Test on a lower-end laptop/mobile device because both models are large.
