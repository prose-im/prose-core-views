/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import DateHelper from "../../helpers/date.js";

// COMPONENTS

function Separator(separator) {
  return {
    // --> DATA <--

    label: DateHelper.formatDateOrDayString(separator.date)
  };
}

// EXPORTS

export default Separator;
