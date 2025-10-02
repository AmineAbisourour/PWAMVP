/**
 * Currency formatting utility supporting all world currencies
 * Uses Intl.NumberFormat API for automatic currency support
 */

/**
 * Create a currency formatter for a specific currency
 * @param {string} currency - Currency code (MAD, USD, EUR, etc.)
 * @param {string} locale - Locale code (fr-MA, en-US, etc.)
 * @returns {Intl.NumberFormat} - Formatter instance
 */
function createCurrencyFormatter(currency = "MAD", locale = "fr-MA") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Create a number formatter (no currency symbol)
 * @param {string} locale - Locale code (fr-MA, en-US, etc.)
 * @returns {Intl.NumberFormat} - Formatter instance
 */
function createNumberFormatter(locale = "fr-MA") {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: 'MAD')
 * @param {string} locale - Locale code for number formatting (default: 'fr-MA')
 * @returns {string} - Formatted currency string (e.g., "250,00 DH" for MAD, "$250.00" for USD)
 */
export function formatCurrency(amount, currency = "MAD", locale = "fr-MA") {
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0;
  }

  // Special handling for MAD - display symbol after amount with locale-aware formatting
  if (currency === "MAD") {
    return createNumberFormatter(locale).format(amount) + " DH";
  }

  // Standard currency formatting for USD, EUR, etc. with locale
  return createCurrencyFormatter(currency, locale).format(amount);
}

/**
 * Format a number with thousand separators (no currency symbol)
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted number string (e.g., "250.00")
 */
export function formatNumber(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return createNumberFormatter().format(0);
  }
  return createNumberFormatter().format(amount);
}

/**
 * Get the currency symbol for a specific currency
 * @param {string} currency - Currency code (default: 'MAD')
 * @returns {string} - Currency symbol
 */
export function getCurrencySymbol(currency = "MAD") {
  // Special handling for MAD - display "DH"
  if (currency === "MAD") {
    return "DH";
  }

  // Use Intl.NumberFormat to extract currency symbol for any currency
  try {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(0);

    // Extract just the symbol by removing the number
    const symbol = formatted.replace(/[\d\s,.]/g, "").trim();
    return symbol || currency;
  } catch (error) {
    // If currency code is invalid, return the code itself
    return currency;
  }
}

/**
 * Parse a formatted currency string back to a number
 * @param {string} formattedAmount - The formatted string (e.g., "250.00 DH", "$250.00", "€250.00")
 * @returns {number} - The numeric value
 */
export function parseCurrency(formattedAmount) {
  if (typeof formattedAmount !== "string") {
    return parseFloat(formattedAmount) || 0;
  }

  // Remove all currency symbols, spaces, and non-numeric characters except decimal point
  const cleaned = formattedAmount
    .replace(/[A-Z$€£]/g, "") // Remove currency letters (MAD, DH, USD, EUR, etc.) and symbols
    .replace(/\s/g, "") // Remove spaces
    .replace(/,/g, ""); // Remove commas (thousands separator)

  return parseFloat(cleaned) || 0;
}

