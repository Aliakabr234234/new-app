import { Router } from 'express';
import { getDashboardStats, getUtilization, getCompanyTimeline, getAuditLogs, getForecast } from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/authenticateToken';
import { authorizeRoles } from '../middleware/authorizeRoles';

const router = Router();

router.use(authenticateToken);

router.get('/dashboard', getDashboardStats);

router.get('/utilization', getUtilization);

router.get('/company-timeline', getCompanyTimeline);

router.get('/audit-logs', authorizeRoles('SUPER_ADMIN'), getAuditLogs);

router.get('/forecast', getForecast);

export default router;
