/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import { htmlEscape as _e } from "escape-goat";
import linkifyHtml from "linkify-html";
import DateHelper from "../../helpers/date.js";
import $event from "../../stores/broker.js";

// CONSTANTS

const FILE_IMAGE_BASELINE_WIDTH = 200;
const FILE_IMAGE_FALLBACK_HEIGHT = 60;
const TEXT_LINKS_TRUNCATE_SIZE = 120;
const PRESENTATION_DEFAULT = "other";

const PRESENTATION_MIME_TYPES = {
  image: new Set([
    "image/jpeg",
    "image/gif",
    "image/png",
    "image/tiff",
    "image/webp"
  ])
};

const TEXT_LINKIFY_OPTIONS = {
  defaultProtocol: "https",
  target: "_blank",
  rel: "noopener",
  nl2br: false,
  truncate: TEXT_LINKS_TRUNCATE_SIZE
};

// COMPONENTS

function Message(message) {
  return {
    // --> DATA <--

    content: message.content,
    user: message.user,
    date: null,
    attributes: null,

    // --> METHODS <--

    /**
     * Mounted hook
     * @public
     * @return {undefined}
     */
    mounted() {
      // Generate message date text
      this.date = this.__generateDate(message.date);

      // Generate message attributes
      this.attributes = this.__generateAttributes(message.content);
    },

    /**
     * Generates message date
     * @private
     * @param  {string} dateString
     * @return {string} Message date
     */
    __generateDate(dateString) {
      let date = new Date(dateString);

      // Date is valid?
      if (isNaN(date.getTime()) === false) {
        return DateHelper.formatTimeString(date);
      }

      // Date is invalid
      return null;
    },

    /**
     * Generates message attributes
     * @private
     * @param  {string} dateString
     * @return {string} Message date
     */
    __generateAttributes(content) {
      let attributesMap = {};

      // Apply attributes for each line
      content.forEach(line => {
        let lineProperties = line.properties || {};

        // Not encrypted? Add insecure attribute.
        if (lineProperties.encrypted !== true) {
          attributesMap.insecure = true;
        }
      });

      return Object.keys(attributesMap);
    },

    // --> EVENT LISTENERS <--

    /**
     * Triggers when the more action is clicked
     * @public
     * @param  {object} event
     * @param  {string} lineId
     * @return {undefined}
     */
    onActionMoreClick(event, lineId) {
      // Emit message actions view event
      $event._emit("message:actions:view", {
        ids: [lineId],
        origin: [event.clientX || 0, event.clientY || 0]
      });
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
      this.html = this.__generateHTML(content);
    },

    /**
     * Generates message HTML
     * @private
     * @param  {object} content
     * @return {object} Generated HTML
     */
    __generateHTML(content) {
      // Important: escape text, as it will be injected as-is to the DOM.
      let safeText = _e(content.text);

      return linkifyHtml(safeText, TEXT_LINKIFY_OPTIONS);
    }
  };
}

function MessageLineFile(content) {
  return {
    // --> TEMPLATE <--

    $template: "#template-message-line-file",

    // --> DATA <--

    file: content.file,

    presentation: null,
    imageSize: null,

    isExpanded: true,

    // --> METHODS <--

    /**
     * Mounted hook
     * @public
     * @return {undefined}
     */
    mounted() {
      // Acquire file presentation mode
      this.presentation = this.__acquireFilePresentation(content);

      // Compute image size for file? (if presentation is image)
      if (this.presentation === "image") {
        this.imageSize = this.__computeFileImageSize(content);
      }
    },

    /**
     * Acquires file presentation mode
     * @private
     * @param  {object} content
     * @return {string} Acquired file presentation mode
     */
    __acquireFilePresentation(content) {
      const fileType = content.file.type;

      if (fileType) {
        // Scan known MIME types for a particular presentation
        for (let presentation in PRESENTATION_MIME_TYPES) {
          // Presentation found for MIME type? Return early.
          if (PRESENTATION_MIME_TYPES[presentation].has(fileType) === true) {
            return presentation;
          }
        }
      }

      // Fallback to default presentation
      return PRESENTATION_DEFAULT;
    },

    /**
     * Computes file image size
     * @private
     * @param  {object} content
     * @return {object} Computed file image size
     */
    __computeFileImageSize(content) {
      // Compute image size (pick the lowest size, up to baseline maximum)
      const fileSize = content.file.size;

      const width = Math.min(
        fileSize && fileSize.width ? fileSize.width : FILE_IMAGE_BASELINE_WIDTH,
        FILE_IMAGE_BASELINE_WIDTH
      );
      const height =
        fileSize && fileSize.width && fileSize.height
          ? (fileSize.height / fileSize.width) * width
          : FILE_IMAGE_FALLBACK_HEIGHT;

      return { width, height };
    },

    // --> EVENT LISTENERS <--

    /**
     * Triggers when file expander is clicked
     * @public
     * @return {undefined}
     */
    onExpanderClick() {
      this.isExpanded = !this.isExpanded;
    }
  };
}

// EXPORTS

export { Message, MessageLineText, MessageLineFile };
