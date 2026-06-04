import { Router } from 'express';
import { getAllRequests, getRequestById, createRequest, updateRequestStatus } from '../controllers/requests.controller';

const router = Router();

router.get('/', getAllRequests);
router.get('/:id', getRequestById);
router.post('/', createRequest);
router.patch('/:id/status', updateRequestStatus);

export default router;
