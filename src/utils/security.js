// Утиліти для забезпечення безпеки додатку

// Конфігурація безпеки
export const SECURITY_CONFIG = {
    // Максимальна кількість спроб входу
    MAX_LOGIN_ATTEMPTS: 5,
    // Час блокування в мілісекундах (15 хвилин)
    LOCKOUT_DURATION: 15 * 60 * 1000,
    // Максимальний розмір файлу для завантаження (100MB)
    MAX_FILE_SIZE: 100 * 1024 * 1024,
    // Дозволені типи файлів
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'application/pdf'],
    // Максимальна довжина пароля (для майбутніх розширень)
    MAX_PASSWORD_LENGTH: 128,
    // Мінімальна довжина пароля
    MIN_PASSWORD_LENGTH: 8,
    // Час життя сесії в мілісекундах (15 хвилин)
    SESSION_TIMEOUT: 15 * 60 * 1000,
    // Час життя refresh токена (7 днів)
    REFRESH_TOKEN_LIFETIME: 7 * 24 * 60 * 60 * 1000
};

// Валідація даних сертифіката
export const validateCertificateData = (certificateData) => {
    const errors = [];

    if (!certificateData) {
        errors.push('Certificate data is required');
        return { isValid: false, errors };
    }

    const { certificate_cn, certificate_serial, certificate_fingerprint } = certificateData;

    // Перевірка Common Name
    if (!certificate_cn || typeof certificate_cn !== 'string') {
        errors.push('Certificate Common Name (CN) is required and must be a string');
    } else if (certificate_cn.length > 255) {
        errors.push('Certificate Common Name is too long (max 255 characters)');
    } else if (!/^[a-zA-Z0-9@._-]+$/.test(certificate_cn)) {
        errors.push('Certificate Common Name contains invalid characters');
    }

    // Перевірка серійного номера
    if (!certificate_serial || typeof certificate_serial !== 'string') {
        errors.push('Certificate serial number is required and must be a string');
    } else if (certificate_serial.length > 255) {
        errors.push('Certificate serial number is too long (max 255 characters)');
    } else if (!/^[a-fA-F0-9]+$/.test(certificate_serial.replace(/[:-]/g, ''))) {
        errors.push('Certificate serial number must be a valid hexadecimal value');
    }

    // Перевірка відбитка
    if (!certificate_fingerprint || typeof certificate_fingerprint !== 'string') {
        errors.push('Certificate fingerprint is required and must be a string');
    } else if (certificate_fingerprint.length > 512) {
        errors.push('Certificate fingerprint is too long (max 512 characters)');
    } else if (!/^[a-fA-F0-9]+$/.test(certificate_fingerprint.replace(/[:-]/g, ''))) {
        errors.push('Certificate fingerprint must be a valid hexadecimal value');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Очищення даних перед відправкою на сервер
export const sanitizeData = (data) => {
    if (!data || typeof data !== 'object') {
        return data;
    }

    const sanitized = { ...data };

    // Видаляємо потенційно небезпечні поля
    const dangerousFields = ['password', 'token', 'secret', 'key'];
    dangerousFields.forEach(field => {
        if (field in sanitized) {
            delete sanitized[field];
        }
    });

    // Очищення рядкових полів
    Object.keys(sanitized).forEach(key => {
        if (typeof sanitized[key] === 'string') {
            // Видаляємо потенційно небезпечні символи
            sanitized[key] = sanitized[key]
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // XSS
                .replace(/javascript:/gi, '') // JavaScript protocol
                .replace(/on\w+\s*=/gi, ''); // Event handlers
        }
    });

    return sanitized;
};

// Перевірка безпеки файлу
export const validateFile = (file) => {
    const errors = [];

    if (!file) {
        errors.push('No file provided');
        return { isValid: false, errors };
    }

    // Перевірка розміру файлу
    if (file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
        errors.push(`File size exceeds maximum allowed size (${SECURITY_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB)`);
    }

    // Перевірка типу файлу
    if (!SECURITY_CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.push(`File type ${file.type} is not allowed`);
    }

    // Перевірка імені файлу
    if (!/^[a-zA-Z0-9._-]+$/.test(file.name)) {
        errors.push('File name contains invalid characters');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Створення безпечного хешу для сесії
export const createSessionHash = (userId, timestamp) => {
    const data = `${userId}:${timestamp}:${Math.random()}`;
    // В реальному додатку тут буде криптографічний хеш
    return btoa(data).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
};

// Перевірка сесії
export const validateSession = (sessionData) => {
    if (!sessionData) {
        return false;
    }

    const { timestamp, userId, hash } = sessionData;
    const now = Date.now();

    // Перевірка часу життя сесії
    if (now - timestamp > SECURITY_CONFIG.SESSION_TIMEOUT) {
        return false;
    }

    // Перевірка хеша
    const expectedHash = createSessionHash(userId, timestamp);
    return hash === expectedHash;
};

// Захист від CSRF атак
export const getCSRFToken = () => {
    // В реальному додатку CSRF токен буде отримуватись від сервера
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    return token || localStorage.getItem('csrf_token');
};

// Додавання CSRF токена до запитів
export const addCSRFHeader = (headers = {}) => {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
    }
    return headers;
};

// Безпечне створення URL
export const createSecureURL = (base, params = {}) => {
    const url = new URL(base, window.location.origin);

    // Додаємо параметри з валідацією
    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            // Очищуємо значення перед додаванням до URL
            const cleanValue = String(value).replace(/[<>"'&]/g, '');
            url.searchParams.set(key, cleanValue);
        }
    });

    return url.toString();
};

// Детекція підозрілої активності
export class SecurityMonitor {
    constructor() {
        this.failedAttempts = 0;
        this.lastAttempt = null;
        this.suspiciousPatterns = new Set();
    }

    // Реєстрація невдалої спроби входу
    recordFailedAttempt() {
        this.failedAttempts++;
        this.lastAttempt = Date.now();

        // Якщо забагато невдалих спроб, блокуємо на час
        if (this.failedAttempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
            this.lockout();
        }
    }

    // Перевірка, чи заблокований користувач
    isLocked() {
        if (!this.lastAttempt) return false;

        const timeSinceLastAttempt = Date.now() - this.lastAttempt;
        return timeSinceLastAttempt < SECURITY_CONFIG.LOCKOUT_DURATION;
    }

    // Блокування користувача
    lockout() {
        this.lastAttempt = Date.now();
    }

    // Скидання лічильника при успішному вході
    reset() {
        this.failedAttempts = 0;
        this.lastAttempt = null;
    }

    // Реєстрація підозрілої активності
    recordSuspiciousActivity(pattern) {
        this.suspiciousPatterns.add(pattern);
        console.warn('Suspicious activity detected:', pattern);
    }

    // Отримання звіту про безпеку
    getSecurityReport() {
        return {
            failedAttempts: this.failedAttempts,
            isLocked: this.isLocked(),
            suspiciousPatterns: Array.from(this.suspiciousPatterns),
            lastAttempt: this.lastAttempt
        };
    }
}

// Глобальний монітор безпеки
export const securityMonitor = new SecurityMonitor();

// Валідація JWT токена
export const validateJWTToken = (token) => {
    if (!token || typeof token !== 'string') {
        return false;
    }

    try {
        // Базова перевірка структури JWT
        const parts = token.split('.');
        if (parts.length !== 3) {
            return false;
        }

        // Декодуємо payload (без криптографічної перевірки)
        const payload = JSON.parse(atob(parts[1]));

        // Перевіряємо час життя токена
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            return false;
        }

        return true;
    } catch (error) {
        console.error('JWT validation error:', error);
        return false;
    }
};

// Очищення конфіденційних даних з пам'яті
export const clearSensitiveData = () => {
    // Очищення localStorage та sessionStorage
    const sensitiveKeys = [
        'mil_access_token',
        'mil_refresh_token',
        'user_data',
        'certificate_data',
        'csrf_token'
    ];

    sensitiveKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });

    // Очищення можливих глобальних змінних
    if (window.userCredentials) {
        delete window.userCredentials;
    }
};

// Ініціалізація заходів безпеки
export const initializeSecurity = () => {
    // Встановлюємо callback для обробки помилок автентифікації
    window.onAuthFailure = () => {
        clearSensitiveData();
        // Перенаправлення на сторінку входу буде оброблено через AuthContext
    };

    // Додаємо обробник для очищення даних при закритті вікна
    window.addEventListener('beforeunload', () => {
        // Очищуємо тільки найбільш чутливі дані
        sessionStorage.removeItem('mil_refresh_token');
    });

    // Перевіряємо наявність https
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        console.warn('Warning: Application is not running over HTTPS');
    }
};

export default {
    SECURITY_CONFIG,
    validateCertificateData,
    sanitizeData,
    validateFile,
    createSessionHash,
    validateSession,
    getCSRFToken,
    addCSRFHeader,
    createSecureURL,
    SecurityMonitor,
    securityMonitor,
    validateJWTToken,
    clearSensitiveData,
    initializeSecurity
};