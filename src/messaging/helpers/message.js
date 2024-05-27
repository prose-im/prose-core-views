/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import { reactive, nextTick } from "petite-vue";

// CONSTANTS

const SCROLL_BYPASS_SAFETY_RATIO = 0.4; // 40% of height
const SCROLL_BYPASS_SAFETY_OFFSET_MINIMUM = 80; // 80 pixels

const SCROLL_INTO_VIEW_OPTIONS = {
  block: "start",
  inline: "start"
};

// HELPERS

const MessageHelper = {
  // VALUES

  ENTRY_TYPE_SEPARATOR: "separator",
  ENTRY_TYPE_MESSAGE: "message",

  // DATA

  __timers: {
    scrollDebounce: null
  },

  // METHODS

  /**
   * Transforms input message into store model
   * @public
   * @param  {string} type
   * @param  {object} message
   * @return {object} Transformed message model
   */
  transformIntoModel: function (type, message) {
    let messageModel = {
      type: this.ENTRY_TYPE_MESSAGE
    };

    // Apply user? (if any)
    if (message.from) {
      messageModel.jid = message.from;
    }

    // Parse message date? (if any)
    if (message.date) {
      let parsedDate = new Date(message.date);

      // Validate parsed date
      if (isNaN(parsedDate) === true) {
        throw new Error("Message model date is invalid (cannot parse)");
      }

      messageModel.date = parsedDate;
    }

    // Apply message content based on type? (if any)
    if (message.content && message.id) {
      let generatedLine = {
        id: message.id
      };

      // Apply reactions? (if any)
      if (message.reactions) {
        if (message.reactions.length > 0) {
          generatedLine.reactions = message.reactions;
        } else {
          // Important: do not delete key, rather void its value to NULL, as \
          //   to indicate reactions previously existed but are no more, which \
          //   will let this being merged with any existing line object in the \
          //   store.
          generatedLine.reactions = null;
        }
      }

      // Apply properties? (if any)
      if (message.metas) {
        generatedLine.properties = message.metas;
      }

      // Apply files? (if any)
      if (message.files) {
        // Ensure that all files are valid
        message.files.forEach(file => {
          if (!file.type || !file.name || !file.url) {
            throw new Error(
              "Message file is incomplete (single file should have 'type', " +
                "'name' and 'url')"
            );
          }
        });

        generatedLine.files = message.files;
      }

      // Apply type + text
      switch (type) {
        case "text": {
          if (typeof message.content !== "string") {
            throw new Error(
              "Message content is invalid for type ('text' should be 'string')"
            );
          }

          generatedLine.type = "text";
          generatedLine.text = message.content;

          break;
        }

        default: {
          throw new Error(
            "Message model type is not recognized (cannot assign content)"
          );
        }
      }

      messageModel.content = [generatedLine];
    }

    return this.__finalize(messageModel);
  },

  /**
   * Makes a separator model (from source message)
   * @public
   * @param  {object} sourceMessage
   * @return {object} Separator model
   */
  makeSeparatorModel: function (sourceMessage) {
    return this.__finalize({
      type: this.ENTRY_TYPE_SEPARATOR,
      date: new Date(sourceMessage.date)
    });
  },

  /**
   * Schedules to scroll to target message
   * @public
   * @param  {string}  messageId
   * @param  {boolean} [immediate]
   * @param  {boolean} [force]
   * @return {undefined}
   */
  scheduleScrollToMessage: function (
    messageId,
    immediate = false,
    force = false
  ) {
    // Acquire current scroll position
    let initialScrollTop =
      force === true ? -1 : document.documentElement.scrollTop || 0;

    // Clear any existing scheduled timer
    this.unscheduleScroll();

    // Schedule debounce timer
    this.__scheduleScroll(() => {
      // Scroll to target message now
      this.__fireScrollToMessage(messageId, initialScrollTop);
    }, immediate);
  },

  /**
   * Schedules to scroll to preserved position (after a prepend)
   * @public
   * @param  {boolean} [immediate]
   * @return {undefined}
   */
  scheduleScrollPreserveAfterPrepend: function (immediate = false) {
    // Important: do not re-schedule if there is already a scroll task \
    //   scheduled, since we are preserving the very initial scroll position \
    //   there, so we want to compute the new scroll position with the initial \
    //   values and not any transient value.
    if (this.__timers.scrollDebounce === null) {
      // Acquire current scroll position
      let initialScrollTop = document.documentElement.scrollTop || 0,
        initialScrollHeight = document.documentElement.scrollHeight || 0;

      // Schedule debounce timer
      this.__scheduleScroll(() => {
        // Scroll to preserved position now
        this.__fireScrollPreserveAfterPrepend(
          initialScrollHeight,
          initialScrollTop
        );
      }, immediate);
    }
  },

  /**
   * Unschedules a scroll order to message (if any)
   * @public
   * @return {undefined}
   */
  unscheduleScroll: function () {
    if (this.__timers.scrollDebounce !== null) {
      clearTimeout(this.__timers.scrollDebounce);

      this.__timers.scrollDebounce = null;
    }
  },

  /**
   * Generates event origin object
   * @public
   * @param  {string}  type
   * @param  {object}  event
   * @param  {boolean} [withBoundingParent]
   * @return {undefined}
   */
  generateEventOrigin: function (type, event, withBoundingParent = true) {
    // Generate anchor properties
    let anchor = {
      x: event.clientX || 0,
      y: event.clientY || 0
    };

    // Acquire origin parent properties (if any)
    let parent;

    if (withBoundingParent === true && event.target) {
      let parentBoundingBox = event.target.getBoundingClientRect();

      // Important: round up maybe-floats to guaranteed integer as the IPC \
      //   receiver usually expects stable types.
      parent = {
        x: Math.round(parentBoundingBox.left || 0),
        y: Math.round(parentBoundingBox.top || 0),
        width: Math.round(event.target.offsetWidth || 0),
        height: Math.round(event.target.offsetHeight || 0)
      };
    } else {
      parent = null;
    }

    return {
      type,
      anchor,
      parent
    };
  },

  /**
   * Lists message identifiers from target element
   * @public
   * @param  {object} element
   * @return {object} Listed message identifiers
   */
  listIdentifiersFromElement: function (element) {
    // #1. Attempt to acquire message identifier from line
    let lineElement = element.closest("[data-line-id]") || null;

    if (lineElement !== null) {
      let lineIdentifier = lineElement.getAttribute("data-line-id") || null;

      if (lineIdentifier !== null) {
        return [lineIdentifier];
      }
    }

    // #2. Fallback to no identifiers (default)
    return [];
  },

  /**
   * Schedules debounced scroll trigger
   * @private
   * @param  {function} fnTrigger
   * @param  {boolean}  [immediate]
   * @return {undefined}
   */
  __scheduleScroll: function (fnTrigger, immediate = false) {
    // Assert that no other scroll debounce is scheduled
    if (this.__timers.scrollDebounce !== null) {
      throw new Error(
        "Cannot schedule scroll (another one is already scheduled)"
      );
    }

    // Schedule scroll debounce (or fire immediately)
    if (immediate === true) {
      fnTrigger();
    } else {
      this.__timers.scrollDebounce = setTimeout(() => {
        this.__timers.scrollDebounce = null;

        // Ensure DOM has been rendered w/ latest data
        nextTick(fnTrigger);
      }, 0);
    }
  },

  /**
   * Fires scroll to target message
   * @private
   * @param  {string} messageId
   * @param  {number} [scrollTopPosition]
   * @return {undefined}
   */
  __fireScrollToMessage: function (messageId, scrollTopPosition = -1) {
    // Acquire message and its entry parent
    let messageElement =
      document.getElementById(`message-${messageId}`) || null;
    let entryElement =
      messageElement !== null
        ? messageElement.closest(".message") || null
        : null;

    if (messageElement !== null && entryElement !== null) {
      // Check if may scroll to message
      let mayScroll = true,
        entryHeight = entryElement.offsetHeight || 0,
        documentVisibleHeight = document.documentElement.clientHeight || 0,
        documentTotalHeight = document.documentElement.offsetHeight || 0;

      // Important: if scroll position is zero or negative, ALWAYS process \
      //   scroll. The same applies if element heights could not be acquired.
      if (scrollTopPosition > 0 && entryHeight > 0 && documentTotalHeight > 0) {
        let effectiveSafetyOffset = Math.max(
          SCROLL_BYPASS_SAFETY_OFFSET_MINIMUM,
          Math.floor(SCROLL_BYPASS_SAFETY_RATIO * documentVisibleHeight)
        );

        let effectiveScrollThreshold =
          documentTotalHeight -
          documentVisibleHeight -
          entryHeight -
          effectiveSafetyOffset;

        // User scrolled upwards too much, eg. to read a previous message in \
        //   history? We may not auto-scroll down then.
        if (
          effectiveScrollThreshold > 0 &&
          scrollTopPosition < effectiveScrollThreshold
        ) {
          mayScroll = false;
        }
      }

      // Scroll to message?
      if (mayScroll === true) {
        messageElement.scrollIntoView(SCROLL_INTO_VIEW_OPTIONS);
      }
    }
  },

  /**
   * Fires scroll to preserved position (after a prepend)
   * @private
   * @param  {number} scrollHeight
   * @param  {number} [scrollTopPosition]
   * @return {undefined}
   */
  __fireScrollPreserveAfterPrepend: function (
    scrollHeight,
    scrollTopPosition = 0
  ) {
    let newScrollHeight = document.documentElement.scrollHeight || 0;

    // Compute new scroll top position, which will effectively \
    //   preserve the visible scroll position following prepended \
    //   messages in the view.
    // Important: only proceed if available total scroll height \
    //   increased, which MUST be the case if we prepended items.
    if (newScrollHeight > scrollHeight) {
      let newScrollTop = scrollTopPosition + (newScrollHeight - scrollHeight);

      // Restore scroll position (to preserved position)
      document.documentElement.scrollTop = newScrollTop;
    }
  },

  /**
   * Finalizes a model object
   * @private
   * @param  {object} model
   * @return {object} Finalized model
   */
  __finalize: function (model) {
    // Important: make the model reactive, so that all views consuming the \
    //   model can track changes across all references to the model within the \
    //   store.
    return reactive(model);
  }
};

// EXPORTS

export default MessageHelper;
