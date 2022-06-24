/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import { reactive } from "petite-vue";
import DateHelper from "../helpers/date.js";
import MessageHelper from "../helpers/message.js";

// STORES

function FeedStore() {
  return {
    // --> DATA <--

    feed: reactive({
      entries: []
    }),

    __registers: {
      feedEntriesById: {}
    },

    // --> METHODS <--

    /**
     * Checks if target message exists in the store
     * @public
     * @param  {string}  messageId
     * @return {boolean} Message exist status
     */
    exists(messageId) {
      return this.__registers.feedEntriesById[messageId] !== undefined
        ? true
        : false;
    },

    /**
     * Resolves message from the store
     * @public
     * @param  {string} messageId
     * @return {object} Resolved message (if any)
     */
    resolve(messageId) {
      return this.__registers.feedEntriesById[messageId] || null;
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
        if (
          !message.id ||
          !message.type ||
          !message.date ||
          !message.content ||
          !message.from
        ) {
          throw new Error(
            "Message to insert is incomplete (missing attribute)"
          );
        }

        // Check that message has not been already inserted?
        if (this.exists(message.id)) {
          throw new Error(
            "Message with this identifier has already been inserted"
          );
        }

        // Transform message into model message
        let storeMessage = MessageHelper.transformIntoModel(
          message.type,
          message
        );

        // Acquire previous message (relative to current message)
        let previousMessage = this.feed.entries[this.feed.entries.length - 1];

        if (
          !previousMessage ||
          !DateHelper.areSameDay(previousMessage.date, storeMessage.date)
        ) {
          // Append a separator if previous message is from a different day
          let separatorMessage = MessageHelper.makeSeparatorModel(storeMessage);

          this.__registers.feedEntriesById[separatorMessage.id] =
            separatorMessage;
          this.feed.entries.push(separatorMessage);
        }

        // TODO: add a line if previous message is from the same user
        //   important: do this after inserting the date separator!

        // Insert message in store
        this.__registers.feedEntriesById[storeMessage.id] = storeMessage;
        this.feed.entries.push(storeMessage);
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
      let message = this.resolve(messageId);

      if (message !== null) {
        // Transform message differential into model message differential
        let storeMessageDiff = MessageHelper.transformIntoModel(
          message.type,
          messageDiff
        );

        // Update message in store
        Object.assign(message, storeMessageDiff);

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
      if (this.exists(messageId)) {
        // Remove from register
        delete this.__registers.feedEntriesById[messageId];

        // Remove from entries
        let messageIndex = this.feed.entries.findIndex(entry => {
          return entry.id === messageId;
        });

        if (messageIndex !== -1) {
          // Acquire boundary messages
          let previousMessage = this.feed.entries[messageIndex - 1],
            nextMessage = this.feed.entries[messageIndex + 1];

          // Remove message from store
          this.feed.entries.splice(messageIndex, 1);

          // Remove date separator for the group if the retracted message was \
          //   preceded by a date separator, and followed by a date separator \
          //   (or nothing)
          if (
            previousMessage &&
            previousMessage.type === MessageHelper.ENTRY_TYPE_SEPARATOR &&
            (!nextMessage ||
              nextMessage.type === MessageHelper.ENTRY_TYPE_SEPARATOR)
          ) {
            delete this.__registers.feedEntriesById[previousMessage.id];
            this.feed.entries.splice(messageIndex - 1, 1);
          }

          return true;
        }
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
        this.__registers.feedEntriesById = {};

        return true;
      }

      return false;
    }
  };
}

// EXPORTS

export default FeedStore;