// profile_controller — logged-in user's own profile
import asyncHandler from '../utils/async_handler.js';
import apiResponse from '../utils/api_response.js';
import * as profileService from '../services/profile_service.js';
import * as userService from '../services/user_service.js';
import { HTTP } from '../utils/constants.js';

// GET /api/profile
export const getProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getProfile(req.user.id);
  return apiResponse(res, HTTP.OK, 'Profile fetched', profile);
});

// PATCH /api/profile — update own name, phone, or avatar
export const updateProfile = asyncHandler(async (req, res) => {
  // req.file set by multer if avatar uploaded
  const avatarPath = req.file ? req.file.path : null;
  const updated = await userService.updateOwnProfile(req.user.id, { ...req.body, avatarPath });
  return apiResponse(res, HTTP.OK, 'Profile updated', updated);
});