"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ParticipantController_1 = require("../controllers/ParticipantController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.post('/register', auth_1.auth, ParticipantController_1.ParticipantController.register);
router.post('/attendance', auth_1.auth, ParticipantController_1.ParticipantController.markAttendance);
router.get('/my-events', auth_1.auth, ParticipantController_1.ParticipantController.getUserEvents);
router.get('/my-certificates', auth_1.auth, ParticipantController_1.ParticipantController.getUserCertificates);
router.get('/event/:eventId/participants', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), ParticipantController_1.ParticipantController.getEventParticipants);
router.post('/certificate/:participantId', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), ParticipantController_1.ParticipantController.uploadCertificate);
router.post('/certificate/:participantId/generate', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), ParticipantController_1.ParticipantController.generateCertificate);
router.get('/statistics/monthly', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), ParticipantController_1.ParticipantController.getMonthlyStatistics);
router.get('/export/:eventId', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), ParticipantController_1.ParticipantController.exportParticipants);
router.get('/export/statistics/monthly', auth_1.auth, (0, auth_1.checkRole)(['ADMIN']), ParticipantController_1.ParticipantController.exportMonthlyStatistics);
exports.default = router;
//# sourceMappingURL=participants.js.map