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
  /**
   * Checks if target message exists in the store
   * @public
   * @param  {string}  messageId
   * @return {boolean} Message exist status
   */
  exists(messageId) {
    let messageIndex = feed.messages.findIndex(entry => {
      return entry.id === messageId;
    });

    return messageIndex !== -1 ? true : false;
  },

  /**
   * Pushes each provided message to the store
   * @public
   * @param  {...object} messages
   * @return {boolean}   Messages push status
   */
  insert(...messages) {
    messages.forEach(message => {
      feed.messages.push(message);
    });

    return messages.length > 0 ? true : false;
  },

  /**
   * Updates target message in the store
   * @public
   * @param  {string}  messageId
   * @param  {object}  messageDiff
   * @return {boolean} Message update status
   */
  update(messageId, messageDiff) {
    let message = feed.messages.find(entry => {
      return entry.id === messageId;
    });

    if (message) {
      Object.assign(message, messageDiff);

      return true;
    }

    return false;
  },

  /**
   * Removes target message from the store
   * @public
   * @param  {string}  messageId
   * @return {boolean} Message retract status
   */
  retract(messageId) {
    let messageIndex = feed.messages.findIndex(entry => {
      return entry.id === messageId;
    });

    if (messageIndex !== -1) {
      feed.messages.splice(messageIndex, 1);

      return true;
    }

    return false;
  },

  /**
   * Flushes the store
   * @public
   * @return {boolean} Message flush status
   */
  flush() {
    if (feed.messages.length > 0) {
      feed.messages = [];

      return true;
    }

    return false;
  }
};
