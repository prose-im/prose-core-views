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

// STORES

function OptionStore() {
  return {
    // --> DATA <--

    i18n: reactive({
      code: DETECTED_USER_LANGUAGE,
      _: ToolboxHelper.acquireLanguageData(DETECTED_USER_LANGUAGE)
    }),

    style: reactive({
      theme: ToolboxHelper.detectAppearancePreference()
    }),

    account: reactive({
      jid: null
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
     * Gets style theme
     * @public
     * @return {string} Style theme value
     */
    getStyleTheme() {
      return this.style.theme;
    },

    /**
     * Gets account JID
     * @public
     * @return {string} Style theme value
     */
    getAccountJID() {
      return this.account.jid;
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
     * Sets account JID
     * @public
     * @param  {string} jid
     * @return {undefined}
     */
    setAccountJID(jid) {
      // Account JID is invalid?
      // Notice: only allowed format is a bare JID, eg. john.doe@acme.inc; any \
      //   other format such as john.doe@acme.inc/resource is invalid.
      if (!jid || jid.includes("@") === false || jid.includes("/") === true) {
        throw new Error(
          "Account JID invalid, please provide a valid Jabber IDentifier " +
            "in bare format"
        );
      }

      this.account.jid = jid;
    }
  };
}

// EXPORTS

export default OptionStore();
