/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import { reactive } from "petite-vue";

// CONSTANTS

const STYLE_THEME_VALUES = ["light", "dark"];

// STORES

function OptionStore() {
  return {
    // --> DATA <--

    style: reactive({
      theme: "light"
    }),

    // --> METHODS <--

    /**
     * Gets style theme
     * @public
     * @return {string} Style theme value
     */
    getStyleTheme() {
      return this.style.theme;
    },

    /**
     * Sets style theme
     * @public
     * @param  {string} theme
     * @return {undefined}
     */
    setStyleTheme(theme) {
      // Style theme not allowed?
      if (!theme || STYLE_THEME_VALUES.includes(theme) === false) {
        throw new Error(
          `Style theme invalid, allowed values: ` +
            `${STYLE_THEME_VALUES.join(", ")}`
        );
      }

      this.style.theme = theme;
    }
  };
}

// EXPORTS

export default OptionStore;
