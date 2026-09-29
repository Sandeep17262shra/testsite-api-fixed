/**
 * Composed client rings — 5 fixed head+shank sets, each its own named design
 * (e.g. "Amélie", "Isadora"). Selecting a design's head or shank always
 * selects the whole set; heads and shanks from different designs can never
 * be mixed (see handleDiamondWisePreset in RingCustomizer.jsx).
 *
 * Add a ring by placing its two GLBs in `public/3d-models/DIAMONDWISE/custom-rings/`
 * and adding one entry below.
 */
export const DIAMONDWISE_DESIGN_NONE = "";

/**
 * Fine-tune a DiamondWise design's own head/shank attachment after the
 * automatic alignment. Each design is a fixed head+shank set (no mixing
 * across designs), so this is keyed by head id only — the value applies to
 * that head paired with its own matching shank. Values are in scene units:
 * negative moves the head down, positive moves it up. Add an entry only
 * when a design needs it.
 */
export const DIAMONDWISE_HEAD_SHANK_Y_OFFSETS = Object.freeze({
  "dw-jul-ma-02-head": -0.05,
  "dw-ju-m-0031-head": 0,
  "dw-mar-ma-019-head": 0,
  "dw-LR1046-head": 0,
  "dw-JAN027-head": 0,
});

export const DIAMONDWISE_DESIGNS = Object.freeze([
  Object.freeze({
    id: "diamondwise-jul-ma-02",
    label: "The Amélie",
    client: "DiamondWise",
    shankId: "dw-jul-ma-02-shank",
    shankLabel: "Amelie",
    headId: "dw-jul-ma-02-head",
    headLabel: "Amelie",
    shankImage: "/images/dw-bands/ring1.webp?v3",
    headImage: "/images/dw-heads/amelie.png",
    shankModelPath: "/3d-models/DIAMONDWISE/custom-rings/JUL_MA_02_SHANK.glb",
    headModelPath: "/3d-models/DIAMONDWISE/custom-rings/JUL_MA_02_HEAD_1.glb",
    defaultShape: "marquise",
    modelScale: 0.3,
    referenceCarat: 10,
    headAttachmentY: 10,
    headStoneCenter: Object.freeze([0, 14.6, 0]),
    // Marquise basket. The trim sets where the head lands at 5ct, which is
    // the size this basket wants; the ramp then fixes the shape below it -
    // the stacked curves used to peak at 2.5ct and come back down, leaving
    // 1ct-2.5ct visibly wide. See getHeadTrimFactor in utility/visualCarat.js
    // and rampHeadScale in objects/DiamondWiseRing.jsx.
    headTrimAboveKnee: 0.06,
    headScaleRamp: Object.freeze({ fromCarat: 1, toCarat: 5 }),
    minHeadScaleRatio: 0.45,
  }),
  Object.freeze({
    id: "diamondwise-ju-m-0031",
    label: "The Élan",
    client: "DiamondWise",
    shankId: "dw-ju-m-0031-shank",
    shankLabel: "Elan ",
    headId: "dw-ju-m-0031-head",
    headLabel: "Elan ",
    shankImage: "/images/dw-bands/ring2.webp?v3",
    headImage: "/images/dw-heads/elan.png",
    shankModelPath: "/3d-models/DIAMONDWISE/custom-rings/JU_M_0031_SHANK_1.glb",
    headModelPath: "/3d-models/DIAMONDWISE/custom-rings/JU_M_0031_HEAD.glb",
    defaultShape: "marquise",
    modelScale: 0.3,
    referenceCarat: 10,
    headAttachmentY: 10,
    headStoneCenter: Object.freeze([0, 14.95, -0.3]),
    // Marquise basket. The trim sets where the head lands at 5ct, which is
    // the size this basket wants; the ramp then fixes the shape below it -
    // the stacked curves used to peak at 2.5ct and come back down, leaving
    // 1ct-2.5ct visibly wide. See getHeadTrimFactor in utility/visualCarat.js
    // and rampHeadScale in objects/DiamondWiseRing.jsx.
    headTrimAboveKnee: 0.06,
    headScaleRamp: Object.freeze({ fromCarat: 1, toCarat: 5 }),
    minHeadScaleRatio: 0.45,
  }),
  Object.freeze({
    id: "diamondwise-mar-ma-019",
    label: "The Élanora",
    client: "DiamondWise",
    shankId: "dw-mar-ma-019-shank",
    shankLabel: "Elanora ",
    headId: "dw-mar-ma-019-head",
    headLabel: "Elanora ",
    shankImage: "/images/dw-bands/ring3.webp?v3",
    headImage: "/images/dw-heads/elanora.png",
    shankModelPath: "/3d-models/DIAMONDWISE/custom-rings/MAR_MA_019_SHANK.glb",
    headModelPath: "/3d-models/DIAMONDWISE/custom-rings/MAR_MA_019_HEAD.glb",
    defaultShape: "oval",
    modelScale: 0.3,
    referenceCarat: 10,
    headAttachmentY: 10,
    headStoneCenter: Object.freeze([0, 14, 0]),
    minHeadScaleRatio: 0.45,
  }),
    Object.freeze({
    id: "diamondwise-LR1046",
    label: "The Aurélie",
    client: "DiamondWise",
    shankId: "dw-LR1046-shank",
    shankLabel: "Estelle",
    headId: "dw-LR1046-head",
    headLabel: "Estelle",
    shankImage: "/images/dw-bands/ring4.webp?v3",
    headImage: "/images/dw-heads/aurelie.png",
    shankModelPath: "/3d-models/DIAMONDWISE/custom-rings/LR1046_Shank.glb",
    headModelPath: "/3d-models/DIAMONDWISE/custom-rings/LR1046_Head.glb",
    defaultShape: "oval",
    modelScale: 0.30,
    referenceCarat: 10,
    headAttachmentY: 10,
    headStoneCenter: Object.freeze([0, 13.45, 0]),
    minHeadScaleRatio: 0.45,
  }),
      Object.freeze({
    id: "diamondwise-JAN027",
    label: "The Isadora",
    client: "DiamondWise",
    shankId: "dw-JAN027-shank",
    shankLabel: "Celine",
    headId: "dw-JAN027-head",
    headLabel: "Celine ",
    shankImage: "/images/dw-bands/ring5.webp?v3",
    headImage: "/images/dw-heads/isadora.png",
    shankModelPath: "/3d-models/DIAMONDWISE/custom-rings/JAN027_Shank.glb",
    headModelPath: "/3d-models/DIAMONDWISE/custom-rings/JAN027_Head.glb",
    defaultShape: "emerald",
    modelScale: 0.3,
    referenceCarat: 10,
    headAttachmentY: 10,
    headStoneCenter: Object.freeze([0, 13.65, 0]),
    minHeadScaleRatio: 0.45,
  }),
]);

export const getDiamondWiseDesignById = (designId) =>
  DIAMONDWISE_DESIGNS.find((design) => design.id === designId) || null;

export const getDiamondWiseDesignByShankId = (shankId) =>
  DIAMONDWISE_DESIGNS.find((design) => design.shankId === shankId) || null;

export const getDiamondWiseDesignByHeadId = (headId) =>
  DIAMONDWISE_DESIGNS.find((design) => design.headId === headId) || null;

export const getDiamondWiseDesignByOptionId = (optionId) =>
  getDiamondWiseDesignById(optionId) ||
  getDiamondWiseDesignByShankId(optionId) ||
  getDiamondWiseDesignByHeadId(optionId);
