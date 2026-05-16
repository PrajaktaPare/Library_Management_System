import { IssueService } from '../services/index.js';
import { ApiResponse, asyncHandler, PaginationHelper } from '../utils/index.js';

class IssueController {
  static createIssue = asyncHandler(async (req, res) => {
    const result = await IssueService.createIssue(req.user.id, req.body.book_id, req.body.issue_type, req.body.description, req.body.fine_amount || 0);
    res.status(201).json(ApiResponse.created('Issue created successfully', result));
  });
  static getIssues = asyncHandler(async (req, res) => {
    const pagination = PaginationHelper.getPaginationParams(req.query);
    const result = await IssueService.getAllIssues(pagination, { status: req.query.status, type: req.query.type });
    res.status(200).json(ApiResponse.paginated('Issues retrieved', result.issues, result.total, pagination.page, pagination.limit));
  });
  static getIssueById = asyncHandler(async (req, res) => {
    const result = await IssueService.getIssueById(req.params.id);
    res.status(200).json(ApiResponse.ok('Issue details', result));
  });
  static updateIssue = asyncHandler(async (req, res) => {
    const result = await IssueService.updateIssue(req.params.id, req.body);
    res.status(200).json(ApiResponse.ok('Issue updated successfully', result));
  });
}

export default IssueController;
