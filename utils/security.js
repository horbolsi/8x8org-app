const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

class SecurityService {
    constructor() {
        this.encryptionKey = process.env.ENCRYPTION_KEY || '8x8org_32_char_encryption_key_2024!!';
        this.ivLength = 16;
        this.jwtSecret = process.env.JWT_SECRET || '8x8org_telegram_ecosystem_jwt_secret_2024_change_me';
        this.jwtExpiry = '7d';
    }

    // ========== ACCOUNT NUMBER GENERATION ==========
    generateAccountNumber(telegramId) {
        try {
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const accountNumber = `8x8org-${telegramId}-${timestamp}${random}`;
            
            logger.debug(`Generated account number: ${accountNumber}`, {
                telegram_id: telegramId,
                timestamp: timestamp
            });
            
            return accountNumber;
        } catch (error) {
            logger.error('Account number generation failed:', error);
            // Fallback
            return `8x8org-${telegramId}-${Date.now()}`;
        }
    }

    generateDigitalId(telegramId) {
        try {
            const hash = crypto.createHash('sha256')
                .update(`${telegramId}-${Date.now()}-${process.env.SESSION_SECRET}`)
                .digest('hex')
                .slice(0, 16);
            
            const digitalId = `8x8-${hash}`;
            
            logger.debug(`Generated digital ID: ${digitalId}`, {
                telegram_id: telegramId
            });
            
            return digitalId;
        } catch (error) {
            logger.error('Digital ID generation failed:', error);
            return `8x8-${telegramId}-${Date.now().toString(36)}`;
        }
    }

    generateReferralCode(telegramId) {
        const timestamp = Date.now().toString(36).slice(-4);
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `REF${telegramId.toString().slice(-3)}${timestamp}${random}`.slice(0, 20);
    }

    // ========== ENCRYPTION ==========
    encrypt(text) {
        try {
            if (!text) return text;
            
            const iv = crypto.randomBytes(this.ivLength);
            const cipher = crypto.createCipheriv('aes-256-cbc', 
                Buffer.from(this.encryptionKey.padEnd(32, '0').slice(0, 32)), iv);
            
            let encrypted = cipher.update(text);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            
            return iv.toString('hex') + ':' + encrypted.toString('hex');
        } catch (error) {
            logger.error('Encryption failed:', error);
            throw new Error('Encryption failed');
        }
    }

    decrypt(encryptedText) {
        try {
            if (!encryptedText || typeof encryptedText !== 'string') {
                return encryptedText;
            }
            
            const parts = encryptedText.split(':');
            if (parts.length !== 2) {
                throw new Error('Invalid encrypted text format');
            }
            
            const iv = Buffer.from(parts[0], 'hex');
            const encrypted = Buffer.from(parts[1], 'hex');
            
            const decipher = crypto.createDecipheriv('aes-256-cbc',
                Buffer.from(this.encryptionKey.padEnd(32, '0').slice(0, 32)), iv);
            
            let decrypted = decipher.update(encrypted);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            
            return decrypted.toString();
        } catch (error) {
            logger.error('Decryption failed:', error);
            throw new Error('Decryption failed');
        }
    }

    // ========== PASSWORD HASHING ==========
    async hashPassword(password) {
        try {
            if (!password || password.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }
            
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            
            return hash;
        } catch (error) {
            logger.error('Password hashing failed:', error);
            throw error;
        }
    }

    async verifyPassword(password, hash) {
        try {
            if (!password || !hash) {
                return false;
            }
            
            return await bcrypt.compare(password, hash);
        } catch (error) {
            logger.error('Password verification failed:', error);
            return false;
        }
    }

    // ========== JWT TOKENS ==========
    generateToken(payload) {
        try {
            if (!payload || typeof payload !== 'object') {
                throw new Error('Invalid token payload');
            }
            
            const token = jwt.sign(payload, this.jwtSecret, {
                expiresIn: this.jwtExpiry,
                issuer: '8x8org-telegram-ecosystem',
                audience: 'telegram-bots'
            });
            
            logger.debug('JWT token generated', { 
                payload_keys: Object.keys(payload),
                expires_in: this.jwtExpiry
            });
            
            return token;
        } catch (error) {
            logger.error('Token generation failed:', error);
            throw error;
        }
    }

    verifyToken(token) {
        try {
            if (!token) {
                throw new Error('No token provided');
            }
            
            const decoded = jwt.verify(token, this.jwtSecret, {
                issuer: '8x8org-telegram-ecosystem',
                audience: 'telegram-bots'
            });
            
            logger.debug('JWT token verified', { 
                decoded_keys: Object.keys(decoded),
                expires_at: new Date(decoded.exp * 1000).toISOString()
            });
            
            return decoded;
        } catch (error) {
            logger.error('Token verification failed:', error);
            throw error;
        }
    }

    // ========== VERIFICATION CODES ==========
    generateVerificationCode(length = 6) {
        const chars = '0123456789';
        let code = '';
        
        for (let i = 0; i < length; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        
        return code;
    }

    generateApiKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    // ========== VALIDATION ==========
    validateTelegramId(id) {
        if (!id) return false;
        const idStr = id.toString();
        return /^\d+$/.test(idStr) && idStr.length >= 5 && idStr.length <= 15;
    }

    validateEmail(email) {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 255;
    }

    validateUsername(username) {
        if (!username) return false;
        const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
        return usernameRegex.test(username);
    }

    validateAccountNumber(accountNumber) {
        if (!accountNumber) return false;
        const regex = /^8x8org-\d+-\d{9}$/;
        return regex.test(accountNumber) && accountNumber.length <= 50;
    }

    // ========== SANITIZATION ==========
    sanitizeInput(input) {
        if (input === null || input === undefined) {
            return '';
        }
        
        if (typeof input !== 'string') {
            input = String(input);
        }
        
        // Remove potentially dangerous characters
        return input
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/[\\"']/g, '') // Remove backslashes and quotes
            .trim()
            .substring(0, 1000); // Limit length
    }

    sanitizeJsonInput(obj) {
        if (!obj || typeof obj !== 'object') {
            return {};
        }
        
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeInput(value);
            } else {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    }

    // ========== HASHING ==========
    generateHash(data) {
        if (!data) return '';
        
        const dataString = typeof data === 'object' 
            ? JSON.stringify(data) 
            : String(data);
            
        return crypto.createHash('sha256')
            .update(dataString + this.encryptionKey)
            .digest('hex');
    }

    // ========== RATE LIMITING HELPERS ==========
    generateRateLimitKey(userId, action) {
        return `ratelimit:${userId}:${action}:${Math.floor(Date.now() / 60000)}`; // Per minute
    }

    // ========== FILE SECURITY ==========
    validateFileName(filename) {
        if (!filename) return false;
        
        // Prevent directory traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return false;
        }
        
        // Allow only safe characters
        const safeRegex = /^[a-zA-Z0-9_\-\.]+$/;
        return safeRegex.test(filename) && filename.length <= 255;
    }

    generateSafeFileName(originalName) {
        if (!originalName) {
            return `file_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        }
        
        // Extract extension
        const ext = originalName.split('.').pop() || '';
        
        // Generate safe name
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 10);
        const safeName = originalName
            .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_|_$/g, '')
            .substring(0, 100);
            
        return `${safeName}_${timestamp}_${random}.${ext}`.toLowerCase();
    }

    // ========== PERMISSION CHECKING ==========
    checkPermission(userRole, requiredRole) {
        const roleHierarchy = {
            'user': 0,
            'mod': 1,
            'admin': 2,
            'owner': 3
        };
        
        const userLevel = roleHierarchy[userRole] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;
        
        return userLevel >= requiredLevel;
    }

    // ========== AUDIT LOGGING ==========
    createAuditData(userId, action, entityType = null, entityId = null, changes = {}) {
        return {
            user_id: userId,
            action: action,
            entity_type: entityType,
            entity_id: entityId,
            old_values: changes.old || null,
            new_values: changes.new || null,
            timestamp: new Date().toISOString(),
            ip_address: null, // Would be set from request context
            user_agent: null  // Would be set from request context
        };
    }
}

// Create singleton instance
const securityService = new SecurityService();

// Test the service
logger.debug('Security service initialized');

module.exports = securityService;
