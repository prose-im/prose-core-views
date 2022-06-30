/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// HELPERS

const SandboxHelper = {
  // CONSTANTS

  FIXTURE_APPLY_NEXT_DELAY: 250, // 1/4 second

  // METHODS

  /**
   * Loads and apply fixtures
   * @public
   * @param  {object} store
   * @return {undefined}
   */
  loadAndApplyFixtures: function (store) {
    // Important: do not bubble up any failure up the stack, as this can fail \
    //   while testing the store methods behavior in certain cases.
    try {
      const fixtures = require("../../../res/fixtures/messaging.json");

      fixtures.messages.forEach((fixtureEntry, index) => {
        // Insert each message sequentially, with a delay
        setTimeout(() => {
          store.insert(fixtureEntry);
        }, (index + 1) * this.FIXTURE_APPLY_NEXT_DELAY);
      });
    } catch (error) {
      console.error("Failed to apply sandbox fixture", error);
    }
  }
};

// EXPORTS

export default SandboxHelper;
