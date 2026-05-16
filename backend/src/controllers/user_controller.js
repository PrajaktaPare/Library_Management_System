// user_controller.js

import { hashPassword } from '../services/auth_service.js';

import {
  getAllUsersService,
  getUserByIDService,
  createUser,
  patchUserService,
  putUserService,
  deleteUserService,
  getProfileService,
  updateProfileService,
} from '../services/user_services.js';

import logger from '../utils/logger.js';

/* =========================================
   FUNCTION: getAllUsers

   PURPOSE:
   Fetch all users

   PARAMETER:
   - req
   - res

   RETURN:
   - users list
========================================= */
export const getAllUsers = async (
  req,
  res
) => {

  try {

    const {
      username,
      email,
      phone,
      page,
      limit,
      sortBy,
      order,
    } = req.query;

    // Filters
    const filters = {
      username,
      email,
      phone,
    };

    // Pagination
    let pagination = {
      limit: null,
      offset: null,
    };

    if (page || limit) {

      if (!page || !limit) {

        return res.status(400).json({
          success_flag: false,
          message:
            'PAGE_AND_LIMIT_REQUIRED',
        });
      }

      if (
        isNaN(page) ||
        isNaN(limit)
      ) {

        return res.status(400).json({
          success_flag: false,
          message:
            'PAGE_AND_LIMIT_MUST_BE_NUMBER',
        });
      }

      pagination.limit =
        Number(limit);

      pagination.offset =
        (Number(page) - 1) *
        Number(limit);
    }

    // Sorting
    const sorting = {
      sortBy,
      order,
    };

    // Fetch users
    const users =
      await getAllUsersService(
        filters,
        pagination,
        sorting
      );

    return res.status(200).json({
      success_flag: true,
      message:
        'USERS_FETCHED_SUCCESSFULLY',
      data: users,
    });

  } catch (error) {

    logger.error(
      'GET ALL USERS ERROR',
      error
    );

    return res.status(500).json({
      success_flag: false,
      message:
        'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
   FUNCTION: getUserByID

   PURPOSE:
   Fetch user by id

   PARAMETER:
   - req
   - res

   RETURN:
   - user data
========================================= */
export const getUserByID = async (
  req,
  res
) => {

  try {

    const { id } = req.params;

    const user =
      await getUserByIDService(id);

    // User not found
    if (!user) {

      return res.status(404).json({
        success_flag: false,
        message:
          'USER_NOT_FOUND',
      });
    }

    return res.status(200).json({
      success_flag: true,
      message:
        'USER_FETCHED_SUCCESSFULLY',
      data: user,
    });

  } catch (error) {

    logger.error(
      'GET USER BY ID ERROR',
      error
    );

    return res.status(500).json({
      success_flag: false,
      message:
        'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
   FUNCTION: postUser

   PURPOSE:
   Create new user

   PARAMETER:
   - req
   - res

   RETURN:
   - inserted user id
========================================= */
export const postUser = async (
  req,
  res
) => {

  try {

    const {
      username,
      email,
      password,
      name,
      phone,
      role_id,
    } = req.body;

    // Hash password
    const password_hash =
      await hashPassword(password);

    // Create user
    const result =
      await createUser({
        username,
        email,
        password_hash,
        name,
        phone,
        role_id,
        is_active: 1,
        is_verified: 1,
      });

    return res.status(201).json({
      success_flag: true,
      message:
        'USER_CREATED_SUCCESSFULLY',
      data: {
        user_id:
          result.insertId,
      },
    });

  } catch (error) {

    logger.error(
      'CREATE USER ERROR',
      error
    );

    return res.status(500).json({
      success_flag: false,
      message:
        error.message,
    });
  }
};

/* =========================================
   FUNCTION: patchUser

   PURPOSE:
   Partially update user

   PARAMETER:
   - req
   - res

   RETURN:
   - update response
========================================= */
export const patchUser = async (
  req,
  res
) => {

  try {

    const { id } = req.params;

    // Empty body validation
    if (
      !Object.keys(req.body).length
    ) {

      return res.status(400).json({
        success_flag: false,
        message:
          'NO_FIELDS_PROVIDED',
      });
    }

    const allowedFields = [
      'username',
      'email',
      'name',
      'phone',
      'role_id',
      'is_active',
      'is_verified',
    ];

    const fields = [];

    const values = [];

    // Build dynamic update query
    for (
      const key of Object.keys(
        req.body
      )
    ) {

      if (
        !allowedFields.includes(key)
      ) {
        continue;
      }

      fields.push(`${key} = ?`);

      values.push(req.body[key]);
    }

    // No valid fields
    if (!fields.length) {

      return res.status(400).json({
        success_flag: false,
        message:
          'NO_VALID_FIELDS_PROVIDED',
      });
    }

    // Update user
    const result =
      await patchUserService(
        id,
        fields,
        values
      );

    // User not found
    if (
      result.affectedRows === 0
    ) {

      return res.status(404).json({
        success_flag: false,
        message:
          'USER_NOT_FOUND',
      });
    }

    return res.status(200).json({
      success_flag: true,
      message:
        'USER_UPDATED_SUCCESSFULLY',
    });

  } catch (error) {

    logger.error(
      'PATCH USER ERROR',
      error
    );

    return res.status(500).json({
      success_flag: false,
      message:
        'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
   FUNCTION: putUser

   PURPOSE:
   Replace user data

   PARAMETER:
   - req
   - res

   RETURN:
   - update response
========================================= */
export const putUser = async (
  req,
  res
) => {

  try {

    const { id } = req.params;

    const {
      username,
      email,
      password,
      name,
      phone,
      role_id,
      is_active,
      is_verified,
    } = req.body;

    // Hash password
    const password_hash =
      await hashPassword(password);

    // Replace user
    const result =
      await putUserService({
        id,
        username,
        email,
        password_hash,
        name,
        phone,
        role_id,
        is_active,
        is_verified,
      });

    // User not found
    if (
      result.affectedRows === 0
    ) {

      return res.status(404).json({
        success_flag: false,
        message:
          'USER_NOT_FOUND',
      });
    }

    return res.status(200).json({
      success_flag: true,
      message:
        'USER_REPLACED_SUCCESSFULLY',
    });

  } catch (error) {

    logger.error(
      'PUT USER ERROR',
      error
    );

    return res.status(500).json({
      success_flag: false,
      message:
        'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
   FUNCTION: deleteUser

   PURPOSE:
   Delete user

   PARAMETER:
   - req
   - res

   RETURN:
   - delete response
========================================= */
export const deleteUser = async (
  req,
  res
) => {

  try {

    const { id } = req.params;

    const result =
      await deleteUserService(id);

    // User not found
    if (
      result.affectedRows === 0
    ) {

      return res.status(404).json({
        success_flag: false,
        message:
          'USER_NOT_FOUND',
      });
    }

    return res.status(200).json({
      success_flag: true,
      message:
        'USER_DELETED_SUCCESSFULLY',
    });

  } catch (error) {

    logger.error(
      'DELETE USER ERROR',
      error
    );

    return res.status(500).json({
      success_flag: false,
      message:
        'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
   FUNCTION: getProfile

   PURPOSE:
   Fetch logged-in user profile

   PARAMETER:
   - req
   - res

   RETURN:
   - profile data
========================================= */
export const getProfile = async (
  req,
  res
) => {

  try {

    const userId =
      req.user.id;

    const user =
      await getProfileService(
        userId
      );

    return res.status(200).json({
      success_flag: true,
      message:
        'PROFILE_FETCHED_SUCCESSFULLY',
      data: user,
    });

  } catch (error) {

    logger.error(
      'GET PROFILE ERROR',
      error
    );

    return res.status(500).json({
      success_flag: false,
      message:
        'INTERNAL_SERVER_ERROR',
    });
  }
};

/* =========================================
   FUNCTION: updateProfile

   PURPOSE:
   Update logged-in user profile

   PARAMETER:
   - req
   - res

   RETURN:
   - update response
========================================= */
export const updateProfile = async (
  req,
  res
) => {

  try {

    const userId =
      req.user.id;

    // Empty body validation
    if (
      !Object.keys(req.body).length
    ) {

      return res.status(400).json({
        success_flag: false,
        message:
          'NO_FIELDS_PROVIDED',
      });
    }

    const allowedFields = [
      'name',
      'phone',
    ];

    const filteredData = {};

    // Filter fields
    for (
      const key of Object.keys(
        req.body
      )
    ) {

      if (
        allowedFields.includes(key)
      ) {

        filteredData[key] =
          req.body[key];
      }
    }

    // No valid fields
    if (
      !Object.keys(filteredData)
        .length
    ) {

      return res.status(400).json({
        success_flag: false,
        message:
          'NO_VALID_FIELDS_PROVIDED',
      });
    }

    // Update profile
    await updateProfileService(
      userId,
      filteredData
    );

    return res.status(200).json({
      success_flag: true,
      message:
        'PROFILE_UPDATED_SUCCESSFULLY',
    });

  } catch (error) {

    logger.error(
      'UPDATE PROFILE ERROR',
      error
    );

    return res.status(500).json({
      success_flag: false,
      message:
        'INTERNAL_SERVER_ERROR',
    });
  }
};