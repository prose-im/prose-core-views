/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import { nextTick } from "petite-vue";
import { htmlEscape as _e } from "escape-goat";
import linkifyHtml from "linkify-html";
import snarkdown from "snarkdown";
import emojiRegex from "emoji-regex";
import DateHelper from "../../helpers/date.js";
import $store from "../../stores/feed.js";
import $context from "../../stores/option.js";
import $event from "../../stores/broker.js";
import MessageHelper from "../../helpers/message.js";

// CONSTANTS

const HTML_LINE_BREAK_REGEX = /<br(?:[ ]{0,1}\/)?>/g;

const EMOJI_REGEX = emojiRegex();
const EMOJI_TEST_BELOW_LENGTH = 16;

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
        // Notice: if secure flag is set, then consider message as secure, \
        //   even if not encrypted (eg. channel messages are considered secure \
        //   although not encrypted).
        if (
          lineProperties.encrypted !== true &&
          lineProperties.secure !== true
        ) {
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

function MessageLine(content, observer) {
  return {
    // --> DATA <--

    edited: content.properties?.edited || false,
    transient: content.properties?.transient || false,

    // --> METHODS <--

    /**
     * Mounted hook
     * @public
     * @return {undefined}
     */
    mounted() {
      // Bind to observer? (if any line element)
      if (this.$refs.line) {
        observer.observe(this.$refs.line);
      }
    }
  };
}

function MessagePartText(content) {
  return {
    // --> TEMPLATE <--

    $template: "#template-message-part-text",

    // --> DATA <--

    html: null,
    enlarged: false,

    // --> METHODS <--

    /**
     * Mounted hook
     * @public
     * @return {undefined}
     */
    mounted() {
      // Generate text message HTML
      this.html = this.__generateHTML(content);

      // Acquire enlarged status
      this.enlarged = this.__acquireEnlarged(content);

      // Bind link click events
      // Notice: ensure DOM has been rendered w/ HTML content
      nextTick(this.__bindLinkClickEvents);
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

      // Hack: replace <br> elements into our own linebreaks, essentially \
      //   fixing an issue with Safari treating the first <br> as the first \
      //   new line, when in fact it might be the second since we use \
      //   'white-space: pre-wrap' on its parent and therefore the first \
      //   effective new line should be '\n'. Unfortunately, as of March 2024 \
      //   there is no way around that using the standard <br>. Other Web \
      //   browsers are not affected by this issue.
      htmlContent = htmlContent.replace(
        HTML_LINE_BREAK_REGEX,
        '<span class="linebreak"></span>'
      );

      return htmlContent;
    },

    /**
     * Acquires enlarged size status for text
     * @private
     * @param  {object}  content
     * @return {boolean} Whether text should be enlarged or not
     */
    __acquireEnlarged(content) {
      // A single emoji in a message should result in an enlarged text
      // Notice: only trigger regex on short strings, for performance reasons, \
      //   since it does not make sense to look for a single emoji in a long \
      //   string, only in short ones. We need to account for multi-characters \
      //   emojis on the UTF-16 range, as some emojis have a length of eg. 8 \
      //   in the case of grapheme clusters. The longest emoji known to this \
      //   day is 'kiss: man, man, light skin tone' which has a length of 15, \
      //   as of January 2023.
      // Reference: \
      //   https://machs.space/posts/whats-the-max-valid-length-of-an-emoji/
      if (content.text.length < EMOJI_TEST_BELOW_LENGTH) {
        const emojiMatches = content.text.match(EMOJI_REGEX);

        // First found emoji matches total text length? (this ensures that the \
        //   string is only a single emoji and nothing else)
        if (emojiMatches && emojiMatches[0]?.length === content.text.length) {
          return true;
        }
      }

      return false;
    },

    /**
     * Binds link click events
     * @private
     * @return {undefined}
     */
    __bindLinkClickEvents() {
      // Bind click event on all links? (if any text element)
      // Notice: since we are generating custom HTML code outside of Vue, then \
      //   we cannot use the standard '@click' event and have to resort to \
      //   using the non-Vue 'addEventListener()'.
      if (this.$refs.textInner) {
        const linkElements =
          this.$refs.textInner.getElementsByTagName("a") || [];

        if (linkElements.length > 0) {
          for (const linkElement of linkElements) {
            linkElement.addEventListener("click", this.__onLinkClick);
          }
        }
      }
    },

    // --> EVENT LISTENERS <--

    /**
     * Triggers when a link is clicked
     * @private
     * @param  {object} event
     * @return {undefined}
     */
    __onLinkClick(event) {
      // Do not open link (let the implementing app choose what to do)
      event.preventDefault();
      event.stopPropagation();

      // Handle link? (if any)
      const linkUrl = event.target?.href || null;

      if (linkUrl !== null) {
        // Extract protocol from link (if any)
        const protocolSeparatorIndex = linkUrl.indexOf(":");

        let linkProtocol = null;

        if (protocolSeparatorIndex > 0) {
          linkProtocol = linkUrl
            .substring(0, protocolSeparatorIndex)
            .toLowerCase();
        }

        // Emit message link open event
        $event._emit("message:link:open", {
          id: content.id,

          link: {
            url: linkUrl,
            protocol: linkProtocol
          }
        });
      }
    }
  };
}

function MessagePartFile(file) {
  return {
    // --> TEMPLATE <--

    $template: "#template-message-part-file",

    // --> DATA <--

    file: file,

    presentation: null,
    viewAction: null,

    isExpanded: true,

    // --> METHODS <--

    /**
     * Mounted hook
     * @public
     * @return {undefined}
     */
    mounted() {
      // Acquire file presentation mode
      this.presentation = this.__acquireFilePresentation(file);

      // Update view action (based on presentation)
      this.viewAction = this.__acquireFileViewAction(this.presentation);
    },

    /**
     * Acquires file presentation mode
     * @private
     * @param  {object} file
     * @return {string} Acquired file presentation mode
     */
    __acquireFilePresentation(file) {
      const fileType = file.type;

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
     * Acquires file view action
     * @private
     * @param  {string} presentation
     * @return {string} Acquired file view action
     */
    __acquireFileViewAction(presentation) {
      // Map view action from presentation
      return presentation === "other" ? "download" : "expand";
    },

    /**
     * Maps file view file data
     * @private
     * @param  {string} presentation
     * @param  {object} file
     * @return {object} File view file data
     */
    __mapFileViewFile(presentation, file) {
      return {
        type: presentation,
        url: file.url,
        name: file.name || null
      };
    },

    /**
     * Lists file view adjacent files
     * @private
     * @param  {string} lineId
     * @param  {object} file
     * @return {object} File view adjacent files
     */
    __listFileViewAdjacents(lineId, file) {
      // Map adjacent files
      const adjacentFiles = {
        before: [],
        after: []
      };

      let hasReachedLineId = false;

      $store.feed.entries.forEach(entry => {
        if (entry.type === "message") {
          entry.content.forEach(line => {
            // Mark line current identifier as reached?
            if (line.id === lineId) {
              hasReachedLineId = true;
            }

            // Process files for line
            if (line.files) {
              // Find same file index in list of files
              let sameFileIndex = line.files.findIndex(lineFile => {
                return line.id === lineId && lineFile === file;
              });

              // Append or prepend files in adjacent list
              line.files.forEach((lineFile, fileIndex) => {
                if (fileIndex !== sameFileIndex) {
                  // Insert file to adjacent files
                  const adjacentFilePresentation =
                    this.__acquireFilePresentation(lineFile);

                  const adjacentFileView = {
                    id: line.id,

                    action: this.__acquireFileViewAction(
                      adjacentFilePresentation
                    ),

                    file: this.__mapFileViewFile(
                      adjacentFilePresentation,
                      lineFile
                    )
                  };

                  // Append adjacent file to its target list
                  const adjacentListTarget =
                    hasReachedLineId === true
                      ? sameFileIndex > -1 && fileIndex < sameFileIndex
                        ? adjacentFiles.before
                        : adjacentFiles.after
                      : adjacentFiles.before;

                  adjacentListTarget.push(adjacentFileView);
                }
              });
            }
          });
        }
      });

      return adjacentFiles;
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
        file: this.__mapFileViewFile(this.presentation, this.file),
        adjacents: this.__listFileViewAdjacents(lineId, this.file)
      });
    }
  };
}

// EXPORTS

export { Message, MessageLine, MessagePartText, MessagePartFile };
