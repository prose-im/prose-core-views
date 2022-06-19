/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// COMPONENTS

function Entry(entry) {
  return {
    // --> DATA <--

    type: entry.type,
    message: entry.type === "message" ? entry : null,
    separator: entry.type === "separator" ? entry : null
  };
}

// EXPORTS

export default Entry;
