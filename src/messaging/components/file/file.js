/*
 * prose-core-views
 *
 * Copyright: 2024, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import DateHelper from "../../helpers/date.js";

// CONSTANTS

const PREVIEW_BASELINE_SIZE = {
  width: 320,
  height: 180
};

// COMPONENTS

function File(file) {
  return {
    // --> DATA <--

    previewSize: null,

    // --> METHODS <--

    /**
     * Mounted hook
     * @public
     * @return {undefined}
     */
    mounted() {
      // Compute file preview size
      this.previewSize = this.__computePreviewSize(file);
    },

    /**
     * Computes file preview size
     * @private
     * @param  {object} file
     * @return {object} Computed file preview size
     */
    __computePreviewSize(file) {
      const fileSize = file.preview?.size || null;

      // Compute preview size? (pick the lowest size, up to baseline maximum)
      if (fileSize !== null) {
        const width = Math.min(
          fileSize && fileSize.width
            ? fileSize.width
            : PREVIEW_BASELINE_SIZE.width,
          PREVIEW_BASELINE_SIZE.width
        );
        const height =
          fileSize && fileSize.width && fileSize.height
            ? (fileSize.height / fileSize.width) * width
            : PREVIEW_BASELINE_SIZE.height;

        return { width, height };
      }

      // Return default size (baseline)
      return PREVIEW_BASELINE_SIZE;
    }
  };
}

function FileImage(file) {
  return {
    // --> DATA <--

    imagePreviewUrl: file.preview?.url || file.url
  };
}

function FileVideo(file) {
  return {
    // --> DATA <--

    videoPreviewUrl: file.preview?.url || null,
    videoPreviewDuration: file.preview?.duration || 0,

    videoDurationTimer: null,

    // --> METHODS <--

    /**
     * Mounted hook
     * @public
     * @return {undefined}
     */
    mounted() {
      // Compute video duration timer
      this.videoDurationTimer = DateHelper.formatDurationString(
        this.videoPreviewDuration
      );
    }
  };
}

function FileAudio(file) {
  return {
    // --> DATA <--

    audioDuration: file.preview?.duration || 0,

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
      this.audioTimer = DateHelper.formatDurationString(this.audioDuration);
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
      this.audioTimer = DateHelper.formatDurationString(
        this.audioProgressSeconds
      );
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

export { File, FileImage, FileVideo, FileAudio };
