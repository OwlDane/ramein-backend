import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { CertificateTemplate, PlaceholderConfig } from '../entities/CertificateTemplate';

interface CertificateData {
    nama: string;
    event: string;
    tanggal: string;
    nomor_sertifikat: string;
    lokasi?: string;
    [key: string]: string | undefined;
}

export class PDFGenerationService {
    /**
     * Generate certificate PDF with template overlay
     */
    static async generateCertificateWithTemplate(
        template: CertificateTemplate,
        data: CertificateData,
        outputPath: string
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                // Create PDF document
                const doc = new PDFDocument({
                    size: template.settings?.orientation === 'portrait' ? 'A4' : [842, 595], // A4 landscape
                    margin: 0
                });

                // Create write stream
                const stream = fs.createWriteStream(outputPath);
                doc.pipe(stream);

                // Add template background image
                if (template.templateUrl && fs.existsSync(template.templateUrl)) {
                    doc.image(template.templateUrl, 0, 0, {
                        width: template.settings?.width || 842,
                        height: template.settings?.height || 595
                    });
                }

                // Add text overlays based on placeholders
                if (template.placeholders && template.placeholders.length > 0) {
                    template.placeholders.forEach((placeholder: PlaceholderConfig) => {
                        const value = data[placeholder.key];
                        if (value) {
                            doc.font(placeholder.fontFamily || 'Helvetica')
                                .fontSize(placeholder.fontSize || 24)
                                .fillColor(placeholder.color || '#000000');

                            // Set text alignment
                            const options: any = {
                                width: placeholder.maxWidth || 600,
                                align: placeholder.align || 'center'
                            };

                            doc.text(value, placeholder.x, placeholder.y, options);
                        }
                    });
                }

                // Finalize PDF
                doc.end();

                stream.on('finish', () => {
                    resolve(outputPath);
                });

                stream.on('error', (error) => {
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Generate simple certificate without template (fallback)
     */
    static async generateSimpleCertificate(
        data: CertificateData,
        outputPath: string
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: [842, 595], // A4 landscape
                    margin: 50
                });

                const stream = fs.createWriteStream(outputPath);
                doc.pipe(stream);

                // Background
                doc.rect(0, 0, 842, 595).fill('#f8f9fa');

                // Border
                doc.rect(30, 30, 782, 535)
                    .lineWidth(3)
                    .stroke('#4a5568');

                doc.rect(40, 40, 762, 515)
                    .lineWidth(1)
                    .stroke('#cbd5e0');

                // Title
                doc.font('Helvetica-Bold')
                    .fontSize(48)
                    .fillColor('#2d3748')
                    .text('CERTIFICATE', 0, 100, {
                        align: 'center',
                        width: 842
                    });

                doc.font('Helvetica')
                    .fontSize(16)
                    .fillColor('#4a5568')
                    .text('OF ACHIEVEMENT', 0, 160, {
                        align: 'center',
                        width: 842
                    });

                // Recipient name
                doc.moveDown(2);
                doc.font('Helvetica')
                    .fontSize(14)
                    .fillColor('#718096')
                    .text('This is to certify that', 0, 220, {
                        align: 'center',
                        width: 842
                    });

                doc.font('Helvetica-Bold')
                    .fontSize(36)
                    .fillColor('#2d3748')
                    .text(data.nama, 0, 260, {
                        align: 'center',
                        width: 842
                    });

                // Event details
                doc.font('Helvetica')
                    .fontSize(14)
                    .fillColor('#718096')
                    .text('has successfully participated in', 0, 320, {
                        align: 'center',
                        width: 842
                    });

                doc.font('Helvetica-Bold')
                    .fontSize(20)
                    .fillColor('#2d3748')
                    .text(data.event, 0, 350, {
                        align: 'center',
                        width: 842
                    });

                // Date and location
                if (data.lokasi) {
                    doc.font('Helvetica')
                        .fontSize(12)
                        .fillColor('#718096')
                        .text(`${data.lokasi} • ${data.tanggal}`, 0, 400, {
                            align: 'center',
                            width: 842
                        });
                } else {
                    doc.font('Helvetica')
                        .fontSize(12)
                        .fillColor('#718096')
                        .text(data.tanggal, 0, 400, {
                            align: 'center',
                            width: 842
                        });
                }

                // Certificate number
                doc.font('Helvetica')
                    .fontSize(10)
                    .fillColor('#a0aec0')
                    .text(`Certificate No: ${data.nomor_sertifikat}`, 0, 520, {
                        align: 'center',
                        width: 842
                    });

                doc.end();

                stream.on('finish', () => {
                    resolve(outputPath);
                });

                stream.on('error', (error) => {
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Ensure upload directory exists
     */
    static ensureUploadDir(dir: string): void {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    /**
     * Generate unique filename
     */
    static generateFilename(prefix: string = 'certificate'): string {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `${prefix}_${timestamp}_${random}.pdf`;
    }
}

export default PDFGenerationService;
