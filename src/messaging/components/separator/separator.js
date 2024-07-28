/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import { nextTick } from "petite-vue";
import DateHelper from "../../helpers/date.js";

// COMPONENTS

function Separator(separator) {
  return {
    // --> METHODS <--

    /**
     * Mounted hook
     * @public
     * @return {undefined}
     */
    mounted() {
      // Apply height to previous separator (after slight delay to ensure all \
      //   previous DOM nodes rendered properly if inserted in backwards \
      //   direction)
      setTimeout(() => {
        // Ensure DOM has been rendered w/ latest data
        nextTick(this.__applyPreviousSeparatorSizing);
      }, 0);
    },

    /**
     * Applies previous separator sizing
     * @private
     * @return {undefined}
     */
    __applyPreviousSeparatorSizing() {
      // Acquire parent entry (this reference comes from this component \
      //   hierarchy, if included as part of an Entry component - which it MUST)
      const parentEntryElement = this.$refs.entry;

      if (parentEntryElement) {
        // Compute total aggregated height, until we find another separator \
        //   element.
        // Hack: this applies the total height to the previous separator so \
        //   that the sticky position scroll effect works.
        let previousEntriesTotalHeight = 0,
          previousEntryCurrentElement = parentEntryElement;

        while (
          (previousEntryCurrentElement =
            previousEntryCurrentElement.previousElementSibling)
        ) {
          // Add height of currently scanned previous entry element
          previousEntriesTotalHeight +=
            previousEntryCurrentElement.offsetHeight;

          // Attempt to find a sticky separator in currently-scanned element
          const previousSeparatorSticky =
            previousEntryCurrentElement.getElementsByClassName(
              "js-separator-sticky"
            );

          // Sticky separator found? Apply total height value and stop there
          if (previousSeparatorSticky.length > 0) {
            previousSeparatorSticky[0].style.height =
              previousEntriesTotalHeight + "px";

            break;
          }
        }
      }
    },

    // --> DATA <--

    label: DateHelper.formatDateOrDayString(separator.date)
  };
}

// EXPORTS

export default Separator;
