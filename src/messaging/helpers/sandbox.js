/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// CONSTANTS

const FIXTURE_APPLY_NEXT_DELAY = 250; // 1/4 second

// HELPERS

const SandboxHelper = {
  // METHODS

  /**
   * Loads and apply fixtures
   * @public
   * @param  {object} store
   * @return {undefined}
   */
  loadAndApplyFixtures: function (store, context) {
    // Important: do not bubble up any failure up the stack, as this can fail \
    //   while testing the store methods behavior in certain cases.
    try {
      const fixtures = require("../../../res/fixtures/messaging.json");

      // Configure account data
      context.setAccountJID(fixtures.account.jid);

      // Identify users
      for (let jid in fixtures.identities) {
        store.identify(jid, fixtures.identities[jid]);
      }

      // Insert all messages
      fixtures.messages.forEach((fixtureEntry, index) => {
        // Insert each message sequentially, with a delay
        setTimeout(() => {
          store.insert(fixtureEntry);
        }, (index + 1) * FIXTURE_APPLY_NEXT_DELAY);
      });
    } catch (error) {
      console.error("[sandbox] failed to apply sandbox fixture", error);
    }
  },

  /**
   * Registers event hooks
   * @public
   * @param  {object} event
   * @return {undefined}
   */
  registerEventHooks: function (event) {
    event.NAMESPACE_VALUES.forEach(namespace => {
      event.on(namespace, data => {
        // Log received event
        console.debug(`[sandbox] event received: ${namespace}`, data);
      });
    });
  },

  /**
   * Configures context
   * @public
   * @param  {object} context
   * @return {undefined}
   */
  configureContext: function (context) {
    context.setLanguage("en");
    context.setStyleTheme("light");
  }
};

// EXPORTS

export default SandboxHelper;
