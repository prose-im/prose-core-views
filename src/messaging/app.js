/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import { createApp, reactive } from "petite-vue";
import FeedStore from "./stores/feed.js";
import Avatar from "./components/avatar/avatar.js";
import Separator from "./components/separator/separator.js";
import Message from "./components/message/message.js";
import Entry from "./components/entry/entry.js";

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

// EXPORTS

globalThis.MessagingStore = $store;
