/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// CONSTANTS

const INVALID_FALLBACK = "(?)";
const LINE_BREAK_REGEX = /\n/g;
const SPACE_REGEX = /\s/g;
const DATE_FORMAT_LOCATION = "en-US";
const FILE_IMAGE_BASELINE_WIDTH = 200;

// COMPONENTS

function Message(message) {
  return {
    // --> DATA <--

    user: message.user,
    date: null,
    lines: null,

    // --> METHODS <--

    mounted() {
      // Generate message lines HTML (based on type)
      this.lines = this.generateLines(message.content);

      // Generate message date text
      this.date = this.generateDate(message.date);
    },

    generateLines(contents) {
      // Generate lines
      return contents.map(content => {
        let type, html;

        switch (content.type) {
          case "text": {
            // Text line
            type = content.type;
            html = content.text.replace(LINE_BREAK_REGEX, "<br>");

            break;
          }

          case "file": {
            // Compute image size (pick the lowest size, up to baseline maximum)
            const imageSize = this.computeFileImageSize(content);

            // File line
            // TODO: escape injected content
            // TODO: source from renderer somewhere
            // TODO: if not image, show download button
            type = content.type;

            html = `
              <span class="message-file">
                <span class="message-file-expander">${content.file.name}</span>

                <a
                  class="message-file-image"
                  href="${content.file.url}"
                  target="_blank"
                >
                  <img
                    src="${content.file.url}"
                    width="${imageSize.width || ""}"
                    height="${imageSize.height || ""}"
                    alt=""
                  />
                </a>
              </span>
            `;

            break;
          }

          default: {
            // Type is invalid
            type = null;
            html = INVALID_FALLBACK;
          }
        }

        return {
          type,
          html
        };
      });
    },

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
      return INVALID_FALLBACK;
    },

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

export default Message;
