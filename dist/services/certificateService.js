"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.certificateService = exports.CertificateService = void 0;
const database_1 = __importDefault(require("../config/database"));
const Certificate_1 = require("../entities/Certificate");
const Participant_1 = require("../entities/Participant");
const Event_1 = require("../entities/Event");
const certificateGenerator_1 = require("../utils/certificateGenerator");
const cacheService_1 = require("./cacheService");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class CertificateService {
    constructor() {
        this.certificateRepository = database_1.default.getRepository(Certificate_1.Certificate);
        this.participantRepository = database_1.default.getRepository(Participant_1.Participant);
        this.eventRepository = database_1.default.getRepository(Event_1.Event);
    }
    async generateCertificate(participantId, eventId, issuedBy) {
        var _a;
        if (!database_1.default.isInitialized) {
            await database_1.default.initialize();
        }
        const existing = await this.certificateRepository.findOne({
            where: {
                participant: { id: participantId },
                event: { id: eventId }
            }
        });
        if (existing) {
            throw new Error('Certificate already exists for this participant and event');
        }
        const [participant, event] = await Promise.all([
            this.participantRepository.findOne({
                where: { id: participantId },
                relations: ['user']
            }),
            this.eventRepository.findOneBy({ id: eventId })
        ]);
        if (!participant || !event) {
            throw new Error('Participant or event not found');
        }
        const certificateNumber = (0, certificateGenerator_1.generateCertificateNumber)();
        const verificationCode = (0, certificateGenerator_1.generateVerificationCode)();
        const certificateUrl = await this.createCertificateFile(participant, event, certificateNumber);
        const certificate = new Certificate_1.Certificate();
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
            participantName: ((_a = participant.user) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown',
            eventId: event.id,
            eventTitle: event.title,
            issuedAt: savedCertificate.issuedAt,
            certificateUrl: savedCertificate.certificateUrl,
            verificationUrl: `${process.env.APP_URL}/verify/${savedCertificate.certificateNumber}`
        };
    }
    async verifyCertificate(certificateNumber) {
        const cacheKey = cacheService_1.cacheService.generateVerificationKey(certificateNumber);
        try {
            const cachedResult = cacheService_1.cacheService.get(cacheKey);
            if (cachedResult) {
                console.log(`Cache hit for certificate verification: ${certificateNumber}`);
                return cachedResult;
            }
            console.log(`Cache miss for certificate verification: ${certificateNumber}`);
            if (!database_1.default.isInitialized) {
                await database_1.default.initialize();
            }
            const certificate = await this.certificateRepository.findOne({
                where: { certificateNumber },
                relations: ['participant', 'participant.user', 'event']
            });
            if (!certificate) {
                const result = { isValid: false, error: 'Certificate not found' };
                cacheService_1.cacheService.set(cacheKey, result, 300);
                return result;
            }
            const result = certificate.revokedAt
                ? {
                    isValid: false,
                    error: 'This certificate has been revoked',
                    certificate: this.formatCertificateForVerification(certificate)
                }
                : {
                    isValid: true,
                    certificate: this.formatCertificateForVerification(certificate)
                };
            cacheService_1.cacheService.set(cacheKey, result);
            return result;
        }
        catch (error) {
            console.error('Error verifying certificate:', error);
            return {
                isValid: false,
                error: 'An error occurred while verifying the certificate'
            };
        }
    }
    async getEventCertificates(eventId, page = 1, limit = 10) {
        if (!database_1.default.isInitialized) {
            await database_1.default.initialize();
        }
        page = Math.max(1, Math.floor(page) || 1);
        limit = Math.max(1, Math.min(100, Math.floor(limit) || 10));
        const cacheKey = cacheService_1.cacheService.generateEventCertificatesKey(eventId, page, limit);
        try {
            const cachedResult = cacheService_1.cacheService.get(cacheKey);
            if (cachedResult) {
                console.log(`Cache hit for event certificates: ${cacheKey}`);
                return cachedResult;
            }
            console.log(`Cache miss for event certificates: ${cacheKey}`);
            const [certificates, total] = await this.certificateRepository.findAndCount({
                where: { event: { id: eventId } },
                relations: ['participant', 'participant.user'],
                order: { createdAt: 'DESC' },
                skip: (page - 1) * limit,
                take: limit
            });
            const totalPages = Math.ceil(total / limit);
            const result = {
                data: certificates.map(cert => {
                    var _a, _b;
                    return ({
                        id: cert.id,
                        certificateNumber: cert.certificateNumber,
                        participantId: cert.participant.id,
                        participantName: ((_a = cert.participant.user) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown',
                        participantEmail: ((_b = cert.participant.user) === null || _b === void 0 ? void 0 : _b.email) || '',
                        issuedAt: cert.issuedAt,
                        certificateUrl: cert.certificateUrl,
                        isVerified: cert.verifiedAt !== null,
                        isRevoked: cert.revokedAt !== null
                    });
                }),
                meta: {
                    total,
                    page,
                    limit,
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPreviousPage: page > 1
                }
            };
            cacheService_1.cacheService.set(cacheKey, result);
            return result;
        }
        catch (error) {
            console.error('Error fetching certificates:', error);
            throw new Error('Failed to fetch certificates');
        }
    }
    async revokeCertificate(certificateId, reason, revokedBy) {
        if (!database_1.default.isInitialized) {
            await database_1.default.initialize();
        }
        const queryRunner = database_1.default.createQueryRunner();
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();
            const certificate = await queryRunner.manager.findOne(Certificate_1.Certificate, {
                where: { id: certificateId },
                relations: ['event']
            });
            if (!certificate) {
                return { success: false, error: 'Certificate not found' };
            }
            if (certificate.revokedAt) {
                return { success: false, error: 'Certificate is already revoked' };
            }
            certificate.revokedAt = new Date();
            certificate.revokedBy = revokedBy;
            certificate.revocationReason = reason;
            await queryRunner.manager.save(certificate);
            const verificationKey = cacheService_1.cacheService.generateVerificationKey(certificate.certificateNumber);
            const certificateKey = cacheService_1.cacheService.generateCertificateKey(certificateId);
            cacheService_1.cacheService.del([verificationKey, certificateKey]);
            await queryRunner.commitTransaction();
            return { success: true };
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('Error revoking certificate:', error);
            return {
                success: false,
                error: 'An error occurred while revoking the certificate'
            };
        }
        finally {
            await queryRunner.release();
        }
    }
    async exportCertificates(eventId, format = 'csv', stream, page = 1, limit = 1000) {
        if (!['csv', 'json', 'pdf'].includes(format)) {
            throw new Error('Unsupported export format. Supported formats: csv, json, pdf');
        }
        try {
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
            const eventTitle = event.title
                ? event.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').toLowerCase()
                : 'certificates';
            const timestamp = new Date().toISOString()
                .replace(/[:.]/g, '-')
                .replace('T', '_')
                .substring(0, 19);
            const baseFileName = `${eventTitle}_${timestamp}`;
            switch (format.toLowerCase()) {
                case 'json':
                    const jsonData = JSON.stringify({
                        event: {
                            id: event.id,
                            title: event.title,
                            date: event.date
                        },
                        generatedAt: new Date().toISOString(),
                        count: certificates.length,
                        certificates
                    }, null, 2);
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
        }
        catch (error) {
            console.error('Export error:', error);
            throw new Error(`Failed to export certificates: ${error.message}`);
        }
    }
    convertToCsv(certificates) {
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
    generatePdfHtml(certificates, title) {
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
    async createCertificateFile(participant, event, certificateNumber) {
        var _a;
        const uploadDir = path.join(__dirname, '../../public/certificates');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const fileName = `${certificateNumber}.html`;
        const filePath = path.join(uploadDir, fileName);
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
                <div class="participant"><strong>${((_a = participant.user) === null || _a === void 0 ? void 0 : _a.name) || 'Participant'}</strong></div>
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
    formatCertificateForVerification(certificate) {
        var _a;
        return {
            id: certificate.id,
            number: certificate.certificateNumber,
            issuedAt: certificate.issuedAt,
            participant: {
                id: certificate.participant.id,
                name: ((_a = certificate.participant.user) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown'
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
exports.CertificateService = CertificateService;
exports.certificateService = new CertificateService();
//# sourceMappingURL=certificateService.js.map