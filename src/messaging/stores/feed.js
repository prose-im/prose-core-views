/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import { reactive } from "petite-vue";
import { nanoid } from "nanoid";
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
      feedEntriesById: {},
      entryIdForLineId: {}
    },

    // --> METHODS <--

    /**
     * Checks if target message exists in the store
     * @public
     * @param  {string}  messageId
     * @return {boolean} Message exist status
     */
    exists(messageId) {
      return this.__registers.entryIdForLineId[messageId] !== undefined
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
      let parentEntryId = this.__registers.entryIdForLineId[messageId] || null;

      if (parentEntryId !== null) {
        return this.__registers.feedEntriesById[parentEntryId] || null;
      }

      return null;
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

        // Assign a master entry identifier to the message group
        storeMessage.id = nanoid();

        // Acquire previous message (relative to current message)
        let previousMessage = this.feed.entries[this.feed.entries.length - 1];

        if (
          !previousMessage ||
          !DateHelper.areSameDay(previousMessage.date, storeMessage.date)
        ) {
          // Append a separator if previous message is from a different day
          let separatorMessage = MessageHelper.makeSeparatorModel(storeMessage);

          // Assign a master entry identifier to the separator message
          separatorMessage.id = nanoid();

          this.__registers.feedEntriesById[separatorMessage.id] =
            separatorMessage;
          this.feed.entries.push(separatorMessage);
        }

        // TODO: add a line if previous message is from the same user
        //   important: do this after inserting the date separator!

        // TODO: add a line only if last message from same user is recent, eg. \
        //   last than 10 minutes.

        // Insert message in store
        this.__registers.feedEntriesById[storeMessage.id] = storeMessage;
        this.__registers.entryIdForLineId[message.id] = storeMessage.id;
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
      let parentEntry = this.resolve(messageId);

      if (parentEntry !== null) {
        // Force message identifier on differential object
        messageDiff.id = messageId;

        // Transform message differential into model message differential
        let storeMessageDiff = MessageHelper.transformIntoModel(
          parentEntry.type,
          messageDiff
        );

        // TODO: only update target line here!

        // Update message in store
        Object.assign(parentEntry, storeMessageDiff);

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
      let parentEntry = this.resolve(messageId);

      if (parentEntry !== null) {
        // Remove from register
        delete this.__registers.entryIdForLineId[messageId];

        // Remove from entries
        let messageIndex = this.feed.entries.findIndex(entry => {
          return entry.id === parentEntry.id;
        });

        // TODO: retract line
        // TODO: only retract entry if there are no lines anymore!

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
            delete this.__registers.entryIdForLineId[previousMessage.id];
            this.feed.entries.splice(messageIndex - 1, 1);
          }

          // TODO: if line is removed and parent has no lines anymore, remove \
          //   parent.

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
        this.__registers.entryIdForLineId = {};

        return true;
      }

      return false;
    }
  };
}

// EXPORTS

export default FeedStore;
