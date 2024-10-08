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

const HIGHLIGHT_TYPES = ["text"];
const INTERACT_ACTIONS = ["reactions", "actions"];

// STORES

function FeedStore() {
  return {
    // --> DATA <--

    feed: reactive({
      loaders: {
        backwards: false,
        forwards: false
      },

      identities: {},
      groups: []
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
      let messageEntry = this._resolveEntry(messageId),
        messageLine = this.__resolveLine(messageId);

      // Rebuild the returned parent entry object? (to a new safe object)
      if (messageEntry !== null && messageLine !== null) {
        // Important: perform a best-effort rebuild to the original insertion \
        //   format. Optional insertion properties will not be rebuilt and \
        //   returned there.
        return {
          id: messageLine.id,
          type: messageLine.type,
          date: messageEntry.date.toISOString(),
          from: messageEntry.userId,
          content: messageLine.text
        };
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

        // Schedule scroll position restore
        MessageHelper.scheduleScrollPreserveAfterPrepend();

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
        // Check if should force scroll to last inserted message
        // Notice: this is used when restoring messages from a blank state, \
        //   which ensures any previous scroll position is ignored. This \
        //   addresses issues with the scroll position from a previous store \
        //   state, which just got flushed, to interfere and prevent scroll, \
        //   in the situation where a 'flush()' was not yet followed by a DOM \
        //   commit, and this 'insert()' followed immediately.
        let shouldForceScroll = this.feed.groups.length === 0 ? true : false;

        // Inject messages to the store (append mode)
        for (let i = 0; i < messages.length; i++) {
          this.__injectMessage(INJECT_MODE_APPEND, messages[i]);
        }

        // Schedule to scroll to target message
        let lastMessage = messages[messages.length - 1] || null;

        if (lastMessage !== null) {
          // Schedule scroll to edited last message
          MessageHelper.scheduleScrollToMessage(
            lastMessage.id,
            false,
            shouldForceScroll
          );
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
      if (!messageDiff || !messageDiff.type || !messageDiff.content) {
        throw new Error("Message to update is incomplete (missing attribute)");
      }

      // Acquire parent entry
      let parentEntry = this._resolveEntry(messageId);

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
        if (!messageDiff.id) {
          messageDiff.id = messageId;
        }

        // Migrate message identifier in register? (if it was changed)
        let shouldMigrateId = messageDiff.id !== messageId ? true : false;

        if (shouldMigrateId === true) {
          delete this.__registers.entryIdForLineId[messageId];

          this.__registers.entryIdForLineId[messageDiff.id] = parentEntry.id;
        }

        // Transform message differential into model message differential
        let storeMessageDiff = MessageHelper.transformIntoModel(
          messageDiff.type,
          messageDiff
        );

        // Update message content in store? (if any set)
        if (storeMessageDiff.content) {
          storeMessageDiff.content.forEach(lineDiff => {
            parentEntry.content.forEach(line => {
              // Line to update found in entry model? Update it.
              // Notice: if identifier changed, then compare using provided \
              //   message identifier.
              if (
                line.id === lineDiff.id ||
                (shouldMigrateId === true && line.id === messageId)
              ) {
                Object.assign(line, lineDiff);
              }
            });
          });
        }

        // Update message user in store? (if any set)
        if (storeMessageDiff.userId) {
          parentEntry.userId = storeMessageDiff.userId;
        }

        // Bump updated date (used to signal view to re-render)
        parentEntry.updatedAt = Date.now();

        // Schedule scroll to last message? (if updated message is last one)
        let lastGroup = this.feed.groups[this.feed.groups.length - 1] || null,
          lastEntryLines = lastGroup?.[lastGroup.length - 1]?.content || null,
          lastEntryLine = lastEntryLines?.[lastEntryLines.length - 1] || null;

        if (lastEntryLine !== null && lastEntryLine.id === messageId) {
          MessageHelper.scheduleScrollToMessage(messageId);
        }

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
      let parentEntry = this._resolveEntry(messageId);

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

          // Acquire the parent group and index of the entry
          let parentGroup = null,
            parentGroupIndex = -1,
            entryIndex = -1;

          // Notice: go from latest to oldest, since the retracted message, if \
          //   any, is most likely to be located in the last group.
          groups: for (let i = this.feed.groups.length - 1; i >= 0; i--) {
            let group = this.feed.groups[i];

            for (let j = 0; j < group.length; j++) {
              // Entry found in group?
              if (group[j].id === parentEntry.id) {
                // Assign found parent group and entry index
                parentGroup = group;
                parentGroupIndex = i;
                entryIndex = j;

                // Stop there (found the entry)
                break groups;
              }
            }
          }

          if (
            parentGroup !== null &&
            parentGroupIndex !== -1 &&
            entryIndex !== -1
          ) {
            // Acquire boundary messages
            let boundaryMessage = parentGroup[entryIndex - 1],
              nextMessage = parentGroup[entryIndex + 1];

            // Remove message from store
            parentGroup.splice(entryIndex, 1);

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

              parentGroup.splice(entryIndex - 1, 1);
            }

            // Remove whole parent group? (now empty)
            if (parentGroup.length === 0) {
              this.feed.groups.splice(parentGroupIndex, 1);
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
      // Clear identities
      this.feed.identities = {};

      // Reset all loaders
      for (let direction in this.feed.loaders) {
        this.feed.loaders[direction] = false;
      }

      // Flush all entries in all groups? (if any)
      if (this.feed.groups.length > 0) {
        // Clear all public stores
        this.feed.groups = [];

        // Clear all private registers
        this.__registers.feedEntriesById = {};
        this.__registers.entryIdForLineId = {};

        // Unschedule any planned scroll
        MessageHelper.unscheduleScroll();

        return true;
      }

      return false;
    },

    /**
     * Highlights target message (used for editing)
     * @public
     * @param  {string}  [messageId]
     * @return {boolean} Message highlight status
     */
    highlight(messageId = null) {
      // Un-highlight any previously highlighted message
      // Notice: go from latest to oldest, since the highlighted message, if \
      //   any, is most likely to be located in the last group.
      groups: for (let i = this.feed.groups.length - 1; i >= 0; i--) {
        let group = this.feed.groups[i];

        for (let j = 0; j < group.length; j++) {
          let entry = group[j];

          if (entry.type === MessageHelper.ENTRY_TYPE_MESSAGE) {
            for (let k = 0; k < entry.content.length; k++) {
              let entryLine = entry.content[k];

              if (
                entryLine.properties &&
                entryLine.properties.highlighted === true
              ) {
                delete entryLine.properties.highlighted;

                // Stop there (found the highlighted message)
                break groups;
              }
            }
          }
        }
      }

      // Highlight target message?
      if (messageId !== null) {
        let messageLine = this.__resolveLine(messageId);

        if (
          messageLine !== null &&
          HIGHLIGHT_TYPES.includes(messageLine.type) === true
        ) {
          messageLine.properties = messageLine.properties || {};
          messageLine.properties.highlighted = true;

          return true;
        }
      }

      return false;
    },

    /**
     * Interacts with a message action
     * @public
     * @param  {string}  messageId
     * @param  {string}  action
     * @param  {boolean} [isActive]
     * @return {boolean} Message interact status
     */
    interact(messageId, action, isActive = true) {
      // Provided action is not valid?
      if (!action || INTERACT_ACTIONS.includes(action) === false) {
        throw new Error(
          `Action invalid, allowed values: ${INTERACT_ACTIONS.join(", ")}`
        );
      }

      // Mark action as active or inactive for target message
      let messageEntry = this._resolveEntry(messageId),
        messageLine = this.__resolveLine(messageId, messageEntry);

      if (
        messageEntry !== null &&
        messageLine !== null &&
        messageEntry.type === MessageHelper.ENTRY_TYPE_MESSAGE
      ) {
        // Set or unset lock?
        if (isActive === true) {
          messageLine.locks = messageLine.locks || {};

          messageLine.locks[action] = true;
        } else if (messageLine.locks !== undefined) {
          delete messageLine.locks[action];

          // Clear out locks storage? (nothing left)
          if (Object.keys(messageLine.locks).length === 0) {
            delete messageLine.locks;
          }
        }

        return true;
      }

      return false;
    },

    /**
     * Scrolls to a message
     * @public
     * @param  {string}  messageId
     * @param  {boolean} [isForced]
     * @return {boolean} Message scroll status
     */
    scroll(messageId, isForced = true) {
      // Scroll to existing message? (immediate and maybe forced)
      if (this._resolveEntry(messageId) !== null) {
        MessageHelper.scheduleScrollToMessage(messageId, true, isForced);

        return true;
      }

      return false;
    },

    /**
     * Toggles the visibility of a loader
     * @public
     * @param  {string}  type
     * @param  {boolean} [isVisible]
     * @return {boolean} New visibility state
     */
    loader(type, isVisible = null) {
      // Provided loader type is not valid?
      if (this.feed.loaders[type] === undefined) {
        throw new Error(
          `Loader type invalid, allowed values: ${Object.keys(
            this.feed.loaders
          ).join(", ")}`
        );
      }

      // Compute new visibility?
      if (isVisible === null) {
        isVisible = this.feed.loaders[type] === true ? false : true;
      }

      // Update loader visibility
      this.feed.loaders[type] = isVisible;

      return isVisible;
    },

    /**
     * Identifies target user identifier with profile data
     * @public
     * @param  {string}  userId
     * @param  {object}  [identity]
     * @return {boolean} User identify change status
     */
    identify(userId, identity = null) {
      let storeIdentity = this.feed.identities[userId],
        doExist = storeIdentity !== undefined,
        hasChanged = false;

      // Clear any existing identity?
      if (identity === null) {
        if (doExist === true) {
          delete this.feed.identities[userId];

          hasChanged = true;
        }
      } else {
        // Set or update identity
        // Important: if setting, retain user identifier in the identity \
        //   object as well, as a convenience way for store consumers to use \
        //   an identity by reference w/ all the keys that they require \
        //   pre-populated, without re-building the identity object and \
        //   copying nested values.
        if (doExist === true) {
          // Mark as has changed?
          if (
            (identity.name && storeIdentity.name !== identity.name) ||
            (identity.avatar && storeIdentity.avatar !== identity.avatar)
          ) {
            hasChanged = true;
          }

          Object.assign(storeIdentity, identity);
        } else {
          this.feed.identities[userId] = {
            ...identity,
            userId
          };

          hasChanged = true;
        }
      }

      // Force a refresh of messages in the view? (as to update shown identity)
      if (hasChanged === true) {
        let nowDate = Date.now();

        this.feed.groups.forEach(group => {
          group.forEach(entry => {
            if (entry.userId === userId) {
              entry.updatedAt = nowDate;
            }
          });
        });
      }

      return hasChanged;
    },

    /**
     * Acquires full parent entry from the store
     * @protected
     * @param  {string} [messageId]
     * @param  {string} [parentEntryId]
     * @return {object} Resolved entry (if any)
     */
    _resolveEntry(messageId = null, parentEntryId = null) {
      parentEntryId =
        parentEntryId || this.__registers.entryIdForLineId[messageId] || null;

      if (parentEntryId !== null) {
        return this.__registers.feedEntriesById[parentEntryId] || null;
      }

      return null;
    },

    /**
     * Acquires entry line from the store
     * @private
     * @param  {string} messageId
     * @param  {object} [parentEntry]
     * @return {object} Resolved line (if any)
     */
    __resolveLine(messageId, parentEntry = null) {
      parentEntry = parentEntry || this._resolveEntry(messageId);

      if (parentEntry !== null) {
        let messageLine = parentEntry.content.find(line => {
          return line.id === messageId;
        });

        if (messageLine) {
          return messageLine;
        }
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
        !message.from
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

      // Acquire boundary group (relative to current message)
      let boundaryGroupIndex =
        mode === INJECT_MODE_PREPEND ? 0 : this.feed.groups.length - 1;
      let boundaryGroup = this.feed.groups[boundaryGroupIndex] || [];

      // Acquire boundary message (relative to current message, in group)
      let boundaryMessageIndex =
        mode === INJECT_MODE_PREPEND ? 0 : boundaryGroup.length - 1;
      let boundaryMessage = boundaryGroup[boundaryMessageIndex] || null;

      // Check if boundary is from the same day + if should reuse any \
      //   already-inserted separator (if any)
      let boundaryIsSameDay =
        boundaryMessage !== null
          ? DateHelper.areSameDay(boundaryMessage.date, storeMessage.date)
          : false;
      let boundarySeparatorShouldReuse =
        boundaryIsSameDay === true &&
        boundaryMessage?.type === MessageHelper.ENTRY_TYPE_SEPARATOR;

      // #1. Should a separator message be inserted?
      if (
        boundaryIsSameDay === false &&
        boundarySeparatorShouldReuse === false
      ) {
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

      // #2. Should a line be inserted to an existing nested message entry?
      // Notice: only if the boundary message is from the same user as the \
      //   current one, has been sent within a similar timeframe (that \
      //   is, recently), and does not contain files (we want to space out \
      //   files, and also prevent any refresh of file DOMs such as media \
      //   players - should subsequent messages be appended to the same entry \
      //   with files).
      let nestedMessage =
        boundarySeparatorShouldReuse === true
          ? boundaryGroup[boundaryMessageIndex + 1]
          : boundaryMessage;

      if (
        nestedMessage &&
        nestedMessage.type === MessageHelper.ENTRY_TYPE_MESSAGE &&
        nestedMessage.userId === storeMessage.userId &&
        (storeMessage.content[0]?.files?.length || 0) === 0 &&
        DateHelper.areWithinElapsedTime(
          nestedMessage.date,
          storeMessage.date,
          ENTRY_NEST_TIMEFRAME,
          mode === INJECT_MODE_PREPEND ? -1 : 1
        )
      ) {
        // Insert each line from the current message into the boundary message?
        if (storeMessage.content.length > 0) {
          if (mode === INJECT_MODE_PREPEND) {
            for (let i = storeMessage.content.length - 1; i >= 0; i--) {
              nestedMessage.content.unshift(storeMessage.content[i]);
            }
          } else {
            for (let i = 0; i < storeMessage.content.length; i++) {
              nestedMessage.content.push(storeMessage.content[i]);
            }
          }
        }

        // Update store message reference (as we re-used a previously-pushed \
        //   message and appended a new line in this existing message)
        storeMessage = nestedMessage;

        // Bump updated date (used to signal view to re-render)
        storeMessage.updatedAt = Date.now();
      } else {
        // Insert message in store
        this.__registers.feedEntriesById[storeMessage.id] = storeMessage;

        injectStack.push(storeMessage);
      }

      // Store line reference to its parent
      this.__registers.entryIdForLineId[message.id] = storeMessage.id;

      // Merge all stack contents with the feed of entries? (if anything)
      if (injectStack.length) {
        this.__commitEntriesIntoGroup(mode, injectStack, {
          reuseSeparator: boundarySeparatorShouldReuse,
          groupIndex: boundaryGroupIndex,
          entryIndex: boundaryMessageIndex
        });
      }
    },

    /**
     * Commits provided stack of entries to the store
     * @private
     * @param  {number}  mode
     * @param  {object}  [stack]
     * @param  {object}  [boundaries]
     * @param  {boolean} [boundaries.reuseSeparator]
     * @param  {number}  [boundaries.groupIndex]
     * @param  {number}  [boundaries.entryIndex]
     * @return {undefined}
     */
    __commitEntriesIntoGroup(
      mode,
      stack = [],
      boundaries = { reuseSeparator: false, groupIndex: -1, entryIndex: -1 }
    ) {
      if (stack.length > 0) {
        // Acquire group in which to inject stack
        let group = this.feed.groups[boundaries.groupIndex] || null;

        if (boundaries.reuseSeparator === true) {
          // Should reuse separator; assert that inject group at boundary is set
          if (group === null) {
            throw new Error(
              "Cannot commit entries re-using separator into missing group"
            );
          }
        } else {
          // Inject new group? (prepend or append)
          if (
            group === null ||
            stack[0].type === MessageHelper.ENTRY_TYPE_SEPARATOR
          ) {
            group = [];

            if (mode === INJECT_MODE_PREPEND) {
              this.feed.groups.unshift(group);
            } else {
              this.feed.groups.push(group);
            }
          }
        }

        // Inject stack to group (prepend or append)
        if (mode === INJECT_MODE_PREPEND) {
          // Acquire prepend start index
          // Notice: this lets us re-use an existing separator for \
          //   subsequently prepended messages. As we prepend in reverse \
          //   order, the mechanics are not quite the same as append mode, \
          //   where time is guaranteed to progress monotonically.
          let prependStartIndex =
            boundaries.reuseSeparator === true ? boundaries.entryIndex + 1 : 0;

          for (let i = 0; i < stack.length; i++) {
            // Prepend entry from the stack
            group.splice(prependStartIndex + i, 0, stack[i]);
          }
        } else {
          for (let i = 0; i < stack.length; i++) {
            // Append entry from the stack (in the current group)
            group.push(stack[i]);
          }
        }
      }
    }
  };
}

// EXPORTS

export default FeedStore();
