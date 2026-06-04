import { Router } from 'express';
import { body } from 'express-validator';
import { listAssignments, createAssignment, updateAssignment, deleteAssignment } from '../controllers/assignments.controller';
import { authenticateToken } from '../middleware/authenticateToken';
import { authorizeRoles } from '../middleware/authorizeRoles';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticateToken);

router.get('/', listAssignments);

router.post(
  '/',
  authorizeRoles('SUPER_ADMIN', 'ADMIN'),
  [
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('resourceId').notEmpty().withMessage('Resource ID is required'),
    body('startDate').notEmpty().withMessage('Start date is required'),
    body('endDate').notEmpty().withMessage('End date is required'),
    body('dailyHours').isInt({ min: 1, max: 24 }).withMessage('Daily hours must be 1-24'),
  ],
  validate,
  createAssignment
);

router.put('/:id', authorizeRoles('SUPER_ADMIN', 'ADMIN'), updateAssignment);

router.delete('/:id', authorizeRoles('SUPER_ADMIN', 'ADMIN'), deleteAssignment);

export default router;
