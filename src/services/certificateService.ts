import AppDataSource from '../config/database';
import { Certificate } from '../entities/Certificate';
import { Participant } from '../entities/Participant';
import { Event } from '../entities/Event';
import { generateCertificateNumber, generateVerificationCode } from '../utils/certificateGenerator';
import { cacheService } from './cacheService';
import * as fs from 'fs';
import * as path from 'path';

interface CertificateVerificationResult {
    isValid: boolean;
    error?: string;
    certificate?: {
        id: string;
        number: string;
        issuedAt: Date;
        participant: {
            id: string;
            name: string;
        };
        event: {
            id: string;
            title: string;
            eventDate: Date; // Fixed: changed from 'date' to 'eventDate'
        };
        verificationUrl: string;
    };
}

interface CertificateRevocationResult {
    success: boolean;
    error?: string;
}

export class CertificateService {
    private certificateRepository = AppDataSource.getRepository(Certificate);
    private participantRepository = AppDataSource.getRepository(Participant);
    private eventRepository = AppDataSource.getRepository(Event);

    /**
     * Generate a certificate for a participant
     */
    async generateCertificate(participantId: string, eventId: string, issuedBy: string) {
        // Initialize database connection if not initialized
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        // Check if certificate already exists
        const existing = await this.certificateRepository.findOne({
            where: {
                participant: { id: participantId },
                event: { id: eventId }
            }
        });

        if (existing) {
            throw new Error('Certificate already exists for this participant and event');
        }

        // Get participant and event
        const [participant, event] = await Promise.all([
            this.participantRepository.findOne({
                where: { id: participantId },
                relations: ['user'] // Include user relation for participant name
            }),
            this.eventRepository.findOneBy({ id: eventId })
        ]);

        if (!participant || !event) {
            throw new Error('Participant or event not found');
        }

        // Generate certificate data
        const certificateNumber = generateCertificateNumber();
        const verificationCode = generateVerificationCode();
        const certificateUrl = await this.createCertificateFile(participant, event, certificateNumber);

        // Create and save certificate
        const certificate = new Certificate();
        certificate.certificateNumber = certificateNumber;
        certificate.verificationCode = verificationCode;
        certificate.certificateUrl = certificateUrl;
        certificate.issuedAt = new Date();
        certificate.issuedBy = issuedBy;
        certificate.participant = participant;
        certificate.event = event;
        certificate.participantId = participantId;
        certificate.eventId = eventId;

        const savedCertificate = await this.certificateRepository.save(certificate);

        return {
            id: savedCertificate.id,
            certificateNumber: savedCertificate.certificateNumber,
            participantId: participant.id,
            participantName: participant.user?.name || 'Unknown', // Safe access to user name
            eventId: event.id,
            eventTitle: event.title,
            issuedAt: savedCertificate.issuedAt,
            certificateUrl: savedCertificate.certificateUrl,
            verificationUrl: `${process.env.APP_URL}/verify/${savedCertificate.certificateNumber}`
        };
    }

    /**
     * Verify a certificate by its number with caching
     */
    async verifyCertificate(certificateNumber: string): Promise<CertificateVerificationResult> {
        const cacheKey = cacheService.generateVerificationKey(certificateNumber);
        
        try {
            // Try to get from cache first
            const cachedResult = cacheService.get<CertificateVerificationResult>(cacheKey);
            if (cachedResult) {
                console.log(`Cache hit for certificate verification: ${certificateNumber}`);
                return cachedResult;
            }
            
            console.log(`Cache miss for certificate verification: ${certificateNumber}`);
            
            // Initialize database connection if not initialized
            if (!AppDataSource.isInitialized) {
                await AppDataSource.initialize();
            }

            const certificate = await this.certificateRepository.findOne({
                where: { certificateNumber },
                relations: ['participant', 'participant.user', 'event']
            });

            if (!certificate) {
                const result = { isValid: false, error: 'Certificate not found' };
                // Cache negative result with shorter TTL (5 minutes)
                cacheService.set(cacheKey, result, 300);
                return result;
            }

            const result: CertificateVerificationResult = certificate.revokedAt
                ? { 
                    isValid: false, 
                    error: 'This certificate has been revoked',
                    certificate: this.formatCertificateForVerification(certificate)
                  }
                : {
                    isValid: true,
                    certificate: this.formatCertificateForVerification(certificate)
                  };
            
            // Cache the result with default TTL (1 hour)
            cacheService.set(cacheKey, result);
            
            return result;
        } catch (error) {
            console.error('Error verifying certificate:', error);
            return { 
                isValid: false, 
                error: 'An error occurred while verifying the certificate' 
            };
        }
    }

    /**
     * Get paginated certificates for a specific event with caching
     */
    async getEventCertificates(
        eventId: string, 
        page: number = 1, 
        limit: number = 10
    ): Promise<{
        data: Array<{
            id: string;
            certificateNumber: string;
            participantId: string;
            participantName: string;
            participantEmail: string;
            issuedAt: Date;
            certificateUrl: string;
            isVerified: boolean;
            isRevoked: boolean;
        }>;
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }> {
        // Initialize database connection if not initialized
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        // Validate inputs
        page = Math.max(1, Math.floor(page) || 1);
        limit = Math.max(1, Math.min(100, Math.floor(limit) || 10));

        const cacheKey = cacheService.generateEventCertificatesKey(eventId, page, limit);
        
        try {
            // Try to get from cache first
            const cachedResult = cacheService.get<{
                data: any[];
                meta: {
                    total: number;
                    page: number;
                    limit: number;
                    totalPages: number;
                    hasNextPage: boolean;
                    hasPreviousPage: boolean;
                };
            }>(cacheKey);
            
            if (cachedResult) {
                console.log(`Cache hit for event certificates: ${cacheKey}`);
                return cachedResult;
            }
            
            console.log(`Cache miss for event certificates: ${cacheKey}`);
            
            // Get total count of certificates for the event
            const [certificates, total] = await this.certificateRepository.findAndCount({
                where: { event: { id: eventId } },
                relations: ['participant', 'participant.user'],
                order: { createdAt: 'DESC' },
                skip: (page - 1) * limit,
                take: limit
            });

            const totalPages = Math.ceil(total / limit);
            
            const result = {
                data: certificates.map(cert => ({
                    id: cert.id,
                    certificateNumber: cert.certificateNumber,
                    participantId: cert.participant.id,
                    participantName: cert.participant.user?.name || 'Unknown',
                    participantEmail: cert.participant.user?.email || '',
                    issuedAt: cert.issuedAt,
                    certificateUrl: cert.certificateUrl,
                    isVerified: cert.verifiedAt !== null,
                    isRevoked: cert.revokedAt !== null
                })),
                meta: {
                    total,
                    page,
                    limit,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1
                }
            };
            
            // Cache the result with default TTL (1 hour)
            cacheService.set(cacheKey, result);
            
            return result;
        } catch (error) {
            console.error('Error fetching certificates:', error);
            throw new Error('Failed to fetch certificates');
        }
    }

    /**
     * Revoke a certificate and clear relevant caches
     */
    async revokeCertificate(
        certificateId: string, 
        reason: string, 
        revokedBy: string
    ): Promise<CertificateRevocationResult> {
        // Initialize database connection if not initialized
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const queryRunner = AppDataSource.createQueryRunner();
        
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();
            
            const certificate = await queryRunner.manager.findOne(Certificate, {
                where: { id: certificateId },
                relations: ['event']
            });
            
            if (!certificate) {
                return { success: false, error: 'Certificate not found' };
            }

            if (certificate.revokedAt) {
                return { success: false, error: 'Certificate is already revoked' };
            }

            // Update certificate
            certificate.revokedAt = new Date();
            certificate.revokedBy = revokedBy;
            certificate.revocationReason = reason;
            
            await queryRunner.manager.save(certificate);
            
            // Clear relevant caches
            const verificationKey = cacheService.generateVerificationKey(certificate.certificateNumber);
            const certificateKey = cacheService.generateCertificateKey(certificateId);
            
            // Clear verification and certificate caches
            cacheService.del([verificationKey, certificateKey]);
            
            // Note: In a production environment with Redis or similar, you could implement
            // pattern-based deletion for all pagination caches for this event.
            // The current node-cache implementation doesn't support pattern-based deletion.
            
            await queryRunner.commitTransaction();
            
            return { success: true };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('Error revoking certificate:', error);
            return { 
                success: false, 
                error: 'An error occurred while revoking the certificate' 
            };
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Export certificates in various formats with streaming support
     * @param eventId - ID of the event
     * @param format - Export format (csv, json, pdf)
     * @param stream - Optional stream to write data to (for large exports)
     * @returns Object containing file metadata and data (if not streaming)
     */
    async exportCertificates(
        eventId: string, 
        format: 'csv' | 'json' | 'pdf' = 'csv',
        stream?: NodeJS.WritableStream,
        page: number = 1,
        limit: number = 1000
    ): Promise<{ 
        data?: Buffer | string, 
        mimeType: string, 
        fileName: string,
        stream?: NodeJS.WritableStream
    }> {
        // Validate format
        if (!['csv', 'json', 'pdf'].includes(format)) {
            throw new Error('Unsupported export format. Supported formats: csv, json, pdf');
        }

        try {
            // Get certificates with pagination
            const { data: certificates } = await this.getEventCertificates(eventId, page, limit);
            
            if (!certificates || certificates.length === 0) {
                throw new Error('No certificates found for this event');
            }
            
            const event = await this.eventRepository.findOne({ 
                where: { id: eventId },
                select: ['id', 'title', 'date']
            });
            
            if (!event) {
                throw new Error('Event not found');
            }
            
            // Sanitize filename
            const eventTitle = event.title 
                ? event.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').toLowerCase()
                : 'certificates';
                
            const timestamp = new Date().toISOString()
                .replace(/[:.]/g, '-')
                .replace('T', '_')
                .substring(0, 19);
            
            const baseFileName = `${eventTitle}_${timestamp}`;
            
            // Handle different export formats
            switch (format.toLowerCase()) {
                case 'json':
                    const jsonData = JSON.stringify(
                        { 
                            event: {
                                id: event.id,
                                title: event.title,
                                date: event.date
                            },
                            generatedAt: new Date().toISOString(),
                            count: certificates.length,
                            certificates
                        },
                        null,
                        2
                    );
                    
                    if (stream) {
                        stream.write(jsonData);
                        stream.end();
                        return { mimeType: 'application/json', fileName: `${baseFileName}.json`, stream };
                    }
                    
                    return {
                        data: jsonData,
                        mimeType: 'application/json',
                        fileName: `${baseFileName}.json`
                    };
                    
                case 'pdf':
                    const html = this.generatePdfHtml(certificates, event.title);
                    
                    if (stream) {
                        stream.write(html);
                        stream.end();
                        return { 
                            mimeType: 'text/html', 
                            fileName: `${baseFileName}.html`,
                            stream 
                        };
                    }
                    
                    return {
                        data: html,
                        mimeType: 'text/html',
                        fileName: `${baseFileName}.html`
                    };
                    
                case 'csv':
                default:
                    const csvData = this.convertToCsv(certificates);
                    
                    if (stream) {
                        stream.write(csvData);
                        stream.end();
                        return { 
                            mimeType: 'text/csv', 
                            fileName: `${baseFileName}.csv`,
                            stream 
                        };
                    }
                    
                    return {
                        data: csvData,
                        mimeType: 'text/csv',
                        fileName: `${baseFileName}.csv`
                    };
            }
        } catch (error) {
            console.error('Export error:', error);
            throw new Error(`Failed to export certificates: ${error.message}`);
        }
    }
    
    /**
     * Convert certificates to CSV format
     */
    private convertToCsv(certificates: any[]): string {
        const headers = [
            'Certificate Number',
            'Participant Name',
            'Participant Email',
            'Issued At',
            'Status',
            'Verification URL'
        ];
        
        const rows = certificates.map(cert => ({
            'Certificate Number': `"${cert.certificateNumber}"`,
            'Participant Name': `"${cert.participantName}"`,
            'Participant Email': `"${cert.participantEmail || ''}"`,
            'Issued At': cert.issuedAt ? cert.issuedAt.toISOString() : '',
            'Status': cert.isRevoked ? 'Revoked' : cert.isVerified ? 'Verified' : 'Pending',
            'Verification URL': `${process.env.APP_URL || 'http://localhost:3000'}/verify/${cert.certificateNumber}`
        }));
        
        return [
            headers.join(','),
            ...rows.map(row => Object.values(row).join(','))
        ].join('\n');
    }
    
    /**
     * Generate HTML for PDF export
     */
    private generatePdfHtml(certificates: any[], title: string): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title} - Export</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #2c3e50; text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .footer { margin-top: 20px; text-align: center; font-size: 0.8em; color: #666; }
            </style>
        </head>
        <body>
            <h1>${title} - Certificates</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Total certificates: ${certificates.length}</p>
            
            <table>
                <thead>
                    <tr>
                        <th>Certificate #</th>
                        <th>Participant</th>
                        <th>Email</th>
                        <th>Issued On</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${certificates.map(cert => `
                        <tr>
                            <td>${cert.certificateNumber}</td>
                            <td>${cert.participantName}</td>
                            <td>${cert.participantEmail || 'N/A'}</td>
                            <td>${cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : 'N/A'}</td>
                            <td>${cert.isRevoked ? 'Revoked' : cert.isVerified ? 'Verified' : 'Pending'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="footer">
                <p>Generated by Ramein Event Management System</p>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Create certificate file and return its URL
     */
    private async createCertificateFile(participant: Participant, event: Event, certificateNumber: string): Promise<string> {
        const uploadDir = path.join(__dirname, '../../public/certificates');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = `${certificateNumber}.html`;
        const filePath = path.join(uploadDir, fileName);

        // Simple HTML certificate template
        const html = `<!DOCTYPE html>
        <html>
        <head>
            <title>Certificate of Participation</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                .certificate { border: 2px solid #000; padding: 30px; max-width: 800px; margin: 0 auto; }
                h1 { color: #2c3e50; }
                .participant { font-size: 24px; margin: 20px 0; }
                .event { font-size: 20px; margin: 10px 0; }
                .date { margin: 20px 0; }
                .signature { margin-top: 50px; }
                .verification { font-size: 12px; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="certificate">
                <h1>CERTIFICATE OF PARTICIPATION</h1>
                <p>This is to certify that</p>
                <div class="participant"><strong>${participant.user?.name || 'Participant'}</strong></div>
                <p>has successfully participated in</p>
                <div class="event"><strong>${event.title}</strong></div>
                <div class="date">Issued on: ${new Date().toLocaleDateString()}</div>
                <div class="signature">
                    <div>________________________</div>
                    <div>Authorized Signature</div>
                </div>
                <div class="verification">
                    <p>Certificate ID: ${certificateNumber}</p>
                    <p>Verify at: ${process.env.APP_URL}/verify/${certificateNumber}</p>
                </div>
            </div>
        </body>
        </html>`;

        fs.writeFileSync(filePath, html, { encoding: 'utf-8' });
        return `/certificates/${fileName}`;
    }

    /**
     * Format certificate for verification response
     */
    private formatCertificateForVerification(certificate: Certificate) {
        return {
            id: certificate.id,
            number: certificate.certificateNumber,
            issuedAt: certificate.issuedAt,
            participant: {
                id: certificate.participant.id,
                name: certificate.participant.user?.name || 'Unknown'
            },
            event: {
                id: certificate.event.id,
                title: certificate.event.title,
                eventDate: certificate.event.date
            },
            verificationUrl: `${process.env.APP_URL}/verify/${certificate.certificateNumber}`
        };
    }
}

export const certificateService = new CertificateService();