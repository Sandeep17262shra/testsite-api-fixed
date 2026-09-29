# Theme 3 Ring Configurator Production Integration Analysis

Date: 2026-08-01

Scope: safe investigation and preparation only. This document does not implement backend, cart, pricing, handoff, or model changes.

## SECTION 1: Current Pricing Flow

### Files involved in current pricing

- `src/lib/ring-configurator/priceApiClient.js`
- `src/lib/ring-configurator/priceConfig.js`
- `src/lib/ring-configurator/utility/storePriceHelper.js`
- `src/lib/ring-configurator/utility/calculateFInalRingDiamondPrice.js`
- `src/lib/ring-configurator/utility/Parentconfig.js`
- `src/lib/ring-configurator/contexts/ContextProvider.jsx`
- `src/lib/ring-configurator/contexts/SectionContext.jsx`
- `src/lib/ring-configurator/RingCustomizer.jsx`
- `public/data/price-config-data.json`
- `src/lib/ring-configurator/data/data.json`
- `src/lib/ring-configurator/data/api-data.json`

### Where prices come from today

Current pricing is local/demo pricing.

- `ContextProvider.jsx` calls `initPriceConfig()` before rendering the configurator.
- `priceApiClient.js` currently loads local JSON from `public/data/price-config-data.json`.
- `priceApiClient.js` contains disabled remote-price-client scaffolding, but `USE_REMOTE_API` is currently `false`. Production should not rely on the existing disabled development URL constant.
- `priceConfig.js` reads the loaded config cache and falls back to an in-code `FALLBACK_CONFIG` if needed.
- `Parentconfig.js` provides store-like context such as currency code, locale, currency rate, natural-diamond hiding, fancy-price factor, and ring-size system. These are hardcoded storefront rules today.
- `storePriceHelper.js` converts raw store prices by multiplying by the current store currency rate.
- `data.json` provides demo defaults such as starting diamond price, carat, metal price, and matching-band price.
- `api-data.json` provides local option lists for ring, diamond, camera view, ring size, and engraving choices.

### Current Theme 3A total calculation

Theme 3A is the setting-only flow. It does not include preview-stone pricing in the displayed total.

In `RingCustomizer.jsx`:

- Ring pricing is recalculated through `applyRingPrice(...)`.
- `applyRingPrice(...)` calls `calculateFinalRingPrice(...)`.
- `calculateFinalRingPrice(...)` combines:
  - metal/purity price
  - shank style price
  - head style price
  - matching band price when enabled
  - engraving price when engraving text exists
  - side setting price is currently `0` in that helper
- Ring-size pricing is calculated separately by `getRingSizePrice(parent, currentRingSizeMm)`.
- Theme 3A setting subtotal is effectively:
  - `shankTotal + headTotal + ringSizePrice`
- The Theme 3A header wording is setting-subtotal oriented rather than preview-total oriented.

Local/demo logic today:

- Metal/purity, shank, head, matching band, engraving, and ring-size prices come from local JSON/fallback config.
- Store currency conversion is local/hardcoded by parent URL matching.
- No backend pricing quote or server-authoritative total exists.

### Current Theme 3B total calculation

Theme 3B is the diamond-preview flow. It includes a preview-stone price for visualization/pricing preview only.

In `RingCustomizer.jsx`:

- Setting subtotal is:
  - `shankTotal + headTotal + ringSizePrice`
- Preview stone price is stored in `stoneTotal`.
- Theme 3B preview total is:
  - `settingSubtotal + diamondPreviewPrice`
  - where `diamondPreviewPrice = stoneTotal`

Preview stone pricing is calculated by `calculateTheme3DiamondPrice(...)`:

- Base diamond price comes from `getDiamondPrice(parent, carat, quality, type)`.
- Diamond type selects either local lab diamond prices or local natural diamond prices.
- Colorless mode uses the base diamond price.
- Colored diamond mode uses base diamond price plus:
  - local colored diamond extra price
  - local intensity price
- Gemstone mode uses:
  - base price multiplied by local fancy-price factor
  - local gemstone extra price

Local/demo logic today:

- Natural/Lab-grown selection changes the local price table.
- Colored diamond and gemstone extra pricing are local/demo calculations.
- Intensity price is derived locally in `RingCustomizer.jsx`, not from backend.
- The preview stone is not a real selected inventory diamond.

### Fields required for backend pricing calculation

Based on current frontend needs, a production pricing quote would need at least:

- Store/context:
  - `storeId` or tenant identifier
  - `parentUrl` or embed origin, if still used
  - `currency`
  - `locale`
  - `theme`
  - `flow`
- Ring setting:
  - `ringShank`
  - `ringSideSetting`
  - `ringMatchingBand`
  - `ringBand`
  - `matchingBandQuantity`
  - `matchingBandStyle`
  - `ringHead`
  - `headStyle`
  - `threestone`
  - `shapeList`
  - `bandWidth`
  - `styleShape`
- Metal:
  - `metal`
  - `platinum`
  - `ringColor`
  - `headColor`
  - `bandColor`
  - `biMetal`
  - `isEnabled`
- Ring size:
  - `sizeOption`
  - `ringSize`
  - `countryShortName`
  - `sizeMM`
- Engraving:
  - `engraving`
  - `engravingFont`
  - `symbol`
- Preview stone:
  - `activeTab`
  - `colorType`
  - `shape`
  - `diamondSize`
  - `selectedQuality`
  - `diamondType`
  - `cut`
  - `clarity`
  - `fancyDiamond`
  - `fancyDiamondIntensity`
  - `gemstone`
- Current frontend totals for comparison/debug only:
  - `shankTotal`
  - `headTotal`
  - `stoneTotal`
  - `ringSizePrice`
  - `matchingBandPrice`
  - `engravingPrice`
  - `settingSubtotal`
  - `diamondPreviewPrice`
  - `previewTotal`

## SECTION 2: Current Configuration State/Payload

### Ring setting state

Stored mainly in `RingContext.jsx`:

- `ringColor`
- `headColor`
- `bandColor`
- `metal`
- `platinum` is stored in `SectionContext.jsx`
- `biMetal`
- `isEnabled`
- `ringHead`
- `ringShank`
- `ringSideSetting`
- `ringMatchingBand`
- `ringBand`
- `ringWidth`
- `bandWidth`
- `styleShape`
- `sizeOption`
- `ringSize`
- `engraving`
- `engravingFont`
- `engravingFocus`
- render/material values: `metalness`, `roughness`, `reflectivity`, `clearcoat`, `clearcoatRoughness`, `envMapIntensity`

Stored mainly in `SectionContext.jsx`:

- `shankTotal`
- `headTotal`
- `stoneTotal`
- `otherTotal`
- `stylePrice`
- `engravingPrice`
- `ringSideSettingPrice`
- `metalPrice`
- `matchingBandPrice`
- `headStyle`
- `headPrice`
- `threestone`
- `shapeList`
- `sideStyle`
- `symbol`
- `countryShortName`
- `sizeMM`
- `summaryBlink`
- `handleMetal`

### Stone and preview diamond state

Stored mainly in `DiamondContext.jsx`:

- `shape`
- `diamondSize`
- `diamondType`
- `selectedQuality`
- `cut`
- `clarity`
- `diamondColor`
- `diamondPriceColor`
- `diamondColorClarity`
- `initialDiamondPrice`
- `activeTab`
- `colorType`
- `fancyDiamond`
- `fancyDiamondIntensity`
- `gemstone`

Additional stone-related state in `SectionContext.jsx`:

- `stoneThreestone`
- `activeDiamondSize`
- `activeDiamondType`
- `activeCut`
- `clarityPrice`
- `activePriceColor`
- `shapePrice`
- `caratP`
- `diamondCarat`
- `cutPrice`
- `fancyColorPrice`
- `getGemstonePrice`
- `intensityPrice`

### Share/config payload

The Theme 3 share URL is built in `RingCustomizer.jsx` by `buildTheme3ShareUrl()`.

It serializes a `config` object into the `config` query parameter using Base64 JSON encoding. Important fields currently included:

- `theme`
- `flow`
- `ringColor`
- `headColor`
- `metal`
- `ringHead`
- `ringShank`
- `ringSideSetting`
- `ringMatchingBand`
- `ringBand`
- `biMetal`
- `sizeOption`
- `ringSize`
- `engraving`
- `engravingFont`
- `shape`
- `diamondSize`
- `selectedQuality`
- `diamondType`
- `activeTab`
- `colorType`
- `fancyDiamond`
- `fancyDiamondIntensity`
- `gemstone`

The encoded config is read back in `RingContext.jsx`, `DiamondContext.jsx`, and parts of the older/default stone flow.

### Data to preserve for Ring Builder handoff

For Step 2/Ring Builder handoff, preserve:

- all selected ring setting options
- head style
- primary metal and purity
- bi-metal enabled state and head accent metal
- matching band enabled state, style, and quantity
- ring size system, selected size, and millimeter label
- engraving text, font, and symbol
- Theme 3B preview stone preferences:
  - stone type
  - shape
  - carat
  - diamond origin
  - cut and clarity for diamond modes
  - colored diamond color/intensity for colored mode
  - gemstone for gemstone mode
- display totals:
  - setting subtotal
  - preview stone price, if Theme 3B
  - preview total
  - currency
- an eventual backend `configurationId` or `quoteId`, once available

## SECTION 3: Backend Integration Requirements

The endpoint names below are illustrative only. They should not be implemented until backend ownership, schemas, authentication, and store identification are confirmed.

### Config/options API

Purpose: load store-specific available options, defaults, compatibility rules, model mappings, and labels.

Possible request fields:

- `storeId` or tenant key
- `parentUrl` or embed origin
- `theme`
- `flow`
- `locale`
- `currency`

Possible response fields:

- `store`
  - `id`
  - `name`
  - `currency`
  - `locale`
  - `allowedOrigins`
- `defaults`
  - ring defaults
  - stone defaults
  - ring-size defaults
- `options`
  - shanks
  - heads
  - side settings
  - matching bands
  - metals
  - purities
  - ring sizes
  - engraving fonts/symbols
  - stone shapes
  - diamond origins
  - cuts
  - clarities
  - colored diamond colors/intensities
  - gemstones
- `rules`
  - compatibility
  - hidden/disabled options
  - platinum/purity behavior
  - gemstone hides cut/clarity
- `assetMap`
  - option IDs to image/model paths
- `priceMode`
  - local fallback allowed
  - backend quote required

Unknowns:

- canonical store identifier
- canonical option IDs/SKUs
- whether frontend labels can remain local
- whether model paths are backend-managed or bundled/static
- whether availability is global or store-specific

### Pricing calculation API

Purpose: return a server-authoritative quote for the current configuration.

Possible request fields:

- store/context fields
- complete current configuration payload
- requested currency/locale
- preview stone preferences
- optional existing `configurationId`
- optional existing `quoteId`

Possible response fields:

- `quoteId`
- `currency`
- `expiresAt`
- `lineItems`
  - shank/setting
  - head
  - metal/purity
  - ring size
  - matching band
  - engraving
  - preview stone, if applicable
- `totals`
  - setting subtotal
  - preview stone subtotal
  - total/preview total
  - tax/fees/discounts if applicable
- `warnings`
  - unavailable option
  - repriced option
  - fallback mode

Unknowns:

- whether preview stone pricing should remain demo/local or come from backend
- whether tax/markup/currency conversion is included
- whether backend returns exact line-item prices or only final total
- quote expiration rules
- whether pricing should block UI on failure or fall back locally

### Save/share configuration API

Purpose: save a configuration and return a stable shareable ID/URL.

Possible request fields:

- store/context fields
- full configuration payload
- current quote ID, if available
- preview image/snapshot reference, if available
- source page/referrer

Possible response fields:

- `configurationId`
- `shareUrl`
- `shortCode`
- `expiresAt` or persistence status
- saved configuration payload

Unknowns:

- whether saved configs should be permanent
- whether anonymous users can save
- whether old Base64 `config` URLs must remain supported
- whether backend stores preview renders/images

### Continue/Choose Diamond handoff API

Purpose: hand the configured setting into Ring Builder Step 2.

Possible request fields:

- store/context fields
- full configuration payload
- current quote ID
- current configuration ID
- desired next step: diamond selection

Possible response fields:

- `ringBuilderSessionId`
- `step2Url`
- `configurationId`
- `quoteId`
- `payloadForParent`
- `expiresAt`

Unknowns:

- whether handoff target is parent `postMessage`, redirect URL, backend session, or a route inside the same app
- exact Step 2 required fields
- whether Step 2 should trust frontend payloads or backend session IDs only
- how to handle top-level standalone mode

### Add to Cart API

Purpose: add the completed configured product to a real cart after the ring and final diamond are chosen.

Possible request fields:

- store/context fields
- user/session/cart identifier
- configuration ID
- quote ID
- final diamond ID/SKU, after Step 2
- ring setting SKU/variant IDs
- option line-item properties
- pricing/tax/currency quote reference

Possible response fields:

- `cartId`
- `lineItemId`
- `cartUrl`
- `checkoutUrl`, if applicable and approved
- `status`
- `messages`

Unknowns:

- cart owner/platform
- product/variant mapping
- final diamond selection source
- whether ring and diamond are one bundle or separate line items
- whether price must be server-authoritative before cart insertion

## SECTION 4: Add to Cart Integration Analysis

Search findings:

- No real Add to Cart function or checkout API integration was found in the Theme 3 configured-ring flow.
- `RingCustomizer.jsx` uses a `Choose Diamond` CTA for Theme 3 handoff, not Add to Cart.
- `RCApp.css` contains legacy/default cart-related styles such as `cart-btn-summary` and `cart-tooltip`.
- `LocalPriceSummary.jsx` is a local summary dropdown and does not perform a cart call.
- The Next overview route copy notes that the demo is independent from backend/cart APIs, but that is content, not app behavior.

Current status:

- Add to Cart is not production-integrated.
- Any production Add to Cart behavior would need a confirmed backend/cart contract and SKU/variant mapping.

Payload Add to Cart would need later:

- backend `configurationId`
- backend `quoteId`
- final selected diamond ID/SKU from Step 2
- ring setting SKU/variant ID
- option IDs/SKUs for shank, head, metal/purity, ring size, matching band, engraving
- line item properties for readable summary
- currency and final server-authoritative total
- cart/session/customer identifier if required

## SECTION 5: Ring Builder Integration Analysis

### Current Choose Diamond / continue flow

In `RingCustomizer.jsx`, `handleContinue()` builds a `ring-configurator:continue` payload and sends it to the parent page using `window.parent.postMessage(...)` when embedded.

If the configurator is opened top-level, it does not redirect. It shows a status message telling the user to open it inside Ring Builder to continue.

The payload includes:

- theme and flow
- ring style/setting fields
- metal/purity/bi-metal fields
- ring size details
- matching band details
- engraving details
- Theme 3B preview stone details
- setting subtotal
- preview stone price
- preview total
- currency

### Possible handoff approaches

#### postMessage

Pros:

- Already implemented.
- Works well when configurator is embedded inside a parent Ring Builder page.
- Keeps the configurator standalone.

Cons:

- Requires parent page listener.
- Payload trust/security must be handled by parent/backend.
- Not ideal as the only source of truth for pricing/cart.

#### Redirect with query parameters

Pros:

- Simple to reason about.
- Works in top-level mode.
- Share/debug friendly.

Cons:

- Long URLs for full configuration.
- Query payload is not secure or server-authoritative.
- Harder to preserve quote validity.

#### Backend session/configuration ID

Pros:

- Best production path for pricing, cart, and Step 2 continuity.
- Parent/Ring Builder can fetch trusted config by ID.
- Supports share/save and quote expiration.

Cons:

- Requires backend contract.
- Requires error/fallback decisions.
- Requires migration plan from current local Base64 share URLs.

Recommendation only:

- Keep current `postMessage` handoff as the frontend integration mechanism.
- Add backend save/quote first.
- Send `configurationId` and `quoteId` in the `postMessage` payload once backend exists.
- Let Ring Builder Step 2 load server-authoritative details by ID.
- Continue supporting local/static fallback until backend behavior is approved.

## SECTION 6: Client Model/Design Integration Requirements

### Current 3D model loading files

- `src/lib/ring-configurator/Scene.jsx`
- `src/lib/ring-configurator/objects/Ring.jsx`
- `src/lib/ring-configurator/objects/Head.jsx`
- `src/lib/ring-configurator/objects/Diamond.jsx`
- `src/lib/ring-configurator/objects/MatchingBand.jsx`
- `src/lib/ring-configurator/utility/modelLoader.js`
- `public/3d-models/...`
- `public/all_diamonds/...`
- `public/fancy-diamonds/...`
- `public/gem-stones/...`
- `public/metal_texture...`

### How current ring parts/models are selected

- Shank model:
  - `Ring.jsx` loads `/3d-models/RING-SHANK/${ringShank}.glb` through encrypted `.enc` fetching.
- Side setting model:
  - `Ring.jsx` loads `/3d-models/SIDE-RING-SETTING/${mixSettingShank}.glb`.
  - If side setting is plain and shank is not plain, the shank style may be used for the side setting model key.
- Head model:
  - `Head.jsx` maps `ringHead` and `shape` to paths under `/3d-models/RING-HEAD/...`.
  - Some heads are shape-specific, such as 4-prong, 6-prong, bezel, and hidden halo.
  - Three-stone heads use a dedicated `THREE-STONE` path.
- Diamond model:
  - `Diamond.jsx` loads shape models from `/all_diamonds/...`.
- Matching band:
  - `MatchingBand.jsx` loads `/3d-models/WEDDING-BANDS/${ringBand}.glb`.
- Metal/texture:
  - Metal color values come from state.
  - HDR/metal texture selection uses `handleMetal` from `SectionContext`.
- Model loading:
  - `modelLoader.js` fetches encrypted `.enc` files and decrypts them client-side.

### What is needed from the client to add their designs

- Model files:
  - shank models
  - head models
  - side setting models
  - matching band models
  - diamond/gemstone models if different from current preview models
- Texture/material files:
  - metal environment maps
  - stone textures if needed
  - preview image assets for option cards
- Option-to-model mapping:
  - canonical option IDs
  - file paths
  - shape-specific head mappings
  - three-stone mappings
  - matching-band mappings
- Pricing identifiers:
  - SKU/product ID/variant ID for each option
  - backend price key for each configurable component
- Compatibility rules:
  - which heads support which shapes
  - which shanks support which side settings
  - which matching bands fit which shanks
  - which metals/purities are available by store
  - which ring sizes are available
  - engraving support by design
- Preview assets:
  - option card images
  - fallback images
  - labels/descriptions
- QA requirements:
  - model scale and origin alignment
  - ring/head/stone fit
  - metal material behavior
  - mobile performance
  - load-time budget

No new models should be added until these mappings and compatibility rules are confirmed.

## SECTION 7: Questions for Seniors

Ask Sachin Sir/Akansh Sir before implementation:

1. Which backend owns configurator pricing: Ring Builder backend, Jewelith backend, store backend, or a new service?
2. What is the canonical store identifier: `storeId`, tenant slug, parent URL, shop domain, API key, or another value?
3. Should backend replace all local pricing or only selected parts first?
4. Should Theme 3B preview stone pricing remain local/demo, or should backend return preview stone pricing?
5. Is the preview stone ever a real inventory diamond, or only a visualization before Step 2?
6. What exact payload does Ring Builder Step 2 need from Theme 3?
7. Should Choose Diamond use `postMessage`, redirect, backend session ID, or a combination?
8. Should Add to Cart happen only after Step 2 diamond selection, or can a setting-only product be added to cart?
9. Are ring and diamond cart items separate line items or one bundled product?
10. What SKU/product/variant IDs exist for shank, head, metal/purity, ring size, matching band, engraving, and final diamond?
11. Should option availability be store-specific?
12. Who owns compatibility rules for model/design combinations?
13. What currency, tax, discount, and markup rules must be applied?
14. What should happen if backend pricing fails: fallback to local, show limited mode, or block continuation?
15. Which domains are allowed to embed the configurator?
16. Should existing Base64 `config` share URLs remain supported?
17. Should backend save/share configurations permanently or with expiration?
18. Should the app send analytics/events for guide usage, configuration changes, Choose Diamond, and Share?
19. What client model format, naming convention, and encryption process should be used?
20. Who will validate 3D model fit, scale, textures, and option preview images?

## SECTION 8: Safe Next Steps

### Safe before backend is ready

- Document final frontend payload contracts.
- Normalize current internal option IDs and labels.
- Add non-breaking metadata fields to local config, if approved.
- Add a backend-client wrapper with no active remote calls.
- Add environment-variable placeholders without changing runtime behavior.
- Improve TypeScript/JSDoc-style documentation around payload shapes.
- Add frontend tests for share/config restore and Choose Diamond payload creation.
- Prepare model/design intake checklist for client assets.

### Must wait for backend/senior confirmation

- Remote pricing calls.
- Remote option/config loading that changes availability.
- Add to Cart calls.
- Checkout/cart redirects.
- Backend session creation.
- Replacing local pricing totals with server quote totals.
- Store-specific API auth/API keys.
- Domain allowlist enforcement.
- Client model/design import.
- SKU/variant mapping.
- Any claim of live inventory, checkout, or commerce-platform compatibility.

## Files inspected

- `src/lib/ring-configurator/priceApiClient.js`
- `src/lib/ring-configurator/priceConfig.js`
- `src/lib/ring-configurator/utility/Parentconfig.js`
- `src/lib/ring-configurator/utility/storePriceHelper.js`
- `src/lib/ring-configurator/utility/calculateFInalRingDiamondPrice.js`
- `src/lib/ring-configurator/utility/modelLoader.js`
- `src/lib/ring-configurator/contexts/ContextProvider.jsx`
- `src/lib/ring-configurator/contexts/RingContext.jsx`
- `src/lib/ring-configurator/contexts/DiamondContext.jsx`
- `src/lib/ring-configurator/contexts/SectionContext.jsx`
- `src/lib/ring-configurator/contexts/ShareContext.jsx`
- `src/lib/ring-configurator/configuratorConfig.js`
- `src/lib/ring-configurator/RingConfigurator.jsx`
- `src/lib/ring-configurator/RingCustomizer.jsx`
- `src/lib/ring-configurator/Scene.jsx`
- `src/lib/ring-configurator/components/summary/LocalPriceSummary.jsx`
- `src/lib/ring-configurator/objects/Ring.jsx`
- `src/lib/ring-configurator/objects/Head.jsx`
- `src/lib/ring-configurator/objects/Diamond.jsx`
- `src/lib/ring-configurator/objects/MatchingBand.jsx`
- `src/lib/ring-configurator/data/api-data.json`
- `src/lib/ring-configurator/data/data.json`
- `public/data/price-config-data.json`
- `public/3d-models/...`
- `public/all_diamonds/...`
- `public/fancy-diamonds/...`
- `public/gem-stones/...`
- `public/metal_texture...`

