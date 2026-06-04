import { Router } from 'express';
import { getAllTemplates, createTemplate, applyTemplate } from '../controllers/templates.controller';

const router = Router();

router.get('/', getAllTemplates);
router.post('/', createTemplate);
router.post('/:id/apply', applyTemplate);

export default router;
