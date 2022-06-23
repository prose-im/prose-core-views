/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

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

    // Apply identifier? (if any)
    if (message.id) {
      messageModel.id = message.id;
    }

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
    if (message.content) {
      let generatedLines = [];

      switch (type) {
        case "text": {
          if (typeof message.content !== "string") {
            throw new Error(
              "Message content is invalid for type ('text' should be 'string')"
            );
          }

          generatedLines.push({
            type: "text",
            text: message.content
          });

          break;
        }

        case "file": {
          if (!message.content.type && !message.content.url) {
            throw new Error(
              "Message content is incomplete for type ('file' should have " +
                "'type' and 'url')"
            );
          }

          generatedLines.push({
            type: "file",
            file: message.content
          });

          break;
        }

        default: {
          throw new Error(
            "Message model type is not recognized (cannot assign content)"
          );
        }
      }

      messageModel.content = generatedLines;
    }

    return messageModel;
  },

  /**
   * Makes a separator model (from source message)
   * @public
   * @param  {object} sourceMessage
   * @return {object} Separator model
   */
  makeSeparatorModel: function (sourceMessage) {
    return {
      id: `s-${sourceMessage.date.getTime()}`,
      type: this.ENTRY_TYPE_SEPARATOR,
      date: new Date(sourceMessage.date),
      label: DateHelper.formatDateString(sourceMessage.date)
    };
  }
};

// EXPORTS

export default MessageHelper;
