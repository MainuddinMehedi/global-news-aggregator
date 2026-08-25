export const COUNTRY_TO_REGION: Record<string, string> = {
  Bangladesh: "Asia-Pacific",
  India: "Asia-Pacific",
  China: "Asia-Pacific",
  Japan: "Asia-Pacific",
  "South Korea": "Asia-Pacific",
  Singapore: "Asia-Pacific",
  Australia: "Asia-Pacific",
  USA: "North America",
  Canada: "North America",
  UK: "Europe",
  France: "Europe",
  Germany: "Europe",
  Russia: "Europe",
  Qatar: "Middle East",
  "Saudi Arabia": "Middle East",
  Israel: "Middle East",
  Egypt: "Middle East",
  Argentina: "South America",
  Brazil: "South America",
  "South Africa": "Africa",
  Nigeria: "Africa",
  Global: "Global",
};

export const REGION_TO_COUNTRIES = Object.entries(COUNTRY_TO_REGION).reduce(
  (acc, [country, region]) => {
    const lowerRegion = region.toLowerCase();
    if (!acc[lowerRegion]) acc[lowerRegion] = [];
    acc[lowerRegion].push(country);
    return acc;
  },
  {} as Record<string, string[]>,
);

export function getPublisherRegion(country: string | null | undefined): string {
  if (!country || country.trim() === "" || country === "Global") {
    return "Global";
  }

  return COUNTRY_TO_REGION[country] || "Global";
}
