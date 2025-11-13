import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { sendVerificationEmail, sendOTPEmail } from './services/emailService';
import { checkEmailConfig, validateGmailConfig } from './utils/emailValidator';

// Load environment variables
dotenv.config();

async function testEmailService() {
    console.log('🧪 Testing Email Service Configuration...\n');
    
    // Check configuration
    const configCheck = checkEmailConfig();
    console.log('📋 Configuration Check:');
    
    if (configCheck.isValid) {
        console.log('✅ Email configuration is valid\n');
    } else {
        console.log('❌ Email configuration has issues:');
        configCheck.errors.forEach(error => console.log(`   - ${error}`));
        console.log('\n💡 Suggestions:');
        configCheck.suggestions.forEach(suggestion => console.log(`   - ${suggestion}`));
        console.log('');
    }
    
    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log(`USE_RESEND: ${process.env.USE_RESEND}`);
    console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not set'}`);
    console.log(`RESEND_FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL}`);
    console.log(`EMAIL_USER: ${process.env.EMAIL_USER}`);
    console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set'}`);
    console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}\n`);
    
    // Test Gmail configuration if using SMTP
    if (process.env.USE_RESEND !== 'true' && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        console.log('🔐 Testing Gmail SMTP Connection...');
        await validateGmailConfig(process.env.EMAIL_USER, process.env.EMAIL_PASS);
        console.log('');
    }
    
    // Test email sending
    const testEmail = 'test@example.com';
    const testToken = 'test-token-123';
    const testOTP = '123456';
    
    try {
        console.log('📧 Testing Verification Email...');
        await sendVerificationEmail(testEmail, testToken);
        console.log('✅ Verification email test passed\n');
    } catch (error) {
        console.error('❌ Verification email test failed:', error);
        console.error('Error details:', error);
    }
    
    try {
        console.log('📧 Testing OTP Email...');
        await sendOTPEmail(testEmail, testOTP);
        console.log('✅ OTP email test passed\n');
    } catch (error) {
        console.error('❌ OTP email test failed:', error);
        console.error('Error details:', error);
    }
}

// Run the test
testEmailService().catch(error => {
    console.error('❌ Email service test failed:', error);
    process.exit(1);
});
