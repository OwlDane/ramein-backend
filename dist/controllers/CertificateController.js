"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.certificateController = exports.CertificateController = void 0;
const certificateService_1 = require("../services/certificateService");
const express_validator_1 = require("express-validator");
class CertificateController {
    async generateCertificate(req, res) {
        var _a;
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { participantId, eventId } = req.body;
            const issuedBy = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'system';
            const result = await certificateService_1.certificateService.generateCertificate(participantId, eventId, issuedBy);
            return res.status(201).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message || 'Failed to generate certificate'
            });
        }
    }
    async verifyCertificate(req, res) {
        try {
            const { certificateNumber } = req.params;
            if (!certificateNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Certificate number is required'
                });
            }
            const result = await certificateService_1.certificateService.verifyCertificate(certificateNumber);
            if (!result.isValid) {
                return res.status(404).json({
                    success: false,
                    error: result.error || 'Certificate not found or invalid',
                    certificate: result.certificate
                });
            }
            return res.json({
                success: true,
                data: result.certificate
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: 'Failed to verify certificate'
            });
        }
    }
    async getEventCertificates(req, res) {
        try {
            const { eventId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            const pageNum = Math.max(1, parseInt(page) || 1);
            const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
            const result = await certificateService_1.certificateService.getEventCertificates(eventId, pageNum, limitNum);
            return res.json({
                success: true,
                data: result.data,
                meta: {
                    ...result.meta,
                    currentPage: result.meta.page,
                    itemsPerPage: result.meta.limit
                }
            });
        }
        catch (error) {
            console.error('Error fetching certificates:', error);
            const statusCode = error.statusCode || 500;
            const errorMessage = error.message || 'Failed to fetch certificates';
            return res.status(statusCode).json({
                success: false,
                error: errorMessage
            });
        }
    }
    async exportCertificates(req, res) {
        const startTime = process.hrtime();
        try {
            const { eventId } = req.params;
            const format = req.query.format || 'csv';
            const useStreaming = req.query.stream === 'true';
            console.log(`Export request received - Event: ${eventId}, Format: ${format}, Streaming: ${useStreaming}`);
            if (!eventId) {
                return res.status(400).json({
                    success: false,
                    error: 'Event ID is required'
                });
            }
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
            if (useStreaming) {
                console.log('Using streaming for export');
                const { PassThrough } = require('stream');
                const stream = new PassThrough();
                res.setHeader('Transfer-Encoding', 'chunked');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                req.on('close', () => {
                    console.log('Client disconnected during export');
                    stream.end();
                });
                certificateService_1.certificateService.exportCertificates(eventId, format, stream)
                    .then(({ mimeType, fileName }) => {
                    res.setHeader('Content-Type', mimeType);
                    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                    stream.pipe(res);
                    const [seconds, nanoseconds] = process.hrtime(startTime);
                    const durationMs = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);
                    console.log(`Streaming export completed in ${durationMs}ms`);
                })
                    .catch(error => {
                    console.error('Streaming export error:', error);
                    if (!res.headersSent) {
                        res.status(500).json({
                            success: false,
                            error: 'Failed to generate export: ' + error.message
                        });
                    }
                    else {
                        res.end();
                    }
                });
                return;
            }
            console.log('Using standard export');
            const exportData = await certificateService_1.certificateService.exportCertificates(eventId, format);
            res.setHeader('Content-Type', exportData.mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${exportData.fileName}"`);
            res.setHeader('Cache-Control', 'no-cache');
            return res.send(exportData.data);
        }
        catch (error) {
            console.error('Export error:', error);
            if (!res.headersSent) {
                const statusCode = error.statusCode || 500;
                return res.status(statusCode).json({
                    success: false,
                    error: error.message || 'Failed to export certificates'
                });
            }
            else {
                console.error('Headers already sent, could not send error response');
                return res.end();
            }
        }
    }
    async revokeCertificate(req, res) {
        var _a;
        try {
            const { certificateId } = req.params;
            const { reason } = req.body;
            const revokedBy = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'system';
            if (!certificateId) {
                return res.status(400).json({
                    success: false,
                    error: 'Certificate ID is required'
                });
            }
            const result = await certificateService_1.certificateService.revokeCertificate(certificateId, reason || 'No reason provided', revokedBy);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error || 'Failed to revoke certificate'
                });
            }
            return res.json({
                success: true,
                message: 'Certificate revoked successfully'
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: 'Failed to revoke certificate: ' + error.message
            });
        }
    }
    async generateBulkCertificates(req, res) {
        var _a;
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { eventId, participantIds } = req.body;
            const issuedBy = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'system';
            const results = {
                generated: 0,
                failed: 0,
                errors: []
            };
            for (const participantId of participantIds) {
                try {
                    await certificateService_1.certificateService.generateCertificate(participantId, eventId, issuedBy);
                    results.generated++;
                }
                catch (error) {
                    results.failed++;
                    results.errors.push(`Participant ${participantId}: ${error.message}`);
                }
            }
            return res.status(201).json({
                success: true,
                data: results,
                message: `Generated ${results.generated} certificates, ${results.failed} failed`
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message || 'Failed to generate bulk certificates'
            });
        }
    }
}
exports.CertificateController = CertificateController;
exports.certificateController = new CertificateController();
//# sourceMappingURL=CertificateController.js.map