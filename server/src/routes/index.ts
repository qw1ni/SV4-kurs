import { Router } from 'express';
import authRoutes from './auth.routes';
import departmentsRoutes from './departments.routes';
import positionsRoutes from './positions.routes';
import employeesRoutes from './employees.routes';
import staffUnitsRoutes from './staff-units.routes';
import leaveRequestsRoutes from './leave-requests.routes';
import reportsRoutes from './reports.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/departments', departmentsRoutes);
router.use('/positions', positionsRoutes);
router.use('/employees', employeesRoutes);
router.use('/staff-units', staffUnitsRoutes);
router.use('/leave-requests', leaveRequestsRoutes);
router.use('/reports', reportsRoutes);

export default router;
