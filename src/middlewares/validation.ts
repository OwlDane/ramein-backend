import { Request, Response, NextFunction } from 'express';
import { AppError } from '../services/errorService';

export interface ValidationRule {
    field: string;
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'email' | 'date' | 'array';
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
    custom?: (value: any) => boolean | string;
}

export const validateRequest = (rules: ValidationRule[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        try {
            const errors: string[] = [];
            const body = req.body;

            rules.forEach(rule => {
                const value = body[rule.field];
                const fieldName = rule.field;

                // Check required
                if (rule.required && (value === undefined || value === null || value === '')) {
                    errors.push(`${fieldName} wajib diisi`);
                    return;
                }

                // Skip validation if value is not provided and not required
                if (value === undefined || value === null) {
                    return;
                }

                // Type validation
                if (rule.type) {
                    switch (rule.type) {
                        case 'string':
                            if (typeof value !== 'string') {
                                errors.push(`${fieldName} harus berupa teks`);
                                return;
                            }
                            break;
                        case 'number':
                            if (typeof value !== 'number' || isNaN(value)) {
                                errors.push(`${fieldName} harus berupa angka`);
                                return;
                            }
                            break;
                        case 'boolean':
                            if (typeof value !== 'boolean') {
                                errors.push(`${fieldName} harus berupa boolean`);
                                return;
                            }
                            break;
                        case 'email':
                            if (typeof value !== 'string' || !isValidEmail(value)) {
                                errors.push(`${fieldName} harus berupa email yang valid`);
                                return;
                            }
                            break;
                        case 'date':
                            if (!isValidDate(value)) {
                                errors.push(`${fieldName} harus berupa tanggal yang valid`);
                                return;
                            }
                            break;
                        case 'array':
                            if (!Array.isArray(value)) {
                                errors.push(`${fieldName} harus berupa array`);
                                return;
                            }
                            break;
                    }
                }

                // Length validation for strings
                if (rule.type === 'string' || typeof value === 'string') {
                    if (rule.minLength && value.length < rule.minLength) {
                        errors.push(`${fieldName} minimal ${rule.minLength} karakter`);
                    }
                    if (rule.maxLength && value.length > rule.maxLength) {
                        errors.push(`${fieldName} maksimal ${rule.maxLength} karakter`);
                    }
                }

                // Number range validation
                if (rule.type === 'number' || typeof value === 'number') {
                    if (rule.min !== undefined && value < rule.min) {
                        errors.push(`${fieldName} minimal ${rule.min}`);
                    }
                    if (rule.max !== undefined && value > rule.max) {
                        errors.push(`${fieldName} maksimal ${rule.max}`);
                    }
                }

                // Pattern validation
                if (rule.pattern && typeof value === 'string') {
                    if (!rule.pattern.test(value)) {
                        errors.push(`${fieldName} tidak sesuai dengan format yang ditentukan`);
                    }
                }

                // Enum validation
                if (rule.enum && !rule.enum.includes(value)) {
                    errors.push(`${fieldName} harus salah satu dari: ${rule.enum.join(', ')}`);
                }

                // Custom validation
                if (rule.custom) {
                    const customResult = rule.custom(value);
                    if (customResult !== true) {
                        errors.push(typeof customResult === 'string' ? customResult : `${fieldName} tidak valid`);
                    }
                }
            });

            if (errors.length > 0) {
                throw new AppError('Validasi gagal', 400);
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

// Email validation helper
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Date validation helper
function isValidDate(date: any): boolean {
    if (date instanceof Date) return !isNaN(date.getTime());
    if (typeof date === 'string') {
        const parsed = new Date(date);
        return !isNaN(parsed.getTime());
    }
    return false;
}

// Common validation rules
export const commonValidations = {
    // User registration
    userRegistration: [
        { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 100 },
        { field: 'email', required: true, type: 'email' },
        { field: 'password', required: true, type: 'string', minLength: 8, pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/ },
        { field: 'phone', required: true, type: 'string', minLength: 10, maxLength: 15 },
        { field: 'address', required: true, type: 'string', minLength: 10, maxLength: 500 },
        { field: 'education', required: true, type: 'string', minLength: 2, maxLength: 100 }
    ],

    // Event creation
    eventCreation: [
        { field: 'title', required: true, type: 'string', minLength: 5, maxLength: 200 },
        { field: 'date', required: true, type: 'date' },
        { field: 'time', required: true, type: 'string', pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
        { field: 'location', required: true, type: 'string', minLength: 10, maxLength: 200 },
        { field: 'description', required: true, type: 'string', minLength: 20, maxLength: 1000 }
    ],

    // Login
    login: [
        { field: 'email', required: true, type: 'email' },
        { field: 'password', required: true, type: 'string', minLength: 1 }
    ],

    // Password reset
    passwordReset: [
        { field: 'token', required: true, type: 'string', minLength: 10 },
        { field: 'newPassword', required: true, type: 'string', minLength: 8, pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/ }
    ]
};