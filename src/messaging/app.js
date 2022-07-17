/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import { createApp } from "petite-vue";
import $context from "./stores/option.js";
import $store from "./stores/feed.js";
import $event from "./stores/broker.js";
import Avatar from "./components/avatar/avatar.js";
import Separator from "./components/separator/separator.js";
import Entry from "./components/entry/entry.js";
import {
  Message,
  MessageLineText,
  MessageLineFile
} from "./components/message/message.js";
import MessageHelper from "./helpers/message.js";

// CONSTANTS

const NEXT_DAY_CHANGE_BUFFER_TIME = 5 * 1000; // 5 seconds

// COMPONENTS

function App() {
  return {
    // --> DATA <--

    isReady: false,
    dayChangeCount: 0,

    __dayChangeTimer: null,

    // --> METHODS <--

    /**
     * Mounted hook
     * @public
     * @return {undefined}
     */
    mounted() {
      // Schedule all global timers
      this.__scheduleGlobalTimers();

      // Schedule all global events
      this.__bindGlobalEvents();

      // Mark as ready
      this.isReady = true;
    },

    /**
     * Unmounted hook
     * @public
     * @return {undefined}
     */
    unmounted() {
      // Unschedule all timers
      this.__unscheduleGlobalTimers();

      // Unbind all global events
      this.__unbindGlobalEvents();
    },

    /**
     * Schedules all global timers
     * @private
     * @return {undefined}
     */
    __scheduleGlobalTimers() {
      // Schedule day change timer
      this.__scheduleNextDayChangeTimer();
    },

    /**
     * Unschedules all global timers
     * @private
     * @return {undefined}
     */
    __unscheduleGlobalTimers() {
      // Unschedule day change timer
      this.__unscheduleNextDayChangeTimer();
    },

    /**
     * Binds all global events
     * @private
     * @return {undefined}
     */
    __bindGlobalEvents() {
      // Bind context menu event
      this.__bindContextMenuEvent();
    },

    /**
     * Unbinds all global events
     * @private
     * @return {undefined}
     */
    __unbindGlobalEvents() {
      // Unbind context menu event
      this.__unbindContextMenuEvent();
    },

    /**
     * Schedules next day change timer
     * @private
     * @return {undefined}
     */
    __scheduleNextDayChangeTimer() {
      if (this.__dayChangeTimer === null) {
        // Acquire time to next day
        // Notice: add a few seconds to the time to next day used in the \
        //   delay, as a way to correct for any leap second eg. when changing \
        //   from one year to the other.
        var nowDate = new Date(),
          tomorrowDate = new Date(
            nowDate.getFullYear(),
            nowDate.getMonth(),
            nowDate.getDate() + 1
          );

        let timeToNextDay =
          tomorrowDate.getTime() -
          nowDate.getTime() +
          NEXT_DAY_CHANGE_BUFFER_TIME;

        // Schedule timer
        this.__dayChangeTimer = setTimeout(() => {
          this.__dayChangeTimer = null;

          // Day changed: increment count
          this.dayChangeCount++;

          // Schedule next day change timer (ie. for tomorrow)
          this.__scheduleNextDayChangeTimer();
        }, timeToNextDay);
      }
    },

    /**
     * Unschedules next day change timer
     * @private
     * @return {undefined}
     */
    __unscheduleNextDayChangeTimer() {
      // Clear day change timer?
      if (this.__dayChangeTimer !== null) {
        clearTimeout(this.__dayChangeTimer);

        this.__dayChangeTimer = null;
      }
    },

    /**
     * Binds context menu event
     * @private
     * @return {undefined}
     */
    __bindContextMenuEvent() {
      document.addEventListener("contextmenu", this.__handleContextMenuEvent);
    },

    /**
     * Unbinds context menu event
     * @private
     * @return {undefined}
     */
    __unbindContextMenuEvent() {
      document.removeEventListener(
        "contextmenu",
        this.__handleContextMenuEvent
      );
    },

    /**
     * Handles context menu event
     * @private
     * @param  {object} event
     * @return {undefined}
     */
    __handleContextMenuEvent(event) {
      event.preventDefault();

      // Emit message actions view event
      $event._emit("message:actions:view", {
        ids: MessageHelper.listIdentifiersFromElement(event.target),
        origin: [event.clientX || 0, event.clientY || 0]
      });
    }
  };
}

// INITIALIZERS

createApp({
  App,
  Avatar,
  Separator,
  Entry,
  Message,
  MessageLineText,
  MessageLineFile,
  $store,
  $context,
  $event
}).mount("#app");

if (process.env.NODE_ENV !== "production") {
  // Important: include sandbox helper for non-production builds only, as it \
  //   adds up significant overhead on the final bundle size, since it \
  //   includes sandbox fixtures, used for development and testing purposes \
  //   only.
  const SandboxHelper = require("./helpers/sandbox.js").default;

  SandboxHelper.configureContext($context);
  SandboxHelper.registerEventHooks($event);
  SandboxHelper.loadAndApplyFixtures($store);
}

// EXPORTS

globalThis.MessagingContext = $context;
globalThis.MessagingStore = $store;
globalThis.MessagingEvent = $event;
