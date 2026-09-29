import { DEFAULT_BEAD_SIZE_ID } from "./assets";

export const DEFAULT_BEAD_UNIT_PRICE = 8;
export const DEFAULT_SPACER_UNIT_PRICE = 4;

/** Thread/string is included; bracelet total is beads, spacers, and charms only. */
export function getJewelryPriceForLength(_lengthId, _displayInches) {
  return 0;
}
export function getBeadItemPrice(bead, sizeId = DEFAULT_BEAD_SIZE_ID) {
  return bead?.price ?? DEFAULT_BEAD_UNIT_PRICE;
}

export function getSpacerItemPrice(spacer) {
  return spacer?.price ?? DEFAULT_SPACER_UNIT_PRICE;
}

export function getCharmItemPrice(charm) {
  return charm?.price ?? 50;
}

export function getPatternCustomizePrice(pattern = []) {
  return pattern.reduce((total, item) => {
    if (item.type === "bead") {
      return total + getBeadItemPrice(item.asset, item.sizeId);
    }
    if (item.type === "spacer") {
      return total + getSpacerItemPrice(item.asset);
    }
    if (item.type === "charm") {
      return total + getCharmItemPrice(item.asset);
    }
    return total;
  }, 0);
}

function groupPatternItems(items, getLabel, getPrice) {
  const groups = new Map();

  items.forEach((item) => {
    const label = getLabel(item);
    const price = getPrice(item);
    const existing = groups.get(label);

    if (existing) {
      existing.count += 1;
      existing.totalPrice += price;
      return;
    }

    groups.set(label, {
      name: label,
      count: 1,
      totalPrice: price,
    });
  });

  return Array.from(groups.values());
}

function formatGroupedDetail(groups) {
  return groups
    .map((group) => (group.count > 1 ? `${group.name}*${group.count}` : group.name))
    .join(", ");
}

/**
 * Build customize summary rows for only the bead/spacer/charm types present in the pattern.
 */
export function buildPatternCustomizeSummaryLines(pattern = []) {
  const lines = [];
  const beads = pattern.filter((item) => item.type === "bead");
  const spacers = pattern.filter((item) => item.type === "spacer");
  const charms = pattern.filter((item) => item.type === "charm");

  if (beads.length) {
    const groups = groupPatternItems(
      beads,
      (item) => item.asset?.name || "Bead",
      (item) => getBeadItemPrice(item.asset, item.sizeId)
    );

    lines.push({
      key: "beads",
      title: `Beads (Qty ${beads.length})`,
      detail: formatGroupedDetail(groups),
      price: groups.reduce((total, group) => total + group.totalPrice, 0),
    });
  }

  if (charms.length) {
    const groups = groupPatternItems(
      charms,
      (item) => item.asset?.name || "Charm",
      (item) => getCharmItemPrice(item.asset)
    );

    lines.push({
      key: "charms",
      title: `Charms (Qty ${charms.length})`,
      detail: formatGroupedDetail(groups),
      price: groups.reduce((total, group) => total + group.totalPrice, 0),
    });
  }

  if (spacers.length) {
    const groups = groupPatternItems(
      spacers,
      (item) => item.asset?.name || "Spacer",
      (item) => getSpacerItemPrice(item.asset)
    );

    lines.push({
      key: "spacers",
      title: `Spacers (Qty ${spacers.length})`,
      detail: formatGroupedDetail(groups),
      price: groups.reduce((total, group) => total + group.totalPrice, 0),
    });
  }

  return lines;
}
