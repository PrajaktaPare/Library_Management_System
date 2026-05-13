class DateHelper {
  static getCurrentDate() {
    return new Date();
  }

  static getDateAfterDays(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  static formatDate(date, format = 'YYYY-MM-DD') {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    return date.toISOString().split('T')[0];
  }

  static getDaysDifference(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1 - date2) / oneDay));
  }

  static isOverdue(dueDate, currentDate = new Date()) {
    return currentDate > new Date(dueDate);
  }

  static addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

module.exports = DateHelper;
