import { Router } from 'express';
import { body } from 'express-validator';
import { listProjects, getProject, createProject, updateProject, deleteProject } from '../controllers/projects.controller';
import { authenticateToken } from '../middleware/authenticateToken';
import { authorizeRoles } from '../middleware/authorizeRoles';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticateToken);

router.get('/', listProjects);

router.get('/:id', getProject);

router.post(
  '/',
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
  [
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('startDate').notEmpty().withMessage('Start date is required'),
    body('endDate').notEmpty().withMessage('End date is required'),
    body('colorTag').notEmpty().withMessage('Color tag is required'),
  ],
  validate,
  createProject
);

router.put('/:id', authorizeRoles('SUPER_ADMIN', 'ADMIN'), updateProject);

router.delete('/:id', authorizeRoles('SUPER_ADMIN', 'ADMIN'), deleteProject);

export default router;
