import { Request, Response } from 'express';
import { certificateService } from '../services/certificateService';
import { validationResult } from 'express-validator';

export class CertificateController {
    /**
     * Generate a new certificate for a participant
     */
    async generateCertificate(req: Request, res: Response): Promise<Response> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { participantId, eventId } = req.body;
            const issuedBy = req.user?.id || 'system';

            const result = await certificateService.generateCertificate(
                participantId,
                eventId,
                issuedBy
            );

            return res.status(201).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                error: error.message || 'Failed to generate certificate'
            });
        }
    }

    /**
     * Verify a certificate by its number
     */
    async verifyCertificate(req: Request, res: Response): Promise<Response> {
        try {
            const { certificateNumber } = req.params;
            
            if (!certificateNumber) {
                return res.status(400).json({
                    success: false,
                    error: 'Certificate number is required'
                });
            }

            const result = await certificateService.verifyCertificate(certificateNumber);
            
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
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                error: 'Failed to verify certificate'
            });
        }
    }

    /**
     * Get paginated certificates for an event
     */
    async getEventCertificates(req: Request, res: Response): Promise<Response> {
        try {
            const { eventId } = req.params;
            const { page = 1, limit = 10 } = req.query;
            
            // Convert to numbers and validate
            const pageNum = Math.max(1, parseInt(page as string) || 1);
            const limitNum = Math.max(1, Math.min(100, parseInt(limit as string) || 10));
            
            const result = await certificateService.getEventCertificates(
                eventId, 
                pageNum, 
                limitNum
            );
            
            return res.json({
                success: true,
                data: result.data,
                meta: {
                    ...result.meta,
                    currentPage: result.meta.page,
                    itemsPerPage: result.meta.limit
                }
            });
        } catch (error: any) {
            console.error('Error fetching certificates:', error);
            const statusCode = error.statusCode || 500;
            const errorMessage = error.message || 'Failed to fetch certificates';
            
            return res.status(statusCode).json({
                success: false,
                error: errorMessage
            });
        }
    }

    /**
     * Export certificates for an event with streaming support for large exports
     */
    async exportCertificates(req: Request, res: Response): Promise<Response | void> {
        // Start timing the export
        const startTime = process.hrtime();
        
        try {
            const { eventId } = req.params;
            const format = (req.query.format as 'csv' | 'json' | 'pdf' | undefined) || 'csv';
            const useStreaming = req.query.stream === 'true';
            
            console.log(`Export request received - Event: ${eventId}, Format: ${format}, Streaming: ${useStreaming}`);

            // Basic validation
            if (!eventId) {
                return res.status(400).json({
                    success: false,
                    error: 'Event ID is required'
                });
            }

            // Set security headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

            // For streaming responses
            if (useStreaming) {
                console.log('Using streaming for export');
                
                // Create a pass-through stream
                const { PassThrough } = require('stream');
                const stream = new PassThrough();
                
                // Set appropriate headers for streaming
                res.setHeader('Transfer-Encoding', 'chunked');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');
                
                // Handle client disconnect
                req.on('close', () => {
                    console.log('Client disconnected during export');
                    stream.end();
                });
                
                // Start the export process
                certificateService.exportCertificates(eventId, format, stream)
                    .then(({ mimeType, fileName }) => {
                        // Set content type and disposition
                        res.setHeader('Content-Type', mimeType);
                        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                        
                        // Pipe the stream to response
                        stream.pipe(res);
                        
                        // Log successful export
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
                        } else {
                            // If headers were already sent, we can't send a JSON response
                            res.end();
                        }
                    });
                
                // Return void for streaming case (response handled asynchronously)
                return;
            }
            
            // For non-streaming (smaller exports)
            console.log('Using standard export');
            
            // Get export data
            const exportData = await certificateService.exportCertificates(eventId, format);
            
            // Set response headers
            res.setHeader('Content-Type', exportData.mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${exportData.fileName}"`);
            res.setHeader('Cache-Control', 'no-cache');
            
            // Send the data and return the response
            return res.send(exportData.data);
            
        } catch (error: any) {
            console.error('Export error:', error);
            
            // Only send error response if headers haven't been sent yet
            if (!res.headersSent) {
                const statusCode = error.statusCode || 500;
                return res.status(statusCode).json({
                    success: false,
                    error: error.message || 'Failed to export certificates'
                });
            } else {
                // If headers were already sent, log the error but can't send a response
                console.error('Headers already sent, could not send error response');
                return res.end();
            }
        }
    }

    /**
     * Revoke a certificate
     */
    async revokeCertificate(req: Request, res: Response): Promise<Response> {
        try {
            const { certificateId } = req.params;
            const { reason } = req.body;
            const revokedBy = req.user?.id || 'system';

            if (!certificateId) {
                return res.status(400).json({
                    success: false,
                    error: 'Certificate ID is required'
                });
            }

            const result = await certificateService.revokeCertificate(
                certificateId,
                reason || 'No reason provided',
                revokedBy
            );

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
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                error: 'Failed to revoke certificate: ' + error.message
            });
        }
    }

    /**
     * Generate certificates for multiple participants
     */
    async generateBulkCertificates(req: Request, res: Response): Promise<Response> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { eventId, participantIds } = req.body;
            const issuedBy = req.user?.id || 'system';

            const results = {
                generated: 0,
                failed: 0,
                errors: [] as string[]
            };

            for (const participantId of participantIds) {
                try {
                    await certificateService.generateCertificate(
                        participantId,
                        eventId,
                        issuedBy
                    );
                    results.generated++;
                } catch (error: any) {
                    results.failed++;
                    results.errors.push(`Participant ${participantId}: ${error.message}`);
                }
            }

            return res.status(201).json({
                success: true,
                data: results,
                message: `Generated ${results.generated} certificates, ${results.failed} failed`
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                error: error.message || 'Failed to generate bulk certificates'
            });
        }
    }
}

export const certificateController = new CertificateController();