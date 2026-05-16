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

// Named export for destructured imports (e.g. student_controller)
export const calculateFine = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  if (now <= due) return 0;
  const daysOverdue = Math.ceil((now - due) / (1000 * 60 * 60 * 24));
  return daysOverdue * 5; // ₹5 per day
};

export default DateHelper;
