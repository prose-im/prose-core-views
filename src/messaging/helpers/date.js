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

const DATE_DAYS_OF_THE_WEEK = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
];

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
    // Generate week limit date (relative to now, in local time)
    var weekLimitDate = new Date();

    weekLimitDate.setDate(weekLimitDate.getDate() - (WEEK_DAYS - 1));

    weekLimitDate.setHours(0);
    weekLimitDate.setMinutes(0);
    weekLimitDate.setSeconds(0);
    weekLimitDate.setMilliseconds(0);

    // Date is from less than a week ago (relative to now)
    if (date >= weekLimitDate) {
      const dateDayOfTheWeek = DATE_DAYS_OF_THE_WEEK[date.getDay()] || null;

      if (dateDayOfTheWeek !== null) {
        return $context.i18n._.dates.days[dateDayOfTheWeek];
      }
    }

    return this.formatDateString(date);
  },

  /**
   * Checks if dates are within elapsed time
   * @public
   * @param  {object}  dateLeft
   * @param  {object}  dateRight
   * @param  {number}  [timeframe]
   * @return {boolean} Within elapsed time status
   */
  areWithinElapsedTime: function (dateLeft, dateRight, timeframe = 0) {
    let elapsedTime = dateRight.getTime() - dateLeft.getTime();

    return elapsedTime >= 0 && elapsedTime < timeframe ? true : false;
  }
};

// EXPORTS

export default DateHelper;
