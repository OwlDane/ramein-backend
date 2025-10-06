"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const CertificateTemplate_1 = require("../entities/CertificateTemplate");
async function seedCertificateTemplates() {
    try {
        if (!database_1.default.isInitialized) {
            console.log('Initializing database connection...');
            await Promise.race([
                database_1.default.initialize(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Database connection timeout')), 30000))
            ]);
        }
        console.log('✅ Database connected successfully');
        const templateRepository = database_1.default.getRepository(CertificateTemplate_1.CertificateTemplate);
        console.log('Checking existing templates...');
        const existingTemplates = await templateRepository.count();
        if (existingTemplates > 0) {
            console.log(`⚠️  ${existingTemplates} templates already exist. Skipping seed.`);
            await database_1.default.destroy();
            return;
        }
        console.log('No existing templates found. Creating default templates...');
        const modernTemplate = new CertificateTemplate_1.CertificateTemplate();
        modernTemplate.name = 'Modern Certificate';
        modernTemplate.description = 'Template modern dengan design minimalis dan clean';
        modernTemplate.category = 'modern';
        modernTemplate.templateUrl = '/templates/modern-certificate.pdf';
        modernTemplate.thumbnailUrl = '/templates/thumbnails/modern.png';
        modernTemplate.isDefault = true;
        modernTemplate.isActive = true;
        modernTemplate.placeholders = [
            {
                key: 'nama',
                label: 'Nama Peserta',
                x: 421,
                y: 260,
                fontSize: 36,
                fontFamily: 'Helvetica-Bold',
                color: '#2d3748',
                align: 'center',
                maxWidth: 600
            },
            {
                key: 'event',
                label: 'Nama Event',
                x: 421,
                y: 350,
                fontSize: 20,
                fontFamily: 'Helvetica-Bold',
                color: '#2d3748',
                align: 'center',
                maxWidth: 600
            },
            {
                key: 'tanggal',
                label: 'Tanggal',
                x: 421,
                y: 400,
                fontSize: 12,
                fontFamily: 'Helvetica',
                color: '#718096',
                align: 'center',
                maxWidth: 400
            },
            {
                key: 'nomor_sertifikat',
                label: 'Nomor Sertifikat',
                x: 421,
                y: 520,
                fontSize: 10,
                fontFamily: 'Helvetica',
                color: '#a0aec0',
                align: 'center',
                maxWidth: 400
            }
        ];
        modernTemplate.settings = {
            width: 842,
            height: 595,
            orientation: 'landscape',
            backgroundColor: '#ffffff',
            fontFamily: 'Helvetica',
            defaultFontSize: 14,
            defaultColor: '#000000'
        };
        const classicTemplate = new CertificateTemplate_1.CertificateTemplate();
        classicTemplate.name = 'Classic Certificate';
        classicTemplate.description = 'Template klasik dengan border elegan dan ornamen tradisional';
        classicTemplate.category = 'classic';
        classicTemplate.templateUrl = '/templates/classic-certificate.pdf';
        classicTemplate.thumbnailUrl = '/templates/thumbnails/classic.png';
        classicTemplate.isDefault = false;
        classicTemplate.isActive = true;
        classicTemplate.placeholders = [
            {
                key: 'nama',
                label: 'Nama Peserta',
                x: 421,
                y: 280,
                fontSize: 32,
                fontFamily: 'Times-Bold',
                color: '#1a202c',
                align: 'center',
                maxWidth: 550
            },
            {
                key: 'event',
                label: 'Nama Event',
                x: 421,
                y: 360,
                fontSize: 18,
                fontFamily: 'Times-Roman',
                color: '#2d3748',
                align: 'center',
                maxWidth: 550
            },
            {
                key: 'tanggal',
                label: 'Tanggal',
                x: 421,
                y: 410,
                fontSize: 12,
                fontFamily: 'Times-Roman',
                color: '#4a5568',
                align: 'center',
                maxWidth: 400
            },
            {
                key: 'lokasi',
                label: 'Lokasi',
                x: 421,
                y: 435,
                fontSize: 11,
                fontFamily: 'Times-Italic',
                color: '#718096',
                align: 'center',
                maxWidth: 400
            },
            {
                key: 'nomor_sertifikat',
                label: 'Nomor Sertifikat',
                x: 421,
                y: 530,
                fontSize: 9,
                fontFamily: 'Times-Roman',
                color: '#a0aec0',
                align: 'center',
                maxWidth: 400
            }
        ];
        classicTemplate.settings = {
            width: 842,
            height: 595,
            orientation: 'landscape',
            backgroundColor: '#fef5e7',
            fontFamily: 'Times-Roman',
            defaultFontSize: 14,
            defaultColor: '#000000'
        };
        const elegantTemplate = new CertificateTemplate_1.CertificateTemplate();
        elegantTemplate.name = 'Elegant Certificate';
        elegantTemplate.description = 'Template elegant dengan ornamen mewah dan typography premium';
        elegantTemplate.category = 'elegant';
        elegantTemplate.templateUrl = '/templates/elegant-certificate.pdf';
        elegantTemplate.thumbnailUrl = '/templates/thumbnails/elegant.png';
        elegantTemplate.isDefault = false;
        elegantTemplate.isActive = true;
        elegantTemplate.placeholders = [
            {
                key: 'nama',
                label: 'Nama Peserta',
                x: 421,
                y: 270,
                fontSize: 38,
                fontFamily: 'Helvetica-Bold',
                color: '#1a365d',
                align: 'center',
                maxWidth: 600
            },
            {
                key: 'event',
                label: 'Nama Event',
                x: 421,
                y: 345,
                fontSize: 22,
                fontFamily: 'Helvetica',
                color: '#2c5282',
                align: 'center',
                maxWidth: 600
            },
            {
                key: 'tanggal',
                label: 'Tanggal',
                x: 300,
                y: 480,
                fontSize: 11,
                fontFamily: 'Helvetica',
                color: '#4a5568',
                align: 'left',
                maxWidth: 250
            },
            {
                key: 'lokasi',
                label: 'Lokasi',
                x: 542,
                y: 480,
                fontSize: 11,
                fontFamily: 'Helvetica',
                color: '#4a5568',
                align: 'right',
                maxWidth: 250
            },
            {
                key: 'nomor_sertifikat',
                label: 'Nomor Sertifikat',
                x: 421,
                y: 540,
                fontSize: 10,
                fontFamily: 'Helvetica',
                color: '#718096',
                align: 'center',
                maxWidth: 400
            }
        ];
        elegantTemplate.settings = {
            width: 842,
            height: 595,
            orientation: 'landscape',
            backgroundColor: '#f7fafc',
            fontFamily: 'Helvetica',
            defaultFontSize: 14,
            defaultColor: '#1a365d'
        };
        await templateRepository.save([modernTemplate, classicTemplate, elegantTemplate]);
        console.log('✅ Successfully seeded 3 certificate templates:');
        console.log('   1. Modern Certificate (Default)');
        console.log('   2. Classic Certificate');
        console.log('   3. Elegant Certificate');
        await database_1.default.destroy();
        console.log('✅ Database connection closed');
    }
    catch (error) {
        console.error('❌ Error seeding certificate templates:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    seedCertificateTemplates();
}
exports.default = seedCertificateTemplates;
//# sourceMappingURL=seed-certificate-templates.js.map