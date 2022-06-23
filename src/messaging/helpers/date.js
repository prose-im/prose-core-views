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
  }
};

// EXPORTS

export default DateHelper;
