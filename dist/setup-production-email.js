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
dotenv.config();
async function setupProductionEmail() {
    console.log('🚀 Setting up Production Email Service...\n');
    console.log('📋 Current Configuration:');
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`USE_RESEND: ${process.env.USE_RESEND}`);
    console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not set'}`);
    console.log(`RESEND_FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL}`);
    console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL}\n`);
    if (process.env.NODE_ENV !== 'production') {
        console.log('⚠️  This script is designed for production environment.');
        console.log('Current environment:', process.env.NODE_ENV);
        console.log('\nFor development, use Gmail SMTP with App Password.\n');
    }
    if (process.env.USE_RESEND === 'true') {
        console.log('✅ Resend is enabled');
        if (!process.env.RESEND_API_KEY) {
            console.error('❌ RESEND_API_KEY is not set!');
            console.log('\n📖 How to get Resend API Key:');
            console.log('1. Sign up at https://resend.com');
            console.log('2. Go to API Keys section');
            console.log('3. Create a new API key');
            console.log('4. Set RESEND_API_KEY environment variable');
            return;
        }
        if (!process.env.RESEND_FROM_EMAIL) {
            console.error('❌ RESEND_FROM_EMAIL is not set!');
            console.log('\n📖 How to set sender email:');
            console.log('1. Verify your domain in Resend dashboard');
            console.log('2. Set RESEND_FROM_EMAIL to verified email (e.g., noreply@yourdomain.com)');
            console.log('3. Or use default: onboarding@resend.dev (for testing only)');
            return;
        }
        try {
            const { Resend } = await Promise.resolve().then(() => __importStar(require('resend')));
            const resend = new Resend(process.env.RESEND_API_KEY);
            console.log('🧪 Testing Resend API...');
            await resend.domains.list();
            console.log('✅ Resend API connection successful');
            console.log(`📊 Resend API is working properly`);
        }
        catch (error) {
            console.error('❌ Resend API test failed:', error);
            console.log('\n💡 Possible issues:');
            console.log('- Invalid API key');
            console.log('- Network connectivity issues');
            console.log('- Resend service temporarily unavailable');
            return;
        }
    }
    else {
        console.log('⚠️  Resend is disabled. Using fallback SMTP.');
        console.log('For production, it\'s recommended to use Resend for better deliverability.');
    }
    if (!process.env.FRONTEND_URL) {
        console.error('❌ FRONTEND_URL is not set!');
        console.log('Set FRONTEND_URL to your frontend domain (e.g., https://yourdomain.com)');
        return;
    }
    if (!process.env.FRONTEND_URL.startsWith('https://')) {
        console.warn('⚠️  FRONTEND_URL should use HTTPS in production');
    }
    console.log('\n🎉 Production email service is properly configured!');
    console.log('\n📧 Email endpoints available:');
    console.log('- POST /api/auth/register (sends verification email)');
    console.log('- POST /api/auth/request-verification (resend verification)');
    console.log('- GET /api/auth/verify-email/:token (verify email)');
    console.log('- POST /api/auth/request-reset-password (password reset)');
    console.log('\n🔗 Verification URL format:');
    console.log(`${process.env.FRONTEND_URL}/verify-email?token=<verification_token>`);
}
setupProductionEmail().catch(error => {
    console.error('❌ Production email setup failed:', error);
    process.exit(1);
});
//# sourceMappingURL=setup-production-email.js.map