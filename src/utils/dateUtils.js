/**
 * Утиліти для роботи з датами в українському часовому поясі
 * Всі дати відображаються відносно Europe/Kyiv
 */

const UKRAINE_TIMEZONE = 'Europe/Kyiv';

/**
 * Нормалізує дату з API (додає Z якщо відсутній часовий пояс)
 * API повертає дати в UTC, але без Z на кінці
 * @param {string|Date} dateString - дата для нормалізації
 * @returns {Date} нормалізована дата
 */
export const normalizeApiDate = (dateString) => {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString;

    let str = String(dateString).trim();

    // Якщо дата вже має часовий пояс (Z або +/- offset), парсимо як є
    if (str.includes('Z') || str.match(/[+-]\d{2}(:\d{2})?$/)) {
        return new Date(str);
    }

    // Замінюємо пробіл на T якщо є (деякі API повертають "2026-02-09 18:51:04")
    str = str.replace(' ', 'T');

    // Завжди додаємо Z для інтерпретації як UTC
    // API повертає час в UTC без явного позначення
    return new Date(str + 'Z');
};

/**
 * Форматує дату в українському часовому поясі
 * @param {string|Date} dateString - дата для форматування
 * @param {Object} options - опції форматування (Intl.DateTimeFormat options)
 * @returns {string} відформатована дата
 */
export const formatDateUA = (dateString, options = {}) => {
    if (!dateString) return 'Невідома дата';

    try {
        const date = normalizeApiDate(dateString);
        if (!date || isNaN(date.getTime())) return 'Невідома дата';

        const defaultOptions = {
            timeZone: UKRAINE_TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            ...options
        };

        return date.toLocaleString('uk-UA', defaultOptions);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Невідома дата';
    }
};

/**
 * Форматує тільки дату (без часу) в українському часовому поясі
 * @param {string|Date} dateString - дата для форматування
 * @returns {string} відформатована дата
 */
export const formatDateOnlyUA = (dateString) => {
    if (!dateString) return 'Невідома дата';

    try {
        const date = normalizeApiDate(dateString);
        if (!date || isNaN(date.getTime())) return 'Невідома дата';

        return date.toLocaleDateString('uk-UA', {
            timeZone: UKRAINE_TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Невідома дата';
    }
};

/**
 * Форматує тільки час в українському часовому поясі
 * @param {string|Date} dateString - дата для форматування
 * @returns {string} відформатований час
 */
export const formatTimeOnlyUA = (dateString) => {
    if (!dateString) return 'Невідомий час';

    try {
        const date = normalizeApiDate(dateString);
        if (!date || isNaN(date.getTime())) return 'Невідомий час';

        return date.toLocaleTimeString('uk-UA', {
            timeZone: UKRAINE_TIMEZONE,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting time:', error);
        return 'Невідомий час';
    }
};

/**
 * Отримує поточний час в українському часовому поясі
 * @returns {Date} поточна дата/час
 */
export const getCurrentTimeUA = () => {
    return new Date();
};

/**
 * Форматує поточний час для відображення в українському часовому поясі
 * @returns {string} відформатований поточний час
 */
export const formatCurrentTimeUA = () => {
    return new Date().toLocaleString('uk-UA', {
        timeZone: UKRAINE_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

/**
 * Отримує початок сьогоднішнього дня в українському часовому поясі
 * @returns {Date} початок дня
 */
export const getTodayStartUA = () => {
    const now = new Date();
    const ukraineTime = new Date(now.toLocaleString('en-US', { timeZone: UKRAINE_TIMEZONE }));
    ukraineTime.setHours(0, 0, 0, 0);
    return ukraineTime;
};

/**
 * Форматує дату для input[type="datetime-local"] в українському часовому поясі
 * @returns {string} дата у форматі YYYY-MM-DDTHH:MM:SS
 */
export const getUkrainianTimeForInput = () => {
    return new Date().toLocaleString('sv-SE', {
        timeZone: UKRAINE_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).replace(' ', 'T');
};

/**
 * Конвертує локальний український час (з datetime-local input) в UTC для відправки на сервер
 * @param {string} localDateString - дата у форматі YYYY-MM-DDTHH:MM:SS (український час)
 * @returns {string} дата в UTC форматі ISO (YYYY-MM-DDTHH:MM:SS)
 */
export const convertUkrainianToUTC = (localDateString) => {
    if (!localDateString) return null;

    try {
        // Парсимо дату як український час
        const [datePart, timePart] = localDateString.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute, second = 0] = timePart.split(':').map(Number);

        // Створюємо "фейкову" UTC дату з українським часом
        // Date.UTC() не залежить від локального часового поясу браузера
        const fakeUtcTimestamp = Date.UTC(year, month - 1, day, hour, minute, second);

        // Отримуємо зсув України відносно UTC для цієї дати
        const ukraineOffset = getUkraineOffset(new Date(fakeUtcTimestamp));

        // Віднімаємо зсув України, щоб отримати реальний UTC
        const realUtcDate = new Date(fakeUtcTimestamp - ukraineOffset * 60 * 1000);

        // Форматуємо в ISO без Z (як очікує сервер)
        return realUtcDate.toISOString().slice(0, 19);
    } catch (error) {
        console.error('Error converting to UTC:', error);
        return localDateString;
    }
};

/**
 * Отримує зсув України відносно UTC в хвилинах для заданої дати
 * (враховує перехід на літній/зимовий час)
 * @param {Date} date - дата для перевірки
 * @returns {number} зсув в хвилинах (120 для зимового часу, 180 для літнього)
 */
const getUkraineOffset = (date) => {
    // Використовуємо Intl для точного визначення зсуву
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: UKRAINE_TIMEZONE,
        timeZoneName: 'shortOffset'
    });

    const parts = formatter.formatToParts(date);
    const offsetPart = parts.find(p => p.type === 'timeZoneName');

    if (offsetPart) {
        // Парсимо зсув типу "GMT+2" або "GMT+3"
        const match = offsetPart.value.match(/GMT([+-])(\d+)/);
        if (match) {
            const sign = match[1] === '+' ? 1 : -1;
            const hours = parseInt(match[2], 10);
            return sign * hours * 60;
        }
    }

    // Fallback: Ukraine is UTC+2 (winter) or UTC+3 (summer)
    return 120; // За замовчуванням UTC+2
};

/**
 * Перевіряє чи дата є сьогоднішньою в українському часовому поясі
 * @param {string|Date} dateString - дата для перевірки
 * @returns {boolean}
 */
export const isTodayUA = (dateString) => {
    if (!dateString) return false;

    try {
        const date = normalizeApiDate(dateString);
        if (!date) return false;

        const todayStart = getTodayStartUA();
        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);

        return date >= todayStart && date < tomorrowStart;
    } catch (error) {
        return false;
    }
};

/**
 * Розраховує тривалість між двома датами
 * @param {string|Date} startDate - початкова дата
 * @param {string|Date} endDate - кінцева дата (якщо null - використовується поточний час)
 * @returns {string} тривалість у форматі "Xд Xгод" або "Xгод Xхв" або "Xхв" або "Xс"
 */
export const calculateDuration = (startDate, endDate) => {
    if (!startDate) return 'Невідомо';

    try {
        const start = normalizeApiDate(startDate);
        if (!start) return 'Невідомо';

        // Якщо endDate не вказано - використовуємо поточний час
        const end = endDate ? normalizeApiDate(endDate) : new Date();
        if (!end) return 'Невідомо';

        // Автоматично вибираємо правильний порядок дат
        const earlierTime = start <= end ? start : end;
        const laterTime = start <= end ? end : start;
        const diffMs = laterTime - earlierTime;

        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}д ${hours % 24}год`;
        } else if (hours > 0) {
            return `${hours}год ${minutes % 60}хв`;
        } else if (minutes > 0) {
            return `${minutes}хв`;
        } else if (seconds > 0) {
            return `${seconds}с`;
        } else {
            return '0хв';
        }
    } catch (error) {
        return 'Невідомо';
    }
};

/**
 * Розраховує час, що минув з певної дати
 * @param {string|Date} dateString - початкова дата
 * @returns {Object} { timeString: string, isUnderMinute: boolean }
 */
export const getElapsedTime = (dateString) => {
    if (!dateString) {
        return { timeString: 'Невідомо', isUnderMinute: false };
    }

    try {
        const observedTime = normalizeApiDate(dateString);
        if (!observedTime) {
            return { timeString: 'Невідомо', isUnderMinute: false };
        }

        const now = new Date();
        const diffMs = now - observedTime;

        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        let timeString;
        if (days > 0) {
            timeString = `${days}д ${hours % 24}год ${minutes % 60}хв`;
        } else if (hours > 0) {
            timeString = `${hours}год ${minutes % 60}хв`;
        } else if (minutes > 0) {
            timeString = `${minutes}хв`;
        } else if (seconds > 0) {
            timeString = `${seconds}с`;
        } else {
            timeString = 'Щойно';
        }

        return { timeString, isUnderMinute: minutes < 1 };
    } catch (error) {
        return { timeString: 'Невідомо', isUnderMinute: false };
    }
};

/**
 * Форматує тривалість в секундах у зручний для читання формат
 * @param {number} seconds - тривалість в секундах
 * @returns {string} відформатована тривалість
 */
export const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '-';

    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        const remainingHours = hours % 24;
        const remainingMinutes = minutes % 60;
        return `${days}д ${remainingHours}год ${remainingMinutes}хв`;
    } else if (hours > 0) {
        const remainingMinutes = minutes % 60;
        return `${hours}год ${remainingMinutes}хв`;
    } else if (minutes > 0) {
        return `${minutes}хв`;
    } else {
        return `${seconds}с`;
    }
};

export default {
    normalizeApiDate,
    formatDateUA,
    formatDateOnlyUA,
    formatTimeOnlyUA,
    getCurrentTimeUA,
    formatCurrentTimeUA,
    getTodayStartUA,
    getUkrainianTimeForInput,
    convertUkrainianToUTC,
    isTodayUA,
    calculateDuration,
    getElapsedTime,
    formatDuration,
    UKRAINE_TIMEZONE
};
