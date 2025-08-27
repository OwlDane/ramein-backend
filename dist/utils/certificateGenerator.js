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
exports.isValidVerificationCode = exports.isValidCertificateNumber = exports.generateSecureCertificateId = exports.generateVerificationCode = exports.generateCertificateNumber = void 0;
const crypto = __importStar(require("crypto"));
const generateCertificateNumber = () => {
    const year = new Date().getFullYear();
    const randomString = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `CERT-${year}-${randomString}`;
};
exports.generateCertificateNumber = generateCertificateNumber;
const generateVerificationCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};
exports.generateVerificationCode = generateVerificationCode;
const generateSecureCertificateId = () => {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.randomBytes(8).toString('hex');
    return `${timestamp}-${randomBytes}`;
};
exports.generateSecureCertificateId = generateSecureCertificateId;
const isValidCertificateNumber = (certificateNumber) => {
    const pattern = /^CERT-\d{4}-[A-F0-9]{8}$/;
    return pattern.test(certificateNumber);
};
exports.isValidCertificateNumber = isValidCertificateNumber;
const isValidVerificationCode = (code) => {
    const pattern = /^[A-Z0-9]{12}$/;
    return pattern.test(code);
};
exports.isValidVerificationCode = isValidVerificationCode;
//# sourceMappingURL=certificateGenerator.js.map