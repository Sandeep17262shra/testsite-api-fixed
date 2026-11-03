import React from "react";

/** Label row inside option tiles (matches RingCustomizer). */
export function renderOptionBoxLabel(label) {
  if (typeof label === "string" || typeof label === "number") {
    return <span className="theme3-option-box-label">{label}</span>;
  }
  const className = label?.props?.className;
  if (typeof className === "string" && className.includes("theme3-option-box-label")) {
    return label;
  }
  return <span className="theme3-option-box-label">{label}</span>;
}
