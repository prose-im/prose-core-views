/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import { createApp, reactive } from "petite-vue";
import $context from "./stores/option.js";
import $store from "./stores/feed.js";
import Avatar from "./components/avatar/avatar.js";
import Separator from "./components/separator/separator.js";
import Entry from "./components/entry/entry.js";
import {
  Message,
  MessageLineText,
  MessageLineFile
} from "./components/message/message.js";

// COMPONENTS

function App() {
  return {
    // --> DATA <--

    isReady: false,

    // --> METHODS <--

    /**
     * Mounted hook
     * @public
     * @return {undefined}
     */
    mounted() {
      this.isReady = true;
    }
  };
}

// INITIALIZERS

createApp({
  App,
  Avatar,
  Separator,
  Entry,
  Message,
  MessageLineText,
  MessageLineFile,
  $store,
  $context
}).mount("#app");

if (process.env.NODE_ENV !== "production") {
  // Important: include sandbox helper for non-production builds only, as it \
  //   adds up significant overhead on the final bundle size, since it \
  //   includes sandbox fixtures, used for development and testing purposes \
  //   only.
  const SandboxHelper = require("./helpers/sandbox.js").default;

  SandboxHelper.loadAndApplyFixtures($store);
}

// EXPORTS

globalThis.MessagingContext = $context;
globalThis.MessagingStore = $store;
