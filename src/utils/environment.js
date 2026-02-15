// Утиліти для визначення середовища та налаштувань

export const isLocalhost = () => {
    return (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '' ||
        window.location.protocol === 'file:'
    );
};

export const isDevelopment = () => {
    return process.env.NODE_ENV === 'development' || isLocalhost();
};

export const isProduction = () => {
    return process.env.NODE_ENV === 'production' && !isLocalhost();
};

export const getApiBaseUrl = () => {
    if (isLocalhost()) {
        return 'http://localhost:60800'; // ваш FastAPI сервер
    }
    return ''; // для production відносні URL
};

export const getEnvironmentInfo = () => {
    return {
        isLocalhost: isLocalhost(),
        isDevelopment: isDevelopment(),
        isProduction: isProduction(),
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        apiBaseUrl: getApiBaseUrl(),
        nodeEnv: process.env.NODE_ENV
    };
};

export const useMockData = () => {
    return isLocalhost() && process.env.REACT_APP_USE_MOCK !== 'false';
};

export default {
    isLocalhost,
    isDevelopment,
    isProduction,
    getApiBaseUrl,
    getEnvironmentInfo,
    useMockData
};