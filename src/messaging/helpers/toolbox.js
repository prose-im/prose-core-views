/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// HELPERS

const ToolboxHelper = {
  // METHODS

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

        // Abort detection there.
        return;
      }
    } catch (_) {
      // Ignore errors.
    } finally {
      return mode || "light";
    }
  }
};

// EXPORTS

export default ToolboxHelper;
