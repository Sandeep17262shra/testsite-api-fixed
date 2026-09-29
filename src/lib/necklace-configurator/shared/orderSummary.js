// Groups placed charms into the "Add-ons" lines of the build summary:
//   Letters (Qty 3): A, B, C          $60
//   Birthstones (Qty 2): Ruby, Garnet $100
// Shared by the necklace and bracelet panels; each passes its own price and
// birthstone-name lookups so the lines always add up to that panel's total.

const ADD_ON_GROUPS = [
  { key: "letters", label: "Letters" },
  { key: "birthstones", label: "Birthstones" },
  { key: "diamonds", label: "Diamonds" },
  { key: "2d", label: "2D" },
  { key: "3d", label: "3D" },
];

const IMAGE_PATH_RE = /\.(png|jpe?g|webp|gif|svg)$/i;

function getAddOnGroupKey(charm) {
  if (charm.type === "initial") return "letters";
  if (charm.type === "birthstone") return "birthstones";
  if (charm.type === "diamond" || charm.type === "cushion") return "diamonds";
  if (charm.imageCharmNumber != null || IMAGE_PATH_RE.test(charm.path || "")) return "2d";
  return "3d";
}

// "Garnet (Jan)" -> "Garnet"
const stripMonth = (label) => String(label || "").replace(/\s*\([^)]*\)\s*$/, "");

export function buildCharmAddOnLines(charms, { getPrice, getBirthstoneLabel, getName }) {
  const buckets = new Map(ADD_ON_GROUPS.map((g) => [g.key, { names: [], price: 0 }]));
  charms.filter(Boolean).forEach((charm) => {
    const key = getAddOnGroupKey(charm);
    let name;
    if (key === "letters") name = charm.letter || "A";
    else if (key === "birthstones") name = stripMonth(getBirthstoneLabel(charm)) || "Birthstone";
    else name = getName(charm);
    const bucket = buckets.get(key);
    bucket.names.push(name);
    bucket.price += Number(getPrice(charm)) || 0;
  });
  return ADD_ON_GROUPS
    .map((g) => ({ ...g, ...buckets.get(g.key) }))
    .filter((g) => g.names.length > 0)
    .map((g) => ({
      key: g.key,
      label: `${g.label} (Qty ${g.names.length}): ${g.names.join(", ")}`,
      price: g.price,
    }));
}
