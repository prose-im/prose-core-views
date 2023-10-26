/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import { htmlEscape as _e } from "escape-goat";
import linkifyHtml from "linkify-html";
import snarkdown from "snarkdown";
import DateHelper from "../../helpers/date.js";
import $store from "../../stores/feed.js";
import $context from "../../stores/option.js";
import $event from "../../stores/broker.js";
import MessageHelper from "../../helpers/message.js";

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
  ]),

  video: new Set(["video/webm", "video/ogg", "video/mp4"]),

  audio: new Set([
    "audio/webm",
    "audio/ogg",
    "audio/mp3",
    "audio/mp4",
    "audio/aac"
  ])
};

const TEXT_LINKIFY_OPTIONS = {
  defaultProtocol: "https",
  target: "_blank",
  nl2br: false,
  truncate: TEXT_LINKS_TRUNCATE_SIZE
};

// COMPONENTS

function Message(message) {
  return {
    // --> DATA <--

    content: message.content,
    user: null,
    date: null,
    attributes: null,

    // --> METHODS <--

    /**
     * Mounted hook
     * @public
     * @return {undefined}
     */
    mounted() {
      // Acquire message user identity
      this.user = this.__acquireUserIdentity(message.jid);

      // Generate message date text
      this.date = this.__generateDate(message.date);

      // Generate message attributes
      this.attributes = this.__generateAttributes(message.content);
    },

    /**
     * Acquires message user identity (by reference at best)
     * @private
     * @param  {string} jid
     * @return {object} Message user identity
     */
    __acquireUserIdentity(jid) {
      let userIdentity = $store.feed.identities[jid] || null;

      // Any identity available in store? Use that one.
      // Notice: this returns a direct reference to the store, meaning that we \
      //   do not have to make a local copy of eg. a potentially heavy avatar \
      //   data URL at every component instance mount.
      if (userIdentity !== null) {
        return userIdentity;
      }

      // Generate default local identity (as a fallback)
      return {
        jid
      };
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
     * Triggers when the reaction button is clicked
     * @public
     * @param  {string} lineId
     * @param  {string} reactionImage
     * @param  {object} [reactionAuthors]
     * @return {undefined}
     */
    onReactionClick(lineId, reactionImage, reactionAuthors = []) {
      // Emit message reactions react event
      // Notice: if reaction was already set for local author, then active \
      //   should be toggled back to OFF.
      $event._emit("message:reactions:react", {
        id: lineId,
        reaction: reactionImage,

        active: $context.account.jid
          ? !reactionAuthors.includes($context.account.jid)
          : true
      });
    },

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
        id: lineId,
        origin: MessageHelper.generateEventOrigin("button", event)
      });
    },

    /**
     * Triggers when the reactions action is clicked
     * @public
     * @param  {object} event
     * @param  {string} lineId
     * @return {undefined}
     */
    onActionReactionsClick(event, lineId) {
      // Emit message reactions view event
      $event._emit("message:reactions:view", {
        id: lineId,
        origin: MessageHelper.generateEventOrigin("button", event)
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
    edited: (content.properties || {}).edited || false,

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
      let htmlContent = _e(content.text);

      // Parse Markdown into HTML
      htmlContent = snarkdown(htmlContent);

      // Transform links into HTML
      htmlContent = linkifyHtml(htmlContent, TEXT_LINKIFY_OPTIONS);

      return htmlContent;
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

    viewAction: null,
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

      // Update view action (based on presentation)
      this.viewAction = this.presentation === "other" ? "download" : "expand";

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
    onFileExpanderClick() {
      this.isExpanded = !this.isExpanded;
    },

    /**
     * Triggers when file is clicked
     * @public
     * @param  {string} lineId
     * @param  {string} [actionType]
     * @return {undefined}
     */
    onFileClick(lineId, actionType = "expand") {
      // Emit message actions view event
      $event._emit("message:file:view", {
        id: lineId,
        action: actionType,

        file: {
          type: this.presentation,
          name: this.file.name || null,
          url: this.file.url
        }
      });
    }
  };
}

// EXPORTS

export { Message, MessageLineText, MessageLineFile };
