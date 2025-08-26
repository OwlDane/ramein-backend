import { Router } from 'express';
import { ParticipantController } from '../controllers/ParticipantController';
import { auth, checkRole } from '../middlewares/auth';

const router = Router();

// Protected routes (authenticated users)
router.post('/register', auth, ParticipantController.register);
router.post('/attendance', auth, ParticipantController.markAttendance);
router.get('/my-events', auth, ParticipantController.getUserEvents);
router.get('/my-certificates', auth, ParticipantController.getUserCertificates);

// Admin routes
router.get('/event/:eventId/participants', auth, checkRole(['ADMIN']), ParticipantController.getEventParticipants);
router.post('/certificate/:participantId', auth, checkRole(['ADMIN']), ParticipantController.uploadCertificate);
router.post('/certificate/:participantId/generate', auth, checkRole(['ADMIN']), ParticipantController.generateCertificate);
router.get('/statistics/monthly', auth, checkRole(['ADMIN']), ParticipantController.getMonthlyStatistics);
router.get('/export/:eventId', auth, checkRole(['ADMIN']), ParticipantController.exportParticipants);
router.get('/export/statistics/monthly', auth, checkRole(['ADMIN']), ParticipantController.exportMonthlyStatistics);

export default router;
