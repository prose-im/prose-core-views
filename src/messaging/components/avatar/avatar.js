/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// CONSTANTS

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
        this.defaultInitials = this.__generateDefaultInitials(
          user.jid,
          user.name
        );

        this.defaultPalette = this.__generateDefaultPalette(user.jid);
      }
    },

    /**
     * Generates default initials
     * @private
     * @param  {string} jid
     * @param  {string} [name]
     * @return {string} Default initials
     */
    __generateDefaultInitials(jid, name = "") {
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
          return `${nameChunks[0][0]}${nameChunks[1][0]}`.toUpperCase();
        }

        // Extract first two characters of first name?
        if (nameChunks[0].length >= 2) {
          return nameChunks[0].substring(0, 2).toUpperCase();
        }
      }

      // #2. Extract initials from JID (fallback)
      let jidParts = jid.split("@");

      if (jidParts[0] && jidParts[0].length >= 1) {
        return jidParts[0].substring(0, 2).toUpperCase();
      }

      // No initials extracted
      return null;
    },

    /**
     * Generates default palette
     * @private
     * @param  {string} [jid]
     * @return {string} Default palette
     */
    __generateDefaultPalette(jid = "") {
      // Compute JID fingerprint
      let jidFingerprint = 0;

      for (let i = 0; i < jid.length; i++) {
        jidFingerprint += jid.charCodeAt(i);
      }

      // Acquire color based on JID fingerprint
      let color =
        DEFAULT_PALETTE_COLORS[jidFingerprint % DEFAULT_PALETTE_COLORS.length];

      return `#${color}`;
    }
  };
}

// EXPORTS

export default Avatar;
