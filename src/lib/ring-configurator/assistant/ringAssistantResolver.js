import {
  getColoredDiamondExtraPrice,
  getDiamondPrice,
  getEngravingPrice,
  formatStoreCurrency,
  getGemstoneExtraPrice,
  getHeadPrice,
  getMatchingBandPrice,
  getMetalPrice,
  getStoreLanguage,
  getShankPrice,
  getStorePriceConfig,
} from "../utility/storePriceHelper.js";
import { getFancyPriceFactor } from "../utility/Parentconfig.js";
import {
  getDefaultShapeForHeadStyle,
  getResolvedHeadSelection,
  getSupportedShapesForHeadStyle,
  getStoreCustomizationSettings,
  getStoreDefaults,
  normalizeMatchingBandSelection,
} from "../utility/storeCustomization.js";
import { getRingSizeType } from "../utility/Parentconfig.js";

const METAL_COLORS = {
  white: "#DBDBDB",
  yellow: "#FFD280",
  rose: "#FFBAA3",
  platinum: "#e5e4e2",
  titanium: "#8C8C8C",
  silver: "#D8D8D8",
};

const METAL_COLOR_TERMS = {
  white: ["white gold", "white metal"],
  yellow: ["yellow gold", "yellow metal"],
  rose: ["rose gold", "pink gold", "rose metal"],
  platinum: ["platinum"],
  titanium: ["titanium"],
  silver: ["silver", "sterling silver"],
};

const RESPONSE_LANGUAGES = ["en", "it", "de", "es", "fr", "pt", "nl", "hi", "ar"];
const MULTILINGUAL_REPLACEMENTS = [
  [/सफेद सो(?:ना|ने)/gi, "white gold"],
  [/गुलाबी सो(?:ना|ने)/gi, "rose gold"],
  [/पीला सो(?:ना|ने)/gi, "yellow gold"],
  [/अंडाकार/gi, "oval"],
  [/गोल/gi, "round"],
  [/लैब(?: ग्रोन)? डायमंड/gi, "lab grown diamond"],
  [/प्राकृतिक डायमंड/gi, "natural diamond"],
  [/कैरेट/gi, "carat"],
  [/ذهب أبيض/gi, "white gold"],
  [/ذهب أصفر/gi, "yellow gold"],
  [/ذهب وردي/gi, "rose gold"],
  [/بيضاوي(?:ة)?/gi, "oval"],
  [/مستدير(?:ة)?/gi, "round"],
  [/ألماس(?:ة)? مختبري(?:ة)?/gi, "lab grown diamond"],
  [/ألماس(?:ة)? طبيعي(?:ة)?/gi, "natural diamond"],
  [/قيراط/gi, "carat"],
  [/\b(daimond|dimond)\b/gi, "diamond"],
  [/\bsaphire\b/gi, "sapphire"],
  [/\b(emereld|emerlad)\b/gi, "emerald"],
  [/\bcarret\b/gi, "carat"],
  [/\bclaraty\b/gi, "clarity"],
  [/\bengravng\b/gi, "engraving"],
  [/\bprongg\b/gi, "prong"],
  [/\b(ovle|ovel)\b/gi, "oval"],
  [/\b(roudn|rond)\b/gi, "round"],
  [/\b(cushon|cusion)\b/gi, "cushion"],
  [/\b(princes|princcess)\b/gi, "princess"],
  [/\b(radiand|radient)\b/gi, "radiant"],
  [/\b(marquise|marquiz)\b/gi, "marquise"],
  [/\b(rose gole|rosegold)\b/gi, "rose gold"],
  [/\byelow gold\b/gi, "yellow gold"],
  [/\bgold white\b/gi, "white gold"],
  [/\bgold yellow\b/gi, "yellow gold"],
  [/\bgold rose\b/gi, "rose gold"],
  [/\bplatinam\b/gi, "platinum"],
  [/\bovalado|ovalen?|ovale\b/gi, "oval"],
  [/\bredondo|rotondo|rond|rund\b/gi, "round"],
  [/\bdiamante|diamant\b/gi, "diamond"],
  [/\b(quilates?|karat|carati|carato)\b/gi, "carat"],
  [/\b(safed sona|white sona)\b/gi, "white gold"],
  [/\b(gulabi sona|rose sona)\b/gi, "rose gold"],
  [/\b(peela sona|yellow sona)\b/gi, "yellow gold"],
  [/\bplane\b/gi, "plain"],
  [/\b(chanel|chnnel)\b/gi, "channel"],
  [/\b(catdral|cathederal)\b/gi, "cathedral"],
  [/\b(twised|twistd)\b/gi, "twisted"],
  [/\b(plat prong|plate pong|plate prog)\b/gi, "plate prong"],
  [/\b(solitar|solitare)\b/gi, "solitaire"],
  [/\b(laboratorio|laboratoire|labor gezuchtet|lab erstellt)\b/gi, "lab grown"],
  [/anello di fidanzamento|verlobungsring|bague de fiancailles|anillo de compromiso|anel de noivado/gi, "engagement ring"],
  [/oro bianco|weissgold|weißgold|or blanc|oro blanco|ouro branco|witgoud/gi, "white gold"],
  [/oro giallo|gelbgold|or jaune|oro amarillo|ouro amarelo|geelgoud/gi, "yellow gold"],
  [/oro rosa|rosegold|or rose|oro rosa|ouro rosa|roségoud/gi, "rose gold"],
  [/platino|platin|platine/gi, "platinum"],
  [/diamante coltivato in laboratorio|diamante de laboratorio|diamante sintetico|labordiamant|diamant de laboratoire|diamante de laboratorio|diamante de laboratorio|diamante de laboratorio/gi, "lab grown diamond"],
  [/diamante naturale|naturdiamant|diamant naturel|diamante natural/gi, "natural diamond"],
  [/taglio ovale|oval cut|corte ovalado|coupe ovale|ovale slijpvorm/gi, "oval cut"],
  [/taglio smeraldo|esmeralda corte|coupe emeraude|smaragdschliff/gi, "emerald cut"],
  [/taglio cuscino|cojin corte|coupe coussin|kissenschliff/gi, "cushion cut"],
  [/taglio radiant|corte radiant|coupe radiant/gi, "radiant cut"],
  [/taglio pera|corte pera|coupe poire|tropfenschliff/gi, "pear cut"],
  [/taglio marquise|corte marquesa|coupe marquise/gi, "marquise cut"],
  [/taglio princess|corte princesa|coupe princesse|prinzessschliff/gi, "princess cut"],
  [/taglio asscher|corte asscher|coupe asscher/gi, "asscher cut"],
  [/taglio cuore|corte corazon|coupe coeur|herzschliff/gi, "heart cut"],
  [/alone nascosto|aureola nascosta|halo nascosto|versteckter halo|halo cache|halo oculto|halo escondido/gi, "hidden halo"],
  [/doppio halo|double aureole|doble halo/gi, "double halo"],
  [/halo simple|single halo|aureola simple/gi, "single halo"],
  [/solitario classico|solitario|solitaire classique|solitario clasico|klassischer solitar/gi, "solitaire"],
  [/castone|chaton clos|lunette/gi, "bezel"],
  [/tre pietre|tres piedras|drie stenen|trois pierres/gi, "three stone"],
  [/spalle a cattedrale|cattedrale|cathedrale|catedral/gi, "cathedral"],
  [/fascia intrecciata|corpo intrecciato|torsade|torcido/gi, "twisted band"],
  [/gambo diviso|braccio diviso|corpo dividido|split shank/gi, "split shank"],
  [/micro pave|micro pavee|micro pave band|micro pave shank|micro pave shoulders/gi, "micro pave"],
  [/pave|pavee|pave band|banda pave|fascia pave/gi, "pave band"],
  [/milgrain|millegrain/gi, "milgrain"],
  [/filigrana floreale|filigrane florale|filigrana floral/gi, "floral filigree"],
  [/foglie e viti|hojas y enredaderas|feuilles et vignes|bladeren en ranken/gi, "leaves and vines"],
  [/zaffiro blu|safiro azul|saphir bleu|blauer saphir/gi, "blue sapphire"],
  [/smeraldo verde|esmeralda verde|emeraude verte|gruener smaragd/gi, "green emerald"],
  [/rubino rosso|rubi rojo|rubis rouge|roter rubin/gi, "red ruby"],
  [/moissanite/gi, "moissanite"],
  [/ct\b|carati\b|carato\b|carats\b|carat\b|quilates\b|quilate\b/gi, " ct"],
  [/\b(con|mit|avec|com|met)\b/gi, " with "],
  [/\b(e|und|et|y)\b/gi, " and "],
];

const SHAPE_KEYWORDS = ["round", "emerald", "oval", "moval", "pear", "asscher", "cushion", "marquise", "princess", "radiant", "heart"];
const THREE_STONE_COMPATIBLE_SHANKS = ["PLAIN", "WIDE-PLAIN", "KNIFE-EDGE"];
const GENERIC_HALO_ALIAS = "single-halo";
const CARATS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const RING_SIZE_OPTIONS = {
  R1: ["3", "3.5", "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11"],
  R2: ["F", "F 1/2", "G", "G 1/2", "H", "H 1/2", "I", "I 1/2", "J", "J 1/2", "K", "K 1/2", "L", "L 1/2", "M", "M 1/2", "N", "N 1/2", "O", "O 1/2", "P", "P 1/2", "Q", "Q 1/2", "R", "R 1/2", "Z 1/2"],
  R3: ["44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "70"],
  R4: ["4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27"],
  R5: ["14", "14 1/4", "14 1/2", "14 3/4", "15", "15 1/4", "15 1/2", "15 3/4", "16", "16 1/4", "16 1/2", "16 3/4", "17", "17 1/4", "17 1/2", "17 3/4", "18", "18 1/4", "18 1/2", "18 3/4", "19", "19 1/4", "19 1/2", "19 3/4", "20", "20 1/2", "22"],
  R6: ["4", "4 5/8", "5 1/4", "5 7/8", "6 1/2", "7 1/8", "7 3/4", "8 3/8", "9", "9 5/8", "10 1/4", "10 7/8", "11 1/2", "12 1/8", "12 3/4", "13 3/8", "14", "14 5/8", "15 1/4", "15 7/8", "16 1/2", "17 1/8", "17 3/4", "18 3/8", "19", "19 5/8", "29"],
  R7: ["5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"],
  R8: ["I", "I 1/2", "J", "J 1/2", "K", "K 1/2", "L", "L 1/2", "M", "M 1/2", "N", "N 1/2", "O", "O 1/2", "P", "P 1/2", "Q", "Q 1/2", "R"],
};

const HEAD_STYLE_KEYWORDS = {
  plain: ["solitaire", "plain head", "plain setting", "solitario", "solitaire ring", "solitair"],
  bezel: ["bezel", "chaton clos", "castone", "lunette"],
  "hidden-halo": ["hidden halo", "halo cache", "halo nascosto", "halo oculto"],
  "single-halo": ["single halo", "halo setting", "halo head", "aureola", "halo simple"],
  "double-halo": ["double halo", "halo doble", "doppio halo", "double aureole"],
  "three-stone": ["three stone", "three-stone", "3 stone", "three stones", "tre pietre", "tres piedras", "drie stenen"],
};

const SHANK_KEYWORDS = {
  "WIDE-PLAIN": ["wide plain", "wide band", "large plain"],
  "KNIFE-EDGE": ["knife edge", "knife-edge"],
  CATHEDRAL: ["cathedral", "cathedrale", "cattedrale", "catedral"],
  SPLIT: ["split", "split shank", "split-shank"],
  TWISTED: ["twisted", "twist", "twisted band", "torsade", "torcido", "intrecciato"],
  CHANNEL: ["channel shank", "channel band", "channel setting", "channel matching band", "channel matching bands", "pave band", "pavé band", "micro pave", "micro pavé"],
  "PLATE-PRONG": ["plate prong", "plateprong", "plate prong matching band", "plate prong matching bands"],
  PLAIN: ["plain shank", "plain band", "plain matching band", "plain matching bands", "simple band", "solitaire shank", "solitaire band", "plain solitaire shank"],
};

const GEMSTONE_PATTERNS = [
  { regex: /\bblue sapphire\b|\bblue gemstone\b|\bsapphire gemstone\b|\bsapphire stone\b/i, value: "blue-sapphire" },
  { regex: /\bgreen sapphire\b/i, value: "green-sapphire" },
  { regex: /\bgreen emerald\b|\bemerald green\b|\bgreen gemstone\b|\bemerald gemstone\b|\bemerald stone\b/i, value: "green-emerald" },
  { regex: /\bpink sapphire\b|\bpink gemstone\b/i, value: "pink-sapphire" },
  { regex: /\bred ruby\b|\bruby red\b|\bred gemstone\b|\bruby gemstone\b|\bruby stone\b/i, value: "red-ruby" },
  { regex: /\byellow sapphire\b|\byellow gemstone\b/i, value: "yellow-sapphire" },
  { regex: /\bmoissanite\b/i, value: "moissanite" },
];

const FANCY_COLOR_PATTERNS = ["blue", "green", "pink", "purple", "peach", "yellow", "red", "orange", "black", "brown"];
const SIDE_STONE_PATTERNS = [
  "side stones",
  "side diamonds",
  "side stone",
  "side diamond",
  "trillion cut side diamonds",
  "trillion-cut side diamonds",
  "tapered baguette diamonds",
  "pear shaped side stones",
  "pear-shaped side stones",
];

const HEAD_STYLE_LABELS = {
  plain: "Solitaire",
  bezel: "Bezel",
  "hidden-halo": "Hidden Halo",
  "single-halo": "Halo",
  "double-halo": "Double Halo",
  "three-stone": "Three Stone",
};

const normalize = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const canonicalizePrompt = (prompt = "") =>
  MULTILINGUAL_REPLACEMENTS.reduce(
    (accumulator, [pattern, replacement]) => accumulator.replace(pattern, replacement),
    prompt
  );

const hasNonAsciiContent = (value = "") => /[^\x00-\x7F]/.test(value);

const includesAny = (text, terms) => terms.some((term) => text.includes(term));
const firstAvailable = (options, fallback) => options[0] ?? fallback;
const toTitleCase = (value = "") => value.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
const BEZEL_INCOMPATIBLE_SHANKS = ["SPLIT", "TWISTED", "CHANNEL", "PLATE-PRONG"];

const hasRingDomainSignal = (prompt = "") => {
  const text = normalize(canonicalizePrompt(prompt));
  return /\b(?:ring|engagement|jewel|jewelry|jewellery|diamond|stone|gemstone|sapphire|emerald|ruby|moissanite|gold|platinum|metal|purity|karat|carat|ct|head|setting|shank|band|halo|solitaire|bezel|pave|prong|shape|cut|round|oval|moval|pear|cushion|radiant|princess|marquise|asscher|heart|engraving|size|view|reset|undo|revert|current|configured|configuration|config|model|price|cost|total|amount|pay|configure|design|create|build|recommend|suggest|advice|advise|compare|choose|surprise me)\b/i.test(text);
};

const translateAssistantText = (parentUrl, key, values = {}, explicitLanguage = null) => {
  const language = RESPONSE_LANGUAGES.includes(explicitLanguage)
    ? explicitLanguage
    : getStoreLanguage(parentUrl);

  const templates = {
    en: {
      unsupportedGeneric: "That combination is not supported in this configurator. Try a different head, shape, metal, or carat.",
      tryPrefix: "Try",
      applied: "Applied the requested design.",
      appliedBudget: `Applied a design at ${values.price} within your ${values.budget} budget.`,
      adjustedBudget: `Adjusted to ${values.carat} ct ${values.quality} ${values.type} at ${values.price} to stay within ${values.budget}.`,
      overBudget: `The closest valid design is ${values.price}, which is above the ${values.budget} budget.`,
      mappedHalo: 'I mapped "halo" to Halo.',
      caratUnavailable: `${values.requested} ct is not available for this store.`,
      shapeUnavailable: `${values.shape} is not available for this store.`,
      metalUnavailable: `${values.metal} is not available for this store.`,
      typeUnavailable: `${values.type} diamonds are not available for this store.`,
      qualityUnavailable: `${values.quality} quality is not available for this store.`,
      coloredUnavailable: `${values.color} colored diamond is not available for this store.`,
      gemstoneUnavailable: `${values.gemstone} is not available for this store.`,
      threeStoneShank: `${values.head} only works with ${values.options} shanks.`,
      threeStoneShape: `${values.head} only supports ${values.options} shapes.`,
      headShapeUnsupported: `${values.head} only supports ${values.options} shapes in this configurator.`,
      bezelShank: `${values.head} does not work with ${values.options} shanks.`,
      matchingBandUnsupported: `Matching band is not supported with the ${values.shank} shank.`,
      approximatedPave: "I mapped pave details to the closest supported band style.",
      unsupportedVintageDetail: "Milgrain and filigree details are not available in this configurator.",
      unsupportedNatureDetail: "Leaf, vine, and organic gallery details are not available in this configurator.",
      unsupportedEastWest: "East-west stone orientation is not available in this configurator.",
      unsupportedFloating: "Floating-center support structures are not available in this configurator.",
      unsupportedSurpriseDetail: "Surprise diamonds and custom gallery details are not available in this configurator.",
      unsupportedToiEtMoi: "Toi et Moi is not available in this configurator.",
      unsupportedDiamondGrading: "Diamond color grades and clarity grades are not available in this configurator.",
      unsupportedProngDetail: "A specific prong count is not available in this configurator.",
    },
    it: {
      unsupportedGeneric: "Questa combinazione non e supportata nel configuratore. Prova una testa, forma, metallo o caratura diversa.",
      tryPrefix: "Prova",
      applied: "Configurazione richiesta applicata.",
      appliedBudget: `Ho applicato una configurazione da ${values.price} entro il budget di ${values.budget}.`,
      adjustedBudget: `Ho adattato la configurazione a ${values.carat} ct ${values.quality} ${values.type} per ${values.price}, restando entro ${values.budget}.`,
      overBudget: `La configurazione valida piu vicina costa ${values.price}, quindi supera il budget di ${values.budget}.`,
      mappedHalo: 'Ho interpretato "halo" come Halo.',
      caratUnavailable: `${values.requested} ct non e disponibile per questo store.`,
      shapeUnavailable: `${values.shape} non e disponibile per questo store.`,
      metalUnavailable: `${values.metal} non e disponibile per questo store.`,
      typeUnavailable: `I diamanti ${values.type} non sono disponibili per questo store.`,
      qualityUnavailable: `La qualita ${values.quality} non e disponibile per questo store.`,
      coloredUnavailable: `Il diamante colorato ${values.color} non e disponibile per questo store.`,
      gemstoneUnavailable: `${values.gemstone} non e disponibile per questo store.`,
      threeStoneShank: `${values.head} funziona solo con i gambi ${values.options}.`,
      threeStoneShape: `${values.head} supporta solo le forme ${values.options}.`,
      headShapeUnsupported: `${values.head} supporta solo le forme ${values.options} in questo configuratore.`,
      matchingBandUnsupported: `La fedina abbinata non e supportata con il gambo ${values.shank}.`,
      approximatedPave: "Ho interpretato i dettagli pave con lo stile di fascia supportato piu vicino.",
      unsupportedVintageDetail: "I dettagli milgrain e filigrana non sono disponibili in questo configuratore.",
      unsupportedNatureDetail: "Dettagli a foglie, tralci e gallerie organiche non sono disponibili in questo configuratore.",
      unsupportedEastWest: "L'orientamento east-west della pietra non e disponibile in questo configuratore.",
      unsupportedFloating: "Le strutture con diamante sospeso non sono disponibili in questo configuratore.",
      unsupportedSurpriseDetail: "Diamanti nascosti e dettagli di galleria personalizzati non sono disponibili in questo configuratore.",
      unsupportedToiEtMoi: "Il modello Toi et Moi non e disponibile in questo configuratore.",
    },
    de: {
      unsupportedGeneric: "Diese Kombination wird in diesem Konfigurator nicht unterstuetzt. Bitte waehle einen anderen Kopf, Schliff, Metalltyp oder Karatwert.",
      tryPrefix: "Versuche",
      applied: "Die gewuenschte Konfiguration wurde angewendet.",
      appliedBudget: `Ich habe ein Design fuer ${values.price} innerhalb deines Budgets von ${values.budget} angewendet.`,
      adjustedBudget: `Ich habe auf ${values.carat} ct ${values.quality} ${values.type} fuer ${values.price} angepasst, damit es innerhalb von ${values.budget} bleibt.`,
      overBudget: `Die naechstgueltige Konfiguration kostet ${values.price} und liegt damit ueber dem Budget von ${values.budget}.`,
      mappedHalo: 'Ich habe "halo" als Halo interpretiert.',
      caratUnavailable: `${values.requested} ct ist fuer diesen Store nicht verfuegbar.`,
      shapeUnavailable: `${values.shape} ist fuer diesen Store nicht verfuegbar.`,
      metalUnavailable: `${values.metal} ist fuer diesen Store nicht verfuegbar.`,
      typeUnavailable: `${values.type} Diamanten sind fuer diesen Store nicht verfuegbar.`,
      qualityUnavailable: `${values.quality} Qualitaet ist fuer diesen Store nicht verfuegbar.`,
      coloredUnavailable: `${values.color} Farbdiamant ist fuer diesen Store nicht verfuegbar.`,
      gemstoneUnavailable: `${values.gemstone} ist fuer diesen Store nicht verfuegbar.`,
      threeStoneShank: `${values.head} funktioniert nur mit ${values.options} Ringschienen.`,
      threeStoneShape: `${values.head} unterstuetzt nur die Formen ${values.options}.`,
      headShapeUnsupported: `${values.head} unterstuetzt in diesem Konfigurator nur die Formen ${values.options}.`,
      matchingBandUnsupported: `Ein passender Bandring wird mit der Ringschiene ${values.shank} nicht unterstuetzt.`,
      approximatedPave: "Ich habe Pave-Details auf den naechstunterstuetzten Ringschienenstil abgebildet.",
      unsupportedVintageDetail: "Milgrain- und Filigrandetails sind in diesem Konfigurator nicht verfuegbar.",
      unsupportedNatureDetail: "Blatt-, Ranken- und organische Galeriedetails sind in diesem Konfigurator nicht verfuegbar.",
      unsupportedEastWest: "Die East-West-Ausrichtung des Steins ist in diesem Konfigurator nicht verfuegbar.",
      unsupportedFloating: "Schwebende Mittelstein-Konstruktionen sind in diesem Konfigurator nicht verfuegbar.",
      unsupportedSurpriseDetail: "Versteckte Diamanten und individuelle Galeriedetails sind in diesem Konfigurator nicht verfuegbar.",
      unsupportedToiEtMoi: "Toi et Moi ist in diesem Konfigurator nicht verfuegbar.",
    },
    es: {
      unsupportedGeneric: "Esa combinacion no esta disponible en este configurador. Prueba con una cabeza, forma, metal o quilataje diferente.",
      tryPrefix: "Prueba",
      applied: "He aplicado el diseno solicitado.",
      appliedBudget: `He aplicado un diseno de ${values.price} dentro de tu presupuesto de ${values.budget}.`,
      adjustedBudget: `He ajustado el diseno a ${values.carat} ct ${values.quality} ${values.type} por ${values.price} para mantenerme dentro de ${values.budget}.`,
      overBudget: `La configuracion valida mas cercana cuesta ${values.price}, por encima del presupuesto de ${values.budget}.`,
      mappedHalo: 'He interpretado "halo" como Halo.',
      caratUnavailable: `${values.requested} ct no esta disponible para esta tienda.`,
      shapeUnavailable: `${values.shape} no esta disponible para esta tienda.`,
      metalUnavailable: `${values.metal} no esta disponible para esta tienda.`,
      typeUnavailable: `Los diamantes ${values.type} no estan disponibles para esta tienda.`,
      qualityUnavailable: `La calidad ${values.quality} no esta disponible para esta tienda.`,
      coloredUnavailable: `El diamante de color ${values.color} no esta disponible para esta tienda.`,
      gemstoneUnavailable: `${values.gemstone} no esta disponible para esta tienda.`,
      threeStoneShank: `${values.head} solo funciona con brazos ${values.options}.`,
      threeStoneShape: `${values.head} solo admite las formas ${values.options}.`,
      headShapeUnsupported: `${values.head} solo admite las formas ${values.options} en este configurador.`,
      matchingBandUnsupported: `La alianza a juego no es compatible con el brazo ${values.shank}.`,
      approximatedPave: "He aproximado los detalles pavé al estilo de banda compatible mas cercano.",
      unsupportedVintageDetail: "Los detalles milgrain y filigrana no estan disponibles en este configurador.",
      unsupportedNatureDetail: "Los detalles de hojas, enredaderas y galeria organica no estan disponibles en este configurador.",
      unsupportedEastWest: "La orientacion este-oeste no esta disponible en este configurador.",
      unsupportedFloating: "Las estructuras flotantes para el diamante central no estan disponibles en este configurador.",
      unsupportedSurpriseDetail: "Los diamantes sorpresa y los detalles de galeria personalizados no estan disponibles en este configurador.",
      unsupportedToiEtMoi: "Toi et Moi no esta disponible en este configurador.",
    },
    fr: {
      unsupportedGeneric: "Cette combinaison n'est pas disponible dans ce configurateur. Essayez une autre tete, forme, metal ou taille.",
      tryPrefix: "Essayez",
      applied: "J'ai applique le design demande.",
      appliedBudget: `J'ai applique un design a ${values.price} dans votre budget de ${values.budget}.`,
      adjustedBudget: `J'ai ajuste le design a ${values.carat} ct ${values.quality} ${values.type} pour ${values.price} afin de rester dans ${values.budget}.`,
      overBudget: `La configuration valide la plus proche coute ${values.price}, au-dessus du budget de ${values.budget}.`,
      mappedHalo: 'J’ai interprete "halo" comme Halo.',
      caratUnavailable: `${values.requested} ct n'est pas disponible pour cette boutique.`,
      shapeUnavailable: `${values.shape} n'est pas disponible pour cette boutique.`,
      metalUnavailable: `${values.metal} n'est pas disponible pour cette boutique.`,
      typeUnavailable: `Les diamants ${values.type} ne sont pas disponibles pour cette boutique.`,
      qualityUnavailable: `La qualite ${values.quality} n'est pas disponible pour cette boutique.`,
      coloredUnavailable: `Le diamant colore ${values.color} n'est pas disponible pour cette boutique.`,
      gemstoneUnavailable: `${values.gemstone} n'est pas disponible pour cette boutique.`,
      threeStoneShank: `${values.head} fonctionne uniquement avec les anneaux ${values.options}.`,
      threeStoneShape: `${values.head} prend uniquement en charge les formes ${values.options}.`,
      headShapeUnsupported: `${values.head} prend uniquement en charge les formes ${values.options} dans ce configurateur.`,
      matchingBandUnsupported: `L'anneau assorti n'est pas compatible avec l'anneau ${values.shank}.`,
      approximatedPave: "J'ai rapproche les details pave du style de bande compatible le plus proche.",
      unsupportedVintageDetail: "Les details milgrain et filigrane ne sont pas disponibles dans ce configurateur.",
      unsupportedNatureDetail: "Les details de feuilles, de vignes et de galerie organique ne sont pas disponibles dans ce configurateur.",
      unsupportedEastWest: "L'orientation est-ouest n'est pas disponible dans ce configurateur.",
      unsupportedFloating: "Les structures flottantes pour pierre centrale ne sont pas disponibles dans ce configurateur.",
      unsupportedSurpriseDetail: "Les diamants surprises et les details de galerie personnalises ne sont pas disponibles dans ce configurateur.",
      unsupportedToiEtMoi: "Le style Toi et Moi n'est pas disponible dans ce configurateur.",
    },
    pt: {
      unsupportedGeneric: "Essa combinacao nao esta disponivel neste configurador. Tente outro topo, forma, metal ou quilatagem.",
      tryPrefix: "Tente",
      applied: "Apliquei o design solicitado.",
      appliedBudget: `Apliquei um design de ${values.price} dentro do seu orcamento de ${values.budget}.`,
      adjustedBudget: `Ajustei o design para ${values.carat} ct ${values.quality} ${values.type} por ${values.price} para ficar dentro de ${values.budget}.`,
      overBudget: `A configuracao valida mais proxima custa ${values.price}, acima do orcamento de ${values.budget}.`,
      mappedHalo: 'Interpretei "halo" como Halo.',
      caratUnavailable: `${values.requested} ct nao esta disponivel para esta loja.`,
      shapeUnavailable: `${values.shape} nao esta disponivel para esta loja.`,
      metalUnavailable: `${values.metal} nao esta disponivel para esta loja.`,
      typeUnavailable: `Diamantes ${values.type} nao estao disponiveis para esta loja.`,
      qualityUnavailable: `A qualidade ${values.quality} nao esta disponivel para esta loja.`,
      coloredUnavailable: `O diamante colorido ${values.color} nao esta disponivel para esta loja.`,
      gemstoneUnavailable: `${values.gemstone} nao esta disponivel para esta loja.`,
      threeStoneShank: `${values.head} so funciona com aros ${values.options}.`,
      threeStoneShape: `${values.head} so suporta as formas ${values.options}.`,
      headShapeUnsupported: `${values.head} so suporta as formas ${values.options} neste configurador.`,
      matchingBandUnsupported: `A alianca combinando nao e suportada com o aro ${values.shank}.`,
      approximatedPave: "Aproximei os detalhes pave ao estilo de aro suportado mais proximo.",
      unsupportedVintageDetail: "Detalhes em milgrain e filigrana nao estao disponiveis neste configurador.",
      unsupportedNatureDetail: "Detalhes de folhas, vinhas e galeria organica nao estao disponiveis neste configurador.",
      unsupportedEastWest: "A orientacao leste-oeste nao esta disponivel neste configurador.",
      unsupportedFloating: "Estruturas flutuantes para a pedra central nao estao disponiveis neste configurador.",
      unsupportedSurpriseDetail: "Diamantes surpresa e detalhes personalizados da galeria nao estao disponiveis neste configurador.",
      unsupportedToiEtMoi: "Toi et Moi nao esta disponivel neste configurador.",
    },
    nl: {
      unsupportedGeneric: "Die combinatie wordt niet ondersteund in deze configurator. Probeer een andere zetting, vorm, metaal of karaatwaarde.",
      tryPrefix: "Probeer",
      applied: "Ik heb het gevraagde ontwerp toegepast.",
      appliedBudget: `Ik heb een ontwerp van ${values.price} toegepast binnen je budget van ${values.budget}.`,
      adjustedBudget: `Ik heb het ontwerp aangepast naar ${values.carat} ct ${values.quality} ${values.type} voor ${values.price} om binnen ${values.budget} te blijven.`,
      overBudget: `De dichtstbijzijnde geldige configuratie kost ${values.price}, boven het budget van ${values.budget}.`,
      mappedHalo: 'Ik heb "halo" geinterpreteerd als Halo.',
      caratUnavailable: `${values.requested} ct is niet beschikbaar voor deze winkel.`,
      shapeUnavailable: `${values.shape} is niet beschikbaar voor deze winkel.`,
      metalUnavailable: `${values.metal} is niet beschikbaar voor deze winkel.`,
      typeUnavailable: `${values.type} diamanten zijn niet beschikbaar voor deze winkel.`,
      qualityUnavailable: `De kwaliteit ${values.quality} is niet beschikbaar voor deze winkel.`,
      coloredUnavailable: `De gekleurde diamant ${values.color} is niet beschikbaar voor deze winkel.`,
      gemstoneUnavailable: `${values.gemstone} is niet beschikbaar voor deze winkel.`,
      threeStoneShank: `${values.head} werkt alleen met ${values.options} ringen.`,
      threeStoneShape: `${values.head} ondersteunt alleen de vormen ${values.options}.`,
      headShapeUnsupported: `${values.head} ondersteunt in deze configurator alleen de vormen ${values.options}.`,
      matchingBandUnsupported: `Een bijpassende band wordt niet ondersteund met de ring ${values.shank}.`,
      approximatedPave: "Ik heb pave-details vertaald naar de dichtstbijzijnde ondersteunde bandstijl.",
      unsupportedVintageDetail: "Milgrain- en filigraandetails zijn niet beschikbaar in deze configurator.",
      unsupportedNatureDetail: "Blad-, rank- en organische galeriedetails zijn niet beschikbaar in deze configurator.",
      unsupportedEastWest: "Een east-west orientatie is niet beschikbaar in deze configurator.",
      unsupportedFloating: "Zwevende middensteenconstructies zijn niet beschikbaar in deze configurator.",
      unsupportedSurpriseDetail: "Verborgen diamanten en aangepaste galeriedetails zijn niet beschikbaar in deze configurator.",
      unsupportedToiEtMoi: "Toi et Moi is niet beschikbaar in deze configurator.",
    },
    hi: {
      unsupportedGeneric: "यह विकल्प इस कॉन्फ़िगरेटर में उपलब्ध नहीं है। मौजूदा अंगूठी में कोई बदलाव नहीं किया गया है।",
      tryPrefix: "इनमें से चुनें:",
      applied: "आपके अनुरोध के अनुसार डिज़ाइन लागू कर दिया गया है।",
      appliedBudget: `${values.budget} के बजट में ${values.price} का डिज़ाइन लागू किया गया है।`,
      adjustedBudget: `${values.budget} के अंदर रहने के लिए डिज़ाइन को ${values.carat} कैरेट, ${values.quality}, ${values.type}, ${values.price} में समायोजित किया गया है।`,
      overBudget: `निकटतम मान्य डिज़ाइन ${values.price} का है, जो ${values.budget} के बजट से अधिक है।`,
      mappedHalo: '"halo" को Halo के रूप में समझा गया है।',
      caratUnavailable: `${values.requested} कैरेट इस स्टोर में उपलब्ध नहीं है।`,
      shapeUnavailable: `${values.shape} आकार इस स्टोर में उपलब्ध नहीं है।`,
      metalUnavailable: `${values.metal} इस स्टोर में उपलब्ध नहीं है।`,
      typeUnavailable: `${values.type} डायमंड इस स्टोर में उपलब्ध नहीं है।`,
      qualityUnavailable: `${values.quality} गुणवत्ता इस स्टोर में उपलब्ध नहीं है।`,
      coloredUnavailable: `${values.color} रंग का डायमंड उपलब्ध नहीं है।`,
      gemstoneUnavailable: `${values.gemstone} उपलब्ध नहीं है।`,
      threeStoneShank: `${values.head} केवल ${values.options} शैंक के साथ उपलब्ध है।`,
      threeStoneShape: `${values.head} केवल ${values.options} आकारों के साथ उपलब्ध है।`,
      headShapeUnsupported: `${values.head} केवल ${values.options} आकारों के साथ उपलब्ध है।`,
      matchingBandUnsupported: `${values.shank} शैंक के साथ मैचिंग बैंड उपलब्ध नहीं है।`,
      unsupportedToiEtMoi: "Toi et Moi इस कॉन्फ़िगरेटर में उपलब्ध नहीं है।",
    },
    ar: {
      unsupportedGeneric: "هذا الخيار غير متاح في أداة التخصيص. تم الإبقاء على الخاتم الحالي دون تغيير.",
      tryPrefix: "جرّب",
      applied: "تم تطبيق التصميم المطلوب.",
      appliedBudget: `تم تطبيق تصميم بسعر ${values.price} ضمن ميزانيتك ${values.budget}.`,
      adjustedBudget: `تم تعديل التصميم إلى ${values.carat} قيراط، ${values.quality}، ${values.type}، بسعر ${values.price} ضمن ميزانيتك ${values.budget}.`,
      overBudget: `أقرب تصميم صالح سعره ${values.price}، وهو أعلى من ميزانيتك ${values.budget}.`,
      mappedHalo: 'تم تفسير "halo" كإعداد Halo.',
      caratUnavailable: `${values.requested} قيراط غير متاح في هذا المتجر.`,
      shapeUnavailable: `شكل ${values.shape} غير متاح في هذا المتجر.`,
      metalUnavailable: `${values.metal} غير متاح في هذا المتجر.`,
      typeUnavailable: `ألماس ${values.type} غير متاح في هذا المتجر.`,
      qualityUnavailable: `جودة ${values.quality} غير متاحة في هذا المتجر.`,
      coloredUnavailable: `الألماس باللون ${values.color} غير متاح.`,
      gemstoneUnavailable: `${values.gemstone} غير متاح.`,
      threeStoneShank: `${values.head} يعمل فقط مع ${values.options}.`,
      threeStoneShape: `${values.head} يدعم فقط الأشكال ${values.options}.`,
      headShapeUnsupported: `${values.head} يدعم فقط الأشكال ${values.options}.`,
      matchingBandUnsupported: `الحلقة المطابقة غير متاحة مع ${values.shank}.`,
      unsupportedToiEtMoi: "تصميم Toi et Moi غير متاح في أداة التخصيص.",
    },
  };

  return templates[language]?.[key] ?? templates.en[key] ?? "";
};

const LANGUAGE_SIGNAL_PATTERNS = {
  en: [
    { pattern: /\b(create|design|build|make|change|update|set|remove|replace)\b/g, weight: 3 },
    { pattern: /\b(engagement ring|white gold|yellow gold|rose gold|lab grown|natural diamond|hidden halo)\b/g, weight: 3 },
    { pattern: /\b(with|under|within|budget|diamond|ring|vintage|classic|modern)\b/g, weight: 1 },
  ],
  it: [
    { pattern: /\b(crea|progetta|cambia|imposta|rimuovi|sostituisci)\b/g, weight: 3 },
    { pattern: /\b(anello di fidanzamento|oro bianco|oro giallo|oro rosa|halo nascosto)\b/g, weight: 3 },
    { pattern: /\b(anello|diamante|platino|budget|metallo)\b/g, weight: 1 },
  ],
  de: [
    { pattern: /\b(erstelle|entwirf|andere|setze|entferne|ersetze)\b/g, weight: 3 },
    { pattern: /\b(verlobungsring|weissgold|gelbgold|rosegold|versteckter halo)\b/g, weight: 3 },
    { pattern: /\b(diamant|platin|budget)\b/g, weight: 1 },
  ],
  es: [
    { pattern: /\b(crea|disena|cambia|configura|elimina|reemplaza)\b/g, weight: 3 },
    { pattern: /\b(anillo de compromiso|oro blanco|oro amarillo|oro rosa|halo oculto)\b/g, weight: 3 },
    { pattern: /\b(anillo|diamante|platino|presupuesto|metal)\b/g, weight: 1 },
  ],
  fr: [
    { pattern: /\b(cree|concevez|changez|reglez|supprimez|remplacez)\b/g, weight: 3 },
    { pattern: /\b(bague de fiancailles|or blanc|or jaune|or rose|halo cache)\b/g, weight: 3 },
    { pattern: /\b(bague|diamant|platine|budget)\b/g, weight: 1 },
  ],
  pt: [
    { pattern: /\b(crie|projete|altere|configure|remova|substitua)\b/g, weight: 3 },
    { pattern: /\b(anel de noivado|ouro branco|ouro amarelo|ouro rosa|halo escondido)\b/g, weight: 3 },
    { pattern: /\b(anel|diamante|platina|orcamento)\b/g, weight: 1 },
  ],
  nl: [
    { pattern: /\b(ontwerp|maak|wijzig|stel|verwijder|vervang)\b/g, weight: 3 },
    { pattern: /\b(verlovingsring|witgoud|geelgoud|roségoud|verborgen halo)\b/g, weight: 3 },
    { pattern: /\b(diamant|platina|budget)\b/g, weight: 1 },
  ],
  hi: [
    { pattern: /[\u0900-\u097f]/g, weight: 1 },
    { pattern: /\b(mujhe|chahiye|dikhao|andar|sona|bada|kam karo)\b/g, weight: 2 },
  ],
  ar: [
    { pattern: /[\u0600-\u06ff]/g, weight: 1 },
  ],
};

const detectPromptLanguage = (prompt = "") => {
  const text = normalize(prompt);

  const scores = Object.entries(LANGUAGE_SIGNAL_PATTERNS).map(([language, entries]) => ({
    language,
    score: entries.reduce((total, entry) => total + ((text.match(entry.pattern) ?? []).length * entry.weight), 0),
  }));

  const [best, secondBest] = scores.sort((a, b) => b.score - a.score);

  if (!best || best.score <= 0) {
    return null;
  }

  if (best.language === "en") {
    return "en";
  }

  if ((secondBest?.score ?? 0) >= best.score) {
    return "en";
  }

  return best.score >= 2 ? best.language : "en";
};

const shouldStartFreshDesign = (prompt = "", intent = {}) => {
  const text = normalize(canonicalizePrompt(prompt));
  return includesAny(text, [
    "reset",
    "reset model",
    "reset configuration",
    "reset configurator",
    "start over",
    "from scratch",
    "new ring from scratch",
    "reset the ring",
    "reset ring",
    "clear the current ring",
  ]);
};

const parseBudget = (text) => {
  const shorthandMatch = text.match(/(?:[$\u20ac\u00a3\u20b9]\s*)?(\d+(?:\.\d+)?)\s*(k|lakh|lac)\b/i);
  if (shorthandMatch) {
    const matchStart = shorthandMatch.index ?? 0;
    const context = text.slice(Math.max(0, matchStart - 24), matchStart + shorthandMatch[0].length + 12);
    const isGoldPurity = /^\s*(9|10|14|18)\s*k\s*(?:white|yellow|rose)?\s*-?\s*gold\b/i.test(text.slice(matchStart));
    const hasBudgetContext = /[$\u20ac\u00a3\u20b9]|budget|under|below|within|maximum|max|up to|upto|less than/i.test(context);
    if (!isGoldPurity && (hasBudgetContext || /lakh|lac/i.test(shorthandMatch[2]))) {
      const multiplier = /lakh|lac/i.test(shorthandMatch[2]) ? 100000 : 1000;
      return Number(shorthandMatch[1]) * multiplier;
    }
  }

  const currencyMatch = text.match(/(?:[$\u20ac\u00a3\u20b9]\s*(\d[\d,]*(?:\.\d+)?)|(\d[\d,]*(?:\.\d+)?)\s*(?:[$\u20ac\u00a3\u20b9]|usd|eur|inr|euro|dollar|dollars|rupees?)\b)/i);
  const budgetMatch = text.match(/(?:under|within|below|less than|budget|upto|up to|max|maximum)\s*(?:[$\u20ac\u00a3\u20b9]\s*)?(\d[\d,]*(?:\.\d+)?)/i);
  const match = currencyMatch || budgetMatch;
  if (!match) return null;

  const rawAmount = match[1] || match[2];
  const amount = Number(rawAmount.replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : null;
};

const parseCarat = (text) => {
  const numberWords = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
  const wordMatch = text.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:ct|carat|carats)\b/i);
  if (wordMatch) return numberWords[wordMatch[1].toLowerCase()];

  const match =
    text.match(/(\d+(?:\.\d+)?)\s*(?:-| )?\s*(?:ct|carat|carats|karat|carati|quilates|quilate)\b/i) ??
    text.match(/\b(?:ct|carat|carats|karat|carati|quilates|quilate)\s*(?:value|size|weight)?\s*(?:to|is|be|of|=)?\s*(\d+(?:\.\d+)?)/i);
  if (!match) return null;

  const carat = Number(match[1]);
  return Number.isFinite(carat) ? carat : null;
};

const parseCaratInfoRequest = (text = "") => {
  if (!/\b(?:carat|carats|ct)\b/i.test(text)) return null;

  if (/\b(?:what|which|show|list|tell me|available|supported|options|values|range)\b/i.test(text)) {
    return "carats";
  }

  if (/\b(?:can|could|is|are|do you have|available|support(?:ed)?)\b/i.test(text) && parseCarat(text) !== null) {
    return "caratAvailability";
  }

  return null;
};

const getEditDistance = (left = "", right = "") => {
  if (left === right) return 0;
  if (!left || !right) return Math.max(left.length, right.length);

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1)
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
};

const includesFuzzyTerm = (text = "", term = "") => {
  if (text.includes(term)) return true;

  const termWords = term.split(/\s+/).filter(Boolean);
  if (!termWords.length) return false;

  const words = text.split(/\s+/).filter(Boolean);
  const isFuzzyWordMatch = (word, termWord) => {
    const wordDistance = termWord.length >= 8 ? 2 : 1;
    return Math.abs(word.length - termWord.length) <= wordDistance && getEditDistance(word, termWord) <= wordDistance;
  };

  if (termWords.length === 1) {
    return term.length >= 5 && words.some((word) => isFuzzyWordMatch(word, term));
  }

  for (let index = 0; index <= words.length - termWords.length; index += 1) {
    const phraseWords = words.slice(index, index + termWords.length);
    if (termWords.every((termWord, termIndex) => isFuzzyWordMatch(phraseWords[termIndex], termWord))) {
      return true;
    }
  }

  return false;
};

const findKeywordMatch = (text, lookup) =>
  Object.entries(lookup).find(([, terms]) => terms.some((term) => includesFuzzyTerm(text, term)))?.[0] ?? null;

const findShapeKeyword = (text = "") =>
  SHAPE_KEYWORDS.find((item) => includesFuzzyTerm(text, item)) ?? null;

const parseAvailableOptionsRequest = (text = "") => {
  const asksQuestion = /\b(?:what|which|show|list|tell me|do you have|can i choose|available|supported|options|values)\b/i.test(text);
  if (!asksQuestion) return null;

  if (/\b(?:ring )?sizes?\b/i.test(text)) return "ringSizes";
  if (/\b(?:matching band|matching bands|wedding band|wedding bands)\b/i.test(text)) return "matchingBands";
  if (/\b(?:head|heads|setting|settings|head style|head styles)\b/i.test(text)) return "heads";
  if (/\b(?:purity|purities|karat|karats)\b/i.test(text)) return "purities";
  if (/\b(?:shank|shanks|band style|band styles|shank style|shank styles)\b/i.test(text)) return "shanks";
  if (/\b(?:diamond shape|diamond shapes|stone shape|stone shapes|shape|shapes|cut shapes)\b/i.test(text)) return "shapes";
  if (/\b(?:diamond type|diamond types|stone type|stone types)\b/i.test(text)) return "diamondTypes";
  if (/\b(?:quality|qualities|quality levels)\b/i.test(text)) return "qualities";
  if (/\b(?:gemstone|gemstones)\b/i.test(text)) return "gemstones";
  if (/\b(?:colored diamond|colored diamonds|coloured diamond|coloured diamonds|fancy color|fancy colors)\b/i.test(text)) return "coloredDiamonds";
  if (/\b(?:metal color|metal colors|metal colour|metal colours|metal|metals)\b/i.test(text)) return "metals";
  if (/\b(?:carat|carats|ct)\b/i.test(text)) return "carats";

  return null;
};

const parseStoneMode = (text) => {
  const explicitGemstone = GEMSTONE_PATTERNS.find(({ regex }) => regex.test(text));
  if (explicitGemstone) {
    return {
      activeTab: "Fancy-Gemstone",
      colorType: "fancygem",
      gemstone: explicitGemstone.value,
    };
  }

  const explicitFancyDiamond = FANCY_COLOR_PATTERNS.find(
    (color) =>
      new RegExp(`\\b${color}\\s+diamond\\b`, "i").test(text) ||
      new RegExp(`\\b${color}\\s+colored\\s+diamond\\b`, "i").test(text) ||
      new RegExp(`\\b${color}\\s+stone\\b`, "i").test(text)
  );

  if (explicitFancyDiamond) {
    return {
      activeTab: "Fancy Colored",
      colorType: "fancycolored",
      fancyDiamond: explicitFancyDiamond.charAt(0).toUpperCase() + explicitFancyDiamond.slice(1),
    };
  }

  if (/\b(?:fancy|color|colour|colored|coloured)\s+gemstones?\b/i.test(text) || /\bgemstones?\b/i.test(text)) {
    return {
      activeTab: "Fancy-Gemstone",
      colorType: "fancygem",
    };
  }

  if (/\b(?:colored|coloured|color|colour)\s+diamonds?\b/i.test(text)) {
    return {
      activeTab: "Fancy Colored",
      colorType: "fancycolored",
    };
  }

  if (includesAny(text, ["colorless", "white diamond", "clear diamond"]) || /\bdiamonds?\b/i.test(text)) {
    return {
      activeTab: "Colorless",
      colorType: "colorless",
    };
  }

  return null;
};

const getAvailableCarats = (parentUrl, settings) => {
  const config = getStorePriceConfig(parentUrl);
  const typeTables = settings.availableOptions.diamondTypes.map((type) =>
    type === "Natural" ? config.naturalDiamondPrices ?? {} : config.labDiamondPrices ?? {}
  );
  const carats = Array.from(
    new Set(
      typeTables.flatMap((table) =>
        Object.keys(table)
          .map((key) => Number(key))
          .filter((value) => Number.isFinite(value))
      )
    )
  );

  return carats.length > 0 ? carats.sort((a, b) => a - b) : CARATS;
};

const getNearestValues = (values, requested) => {
  const sorted = [...values].sort((a, b) => Math.abs(a - requested) - Math.abs(b - requested));
  return sorted.slice(0, 3);
};

const buildUnsupportedMessage = (parentUrl, issue, responseLanguage) => {
  if (!issue) {
    return translateAssistantText(parentUrl, "unsupportedGeneric", {}, responseLanguage);
  }

  if (!issue.suggestions?.length) {
    return issue.message;
  }

  return `${issue.message} ${translateAssistantText(parentUrl, "tryPrefix", {}, responseLanguage)} ${issue.suggestions.join(", ")}.`;
};

const formatOptionList = (values = [], formatter = (value) => value) =>
  values.map(formatter).filter(Boolean).join(", ");

const buildAvailableOptionsMessage = (infoRequest, settings, currentBaseState, parentUrl) => {
  const { availableOptions } = settings;
  const sizeOption = currentBaseState.sizeOption ?? getRingSizeType(parentUrl);
  const labels = {
    ringSizes: "ring sizes",
    heads: "head styles",
    purities: "purity values",
    shanks: "shank styles",
    matchingBands: "matching band styles",
    shapes: "diamond shapes",
    diamondTypes: "diamond types",
    qualities: "quality levels",
    gemstones: "gemstones",
    coloredDiamonds: "colored diamond colors",
    metals: "metal options",
    carats: "carat values",
  };
  const optionMap = {
    ringSizes: getAvailableRingSizes(sizeOption),
    heads: availableOptions.headStyles,
    purities: availableOptions.metalPurities,
    shanks: availableOptions.shankStyles,
    matchingBands: availableOptions.matchingBandStyles,
    shapes: availableOptions.diamondShapes,
    diamondTypes: availableOptions.diamondTypes,
    qualities: availableOptions.qualityLevels,
    gemstones: availableOptions.gemstones,
    coloredDiamonds: availableOptions.coloredDiamonds,
    metals: ["White Gold", "Yellow Gold", "Rose Gold", "Platinum", "Titanium", "Sterling Silver", ...availableOptions.metalPurities],
    carats: getAvailableCarats(parentUrl, settings).map((value) => `${value} ct`),
  };
  const formatters = {
    heads: (value) => HEAD_STYLE_LABELS[value] ?? toTitleCase(value),
    shanks: toTitleCase,
    matchingBands: toTitleCase,
    shapes: toTitleCase,
    gemstones: toTitleCase,
  };
  const values = optionMap[infoRequest] ?? [];
  const formatter = formatters[infoRequest] ?? ((value) => value);

  return `Available ${labels[infoRequest] ?? "options"} are: ${formatOptionList(values, formatter)}.`;
};

const getMetalColorLabel = (config = {}) => {
  if (config.platinum || config.metalColor === METAL_COLORS.platinum) return "Platinum";
  if (config.metalColor === METAL_COLORS.titanium) return "Titanium";
  if (config.metalColor === METAL_COLORS.silver) return "Sterling Silver";
  if (config.metalColor === METAL_COLORS.white) return "White Gold";
  if (config.metalColor === METAL_COLORS.rose) return "Rose Gold";
  return "Yellow Gold";
};

const getStoneLabel = (config = {}) => {
  if (config.activeTab === "Fancy Colored") return `${config.fancyDiamond} colored diamond`;
  if (config.activeTab === "Fancy-Gemstone") return toTitleCase(config.gemstone ?? "gemstone");
  return `${config.diamondSize} ct ${config.shape} ${config.selectedQuality?.type ?? "Lab"} ${config.selectedQuality?.quality ?? "Standard"} diamond`;
};

const buildCurrentConfigMessage = (config, parentUrl) => {
  const matchingBand = config.ringBand === "Yes"
    ? `${toTitleCase(config.ringMatchingBand)} matching band`
    : "no matching band";
  const engraving = config.engraving ? `engraving "${config.engraving}"` : "no engraving";
  const metal = config.platinum ? getMetalColorLabel(config) : `${config.metal} ${getMetalColorLabel(config)}`;

  return `Your current ring has ${toTitleCase(config.ringShank)} shank, ${HEAD_STYLE_LABELS[config.headStyle] ?? toTitleCase(config.headStyle)} head, ${getStoneLabel(config)}, ${metal}, ${matchingBand}, ring size ${config.ringSize}, ${engraving}. Current price is ${formatStoreCurrency(config.total, parentUrl)}.`;
};

const buildAdviceMessage = (prompt = "") => {
  const text = normalize(canonicalizePrompt(prompt));
  if (/\b(?:lab|natural)\b/i.test(text) && /\b(?:better|choose|recommend|difference|which)\b/i.test(text)) {
    return "Lab diamonds are usually best for value and a larger look within budget. Natural diamonds are best if the customer prefers rarity and traditional resale appeal.";
  }
  if (/\b(?:metal|gold|platinum)\b/i.test(text) && /\b(?:better|choose|recommend|which)\b/i.test(text)) {
    return "For daily wear, platinum is durable and premium, white gold is classic, yellow gold is warm and traditional, and rose gold gives a softer romantic look.";
  }
  if (/\b(?:shape|cut)\b/i.test(text) && /\b(?:better|choose|recommend|which)\b/i.test(text)) {
    return "Round gives the most classic sparkle, oval looks larger for its carat, emerald feels modern and architectural, and pear or marquise gives a more distinctive look.";
  }
  return "I can help with advice, questions, configuration changes, reset, undo, price, available options, and supported ring combinations. Tell me what you want to compare or change.";
};

const normalizeRingSizeValue = (value = "") =>
  value
    .toString()
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

const getAvailableRingSizes = (sizeOption) =>
  RING_SIZE_OPTIONS[sizeOption] ?? RING_SIZE_OPTIONS.R1;

const parseRingSizeIntent = (canonicalPrompt = "", text = "") => {
  if (/\b(?:what|which|show|list|tell me)\b/i.test(canonicalPrompt) && /\b(?:ring )?sizes?\b/i.test(canonicalPrompt)) {
    return null;
  }

  const explicitMatch =
    canonicalPrompt.match(/\b(?:ring size|size option)\s*(?:to|is|of|=)?\s*([A-Za-z0-9]+(?:\s*[./]\s*\d+)?(?:\s+\d\/\d)?)/i) ??
    canonicalPrompt.match(/\bset\s+(?:the\s+)?size\s+(?:to|is|of)?\s*([A-Za-z0-9]+(?:\s*[./]\s*\d+)?(?:\s+\d\/\d)?)/i);

  if (!explicitMatch) {
    return null;
  }

  return normalizeRingSizeValue(explicitMatch[1].replace(/\s*\/\s*/g, "/"));
};

const parseViewModeIntent = (text = "") => {
  const asksForView = /\b(?:view|show|camera|angle|zoom|focus|rotate|rotation|360)\b/i.test(text);
  if (!asksForView) return null;

  if (/\b(?:disable|stop|turn off|switch off|close|exit|remove|end)\b/i.test(text) && /\b(?:360|rotate|rotation)\b/i.test(text)) {
    return "off";
  }

  if (/\b(?:360|rotate|rotation)\b/i.test(text)) return "360";
  if (/\b(?:top|above|upper)\b/i.test(text)) return "top";
  if (/\b(?:side|profile|left|right)\b/i.test(text)) return "side";
  if (/\b(?:front|face|straight)\b/i.test(text)) return "front";
  if (/\b(?:engraving|engrave|name|inscription)\b/i.test(text) && /\b(?:view|zoom|show|focus)\b/i.test(text)) return "engravingZoom";
  if (/\b(?:head|stone|diamond)\b/i.test(text) && /\b(?:view|zoom|show|focus)\b/i.test(text)) return "perspectiveHeadView";
  if (/\b(?:default|normal|perspective|main|original)\b/i.test(text) && /\b(?:view|camera|angle)\b/i.test(text)) return "perspective";

  return null;
};

const parseEngravingIntent = (canonicalPrompt = "") => {
  const companionNameMatch = canonicalPrompt.match(
    /\b(?:girlfriend|boyfriend|fiancee|fiance|fiance|partner|wife|husband)\s+([A-Za-z][A-Za-z0-9&.\-]{1,14})\b/i
  );
  const asksToUseCompanionName = /\b(?:her|his|their)\s+name\s+(?:on|in|inside)\s+(?:this|the|my)?\s*ring\b/i.test(canonicalPrompt);
  if (companionNameMatch && asksToUseCompanionName) {
    const name = companionNameMatch[1].trim();
    return name.length <= 3 ? name.toUpperCase() : name.charAt(0).toUpperCase() + name.slice(1);
  }

  const patterns = [
    /\b(?:set engraving to|engraving text|engraving|engrave)\s*(?:is\s*)?(?:to\s*)?["']([^"']{1,15})["']/i,
    /\b(?:set engraving to|engraving text|engraving|engrave)\s*(?:is\s*)?(?:to\s*)?([A-Za-z0-9&.\- ]{1,15}?)(?=\s+(?:on|in|inside)\s+(?:this|the|my)?\s*ring\b|$|[,;.!?])/i,
    /\b(?:name|word|words|text|character|characters|letters|initials|inscription)\s+(?:as\s+|is\s+|to\s+)?["']?([A-Za-z0-9&.\- ]{1,15}?)["']?(?=\s+(?:on|in|inside)\s+(?:this|the|my)?\s*ring\b|$|[,;.!?])/i,
    /\b(?:write|add|put|place)\s+["']?([A-Za-z0-9&.\- ]{1,15}?)["']?\s+(?:on|in|inside)\s+(?:this|the|my)?\s*ring\b/i,
  ];

  const match = patterns.map((pattern) => canonicalPrompt.match(pattern)).find(Boolean);
  const value = match?.[1]?.trim();
  return value && value.length <= 15 ? value : null;
};

const findMetalColorKeyword = (value = "") => {
  const normalizedValue = normalize(value);
  return Object.entries(METAL_COLOR_TERMS).find(([, terms]) => terms.some((term) => normalizedValue.includes(term)))?.[0] ?? null;
};

const parseTargetMetalColor = (text = "", targets = []) => {
  for (const [colorKey, terms] of Object.entries(METAL_COLOR_TERMS)) {
    for (const term of terms) {
      for (const target of targets) {
        const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const colorFirst = new RegExp(
          `\\b${escapedTerm}\\b\\s+${escapedTarget}\\b`,
          "i"
        );
        const targetFirst = new RegExp(
          `\\b${escapedTarget}\\b(?:\\s+(?:in|with|metal|type|metal\\s+type|color|finish|using)){0,3}\\s+${escapedTerm}\\b`,
          "i"
        );

        if (
          text.includes(`${term} ${target}`) ||
          text.includes(`${target} ${term}`) ||
          text.includes(`${target} in ${term}`) ||
          text.includes(`${target} metal type ${term}`) ||
          text.includes(`${target} in metal type ${term}`) ||
          colorFirst.test(text) ||
          targetFirst.test(text)
        ) {
          return colorKey;
        }
      }
    }
  }

  return null;
};

const parseBiMetalIntent = (canonicalPrompt = "", text = "") => {
  const biMetalRequested = includesAny(text, ["bimetal", "bi metal", "bi-metal", "two tone", "two-tone", "mixed metal", "dual metal"]);
  const headMetalColor = parseTargetMetalColor(text, ["head", "setting"]);
  const shankMetalColor = parseTargetMetalColor(text, ["shank", "band", "ring"]);

  if (!biMetalRequested && !headMetalColor && !shankMetalColor) {
    return null;
  }

  return {
    biMetalRequested: true,
    headMetalColor,
    shankMetalColor,
  };
};

export const parseRingAssistantPrompt = (prompt) => {
  const canonicalPrompt = canonicalizePrompt(prompt);
  const text = normalize(canonicalPrompt);
  const intent = {
    notes: [],
  };
  const stoneMode = parseStoneMode(text);
  const ringSize = parseRingSizeIntent(canonicalPrompt, text);
  const biMetalIntent = parseBiMetalIntent(canonicalPrompt, text);
  const viewMode = parseViewModeIntent(text);

  if (/\b(?:undo|revert|go back|previous configuration|last change)\b/i.test(text)) {
    intent.undoRequested = true;
    return intent;
  }

  if (/\b(?:do not|don't|dont|no need to)\s+(?:change|modify|update|configure|apply)\b/i.test(text) || /\bkeep (?:the )?(?:current|existing) (?:ring|configuration|config|model)\b/i.test(text)) {
    intent.noChangeRequested = true;
    return intent;
  }

  if (viewMode) {
    intent.viewMode = viewMode;
    return intent;
  }

  if (
    /\b(?:what|which|show|tell me|describe|summarize|summary)\b/i.test(text) &&
    /\b(?:current|currently|now|configured|configuration|config|ring|model)\b/i.test(text)
  ) {
    intent.infoRequest = "currentConfig";
    return intent;
  }

  const hasConfigurationRequest = /\b(?:design|create|build|configure|apply|set|change|select|choose|use|want|need|style should|should be|please design|matching these configurations|ring size|engraving|engrave|name|word|text|character|purity|carat|ct|metal color|metal|shank|head|setting|plate prong|plain|channel|twisted)\b/i.test(text);
  if (
    /\b(?:which|what|should|recommend|suggest|advice|advise|better|best|compare|difference)\b/i.test(text) &&
    /\b(?:lab|natural|diamond|shape|cut|metal|gold|platinum|ring|option|choose)\b/i.test(text) &&
    !hasConfigurationRequest
  ) {
    intent.infoRequest = "advice";
    return intent;
  }

  const caratInfoRequest = parseCaratInfoRequest(canonicalPrompt);
  if (caratInfoRequest) {
    intent.infoRequest = caratInfoRequest;
    intent.carat = parseCarat(canonicalPrompt);
    return intent;
  }

  if (includesAny(text, ["reset", "reset ring", "reset the ring", "reset model", "reset configuration", "reset configurator", "start over", "from scratch"])) {
    intent.resetRequested = true;
  }

  if (/\b(?:cheapest|lowest price|least expensive|most affordable|cheap(?:est)?(?: in price)?)\b/i.test(text)) {
    intent.pricePreference = "min";
  } else if (/\b(?:most expensive|highest price|highest priced|expensive|luxury option)\b/i.test(text)) {
    intent.pricePreference = "max";
  }

  if (/\b(?:highest|maximum|max|largest|biggest)\s+(?:available\s+)?(?:carat|ct)\b/i.test(text) || /\b(?:carat|ct)\s+(?:highest|maximum|max|largest|biggest)\b/i.test(text) || /\b(?:highest|maximum|max|largest|biggest)\s+(?:diamond\s+)?(?:size|stone)\b/i.test(text)) {
    intent.caratPreference = "max";
  } else if (/\b(?:lowest|minimum|min|smallest)\s+(?:available\s+)?(?:carat|ct)\b/i.test(text) || /\b(?:carat|ct)\s+(?:lowest|minimum|min|smallest)\b/i.test(text) || /\b(?:lowest|minimum|min|smallest)\s+(?:diamond\s+)?(?:size|stone)\b/i.test(text)) {
    intent.caratPreference = "min";
  }

  if (/\b(?:highest|maximum|max|largest|biggest)\s+(?:available\s+)?(?:purity|karat|k)\b/i.test(text) || /\b(?:purity|karat)\s+(?:highest|maximum|max|largest|biggest)\b/i.test(text)) {
    intent.purityPreference = "max";
  } else if (/\b(?:lowest|minimum|min|smallest)\s+(?:available\s+)?(?:purity|karat|k)\b/i.test(text) || /\b(?:purity|karat)\s+(?:lowest|minimum|min|smallest)\b/i.test(text)) {
    intent.purityPreference = "min";
  }

  if (intent.pricePreference) {
    if (/\b(?:shank|band)\b/i.test(text)) {
      intent.priceTarget = "ringShank";
    } else if (/\b(?:metal|gold|platinum)\b/i.test(text)) {
      intent.priceTarget = "metal";
    } else if (/\b(?:head|setting)\b/i.test(text)) {
      intent.priceTarget = "headStyle";
    } else if (/\b(?:ring|design|configuration|config|model|option)\b/i.test(text)) {
      intent.priceTarget = "total";
    } else {
      intent.priceTarget = "total";
    }
  }

  if (
    /\b(?:what(?:'s| is)?|tell me|show me)\s+(?:the\s+)?(?:(?:total|final)\s+)?(?:price|cost|amount|total)\b/i.test(text) ||
    /\bhow much\b/i.test(text) ||
    /\b(?:price|cost|total|amount)\s+(?:of|for)\s+(?:this\s+)?ring\b/i.test(text) ||
    /\b(?:pay|paying|charge|charged)\s+(?:for|to|on)\s+(?:this\s+)?ring\b/i.test(text)
  ) {
    intent.infoRequest = "price";
  }
  intent.infoRequest = intent.infoRequest ?? parseAvailableOptionsRequest(text);
  if (intent.infoRequest) {
    intent.budget = parseBudget(text);
    intent.carat = parseCarat(canonicalPrompt);
    return intent;
  }

  const matchingBandRequested = includesAny(text, ["matching band", "matching bands", "wedding band", "wedding bands", "band set", "add band"]);
  const shank = findKeywordMatch(text, SHANK_KEYWORDS);
  const explicitShankRequested = /\b(?:shank|main band|engagement band|ring band style|shank style)\b/i.test(text);
  const shouldApplyShank = Boolean(shank) && (!matchingBandRequested || explicitShankRequested);
  const shankOnlyPrompt = shouldApplyShank && !/\b(?:head|setting)\b/i.test(text);

  if (!shankOnlyPrompt && includesAny(text, ["no halo", "without halo", "remove halo"])) {
    intent.headStyle = "plain";
  } else if (!shankOnlyPrompt && /\bhalo\b/.test(text) && !includesAny(text, ["hidden halo", "single halo", "double halo"])) {
    intent.headStyle = GENERIC_HALO_ALIAS;
    intent.notes.push("mappedHalo");
  } else if (!shankOnlyPrompt) {
    const headStyle = findKeywordMatch(text, HEAD_STYLE_KEYWORDS);
    if (headStyle) intent.headStyle = headStyle;
  }

  if (shouldApplyShank) intent.ringShank = shank;

  const centerShapeMatch = text.match(
    /\b(round|emerald|oval|moval|pear|asscher|cushion|marquise|princess|radiant|heart)\s*(?:cut\s*)?(?:center\s*)?diamond\b/i
  );
  const shape = centerShapeMatch?.[1] || SHAPE_KEYWORDS.find((item) => {
    const hasExplicitShapePhrase =
      text.includes(`${item} shape`) ||
      text.includes(`${item} cut`) ||
      text.includes(`shape ${item}`) ||
      text.includes(`cut ${item}`);

    if (hasExplicitShapePhrase) return true;

    // "Green emerald" and "emerald gemstone" describe the stone type, not
    // an emerald-cut shape. Require an explicit shape phrase in that case.
    if (item === "emerald" && stoneMode?.activeTab === "Fancy-Gemstone") {
      return false;
    }

    return text.endsWith(item) || text.includes(` ${item} `);
  }) || findShapeKeyword(text);
  if (shape) intent.shape = shape;

  if (includesAny(text, ["lab grown", "lab-grown", "lab diamond"])) {
    intent.diamondType = "Lab";
  } else if (text.includes("natural diamond") || text.includes("natural stone")) {
    intent.diamondType = "Natural";
  }

  if (text.includes("high end") || text.includes("high-end") || text.includes("high quality") || text.includes("best quality") || text.includes("luxury")) {
    intent.quality = "High-End";
  } else if (text.includes("premium")) {
    intent.quality = "Premium";
  } else if (text.includes("standard")) {
    intent.quality = "Standard";
  }

  if (/\b(?:fl|if|vvs1|vvs2|vs1|vs2|si1|si2|i1|i2|i3)\s+clarity\b/i.test(text) || /\b(?:d|e|f|g|h|i|j|k|l)\s+colou?r\b/i.test(text)) {
    intent.notes.push("unsupportedDiamondGrading");
  }

  if (/\b(?:four|six|4|6)[ -]?prongs?\b/i.test(text)) {
    intent.notes.push("unsupportedProngDetail");
  }

  if (biMetalIntent) {
    intent.biMetalRequested = true;
    if (biMetalIntent.headMetalColor) {
      intent.headMetalColor = biMetalIntent.headMetalColor;
    }
    if (biMetalIntent.shankMetalColor) {
      intent.metalColor = biMetalIntent.shankMetalColor;
    }
  }

  if (!intent.biMetalRequested && !intent.metalColor) {
    if (text.includes("platinum")) {
      intent.platinum = true;
      intent.metalColor = "platinum";
    } else if (text.includes("rose gold")) {
      intent.metalColor = "rose";
    } else if (text.includes("white gold")) {
      intent.metalColor = "white";
    } else if (text.includes("yellow gold")) {
      intent.metalColor = "yellow";
    }
  }

  const purityMatch = text.match(/\b(\d{1,2})\s*k\b/i);
  if (purityMatch) {
    intent.metal = `${purityMatch[1]}K`;
  } else {
    const casualPurityMatch = text.match(/\b(\d{1,2})\s+gold\b/i);
    if (casualPurityMatch) intent.metal = `${casualPurityMatch[1]}K`;
  }

  if (matchingBandRequested) {
    intent.ringBand = "Yes";
    if (shank) intent.ringMatchingBand = shank;
  }
  if (includesAny(text, ["no matching band", "without matching band", "remove band", "no band"])) intent.ringBand = "No";

  if (includesAny(text, ["pave band", "pavé band", "micro pave", "micro pavé", "hidden pave", "hidden pavé"])) {
    if (!intent.ringShank || intent.ringShank === "PLAIN") {
      intent.ringShank = text.includes("split shank") ? "SPLIT" : "CHANNEL";
    }
    intent.notes.push("approximatedPave");
  }

  if (includesAny(text, ["thin band", "delicate band"])) {
    intent.ringShank = intent.ringShank ?? "PLAIN";
  }

  if (includesAny(text, ["leaves", "leaf", "vines", "vine", "organic flowing curves", "nature inspired", "nature-inspired"])) {
    intent.ringShank = intent.ringShank ?? "TWISTED";
    intent.notes.push("unsupportedNatureDetail");
  }

  if (includesAny(text, ["milgrain", "filigree", "floral filigree"])) {
    intent.notes.push("unsupportedVintageDetail");
  }

  if (includesAny(text, ["east west", "east-west"])) {
    intent.notes.push("unsupportedEastWest");
  }

  if (includesAny(text, ["floating diamond", "float above the band", "hidden support structure"])) {
    intent.notes.push("unsupportedFloating");
  }

  if (includesAny(text, ["surprise diamonds", "beneath the center stone", "intricate gallery", "gallery work", "hidden details"])) {
    intent.notes.push("unsupportedSurpriseDetail");
  }

  if (includesAny(text, ["toi et moi", "toi and moi", "toi-et-moi"])) {
    intent.unsupportedDesign = "toi-et-moi";
  }

  if (!intent.headStyle && includesAny(text, SIDE_STONE_PATTERNS)) {
    intent.headStyle = "three-stone";
  }

  const engravingValue = parseEngravingIntent(canonicalPrompt);
  if (engravingValue) intent.engraving = engravingValue.trim();
  if (includesAny(text, ["remove engraving", "clear engraving", "no engraving"])) intent.clearEngraving = true;

  if (ringSize) {
    intent.ringSize = ringSize;
  }

  if (stoneMode) Object.assign(intent, stoneMode);

  intent.budget = parseBudget(canonicalPrompt);
  intent.carat = parseCarat(canonicalPrompt);

  return intent;
};

const getConfiguredRemoteRingAiEndpoint = () =>
  process.env.NEXT_PUBLIC_RING_AI_API_URL?.trim() || "";

export const fetchRemoteRingIntent = async (prompt, parentUrl) => {
  const endpoint = getConfiguredRemoteRingAiEndpoint();
  if (!endpoint) return null;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, parentUrl }),
  });

  if (response.status === 204 || response.status === 503) {
    return null;
  }

  if (!response.ok) {
    throw new Error("AI service did not return a valid response.");
  }

  const payload = await response.json();
  return payload?.intent ?? payload ?? null;
};

export const shouldUseRemoteRingIntent = (prompt = "") => {
  if (!getConfiguredRemoteRingAiEndpoint()) return false;

  const normalizedPrompt = normalize(prompt);
  if (!normalizedPrompt) return false;
  if (!hasRingDomainSignal(prompt)) return false;

  const localIntent = parseRingAssistantPrompt(prompt);
  if (
    localIntent.infoRequest ||
    localIntent.noChangeRequested ||
    localIntent.undoRequested ||
    localIntent.resetRequested ||
    localIntent.viewMode
  ) {
    return false;
  }

  const detectedLanguage = detectPromptLanguage(prompt);
  const localControl = classifyPrompt(prompt, localIntent, detectedLanguage || "en");
  if (localControl) return false;
  const locallyResolved = [
    "headStyle",
    "ringShank",
    "shape",
    "diamondType",
    "quality",
    "metalColor",
    "metal",
    "ringBand",
    "carat",
    "caratPreference",
    "purityPreference",
    "budget",
    "engraving",
    "clearEngraving",
    "activeTab",
    "fancyDiamond",
    "gemstone",
    "unsupportedDesign",
  ].some((key) => hasMeaningfulIntentValue(localIntent[key]));

  const wordCount = normalizedPrompt.split(" ").filter(Boolean).length;
  const clauseCount = normalizedPrompt.split(/[,.!?]| and | with | featuring | include | including /i).filter((part) => part.trim()).length;
  const descriptiveSignals = [
    "inspired",
    "inspiration",
    "luxury",
    "luxurious",
    "contemporary",
    "modern",
    "classic",
    "vintage",
    "timeless",
    "minimalist",
    "architectural",
    "handcrafted",
    "elegant",
    "romantic",
    "royal",
    "nature",
    "organic",
    "floral",
    "filigree",
    "milgrain",
    "hidden details",
    "surprise diamonds",
    "gallery work",
    "event",
    "for this new year's eve cocktail party",
    "recommend",
    "suggest",
    "surprise me",
  ];

  const hasDescriptiveSignal = descriptiveSignals.some((term) => normalizedPrompt.includes(term));
  const hasLongStructure = wordCount >= 8 || clauseCount >= 3;
  const hasSentenceLikeShape = /[,.!?]/.test(prompt) || /\bwith\b.*\bwith\b/i.test(prompt);
  const hasMultilingualSignal = hasNonAsciiContent(prompt) || (detectedLanguage && detectedLanguage !== "en");
  const hasComplexShortPrompt = wordCount >= 4 && includesAny(normalizedPrompt, ["change", "create", "design", "build", "recommend", "suggest"]);

  return (
    hasMultilingualSignal ||
    hasDescriptiveSignal ||
    hasLongStructure ||
    hasSentenceLikeShape ||
    (hasComplexShortPrompt && !locallyResolved)
  );
};

const ACTIONABLE_INTENT_KEYS = [
  "headStyle", "ringShank", "shape", "diamondType", "quality", "metalColor", "metal",
  "ringBand", "ringMatchingBand", "carat", "budget", "engraving", "clearEngraving", "activeTab",
  "fancyDiamond", "gemstone", "unsupportedDesign", "ringSize", "pricePreference", "caratPreference", "purityPreference",
  "priceTarget", "resetRequested", "viewMode", "undoRequested", "noChangeRequested",
];

const countActionableIntent = (intent = {}) =>
  ACTIONABLE_INTENT_KEYS.filter((key) => hasMeaningfulIntentValue(intent[key])).length;

const hasUnresolvedFilterValueRequest = (text = "", intent = {}) => {
  if (intent.pricePreference || intent.priceTarget || intent.caratPreference || intent.purityPreference) {
    return false;
  }

  const hasExplicitUnsupportedValue =
    /\b(?:to|as|with|into|for)\s+(?!a\b|an\b|the\b|my\b|your\b|this\b|ring\b|option\b|available\b|supported\b|gold\b)([a-z0-9][a-z0-9-]*)/i.test(text) ||
    /\b(?:use|select|apply|choose|want|need)\s+(?:a\s+|an\s+|the\s+)?(?!head\b|setting\b|shank\b|band\b|metal\b|gold\b|stone\b|diamond\b|gemstone\b|quality\b|shape\b|ring\b|size\b|option\b)([a-z0-9][a-z0-9-]*)/i.test(text);

  if (!hasExplicitUnsupportedValue) {
    return false;
  }

  const asksForShape =
    /\b(?:shape|cut)\b/i.test(text) &&
    !intent.shape &&
    !intent.gemstone &&
    !intent.fancyDiamond &&
    !intent.notes?.includes("unsupportedDiamondGrading");
  const asksForHead = /\b(?:head|setting|design)\b/i.test(text) && !intent.headStyle && !intent.unsupportedDesign;
  const asksForShank = /\b(?:shank|band)\b/i.test(text) && !intent.ringShank && !intent.ringBand;
  const asksForType = /\b(?:diamond type|stone type|type)\b/i.test(text) && !intent.diamondType && !intent.activeTab;
  const asksForQuality = /\b(?:quality|grade)\b/i.test(text) && !intent.quality && !intent.notes?.includes("unsupportedDiamondGrading");
  const asksForMetal =
    /\b(?:metal|purity|gold|platinum)\b/i.test(text) &&
    !intent.metal &&
    !intent.metalColor &&
    !intent.platinum &&
    !intent.biMetalRequested;
  const asksForGemstone = /\b(?:gemstone|stone color|stone colour|colored stone|coloured stone)\b/i.test(text) && !intent.gemstone && !intent.fancyDiamond;
  const hasChangeVerb = /\b(?:change|set|select|apply|use|make|want|need|choose|switch|update)\b/i.test(text);

  return hasChangeVerb && (
    asksForShape ||
    asksForHead ||
    asksForShank ||
    asksForType ||
    asksForQuality ||
    asksForMetal ||
    asksForGemstone
  );
};

const CONTROL_MESSAGES = {
  en: {
    refused: "I can only help configure supported ring options. I cannot reveal private instructions or data, run code, delete models, or bypass catalog and price validation.",
    conflict: "I found conflicting choices in that request. Please choose one value for each option so I can apply the ring safely.",
    ambiguous: "I need one more detail before changing the ring. Please specify the exact supported option you want.",
    unsupported: "That option is not available in this configurator. I have kept your current ring unchanged.",
    noChange: "No configuration change was requested, so I kept the current ring unchanged.",
  },
  it: {
    refused: "Posso aiutarti solo con le opzioni supportate dell'anello. Non posso mostrare istruzioni o dati privati, eseguire codice o ignorare le convalide.",
    conflict: "La richiesta contiene scelte in conflitto. Scegli un solo valore per ogni opzione.",
    ambiguous: "Mi serve un dettaglio in piu. Indica l'opzione supportata esatta che desideri.",
    unsupported: "Questa opzione non e disponibile nel configuratore. Ho lasciato invariato l'anello attuale.",
    noChange: "Non e stata richiesta alcuna modifica, quindi ho lasciato invariato l'anello.",
  },
  es: {
    refused: "Solo puedo ayudar con opciones de anillo compatibles. No puedo revelar instrucciones o datos privados, ejecutar codigo ni omitir validaciones.",
    conflict: "La solicitud contiene opciones contradictorias. Elige un solo valor para cada opcion.",
    ambiguous: "Necesito un detalle mas. Indica la opcion compatible exacta que deseas.",
    unsupported: "Esa opcion no esta disponible en este configurador. El anillo actual no se ha modificado.",
    noChange: "No se solicito ningun cambio, por lo que mantuve el anillo actual.",
  },
  fr: {
    refused: "Je peux uniquement aider avec les options de bague prises en charge. Je ne peux pas reveler de donnees privees, executer du code ou contourner les validations.",
    conflict: "La demande contient des choix contradictoires. Choisissez une seule valeur pour chaque option.",
    ambiguous: "Il me faut un detail supplementaire. Indiquez l'option prise en charge exacte souhaitee.",
    unsupported: "Cette option n'est pas disponible dans ce configurateur. La bague actuelle reste inchangee.",
    noChange: "Aucune modification n'a ete demandee; la bague actuelle reste inchangee.",
  },
  de: {
    refused: "Ich kann nur bei unterstuetzten Ringoptionen helfen. Ich kann keine privaten Anweisungen oder Daten offenlegen, Code ausfuehren oder Validierungen umgehen.",
    conflict: "Die Anfrage enthaelt widerspruechliche Angaben. Bitte waehle pro Option genau einen Wert.",
    ambiguous: "Ich brauche noch eine genaue Angabe. Bitte nenne die gewuenschte unterstuetzte Option.",
    unsupported: "Diese Option ist im Konfigurator nicht verfuegbar. Der aktuelle Ring bleibt unveraendert.",
    noChange: "Es wurde keine Konfigurationsaenderung angefordert. Der aktuelle Ring bleibt unveraendert.",
  },
  pt: {
    refused: "So posso ajudar com opcoes de anel suportadas. Nao posso revelar instrucoes ou dados privados, executar codigo ou ignorar validacoes.",
    conflict: "O pedido contem escolhas contraditorias. Escolha apenas um valor para cada opcao.",
    ambiguous: "Preciso de mais um detalhe. Informe a opcao suportada exata que deseja.",
    unsupported: "Essa opcao nao esta disponivel neste configurador. O anel atual foi mantido sem alteracoes.",
    noChange: "Nenhuma alteracao foi solicitada, por isso mantive o anel atual.",
  },
  hi: {
    refused: "मैं केवल उपलब्ध रिंग विकल्पों में मदद कर सकता हूं। मैं निजी निर्देश या डेटा नहीं दिखा सकता और सत्यापन को बायपास नहीं कर सकता।",
    conflict: "अनुरोध में विरोधी विकल्प हैं। कृपया हर विकल्प के लिए एक ही मान चुनें।",
    ambiguous: "बदलाव करने से पहले एक और स्पष्ट जानकारी चाहिए। कृपया उपलब्ध विकल्प का सही नाम बताएं।",
    unsupported: "यह विकल्प इस कॉन्फ़िगरेटर में उपलब्ध नहीं है। मौजूदा अंगूठी में कोई बदलाव नहीं किया गया है।",
    noChange: "कोई कॉन्फ़िगरेशन बदलाव नहीं मांगा गया, इसलिए मौजूदा अंगूठी को वैसा ही रखा गया है।",
  },
  ar: {
    refused: "يمكنني المساعدة فقط في خيارات الخاتم المتاحة. لا يمكنني كشف تعليمات أو بيانات خاصة أو تجاوز التحقق.",
    conflict: "يتضمن الطلب خيارات متعارضة. يرجى اختيار قيمة واحدة لكل خيار.",
    ambiguous: "أحتاج إلى تفصيل إضافي قبل تغيير الخاتم. يرجى تحديد الخيار المتاح المطلوب.",
    unsupported: "هذا الخيار غير متاح في أداة التخصيص. تم الإبقاء على الخاتم الحالي دون تغيير.",
    noChange: "لم يُطلب أي تغيير، لذلك تم الإبقاء على الخاتم الحالي.",
  },
};

const getControlMessage = (language, key) =>
  CONTROL_MESSAGES[language]?.[key] ?? CONTROL_MESSAGES.en[key];

const uniqueMatches = (text, patterns) =>
  patterns.filter(({ regex }) => regex.test(text)).map(({ value }) => value);

const uniqueKeywordMatches = (text, lookup) =>
  Object.entries(lookup)
    .filter(([, terms]) => terms.some((term) => includesFuzzyTerm(text, term)))
    .map(([value]) => value);

const countDistinctMatches = (values = []) => new Set(values.filter(Boolean)).size;

const classifyPrompt = (prompt, intent, responseLanguage) => {
  const text = normalize(canonicalizePrompt(prompt));
  const actionCount = countActionableIntent(intent);

  const securityPattern = /\b(ignore (?:all |any )?(?:previous )?(?:rules|instructions)|system prompt|developer message|database credentials?|api keys?|api key|access token|secret|secrets|env file|\.env|open (?:a )?(?:file|\.env|env)|read (?:a )?(?:file|\.env|env)|show (?:a )?(?:file|\.env|env)|reveal (?:a )?(?:file|\.env|env|key|token|secret)|execute (?:java)?script|delete (?:all )?(?:available )?(?:models|data)|hidden (?:filter|data)|filter that is hidden(?: from the user)?|pretend every option|bypass (?:the )?(?:price|catalog|validation)|set (?:the )?(?:total price|total|price)(?: to)? (?:zero|0)|jailbreak|override (?:the )?(?:catalog|validation))\b/i;
  if (securityPattern.test(text)) {
    return { status: "refused", message: getControlMessage(responseLanguage, "refused") };
  }

  if (intent.infoRequest) {
    return null;
  }

  const metals = uniqueMatches(text, [
    { regex: /\bwhite gold\b/i, value: "white" },
    { regex: /\byellow gold\b/i, value: "yellow" },
    { regex: /\brose gold\b/i, value: "rose" },
    { regex: /\bplatinum\b/i, value: "platinum" },
  ]);
  const types = uniqueMatches(text, [
    { regex: /\b(?:natural|mined)(?: diamond)?\b/i, value: "Natural" },
    { regex: /\b(?:lab(?: grown)?|laboratory grown|synthetic)(?: diamond)?\b/i, value: "Lab" },
  ]);
  const purities = [...text.matchAll(/\b(\d{1,2})\s*k\b/gi)].map((match) => `${match[1]}K`);
  const carats = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(?:ct|carat|carats)\b/gi)].map((match) => Number(match[1]));
  const shapes = SHAPE_KEYWORDS.filter((shape) => new RegExp(`\\b${shape}\\b`, "i").test(text));
  const headStyles = uniqueKeywordMatches(text, HEAD_STYLE_KEYWORDS);
  if (/\bhalo\b/i.test(text) && !includesAny(text, ["hidden halo", "single halo", "double halo"])) {
    headStyles.push(GENERIC_HALO_ALIAS);
  }
  const shanks = uniqueKeywordMatches(text, SHANK_KEYWORDS);
  const qualities = uniqueMatches(text, [
    { regex: /\b(?:high end|high-end|luxury)\b/i, value: "High-End" },
    { regex: /\bpremium\b/i, value: "Premium" },
    { regex: /\bstandard\b/i, value: "Standard" },
  ]);
  const stoneModes = uniqueMatches(text, [
    { regex: /\b(?:colorless|white diamond|clear diamond)\b/i, value: "Colorless" },
    { regex: /\b(?:colored|coloured|color|colour)\s+diamonds?\b/i, value: "Fancy Colored" },
    { regex: /\b(?:fancy|color|colour|colored|coloured)?\s*gemstones?\b/i, value: "Fancy-Gemstone" },
  ]);
  const gemstones = GEMSTONE_PATTERNS.filter(({ regex }) => regex.test(text)).map(({ value }) => value);
  const fancyColors = FANCY_COLOR_PATTERNS.filter(
    (color) =>
      new RegExp(`\\b${color}\\s+diamond\\b`, "i").test(text) ||
      new RegExp(`\\b${color}\\s+colored\\s+diamond\\b`, "i").test(text) ||
      new RegExp(`\\b${color}\\s+stone\\b`, "i").test(text)
  );
  const contradictoryHalo = /\b(?:add|use|with) (?:a )?halo\b/i.test(text) && /\b(?:no|without) (?:a )?halo\b/i.test(text);
  const keepAndChangeEverything = /\bchange everything\b/i.test(text) && /\bkeep (?:everything|every option) (?:the )?same\b/i.test(text);
  const impossibleBudget = /\b(?:under|below)\s*[$\u20ac\u00a3\u20b9]?\s*\d[\d,]*\b/i.test(text) && /\bmost expensive\b/i.test(text);
  const contradictoryTone =
    (/\b(?:luxury|luxurious|premium|high end|high-end|most expensive|expensive)\b/i.test(text) &&
      /\b(?:cheap|cheaper|affordable|not too expensive|less expensive|budget friendly|budget-friendly)\b/i.test(text));
  const conflictingMetals = new Set(metals).size > (intent.biMetalRequested ? 2 : 1);
  const conflictingShanks =
    countDistinctMatches(shanks) > 1 &&
    !(/\bmatching bands?\b/i.test(text) && shanks.includes(intent.ringShank) && shanks.includes(intent.ringMatchingBand));

  if (
    conflictingMetals ||
    countDistinctMatches(purities) > 1 ||
    countDistinctMatches(types) > 1 ||
    countDistinctMatches(carats) > 1 ||
    countDistinctMatches(shapes) > 1 ||
    countDistinctMatches(headStyles) > 1 ||
    conflictingShanks ||
    countDistinctMatches(qualities) > 1 ||
    countDistinctMatches(stoneModes) > 1 ||
    countDistinctMatches(gemstones) > 1 ||
    countDistinctMatches(fancyColors) > 1 ||
    contradictoryHalo ||
    keepAndChangeEverything ||
    impossibleBudget ||
    contradictoryTone
  ) {
    return { status: "clarification", message: getControlMessage(responseLanguage, "conflict") };
  }

  const unsupportedOptionPattern = /\b(hexagon|hexagonal|kite|trapezoid|trapezoidal|black gold|amethyst|opal|aquamarine|birthstone|certification|certificate|resize|resizing|delivery|ship|shipping|payment|pay for)\b/i;
  const unsupportedFilterPattern = /\b(?:clarity|diamond color|colour grade|cut|six prong|6 prong|four prong|4 prong|band width|engraving font)\b/i;
  const unsupportedDesignOnly = intent.notes?.some((note) => [
    "unsupportedEastWest", "unsupportedFloating", "unsupportedSurpriseDetail",
    "unsupportedVintageDetail", "unsupportedNatureDetail",
  ].includes(note));
  const comparativeUnsupportedTerm = /\b(?:more about|care more|over diamond|best|medium)\b/i.test(text);
  if (
    unsupportedOptionPattern.test(text) ||
    intent.unsupportedDesign ||
    hasUnresolvedFilterValueRequest(text, intent) ||
    (unsupportedFilterPattern.test(text) && actionCount <= 1 && !comparativeUnsupportedTerm) ||
    (unsupportedDesignOnly && actionCount === 0)
  ) {
    return { status: "unsupported", message: getControlMessage(responseLanguage, "unsupported") };
  }

  const ambiguousPattern = /^(?:make it better|change the color|use a larger one|make it bigger|give me the best option|i do not like this|use gold|change the stone|change the head(?:,? not the shank)?|change only the gemstone color|keep everything the same and increase the carat|make it cheaper|make this more affordable|give me a premium configuration with no budget limit)[.! ]*$/i;
  const exclusionPattern = /\b(anything except|do not use|don't use|not a natural diamond|avoid very dark|without changing my current model)\b/i;
  const vagueColorPattern = /\b(?:blue stone|light pink gemstone|light-pink gemstone|gemstone color|colour best|clarity medium)\b/i;
  const unknownBudget = /\b(?:under my budget|within my budget|budget low|not much costly|less price|more affordable|cheaper)\b/i.test(text) && !intent.budget;
  const relativePriceRequest = /\b(?:reduce|lower|decrease) (?:the )?price by\b/i.test(text);
  const impreciseGemstoneColor = /\b(?:not too dark|bahut dark nahi|light pink|light-pink)\b/i.test(text);
  const unspecifiedGemstone = /\bgemstones?\b/i.test(text) && !intent.gemstone && intent.activeTab !== "Fancy-Gemstone";
  const descriptiveOnly = /\b(timeless|elegant|luxurious|modern bride|royal ring|low maintenance|low-maintenance|simple jewelry|not flashy|looks bigger|sparkle over|size than clarity|surprise me)\b/i.test(text) && actionCount === 0;
  const rangeRequest = /\b(?:between|from)\s+[$\u20ac\u00a3\u20b9]?\s*\d[\d,]*(?:\.\d+)?\s+(?:and|to)\s+[$\u20ac\u00a3\u20b9]?\s*\d[\d,]*(?:\.\d+)?\s*(?:ct|carat|carats)?\b/i.test(text);
  const boundedCaratRequest = /\b(?:at least|not more than|no more than|up to)\s+\d+(?:\.\d+)?\s*(?:ct|carat|carats)\b/i.test(text);
  if (ambiguousPattern.test(text) || exclusionPattern.test(text) || vagueColorPattern.test(text) || unspecifiedGemstone || unknownBudget || relativePriceRequest || impreciseGemstoneColor || descriptiveOnly || rangeRequest || boundedCaratRequest) {
    return { status: "clarification", message: getControlMessage(responseLanguage, "ambiguous") };
  }

  if (/\bkeep everything else (?:the )?same\b/i.test(text)) {
    return { status: "no-change", message: getControlMessage(responseLanguage, "noChange") };
  }

  return null;
};

const getBaseState = (parentUrl, currentState = {}) => {
  const defaults = getStoreDefaults(parentUrl);
  const sizeOption = currentState.sizeOption ?? getRingSizeType(parentUrl);
  const ringSizes = getAvailableRingSizes(sizeOption);

  return {
    ...defaults,
    ...currentState,
    sizeOption,
    ringSize: currentState.ringSize ?? ringSizes[0] ?? "3",
    selectedQuality: {
      ...defaults.selectedQuality,
      ...(currentState.selectedQuality ?? {}),
    },
  };
};

const resolveStoneSelection = (baseState, intent, settings, overrides = {}) => {
  const { availableOptions } = settings;
  const nextActiveTab = overrides.activeTab ?? intent.activeTab ?? baseState.activeTab;
  const nextColorType = overrides.colorType ?? intent.colorType ?? baseState.colorType;
  const nextType = overrides.diamondType ?? intent.diamondType ?? baseState.selectedQuality.type;
  const nextQuality = overrides.quality ?? intent.quality ?? baseState.selectedQuality.quality;
  const nextShape = overrides.shape ?? intent.shape ?? baseState.shape;

  const activeTab = ["Colorless", "Fancy Colored", "Fancy-Gemstone"].includes(nextActiveTab)
    ? nextActiveTab
    : "Colorless";
  const colorType =
    nextColorType ||
    (activeTab === "Fancy Colored" ? "fancycolored" : activeTab === "Fancy-Gemstone" ? "fancygem" : "colorless");
  const diamondType = availableOptions.diamondTypes.includes(nextType) ? nextType : firstAvailable(availableOptions.diamondTypes, "Lab");
  const quality = availableOptions.qualityLevels.includes(nextQuality)
    ? nextQuality
    : firstAvailable(availableOptions.qualityLevels, "Standard");
  const requestedFancyDiamond = overrides.fancyDiamond ?? intent.fancyDiamond;
  const fancyDiamond = requestedFancyDiamond && availableOptions.coloredDiamonds.includes(requestedFancyDiamond)
    ? requestedFancyDiamond
    : availableOptions.coloredDiamonds.includes(baseState.fancyDiamond)
      ? baseState.fancyDiamond
      : firstAvailable(availableOptions.coloredDiamonds, baseState.fancyDiamond);
  const requestedGemstone = overrides.gemstone ?? intent.gemstone;
  const gemstone = requestedGemstone && availableOptions.gemstones.includes(requestedGemstone)
    ? requestedGemstone
    : availableOptions.gemstones.includes(baseState.gemstone)
      ? baseState.gemstone
      : firstAvailable(availableOptions.gemstones, baseState.gemstone);
  const diamondSize = overrides.carat ?? intent.carat ?? baseState.diamondSize ?? 1;
  const shape = availableOptions.diamondShapes.includes(nextShape) ? nextShape : firstAvailable(availableOptions.diamondShapes, "round");

  return {
    activeTab,
    colorType,
    diamondType,
    selectedQuality: {
      type: diamondType,
      quality,
    },
    fancyDiamond,
    gemstone,
    diamondSize,
    shape,
  };
};

const calculateStoneTotal = (parentUrl, candidate) => {
  const basePrice = getDiamondPrice(parentUrl, candidate.diamondSize, candidate.selectedQuality.quality, candidate.selectedQuality.type);

  if (candidate.activeTab === "Fancy Colored") {
    return basePrice + getColoredDiamondExtraPrice(parentUrl, candidate.fancyDiamond);
  }

  if (candidate.activeTab === "Fancy-Gemstone") {
    const adjustedBase = Math.round(basePrice * getFancyPriceFactor(parentUrl));
    return adjustedBase + getGemstoneExtraPrice(parentUrl, candidate.gemstone);
  }

  return basePrice;
};

const calculateRingTotals = (parentUrl, candidate) => {
  const metalPriceKey = candidate.platinum ? "Platinum" : candidate.metal;
  const stylePrice = getShankPrice(parentUrl, candidate.ringShank);
  const metalPrice = getMetalPrice(parentUrl, metalPriceKey);
  const matchingBandPrice = candidate.ringBand === "Yes" ? getMatchingBandPrice(parentUrl, candidate.ringMatchingBand) : 0;
  const headPrice = getHeadPrice(parentUrl, candidate.ringHead);
  const engravingPrice = candidate.engraving ? getEngravingPrice(parentUrl) : 0;

  return {
    stylePrice,
    metalPrice,
    matchingBandPrice,
    engravingPrice,
    headPrice,
    shankTotal: stylePrice + metalPrice + matchingBandPrice + engravingPrice,
    finalRingPrice: stylePrice + metalPrice + matchingBandPrice + engravingPrice + headPrice,
  };
};

const buildCandidate = (parentUrl, settings, baseState, intent, overrides = {}) => {
  const { availableOptions } = settings;
  const headStyle = overrides.headStyle ?? intent.headStyle ?? baseState.headStyle;
  const safeHeadStyle = availableOptions.headStyles.includes(headStyle) ? headStyle : firstAvailable(availableOptions.headStyles, "plain");
  const supportedShapes = getSupportedShapesForHeadStyle(safeHeadStyle, settings);
  const requestedShape = overrides.shape ?? intent.shape;
  const nextShape =
    requestedShape && supportedShapes.includes(requestedShape)
      ? requestedShape
      : requestedShape
        ? getDefaultShapeForHeadStyle(safeHeadStyle, settings)
        : intent.headStyle && !intent.shape
          ? getDefaultShapeForHeadStyle(safeHeadStyle, settings)
          : supportedShapes.includes(baseState.shape)
            ? baseState.shape
            : getDefaultShapeForHeadStyle(safeHeadStyle, settings);

  const stoneSelection = resolveStoneSelection(baseState, { ...intent, shape: nextShape }, settings, {
    ...overrides,
    shape: nextShape,
  });
  const headSelection = getResolvedHeadSelection(safeHeadStyle, stoneSelection.shape, settings);

  const ringBand = overrides.ringBand ?? intent.ringBand ?? baseState.ringBand;
  const matchingSelection = normalizeMatchingBandSelection(
    ringBand,
    overrides.ringShank ?? intent.ringShank ?? baseState.ringShank,
    overrides.ringMatchingBand ?? intent.ringMatchingBand ?? baseState.ringMatchingBand,
    overrides.ringSideSetting ?? baseState.ringSideSetting,
    settings
  );

  const requestedMetal = overrides.metal ?? intent.metal ?? baseState.metal;
  const metal = availableOptions.metalPurities.includes(requestedMetal) ? requestedMetal : firstAvailable(availableOptions.metalPurities, "14K");
  const explicitMetalColor = overrides.metalColor ?? intent.metalColor;
  const explicitGoldMetal = explicitMetalColor && explicitMetalColor !== "platinum";
  const explicitPuritySelection = Boolean(overrides.metal ?? intent.metal);
  const platinum = overrides.platinum ?? intent.platinum ?? ((explicitGoldMetal || explicitPuritySelection) ? false : baseState.platinum ?? false);
  const metalColor = platinum
    ? METAL_COLORS.platinum
    : METAL_COLORS[explicitMetalColor] ?? baseState.metalColor ?? METAL_COLORS.yellow;
  const headMetalColorKey =
    overrides.headMetalColor ??
    intent.headMetalColor ??
    (baseState.isEnabled ? Object.keys(METAL_COLORS).find((key) => METAL_COLORS[key] === baseState.headColor) : null);
  const headColor = !platinum && (overrides.biMetalRequested ?? intent.biMetalRequested ?? baseState.isEnabled)
    ? METAL_COLORS[headMetalColorKey] ?? baseState.headColor ?? metalColor
    : metalColor;
  const isEnabled = !platinum && headColor !== metalColor;

  const candidate = {
    ...baseState,
    ...stoneSelection,
    ...headSelection,
    ...matchingSelection,
    metal,
    platinum,
    metalColor,
    ringColor: metalColor,
    bandColor: metalColor,
    headColor,
    headMetalColor: headMetalColorKey,
    engraving: intent.clearEngraving ? "" : overrides.engraving ?? intent.engraving ?? baseState.engraving ?? "",
    ringSize: overrides.ringSize ?? intent.ringSize ?? baseState.ringSize,
    sizeOption: overrides.sizeOption ?? baseState.sizeOption ?? getRingSizeType(parentUrl),
    isEnabled,
  };

  const stoneTotal = calculateStoneTotal(parentUrl, candidate);
  const ringTotals = calculateRingTotals(parentUrl, candidate);

  return {
    ...candidate,
    stoneTotal,
    ringTotals,
    total: ringTotals.shankTotal + ringTotals.headPrice + stoneTotal,
  };
};

const scoreCandidate = (candidate, intent, baseState) => {
  let score = 0;
  if (intent.shape && candidate.shape === intent.shape) score += 35;
  if (intent.headStyle && candidate.headStyle === intent.headStyle) score += 30;
  if (intent.diamondType && candidate.selectedQuality.type === intent.diamondType) score += 25;
  if (intent.quality && candidate.selectedQuality.quality === intent.quality) score += 15;
  if (intent.ringShank && candidate.ringShank === intent.ringShank) score += 15;
  if (intent.metal && candidate.metal === intent.metal) score += 10;
  if (intent.activeTab && candidate.activeTab === intent.activeTab) score += 25;
  if (!intent.activeTab && candidate.activeTab === baseState.activeTab) score += 10;
  if (intent.carat && candidate.diamondSize === intent.carat) score += 20;
  score += candidate.diamondSize;
  score += Math.min(candidate.total / 1000, 10);
  return score;
};

const buildComparativeCandidate = (parentUrl, settings, baseState, intent) => {
  const target = intent.priceTarget;
  const preference = intent.pricePreference;
  if (!target || !preference) return null;

  if (target === "total") {
    const candidates = [];
    const carats = getAvailableCarats(parentUrl, settings);
    settings.availableOptions.shankStyles.forEach((ringShank) => {
      settings.availableOptions.headStyles.forEach((headStyle) => {
        if (
          (headStyle === "three-stone" && !THREE_STONE_COMPATIBLE_SHANKS.includes(ringShank)) ||
          (headStyle === "bezel" && BEZEL_INCOMPATIBLE_SHANKS.includes(ringShank))
        ) {
          return;
        }
        settings.availableOptions.metalPurities.forEach((metal) => {
          settings.availableOptions.diamondTypes.forEach((diamondType) => {
            settings.availableOptions.qualityLevels.forEach((quality) => {
              carats.forEach((carat) => {
                candidates.push(
                  buildCandidate(parentUrl, settings, baseState, intent, {
                    ringShank,
                    headStyle,
                    metal,
                    platinum: false,
                    diamondType,
                    quality,
                    carat,
                  })
                );
              });
            });
          });
        });
      });
    });

    return candidates
      .sort((a, b) => (preference === "min" ? a.total - b.total : b.total - a.total))[0] ?? null;
  }

  let options = [];
  let buildOverride = (value) => ({});

  if (target === "ringShank") {
    options = settings.availableOptions.shankStyles;
    buildOverride = (value) => ({ ringShank: value });
  } else if (target === "metal") {
    options = settings.availableOptions.metalPurities;
    buildOverride = (value) => ({ metal: value, platinum: false });
  } else if (target === "headStyle") {
    options = settings.availableOptions.headStyles.filter((headStyle) => {
      if (headStyle === "three-stone") return THREE_STONE_COMPATIBLE_SHANKS.includes(baseState.ringShank);
      if (headStyle === "bezel") return !BEZEL_INCOMPATIBLE_SHANKS.includes(baseState.ringShank);
      return true;
    });
    buildOverride = (value) => ({ headStyle: value });
  }

  if (!options.length) return null;

  const ranked = options
    .map((value) => buildCandidate(parentUrl, settings, baseState, intent, buildOverride(value)))
    .sort((a, b) => (preference === "min" ? a.total - b.total : b.total - a.total));

  return ranked[0] ?? null;
};

const getComparativeTargetValue = (config, target) => {
  if (target === "ringShank") return config.ringShank;
  if (target === "metal") return `${config.platinum ? "Platinum" : config.metal}-${config.metalColor}`;
  if (target === "headStyle") return config.headStyle;
  if (target === "total") return config.total;
  return null;
};

const getViewModeLabel = (viewMode = "") => ({
  perspective: "default",
  perspectiveHeadView: "diamond",
  engravingZoom: "engraving zoom",
}[viewMode] ?? viewMode);

const validateIntent = (parentUrl, settings, baseState, intent, responseLanguage) => {
  const { availableOptions, rules } = settings;
  const issues = [];
  const availableCarats = getAvailableCarats(parentUrl, settings);

  if (intent.unsupportedDesign === "toi-et-moi") {
    issues.push({
      message: translateAssistantText(parentUrl, "unsupportedToiEtMoi"),
      suggestions: ["Hidden Halo", "Halo", "Three Stone", "Solitaire"],
    });
  }

  if (intent.carat !== null && intent.carat !== undefined && !availableCarats.includes(intent.carat)) {
    const nearest = getNearestValues(availableCarats, intent.carat).map((value) => `${value} ct`);
    issues.push({
      message: translateAssistantText(parentUrl, "caratUnavailable", { requested: intent.carat }, responseLanguage),
      suggestions: nearest,
    });
  }

  if (intent.shape && !availableOptions.diamondShapes.includes(intent.shape)) {
    issues.push({
      message: translateAssistantText(parentUrl, "shapeUnavailable", { shape: toTitleCase(intent.shape) }, responseLanguage),
      suggestions: availableOptions.diamondShapes.slice(0, 4).map(toTitleCase),
    });
  }

  if (intent.metal && !availableOptions.metalPurities.includes(intent.metal)) {
    issues.push({
      message: translateAssistantText(parentUrl, "metalUnavailable", { metal: intent.metal }, responseLanguage),
      suggestions: availableOptions.metalPurities,
    });
  }

  if (intent.diamondType && !availableOptions.diamondTypes.includes(intent.diamondType)) {
    issues.push({
      message: translateAssistantText(parentUrl, "typeUnavailable", { type: intent.diamondType }, responseLanguage),
      suggestions: availableOptions.diamondTypes,
    });
  }

  if (intent.quality && !availableOptions.qualityLevels.includes(intent.quality)) {
    issues.push({
      message: translateAssistantText(parentUrl, "qualityUnavailable", { quality: intent.quality }, responseLanguage),
      suggestions: availableOptions.qualityLevels,
    });
  }

  if (intent.activeTab === "Fancy Colored" && intent.fancyDiamond && !availableOptions.coloredDiamonds.includes(intent.fancyDiamond)) {
    issues.push({
      message: translateAssistantText(parentUrl, "coloredUnavailable", { color: intent.fancyDiamond }, responseLanguage),
      suggestions: availableOptions.coloredDiamonds.slice(0, 4),
    });
  }

  if (intent.activeTab === "Fancy-Gemstone" && intent.gemstone && !availableOptions.gemstones.includes(intent.gemstone)) {
    issues.push({
      message: translateAssistantText(parentUrl, "gemstoneUnavailable", { gemstone: toTitleCase(intent.gemstone) }, responseLanguage),
      suggestions: availableOptions.gemstones.slice(0, 4).map(toTitleCase),
    });
  }

  if (intent.biMetalRequested) {
    if (intent.platinum || intent.metalColor === "platinum") {
      issues.push({
        message: "Bi-metal is only available with gold base metals in this configurator.",
        suggestions: ["White Gold", "Yellow Gold", "Rose Gold"],
      });
    }

    if (intent.headMetalColor === "platinum") {
      issues.push({
        message: "A platinum head is not available with a gold shank in this configurator.",
        suggestions: ["White Gold head", "Yellow Gold head", "Rose Gold head"],
      });
    }
  }

  if (intent.ringSize) {
    const sizeOption = baseState.sizeOption ?? getRingSizeType(parentUrl);
    const ringSizes = getAvailableRingSizes(sizeOption);
    if (!ringSizes.includes(intent.ringSize)) {
      issues.push({
        message: `Ring size ${intent.ringSize} is not available for this store.`,
        suggestions: ringSizes.slice(0, 5),
      });
    }
  }

  const effectiveHeadStyle = intent.headStyle ?? baseState.headStyle;
  const effectiveShank = (intent.ringShank ?? baseState.ringShank)?.toUpperCase();
  const effectiveRingBand = intent.ringBand ?? baseState.ringBand;
  const effectiveShape = intent.shape ?? baseState.shape;
  const supportedShapes = getSupportedShapesForHeadStyle(effectiveHeadStyle, settings);

  if ((intent.shape || intent.headStyle) && !supportedShapes.includes(effectiveShape)) {
    issues.push({
      message: translateAssistantText(parentUrl, "headShapeUnsupported", {
        head: HEAD_STYLE_LABELS[effectiveHeadStyle] ?? toTitleCase(effectiveHeadStyle),
        options: supportedShapes.map(toTitleCase).join(", "),
      }, responseLanguage),
      suggestions: supportedShapes.map(toTitleCase),
    });
  }

  if (effectiveHeadStyle === "three-stone" && !THREE_STONE_COMPATIBLE_SHANKS.includes(effectiveShank)) {
    issues.push({
      message: translateAssistantText(parentUrl, "threeStoneShank", {
        head: HEAD_STYLE_LABELS["three-stone"],
        options: THREE_STONE_COMPATIBLE_SHANKS.map(toTitleCase).join(", "),
      }, responseLanguage),
      suggestions: THREE_STONE_COMPATIBLE_SHANKS.map(toTitleCase),
    });
  }

  if (effectiveHeadStyle === "bezel" && BEZEL_INCOMPATIBLE_SHANKS.includes(effectiveShank)) {
    issues.push({
      message: translateAssistantText(parentUrl, "bezelShank", {
        head: HEAD_STYLE_LABELS.bezel,
        options: BEZEL_INCOMPATIBLE_SHANKS.map(toTitleCase).join(", "),
      }, responseLanguage),
      suggestions: ["Plain", "Wide Plain", "Knife Edge", "Cathedral"],
    });
  }

  if (effectiveHeadStyle === "three-stone" && !rules.threeStoneShapes.includes(effectiveShape)) {
    issues.push({
      message: translateAssistantText(parentUrl, "threeStoneShape", {
        head: HEAD_STYLE_LABELS["three-stone"],
        options: rules.threeStoneShapes.map(toTitleCase).join(", "),
      }, responseLanguage),
      suggestions: rules.threeStoneShapes.map(toTitleCase),
    });
  }

  if (effectiveRingBand === "Yes" && !rules.matchingBandCompatibleShanks.includes(effectiveShank)) {
    issues.push({
      message: translateAssistantText(parentUrl, "matchingBandUnsupported", { shank: toTitleCase(effectiveShank) }, responseLanguage),
      suggestions: rules.matchingBandCompatibleShanks.map(toTitleCase),
    });
  }

  if (effectiveRingBand === "Yes" && intent.ringMatchingBand && !availableOptions.matchingBandStyles.includes(intent.ringMatchingBand)) {
    issues.push({
      message: `${toTitleCase(intent.ringMatchingBand)} matching band is not available for this store.`,
      suggestions: availableOptions.matchingBandStyles.map(toTitleCase),
    });
  }

  return issues;
};

const mergeNotesIntoMessage = (parentUrl, message, notes = [], responseLanguage) => {
  if (!notes.length) return message;
  const resolvedNotes = notes.map((note) =>
    translateAssistantText(parentUrl, note, {}, responseLanguage) || note
  );
  return `${message} ${resolvedNotes.join(" ")}`;
};

const hasMeaningfulIntentValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

const mergeAssistantIntents = (localIntent = {}, remoteIntent = null) => {
  if (!remoteIntent) {
    return {
      ...localIntent,
      notes: [...(localIntent.notes ?? [])],
    };
  }

  const merged = { ...localIntent };

  Object.entries(remoteIntent).forEach(([key, value]) => {
    if (key === "notes" || key === "language" || key === "responseLanguage") {
      return;
    }

    // Deterministic parsing is authoritative for explicitly recognized fields.
    // The LLM may enrich missing details, but must never replace a direct user
    // request or introduce a conflicting interpretation of that same phrase.
    if (!hasMeaningfulIntentValue(localIntent[key]) && hasMeaningfulIntentValue(value)) {
      merged[key] = value;
    }
  });

  if (
    localIntent.activeTab === "Fancy-Gemstone" &&
    localIntent.gemstone &&
    !localIntent.shape &&
    remoteIntent.shape === "emerald"
  ) {
    delete merged.shape;
  }

  merged.notes = [...(localIntent.notes ?? []), ...(remoteIntent.notes ?? [])];

  return merged;
};

export const resolveRingAssistantConfig = (prompt, parentUrl, currentState = {}, remoteIntent = null) => {
  const settings = getStoreCustomizationSettings(parentUrl);
  const localIntent = parseRingAssistantPrompt(prompt);
  const useFreshBaseState = shouldStartFreshDesign(prompt, localIntent);
  const currentBaseState = getBaseState(parentUrl, currentState);
  const baseState = useFreshBaseState ? getBaseState(parentUrl, {}) : currentBaseState;
  const detectedPromptLanguage = detectPromptLanguage(prompt);
  const responseLanguage =
    remoteIntent?.responseLanguage ||
    remoteIntent?.language ||
    detectedPromptLanguage ||
    getStoreLanguage(parentUrl);
  const intent = mergeAssistantIntents(localIntent, remoteIntent);
  if (intent.caratPreference && (intent.carat === null || intent.carat === undefined)) {
    const availableCarats = getAvailableCarats(parentUrl, settings);
    intent.carat = intent.caratPreference === "max"
      ? availableCarats[availableCarats.length - 1]
      : availableCarats[0];
  }
  if (intent.purityPreference && !intent.metal) {
    const sortedPurities = [...settings.availableOptions.metalPurities].sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));
    intent.metal = intent.purityPreference === "max"
      ? sortedPurities[sortedPurities.length - 1]
      : sortedPurities[0];
    intent.platinum = false;
  }

  const control = classifyPrompt(prompt, intent, responseLanguage);
  if (control) {
    return {
      config: buildCandidate(parentUrl, settings, currentBaseState, {}),
      intent,
      responseLanguage,
      status: control.status,
      message: control.message,
    };
  }

  if (!hasRingDomainSignal(prompt) && countActionableIntent(localIntent) === 0) {
    return {
      config: buildCandidate(parentUrl, settings, currentBaseState, {}),
      intent: localIntent,
      responseLanguage,
      status: "clarification",
      message: getControlMessage(responseLanguage, "ambiguous"),
    };
  }

  if (intent.resetRequested) {
    return {
      config: getBaseState(parentUrl, {}),
      intent,
      responseLanguage,
      status: "reset",
      message: "I reset the ring to the default configuration.",
    };
  }

  if (intent.undoRequested) {
    return {
      config: buildCandidate(parentUrl, settings, currentBaseState, {}),
      intent,
      responseLanguage,
      status: "undo",
      message: "I restored the previous ring configuration.",
    };
  }

  if (intent.noChangeRequested) {
    return {
      config: buildCandidate(parentUrl, settings, currentBaseState, {}),
      intent,
      responseLanguage,
      status: "no-change",
      message: getControlMessage(responseLanguage, "noChange"),
    };
  }

  if (intent.viewMode) {
    return {
      config: buildCandidate(parentUrl, settings, currentBaseState, {}),
      intent,
      responseLanguage,
      status: "view",
      message: intent.viewMode === "360"
        ? "I switched the viewer to 360 mode."
        : intent.viewMode === "off"
          ? "I turned off 360 mode."
          : `I switched the viewer to the ${getViewModeLabel(intent.viewMode)} view.`,
    };
  }

  if (intent.infoRequest === "price" && countActionableIntent(intent) === 0) {
    const currentConfig = buildCandidate(parentUrl, settings, currentBaseState, {});
    return {
      config: currentConfig,
      intent,
      responseLanguage,
      status: "info",
      message: `The current ring price is ${formatStoreCurrency(currentConfig.total, parentUrl)}.`,
    };
  }

  if (intent.infoRequest === "currentConfig") {
    const currentConfig = buildCandidate(parentUrl, settings, currentBaseState, {});
    return {
      config: currentConfig,
      intent,
      responseLanguage,
      status: "info",
      message: buildCurrentConfigMessage(currentConfig, parentUrl),
    };
  }

  if (intent.infoRequest === "advice") {
    return {
      config: buildCandidate(parentUrl, settings, currentBaseState, {}),
      intent,
      responseLanguage,
      status: "info",
      message: buildAdviceMessage(prompt),
    };
  }

  if (intent.infoRequest === "caratAvailability") {
    const availableCarats = getAvailableCarats(parentUrl, settings);
    const isAvailable = availableCarats.includes(intent.carat);
    return {
      config: buildCandidate(parentUrl, settings, currentBaseState, {}),
      intent,
      responseLanguage,
      status: isAvailable ? "info" : "unsupported",
      message: isAvailable
        ? `${intent.carat} ct is available for this store.`
        : buildUnsupportedMessage(parentUrl, {
            message: translateAssistantText(parentUrl, "caratUnavailable", { requested: intent.carat }, responseLanguage),
            suggestions: getNearestValues(availableCarats, intent.carat).map((value) => `${value} ct`),
          }, responseLanguage),
    };
  }

  if (intent.infoRequest && intent.infoRequest !== "price" && countActionableIntent(intent) === 0) {
    return {
      config: buildCandidate(parentUrl, settings, currentBaseState, {}),
      intent,
      responseLanguage,
      status: "info",
      message: buildAvailableOptionsMessage(intent.infoRequest, settings, currentBaseState, parentUrl),
    };
  }

  if (countActionableIntent(intent) === 0) {
    return {
      config: buildCandidate(parentUrl, settings, currentBaseState, {}),
      intent,
      responseLanguage,
      status: "clarification",
      message: getControlMessage(responseLanguage, "ambiguous"),
    };
  }

  const issues = validateIntent(parentUrl, settings, baseState, intent, responseLanguage);
  if (issues.length > 0) {
    const fallback = buildCandidate(parentUrl, settings, currentBaseState, {});
    return {
      config: fallback,
      intent,
      responseLanguage,
      status: "unsupported",
      message: buildUnsupportedMessage(parentUrl, issues[0], responseLanguage),
    };
  }

  if (intent.pricePreference && intent.priceTarget) {
    const rankedCandidate = buildComparativeCandidate(parentUrl, settings, baseState, intent);
    if (rankedCandidate) {
      const targetValue = getComparativeTargetValue(rankedCandidate, intent.priceTarget);
      const currentTargetValue = getComparativeTargetValue(baseState, intent.priceTarget);
      const noun =
        intent.priceTarget === "ringShank"
          ? "shank"
          : intent.priceTarget === "headStyle"
            ? "head style"
            : intent.priceTarget === "metal"
              ? "metal option"
              : "ring configuration";

      return {
        config: rankedCandidate,
        intent,
        responseLanguage,
        status: targetValue === currentTargetValue ? "info" : "ready",
        message:
          targetValue === currentTargetValue
            ? intent.pricePreference === "min"
              ? `The current ring already uses the lowest-priced available ${noun} in this configurator.`
              : `The current ring already uses the highest-priced available ${noun} in this configurator.`
            : intent.pricePreference === "min"
              ? `I applied the lowest-priced available ${noun} in this configurator.`
              : `I applied the highest-priced available ${noun} in this configurator.`,
      };
    }
  }

  const requested = buildCandidate(parentUrl, settings, baseState, intent);
  if (!intent.budget || requested.total <= intent.budget) {
    return {
      config: requested,
      intent,
      responseLanguage,
      status: "ready",
      message: mergeNotesIntoMessage(
        parentUrl,
        intent.budget
          ? translateAssistantText(parentUrl, "appliedBudget", {
              price: formatStoreCurrency(requested.total, parentUrl),
              budget: formatStoreCurrency(intent.budget, parentUrl),
            }, responseLanguage)
          : translateAssistantText(parentUrl, "applied", {}, responseLanguage),
        intent.notes,
        responseLanguage
      ),
    };
  }

  const candidates = [];
  const availableCarats = getAvailableCarats(parentUrl, settings);
  const carats = intent.carat ? availableCarats.filter((carat) => carat <= intent.carat) : availableCarats;
  const types =
    intent.diamondType && settings.availableOptions.diamondTypes.includes(intent.diamondType)
      ? [intent.diamondType]
      : settings.availableOptions.diamondTypes;
  const qualities =
    intent.quality && settings.availableOptions.qualityLevels.includes(intent.quality)
      ? settings.availableOptions.qualityLevels.filter(
          (quality) =>
            settings.availableOptions.qualityLevels.indexOf(quality) <= settings.availableOptions.qualityLevels.indexOf(intent.quality)
        )
      : settings.availableOptions.qualityLevels;
  const metals = intent.platinum
    ? [baseState.metal]
    : intent.metal && settings.availableOptions.metalPurities.includes(intent.metal)
      ? [intent.metal, ...settings.availableOptions.metalPurities.filter((purity) => purity !== intent.metal)]
      : settings.availableOptions.metalPurities;

  carats.forEach((carat) => {
    types.forEach((diamondType) => {
      qualities.forEach((quality) => {
        metals.forEach((metal) => {
          candidates.push(
            buildCandidate(parentUrl, settings, baseState, intent, {
              carat,
              diamondType,
              quality,
              metal,
              platinum: false,
            })
          );
        });
      });
    });
  });

  const valid = candidates
    .filter((candidate) => candidate.total <= intent.budget)
    .sort((a, b) => scoreCandidate(b, intent, baseState) - scoreCandidate(a, intent, baseState));

  if (valid.length > 0) {
    const best = valid[0];
    return {
      config: best,
      intent,
      responseLanguage,
      status: "adjusted",
      message: mergeNotesIntoMessage(
        parentUrl,
        translateAssistantText(parentUrl, "adjustedBudget", {
          carat: best.diamondSize,
          quality: best.selectedQuality.quality,
          type: best.selectedQuality.type,
          price: formatStoreCurrency(best.total, parentUrl),
          budget: formatStoreCurrency(intent.budget, parentUrl),
        }, responseLanguage),
        intent.notes,
        responseLanguage
      ),
    };
  }

  const cheapest = candidates.sort((a, b) => a.total - b.total)[0] ?? requested;
  return {
    config: cheapest,
    intent,
    responseLanguage,
    status: "over-budget",
    message: mergeNotesIntoMessage(
      parentUrl,
      translateAssistantText(parentUrl, "overBudget", {
        price: formatStoreCurrency(cheapest.total, parentUrl),
        budget: formatStoreCurrency(intent.budget, parentUrl),
      }, responseLanguage),
      intent.notes,
      responseLanguage
    ),
  };
};
