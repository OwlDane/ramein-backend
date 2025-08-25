import { AppError } from './errorService';
import * as path from 'path';
import * as fs from 'fs';

export interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
}

export class FileUploadService {
    private static readonly UPLOAD_DIR = 'uploads';
    private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    // Initialize upload directory
    static initializeUploadDirectory() {
        const uploadPath = path.join(process.cwd(), this.UPLOAD_DIR);
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        // Create subdirectories
        const subdirs = ['flyers', 'certificates', 'temp'];
        subdirs.forEach(subdir => {
            const subdirPath = path.join(uploadPath, subdir);
            if (!fs.existsSync(subdirPath)) {
                fs.mkdirSync(subdirPath, { recursive: true });
            }
        });
    }

    // Validate file upload
    static validateFile(file: UploadedFile, allowedTypes: string[] = this.ALLOWED_IMAGE_TYPES): void {
        if (!file) {
            throw new AppError('File tidak ditemukan', 400);
        }

        if (file.size > this.MAX_FILE_SIZE) {
            throw new AppError('Ukuran file terlalu besar. Maksimal 5MB', 400);
        }

        if (!allowedTypes.includes(file.mimetype)) {
            throw new AppError('Tipe file tidak didukung', 400);
        }
    }

    // Generate unique filename
    static generateUniqueFilename(originalname: string, prefix: string = ''): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const ext = path.extname(originalname);
        const name = path.basename(originalname, ext);
        
        return `${prefix}${name}_${timestamp}_${random}${ext}`;
    }

    // Save uploaded file
    static async saveFile(file: UploadedFile, subdirectory: string): Promise<string> {
        try {
            const uploadPath = path.join(process.cwd(), this.UPLOAD_DIR, subdirectory);
            const filename = this.generateUniqueFilename(file.originalname, subdirectory === 'flyers' ? 'flyer_' : 'cert_');
            const filepath = path.join(uploadPath, filename);

            // Copy file to destination
            fs.copyFileSync(file.path, filepath);
            
            // Clean up temp file
            fs.unlinkSync(file.path);

            // Return relative path for database storage
            return path.join(this.UPLOAD_DIR, subdirectory, filename);
        } catch (error) {
            console.error('Error saving file:', error);
            throw new AppError('Gagal menyimpan file', 500);
        }
    }

    // Delete file
    static async deleteFile(filepath: string): Promise<void> {
        try {
            const fullPath = path.join(process.cwd(), filepath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            // Don't throw error for file deletion failures
        }
    }

    // Get file info
    static getFileInfo(filepath: string): { exists: boolean; size: number; mimetype: string } {
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
        } catch (error) {
            return { exists: false, size: 0, mimetype: '' };
        }
    }

    // Get MIME type from file extension
    private static getMimeType(extension: string): string {
        const mimeTypes: { [key: string]: string } = {
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

    // Clean up old temporary files
    static cleanupTempFiles(): void {
        try {
            const tempPath = path.join(process.cwd(), this.UPLOAD_DIR, 'temp');
            if (fs.existsSync(tempPath)) {
                const files = fs.readdirSync(tempPath);
                const now = Date.now();
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours

                files.forEach(filename => {
                    const filepath = path.join(tempPath, filename);
                    const stats = fs.statSync(filepath);
                    if (now - stats.mtime.getTime() > maxAge) {
                        fs.unlinkSync(filepath);
                    }
                });
            }
        } catch (error) {
            console.error('Error cleaning up temp files:', error);
        }
    }

    // Get file URL for frontend
    static getFileUrl(filepath: string): string {
        if (!filepath) return '';
        
        const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
        return `${baseUrl}/api/files/${filepath}`;
    }
}

// Initialize upload directory when service is imported
FileUploadService.initializeUploadDirectory();

// Clean up temp files every hour
setInterval(() => {
    FileUploadService.cleanupTempFiles();
}, 60 * 60 * 1000);