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
exports.isValidTokenFormat = exports.generateAttendanceToken = exports.generateNumericToken = exports.generateSecureToken = exports.generateToken = void 0;
const crypto = __importStar(require("crypto"));
const generateToken = (length = 8) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};
exports.generateToken = generateToken;
const generateSecureToken = (length = 16) => {
    return crypto.randomBytes(length).toString('hex');
};
exports.generateSecureToken = generateSecureToken;
const generateNumericToken = (length = 6) => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
};
exports.generateNumericToken = generateNumericToken;
const generateAttendanceToken = (length = 8) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let result = '';
    result += letters.charAt(Math.floor(Math.random() * letters.length));
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    const allChars = letters + numbers;
    for (let i = 2; i < length; i++) {
        result += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    return result.split('').sort(() => Math.random() - 0.5).join('');
};
exports.generateAttendanceToken = generateAttendanceToken;
const isValidTokenFormat = (token) => {
    return /^[A-Z0-9]+$/.test(token);
};
exports.isValidTokenFormat = isValidTokenFormat;
//# sourceMappingURL=tokenGenerator.js.map