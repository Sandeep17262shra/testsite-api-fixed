import data from '../data/data.json';
import initialPrice from '../data/data.json'

import { 
  getMetalPrice, 
  getShankPrice, 
  getHeadPrice, 
  getMatchingBandPrice,
  getEngravingPrice,
  getSideStonePrice,
  getBandWidthPrice
} from './storePriceHelper';

const THREE_STONE_HEAD_KEYS = new Set(["OVAL", "TRAPEZOID", "HALF-MOON", "PEAR", "BAGUETTE", "ROUND", "THREE-STONE"]);
const BAND_WIDTH_SHANKS = new Set(["WIDE-PLAIN", "CATHEDRAL", "SIDE-BEZEL-STONES"]);

export const calculateFinalRingPrice = (
  metal, 
  ringHeadStyle, 
  ringShank, 
  ringSideSetting, 
  ringBand, 
  bandWidth = "2mm", 
  styleShape = "D",
  engraving = "",
  parentUrl = null,
  threestone = ""
) => {
  const normHead = String(ringHeadStyle || "").toUpperCase();
  const isThreeStone = THREE_STONE_HEAD_KEYS.has(normHead);
  const sideStonePrice = isThreeStone && threestone ? getSideStonePrice(parentUrl, threestone) : 0;
  const bandWidthPrice = BAND_WIDTH_SHANKS.has(String(ringShank || "").toUpperCase())
    ? getBandWidthPrice(parentUrl, bandWidth)
    : 0;
  
  let breakdown = {
    metalPrice: getMetalPrice(parentUrl, metal),
    ringShankPrice: getShankPrice(parentUrl, ringShank),
    ringHeadStylePrice: getHeadPrice(parentUrl, ringHeadStyle),
    sideStonePrice,
    bandWidthPrice,
    matchingBandPrice: ringBand === "Yes" 
      ? getMatchingBandPrice(parentUrl, ringSideSetting) 
      : 0,
    ringSideSettingPrice: 0,
    engravingPrice: engraving 
      ? getEngravingPrice(parentUrl) 
      : 0
  };

  const finalPrice = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return { finalPrice, breakdown };
};
