const { UserService } = require('../services');
const { ApiResponse, asyncHandler, PaginationHelper } = require('../utils');

class UserController {
  static getAllUsers = asyncHandler(async (req, res) => {
    const pagination = PaginationHelper.getPaginationParams(req.query);
    const filters = {
      role: req.query.role,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      search: req.query.search
    };

    const result = await UserService.getAllUsers(pagination, filters);
    res.status(200).json(ApiResponse.paginated('Users retrieved', result.users, result.total, pagination.page, pagination.limit));
  });

  static getProfile = asyncHandler(async (req, res) => {
    const result = await UserService.getProfile(req.user.id);
    res.status(200).json(ApiResponse.ok('Profile retrieved', result));
  });

  static updateProfile = asyncHandler(async (req, res) => {
    const result = await UserService.updateProfile(req.user.id, req.body);
    res.status(200).json(ApiResponse.ok('Profile updated successfully', result));
  });

  static changePassword = asyncHandler(async (req, res) => {
    await UserService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    res.status(200).json(ApiResponse.ok('Password changed successfully'));
  });

  static toggleUserStatus = asyncHandler(async (req, res) => {
    const result = await UserService.toggleUserStatus(req.params.id, req.body.isActive);
    res.status(200).json(ApiResponse.ok('User status updated', result));
  });

  // Admin: Create a new user
  static createUser = asyncHandler(async (req, res) => {
    const result = await UserService.createUser(req.body);
    res.status(201).json(ApiResponse.created('User created successfully', result));
  });
}

module.exports = UserController;
