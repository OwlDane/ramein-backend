// src/utils/otpGenerator.ts
import crypto from 'crypto';

export const generateOTP = (length = 6): string => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, digits.length);
        otp += digits[randomIndex];
    }
    return otp;
};

export const isOTPExpired = (otpCreatedAt: Date, expiryMinutes = 5): boolean => {
    const expiryTime = new Date(otpCreatedAt);
    expiryTime.setMinutes(expiryTime.getMinutes() + expiryMinutes);
    return new Date() > expiryTime;
};