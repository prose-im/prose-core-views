/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import { reactive } from "petite-vue";
import ToolboxHelper from "../helpers/toolbox.js";

// CONSTANTS

const DETECTED_USER_LANGUAGE = ToolboxHelper.detectLanguagePreference();
const DEFAULT_USER_PLATFORM = "unknown";

// STORES

function OptionStore() {
  return {
    // --> DATA <--

    i18n: reactive({
      code: DETECTED_USER_LANGUAGE,
      _: ToolboxHelper.acquireLanguageData(DETECTED_USER_LANGUAGE)
    }),

    style: reactive({
      platform: DEFAULT_USER_PLATFORM,
      renderer: ToolboxHelper.detectWebRenderer(),
      theme: ToolboxHelper.detectAppearancePreference(),

      modifiers: {
        scroll: true
      }
    }),

    account: reactive({
      userId: null
    }),

    // --> METHODS <--

    /**
     * Gets language
     * @public
     * @return {string} Language code
     */
    getLanguage() {
      return this.i18n.code;
    },

    /**
     * Gets style platform
     * @public
     * @return {string} Style platform name
     */
    getStylePlatform() {
      return this.style.platform;
    },

    /**
     * Gets style renderer
     * @public
     * @return {string} Style renderer name
     */
    getStyleRenderer() {
      return this.style.renderer;
    },

    /**
     * Gets style theme
     * @public
     * @return {string} Style theme value
     */
    getStyleTheme() {
      return this.style.theme;
    },

    /**
     * Gets style modifier
     * @public
     * @return {string} Style modifier value (if any)
     */
    getStyleModifier(name) {
      return this.style.modifiers[name];
    },

    /**
     * Gets account user identifier
     * @public
     * @return {string} Style theme value
     */
    getAccountUserId() {
      return this.account.userId;
    },

    /**
     * Sets language
     * @public
     * @param  {string} code
     * @return {undefined}
     */
    setLanguage(code) {
      // Language is not supported?
      if (!code || ToolboxHelper.LANGUAGE_VALUES.has(code) === false) {
        throw new Error(
          `Language invalid, allowed values: ` +
            `${Array.from(ToolboxHelper.LANGUAGE_VALUES.values()).join(", ")}`
        );
      }

      this.i18n.code = code;
      this.i18n._ = ToolboxHelper.acquireLanguageData(code);
    },

    /**
     * Sets style platform
     * @public
     * @param  {string} platform
     * @return {undefined}
     */
    setStylePlatform(platform) {
      // Platform is not supported?
      if (!platform || ToolboxHelper.PLATFORM_VALUES.has(platform) === false) {
        throw new Error(
          `Style platform invalid, allowed values: ` +
            `${Array.from(ToolboxHelper.PLATFORM_VALUES.values()).join(", ")}`
        );
      }

      this.style.platform = platform;
    },

    /**
     * Sets style renderer
     * @public
     * @param  {string} renderer
     * @return {undefined}
     */
    setStyleRenderer(renderer) {
      // Renderer is not set?
      if (!renderer) {
        throw new Error("Style renderer not set");
      }

      this.style.renderer = renderer;
    },

    /**
     * Sets style theme
     * @public
     * @param  {string} theme
     * @return {undefined}
     */
    setStyleTheme(theme) {
      // Style theme not allowed?
      if (!theme || ToolboxHelper.APPEARANCE_VALUES.has(theme) === false) {
        throw new Error(
          `Style theme invalid, allowed values: ` +
            `${Array.from(ToolboxHelper.APPEARANCE_VALUES.values()).join(", ")}`
        );
      }

      this.style.theme = theme;
    },

    /**
     * Sets style modifier
     * @public
     * @param  {string} name
     * @param  {string} value
     * @return {undefined}
     */
    setStyleModifier(name, value) {
      // Style modifier does not exist?
      if (!(name in this.style.modifiers)) {
        throw new Error(
          `Style modifier does not exist, possible values: ` +
            `${Object.keys(this.style.modifiers).join(", ")}`
        );
      }

      this.style.modifiers[name] = value;
    },

    /**
     * Sets account user identifier
     * @public
     * @param  {string} userId
     * @return {undefined}
     */
    setAccountUserId(userId) {
      // Account user identifier is invalid?
      // Notice: only allowed format is a bare JID, eg. john.doe@acme.inc; any \
      //   other format such as john.doe@acme.inc/resource is invalid.
      if (
        !userId ||
        userId.includes("@") === false ||
        userId.includes("/") === true
      ) {
        throw new Error(
          "Account user identifier invalid, please provide a valid " +
            "Jabber IDentifier in bare format"
        );
      }

      this.account.userId = userId;
    }
  };
}

// EXPORTS

export default OptionStore();
