/*
 * prose-core-views
 *
 * Copyright: 2024, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// CONSTANTS

const MINUTE_TO_SECONDS = 60; // 1 minute

const IMAGE_BASELINE_WIDTH = 320;
const IMAGE_FALLBACK_HEIGHT = 100;

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

    hasAudioError: false,

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

    /**
     * Updates audio progress
     * @private
     * @param  {number} [progressSeconds]
     * @param  {number} [progressPercent]
     * @return {undefined}
     */
    __updateAudioProgress(progressSeconds = 0, progressPercent = 0) {
      // Update progress markers
      this.audioProgressSeconds = progressSeconds;
      this.audioProgressPercent = progressPercent;

      // Update timer
      this.audioTimer = this.__computeAudioTimer(this.audioProgressSeconds);
    },

    // --> EVENT LISTENERS <--

    /**
     * Triggers when audio action button is clicked
     * @public
     * @return {undefined}
     */
    onAudioActionClick(action) {
      const mediaElement = this.$refs.media;

      switch (action) {
        case "play": {
          this.audioAction = "pause";

          if (mediaElement.paused) {
            // Load media again? (if had error)
            if (this.hasAudioError === true) {
              mediaElement.load();

              this.hasAudioError = false;
            }

            // Play media
            mediaElement.play();
          }

          break;
        }

        case "pause": {
          this.audioAction = "play";

          if (!mediaElement.paused) {
            // Pause media
            mediaElement.pause();
          }

          break;
        }
      }
    },

    /**
     * Triggers on audio media play event
     * @public
     * @return {undefined}
     */
    onAudioMediaPlay() {
      // Mark as playing
      this.audioAction = "pause";
    },

    /**
     * Triggers on audio media can play event
     * @public
     * @return {undefined}
     */
    onAudioMediaCanPlay() {
      // Set first audio progress
      this.__updateAudioProgress();
    },

    /**
     * Triggers on audio media pause event
     * @public
     * @return {undefined}
     */
    onAudioMediaPause() {
      // Mark as not playing
      this.audioAction = "play";
    },

    /**
     * Triggers on audio media stalled event
     * @public
     * @return {undefined}
     */
    onAudioMediaStalled() {
      // Mark as not playing
      this.audioAction = "play";
    },

    /**
     * Triggers on audio media time update event
     * @public
     * @return {undefined}
     */
    onAudioMediaTimeUpdate() {
      const mediaElement = this.$refs.media;

      // Acquire audio file total duration (from media, or declared audio \
      //   duration)
      let mediaDuration =
        mediaElement.duration !== Infinity
          ? mediaElement.duration
          : this.audioDuration + 1;

      // Compute playback progress
      let progressPercentRaw = Math.ceil(
        (mediaElement.currentTime / mediaDuration) * 100
      );
      let progressPercent = progressPercentRaw < 100 ? progressPercentRaw : 0;

      // Compute playback duration
      let progressSeconds =
        progressPercent === 0
          ? this.audioDuration
          : Math.floor(mediaElement.currentTime);

      // Update audio progress
      this.__updateAudioProgress(progressSeconds, progressPercent);
    },

    /**
     * Triggers on audio media source error event
     * @public
     * @return {undefined}
     */
    onAudioMediaSourceError() {
      const mediaElement = this.$refs.media;

      // Stop playing (due to error)
      if (!mediaElement.paused) {
        mediaElement.pause();
      }

      // Mark as having error
      this.hasAudioError = true;
    }
  };
}

// EXPORTS

export { FileImage, FileAudio };
