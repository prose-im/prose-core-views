/*
 * prose-core-views
 *
 * Copyright: 2024, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// CONSTANTS

const MINUTE_TO_SECONDS = 60; // 1 minute

const IMAGE_BASELINE_WIDTH = 200;
const IMAGE_FALLBACK_HEIGHT = 60;

// COMPONENTS

function FileImage(file) {
  return {
    // --> DATA <--

    imageSize: null,

    // --> METHODS <--

    /**
     * Mounted hook
     * @public
     * @return {undefined}
     */
    mounted() {
      // Compute image size for file
      this.imageSize = this.__computeImageSize(file);
    },

    /**
     * Computes image size
     * @private
     * @param  {object} file
     * @return {object} Computed image size
     */
    __computeImageSize(file) {
      const fileSize = file.size;

      // Compute image size? (pick the lowest size, up to baseline maximum)
      if (fileSize !== undefined) {
        const width = Math.min(
          fileSize && fileSize.width ? fileSize.width : IMAGE_BASELINE_WIDTH,
          IMAGE_BASELINE_WIDTH
        );
        const height =
          fileSize && fileSize.width && fileSize.height
            ? (fileSize.height / fileSize.width) * width
            : IMAGE_FALLBACK_HEIGHT;

        return { width, height };
      }

      // No image size computable
      return null;
    }
  };
}

function FileAudio(file) {
  return {
    // --> DATA <--

    audioDuration: file.duration || 0,

    audioAction: "play",
    audioTimer: null,

    audioProgressSeconds: 0,
    audioProgressPercent: 0,

    // --> METHODS <--

    /**
     * Mounted hook
     * @public
     * @return {undefined}
     */
    mounted() {
      // Compute audio timer from duration
      this.audioTimer = this.__computeAudioTimer(this.audioDuration);
    },

    /**
     * Computes audio timer
     * @private
     * @param  {number} duration
     * @return {string} Computed audio timer
     */
    __computeAudioTimer(duration) {
      // Compute seconds and minutes
      const seconds = duration % MINUTE_TO_SECONDS,
        minutes = Math.floor(duration / MINUTE_TO_SECONDS);

      // Convert numbers to text
      let minutesText = `${minutes}`,
        secondsText = `${seconds}`;

      if (secondsText.length === 1) {
        secondsText = `0${secondsText}`;
      }

      return [minutesText, secondsText].join(":");
    },

    // --> EVENT LISTENERS <--

    /**
     * Triggers when audio action button is clicked
     * @public
     * @return {undefined}
     */
    onAudioActionClick(action) {
      switch (action) {
        case "play": {
          this.audioAction = "pause";
          this.audioTimer = this.__computeAudioTimer(this.audioProgressSeconds);

          break;
        }

        case "pause": {
          this.audioAction = "play";

          break;
        }
      }
    }
  };
}

// EXPORTS

export { FileImage, FileAudio };
