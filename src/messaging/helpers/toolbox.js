/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

const LanguageData = {
  en: require("../locales/en.json"),
  de: require("../locales/de.json"),
  fr: require("../locales/fr.json")
};

// HELPERS

const ToolboxHelper = {
  // VALUES

  LANGUAGE_DEFAULT: "en",
  LANGUAGE_VALUES: new Set(Object.keys(LanguageData)),

  PLATFORM_VALUES: new Set(["web", "macos"]),
  APPEARANCE_VALUES: new Set(["light", "dark"]),

  // METHODS

  /**
   * Acquires language data (from locale code)
   * @public
   * @return {object} Acquired language data
   */
  acquireLanguageData: function (locale) {
    // Attempt to acquire from static language data imports
    const data = LanguageData[locale];

    if (data !== undefined) {
      return data;
    }

    // Default: no language data found for locale code
    throw new Error(`No language data for locale: ${locale}`);
  },

  /**
   * Detects user language preference (supported locale in the browser)
   * @public
   * @return {string} Detected language preference
   */
  detectLanguagePreference: function () {
    // Find preferred locale from navigator languages
    // Notice: filter out invalid locales + normalize locale codes
    let preferredLocale = (
      navigator.languages && navigator.languages.length > 0
        ? navigator.languages
        : [navigator.language || navigator.userLanguage]
    )
      .filter(preferredLocale => {
        return preferredLocale ? true : false;
      })
      .map(preferredLocale => {
        preferredLocale =
          preferredLocale.includes("-") === true
            ? preferredLocale.split("-")[0]
            : preferredLocale;

        return preferredLocale.toLowerCase();
      })
      .find(preferredLocale => {
        return this.LANGUAGE_VALUES.has(preferredLocale);
      });

    // Return preferred locale, or fallback
    return preferredLocale || this.LANGUAGE_DEFAULT;
  },

  /**
   * Detects appearance preference (as configured in the browser)
   * @public
   * @return {string} Detected appearance preference
   */
  detectAppearancePreference: function () {
    let mode;

    try {
      // Attempt to detect mode from media query? (operating system)
      if (
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches === true
      ) {
        mode = "dark";
      }
    } catch (_) {
      // Ignore errors.
    }

    return mode || "light";
  }
};

// EXPORTS

export default ToolboxHelper;
