/**
 * Footer "+ tax" next to the total. Off until quote/tax API is wired.
 * When integrating: set SHOW_SUMMARY_TAX_LABEL to true and assign summaryTaxLabel from the API.
 */
export const SHOW_SUMMARY_TAX_LABEL = false;

/** Fallback copy when enabled and API has not set summaryTaxLabel yet. */
export const DEFAULT_SUMMARY_TAX_LABEL = "+ tax";

/** Set from API (e.g. "+ tax", "+ 8% tax"). Ignored while SHOW_SUMMARY_TAX_LABEL is false. */
export let summaryTaxLabel = null;

export function setSummaryTaxLabelFromApi(label) {
  summaryTaxLabel = label;
}

export function getFooterSummaryTaxLabel() {
  if (!SHOW_SUMMARY_TAX_LABEL) {
    return null;
  }
  const label = summaryTaxLabel ?? DEFAULT_SUMMARY_TAX_LABEL;
  return label.trim() ? label : null;
}
