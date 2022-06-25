/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import { createApp, reactive } from "petite-vue";
import SandboxHelper from "./helpers/sandbox.js";
import FeedStore from "./stores/feed.js";
import Avatar from "./components/avatar/avatar.js";
import Separator from "./components/separator/separator.js";
import Message from "./components/message/message.js";
import Entry from "./components/entry/entry.js";

// CONSTANTS

const IS_SANDBOX = process.env.NODE_ENV !== "production" ? true : false;

// INSTANCES

const $store = FeedStore();

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
  Message,
  Entry,
  $store
}).mount("#app");

if (IS_SANDBOX === true) {
  SandboxHelper.loadAndApplyFixtures($store);
}

// EXPORTS

globalThis.MessagingStore = $store;
