/*
 * prose-core-views
 *
 * Copyright: 2024, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import DateHelper from "../../helpers/date.js";
import $context from "../../stores/option.js";

// CONSTANTS

const PREVIEW_SMALL_SIZE_RATIO = 0.5; // 50%

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
     * @return {object} Computed file preview size (if any)
     */
    __computePreviewSize(file) {
      // Are thumbnails not disabled?
      if ($context.behavior.thumbnails.enable !== false) {
        const size = file.preview?.size || null;

        // Compute preview size? (pick the lowest size, up to baseline maximum)
        let width, height;

        if (size !== null) {
          // Check if preview has vertical aspect
          const hasVerticalAspect =
            size?.width && size?.height && size.height > size.width && true;

          // Acquire baseline vertical and horizontal sizes (based on aspect)
          const baselineHorizontalSize = hasVerticalAspect
            ? PREVIEW_BASELINE_SIZE.height
            : PREVIEW_BASELINE_SIZE.width;
          const baselineVerticalSize = hasVerticalAspect
            ? PREVIEW_BASELINE_SIZE.width
            : PREVIEW_BASELINE_SIZE.height;

          // Compute final preview width and height
          width = Math.min(
            size?.width ? size.width : baselineHorizontalSize,
            baselineHorizontalSize
          );
          height =
            size?.width && size?.height
              ? (size.height / size.width) * width
              : baselineVerticalSize;
        } else {
          // Use default size (baseline)
          width = PREVIEW_BASELINE_SIZE.width;
          height = PREVIEW_BASELINE_SIZE.height;
        }

        // Scale down to small size? (apply ratio)
        if ($context.behavior.thumbnails.small === true) {
          width = Math.floor(width * PREVIEW_SMALL_SIZE_RATIO);
          height = Math.floor(height * PREVIEW_SMALL_SIZE_RATIO);
        }

        return { width, height };
      }

      // Thumbnails disabled
      return null;
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
