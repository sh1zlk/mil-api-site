/**
 * Валідатор полів форм згідно з обмеженнями OpenAPI
 */

// Правила валідації з OpenAPI схем
export const VALIDATION_RULES = {
    user: {
        username: { min: 3, max: 50, required: true },
        username_alias: { min: 1, max: 255, required: true }
    },
    post: {
        name: { min: 1, max: 255, required: true },
        code: { min: 1, max: 50, required: true },
        description: { max: 1000 },
        region: { max: 255 }
    },
    observation: {
        comment: { max: 1000 },
        duration_seconds: { min: 0 }
    },
    role: {
        name: { min: 1, max: 100, required: true },
        display_name: { min: 1, max: 255, required: true },
        description: { max: 500 }
    },
    category: {
        name: { min: 1, max: 255, required: true },
        alias: { min: 1, max: 255, required: true }
    },
    signalType: {
        code: { min: 1, max: 50, required: true },
        name: { min: 1, max: 255, required: true },
        description: { max: 1000 },
        sort_order: { min: 0 }
    }
};

/**
 * Валідація окремого поля
 * @param {string|number} value - Значення для валідації
 * @param {Object} rules - Правила валідації
 * @param {boolean} rules.required - Чи є поле обов'язковим
 * @param {number} rules.min - Мінімальна довжина/значення
 * @param {number} rules.max - Максимальна довжина/значення
 * @param {RegExp} rules.pattern - Регулярний вираз для перевірки
 * @param {string} rules.patternMessage - Повідомлення про помилку pattern
 * @returns {string|null} - Повідомлення про помилку або null якщо валідація пройшла
 */
export const validateField = (value, rules) => {
    // Перевірка обов'язкового поля
    if (rules.required) {
        if (value === undefined || value === null || value === '') {
            return 'Це поле обов\'язкове';
        }
        if (typeof value === 'string' && value.trim().length === 0) {
            return 'Це поле не може бути порожнім';
        }
    }

    // Якщо поле порожнє і не обов'язкове - валідація пройшла
    if (!value && !rules.required) {
        return null;
    }

    // Перевірка мінімальної довжини для рядків
    if (rules.min && typeof value === 'string' && value.length < rules.min) {
        return `Мінімум ${rules.min} символів`;
    }

    // Перевірка мінімального значення для чисел
    if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
        return `Мінімальне значення: ${rules.min}`;
    }

    // Перевірка максимальної довжини для рядків
    if (rules.max && typeof value === 'string' && value.length > rules.max) {
        return `Максимум ${rules.max} символів`;
    }

    // Перевірка максимального значення для чисел
    if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
        return `Максимальне значення: ${rules.max}`;
    }

    // Перевірка регулярного виразу
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        return rules.patternMessage || 'Невірний формат';
    }

    return null;
};

/**
 * Валідація всієї форми
 * @param {Object} formData - Дані форми
 * @param {string} formType - Тип форми (user, post, observation, etc.)
 * @returns {Object} - Об'єкт з помилками { fieldName: errorMessage }
 */
export const validateForm = (formData, formType) => {
    const errors = {};
    const rules = VALIDATION_RULES[formType];

    if (!rules) {
        console.warn(`Немає правил валідації для типу форми: ${formType}`);
        return errors;
    }

    // Валідація кожного поля
    for (const [field, fieldRules] of Object.entries(rules)) {
        const value = formData[field];
        const error = validateField(value, fieldRules);

        if (error) {
            errors[field] = error;
        }
    }

    return errors;
};

/**
 * Перевірка чи форма валідна
 * @param {Object} formData - Дані форми
 * @param {string} formType - Тип форми
 * @returns {boolean} - true якщо форма валідна
 */
export const isFormValid = (formData, formType) => {
    const errors = validateForm(formData, formType);
    return Object.keys(errors).length === 0;
};

/**
 * Обрізання рядка до максимальної довжини
 * @param {string} value - Рядок для обрізання
 * @param {number} maxLength - Максимальна довжина
 * @returns {string} - Обрізаний рядок
 */
export const truncateString = (value, maxLength) => {
    if (!value || typeof value !== 'string') return value;
    return value.substring(0, maxLength);
};

/**
 * Санітізація даних форми згідно з правилами
 * @param {Object} formData - Дані форми
 * @param {string} formType - Тип форми
 * @returns {Object} - Санітізовані дані
 */
export const sanitizeFormData = (formData, formType) => {
    const rules = VALIDATION_RULES[formType];
    if (!rules) return formData;

    const sanitized = { ...formData };

    for (const [field, fieldRules] of Object.entries(rules)) {
        const value = sanitized[field];

        // Обрізання рядків до максимальної довжини
        if (fieldRules.max && typeof value === 'string') {
            sanitized[field] = truncateString(value, fieldRules.max);
        }

        // Очищення числових полів
        if (fieldRules.min !== undefined && typeof value === 'number') {
            if (value < fieldRules.min) {
                sanitized[field] = fieldRules.min;
            }
        }
    }

    return sanitized;
};

/**
 * Хелпер для валідації окремих полів з миттєвим відображенням помилок
 * Використовується в onChange обробниках
 */
export const createFieldValidator = (formType) => {
    const rules = VALIDATION_RULES[formType];

    return (fieldName, value) => {
        const fieldRules = rules?.[fieldName];
        if (!fieldRules) return null;

        return validateField(value, fieldRules);
    };
};

// Експорт всього разом для зручності
export default {
    VALIDATION_RULES,
    validateField,
    validateForm,
    isFormValid,
    truncateString,
    sanitizeFormData,
    createFieldValidator
};
