/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import { createApp, reactive } from "petite-vue";
import Avatar from "./components/avatar/avatar.js";
import Separator from "./components/separator/separator.js";
import Message from "./components/message/message.js";
import Entry from "./components/entry/entry.js";

// FIXTURES

const fixtures =
  process.env.NODE_ENV === "development"
    ? require("../../res/fixtures/messaging.json")
    : null;

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

// DATA

const feed = reactive({
  messages: fixtures !== null ? fixtures.feed : []
});

// INITIALIZERS

createApp({
  App,
  Avatar,
  Separator,
  Message,
  Entry,
  feed
}).mount("#app");

// EXPORTS

globalThis.MessagingStore = {
  insert(...messages) {
    // Push each message to the store
    messages.forEach(message => {
      feed.messages.push(message);
    });

    return messages.length > 0 ? true : false;
  },

  update(messageId, messageDiff) {
    // Update target message in the store (if it exists)
    let message = feed.messages.find(entry => {
      return entry.id === messageId;
    });

    if (message) {
      Object.assign(message, messageDiff);

      return true;
    }

    return false;
  },

  retract(messageId) {
    // Remove target message from the store
    let messageIndex = feed.messages.findIndex(entry => {
      return entry.id === messageId;
    });

    if (messageIndex !== -1) {
      feed.messages.splice(messageIndex, 1);

      return true;
    }

    return false;
  },

  flush() {
    if (feed.messages.length > 0) {
      feed.messages = [];

      return true;
    }

    return false;
  }
};
