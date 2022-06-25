/*
 * prose-core-views
 *
 * Copyright: 2022, Valerian Saliou <valerian@valeriansaliou.name>
 * License: Mozilla Public License v2.0 (MPL v2.0)
 */

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
   * Formats date to date string
   * @public
   * @param  {object} date
   * @return {string} Formatted date
   */
  formatDateString: function (date) {
    return date.toLocaleDateString();
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
