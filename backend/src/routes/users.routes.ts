import { Router } from 'express';
import { body } from 'express-validator';
import { listUsers, getUser, createUser, updateUser, resetUserPassword } from '../controllers/users.controller';
import { authenticateToken } from '../middleware/authenticateToken';
import { authorizeRoles } from '../middleware/authorizeRoles';
import { validate } from '../middleware/validate';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', authorizeRoles('SUPER_ADMIN'), listUsers);

router.get('/:id', authorizeRoles('SUPER_ADMIN'), getUser);

router.post(
  '/',
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
  [
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').isIn(['SUPER_ADMIN', 'ADMIN', 'USER']).withMessage('Invalid role'),
  ],
  validate,
  createUser
);

router.put(
  '/:id',
  authorizeRoles('SUPER_ADMIN'),
  updateUser
);

router.post(
  '/:id/reset-password',
  authorizeRoles('SUPER_ADMIN'),
  resetUserPassword
);

export default router;
