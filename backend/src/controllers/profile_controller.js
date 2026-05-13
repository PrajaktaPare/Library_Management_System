// profile_controller — logged-in user's own profile
const asyncHandler = require('../utils/async_handler');
const ApiResponse = require('../utils/api_response');
const profileService = require('../services/profile_service');
const { UserService } = require('../services');

// GET /api/profile
const getProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getProfile(req.user.id);
  res.status(200).json(ApiResponse.ok('Profile fetched', profile));
});

// PATCH /api/profile — update own name, phone, or avatar
const updateProfile = asyncHandler(async (req, res) => {
  const updateData = { ...req.body };
  // req.file set by multer if avatar uploaded
  if (req.file) {
    updateData.profile_image = req.file.path;
  }
  const updated = await UserService.updateProfile(req.user.id, updateData);
  res.status(200).json(ApiResponse.ok('Profile updated', updated));
});

module.exports = { getProfile, updateProfile };