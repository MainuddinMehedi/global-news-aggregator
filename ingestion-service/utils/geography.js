/**
 * Static mapping of publisher countries to macro geopolitical regions (blocs).
 * Conceptually, a publisher's country uniquely dictates their origin region.
 */
export const COUNTRY_TO_REGION = {
  "Bangladesh": "Asia-Pacific",
  "India": "Asia-Pacific",
  "China": "Asia-Pacific",
  "Japan": "Asia-Pacific",
  "USA": "North America",
  "Canada": "North America",
  "UK": "Europe",
  "France": "Europe",
  "Germany": "Europe",
  "Russia": "Europe",
  "Qatar": "Middle East",
  "Saudi Arabia": "Middle East",
  "Israel": "Middle East",
  "Egypt": "Middle East",
  "Global": "Global",
};

/**
 * Returns the macro geopolitical region/bloc for a given publisher country.
 * Defaults to "Global" if the country is null, empty, or unmapped.
 * 
 * @param {string|null} country The publisher's home country
 * @returns {string} Geopolitical region (e.g., "Asia-Pacific", "Middle East", "Europe", "North America", "Global")
 */
export function getPublisherRegion(country) {
  if (!country || country.trim() === "" || country === "Global") {
    return "Global";
  }
  return COUNTRY_TO_REGION[country] || "Global";
}
