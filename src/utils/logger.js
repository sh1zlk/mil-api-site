// Conditional logger для production
const isDevelopment = process.env.NODE_ENV === 'development' ||
                      process.env.REACT_APP_IS_DEVELOPMENT === 'true';

/**
 * Logger який працює тільки в development режимі
 */
export const logger = {
    log: (...args) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },

    warn: (...args) => {
        if (isDevelopment) {
            console.warn(...args);
        }
    },

    // Помилки логуємо завжди, але можна налаштувати
    error: (...args) => {
        console.error(...args);
    },

    info: (...args) => {
        if (isDevelopment) {
            console.info(...args);
        }
    },

    debug: (...args) => {
        if (isDevelopment && process.env.REACT_APP_SHOW_DEBUG_INFO === 'true') {
            console.debug(...args);
        }
    }
};

export default logger;
