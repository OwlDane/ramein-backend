"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const CertificateController_1 = require("../controllers/CertificateController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
const adminOnly = (0, authMiddleware_1.authorize)(['admin']);
const organizerOrAdmin = (0, authMiddleware_1.authorize)(['organizer', 'admin']);
router.post('/', [
    (0, express_validator_1.body)('participantId').isUUID().withMessage('Valid participant ID is required'),
    (0, express_validator_1.body)('eventId').isUUID().withMessage('Valid event ID is required')
], organizerOrAdmin, CertificateController_1.certificateController.generateCertificate);
router.get('/verify/:certificateNumber', [
    (0, express_validator_1.param)('certificateNumber')
        .isString()
        .withMessage('Certificate number is required')
], CertificateController_1.certificateController.verifyCertificate);
router.get('/event/:eventId', [
    (0, express_validator_1.param)('eventId').isUUID().withMessage('Valid event ID is required'),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], organizerOrAdmin, CertificateController_1.certificateController.getEventCertificates);
router.get('/export/:eventId', [
    (0, express_validator_1.param)('eventId').isUUID().withMessage('Valid event ID is required'),
    (0, express_validator_1.query)('format').optional().isIn(['csv', 'pdf', 'excel']).withMessage('Invalid export format')
], organizerOrAdmin, CertificateController_1.certificateController.exportCertificates);
router.patch('/revoke/:certificateId', [
    (0, express_validator_1.param)('certificateId').isUUID().withMessage('Valid certificate ID is required'),
    (0, express_validator_1.body)('reason').optional().isString().withMessage('Reason must be a string')
], adminOnly, CertificateController_1.certificateController.revokeCertificate);
exports.default = router;
//# sourceMappingURL=certificateRoutes.js.map