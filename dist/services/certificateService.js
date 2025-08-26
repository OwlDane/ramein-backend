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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificateService = void 0;
const Participant_1 = require("../entities/Participant");
const Event_1 = require("../entities/Event");
const User_1 = require("../entities/User");
const data_source_1 = require("../config/data-source");
const eventStatusService_1 = require("./eventStatusService");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class CertificateService {
    constructor() {
        this.participantRepository = data_source_1.AppDataSource.getRepository(Participant_1.Participant);
        this.eventRepository = data_source_1.AppDataSource.getRepository(Event_1.Event);
        this.userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
        this.eventStatusService = new eventStatusService_1.EventStatusService();
    }
    async generateCertificate(participantId) {
        try {
            const participant = await this.participantRepository.findOne({
                where: { id: participantId },
                relations: ['event', 'user']
            });
            if (!participant) {
                return { success: false, error: "Participant not found" };
            }
            if (!participant.hasAttended) {
                return { success: false, error: "Participant must attend the event to receive certificate" };
            }
            const eventStatus = await this.eventStatusService.getEventStatus(participant.event.id);
            if (eventStatus.isAttendanceFormActive) {
                return { success: false, error: "Event is still ongoing, certificate will be available after event ends" };
            }
            const certificateUrl = await this.createCertificateFile(participant);
            participant.certificateUrl = certificateUrl;
            await this.participantRepository.save(participant);
            return { success: true, certificateUrl };
        }
        catch (error) {
            console.error("Error generating certificate:", error);
            return { success: false, error: "Failed to generate certificate" };
        }
    }
    async createCertificateFile(participant) {
        const event = participant.event;
        const user = participant.user;
        const certificateHtml = this.generateCertificateHTML(event, user, participant);
        const filename = `certificate_${participant.id}_${Date.now()}.html`;
        const filepath = path.join(__dirname, '../../public/certificates', filename);
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filepath, certificateHtml);
        return `/certificates/${filename}`;
    }
    generateCertificateHTML(event, user, participant) {
        const eventDate = new Date(event.date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sertifikat - ${event.title}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .certificate {
            background: white;
            padding: 60px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 800px;
            width: 100%;
        }
        .header {
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
            margin-bottom: 40px;
        }
        .title {
            color: #667eea;
            font-size: 2.5em;
            font-weight: bold;
            margin: 0;
        }
        .subtitle {
            color: #666;
            font-size: 1.2em;
            margin: 10px 0;
        }
        .content {
            margin: 40px 0;
        }
        .participant-name {
            font-size: 2em;
            color: #333;
            margin: 20px 0;
            font-weight: bold;
        }
        .event-details {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 15px;
            margin: 30px 0;
        }
        .event-title {
            font-size: 1.5em;
            color: #667eea;
            margin-bottom: 15px;
        }
        .event-info {
            color: #666;
            margin: 10px 0;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #eee;
        }
        .signature {
            margin-top: 30px;
        }
        .signature-line {
            width: 200px;
            height: 2px;
            background: #333;
            margin: 10px auto;
        }
        .signature-name {
            font-weight: bold;
            color: #333;
        }
        .token {
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            display: inline-block;
            margin: 20px 0;
            font-family: monospace;
            font-size: 1.1em;
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">
            <h1 class="title">SERTIFIKAT</h1>
            <p class="subtitle">Certificate of Participation</p>
        </div>
        
        <div class="content">
            <p>Diberikan kepada:</p>
            <div class="participant-name">${user.name}</div>
            <p>Atas partisipasinya dalam kegiatan:</p>
        </div>
        
        <div class="event-details">
            <div class="event-title">${event.title}</div>
            <div class="event-info">
                <strong>Tanggal:</strong> ${eventDate}<br>
                <strong>Waktu:</strong> ${event.time}<br>
                <strong>Lokasi:</strong> ${event.location}
            </div>
        </div>
        
        <div class="content">
            <p>Token Kehadiran:</p>
            <div class="token">${participant.tokenNumber}</div>
        </div>
        
        <div class="footer">
            <p>Dikeluarkan pada: ${new Date().toLocaleDateString('id-ID')}</p>
            <div class="signature">
                <div class="signature-line"></div>
                <div class="signature-name">Admin Ramein</div>
                <p>Penanggung Jawab Kegiatan</p>
            </div>
        </div>
    </div>
</body>
</html>`;
    }
    async getParticipantCertificates(userId) {
        return await this.participantRepository.find({
            where: {
                userId,
                hasAttended: true,
                certificateUrl: { not: null }
            },
            relations: ['event'],
            order: { createdAt: 'DESC' }
        });
    }
    async verifyCertificate(certificateUrl, tokenNumber) {
        try {
            const participant = await this.participantRepository.findOne({
                where: { certificateUrl, tokenNumber },
                relations: ['event', 'user']
            });
            if (!participant) {
                return { isValid: false, error: "Certificate not found or invalid" };
            }
            if (!participant.hasAttended) {
                return { isValid: false, error: "Participant did not attend the event" };
            }
            return { isValid: true, participant };
        }
        catch (error) {
            console.error("Error verifying certificate:", error);
            return { isValid: false, error: "Failed to verify certificate" };
        }
    }
    async bulkGenerateCertificates(eventId) {
        try {
            const participants = await this.participantRepository.find({
                where: {
                    eventId,
                    hasAttended: true,
                    certificateUrl: { is: null }
                },
                relations: ['event', 'user']
            });
            let generated = 0;
            let failed = 0;
            const errors = [];
            for (const participant of participants) {
                try {
                    const result = await this.generateCertificate(participant.id);
                    if (result.success) {
                        generated++;
                    }
                    else {
                        failed++;
                        errors.push(`Participant ${participant.id}: ${result.error}`);
                    }
                }
                catch (error) {
                    failed++;
                    errors.push(`Participant ${participant.id}: ${error.message}`);
                }
            }
            return { success: true, generated, failed, errors };
        }
        catch (error) {
            console.error("Error in bulk generate certificates:", error);
            return { success: false, generated: 0, failed: 0, errors: [error.message] };
        }
    }
    async deleteCertificate(participantId) {
        try {
            const participant = await this.participantRepository.findOne({
                where: { id: participantId }
            });
            if (!participant || !participant.certificateUrl) {
                return false;
            }
            const filepath = path.join(__dirname, '../../public', participant.certificateUrl);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
            participant.certificateUrl = null;
            await this.participantRepository.save(participant);
            return true;
        }
        catch (error) {
            console.error("Error deleting certificate:", error);
            return false;
        }
    }
}
exports.CertificateService = CertificateService;
//# sourceMappingURL=certificateService.js.map