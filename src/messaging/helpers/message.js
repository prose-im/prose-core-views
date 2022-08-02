/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import { reactive, nextTick } from "petite-vue";
import $store from "../stores/feed.js";

// CONSTANTS

const SCROLL_BYPASS_SAFETY_RATIO = 0.4; // 40% of height
const SCROLL_BYPASS_SAFETY_OFFSET_MINIMUM = 80; // 80 pixels
const SCROLL_DEBOUNCE_DELAY = 50; // 50 milliseconds

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
      // Validate user data
      if (!message.from.jid) {
        throw new Error(
          "Message model JID is not set on user (required if 'from' is set)"
        );
      }

      messageModel.user = message.from;
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

        case "file": {
          if (!message.content.type && !message.content.url) {
            throw new Error(
              "Message content is incomplete for type ('file' should have " +
                "'type' and 'url')"
            );
          }

          generatedLine.type = "file";
          generatedLine.file = message.content;

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
   * @return {undefined}
   */
  scheduleScrollTo: function (messageId, immediate = false) {
    // Acquire current scroll position
    let initialScrollTop = document.documentElement.scrollTop || 0;

    // Clear any existing scheduled timer
    this.unscheduleScrollTo();

    // Schedule debounce timer
    this.__timers.scrollDebounce = setTimeout(
      () => {
        this.__timers.scrollDebounce = null;

        // Ensure DOM has been rendered w/ latest data
        nextTick(() => {
          // Scroll to target message now
          this.__fireScrollTo(messageId, initialScrollTop);
        });
      },
      immediate === true ? 0 : SCROLL_DEBOUNCE_DELAY
    );
  },

  /**
   * Unschedules a scroll order to message (if any)
   * @public
   * @return {undefined}
   */
  unscheduleScrollTo: function () {
    if (this.__timers.scrollDebounce !== null) {
      clearTimeout(this.__timers.scrollDebounce);

      this.__timers.scrollDebounce = null;
    }
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

    // #2. Attempt to acquire all message identifiers from parent entry
    let entryElement = element.closest("[data-entry-id]") || null;

    if (entryElement !== null) {
      let entryIdentifier = entryElement.getAttribute("data-entry-id") || null;

      if (entryIdentifier !== null) {
        let entry = $store._resolveEntry(null, entryIdentifier);

        if (entry !== null) {
          return (entry.content || []).map(line => {
            return line.id;
          });
        }
      }
    }

    // #3. Fallback to no identifiers (default)
    return [];
  },

  /**
   * Schedules to scroll to target message
   * @private
   * @param  {string} messageId
   * @param  {number} [scrollTopPosition]
   * @return {undefined}
   */
  __fireScrollTo: function (messageId, scrollTopPosition = -1) {
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
