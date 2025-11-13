import nodemailer from 'nodemailer';

/**
 * Validate Gmail SMTP configuration
 */
export async function validateGmailConfig(email: string, password: string): Promise<boolean> {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: email,
                pass: password,
            },
        });

        // Test the connection
        await transporter.verify();
        console.log('✅ Gmail SMTP configuration is valid');
        return true;
    } catch (error) {
        console.error('❌ Gmail SMTP configuration error:', error);
        
        if (error.code === 'EAUTH') {
            console.error('🔐 Authentication failed. Please check:');
            console.error('   1. Email address is correct');
            console.error('   2. You are using an App Password (not your regular Gmail password)');
            console.error('   3. 2-Factor Authentication is enabled on your Google account');
            console.error('   4. Less secure app access is enabled (if not using App Password)');
            console.error('');
            console.error('📖 How to generate App Password:');
            console.error('   1. Go to https://myaccount.google.com/security');
            console.error('   2. Enable 2-Factor Authentication');
            console.error('   3. Go to App passwords section');
            console.error('   4. Generate a new app password for "Mail"');
            console.error('   5. Use this 16-character password in EMAIL_PASS');
        }
        
        return false;
    }
}

/**
 * Check if email configuration is properly set
 */
export function checkEmailConfig(): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
} {
    const errors: string[] = [];
    const suggestions: string[] = [];
    
    const useResend = process.env.USE_RESEND === 'true';
    
    if (useResend) {
        // Check Resend configuration
        if (!process.env.RESEND_API_KEY) {
            errors.push('RESEND_API_KEY is not set');
            suggestions.push('Get your API key from https://resend.com/api-keys');
        }
        
        if (!process.env.RESEND_FROM_EMAIL) {
            errors.push('RESEND_FROM_EMAIL is not set');
            suggestions.push('Set a verified sender email in Resend dashboard');
        }
    } else {
        // Check Gmail/SMTP configuration
        if (!process.env.EMAIL_USER) {
            errors.push('EMAIL_USER is not set');
            suggestions.push('Set your Gmail address in EMAIL_USER');
        }
        
        if (!process.env.EMAIL_PASS) {
            errors.push('EMAIL_PASS is not set');
            suggestions.push('Generate and set Gmail App Password in EMAIL_PASS');
        }
        
        if (process.env.EMAIL_PASS && process.env.EMAIL_PASS.length < 16) {
            errors.push('EMAIL_PASS appears to be a regular password, not an App Password');
            suggestions.push('Gmail App Passwords are 16 characters long (xxxx xxxx xxxx xxxx)');
        }
    }
    
    if (!process.env.FRONTEND_URL) {
        errors.push('FRONTEND_URL is not set');
        suggestions.push('Set the frontend URL for email links');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        suggestions
    };
}
