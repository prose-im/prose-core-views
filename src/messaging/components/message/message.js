/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import { htmlEscape as _e } from "escape-goat";

// CONSTANTS

const LINE_BREAK_REGEX = /\n/g;
const SPACE_REGEX = /\s/g;
const DATE_FORMAT_LOCATION = "en-US";
const FILE_IMAGE_BASELINE_WIDTH = 200;

// COMPONENTS

function Message(message) {
  return {
    // --> DATA <--

    content: message.content,
    user: message.user,
    date: null,

    // --> METHODS <--

    /**
     * Mounted hook
     * @public
     * @return {undefined}
     */
    mounted() {
      // Generate message date text
      this.date = this.generateDate(message.date);
    },

    /**
     * Generates message date
     * @public
     * @param  {string} dateString
     * @return {string} Message date
     */
    generateDate(dateString) {
      let date = new Date(dateString);

      // Date is valid?
      if (isNaN(date.getTime()) === false) {
        let timeString = date.toLocaleString(DATE_FORMAT_LOCATION, {
          hour: "numeric",
          minute: "numeric",
          hour12: true
        });

        return timeString.toLowerCase().replace(SPACE_REGEX, "");
      }

      // Date is invalid
      return null;
    }
  };
}

function MessageLineText(content) {
  return {
    // --> TEMPLATE <--

    $template: "#template-message-line-text",

    // --> DATA <--

    html: null,

    // --> METHODS <--

    /**
     * Mounted hook
     * @public
     * @return {undefined}
     */
    mounted() {
      // Generate text message HTML
      this.html = this.generateHTML(content);
    },

    /**
     * Generates message HTML
     * @public
     * @param  {object} content
     * @return {object} Generated HTML
     */
    generateHTML(content) {
      // Important: escape text, as it will be injected as-is to the DOM.
      return _e(content.text).replace(LINE_BREAK_REGEX, "<br>");
    }
  };
}

function MessageLineFile(content) {
  return {
    // --> TEMPLATE <--

    $template: "#template-message-line-file",

    // --> DATA <--

    file: content.file,
    imageSize: null,

    // --> METHODS <--

    /**
     * Mounted hook
     * @public
     * @return {undefined}
     */
    mounted() {
      // Compute image size for file
      this.imageSize = this.computeFileImageSize(content);
    },

    /**
     * Computes file image size
     * @public
     * @param  {object} content
     * @return {object} Computed file image size
     */
    computeFileImageSize(content) {
      // Compute image size (pick the lowest size, up to baseline maximum)
      const fileSize = content.file.size;

      const width = Math.min(
        fileSize && fileSize.width ? fileSize.width : FILE_IMAGE_BASELINE_WIDTH,
        FILE_IMAGE_BASELINE_WIDTH
      );
      const height =
        fileSize && fileSize.width && fileSize.height
          ? (fileSize.height / fileSize.width) * width
          : null;

      return { width, height };
    }
  };
}

// EXPORTS

export { Message, MessageLineText, MessageLineFile };
