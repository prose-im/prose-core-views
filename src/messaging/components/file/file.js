/*
 * prose-core-views
 *
 * Copyright: 2024, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// CONSTANTS

const IMAGE_BASELINE_WIDTH = 200;
const IMAGE_FALLBACK_HEIGHT = 60;

// COMPONENTS

function File(file) {
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
      // Compute image size for file (if needed)
      this.imageSize = this.__computeFileImageSize(file);
    },

    /**
     * Computes file image size
     * @private
     * @param  {object} file
     * @return {object} Computed file image size
     */
    __computeFileImageSize(file) {
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

// EXPORTS

export default File;
