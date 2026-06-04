import { Router } from 'express';
import { body } from 'express-validator';
import { listResources, createResource, updateResource, deleteResource } from '../controllers/resources.controller';
import { authenticateToken } from '../middleware/authenticateToken';
import { authorizeRoles } from '../middleware/authorizeRoles';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticateToken);

router.get('/', listResources);

router.post(
  '/',
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
  [
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('role').notEmpty().trim().withMessage('Role is required'),
    body('colorTag').notEmpty().withMessage('Color tag is required'),
  ],
  validate,
  createResource
);

router.put('/:id', authorizeRoles('SUPER_ADMIN', 'ADMIN'), updateResource);

router.delete('/:id', authorizeRoles('SUPER_ADMIN', 'ADMIN'), deleteResource);

export default router;
