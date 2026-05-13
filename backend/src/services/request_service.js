// Updated request service with email notifications, auto due date, and request deletion after issue
const { RequestRepository, BookRepository, NotificationRepository, AuthRepository } = require('../repositories');
const { ApiError, DateHelper, EmailHelper } = require('../utils');

class RequestService {
  static async requestBook(studentId, bookId) {
    // Check if book exists
    const book = await BookRepository.findBookById(bookId);
    if (!book) {
      throw ApiError.notFound('Book not found');
    }

    // Check if book is available
    if (book.available_copies <= 0) {
      throw ApiError.badRequest('Book is not available');
    }

    // Check if student already has active request for this book
    const existingRequest = await RequestRepository.findActiveRequestForStudentAndBook(studentId, bookId);
    if (existingRequest) {
      throw ApiError.conflict('You already have a pending request for this book');
    }

    // Check max active requests limit
    const activeCount = await RequestRepository.countActiveRequestsForStudent(studentId);
    if (activeCount >= 5) {
      throw ApiError.badRequest('You have reached the maximum number of active requests');
    }

    const requestId = await RequestRepository.createRequest(studentId, bookId);

    // Create notification for student
    await NotificationRepository.createNotification(
      studentId,
      'book_requested',
      'Book Request Submitted',
      `Your request for "${book.title}" has been submitted and is pending approval.`,
      'book_requests',
      requestId
    );

    return await RequestRepository.findRequestById(requestId);
  }

  static async getRequestById(requestId) {
    const request = await RequestRepository.findRequestById(requestId);

    if (!request) {
      throw ApiError.notFound('Request not found');
    }

    return request;
  }

  static async getStudentRequests(studentId, pagination, filters = {}) {
    const requests = await RequestRepository.findRequestsByStudent(studentId, pagination.offset, pagination.limit, filters);
    const total = await RequestRepository.countRequests({ studentId, ...filters });

    return {
      requests,
      total,
      page: pagination.page,
      limit: pagination.limit
    };
  }

  static async getAllRequests(pagination, filters = {}) {
    const requests = await RequestRepository.findAllRequests(pagination.offset, pagination.limit, filters);
    const total = await RequestRepository.countRequests(filters);

    return {
      requests,
      total,
      page: pagination.page,
      limit: pagination.limit
    };
  }

  static async approveRequest(requestId, dueDate) {
    const request = await RequestRepository.findRequestById(requestId);

    if (!request) {
      throw ApiError.notFound('Request not found');
    }

    if (request.request_status !== 'pending') {
      throw ApiError.badRequest('Only pending requests can be approved');
    }

    // Auto-set due date to 7 days from now if not provided
    if (!dueDate) {
      dueDate = DateHelper.formatDate(DateHelper.addDays(new Date(), 7));
    }

    await RequestRepository.updateRequestStatus(requestId, 'approved', dueDate);

    // Create notification
    await NotificationRepository.createNotification(
      request.student_id,
      'book_approved',
      'Book Request Approved',
      `Your request for "${request.title}" has been approved. Due date: ${dueDate}`,
      'book_requests',
      requestId
    );

    return await RequestRepository.findRequestById(requestId);
  }

  static async rejectRequest(requestId) {
    const request = await RequestRepository.findRequestById(requestId);

    if (!request) {
      throw ApiError.notFound('Request not found');
    }

    if (request.request_status !== 'pending') {
      throw ApiError.badRequest('Only pending requests can be rejected');
    }

    await RequestRepository.updateRequestStatus(requestId, 'rejected');

    // Create notification
    await NotificationRepository.createNotification(
      request.student_id,
      'book_rejected',
      'Book Request Rejected',
      `Your request for "${request.title}" has been rejected.`,
      'book_requests',
      requestId
    );

    return await RequestRepository.findRequestById(requestId);
  }

  static async issueBook(requestId) {
    const request = await RequestRepository.findRequestById(requestId);

    if (!request) {
      throw ApiError.notFound('Request not found');
    }

    if (request.request_status !== 'approved' && request.request_status !== 'pending') {
      throw ApiError.badRequest('Only approved or pending requests can be issued');
    }

    // Decrease available copies
    const updated = await BookRepository.decreaseAvailableCopies(request.book_id);
    if (!updated) {
      throw ApiError.badRequest('Book is no longer available');
    }

    // Auto-set due date to 7 days from now
    const issueDate = new Date();
    const dueDate = DateHelper.formatDate(DateHelper.addDays(issueDate, 7));
    const issueDateStr = DateHelper.formatDate(issueDate);

    await RequestRepository.updateRequestStatus(requestId, 'issued', dueDate);

    // Create notification
    await NotificationRepository.createNotification(
      request.student_id,
      'book_issued',
      'Book Issued',
      `"${request.title}" has been issued to you. Due date: ${dueDate}`,
      'book_requests',
      requestId
    );

    // Send email notification to student
    const student = await AuthRepository.findUserById(request.student_id);
    if (student && student.email) {
      EmailHelper.sendBookIssuedEmail(student.email, student.name, request.title, issueDateStr, dueDate)
        .catch(err => console.error('Issue email failed:', err.message));
    }

    return await RequestRepository.findRequestById(requestId);
  }

  static async returnBook(requestId) {
    const request = await RequestRepository.findRequestById(requestId);

    if (!request) {
      throw ApiError.notFound('Request not found');
    }

    if (request.request_status !== 'issued') {
      throw ApiError.badRequest('Only issued books can be returned');
    }

    // Calculate fine if overdue
    let fineAmount = 0;
    if (request.due_date) {
      const dueDate = new Date(request.due_date);
      const today = new Date();
      if (today > dueDate) {
        const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
        fineAmount = daysOverdue * 5; // ₹5 per day
      }
    }

    // Increase available copies
    await BookRepository.increaseAvailableCopies(request.book_id);
    await RequestRepository.updateRequestStatus(requestId, 'returned');

    // Update fine if any
    if (fineAmount > 0) {
      await RequestRepository.updateRequest(requestId, { fine_amount: fineAmount });
    }

    // Create notification
    await NotificationRepository.createNotification(
      request.student_id,
      'book_returned',
      'Book Returned',
      `"${request.title}" has been successfully returned.${fineAmount > 0 ? ` Fine: ₹${fineAmount}` : ''}`,
      'book_requests',
      requestId
    );

    return await RequestRepository.findRequestById(requestId);
  }

  static async getOverdueBooks() {
    return await RequestRepository.getOverdueRequests();
  }
}

module.exports = RequestService;
