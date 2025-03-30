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
import {
  File,
  FileImage,
  FileVideo,
  FileAudio
} from "./components/file/file.js";
import Separator from "./components/separator/separator.js";
import Group from "./components/group/group.js";
import Entry from "./components/entry/entry.js";
import Loader from "./components/loader/loader.js";
import {
  Message,
  MessageLine,
  MessagePartText,
  MessagePartFile
} from "./components/message/message.js";
import MessageHelper from "./helpers/message.js";

// CONSTANTS

const NEXT_DAY_CHANGE_BUFFER_TIME = 5 * 1000; // 5 seconds

const SCROLL_ACTIVE_AREA_OFFSET = 140; // 140 pixels

const OBSERVER_INTERSECT_THRESHOLD = 0.75; // 75% visible

const DEFAULT_ACCENT_COLOR = "#0072fe"; // Blue

// COMPONENTS

function App() {
  return {
    // --> DATA <--

    isReady: false,

    observer: null,
    dayChangeCount: 0,

    defaultAccentColor: DEFAULT_ACCENT_COLOR,

    __dayChangeTimer: null,
    __scrollLastPosition: 0,

    __scrollActiveAreas: {
      backwards: false,
      forwards: false
    },

    // --> METHODS <--

    /**
     * Mounted hook
     * @public
     * @return {undefined}
     */
    mounted() {
      // Register all global instances
      this.__registerGlobalInstances();

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
      // Unregister all global instances
      this.__unregisterGlobalInstances();

      // Unschedule all global timers
      this.__unscheduleGlobalTimers();

      // Unbind all global events
      this.__unbindGlobalEvents();

      // Mark as non-ready
      this.isReady = false;
    },

    /**
     * Registers all global instances
     * @private
     * @return {undefined}
     */
    __registerGlobalInstances() {
      // Register observer instance
      this.__registerObserverInstance();
    },

    /**
     * Unregisters all global instances
     * @private
     * @return {undefined}
     */
    __unregisterGlobalInstances() {
      // Unregister observer instance
      this.__unregisterObserverInstance();
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
      // Bind scroll event
      this.__bindScrollEvent();

      // Bind context menu event
      this.__bindContextMenuEvent();
    },

    /**
     * Unbinds all global events
     * @private
     * @return {undefined}
     */
    __unbindGlobalEvents() {
      // Unbind scroll event
      this.__unbindScrollEvent();

      // Unbind context menu event
      this.__unbindContextMenuEvent();
    },

    /**
     * Registers observer instance
     * @private
     * @return {undefined}
     */
    __registerObserverInstance() {
      if (this.observer === null) {
        this.observer = new IntersectionObserver(
          this.__handleElementObservedEvent,

          {
            threshold: OBSERVER_INTERSECT_THRESHOLD
          }
        );
      }
    },

    /**
     * Unregisters observer instance
     * @private
     * @return {undefined}
     */
    __unregisterObserverInstance() {
      if (this.observer !== null) {
        // Disconnect observer
        this.observer.disconnect();

        // Void observer
        this.observer = null;
      }
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
     * Binds scroll event
     * @private
     * @return {undefined}
     */
    __bindScrollEvent() {
      document.addEventListener("scroll", this.__handleScrollEvent);
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
     * Unbinds scroll event
     * @private
     * @return {undefined}
     */
    __unbindScrollEvent() {
      document.removeEventListener("scroll", this.__handleScrollEvent);
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
     * Handles element observed event
     * @private
     * @param  {object} [entries]
     * @return {undefined}
     */
    __handleElementObservedEvent(entries = []) {
      entries.forEach(entry => {
        // List identifiers from target element
        let identifiers = entry.target
          ? MessageHelper.listIdentifiersFromElement(entry.target)
          : [];

        // Acquire visibility
        const visibility = entry.isIntersecting === true ? "visible" : "hidden";

        // Emit message history view event
        identifiers.forEach(identifier => {
          $event._emit("message:history:view", {
            id: identifier,
            visibility
          });
        });
      });
    },

    /**
     * Handles scroll event
     * @private
     * @return {undefined}
     */
    __handleScrollEvent() {
      let scrollBox = document.documentElement,
        scrollDifference = scrollBox.scrollTop - this.__scrollLastPosition;

      // Acquire previous active backwards and active forwards values
      let previousActive = {
        backwards: this.__scrollActiveAreas.backwards,
        forwards: this.__scrollActiveAreas.forwards
      };

      // Update backwards active area state
      this.__scrollActiveAreas.backwards =
        scrollBox.scrollTop <= SCROLL_ACTIVE_AREA_OFFSET;

      // Update forwards active area state
      this.__scrollActiveAreas.forwards =
        scrollBox.clientHeight + scrollBox.scrollTop >=
        scrollBox.scrollHeight - SCROLL_ACTIVE_AREA_OFFSET;

      // Update last scroll position
      this.__scrollLastPosition = scrollBox.scrollTop;

      // Entered active area? Dispatch event.
      let emitEvents = {
        backwards: scrollDifference < 0,
        forwards: scrollDifference > 0
      };

      for (let direction in previousActive) {
        if (
          this.__scrollActiveAreas[direction] === true &&
          previousActive[direction] !== this.__scrollActiveAreas[direction] &&
          emitEvents[direction] === true
        ) {
          $event._emit("message:history:seek", {
            direction
          });
        }
      }
    },

    /**
     * Handles context menu event
     * @private
     * @param  {object} event
     * @return {undefined}
     */
    __handleContextMenuEvent(event) {
      event.preventDefault();

      // List identifiers from target element
      let identifiers = MessageHelper.listIdentifiersFromElement(event.target);

      // Emit message actions view event? (if any)
      if (identifiers.length > 0) {
        // Notice: pick the first available identifier in the hierarchy
        $event._emit("message:actions:view", {
          id: identifiers[0],

          origin: MessageHelper.generateEventOrigin(
            "context-menu",
            event,
            false
          )
        });
      }
    }
  };
}

// INITIALIZERS

createApp({
  App,
  Avatar,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  Separator,
  Loader,
  Group,
  Entry,
  Message,
  MessageLine,
  MessagePartText,
  MessagePartFile,
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
  SandboxHelper.loadAndApplyFixtures($store, $context);
}

// EXPORTS

globalThis.MessagingContext = $context;
globalThis.MessagingStore = $store;
globalThis.MessagingEvent = $event;
