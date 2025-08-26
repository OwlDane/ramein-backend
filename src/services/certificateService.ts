import AppDataSource from '../config/database';
import { Participant } from '../entities/Participant';
import * as fs from 'fs';
import * as path from 'path';

class CertificateService {
    private participantRepository = AppDataSource.getRepository(Participant);

    async generateCertificate(participantId: string): Promise<{ success: boolean; certificateUrl?: string; error?: string; }> {
        try {
            const participant = await this.participantRepository.findOne({
                where: { id: participantId },
                relations: ['event', 'user']
            });

            if (!participant) {
                return { success: false, error: 'Participant not found' };
            }

            if (!participant.hasAttended) {
                return { success: false, error: 'Participant must attend the event to receive certificate' };
            }

            // Ensure event has finished (attendance form not active)
            const eventDate = new Date(participant.event.date);
            const [hh, mm] = participant.event.time.split(':').map(n => parseInt(n));
            eventDate.setHours(hh || 0, mm || 0, 0, 0);
            const now = new Date();
            if (now < eventDate) {
                return { success: false, error: 'Event is still ongoing, certificate available after event ends' };
            }

            const certificateUrl = await this.createCertificateFile(participant);
            participant.certificateUrl = certificateUrl;
            await this.participantRepository.save(participant);

            return { success: true, certificateUrl };
        } catch (error) {
            console.error('Error generating certificate:', error);
            return { success: false, error: 'Failed to generate certificate' };
        }
    }

    private async createCertificateFile(participant: Participant): Promise<string> {
        const certificatesDir = path.join(__dirname, '../../uploads/certificates');
        if (!fs.existsSync(certificatesDir)) {
            fs.mkdirSync(certificatesDir, { recursive: true });
        }

        const safeEventTitle = participant.event.title.replace(/[^a-z0-9\-]+/gi, '_');
        const filename = `certificate_${safeEventTitle}_${participant.id}.html`;
        const filePath = path.join(certificatesDir, filename);

        const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sertifikat - ${participant.event.title}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f7f7f7; padding: 40px; }
    .card { max-width: 900px; margin: 0 auto; background: #fff; border: 1px solid #e5e5e5; box-shadow: 0 4px 12px rgba(0,0,0,0.06); padding: 40px; }
    h1 { text-align: center; margin: 0 0 20px; font-size: 28px; }
    h2 { text-align: center; margin: 0 0 30px; font-size: 22px; color: #444; }
    .name { text-align: center; font-size: 32px; font-weight: bold; margin: 20px 0; }
    .meta { text-align: center; color: #666; margin-top: 30px; }
    .footer { text-align: center; margin-top: 50px; color: #999; font-size: 12px; }
  </style>
  </head>
<body>
  <div class="card">
    <h1>Sertifikat Partisipasi</h1>
    <h2>${participant.event.title}</h2>
    <div class="name">${participant.user.name}</div>
    <div class="meta">
      Telah berpartisipasi pada kegiatan yang diselenggarakan pada
      <strong>${new Date(participant.event.date).toLocaleDateString('id-ID')}</strong>
      pukul <strong>${participant.event.time}</strong> di <strong>${participant.event.location}</strong>.
    </div>
    <div class="footer">Diterbitkan otomatis oleh Ramein</div>
  </div>
</body>
</html>`;

        fs.writeFileSync(filePath, html, { encoding: 'utf-8' });

        // Served by app.use('/api/files', express.static(...))
        return `/api/files/certificates/${filename}`;
    }
}

export default new CertificateService();


