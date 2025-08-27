"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOTPExpired = exports.generateOTP = void 0;
const crypto_1 = __importDefault(require("crypto"));
const generateOTP = (length = 6) => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = crypto_1.default.randomInt(0, digits.length);
        otp += digits[randomIndex];
    }
    return otp;
};
exports.generateOTP = generateOTP;
const isOTPExpired = (otpCreatedAt, expiryMinutes = 5) => {
    const expiryTime = new Date(otpCreatedAt);
    expiryTime.setMinutes(expiryTime.getMinutes() + expiryMinutes);
    return new Date() > expiryTime;
};
exports.isOTPExpired = isOTPExpired;
//# sourceMappingURL=otpGenerator.js.map