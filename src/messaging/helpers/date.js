/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

// IMPORTS

import $context from "../stores/option.js";

// CONSTANTS

const SPACE_REGEX = /\s/g;
const WEEK_DAYS = 7;
const DAY_MILLISECONDS = 1000 * 60 * 60 * 24;
const MINUTE_SECONDS = 60;

const DATE_DAY_BEGIN = {
  milliseconds: 0,
  seconds: 0,
  minutes: 0,
  hours: 0
};

const DATE_DAYS_OF_THE_WEEK = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
];

const DATE_DAY_EPOCHS = {
  ["-1"]: "yesterday",
  ["0"]: "today"
};

// HELPERS

const DateHelper = {
  // METHODS

  /**
   * Checks if dates are on the same year
   * @public
   * @param  {object}  dateLeft
   * @param  {object}  dateRight
   * @return {boolean} Same year status
   */
  areSameYear: function (dateLeft, dateRight) {
    return dateLeft.getFullYear() === dateRight.getFullYear();
  },

  /**
   * Checks if dates are on the same month
   * @public
   * @param  {object}  dateLeft
   * @param  {object}  dateRight
   * @return {boolean} Same month status
   */
  areSameMonth: function (dateLeft, dateRight) {
    return (
      this.areSameYear(dateLeft, dateRight) &&
      dateLeft.getMonth() === dateRight.getMonth()
    );
  },

  /**
   * Checks if dates are on the same day
   * @public
   * @param  {object}  dateLeft
   * @param  {object}  dateRight
   * @return {boolean} Same day status
   */
  areSameDay: function (dateLeft, dateRight) {
    return (
      this.areSameMonth(dateLeft, dateRight) &&
      dateLeft.getDate() === dateRight.getDate()
    );
  },

  /**
   * Checks if dates are within elapsed time
   * @public
   * @param  {object}  dateLeft
   * @param  {object}  dateRight
   * @param  {number}  [timeframe]
   * @param  {number}  [signFactor]
   * @return {boolean} Within elapsed time status
   */
  areWithinElapsedTime: function (
    dateLeft,
    dateRight,
    timeframe = 0,
    signFactor = 1
  ) {
    let elapsedTime = (dateRight.getTime() - dateLeft.getTime()) * signFactor;

    return elapsedTime >= 0 && elapsedTime < timeframe ? true : false;
  },

  /**
   * Formats date as a day of the week string
   * @public
   * @param  {object} date
   * @return {string} Formatted day of the week
   */
  formatDayOfTheWeekString: function (date) {
    let dateDayOfTheWeek = DATE_DAYS_OF_THE_WEEK[date.getDay()] || null;

    if (dateDayOfTheWeek !== null) {
      return $context.i18n._.dates.days[dateDayOfTheWeek];
    }

    return null;
  },

  /**
   * Formats relative day epoch string
   * @public
   * @param  {object} dateLeft
   * @param  {object} dateRight
   * @return {string} Formatted relative day epoch
   */
  formatRelativeDayEpochString: function (dateLeft, dateRight) {
    // Generate equivalent dates, at the beginning of each date's day
    // Notice: this is only useful when the days difference is eg. less than \
    //   24h, since when there are only a few hours separating both dates, but \
    //   the date on the right is yesterday, eg. 11pm yesterday vs 3am today. \
    //   This avoid showing left and right dates both as 'Today' and 'Today' \
    //   where it should have been 'Today' and 'Yesterday'.
    let dateLeftStartOfDay = this.getDateAsBeginningOfDay(dateLeft),
      dateRightStartOfDay = this.getDateAsBeginningOfDay(dateRight);

    // Acquire the days difference between the dates
    let daysDifference = Math.floor(
      (dateLeftStartOfDay.getTime() - dateRightStartOfDay.getTime()) /
        DAY_MILLISECONDS
    );

    // Only process relative epochs going to the past (it doesnt make sense \
    //   to look forward to the future)
    if (daysDifference >= 0) {
      let dayEpoch = DATE_DAY_EPOCHS[`${-1 * daysDifference}`] || null;

      if (dayEpoch !== null) {
        return $context.i18n._.dates.epochs[dayEpoch];
      }
    }

    return null;
  },

  /**
   * Formats duration to duration string
   * @public
   * @param  {number} duration
   * @return {string} Formatted duration
   */
  formatDurationString: function (duration) {
    // Compute seconds and minutes
    const seconds = duration % MINUTE_SECONDS,
      minutes = Math.floor(duration / MINUTE_SECONDS);

    // Convert numbers to text
    let minutesText = `${minutes}`,
      secondsText = `${seconds}`;

    if (secondsText.length === 1) {
      secondsText = `0${secondsText}`;
    }

    return [minutesText, secondsText].join(":");
  },

  /**
   * Formats date to time string
   * @public
   * @param  {object} date
   * @return {string} Formatted time
   */
  formatTimeString: function (date) {
    let timeString = date.toLocaleString($context.i18n.code, {
      hour: "numeric",
      minute: "numeric",
      hour12: true
    });

    return timeString.toLowerCase().replace(SPACE_REGEX, "");
  },

  /**
   * Formats date to date string
   * @public
   * @param  {object} date
   * @return {string} Formatted date
   */
  formatDateString: function (date) {
    return date.toLocaleDateString($context.i18n.code);
  },

  /**
   * Formats date to date string (or show day, if recent)
   * @public
   * @param  {object} date
   * @return {string} Formatted date
   */
  formatDateOrDayString: function (date) {
    // Acquire now date
    let nowDate = new Date();

    // Generate week limit date (relative to now, in local time)
    let weekLimitDate = new Date(nowDate);

    weekLimitDate.setDate(weekLimitDate.getDate() - (WEEK_DAYS - 1));

    weekLimitDate.setHours(0);
    weekLimitDate.setMinutes(0);
    weekLimitDate.setSeconds(0);
    weekLimitDate.setMilliseconds(0);

    // Acquire epoch difference (ie. number of days between dates)
    let epochRelativeDays = this.formatRelativeDayEpochString(nowDate, date);

    if (epochRelativeDays !== null) {
      return epochRelativeDays;
    }

    // Date is from less than a week ago (relative to now)
    if (date >= weekLimitDate) {
      let dayName = this.formatDayOfTheWeekString(date);

      if (dayName !== null) {
        return dayName;
      }
    }

    return this.formatDateString(date);
  },

  /**
   * Gets a date so that it is starts at the beginning of the day
   * @public
   * @param  {object} date
   * @return {object} Date at the beginning of the day
   */
  getDateAsBeginningOfDay: function (date) {
    // Copy date so that we do not alter the original date object
    let dateAtBeginningOfDay = new Date(date);

    // Update copied date so that it starts at the exact beginning of its day
    dateAtBeginningOfDay.setHours(
      DATE_DAY_BEGIN.hours,
      DATE_DAY_BEGIN.minutes,
      DATE_DAY_BEGIN.seconds,
      DATE_DAY_BEGIN.milliseconds
    );

    return dateAtBeginningOfDay;
  }
};

// EXPORTS

export default DateHelper;
