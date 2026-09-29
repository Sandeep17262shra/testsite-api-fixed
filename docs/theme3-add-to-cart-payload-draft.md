# Theme 3 Add to Cart Payload Draft

Date: 2026-08-01

Scope: documentation only. This file does not implement Add to Cart or backend calls.

## Current Status

Theme 3 currently uses a `Choose Diamond` continuation flow.

- Theme 3A is setting-only and continues toward diamond selection.
- Theme 3B uses a preview stone and continues toward actual diamond selection.
- There is no real Add to Cart integration in the Theme 3 configured-ring flow yet.
- Current pricing remains local/demo pricing until a backend quote API is approved.

## Recommended Production Flow

Recommended flow for production, pending senior/backend confirmation:

1. Configurator
2. Backend quote/save
3. Choose Diamond
4. Final diamond selection
5. Review configured ring + selected diamond
6. Add to Cart

This keeps the ring setting configuration separate from the final center diamond selection, and allows the backend to produce a server-authoritative quote before cart insertion.

## Required Add to Cart Payload Fields

### Store/client context

- `storeId` or tenant identifier
- `clientId`, if applicable
- `parentUrl` or embed origin, if still used
- `currency`
- `locale`
- `country`
- `channel`
- `allowedOrigin` or source domain, if required

### Backend references

- `configurationId`
- `quoteId`
- `cartId`, if adding to an existing cart
- `sessionId` or customer/session token, if required

### Final diamond fields

- `finalDiamondId`
- `finalDiamondSku`
- `finalDiamondType`
- `finalDiamondShape`
- `finalDiamondCarat`
- `finalDiamondCut`
- `finalDiamondClarity`
- `finalDiamondColor`
- `finalDiamondPrice`
- inventory/source reference, if applicable

### Ring setting fields

- `ringSettingSku`
- `ringSettingVariantId`
- `ringShank`
- `ringShankOptionId`
- `ringHead`
- `ringHeadOptionId`
- `ringSideSetting`
- `ringSideSettingOptionId`
- `ringMatchingBand`
- `ringMatchingBandOptionId`
- `ringBand`
- `matchingBandQuantity`
- `matchingBandStyle`

### Metal and purity fields

- `metal`
- `metalOptionId`
- `purity`
- `purityOptionId`
- `platinum`
- `ringColor`
- `headColor`
- `bandColor`
- `biMetalEnabled`
- `headAccentMetal`
- `headAccentMetalOptionId`

### Ring size fields

- `ringSizeSystem`
- `ringSize`
- `ringSizeMm`
- `ringSizeOptionId`

### Engraving fields

- `engravingEnabled`
- `engravingText`
- `engravingFont`
- `engravingFontOptionId`
- `engravingSymbol`
- `engravingSymbolOptionId`

### Readable line item properties

These are useful for cart display, order admin, email templates, and customer review:

- Ring style label
- Head/setting label
- Metal color label
- Purity/karat label
- Ring size display label
- Matching band display label
- Bi-metal/head accent display label
- Engraving display text/font/symbol
- Final diamond readable summary
- Configuration summary URL or ID

### Pricing fields

- `finalServerAuthoritativeTotal`
- `settingSubtotal`
- `diamondSubtotal`
- `matchingBandSubtotal`
- `engravingSubtotal`
- `tax`
- `discount`
- `shipping`, if applicable
- `currency`
- `quoteExpiresAt`

Important: frontend local/demo totals should not be used as final cart totals.

### Cart/session/customer fields

- `cartId`
- `sessionId`
- `customerId`, if logged in
- `anonymousId`, if guest
- `checkoutUrl`, if returned by backend
- `cartLineItemProperties`

## Unknowns Requiring Senior Confirmation

- Which system owns cart insertion?
- Which commerce platform or custom cart should receive the final configured item?
- Should the ring setting and final diamond be one bundled line item or two separate line items?
- What are the canonical SKU/product/variant IDs for every configurable option?
- Is setting-only Add to Cart allowed, or must the user choose a final center diamond first?
- Is a backend quote required before Add to Cart?
- Who validates quote expiration and price changes?
- Should Add to Cart be allowed if backend pricing fails?
- Should engraving be represented as a product option, line item property, or separate service item?
- Should matching bands be included in the same bundle or as separate line items?
- What fields are required for order management, fulfillment, and customer email templates?
- Should the cart payload include a preview image/render snapshot?

