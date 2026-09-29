/**
 * The body colour of every fancy-coloured diamond, per intensity.
 *
 * ONE definition, read by two places that must agree: Diamond.jsx tints the 3D
 * stone with it, and RingCustomizer.jsx tints the Intensity icons with it. If
 * they ever drifted apart the swatch would promise a shade the stone does not
 * show, which is exactly the thing a shopper picks on.
 */
export const FANCY_BASE_COLORS = {
  Blue: {
    Light: "#77B3D4",
    Fancy: "#4A90E2",
    Intense: "#2A5CAA",
    Vivid: "#0047AB",
    Deep: "#00008B",
    Dark: "#0A2351"
  },
  Green: {
    Light: "#88D4B4",
    Fancy: "#4AE2A1",
    Intense: "#2AAA60",
    Vivid: "#00AB55",
    Deep: "#008B45",
    Dark: "#0A5128"
  },
  Pink: {
    Light: "#F8B5D6",
    Fancy: "#FF85C8",
    Intense: "#E65AA9",
    Vivid: "#D1008F",
    Deep: "#8A0060",
    Dark: "#5A003F"
  },
  Purple: {
    Light: "#D4B5FF",
    Fancy: "#A45AFF",
    Intense: "#7A2CC9",
    Vivid: "#5A009D",
    Deep: "#3A0068",
    Dark: "#1E0033"
  },
  Peach: {
    Light: "#FFDAB9",
    Fancy: "#FFC996",
    Intense: "#FFB070",
    Vivid: "#FF9A50",
    Deep: "#E27D42",
    Dark: "#C46A35"
  },
  Yellow: {
    Light: "#FFE699",
    Fancy: "#FFD700",
    Intense: "#D4AF37",
    Vivid: "#B8860B",
    Deep: "#8B7500",
    Dark: "#5D4500"
  },
  Red: {
    Light: "#FF6B6B",
    Fancy: "#D32F2F",
    Intense: "#D32F2F",
    Vivid: "#B71C1C",
    Deep: "#7B0000",
    Dark: "#4A0000"
  },
  Orange: {
    Light: "#FFA94D",
    Fancy: "#FF8C00",
    Intense: "#FF8C00",
    Vivid: "#FF6A00",
    Deep: "#D45300",
    Dark: "#A84100"
  },
  Black: {
    Light: "#666666",
    Fancy: "#4D4D4D",
    Intense: "#333333",
    Vivid: "#1A1A1A",
    Deep: "#0D0D0D",
    Dark: "#000000"
  },
  Brown: {
    Light: "#D2B48C",
    Fancy: "#A0522D",
    Intense: "#8B4513",
    Vivid: "#6E2C00",
    Deep: "#5D2B00",
    Dark: "#4B2200"
  }
};
