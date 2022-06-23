/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import { reactive } from "petite-vue";

// COMPONENTS

function FeedStore() {
  return {
    // --> DATA <--

    feed: reactive({
      entries: []
    }),

    // --> METHODS <--

    /**
     * Checks if target message exists in the store
     * @public
     * @param  {string}  messageId
     * @return {boolean} Message exist status
     */
    exists(messageId) {
      let messageIndex = this.feed.entries.findIndex(entry => {
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
        // Ensure that inserted message data is valid
        if (!message.id || !message.type || !message.date) {
          throw new Error(
            "Message to insert is incomplete (missing attribute)"
          );
        }

        // Parse message date
        message.date = new Date(message.date);

        // Validate parsed date
        if (isNaN(message.date) === true) {
          throw new Error("Message date is invalid (cannot parse)");
        }

        // Insert message in store
        this.feed.entries.push(message);
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
      let message = this.feed.entries.find(entry => {
        return entry.id === messageId;
      });

      if (message) {
        // Update message in store
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
      let messageIndex = this.feed.entries.findIndex(entry => {
        return entry.id === messageId;
      });

      if (messageIndex !== -1) {
        // Remove message from store
        this.feed.entries.splice(messageIndex, 1);

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
      if (this.feed.entries.length > 0) {
        // Clear messages store
        this.feed.entries = [];

        return true;
      }

      return false;
    }
  };
}

// EXPORTS

export default FeedStore;
