// utils/tokenGenerator.ts
import * as crypto from 'crypto';

/**
 * Generate a random token with specified length
 * @param length - Length of the token (default: 8)
 * @returns Random alphanumeric token
 */
export const generateToken = (length: number = 8): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
};

/**
 * Generate a secure random token using crypto
 * @param length - Length of the token in bytes (default: 16)
 * @returns Hexadecimal token
 */
export const generateSecureToken = (length: number = 16): string => {
    return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a numeric token (useful for OTP)
 * @param length - Length of the numeric token (default: 6)
 * @returns Numeric token as string
 */
export const generateNumericToken = (length: number = 6): string => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

/**
 * Generate attendance token with specific format
 * Combines letters and numbers for better readability
 * @param length - Length of the token (default: 8)
 * @returns Formatted attendance token
 */
export const generateAttendanceToken = (length: number = 8): string => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let result = '';
    
    // Ensure at least one letter and one number
    result += letters.charAt(Math.floor(Math.random() * letters.length));
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    
    // Fill the rest randomly
    const allChars = letters + numbers;
    for (let i = 2; i < length; i++) {
        result += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Shuffle the result
    return result.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Validate token format (alphanumeric)
 * @param token - Token to validate
 * @returns Boolean indicating if token is valid format
 */
export const isValidTokenFormat = (token: string): boolean => {
    return /^[A-Z0-9]+$/.test(token);
};