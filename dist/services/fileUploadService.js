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
exports.FileUploadService = void 0;
const errorService_1 = require("./errorService");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class FileUploadService {
    static initializeUploadDirectory() {
        const uploadPath = path.join(process.cwd(), this.UPLOAD_DIR);
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        const subdirs = ['flyers', 'certificates', 'temp'];
        subdirs.forEach(subdir => {
            const subdirPath = path.join(uploadPath, subdir);
            if (!fs.existsSync(subdirPath)) {
                fs.mkdirSync(subdirPath, { recursive: true });
            }
        });
    }
    static validateFile(file, allowedTypes = this.ALLOWED_IMAGE_TYPES) {
        if (!file) {
            throw new errorService_1.AppError('File tidak ditemukan', 400);
        }
        if (file.size > this.MAX_FILE_SIZE) {
            throw new errorService_1.AppError('Ukuran file terlalu besar. Maksimal 5MB', 400);
        }
        if (!allowedTypes.includes(file.mimetype)) {
            throw new errorService_1.AppError('Tipe file tidak didukung', 400);
        }
    }
    static generateUniqueFilename(originalname, prefix = '') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const ext = path.extname(originalname);
        const name = path.basename(originalname, ext);
        return `${prefix}${name}_${timestamp}_${random}${ext}`;
    }
    static async saveFile(file, subdirectory) {
        try {
            const uploadPath = path.join(process.cwd(), this.UPLOAD_DIR, subdirectory);
            const filename = this.generateUniqueFilename(file.originalname, subdirectory === 'flyers' ? 'flyer_' : 'cert_');
            const filepath = path.join(uploadPath, filename);
            fs.copyFileSync(file.path, filepath);
            fs.unlinkSync(file.path);
            return path.join(this.UPLOAD_DIR, subdirectory, filename);
        }
        catch (error) {
            console.error('Error saving file:', error);
            throw new errorService_1.AppError('Gagal menyimpan file', 500);
        }
    }
    static async deleteFile(filepath) {
        try {
            const fullPath = path.join(process.cwd(), filepath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }
        catch (error) {
            console.error('Error deleting file:', error);
        }
    }
    static getFileInfo(filepath) {
        try {
            const fullPath = path.join(process.cwd(), filepath);
            if (fs.existsSync(fullPath)) {
                const stats = fs.statSync(fullPath);
                return {
                    exists: true,
                    size: stats.size,
                    mimetype: this.getMimeType(path.extname(filepath))
                };
            }
            return { exists: false, size: 0, mimetype: '' };
        }
        catch (error) {
            return { exists: false, size: 0, mimetype: '' };
        }
    }
    static getMimeType(extension) {
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
    }
    static cleanupTempFiles() {
        try {
            const tempPath = path.join(process.cwd(), this.UPLOAD_DIR, 'temp');
            if (fs.existsSync(tempPath)) {
                const files = fs.readdirSync(tempPath);
                const now = Date.now();
                const maxAge = 24 * 60 * 60 * 1000;
                files.forEach(filename => {
                    const filepath = path.join(tempPath, filename);
                    const stats = fs.statSync(filepath);
                    if (now - stats.mtime.getTime() > maxAge) {
                        fs.unlinkSync(filepath);
                    }
                });
            }
        }
        catch (error) {
            console.error('Error cleaning up temp files:', error);
        }
    }
    static getFileUrl(filepath) {
        if (!filepath)
            return '';
        const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
        return `${baseUrl}/api/files/${filepath}`;
    }
}
exports.FileUploadService = FileUploadService;
FileUploadService.UPLOAD_DIR = 'uploads';
FileUploadService.MAX_FILE_SIZE = 5 * 1024 * 1024;
FileUploadService.ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
FileUploadService.initializeUploadDirectory();
setInterval(() => {
    FileUploadService.cleanupTempFiles();
}, 60 * 60 * 1000);
//# sourceMappingURL=fileUploadService.js.map