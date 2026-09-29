# Theme 3 Store Context Integration

## Current phase

This phase adds a centralized, non-breaking store/embed context layer for the standalone Theme 3 Ring Configurator. It does not enable backend calls, remote pricing, cart behavior, or visible UI changes.

## Source of store context

The latest Shopify Liquid integration sends the embedded configurator a parent message containing:

- `parentUrl`
- `shop`
- `token`

The standalone app now reads that payload in one place: `src/lib/ring-configurator/contexts/StoreContext.jsx`.

## Exposed context fields

`useStoreContext()` exposes:

- `parentUrl`
- `shop`
- `token`
- `parentOrigin`
- `theme`
- `flow`
- `showDiamondFilters`
- `isEmbedded`
- `isReady`
- `contextSource`

The token is kept only in runtime React state for future backend handoff. It is not logged, stored in local storage, written to query params, or sent anywhere by default.

## Fallback priority

Store context is resolved in this order:

1. Valid Shopify/store `postMessage` payload from the parent window.
2. `window.__parentConfig` when present.
3. `document.referrer` when embedded.
4. `window.location.href` for standalone/demo use.

Theme and flow continue to use the existing configurator config resolver so `theme-3`, `flow=3A`, and `flow=3B` aliases remain supported.

## Message safety

The message listener:

- Processes only messages from `window.parent`.
- Ignores unrelated message payloads.
- Accepts payloads with the expected store/context fields.
- Validates `event.origin` against the origin derived from `document.referrer` when available.
- Falls back to validating against the origin derived from the provided `parentUrl` if no trusted referrer origin exists.
- Handles repeated Liquid messages idempotently.

## Compatibility with existing helpers

`ShareContext` now receives its parent URL from `StoreContext`, keeping existing consumers that use `ShareContext.parent` unchanged.

Existing pricing, localization, assistant, share, and feature-guide helpers can continue receiving a normalized `parentUrl` through the same `ShareContext` path.

## Not implemented in this phase

- No backend API calls.
- No remote pricing activation.
- No cart/Add to Cart changes.
- No Choose Diamond behavior changes.
- No visible UI changes.
- No token persistence or logging.

## Future use

The central context can later be reused for:

- Store-specific option/config fetches.
- Backend quote/pricing requests.
- Save/share configuration APIs.
- Choose Diamond handoff.
- Add to Cart integration.
