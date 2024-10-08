/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// CONSTANTS

const DEFAULT_INITIALS_NORMALIZE_REGEX = /\p{Diacritic}/gu;

const DEFAULT_PALETTE_COLORS = [
  "df74c9",
  "05cd8f",
  "52a6db",
  "ee733d",
  "f48686",
  "6b6f8c",
  "e13030",
  "8e30de",
  "b258ec",
  "f15e5e",
  "3159ea",
  "7ab0ff",
  "78c670",
  "18aeec",
  "8125d4",
  "c32ea3",
  "415dae",
  "d79b25",
  "ce811a",
  "2ba032"
];

// COMPONENTS

function Avatar(user) {
  return {
    // --> DATA <--

    avatarUrl: user.avatar || null,

    defaultInitials: null,
    defaultPalette: null,

    // --> METHODS <--

    /**
     * Mounted hook
     * @public
     * @return {undefined}
     */
    mounted() {
      // Generate message avatar defaults (if needed)
      if (this.avatarUrl === null) {
        this.defaultInitials = this.__normalizeDefaultInitials(
          this.__generateDefaultInitials(user.userId, user.name)
        );

        this.defaultPalette = this.__generateDefaultPalette(user.userId);
      }
    },

    /**
     * Normalizes default initials
     * @private
     * @param  {string} [initials]
     * @return {string} Normalized initials
     */
    __normalizeDefaultInitials(initials = null) {
      // Enforce initials to uppercase, and remove any accent and diacritic
      if (initials !== null) {
        return initials
          .toUpperCase()
          .normalize("NFD")
          .replace(DEFAULT_INITIALS_NORMALIZE_REGEX, "");
      }

      return null;
    },

    /**
     * Generates default initials
     * @private
     * @param  {string} userId
     * @param  {string} [name]
     * @return {string} Default initials
     */
    __generateDefaultInitials(userId, name = "") {
      // #1. Extract initials from name (if any, and if long enough)
      if (name) {
        let nameChunks = name
          .split(" ")
          .map(nameChunk => {
            return nameChunk.trim();
          })
          .filter(nameChunk => {
            return nameChunk ? true : false;
          });

        // Extract first name and family name initials?
        if (nameChunks.length >= 2) {
          return `${nameChunks[0][0]}${nameChunks[1][0]}`;
        }

        // Extract first two characters of first name?
        if (nameChunks.length > 0 && nameChunks[0].length >= 1) {
          return nameChunks[0].substring(0, 2);
        }
      }

      // #2. Extract initials from JID, if identifier is JID-like (fallback)
      let jidParts = userId.split("@");

      if (jidParts[0]?.length >= 1 && jidParts[1]?.length >= 1) {
        return jidParts[0].substring(0, 2);
      }

      // No initials extracted
      return null;
    },

    /**
     * Generates default palette
     * @private
     * @param  {string} [userId]
     * @return {string} Default palette
     */
    __generateDefaultPalette(userId = "") {
      // Compute user identifier fingerprint
      let userIdFingerprint = 0;

      for (let i = 0; i < userId.length; i++) {
        userIdFingerprint += userId.charCodeAt(i);
      }

      // Acquire color based on user identifier fingerprint
      let color =
        DEFAULT_PALETTE_COLORS[
          userIdFingerprint % DEFAULT_PALETTE_COLORS.length
        ];

      return `#${color}`;
    }
  };
}

// EXPORTS

export default Avatar;
