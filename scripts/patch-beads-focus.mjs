import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const libDir = path.join(root, "src", "lib");
const folder = fs.readdirSync(libDir).find((name) => name.startsWith("be") && name.endsWith("configurator"));
const p = path.join(libDir, folder, "components", "BeedsControls.jsx");

let t = fs.readFileSync(p, "utf8");

if (!t.includes("const { requestPreviewFocus }")) {
  t = t.replace(
    "  } = useBeedsContext();\n\n  const sectionRefs = {",
    "  } = useBeedsContext();\n  const { requestPreviewFocus } = usePreviewFocus();\n\n  const sectionRefs = {"
  );
}

const old = `  const handleSlotSelect = (index) => {
    setActiveSlotIndex(index);
  };`;

const neu = `  const requestFocusForCustomizeSlot = useCallback(
    (index) => {
      if (index == null || index < 0 || index >= customizeSlotItems.length) {
        return;
      }
      const slot = customizeSlotItems[index];
      if (!slot?.id) {
        return;
      }
      requestPreviewFocus({ itemId: slot.id, patternIndex: index });
    },
    [customizeSlotItems, requestPreviewFocus]
  );

  const requestFocusForPickerContext = useCallback(() => {
    if (activeSlotIndex != null) {
      requestFocusForCustomizeSlot(activeSlotIndex);
      return;
    }
    const focusType =
      customizeTab === "spacers" ? "spacer" : customizeTab === "charms" ? "charm" : "bead";
    const patternIndex = pattern.findIndex((entry) => entry.type === focusType);
    if (patternIndex < 0) {
      return;
    }
    const entry = pattern[patternIndex];
    if (!entry?.id) {
      return;
    }
    requestPreviewFocus({ itemId: entry.id, patternIndex });
  }, [
    activeSlotIndex,
    customizeTab,
    pattern,
    requestFocusForCustomizeSlot,
    requestPreviewFocus,
  ]);

  const handleSlotSelect = (index) => {
    setActiveSlotIndex(index);
    requestFocusForCustomizeSlot(index);
  };`;

if (t.includes(old)) {
  t = t.replace(old, neu);
}

if (!t.includes("requestFocusForPickerContext();")) {
  t = t.replace(
    "const sourceRect = getFlyInSourceRect(event);\n\n    if (customizeTab === \"spacers\") {",
    "const sourceRect = getFlyInSourceRect(event);\n    requestFocusForPickerContext();\n\n    if (customizeTab === \"spacers\") {"
  );
}

fs.writeFileSync(p, t);
console.log("patched", p, t.includes("requestFocusForCustomizeSlot"));
