const { IssueRepository } = require('../repositories');
const { ApiError } = require('../utils');

class IssueService {
  static async createIssue(studentId, bookId, issueType, description, fineAmount = 0) {
    const issueId = await IssueRepository.createIssue(studentId, bookId, issueType, description, fineAmount);
    return await IssueRepository.findIssueById(issueId);
  }

  static async getIssueById(issueId) {
    const issue = await IssueRepository.findIssueById(issueId);
    
    if (!issue) {
      throw ApiError.notFound('Issue not found');
    }

    return issue;
  }

  static async getAllIssues(pagination, filters = {}) {
    const issues = await IssueRepository.findAllIssues(pagination.offset, pagination.limit, filters);
    const total = await IssueRepository.countIssues(filters);

    return {
      issues,
      total,
      page: pagination.page,
      limit: pagination.limit
    };
  }

  static async updateIssue(issueId, updateData) {
    const issue = await IssueRepository.findIssueById(issueId);
    
    if (!issue) {
      throw ApiError.notFound('Issue not found');
    }

    await IssueRepository.updateIssue(issueId, updateData);
    return await IssueRepository.findIssueById(issueId);
  }
}

module.exports = IssueService;
