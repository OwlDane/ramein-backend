import { Router } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { auth } from '../middlewares/auth';

const router = Router();

// Serve uploaded files
router.get('/:filepath', (req, res) => {
    try {
        const { filepath } = req.params;

        // Security: Prevent directory traversal
        if (filepath.includes('..') || filepath.includes('//')) {
            return res.status(400).json({ message: 'Invalid file path' });
        }

        const fullPath = path.join(process.cwd(), 'uploads', filepath);

        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ message: 'File tidak ditemukan' });
        }

        // Get file stats
        const stats = fs.statSync(fullPath);

        // Set appropriate headers
        const ext = path.extname(fullPath).toLowerCase();
        let contentType = 'application/octet-stream';

        switch (ext) {
            case '.jpg':
            case '.jpeg':
                contentType = 'image/jpeg';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.gif':
                contentType = 'image/gif';
                break;
            case '.pdf':
                contentType = 'application/pdf';
                break;
            case '.doc':
                contentType = 'application/msword';
                break;
            case '.docx':
                contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                break;
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

        // Stream the file
        const fileStream = fs.createReadStream(fullPath);
        return fileStream.pipe(res);

    } catch (error) {
        console.error('Error serving file:', error);
        return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil file' });
    }
});

// Protected route for admin to delete files
router.delete('/:filepath', auth, (req, res) => {
    try {
        const { filepath } = req.params;

        // Security: Prevent directory traversal
        if (filepath.includes('..') || filepath.includes('//')) {
            return res.status(400).json({ message: 'Invalid file path' });
        }

        const fullPath = path.join(process.cwd(), 'uploads', filepath);

        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ message: 'File tidak ditemukan' });
        }

        // Delete file
        fs.unlinkSync(fullPath);

        return res.json({ message: 'File berhasil dihapus' });

    } catch (error) {
        console.error('Error deleting file:', error);
        return res.status(500).json({ message: 'Terjadi kesalahan saat menghapus file' });
    }
});

export default router;