/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// STORES

function BrokerStore() {
  return {
    // --> VALUES <--

    NAMESPACE_VALUES: new Set([
      "message:actions:view",
      "message:reactions:view",
      "message:reactions:react",
      "message:file:view",
      "message:history:view",
      "message:history:seek"
    ]),

    // --> DATA <--

    __handlers: {},

    // --> METHODS <--

    /**
     * Binds event handler (or replace)
     * @public
     * @param  {string}   namespace
     * @param  {function} handler
     * @return {boolean}  Event bind status
     */
    on(namespace, handler) {
      // Guard: ensure namespace is valid
      if (!namespace || this.NAMESPACE_VALUES.has(namespace) === false) {
        throw new Error(
          `Event namespace invalid, allowed values: ` +
            `${Array.from(this.NAMESPACE_VALUES.values()).join(", ")}`
        );
      }

      // Guard: ensure handler is a function
      if (!handler || typeof handler !== "function") {
        throw new Error("Event handler should be a function");
      }

      // Bind namespace handler to handlers register
      this.__handlers[namespace] = handler;

      return true;
    },

    /**
     * Unbinds event handler
     * @public
     * @param  {string}  namespace
     * @return {boolean} Event unbind status
     */
    off(namespace) {
      // Guard: ensure namespace is set
      // Notice: no need to check that namespace is allowed here, as we unbind \
      //   any bound event listener.
      if (!namespace) {
        throw new Error("Event namespace not specified");
      }

      // Unbind namespace handler from handlers register?
      if (namespace in this.__handlers) {
        delete this.__handlers[namespace];

        return true;
      }

      return false;
    },

    /**
     * Emits event
     * @protected
     * @param  {string} namespace
     * @param  {object} [data]
     * @return {undefined}
     */
    _emit(namespace, data = {}) {
      // Acquire handler function
      let fnHandler = this.__handlers[namespace] || null;

      if (fnHandler !== null) {
        fnHandler(data);
      }
    }
  };
}

// EXPORTS

export default BrokerStore();
