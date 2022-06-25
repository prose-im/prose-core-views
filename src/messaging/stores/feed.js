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

// CONSTANTS

const ENTRY_NEST_TIMEFRAME = 600000; // 10 minutes

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

        // Assign initial insert and updated time
        storeMessage.insertedAt = Date.now();
        storeMessage.updatedAt = 0;

        // Acquire previous message (relative to current message)
        let previousMessage = this.feed.entries[this.feed.entries.length - 1];

        // Should a separator message be inserted?
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

          // Update previous message reference (as we just pushed a new \
          //   message, that should be considered the new previous message)
          previousMessage = separatorMessage;
        }

        // Should a line be inserted to an existing message entry?
        // Notice: only if the previous message is from the same user as the \
        //   current one, and has been sent within a similar timeframe (that \
        //   is, recently).
        if (
          previousMessage &&
          previousMessage.type === MessageHelper.ENTRY_TYPE_MESSAGE &&
          previousMessage.user.jid === storeMessage.user.jid &&
          DateHelper.areWithinElapsedTime(
            previousMessage.date,
            storeMessage.date,
            ENTRY_NEST_TIMEFRAME
          )
        ) {
          // Insert each line from the current message into the previous message
          storeMessage.content.forEach(contentLine => {
            previousMessage.content.push(contentLine);
          });

          // Update store message reference (as we re-used a previously-pushed \
          //   message and appended a new line in this existing message)
          storeMessage = previousMessage;

          // Bump updated date (used to signal view to re-render)
          storeMessage.updatedAt = Date.now();
        } else {
          // Insert message in store
          this.__registers.feedEntriesById[storeMessage.id] = storeMessage;
          this.feed.entries.push(storeMessage);
        }

        // Store line reference to its parent
        this.__registers.entryIdForLineId[message.id] = storeMessage.id;
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

        // Bump updated date (used to signal view to re-render)
        parentEntry.updatedAt = Date.now();

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
      let wasRemoved = false;

      // Acquire parent entry for message
      let parentEntry = this.resolve(messageId);

      if (parentEntry !== null) {
        // Remove line from register
        delete this.__registers.entryIdForLineId[messageId];

        // Remove from lines
        let lineIndex = parentEntry.content.findIndex(line => {
          return line.id === messageId;
        });

        if (lineIndex !== -1) {
          // Remove line from message
          parentEntry.content.splice(lineIndex, 1);

          // Mark as removed
          wasRemoved = true;
        }

        // Remove whole entry? (as it is now empty)
        if (parentEntry.content.length === 0) {
          // Remove entry from register
          delete this.__registers.feedEntriesById[parentEntry.id];

          // Remove from entries
          let entryIndex = this.feed.entries.findIndex(entry => {
            return entry.id === parentEntry.id;
          });

          if (entryIndex !== -1) {
            // Acquire boundary messages
            let previousMessage = this.feed.entries[entryIndex - 1],
              nextMessage = this.feed.entries[entryIndex + 1];

            // Remove message from store
            this.feed.entries.splice(entryIndex, 1);

            // Remove date separator for the group if the retracted message \
            //   was preceded by a date separator, and followed by a date \
            //   separator (or nothing)
            if (
              previousMessage &&
              previousMessage.type === MessageHelper.ENTRY_TYPE_SEPARATOR &&
              (!nextMessage ||
                nextMessage.type === MessageHelper.ENTRY_TYPE_SEPARATOR)
            ) {
              delete this.__registers.feedEntriesById[previousMessage.id];
              this.feed.entries.splice(entryIndex - 1, 1);
            }
          }
        } else {
          // Bump updated date (used to signal view to re-render)
          parentEntry.updatedAt = Date.now();
        }
      }

      return wasRemoved;
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
