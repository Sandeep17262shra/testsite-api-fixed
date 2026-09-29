import data from '../data/data.json';
import initialPrice from '../data/data.json'

import { 
  getMetalPrice, 
  getShankPrice, 
  getHeadPrice, 
  getMatchingBandPrice,
  getEngravingPrice 
} from './storePriceHelper';

export const calculateFinalRingPrice = (
  metal, 
  ringHeadStyle, 
  ringShank, 
  ringSideSetting, 
  ringBand, 
  bandWidth = "2mm", 
  styleShape = "D",
  engraving = "",
  parentUrl = null  // ADD THIS
) => {
  
  // REPLACE hardcoded prices with function calls:
  let breakdown = {
    metalPrice: getMetalPrice(parentUrl, metal),
    ringShankPrice: getShankPrice(parentUrl, ringShank),
    ringHeadStylePrice: getHeadPrice(parentUrl, ringHeadStyle),
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