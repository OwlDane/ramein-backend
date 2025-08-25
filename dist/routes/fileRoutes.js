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
const express_1 = require("express");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/:filepath', (req, res) => {
    try {
        const { filepath } = req.params;
        if (filepath.includes('..') || filepath.includes('//')) {
            return res.status(400).json({ message: 'Invalid file path' });
        }
        const fullPath = path.join(process.cwd(), 'uploads', filepath);
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ message: 'File tidak ditemukan' });
        }
        const stats = fs.statSync(fullPath);
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
        res.setHeader('Cache-Control', 'public, max-age=3600');
        const fileStream = fs.createReadStream(fullPath);
        return fileStream.pipe(res);
    }
    catch (error) {
        console.error('Error serving file:', error);
        return res.status(500).json({ message: 'Terjadi kesalahan saat mengambil file' });
    }
});
router.delete('/:filepath', auth_1.auth, (req, res) => {
    try {
        const { filepath } = req.params;
        if (filepath.includes('..') || filepath.includes('//')) {
            return res.status(400).json({ message: 'Invalid file path' });
        }
        const fullPath = path.join(process.cwd(), 'uploads', filepath);
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ message: 'File tidak ditemukan' });
        }
        fs.unlinkSync(fullPath);
        return res.json({ message: 'File berhasil dihapus' });
    }
    catch (error) {
        console.error('Error deleting file:', error);
        return res.status(500).json({ message: 'Terjadi kesalahan saat menghapus file' });
    }
});
exports.default = router;
//# sourceMappingURL=fileRoutes.js.map