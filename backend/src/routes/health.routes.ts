import { Router } from 'express';
import { getHealthScores, getResourceHealthScore, computeHealthScores } from '../controllers/health.controller';

const router = Router();

router.get('/', getHealthScores);
router.get('/:resourceId', getResourceHealthScore);
router.post('/compute', computeHealthScores);

export default router;
