"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFGenerationService = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
class PDFGenerationService {
    static async generateCertificateWithTemplate(template, data, outputPath) {
        return new Promise((resolve, reject) => {
            var _a, _b, _c;
            try {
                const doc = new pdfkit_1.default({
                    size: ((_a = template.settings) === null || _a === void 0 ? void 0 : _a.orientation) === 'portrait' ? 'A4' : [842, 595],
                    margin: 0
                });
                const stream = fs_1.default.createWriteStream(outputPath);
                doc.pipe(stream);
                if (template.templateUrl && fs_1.default.existsSync(template.templateUrl)) {
                    doc.image(template.templateUrl, 0, 0, {
                        width: ((_b = template.settings) === null || _b === void 0 ? void 0 : _b.width) || 842,
                        height: ((_c = template.settings) === null || _c === void 0 ? void 0 : _c.height) || 595
                    });
                }
                if (template.placeholders && template.placeholders.length > 0) {
                    template.placeholders.forEach((placeholder) => {
                        const value = data[placeholder.key];
                        if (value) {
                            doc.font(placeholder.fontFamily || 'Helvetica')
                                .fontSize(placeholder.fontSize || 24)
                                .fillColor(placeholder.color || '#000000');
                            const options = {
                                width: placeholder.maxWidth || 600,
                                align: placeholder.align || 'center'
                            };
                            doc.text(value, placeholder.x, placeholder.y, options);
                        }
                    });
                }
                doc.end();
                stream.on('finish', () => {
                    resolve(outputPath);
                });
                stream.on('error', (error) => {
                    reject(error);
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    static async generateSimpleCertificate(data, outputPath) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new pdfkit_1.default({
                    size: [842, 595],
                    margin: 50
                });
                const stream = fs_1.default.createWriteStream(outputPath);
                doc.pipe(stream);
                doc.rect(0, 0, 842, 595).fill('#f8f9fa');
                doc.rect(30, 30, 782, 535)
                    .lineWidth(3)
                    .stroke('#4a5568');
                doc.rect(40, 40, 762, 515)
                    .lineWidth(1)
                    .stroke('#cbd5e0');
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
                if (data.lokasi) {
                    doc.font('Helvetica')
                        .fontSize(12)
                        .fillColor('#718096')
                        .text(`${data.lokasi} • ${data.tanggal}`, 0, 400, {
                        align: 'center',
                        width: 842
                    });
                }
                else {
                    doc.font('Helvetica')
                        .fontSize(12)
                        .fillColor('#718096')
                        .text(data.tanggal, 0, 400, {
                        align: 'center',
                        width: 842
                    });
                }
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
            }
            catch (error) {
                reject(error);
            }
        });
    }
    static ensureUploadDir(dir) {
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
    }
    static generateFilename(prefix = 'certificate') {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `${prefix}_${timestamp}_${random}.pdf`;
    }
}
exports.PDFGenerationService = PDFGenerationService;
exports.default = PDFGenerationService;
//# sourceMappingURL=pdfGenerationService.js.map