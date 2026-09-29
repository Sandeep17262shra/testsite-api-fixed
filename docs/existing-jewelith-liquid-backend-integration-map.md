# Existing Jewelith Liquid + Backend Integration Map

Date: 2026-08-03

Scope: read-only analysis of:

- `E:\Keyideas\Keyideas Ring Builder\Jewelry-configurator`
- `E:\Keyideas\Keyideas Ring Builder\Jewelry-configurator-liquid`
- `E:\Keyideas\Keyideas Ring Builder\Jewelry-configurator-rb`

Only this document was created in the active standalone app repo. No runtime code was modified.

## Section 1: Repository Roles and Architecture

### `Jewelry-configurator`

Role: original Jewelith/Jewelry Configurator application.

What it contains:

- Next.js app/backend API routes under `src/app/api`.
- Merchant/admin app pages under `src/app/(main)`.
- Database models under `src/app/lib/model`.
- Shopify helper functions under `src/app/lib/common.js`.
- Original configurator frontend under `frontend_app/src/ring-configurator`.
- Original static/local pricing JSON under `frontend_app/public/data/price-config-data.json`.

This repo currently hosts the production backend APIs used by the Shopify Liquid integration. The key deployed backend/app base URL found in code is:

```txt
https://jewelry-configurator-app-44j3g.kinsta.app
```

The original frontend uses:

- local/static price config through `frontend_app/src/ring-configurator/priceApiClient.js`;
- optional AI remote endpoint through `import.meta.env.VITE_RING_AI_API_URL || "/api/ring-ai/resolve"`;
- iframe parent data from `postMessage`, especially `parentUrl`, `shop`, and `token`.

### `Jewelry-configurator-liquid`

Role: Shopify theme extension / Liquid integration layer.

What it contains:

- Shopify app manifests:
  - `shopify.app.toml`
  - `shopify.app.engagement-ring-builder.toml`
- Theme extension:
  - `extensions/theme-extension/blocks/ring-configurator.liquid`
  - `extensions/theme-extension/assets/load-app.js`
  - `extensions/theme-extension/assets/kirb-css.css`

This code embeds the deployed original configurator into Shopify pages. It does not contain pricing logic or 3D configurator logic. It fetches iframe/store data from the original backend, injects the iframe, sends store context to the iframe, and receives `ADD_TO_CART` messages from the iframe.

### `Jewelry-configurator-rb`

Role: new standalone Next.js Ring Configurator app and future implementation target.

What it contains:

- Standalone Next.js app route at `/`.
- Theme 3 routes selected by query:
  - `/?theme=theme-3&flow=3A`
  - `/?theme=theme-3&flow=3B`
- Theme 3 UI, AI Assistant integration, grouped summary, share action, guide events, local pricing, and local/static data.
- Production-prep helpers already present but not wired:
  - `src/lib/ring-configurator/utility/theme3Payload.js`
  - `src/lib/ring-configurator/api/ringConfiguratorBackendClient.js`
  - `.env.example`

This repo does not currently host or call production backend APIs for pricing/cart. Local/static data remains the source of truth.

## Section 2: Shopify Liquid / Iframe Flow

### Files that create/load the iframe

Inspected files:

- `Jewelry-configurator-liquid/extensions/theme-extension/blocks/ring-configurator.liquid`
- `Jewelry-configurator-liquid/extensions/theme-extension/assets/load-app.js`
- `Jewelry-configurator-liquid/extensions/theme-extension/assets/kirb-css.css`

The app block schema in `ring-configurator.liquid` is:

```json
{
  "name": "Keyideas Jewelith",
  "target": "body",
  "settings": [
    {
      "type": "color",
      "id": "themeColor",
      "label": "Primary Color",
      "default": "#575757"
    }
  ]
}
```

The Liquid code runs only on Shopify page templates:

```liquid
{% if template == 'page' or template.name == 'page' %}
```

### Backend base URL

`extensions/theme-extension/assets/load-app.js` defines:

```js
const MainDomainUrlCon = "https://jewelry-configurator-app-44j3g.kinsta.app";
```

The Liquid block uses this as the original backend/app base URL.

### Iframe URL generation

On `DOMContentLoaded`, Liquid calls:

```js
fetch(mainurlcon + '/api/get-data?path={{ page.handle }}', {
  method: 'GET',
  headers
})
```

Headers include:

```js
headers.append('shop', '{{ shop.permanent_domain }}');
```

If the backend returns a non-empty `iframe`, the Liquid block injects:

```html
<iframe
  class="kirb_rc_app"
  id="rCFrameKIRB"
  src=""
  allow="clipboard-read; clipboard-write"
  width="100%"
  height="100%"
  style="border:none;"
  allowfullscreen>
</iframe>
```

Then it sets:

```js
iframe.src = baseUrl + window.location.search;
```

So the Shopify page's existing query string is appended to the iframe URL. The Liquid code does not add `theme=theme-3` or `flow=3A/3B` by itself.

### Store/shop/context passed to iframe

After the iframe loads, Liquid posts this message to the iframe twice: immediately on load and again after 1 second.

```js
{
  parentUrl: window.location.href,
  shop: '{{ shop.permanent_domain }}',
  token: kirbStoreTokenJewelith
}
```

Target origin is currently `"*"`.

Fields passed:

- `parentUrl`: full current Shopify page URL
- `shop`: Shopify permanent domain, e.g. `example.myshopify.com`
- `token`: `storetoken` returned by `/api/get-data`

Fields not passed by Liquid in the inspected code:

- customer id
- cart token
- currency
- product id
- variant id
- store id other than `shop`
- explicit Theme 3A/3B selection

### Iframe placement and fullscreen behavior

The Liquid block replaces the first available container among:

- `main`
- `#nt_content`
- `.page-wrap .page-template`
- `#MainContent`
- fallback loader node

`kirb-css.css` makes the iframe fullscreen for most stores:

```css
iframe#rCFrameKIRB {
  height: 100vh;
  width: 100vw;
  position: fixed;
  border: none;
  top: 0;
  left: 0;
  z-index: 999999;
}
```

Special-case store:

```js
const kirbExcludeFullscreenStore = '{{ shop.permanent_domain }}' === 'danibydk.myshopify.com';
```

For this store, the iframe is relative and full-width rather than fixed fullscreen.

### postMessage events

Liquid sends:

- parent/store context to iframe:
  - no `type` field
  - target origin `"*"`

Liquid receives:

- `event.data?.type === "ADD_TO_CART"`

When `ADD_TO_CART` is received, Liquid calls the original backend:

```js
fetch(`${MainDomainUrlCon}/api/create-product-shopify`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    product: productPayload,
    options: { includeMedia: !!event.data.Media }
  })
})
```

Then Liquid calls the Shopify storefront AJAX cart endpoint:

```js
fetch(window.location.origin + '/cart/add.js', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: vId,
    quantity: 1,
    properties
  })
})
```

On success, it redirects to:

```js
window.location.href = 'https://{{ shop.permanent_domain }}/cart';
```

### Security/origin validation

Current Liquid security findings:

- Parent-to-iframe messages use target origin `"*"`.
- Iframe-to-parent message listener does not validate `event.origin`.
- Backend calls do require `shop` and `token` headers for `/api/create-product-shopify`.
- `/api/get-data` uses the `shop` header but does not require `token`.

## Section 3: Original Backend API Map

### Production-critical storefront/runtime APIs

| API route | Method | Purpose | Caller | Request | Response | Store identifier | Auth/token | DB models | External API | Side effects |
|---|---:|---|---|---|---|---|---|---|---|---|
| `/api/get-data` | GET | Decide whether the Shopify page should load the configurator and return iframe URL/token | `ring-configurator.liquid` | Query `path={{ page.handle }}`; header `shop` | `{ iframe, storetoken }`, `{ iframe: "" }`, or error | `shop` header mapped to `store_url` | No token required | `pagesetting`, `StoreData`, `Suscription` | none | none |
| `/api/create-product-shopify` | POST | Convert iframe `ADD_TO_CART` payload into Shopify product/variant and return variant id | `ring-configurator.liquid` after iframe message | headers `shop`, `token`; body `{ product, options: { includeMedia } }` | `{ data: productCreated, variantId }` | `shop` header mapped to `store_url` | Requires `StoreData.store_token === token` | `StoreData` | Shopify Admin REST + GraphQL | creates/updates placeholder product/variant, optionally media/metafield |
| `/api/ring-ai/resolve` | POST | Optional remote AI intent resolver | original frontend assistant resolver | body `{ prompt, parentUrl }` | normalized intent JSON or error | `parentUrl` in body only | Cloudflare env keys required | none | Cloudflare Workers AI | none |

### Store identification/configuration APIs

| API route | Method | Purpose | Caller | Request | Response | Store identifier | Auth/token | DB models | External API | Side effects |
|---|---:|---|---|---|---|---|---|---|---|---|
| `/api/save-data` | GET | Load/create Jewelith page setting and return store token/settings | merchant settings pages | query `shop` | `{ dataPage, pages, token, shopData, install_url }` | query `shop` | No token for GET | `StoreData`, `pagesetting` | Shopify Admin REST pages API | may create Shopify page `Jewelith Studio` and save `pagesetting` |
| `/api/save-data` | POST | Save page enabled/disabled state | merchant settings pages | body `{ ringpage, store_url, token }` | `{ data }` | `store_url` | Requires `StoreData.store_token === token` | `StoreData`, `pagesetting` | none | updates `pagesetting.status` |
| `/api/get-plan-info` | GET | Return plan/subscription status | admin/frontend route if used | headers `shop`, `token` | `{ plan: info }` | `shop` header | Requires `StoreData.store_token === token` | `StoreData`, `Suscription` | none | none |
| `/api/check-installed` | GET | Return store install record | admin/install flow | query `shop` | store detail or error | query `shop` | no token found in route | `StoreData` | none | none |
| `/api/get-version` | GET | Return app version/status/install URL/admin onboarding status | admin footer/back buttons | query `shop` | `{ ver, latest, install_url, tabstatus, description, currentplan }` | query `shop` | no token found in route | `Version`, `StoreData`, `Toolvisit`, `Suscription` | none | creates first-visit `Toolvisit` |
| `/api/install-app` | POST | Save Shopify store install/auth data | install flow | installation/store data body | install response | store URL in body | Shopify OAuth context | `StoreData`, `Suscription` and related logs | Shopify Admin | creates/updates store/subscription records |
| `/api/registration` | POST | Support/lead/registration action | admin pages | body from form | response message | form/store fields | not cart runtime | route-specific models | email or DB depending route | saves registration/support data |

### Theme/settings APIs

| API route | Method | Purpose | Caller | Request | Response | Store identifier | Auth/token | DB models | External API | Side effects |
|---|---:|---|---|---|---|---|---|---|---|---|
| `/api/get-embed` | GET | Fetch Shopify main theme id to open app embed editor | `src/app/(main)/home/setting/page.js` | query `shop` | `{ theme }` | query `shop` | uses stored access token, no store token header | `StoreData` | Shopify Admin REST themes API | none |
| `/api/set-theme-update` | POST | Clear/update theme-changed flag | plan/admin page | body includes `shop` | response message | body `shop` | not clearly token-protected | `StoreData` | none | updates `isThemeChanged` |

### Subscription/admin/support APIs

These are production app admin APIs but not directly involved in the ring configurator runtime iframe/cart/pricing path:

- `/api/subscription/plan`
- `/api/subscription/start`
- `/api/subscription/cancel`
- `/api/subscription/checkTestStore`
- `/api/subscription/trial-extend`
- `/api/subscription/trial-extend/check`
- `/api/get-faq`
- `/api/get-tutorial`
- `/api/save-support`
- `/api/add-toolvist`
- `/api/check-review`
- `/api/download-avtive-stores`
- `/api/email-notification/send`

### Pricing/Product/Model API finding

No dedicated backend pricing API or model/options API was found in the inspected production runtime. Configurator pricing is currently frontend/local/static. The backend creates Shopify products for cart, but it trusts `productData.Price` from the iframe payload.

### WordPress integration finding

No WordPress-specific runtime API path was found for Add to Cart or pricing in the inspected routes. WordPress-like store context appears only in frontend `Parentconfig.js` known parent URLs such as `bongioielli`, `dimendscaasi`, and local demo/overview HTML. The concrete production Add to Cart path found is Shopify-specific.

## Section 4: Store Identification Flow

### Shopify iframe load flow

Exact current flow:

```txt
Shopify page loads
→ Liquid block reads {{ shop.permanent_domain }} and {{ page.handle }}
→ Liquid calls GET https://jewelry-configurator-app-44j3g.kinsta.app/api/get-data?path={{ page.handle }}
   header: shop = {{ shop.permanent_domain }}
→ backend queries MongoDB pagesetting by { store_url: shop }
→ backend queries MongoDB storedata by { store_url: shop }
→ backend checks pagesetting.status and pagesetting.url against page handle
→ backend checks suscription plan via getPlanStatus()
→ backend returns iframe URL and storedatas.store_token
→ Liquid injects iframe and sets src = iframe + window.location.search
→ Liquid posts { parentUrl, shop, token } to iframe
→ frontend ShareContext/Scene/Summary read parentUrl from postMessage/window.__parentConfig/referrer
→ frontend local helpers use parentUrl substring matching for currency/availability/pricing bucket
```

### Exact identifiers

| Name | Location | Meaning |
|---|---|---|
| `shop` | Liquid `{{ shop.permanent_domain }}` and backend headers/query | Shopify permanent domain; maps to DB `store_url` |
| `path` | `/api/get-data?path={{ page.handle }}` | Shopify page handle to verify correct page |
| `store_url` | MongoDB `StoreData`, `pagesetting`, `Suscription`; admin POST bodies | canonical store key in backend |
| `store_token` / `token` | `StoreData.store_token`; returned by `/api/get-data`; sent to iframe and backend headers | lightweight store auth token used by create-product and settings POST |
| `parentUrl` | posted from Liquid to iframe | full storefront page URL used by frontend for store-specific local config/currency/share URL |
| `domain` | `StoreData.domain` | stored Shopify domain metadata; not used as primary runtime key in inspected flow |

### Fallback behavior

- If `/api/get-data` finds a disabled page or mismatched page handle, it returns `{ iframe: "" }` and Liquid removes loader/does not inject the app.
- If subscription is not active, `/api/get-data` returns a 500 error with `{ message: "No available Plan", type: "error" }`.
- If the iframe does not receive `parentUrl`, frontend helpers fall back to `document.referrer` when embedded or `window.location.href` in top-level mode.
- Store-specific frontend config falls back to `default` when no known store key is found in `parentUrl`.

## Section 5: Existing Pricing Flow

### Original frontend pricing request

No active backend pricing request was found.

`frontend_app/src/ring-configurator/priceApiClient.js` has:

```js
const USE_REMOTE_API = false;
const REMOTE_API_URL = "https://gcj00pcb-8001.inc1.devtunnels.ms/api/prices";
const LOCAL_JSON_URL = "/data/price-config-data.json";
```

Because `USE_REMOTE_API` is false, pricing config loads from:

```txt
/data/price-config-data.json
```

The standalone app has the same pattern in:

```txt
Jewelry-configurator-rb/src/lib/ring-configurator/priceApiClient.js
```

### Local/static price data

Inspected JSON categories in both old and new repos:

- `metalPrices`
- `shankPrices`
- `headPrices`
- `matchingBandPrices`
- `labDiamondPrices`
- `naturalDiamondPrices`
- `coloredDiamondExtraPrices`
- `gemstoneExtraPrices`
- `engravingPrice`
- `ringSizePrices`

Store buckets found:

- `anelladiamond`
- `bongioielli`
- `dimendscaasi`
- `elitejewelers`
- `labgrownlove`
- `default`

Fallback config in `priceConfig.js` mirrors the `default` bucket if the JSON cache is not ready.

### Store matching and currency

`priceConfig.js` resolves the store bucket by substring match against `parentUrl`. If no known store key is found, it uses `default`.

`Parentconfig.js` also resolves store metadata by substring match against `parentUrl`, including:

- currency symbol/code
- locale/language
- currency rate
- `hideNaturalOption`
- `homeUrl`
- `contactUrl`
- `fancyPriceFactor`
- `ringSizeType`

Currency conversion is frontend-side:

```js
Math.round(rawPrice * getCurrencyRate(parentUrl))
```

In inspected configs, currency rates are currently `1`.

No tax, discount, inventory, or server-authoritative markup calculation was found in runtime pricing.

### Setting/shank/head/metal/ring size pricing

`storePriceHelper.js` exposes:

- `getMetalPrice(parentUrl, purity)`
- `getShankPrice(parentUrl, style)`
- `getHeadPrice(parentUrl, style)`
- `getMatchingBandPrice(parentUrl, style)`
- `getDiamondPrice(parentUrl, carat, quality, type)`
- `getEngravingPrice(parentUrl)`
- `getColoredDiamondExtraPrice(parentUrl, color)`
- `getGemstoneExtraPrice(parentUrl, gemstone)`

`calculateFInalRingDiamondPrice.js` calculates:

```js
metalPrice
+ ringShankPrice
+ ringHeadStylePrice
+ matchingBandPrice when ringBand === "Yes"
+ ringSideSettingPrice // currently 0
+ engravingPrice when engraving exists
```

In Theme 3 standalone `RingCustomizer.jsx`, matching band quantity is handled by multiplying the matching band unit price by `matchingBandQuantity`.

Ring size price is calculated in Theme 3 standalone via `getRingSizePrice(parent, sizeMm)`, using `ringSizePrices` ranges:

- `55-56`
- `57-59`
- `60-63`
- `64-67`
- `68-72`

### Preview stone pricing

Theme 3B preview stone price is local/demo only:

- base diamond price: `getDiamondPrice(parent, carat, quality, type)`
- fallback: `initialPrice.diamondPrice`
- natural vs lab-grown uses `naturalDiamondPrices` vs `labDiamondPrices`
- colored diamond adds `getColoredDiamondExtraPrice(parent, fancyDiamond)` and intensity extra price
- gemstone uses `Math.round(basePrice * getFancyPriceFactor(parent)) + getGemstoneExtraPrice(parent, gemstone)`

Gemstone mode hides cut/clarity in UI, but its preview price is still derived from local/demo stone helpers.

### Theme 3A total

Theme 3A (`flow=3A`, internal `setting-only`) total is:

```txt
settingSubtotal = shankTotal + headTotal + ringSizePrice
```

It does not include preview stone price.

### Theme 3B total

Theme 3B (`flow=3B`, internal `diamond-preview`) total is:

```txt
settingSubtotal = shankTotal + headTotal + ringSizePrice
diamondPreviewPrice = stoneTotal
previewTotal = settingSubtotal + diamondPreviewPrice
```

This remains local/demo preview pricing, not live inventory/backend pricing.

### Backend pricing status

No route was found that calculates configurator pricing server-side. The existing Shopify Add to Cart backend trusts the iframe-sent `Price` field. Production pricing needs a confirmed server-authoritative quote API before cart totals can be treated as final.

## Section 6: Existing Add to Cart Flow

### UI action

Original frontend file:

```txt
Jewelry-configurator/frontend_app/src/ring-configurator/components/summary/Summary.jsx
```

The `addToCart()` function builds a local cart payload and sets `pendingCartPayload`. It also triggers the existing share flow to create a model-preview URL.

### Original frontend payload

The original iframe posts this payload shape to the parent:

```js
{
  type: "ADD_TO_CART",
  quantity: 1,
  Title,
  Description,
  Price,
  Category: "Engagement Ring",
  DiamondCategory: activeTab,
  DiamondCarat: diamondSize,
  MetalType: readableColor,
  Purity: metal,
  Engraving: engraving,
  EngravingFont,
  RingSize: ringSize,
  Media,
  ModelPreviewUrl
}
```

`Price` is computed in the frontend as:

```txt
effectiveShankTotal + effectiveHeadTotal + effectiveStoneTotal + effectiveOtherTotal
```

`Media` is optionally captured from `glInstance.domElement.toDataURL("image/png")`.

`ModelPreviewUrl` is generated from the share URL, preserves the encoded `config` query parameter, and adds:

```txt
preview=model-only
```

The message is sent with:

```js
window.parent.postMessage(payload, "*")
```

### Shopify Liquid cart handling

Liquid receives only `ADD_TO_CART`.

It calls:

```txt
POST https://jewelry-configurator-app-44j3g.kinsta.app/api/create-product-shopify
```

Headers:

- `shop: {{ shop.permanent_domain }}`
- `token: kirbStoreTokenJewelith`

Body:

```js
{
  product: productPayload,
  options: { includeMedia: !!event.data.Media }
}
```

The backend validates:

```txt
StoreData.findOne({ store_url: shop })
StoreData.store_token === token
```

Then it:

1. finds or creates a placeholder Shopify product:
   - title: `Jewelith Configurator Placeholder`
   - SKU: `JEWELITH-CONFIG`
   - tag: `jewelith-configurator-placeholder`
2. duplicates the placeholder product, but the inspected function does not use the duplicated product as the returned cart item;
3. updates the placeholder product title/body/tags/status;
4. updates its first variant price/SKU;
5. waits for the variant price to update;
6. optionally uploads base64 image media;
7. optionally writes product metafield:
   - namespace: `jewelith`
   - key: `model_preview_url`
   - type: `url`
8. returns `{ data: productCreated, variantId }`.

Liquid then calls Shopify storefront AJAX:

```txt
POST {storefront-origin}/cart/add.js
```

Body:

```js
{
  id: variantId,
  quantity: 1,
  properties: {
    "Metal Type": event.data.MetalType,
    "Purity": event.data.Purity,
    "Ring Size": event.data.RingSize,
    "Configuration Image": event.data.ImageUrl,
    "Engraving": event.data.Engraving,
    "Engraving Font": event.data.EngravingFont
  }
}
```

Then it redirects to:

```txt
https://{{ shop.permanent_domain }}/cart
```

### Shopify vs WordPress

Only the Shopify Add to Cart path was found. No WordPress cart endpoint or WooCommerce cart integration was found in the inspected code.

### Bundle/separate line item behavior

The current original Shopify flow creates/adds one Shopify variant for the full configured ring payload. It does not add a separate diamond item. The payload includes `DiamondCategory` and `DiamondCarat`, but no final diamond id/SKU was found in this cart flow.

## Section 7: Theme Selection and URL Handling

### Original/Liquid theme handling

The Liquid extension exposes only a visual `themeColor` setting. It does not select configurator UI themes.

The Liquid runtime sets:

```js
iframe.src = baseUrl + window.location.search;
```

So any Theme 3 selection would need to come from either:

- the backend returning an iframe URL that already includes `?theme=theme-3&flow=3B`, or
- the Shopify page URL having those query params, or
- new Liquid/backend logic to append them safely.

No code was found that stores Default, Bon Gioielli, Theme 3A, or Theme 3B selections in the original backend database.

### New standalone Theme 3 URL handling

New standalone file:

```txt
Jewelry-configurator-rb/src/lib/ring-configurator/configuratorConfig.js
```

Supported themes:

- `default`
- `theme-3`

Supported flow aliases:

- `3A` → `setting-only`
- `3B` → `diamond-preview`
- `SETTING-ONLY` → `setting-only`
- `DIAMOND-PREVIEW` → `diamond-preview`

Supported public URLs:

- `/`
- `/?theme=theme-3&flow=3A`
- `/?theme=theme-3&flow=3B`

Parent config can also supply:

```js
window.__parentConfig?.configurator
```

or direct parent config fields.

### Theme 3 production URL decision

Current demo/overview HTML in the standalone repo uses:

```txt
https://next-frontend-app-one.vercel.app/?theme=theme-3&flow=3B
```

Current production Liquid code uses:

```txt
https://jewelry-configurator-app-44j3g.kinsta.app
```

Therefore Theme 3 production selection is not yet integrated. A senior/backend decision is required on whether Shopify Liquid should:

1. keep using original Kinsta app and add Theme 3 there;
2. point to the new standalone deployment for Theme 3;
3. have `/api/get-data` return different iframe URLs per store/page/theme;
4. pass `theme`/`flow` in parent config or query params.

## Section 8: Comparison With `Jewelry-configurator-rb`

### What matches

The new standalone app preserves the original local/static pricing structure:

- `public/data/price-config-data.json`
- `priceApiClient.js`
- `priceConfig.js`
- `utility/storePriceHelper.js`
- `utility/Parentconfig.js`
- `utility/calculateFInalRingDiamondPrice.js`

It also preserves parent URL based store behavior and Base64 `config` share URL behavior.

### New standalone preparation already present

`Jewelry-configurator-rb/.env.example` contains placeholders:

- `NEXT_PUBLIC_RING_CONFIG_API_URL`
- `NEXT_PUBLIC_RING_PRICING_API_URL`
- `NEXT_PUBLIC_RING_SAVE_CONFIG_API_URL`
- `NEXT_PUBLIC_RING_CONTINUE_API_URL`
- `NEXT_PUBLIC_RING_CART_API_URL`

`src/lib/ring-configurator/api/ringConfiguratorBackendClient.js` exports safe, non-wired functions:

- `fetchBackendConfig()`
- `calculateBackendPrice()`
- `saveBackendConfiguration()`
- `continueToRingBuilder()`
- `addConfiguredRingToCart()`

If an env URL is missing, each function returns a skipped/local fallback result. No remote call is active by default.

`src/lib/ring-configurator/utility/theme3Payload.js` exports:

- `buildTheme3ConfigurationPayload()`
- `buildTheme3PricingPayload()`
- `buildTheme3HandoffPayload()`

These are preparation-only and not backend-authoritative.

### Current new Choose Diamond / continuation flow

Theme 3 `RingCustomizer.jsx` builds a `ring-configurator:continue` payload on Choose Diamond.

It includes:

- theme/flow
- style/setting/head
- shape/carat/stone type
- cut/clarity for diamond modes
- selected quality
- diamond origin for diamond modes
- colored diamond/gemstone fields conditionally
- metal color/purity/platinum
- bi-metal/head accent
- ring size system/size/mm/price
- matching band
- engraving
- subtotal
- diamond preview price
- preview total
- currency

If top-level, it shows a local message:

```txt
Your setting is ready. Open this configurator inside Ring Builder to continue to diamond selection.
```

If embedded, it posts to parent origin derived from `document.referrer || parent`.

### Current new Share behavior

Theme 3 share builds a URL with:

- `theme=theme-3`
- `flow=3A` or `flow=3B`
- `config=<Base64 JSON>`

The `config` includes current Theme 3 selections such as ring colors, metal, head, shank, side setting, matching band, bi-metal, size, engraving, shape, carat, selected quality, diamond type, active tab, colored diamond, intensity, and gemstone.

### Existing APIs that can be reused directly

Possibly reusable, with adaptations:

- `/api/get-data`: could return the new standalone Theme 3 URL instead of the old app URL, or include theme/flow configuration.
- `/api/create-product-shopify`: could be reused for Shopify cart only if the new app emits the old `ADD_TO_CART` payload shape or the backend is updated to accept the new Theme 3 payload.
- `/api/ring-ai/resolve`: could be reused if CORS/origin/env are configured and the new app points `NEXT_PUBLIC_RING_AI_API_URL` to an approved endpoint. The new app already keeps remote AI optional.

Not directly reusable as-is:

- Relative `/api/...` calls from the separately deployed standalone app. If `Jewelry-configurator-rb` is hosted separately, a relative `/api/create-product-shopify` or `/api/get-data` would hit the standalone deployment, not the original Kinsta backend, unless those routes are copied/proxied.
- Existing cart flow expects Shopify Liquid parent to handle `ADD_TO_CART`. The new Theme 3 currently emits `ring-configurator:continue`, not `ADD_TO_CART`.
- Existing backend cart route trusts frontend `Price`; production server-authoritative pricing needs a new/confirmed pricing contract.

### CORS/auth/origin issues

Current original middleware sets:

```txt
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: ..., shop, token
```

This is permissive for cross-origin calls, but production should confirm allowed origins before wiring a separately hosted standalone app.

Current Liquid postMessage uses `"*"` and does not validate `event.origin`. Production Theme 3 integration should use explicit origins where possible.

### Payload mismatches

Old `ADD_TO_CART` payload:

- flat cart fields: `Title`, `Description`, `Price`, `DiamondCategory`, `DiamondCarat`, `MetalType`, `Purity`, `RingSize`, `Engraving`, `EngravingFont`, `Media`, `ModelPreviewUrl`

New Theme 3 handoff payload:

- structured setting/stone/metal/ring size/matching band/engraving fields;
- no final diamond id/SKU;
- local/demo `previewTotal`;
- intended for Choose Diamond continuation, not direct cart.

Backend Add to Cart should not be wired until the final cart payload contract is confirmed.

### New repo files likely needing future changes

When implementation starts, likely files:

- `src/lib/ring-configurator/configuratorConfig.js`
- `src/lib/ring-configurator/contexts/ShareContext.jsx`
- `src/lib/ring-configurator/utility/Parentconfig.js`
- `src/lib/ring-configurator/priceApiClient.js`
- `src/lib/ring-configurator/priceConfig.js`
- `src/lib/ring-configurator/utility/storePriceHelper.js`
- `src/lib/ring-configurator/utility/theme3Payload.js`
- `src/lib/ring-configurator/api/ringConfiguratorBackendClient.js`
- `src/lib/ring-configurator/RingCustomizer.jsx`
- possibly `src/lib/ring-configurator/assistant/ringAssistantResolver.js` only for endpoint config, not resolver logic

If backend routes are copied into the standalone app, also:

- `src/app/api/...`
- database/model/helper equivalents
- server env configuration

## Section 9: Recommended First Implementation

Recommended first vertical slice:

```txt
store identity
→ backend/store config fetch
→ one real store-specific pricing quote for the full current Theme 3 configuration
→ preserve local fallback
```

Why this first:

- It tests the most important production seam without touching cart.
- It validates store identity (`shop`, `parentUrl`, `token`, store/tenant id).
- It validates CORS/origin/auth with the new standalone app.
- It lets Theme 3 keep local/static pricing if backend fails.
- It avoids premature Add to Cart work before final diamond selection and cart ownership are confirmed.

Suggested phases:

1. Store identification/config
   - Confirm how the new app receives `shop`, `token`, `parentUrl`, `theme`, and `flow`.
   - Add safe parsing into standalone state/context.
   - Keep local fallback.

2. Pricing integration
   - Use `buildTheme3PricingPayload()`.
   - Call an approved pricing endpoint only when configured.
   - Backend returns server-authoritative quote, line items, total, currency, and `quoteId`.
   - Fallback to local pricing on approved failure mode.

3. Add to Cart
   - Do not use local preview totals as final cart totals.
   - Require `configurationId`, `quoteId`, final diamond id/SKU, setting SKU/variant mapping, cart/session/customer context.
   - Decide whether Shopify Liquid parent continues to own `/cart/add.js`, or the backend/cart API owns the whole add flow.

4. Liquid Theme 3 URL integration
   - Update `/api/get-data` or Liquid to load the correct Theme 3 URL.
   - Prefer backend-controlled iframe URL per store/page/theme.
   - Avoid exposing raw demo URLs as production integration URLs.

5. Ring Builder Theme 3A integration
   - Confirm destination for Choose Diamond.
   - Send saved config/quote to Ring Builder Step 2.
   - Preserve `/?theme=theme-3&flow=3A` behavior.

6. Client models when assets arrive
   - Add only after model files, texture files, option mapping, compatibility rules, and SKU/pricing IDs are confirmed.

## Section 10: Exact Questions / Blockers

Questions that cannot be safely answered from code:

1. What is the approved backend base URL for the new standalone app to call?
2. Should Theme 3 production use the original Kinsta app, the new standalone deployment, or a new backend/frontend deployment?
3. Should `/api/get-data` be extended to return Theme 3A/3B URLs per store/page?
4. What exact query params should select Theme 3A vs Theme 3B in Shopify production?
5. Should Liquid pass `theme`/`flow` through query params, through `window.__parentConfig`, or through backend-returned iframe URLs?
6. Which Shopify test store should be used for Theme 3 integration?
7. Is there any WordPress/WooCommerce test store and existing cart endpoint? None was found in this code.
8. Should backend pricing replace all local pricing, or only selected parts such as metal/setting/diamond?
9. Should preview stone pricing remain demo/local, or should the backend quote preview stone too?
10. What currency, tax, discount, markup, and rounding rules should be server-authoritative?
11. What field identifies a store in the new backend contract: `shop`, `storeId`, tenant slug, parent URL, API key, or token?
12. Should `store_token` continue to be used as frontend/backend auth, or should there be a different signed/session token?
13. Which origins are allowed to embed the configurator and receive postMessage events?
14. Should production postMessage target origins be strict instead of `"*"`?
15. What happens if backend pricing/config fails: local fallback, limited mode, or block checkout?
16. Should existing Base64 `config` share URLs remain supported after backend save/share is added?
17. Should sharing create a backend `configurationId`, or continue using encoded config in the URL?
18. What is the exact Choose Diamond destination: parent `postMessage`, redirect URL, Ring Builder route, or backend session?
19. What fields must be carried into actual diamond selection Step 2?
20. Is Add to Cart allowed from setting-only flow, or only after final diamond selection?
21. Should cart contain one bundled product line item or separate ring setting and diamond line items?
22. What SKU/variant/product IDs map to shank, head, metal, purity, ring size, matching band, engraving, and final diamond?
23. Does the backend need to create/update Shopify placeholder products, or should it use existing product variants?
24. Should the old `create-product-shopify` placeholder product strategy be kept? It currently updates and returns the placeholder variant and also duplicates the product without using the duplicate as the cart variant.
25. Who owns final server-authoritative totals: Jewelith backend, Shopify, external pricing service, or Ring Builder backend?
26. What credentials/envs are available for staging/prod: MongoDB, Shopify Admin token, Cloudflare AI, backend host, allowed origins?
27. Are client 3D models static bundled assets, encrypted `.enc` assets, or backend-managed assets?
28. Who validates model scale/origin/pivot/head/stone/shank compatibility before deployment?

## Section 11: Implementation Readiness

### Fully understood from code

- Shopify Liquid iframe injection flow.
- Store/page enablement via `/api/get-data`.
- Store identity fields: `shop`, `store_url`, `store_token`, `parentUrl`.
- Original Shopify Add to Cart bridge using `ADD_TO_CART` postMessage.
- Backend placeholder product/variant creation/update route.
- Current local/static pricing flow and fallback config.
- New standalone Theme 3 URL and flow selection.
- New standalone Theme 3 share and Choose Diamond handoff payload.
- New standalone non-wired backend client scaffolding and payload helper.
- Current 3D model loading mechanism uses static encrypted model paths and `fetchDecrypted()`.

### Can be implemented immediately after approval

- Teach new standalone app to preserve and normalize Shopify parent data (`shop`, `token`, `parentUrl`) in a central store/context.
- Extend `/api/get-data` or Liquid to produce/load a Theme 3 URL, if the deployment URL and Theme 3 selection strategy are confirmed.
- Wire a backend config fetch behind env flags with local fallback.
- Wire a backend pricing quote behind env flags with local fallback, using existing Theme 3 payload helper.
- Normalize old/new payload shapes for a future backend quote/cart API.

### Requires Sachin Sir/CEO/backend confirmation

- Final backend ownership and deployed base URL.
- Whether old APIs are reused, copied, proxied, or replaced.
- Store/auth/token contract.
- Pricing authority and quote schema.
- Add to Cart ownership and cart item structure.
- Ring Builder Step 2 handoff target and fields.
- Theme 3A/3B production URL strategy.
- Allowed iframe/postMessage origins.
- Client model asset intake and SKU/compatibility mapping.

### Estimated files to modify later in `Jewelry-configurator-rb`

- `.env.example`
- `src/lib/ring-configurator/api/ringConfiguratorBackendClient.js`
- `src/lib/ring-configurator/utility/theme3Payload.js`
- `src/lib/ring-configurator/contexts/ShareContext.jsx`
- `src/lib/ring-configurator/utility/Parentconfig.js`
- `src/lib/ring-configurator/priceApiClient.js`
- `src/lib/ring-configurator/priceConfig.js`
- `src/lib/ring-configurator/utility/storePriceHelper.js`
- `src/lib/ring-configurator/RingCustomizer.jsx`
- possibly `src/app/api/...` only if backend routes are moved/proxied into the standalone app

### Risks of copying APIs versus calling existing deployed APIs

Calling existing deployed APIs:

- Lower code duplication.
- Keeps Shopify/MongoDB/Admin API logic in one backend.
- Requires CORS/origin/auth confirmation.
- Requires stable deployed backend base URL.
- Relative `/api/...` will not work from a separate standalone deployment unless proxied.

Copying APIs into the new app:

- More self-contained deployment.
- Higher risk: secrets, MongoDB models, Shopify OAuth/Admin API setup, middleware/CORS, subscriptions, and install/admin flows would need to be replicated safely.
- More maintenance burden because original backend changes would need to be kept in sync.

Recommended direction: do not copy backend APIs first. Start by calling or proxying an approved backend contract from the standalone app, behind env flags and with local fallback.

## Files and Folders Inspected

### Liquid repo

- `Jewelry-configurator-liquid/shopify.app.toml`
- `Jewelry-configurator-liquid/shopify.app.engagement-ring-builder.toml`
- `Jewelry-configurator-liquid/extensions/theme-extension/blocks/ring-configurator.liquid`
- `Jewelry-configurator-liquid/extensions/theme-extension/assets/load-app.js`
- `Jewelry-configurator-liquid/extensions/theme-extension/assets/kirb-css.css`

### Original app/backend repo

- `Jewelry-configurator/src/app/api/get-data/route.js`
- `Jewelry-configurator/src/app/api/create-product-shopify/route.js`
- `Jewelry-configurator/src/app/api/save-data/route.js`
- `Jewelry-configurator/src/app/api/get-plan-info/route.js`
- `Jewelry-configurator/src/app/api/get-embed/route.js`
- `Jewelry-configurator/src/app/api/get-version/route.js`
- `Jewelry-configurator/src/app/api/ring-ai/resolve/route.js`
- `Jewelry-configurator/src/app/api/*/route.js` inventory
- `Jewelry-configurator/src/app/lib/db.js`
- `Jewelry-configurator/src/app/lib/common.js`
- `Jewelry-configurator/src/app/lib/model/storedata.js`
- `Jewelry-configurator/src/app/lib/model/pagesetting.js`
- `Jewelry-configurator/src/app/lib/model/subscriptions.js`
- `Jewelry-configurator/src/middleware.js`
- `Jewelry-configurator/src/app/(main)/home/setting/page.js`
- `Jewelry-configurator/src/app/component/arvto.js`
- `Jewelry-configurator/frontend_app/src/ring-configurator/components/summary/Summary.jsx`
- `Jewelry-configurator/frontend_app/src/ring-configurator/priceApiClient.js`
- `Jewelry-configurator/frontend_app/src/ring-configurator/priceConfig.js`
- `Jewelry-configurator/frontend_app/src/ring-configurator/utility/storePriceHelper.js`
- `Jewelry-configurator/frontend_app/src/ring-configurator/utility/calculateFInalRingDiamondPrice.js`
- `Jewelry-configurator/frontend_app/src/ring-configurator/utility/Parentconfig.js`
- `Jewelry-configurator/frontend_app/src/ring-configurator/contexts/ShareContext.jsx`
- `Jewelry-configurator/frontend_app/src/ring-configurator/Scene.jsx`
- `Jewelry-configurator/frontend_app/public/data/price-config-data.json`

### New standalone repo

- `Jewelry-configurator-rb/.env.example`
- `Jewelry-configurator-rb/src/app/page.js`
- `Jewelry-configurator-rb/src/lib/ring-configurator/RingConfigurator.jsx`
- `Jewelry-configurator-rb/src/lib/ring-configurator/RingCustomizer.jsx`
- `Jewelry-configurator-rb/src/lib/ring-configurator/configuratorConfig.js`
- `Jewelry-configurator-rb/src/lib/ring-configurator/priceApiClient.js`
- `Jewelry-configurator-rb/src/lib/ring-configurator/priceConfig.js`
- `Jewelry-configurator-rb/src/lib/ring-configurator/utility/storePriceHelper.js`
- `Jewelry-configurator-rb/src/lib/ring-configurator/utility/Parentconfig.js`
- `Jewelry-configurator-rb/src/lib/ring-configurator/utility/calculateFInalRingDiamondPrice.js`
- `Jewelry-configurator-rb/src/lib/ring-configurator/utility/theme3Payload.js`
- `Jewelry-configurator-rb/src/lib/ring-configurator/api/ringConfiguratorBackendClient.js`
- `Jewelry-configurator-rb/src/lib/ring-configurator/contexts/RingContext.jsx`
- `Jewelry-configurator-rb/src/lib/ring-configurator/contexts/DiamondContext.jsx`
- `Jewelry-configurator-rb/src/lib/ring-configurator/contexts/SectionContext.jsx`
- `Jewelry-configurator-rb/src/lib/ring-configurator/contexts/ShareContext.jsx`
- `Jewelry-configurator-rb/src/lib/ring-configurator/utility/modelLoader.js`
- `Jewelry-configurator-rb/src/lib/ring-configurator/objects/Ring.jsx`
- `Jewelry-configurator-rb/src/lib/ring-configurator/objects/Head.jsx`
- `Jewelry-configurator-rb/src/lib/ring-configurator/objects/MatchingBand.jsx`
- `Jewelry-configurator-rb/src/lib/ring-configurator/objects/Diamond.jsx`
- `Jewelry-configurator-rb/public/data/price-config-data.json`
- `Jewelry-configurator-rb/src/lib/ring-configurator/data/data.json`
- `Jewelry-configurator-rb/src/lib/ring-configurator/data/api-data.json`
