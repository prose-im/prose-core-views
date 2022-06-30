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

const INJECT_MODE_APPEND = 0;
const INJECT_MODE_PREPEND = 1;

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
        let parentEntry =
          this.__registers.feedEntriesById[parentEntryId] || null;

        if (parentEntry !== null) {
          // Rebuild the returned parent entry object, to a new safe object
          let messageLine = parentEntry.content.find(line => {
            return line.id === messageId;
          });

          if (messageLine) {
            // Important: escape from the Proxy wrapper in the returned \
            //   partial message object.
            return { ...messageLine };
          }
        }
      }

      return null;
    },

    /**
     * Restores each provided message to the store
     * @public
     * @param  {...object} messages
     * @return {boolean}   Messages prepend status
     */
    restore(...messages) {
      if (messages.length > 0) {
        // Inject messages to the store (prepend mode)
        // Important: prepend in reverse order, given that the restore order \
        //   is provided in natural order.
        for (let i = messages.length - 1; i >= 0; i--) {
          this.__injectMessage(INJECT_MODE_PREPEND, messages[i]);
        }

        return true;
      }

      return false;
    },

    /**
     * Pushes each provided message to the store
     * @public
     * @param  {...object} messages
     * @return {boolean}   Messages append status
     */
    insert(...messages) {
      if (messages.length > 0) {
        // Inject messages to the store (append mode)
        for (let i = 0; i < messages.length; i++) {
          this.__injectMessage(INJECT_MODE_APPEND, messages[i]);
        }

        // Schedule to scroll to target message
        let lastMessage = messages[messages.length - 1] || null;

        if (lastMessage !== null) {
          MessageHelper.scheduleScrollTo(lastMessage.id, true);
        }

        return true;
      }

      return false;
    },

    /**
     * Updates target message in the store
     * @public
     * @param  {string}  messageId
     * @param  {object}  messageDiff
     * @return {boolean} Message update status
     */
    update(messageId, messageDiff) {
      // Guard: ensure that inserted message data is valid
      if (!messageDiff.type || !messageDiff.content) {
        throw new Error("Message to update is incomplete (missing attribute)");
      }

      // Acquire parent entry
      let parentEntry = this.__resolveEntry(messageId);

      if (parentEntry !== null) {
        // Only message types can be updated
        if (parentEntry.type !== MessageHelper.ENTRY_TYPE_MESSAGE) {
          throw new Error(
            `Only entries of '${MessageHelper.ENTRY_TYPE_MESSAGE}' type can ` +
              `be updated (got '${parentEntry.type}')`
          );
        }

        // Force message identifier on differential object
        // Notice: an identifier is required to generate the associated \
        //   content line within the updated entry.
        messageDiff.id = messageId;

        // Transform message differential into model message differential
        let storeMessageDiff = MessageHelper.transformIntoModel(
          messageDiff.type,
          messageDiff
        );

        // Update message content in store
        storeMessageDiff.content.forEach(lineDiff => {
          parentEntry.content.forEach(line => {
            // Line to update found in entry model? Update it.
            if (line.id === lineDiff.id) {
              Object.assign(line, lineDiff);
            }
          });
        });

        // Update message user in store? (if any set)
        if (storeMessageDiff.user) {
          Object.assign(parentEntry.user, storeMessageDiff.user);
        }

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
      let parentEntry = this.__resolveEntry(messageId);

      if (parentEntry !== null) {
        // #1. Remove line from message entry
        delete this.__registers.entryIdForLineId[messageId];

        let lineIndex = parentEntry.content.findIndex(line => {
          return line.id === messageId;
        });

        if (lineIndex !== -1) {
          // Remove line from message
          parentEntry.content.splice(lineIndex, 1);

          // Mark as removed
          wasRemoved = true;
        }

        // #2. Remove whole entry? (as it is now empty)
        if (parentEntry.content.length === 0) {
          delete this.__registers.feedEntriesById[parentEntry.id];

          let entryIndex = this.feed.entries.findIndex(entry => {
            return entry.id === parentEntry.id;
          });

          if (entryIndex !== -1) {
            // Acquire boundary messages
            let boundaryMessage = this.feed.entries[entryIndex - 1],
              nextMessage = this.feed.entries[entryIndex + 1];

            // Remove message from store
            this.feed.entries.splice(entryIndex, 1);

            // Remove date separator for the group if the retracted message \
            //   was preceded by a date separator, and followed by a date \
            //   separator (or nothing)
            if (
              boundaryMessage &&
              boundaryMessage.type === MessageHelper.ENTRY_TYPE_SEPARATOR &&
              (!nextMessage ||
                nextMessage.type === MessageHelper.ENTRY_TYPE_SEPARATOR)
            ) {
              delete this.__registers.feedEntriesById[boundaryMessage.id];

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
        // Clear all public stores
        this.feed.entries = [];

        // Clear all private registers
        this.__registers.feedEntriesById = {};
        this.__registers.entryIdForLineId = {};

        // Unschedule any planned scroll to target message
        MessageHelper.unscheduleScrollTo();

        return true;
      }

      return false;
    },

    /**
     * Acquires full parent entry from the store
     * @private
     * @param  {string} messageId
     * @return {object} Resolved entry (if any)
     */
    __resolveEntry(messageId) {
      let parentEntryId = this.__registers.entryIdForLineId[messageId] || null;

      if (parentEntryId !== null) {
        return this.__registers.feedEntriesById[parentEntryId] || null;
      }

      return null;
    },

    /**
     * Injects provided message to the store
     * @private
     * @param  {number} mode
     * @param  {object} message
     * @return {undefined}
     */
    __injectMessage(mode, message) {
      // Guard: ensure that inserted message data is valid
      if (
        !message.id ||
        !message.type ||
        !message.date ||
        !message.content ||
        !message.from ||
        !message.from.jid
      ) {
        throw new Error("Message to insert is incomplete (missing attribute)");
      }

      // Guard: check that message has not been already inserted?
      if (this.exists(message.id) === true) {
        throw new Error(
          "Message with this identifier has already been inserted"
        );
      }

      // Initialize the stack of entries to inject
      let injectStack = [];

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

      // Acquire boundary message (relative to current message)
      let boundaryIndex =
        mode === INJECT_MODE_PREPEND ? 0 : this.feed.entries.length - 1;
      let boundaryMessage = this.feed.entries[boundaryIndex];

      // #1. Should a separator message be inserted?
      // Notice: always pre-inject a separator if mode is prepend
      let boundaryIsSameDay = boundaryMessage
        ? DateHelper.areSameDay(boundaryMessage.date, storeMessage.date)
        : false;
      let boundarySeparatorShouldReplace =
        boundaryIsSameDay === true &&
        mode === INJECT_MODE_PREPEND &&
        boundaryMessage.type === MessageHelper.ENTRY_TYPE_SEPARATOR;

      if (
        boundaryIsSameDay === false ||
        boundarySeparatorShouldReplace === true
      ) {
        // Pull out separator message at the boundary? (as we wish to replace \
        //   it)
        if (boundaryMessage && boundarySeparatorShouldReplace === true) {
          delete this.__registers.feedEntriesById[boundaryMessage.id];

          this.feed.entries.splice(boundaryIndex, 1);
        }

        // Append a separator if boundary message is from a different day
        let separatorMessage = MessageHelper.makeSeparatorModel(storeMessage);

        // Assign a master entry identifier to the separator message
        separatorMessage.id = nanoid();

        this.__registers.feedEntriesById[separatorMessage.id] =
          separatorMessage;

        injectStack.push(separatorMessage);

        // Update boundary message reference (as we just pushed a new \
        //   message, that should be considered the new boundary message)
        boundaryMessage = separatorMessage;
      }

      // #2. Should a line be inserted to an existing message entry?
      // Notice: only if the boundary message is from the same user as the \
      //   current one, and has been sent within a similar timeframe (that \
      //   is, recently).
      if (
        boundaryMessage &&
        boundaryMessage.type === MessageHelper.ENTRY_TYPE_MESSAGE &&
        boundaryMessage.user.jid === storeMessage.user.jid &&
        DateHelper.areWithinElapsedTime(
          boundaryMessage.date,
          storeMessage.date,
          ENTRY_NEST_TIMEFRAME
        )
      ) {
        // Insert each line from the current message into the boundary message
        storeMessage.content.forEach(contentLine => {
          boundaryMessage.content.push(contentLine);
        });

        // Update store message reference (as we re-used a previously-pushed \
        //   message and appended a new line in this existing message)
        storeMessage = boundaryMessage;

        // Bump updated date (used to signal view to re-render)
        storeMessage.updatedAt = Date.now();
      } else {
        // Insert message in store
        this.__registers.feedEntriesById[storeMessage.id] = storeMessage;

        injectStack.push(storeMessage);
      }

      // Store line reference to its parent
      this.__registers.entryIdForLineId[message.id] = storeMessage.id;

      // Merge all stack contents with the feed of entries?
      if (injectStack.length > 0) {
        if (mode === INJECT_MODE_PREPEND) {
          for (let i = injectStack.length - 1; i >= 0; i--) {
            // Prepend entry from the stack
            this.feed.entries.unshift(injectStack[i]);
          }
        } else {
          for (let i = 0; i < injectStack.length; i++) {
            // Append entry from the stack
            this.feed.entries.push(injectStack[i]);
          }
        }
      }
    }
  };
}

// EXPORTS

export default FeedStore();
