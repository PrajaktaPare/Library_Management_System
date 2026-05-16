import { RequestService } from '../services/index.js';
import { ApiResponse, asyncHandler, PaginationHelper } from '../utils/index.js';

class RequestController {
  static requestBook = asyncHandler(async (req, res) => {
    const result = await RequestService.requestBook(req.user.id, req.body.book_id);
    res.status(201).json(ApiResponse.created('Book request created successfully', result));
  });
  static getMyRequests = asyncHandler(async (req, res) => {
    const pagination = PaginationHelper.getPaginationParams(req.query);
    const result = await RequestService.getStudentRequests(req.user.id, pagination, { status: req.query.status });
    res.status(200).json(ApiResponse.paginated('Your requests', result.requests, result.total, pagination.page, pagination.limit));
  });
  static getAllRequests = asyncHandler(async (req, res) => {
    const pagination = PaginationHelper.getPaginationParams(req.query);
    const result = await RequestService.getAllRequests(pagination, { status: req.query.status, studentId: req.query.studentId });
    res.status(200).json(ApiResponse.paginated('All requests', result.requests, result.total, pagination.page, pagination.limit));
  });
  static getRequestById = asyncHandler(async (req, res) => {
    const result = await RequestService.getRequestById(req.params.id);
    res.status(200).json(ApiResponse.ok('Request details', result));
  });
  static approveRequest = asyncHandler(async (req, res) => {
    const result = await RequestService.approveRequest(req.params.id, req.body.due_date);
    res.status(200).json(ApiResponse.ok('Request approved', result));
  });
  static rejectRequest = asyncHandler(async (req, res) => {
    const result = await RequestService.rejectRequest(req.params.id);
    res.status(200).json(ApiResponse.ok('Request rejected', result));
  });
  static issueBook = asyncHandler(async (req, res) => {
    const result = await RequestService.issueBook(req.params.id);
    res.status(200).json(ApiResponse.ok('Book issued successfully', result));
  });
  static returnBook = asyncHandler(async (req, res) => {
    const result = await RequestService.returnBook(req.params.id);
    res.status(200).json(ApiResponse.ok('Book returned successfully', result));
  });
  static getOverdueBooks = asyncHandler(async (req, res) => {
    const result = await RequestService.getOverdueBooks();
    res.status(200).json(ApiResponse.ok('Overdue books', result));
  });
}

export default RequestController;
