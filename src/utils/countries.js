/**
 * Countries configuration
 * Maps countries to their actual currency and locale for international HOA management
 */

export const COUNTRIES = {
  // Africa
  DZ: { code: "DZ", name: "Algeria", currency: "DZD", locale: "ar-DZ" },
  EG: { code: "EG", name: "Egypt", currency: "EGP", locale: "ar-EG" },
  MA: { code: "MA", name: "Morocco", currency: "MAD", locale: "fr-MA" },
  NG: { code: "NG", name: "Nigeria", currency: "NGN", locale: "en-NG" },
  ZA: { code: "ZA", name: "South Africa", currency: "ZAR", locale: "en-ZA" },
  TN: { code: "TN", name: "Tunisia", currency: "TND", locale: "ar-TN" },
  KE: { code: "KE", name: "Kenya", currency: "KES", locale: "en-KE" },
  GH: { code: "GH", name: "Ghana", currency: "GHS", locale: "en-GH" },
  ET: { code: "ET", name: "Ethiopia", currency: "ETB", locale: "en-ET" },

  // Asia
  CN: { code: "CN", name: "China", currency: "CNY", locale: "zh-CN" },
  IN: { code: "IN", name: "India", currency: "INR", locale: "en-IN" },
  ID: { code: "ID", name: "Indonesia", currency: "IDR", locale: "id-ID" },
  JP: { code: "JP", name: "Japan", currency: "JPY", locale: "ja-JP" },
  KR: { code: "KR", name: "South Korea", currency: "KRW", locale: "ko-KR" },
  MY: { code: "MY", name: "Malaysia", currency: "MYR", locale: "en-MY" },
  PH: { code: "PH", name: "Philippines", currency: "PHP", locale: "en-PH" },
  SG: { code: "SG", name: "Singapore", currency: "SGD", locale: "en-SG" },
  TH: { code: "TH", name: "Thailand", currency: "THB", locale: "th-TH" },
  VN: { code: "VN", name: "Vietnam", currency: "VND", locale: "vi-VN" },
  PK: { code: "PK", name: "Pakistan", currency: "PKR", locale: "en-PK" },
  BD: { code: "BD", name: "Bangladesh", currency: "BDT", locale: "en-BD" },

  // Middle East
  AE: { code: "AE", name: "United Arab Emirates", currency: "AED", locale: "ar-AE" },
  SA: { code: "SA", name: "Saudi Arabia", currency: "SAR", locale: "ar-SA" },
  IL: { code: "IL", name: "Israel", currency: "ILS", locale: "he-IL" },
  TR: { code: "TR", name: "Turkey", currency: "TRY", locale: "tr-TR" },
  IQ: { code: "IQ", name: "Iraq", currency: "IQD", locale: "ar-IQ" },
  JO: { code: "JO", name: "Jordan", currency: "JOD", locale: "ar-JO" },
  LB: { code: "LB", name: "Lebanon", currency: "LBP", locale: "ar-LB" },
  KW: { code: "KW", name: "Kuwait", currency: "KWD", locale: "ar-KW" },
  QA: { code: "QA", name: "Qatar", currency: "QAR", locale: "ar-QA" },
  BH: { code: "BH", name: "Bahrain", currency: "BHD", locale: "ar-BH" },
  OM: { code: "OM", name: "Oman", currency: "OMR", locale: "ar-OM" },

  // Europe
  AT: { code: "AT", name: "Austria", currency: "EUR", locale: "de-AT" },
  BE: { code: "BE", name: "Belgium", currency: "EUR", locale: "fr-BE" },
  BG: { code: "BG", name: "Bulgaria", currency: "BGN", locale: "bg-BG" },
  HR: { code: "HR", name: "Croatia", currency: "EUR", locale: "hr-HR" },
  CY: { code: "CY", name: "Cyprus", currency: "EUR", locale: "el-CY" },
  CZ: { code: "CZ", name: "Czech Republic", currency: "CZK", locale: "cs-CZ" },
  DK: { code: "DK", name: "Denmark", currency: "DKK", locale: "da-DK" },
  EE: { code: "EE", name: "Estonia", currency: "EUR", locale: "et-EE" },
  FI: { code: "FI", name: "Finland", currency: "EUR", locale: "fi-FI" },
  FR: { code: "FR", name: "France", currency: "EUR", locale: "fr-FR" },
  DE: { code: "DE", name: "Germany", currency: "EUR", locale: "de-DE" },
  GR: { code: "GR", name: "Greece", currency: "EUR", locale: "el-GR" },
  HU: { code: "HU", name: "Hungary", currency: "HUF", locale: "hu-HU" },
  IE: { code: "IE", name: "Ireland", currency: "EUR", locale: "en-IE" },
  IT: { code: "IT", name: "Italy", currency: "EUR", locale: "it-IT" },
  LV: { code: "LV", name: "Latvia", currency: "EUR", locale: "lv-LV" },
  LT: { code: "LT", name: "Lithuania", currency: "EUR", locale: "lt-LT" },
  LU: { code: "LU", name: "Luxembourg", currency: "EUR", locale: "fr-LU" },
  MT: { code: "MT", name: "Malta", currency: "EUR", locale: "mt-MT" },
  NL: { code: "NL", name: "Netherlands", currency: "EUR", locale: "nl-NL" },
  PL: { code: "PL", name: "Poland", currency: "PLN", locale: "pl-PL" },
  PT: { code: "PT", name: "Portugal", currency: "EUR", locale: "pt-PT" },
  RO: { code: "RO", name: "Romania", currency: "RON", locale: "ro-RO" },
  SK: { code: "SK", name: "Slovakia", currency: "EUR", locale: "sk-SK" },
  SI: { code: "SI", name: "Slovenia", currency: "EUR", locale: "sl-SI" },
  ES: { code: "ES", name: "Spain", currency: "EUR", locale: "es-ES" },
  SE: { code: "SE", name: "Sweden", currency: "SEK", locale: "sv-SE" },
  CH: { code: "CH", name: "Switzerland", currency: "CHF", locale: "de-CH" },
  GB: { code: "GB", name: "United Kingdom", currency: "GBP", locale: "en-GB" },
  NO: { code: "NO", name: "Norway", currency: "NOK", locale: "no-NO" },
  IS: { code: "IS", name: "Iceland", currency: "ISK", locale: "is-IS" },
  RU: { code: "RU", name: "Russia", currency: "RUB", locale: "ru-RU" },
  UA: { code: "UA", name: "Ukraine", currency: "UAH", locale: "uk-UA" },

  // North America
  US: { code: "US", name: "United States", currency: "USD", locale: "en-US" },
  CA: { code: "CA", name: "Canada", currency: "CAD", locale: "en-CA" },
  MX: { code: "MX", name: "Mexico", currency: "MXN", locale: "es-MX" },

  // Central America & Caribbean
  GT: { code: "GT", name: "Guatemala", currency: "GTQ", locale: "es-GT" },
  HN: { code: "HN", name: "Honduras", currency: "HNL", locale: "es-HN" },
  SV: { code: "SV", name: "El Salvador", currency: "USD", locale: "es-SV" },
  NI: { code: "NI", name: "Nicaragua", currency: "NIO", locale: "es-NI" },
  CR: { code: "CR", name: "Costa Rica", currency: "CRC", locale: "es-CR" },
  PA: { code: "PA", name: "Panama", currency: "PAB", locale: "es-PA" },
  CU: { code: "CU", name: "Cuba", currency: "CUP", locale: "es-CU" },
  DO: { code: "DO", name: "Dominican Republic", currency: "DOP", locale: "es-DO" },
  JM: { code: "JM", name: "Jamaica", currency: "JMD", locale: "en-JM" },
  TT: { code: "TT", name: "Trinidad and Tobago", currency: "TTD", locale: "en-TT" },

  // South America
  AR: { code: "AR", name: "Argentina", currency: "ARS", locale: "es-AR" },
  BO: { code: "BO", name: "Bolivia", currency: "BOB", locale: "es-BO" },
  BR: { code: "BR", name: "Brazil", currency: "BRL", locale: "pt-BR" },
  CL: { code: "CL", name: "Chile", currency: "CLP", locale: "es-CL" },
  CO: { code: "CO", name: "Colombia", currency: "COP", locale: "es-CO" },
  EC: { code: "EC", name: "Ecuador", currency: "USD", locale: "es-EC" },
  GY: { code: "GY", name: "Guyana", currency: "GYD", locale: "en-GY" },
  PY: { code: "PY", name: "Paraguay", currency: "PYG", locale: "es-PY" },
  PE: { code: "PE", name: "Peru", currency: "PEN", locale: "es-PE" },
  SR: { code: "SR", name: "Suriname", currency: "SRD", locale: "nl-SR" },
  UY: { code: "UY", name: "Uruguay", currency: "UYU", locale: "es-UY" },
  VE: { code: "VE", name: "Venezuela", currency: "VES", locale: "es-VE" },

  // Oceania
  AU: { code: "AU", name: "Australia", currency: "AUD", locale: "en-AU" },
  NZ: { code: "NZ", name: "New Zealand", currency: "NZD", locale: "en-NZ" },
  FJ: { code: "FJ", name: "Fiji", currency: "FJD", locale: "en-FJ" },
  PG: { code: "PG", name: "Papua New Guinea", currency: "PGK", locale: "en-PG" },
};

/**
 * Get all countries
 * @returns {Object} All countries configuration
 */
export function getAllCountries() {
  return COUNTRIES;
}

/**
 * Get country configuration by country code
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {Object} Country configuration with currency and locale
 */
export function getCountryByCode(countryCode = "MA") {
  return COUNTRIES[countryCode] || COUNTRIES["MA"];
}

/**
 * Get currency code for a specific country
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {string} Currency code (MAD, USD, EUR, GBP, CAD, AED)
 */
export function getCurrencyForCountry(countryCode = "MA") {
  const country = getCountryByCode(countryCode);
  return country.currency;
}

/**
 * Get locale for a specific country
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {string} Locale code (e.g., 'en-US', 'fr-FR')
 */
export function getLocaleForCountry(countryCode = "MA") {
  const country = getCountryByCode(countryCode);
  return country.locale;
}

/**
 * Get sorted list of countries by name
 * @returns {Array} Array of countries sorted alphabetically by name
 */
export function getCountriesSorted() {
  return Object.values(COUNTRIES).sort((a, b) => a.name.localeCompare(b.name));
}
