// src/utils/certificateGenerator.ts
import * as crypto from 'crypto';

/**
 * Generate a unique certificate number
 * Format: CERT-YYYY-XXXXXXXX (e.g., CERT-2025-A1B2C3D4)
 */
export const generateCertificateNumber = (): string => {
    const year = new Date().getFullYear();
    const randomString = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `CERT-${year}-${randomString}`;
};

/**
 * Generate a verification code for certificate validation
 * 12-character alphanumeric code
 */
export const generateVerificationCode = (): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < 12; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
};

/**
 * Generate a secure certificate ID using timestamp and random bytes
 */
export const generateSecureCertificateId = (): string => {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.randomBytes(8).toString('hex');
    return `${timestamp}-${randomBytes}`;
};

/**
 * Validate certificate number format
 */
export const isValidCertificateNumber = (certificateNumber: string): boolean => {
    const pattern = /^CERT-\d{4}-[A-F0-9]{8}$/;
    return pattern.test(certificateNumber);
};

/**
 * Validate verification code format
 */
export const isValidVerificationCode = (code: string): boolean => {
    const pattern = /^[A-Z0-9]{12}$/;
    return pattern.test(code);
};