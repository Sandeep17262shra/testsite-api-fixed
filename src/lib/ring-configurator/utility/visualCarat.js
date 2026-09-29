// ─── Visual carat ───────────────────────────────────────────────────────────
// The ONE number every carat-driven size term reads: the stone's own scale
// (Diamond.jsx), the head's width (Head.jsx) and the finished assembly's scale
// (Scene.jsx). They must all read the same value or the head stops matching the
// stone it holds.
//
// It is NOT the carat weight. Weight still drives price, copy and the summary -
// a 5ct stone is still sold, priced and labelled as 5ct. This is only how big
// that weight is DRAWN.
//
// Why the two are not the same above 2.5ct: the models' size terms are close to
// linear in carat, but real stones are not. Weight goes with the CUBE of the
// diameter, so a 5ct round is only about 1.36x the spread of a 2ct - roughly
// 8.2mm vs 11.1mm - while a linear ramp draws it as though it were 2.5x. The
// top of the slider was reading as a boulder that swallowed the band.
//
// So the ramp is held as authored up to KNEE_CARAT and then compressed:
//
//   visual = KNEE + (carat - KNEE) * COMPRESSION
//
// COMPRESSION is set so 5ct is drawn at the size 3.5ct used to be, which is
// where the proportion against the shank was judged right:
//
//   COMPRESSION = (3.5 - 2.5) / (5 - 2.5) = 0.4
//
//   carat  2.0   2.5   3.0   3.5   4.0   4.5   5.0
//   drawn  2.00  2.50  2.70  2.90  3.10  3.30  3.50
//
// Continuous at the knee (both branches give 2.5) and still monotonic, so the
// slider never stalls or steps - every increment above 2.5ct still visibly
// grows the stone, just at a rate closer to what carat actually means.
const KNEE_CARAT = 2.5;
const COMPRESSION = 0.4;

export function getVisualCarat(carat) {
  const weight = Number(carat);
  if (!Number.isFinite(weight)) return carat;
  if (weight <= KNEE_CARAT) return weight;
  return KNEE_CARAT + (weight - KNEE_CARAT) * COMPRESSION;
}

// ─── Head growth above the knee ─────────────────────────────────────────────
// Feeding one number into every size term makes a 5ct ring render EXACTLY as
// 3.5ct used to - stone, basket and all - which also carries over 3.5ct's
// head-to-stone proportion. That proportion always ran slightly basket-heavy;
// compressing the top of the slider just moved it into view, so above the knee
// the head is grown at a fraction of the rate the stone is.
//
// Only the head reads this. The stone and the assembly stay on getVisualCarat,
// so the basket closes on the stone rather than the stone shrinking again.
//
//   carat        3.0    3.5    4.0    4.5    5.0
//   stone reads  2.70   2.90   3.10   3.30   3.50
//   head reads   2.62   2.74   2.86   2.98   3.10
//
// Turn HEAD_GROWTH down for a tighter basket, up for a looser one. At 1 the
// head tracks the stone exactly (the behaviour before this constant existed);
// it must stay well above 0 or the basket stops being able to hold the stone.
const HEAD_GROWTH = 0.6;

export function getVisualCaratForHead(carat) {
  const drawn = getVisualCarat(carat);
  if (!Number.isFinite(drawn) || drawn <= KNEE_CARAT) return drawn;
  return KNEE_CARAT + (drawn - KNEE_CARAT) * HEAD_GROWTH;
}

// ─── Per-design head trim ───────────────────────────────────────────────────
// HEAD_GROWTH above applies to every head. Some individual heads need more:
// the Amélie and the Élan are built around a marquise, which is long and
// narrow, so their baskets carry much more metal past the girdle than a round
// one does. On the compressed ramp that surplus reads as a basket the stone
// rattles around in well before the top of the slider.
//
// A design opts in with `headTrimAboveKnee` (see data/diamondwiseDesigns.js):
// the fraction to take off its head by the top of the carat range, ramped in
// linearly from the knee so nothing steps at 2.5ct. 0.06 means "6% smaller at
// 5ct, nothing at 2.5ct, half of it at 3.75ct".
//
// It multiplies the head's finished SCALE rather than remapping its carat, so
// it is predictable: the cube-root curve these heads use is so flat at the top
// that a carat remap barely moves them. The seat the stone sits in is derived
// from that same scale, so the stone follows the basket down automatically.
const TRIM_FULL_AT_CARAT = 5;

export function getHeadTrimFactor(carat, trimAtTop) {
  const weight = Number(carat);
  if (!trimAtTop || !Number.isFinite(weight) || weight <= KNEE_CARAT) return 1;
  const progress = Math.min((weight - KNEE_CARAT) / (TRIM_FULL_AT_CARAT - KNEE_CARAT), 1);
  return 1 - trimAtTop * progress;
}

export default getVisualCarat;

// ─── HALO head carat tiers ──────────────────────────────────────────────────
