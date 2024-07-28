/*
 * prose-core-views
 *
 * Copyright: 2024, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

// Notice: languages need to be imported manually there, since the dynamic \
//   'import()' method as provided by the '@speed-highlight/core' library do \
//   not work in 'file://' loading mode (eg. Tauri builds of the Prose app \
//   implementing the views). This catch-all import depends on the \
//   '@parcel/resolver-glob' resolver.
import * as highlightLanguages from "@speed-highlight/core/dist/languages/*.js";

// EXPORTS

export default highlightLanguages;
