// routes/index.js

import express from 'express';

import userRoutes from './user_routes.js';

import authRoutes from './auth_routes.js';

import logger from '../utils/logger.js';

const router = express.Router();

/* =========================================
   USER ROUTES
========================================= */
router.use(
  '/users',
  userRoutes
);

/* =========================================
   AUTH ROUTES
========================================= */
router.use(
  '/auth',
  authRoutes
);



/* =========================================
   TEST ROUTE
========================================= */
router.get(
  '/test',
  async (
    req,
    res
  ) => {

    try {

      logger.info(
        'TEST ROUTE HIT'
      );

      return res.status(200).json({
        success_flag: true,
        message:
          'ROUTE_WORKING_SUCCESSFULLY',
      });

    } catch (error) {

      logger.error(
        'TEST ROUTE ERROR',
        error
      );

      return res.status(500).json({
        success_flag: false,
        message:
          'INTERNAL_SERVER_ERROR',
      });
    }
  }
);

export default router;