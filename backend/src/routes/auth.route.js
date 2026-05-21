import express from 'express';
import { login, verifyEmail, logout } from '../controllers/auth.controller.js';
import { loginValidator } from '../validators/auth.validator.js';
import { validateSchema } from '../middlewares/schema.validator.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

//router instance
const router = express.Router();

//login user
router.post('/login', validateSchema(loginValidator), login);

//verify email
router.get('/verify-email', verifyEmail);

//logout user
router.post('/logout', verifyJWT, logout);

//export router
export default router;
