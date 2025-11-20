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
require("reflect-metadata");
const dotenv = __importStar(require("dotenv"));
const emailService_1 = require("./services/emailService");
const emailValidator_1 = require("./utils/emailValidator");
dotenv.config();
async function testEmailService() {
    console.log('🧪 Testing Email Service Configuration...\n');
    const configCheck = (0, emailValidator_1.checkEmailConfig)();
    console.log('📋 Configuration Check:');
    if (configCheck.isValid) {
        console.log('✅ Email configuration is valid\n');
    }
    else {
        console.log('❌ Email configuration has issues:');
        configCheck.errors.forEach(error => console.log(`   - ${error}`));
        console.log('\n💡 Suggestions:');
        configCheck.suggestions.forEach(suggestion => console.log(`   - ${suggestion}`));
        console.log('');
    }
    console.log('📋 Environment Variables:');
    console.log(`USE_RESEND: ${process.env.USE_RESEND}`);
    console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not set'}`);
    console.log(`RESEND_FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL}`);
    console.log(`EMAIL_USER: ${process.env.EMAIL_USER}`);
    console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set'}`);
    console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}\n`);
    if (process.env.USE_RESEND !== 'true' && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        console.log('🔐 Testing Gmail SMTP Connection...');
        await (0, emailValidator_1.validateGmailConfig)(process.env.EMAIL_USER, process.env.EMAIL_PASS);
        console.log('');
    }
    const testEmail = 'test@example.com';
    const testToken = 'test-token-123';
    const testOTP = '123456';
    try {
        console.log('📧 Testing Verification Email...');
        await (0, emailService_1.sendVerificationEmail)(testEmail, testToken);
        console.log('✅ Verification email test passed\n');
    }
    catch (error) {
        console.error('❌ Verification email test failed:', error);
        console.error('Error details:', error);
    }
    try {
        console.log('📧 Testing OTP Email...');
        await (0, emailService_1.sendOTPEmail)(testEmail, testOTP);
        console.log('✅ OTP email test passed\n');
    }
    catch (error) {
        console.error('❌ OTP email test failed:', error);
        console.error('Error details:', error);
    }
}
testEmailService().catch(error => {
    console.error('❌ Email service test failed:', error);
    process.exit(1);
});
//# sourceMappingURL=test-email-service.js.map