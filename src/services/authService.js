// src/services/authService.js
import { publicApiClient, authenticatedApiClient } from './apiClient';
import { DEVELOP } from '../config';

const authService = {
    // Автоматичний вхід через /login endpoint (без параметрів, сертифікат передається автоматично)
    autoLogin: async () => {
        if (DEVELOP) {
            console.log('🔧 DEVELOP mode: Returning mock JSON data');
            return {
                access_token: 'mock_develop_access_token_' + Date.now(),
                refresh_token: 'mock_develop_refresh_token_' + Date.now(),
                token_type: 'bearer',
                expires_in: 3600,
                user_id: 1,
                username: 'develop_user',
                user: {
                    id: 1,
                    username: 'develop_user'
                },
                permissions: ['read', 'write']
            };
        }

        try {
            // Автоматичний запит до /login - сервер отримує сертифікат з nginx
            const response = await publicApiClient.login();

            return {
                access_token: response.access_token,
                refresh_token: response.refresh_token,
                token_type: response.token_type || 'bearer',
                expires_in: response.expires_in,
                user_id: response.user_id,
                username: response.username,
                user: {
                    id: response.user_id,
                    username: response.username
                },
                permissions: response.permissions || []
            };
        } catch (error) {
            console.error('Auto login failed:', error);
            throw error;
        }
    },
    // Отримання інформації про SSL сертифікат клієнта
    getCertificateInfo: async () => {

        try {
            // Для отримання даних сертифіката потрібно зробити запит до endpoint,
            // який читає nginx заголовки. Оскільки такого endpoint немає в API,
            // ми повертаємо null і система використовує альтернативний підхід
            console.warn('Certificate info endpoint not available - using direct certificate validation');
            return null;
        } catch (error) {
            console.error('Error getting certificate info:', error);
            throw new Error('Certificate not available or invalid');
        }
    },

    // Логін через SSL сертифікат згідно з OpenAPI специфікацією
    loginWithCertificate: async (certificateData) => {
        // Якщо DEVELOP=true, повертаємо JSON дані без запиту
        if (DEVELOP) {
            console.log('🔧 DEVELOP mode: Returning mock JSON data');
            return {
                access_token: 'mock_develop_access_token_' + Date.now(),
                refresh_token: 'mock_develop_refresh_token_' + Date.now(),
                token_type: 'bearer',
                expires_in: 3600,
                user_id: 1,
                username: 'develop_user',
                user: {
                    id: 1,
                    username: 'develop_user'
                },
                permissions: ['read', 'write']
            };
        }

        try {
            // Перевіряємо, чи є всі необхідні дані сертифіката
            const { certificate_cn, certificate_serial, certificate_fingerprint } = certificateData;

            if (!certificate_cn || !certificate_serial || !certificate_fingerprint) {
                throw new Error('Certificate data is incomplete');
            }

            const loginRequest = {
                certificate_cn,
                certificate_serial,
                certificate_fingerprint
            };

            const response = await publicApiClient.loginWithCertificate(loginRequest);

            // Відповідь від сервера згідно з OpenAPI
            return {
                access_token: response.access_token,
                refresh_token: response.refresh_token,
                token_type: response.token_type || 'bearer',
                expires_in: response.expires_in,
                user_id: response.user_id,
                username: response.username,
                user: {
                    id: response.user_id,
                    username: response.username
                },
                permissions: response.permissions || []
            };
        } catch (error) {
            console.error('Certificate login error:', error);

            // Обробка різних типів помилок
            if (error.response?.status === 401) {
                throw new Error('Certificate authentication failed - user not found or certificate invalid');
            } else if (error.response?.status === 422) {
                throw new Error('Invalid certificate data format');
            } else if (error.message === 'Certificate not available or invalid') {
                throw new Error('No SSL certificate available - please ensure you have a valid certificate installed');
            } else {
                throw new Error('Authentication failed: ' + (error.message || 'Unknown error'));
            }
        }
    },

    // Отримання інформації про поточного користувача
    getCurrentUser: async () => {

        try {
            const userData = await authenticatedApiClient.getCurrentUser();
            return {
                user: userData,
                permissions: userData.permissions || []
            };
        } catch (error) {
            console.error('Error getting current user:', error);

            if (error.response?.status === 401) {
                // Токен недійсний
                throw new Error('Authentication expired');
            } else {
                throw error;
            }
        }
    },

    // Оновлення токена
    refreshToken: async (refreshToken) => {

        try {
            const response = await publicApiClient.refreshToken(refreshToken);
            return response;
        } catch (error) {
            console.error('Token refresh error:', error);
            throw new Error('Token refresh failed');
        }
    },

    // Вихід з системи
    logout: async (refreshToken = null) => {

        try {
            if (refreshToken) {
                await authenticatedApiClient.logout(refreshToken);
            }
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            // Навіть якщо logout API не вдався, все одно очищуємо локальні дані
            return false;
        }
    },

    // Отримання активних сесій користувача
    getSessions: async () => {

        try {
            const sessions = await authenticatedApiClient.getSessions();
            return sessions;
        } catch (error) {
            console.error('Error getting sessions:', error);
            throw error;
        }
    },

    // Перевірка стану автентифікації
    checkAuthStatus: async () => {
        try {
            const userData = await authService.getCurrentUser();
            return {
                authenticated: true,
                user: userData.user,
                permissions: userData.permissions
            };
        } catch (error) {
            return {
                authenticated: false,
                error: error.message
            };
        }
    },

    // Застарілий метод для зворотної сумісності
    login: async (credentials) => {
        throw new Error('Password login is not supported. Please use certificate authentication.');
    }
};

export default authService;