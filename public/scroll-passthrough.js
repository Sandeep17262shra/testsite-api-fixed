/**
 * iframe scroll passthrough — drop this script onto any parent page that
 * embeds a ring / bracelet / necklace configurator iframe. It listens for
 * scroll-delta messages and forwards them via window.scrollBy().
 * Works cross-origin.
 *
 * Usage (HTML):
 *   <script src="/scroll-passthrough.js" defer></script>
 *
 * Usage (Shopify theme.liquid):
 *   {{ 'scroll-passthrough.js' | asset_url | script_tag }}
 *
 * It also forwards configurator query parameters from the parent page to the
 * embedded configurator. This is required for shared model-preview URLs on
 * storefronts that use a static iframe `src` (including the WordPress bridge).
 */
(function () {
  var pending = 0;
  var raf = 0;

  function forwardConfiguratorQuery() {
    var frame = document.getElementById("kijs-configurator-frame")
      || document.getElementById("kijs-necklace-configurator-frame")
      || document.getElementById("rCFrameKIRB");
    if (!frame || !frame.getAttribute("src")) return;

    var parentParams = new URLSearchParams(window.location.search);
    var keys = ["config", "preview", "theme", "flow", "showDiamondFilters"];
    var hasConfiguratorParams = keys.some(function (key) {
      return parentParams.has(key);
    });
    if (!hasConfiguratorParams) return;

    try {
      var frameUrl = new URL(frame.getAttribute("src"), window.location.href);
      keys.forEach(function (key) {
        if (parentParams.has(key)) {
          frameUrl.searchParams.set(key, parentParams.get(key));
        }
      });

      if (frame.src !== frameUrl.toString()) {
        frame.src = frameUrl.toString();
      }
    } catch (error) {
      console.warn("Unable to forward configurator query parameters", error);
    }
  }

  function flush() {
    raf = 0;
    if (pending) {
      window.scrollBy(0, pending);
      pending = 0;
    }
  }

  window.addEventListener("message", function (e) {
    if (!e.data) return;
    var type = e.data.type;
    if (type !== "ring-configurator:scroll" &&
        type !== "bracelet-configurator:scroll" &&
        type !== "necklace-configurator:scroll") return;
    pending += e.data.deltaY || 0;
    if (!raf) raf = requestAnimationFrame(flush);
  });

  forwardConfiguratorQuery();
})();
