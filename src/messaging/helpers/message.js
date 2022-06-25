/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import { reactive } from "petite-vue";
import DateHelper from "./date.js";

// HELPERS

const MessageHelper = {
  // CONSTANTS

  ENTRY_TYPE_SEPARATOR: "separator",
  ENTRY_TYPE_MESSAGE: "message",

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

    // Apply message content based on type
    if (message.content && message.id) {
      let generatedLine = {
        id: message.id
      };

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
      date: new Date(sourceMessage.date),
      label: DateHelper.formatDateString(sourceMessage.date)
    });
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
