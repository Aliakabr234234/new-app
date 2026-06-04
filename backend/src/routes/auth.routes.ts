import { Router } from 'express';
import { body } from 'express-validator';
import { login, logout, refresh, getMe, changePassword, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/authenticateToken';
import { validate } from '../middleware/validate';
import { loginRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post(
  '/login',
  loginRateLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post('/logout', authenticateToken, logout);

router.post('/refresh', refresh);

router.get('/me', authenticateToken, getMe);

router.post(
  '/change-password',
  authenticateToken,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
  ],
  validate,
  changePassword
);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email is required')],
  validate,
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  validate,
  resetPassword
);

export default router;
