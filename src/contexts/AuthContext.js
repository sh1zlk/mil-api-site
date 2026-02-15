import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

// Безпечне зберігання токенів
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const CERT_CHECK_KEY = 'certificate_checked';

const secureStorage = {
    getAccessToken: () => {
        try {
            return localStorage.getItem(TOKEN_KEY);
        } catch (error) {
            console.error('Error accessing localStorage:', error);
            return null;
        }
    },
    setAccessToken: (token) => {
        try {
            if (token) {
                localStorage.setItem(TOKEN_KEY, token);
            } else {
                localStorage.removeItem(TOKEN_KEY);
            }
        } catch (error) {
            console.error('Error setting token:', error);
        }
    },
    getRefreshToken: () => {
        try {
            return localStorage.getItem(REFRESH_TOKEN_KEY);
        } catch (error) {
            console.error('Error accessing localStorage:', error);
            return null;
        }
    },
    setRefreshToken: (token) => {
        try {
            if (token) {
                localStorage.setItem(REFRESH_TOKEN_KEY, token);
            } else {
                localStorage.removeItem(REFRESH_TOKEN_KEY);
            }
        } catch (error) {
            console.error('Error setting refresh token:', error);
        }
    },
    getCertificateChecked: () => {
        try {
            return localStorage.getItem(CERT_CHECK_KEY) === 'true';
        } catch (error) {
            console.error('Error accessing localStorage:', error);
            return false;
        }
    },
    setCertificateChecked: (checked) => {
        try {
            if (checked) {
                localStorage.setItem(CERT_CHECK_KEY, 'true');
            } else {
                localStorage.removeItem(CERT_CHECK_KEY);
            }
        } catch (error) {
            console.error('Error setting certificate checked flag:', error);
        }
    },
    clearAll: () => {
        try {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            localStorage.removeItem(CERT_CHECK_KEY);
        } catch (error) {
            console.error('Error clearing tokens:', error);
        }
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCertificateModal, setShowCertificateModal] = useState(false);
    const [certificateError, setCertificateError] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);


    // Функція для оновлення токена
    const refreshToken = useCallback(async () => {
        try {
            const refreshToken = secureStorage.getRefreshToken();
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await authService.refreshToken(refreshToken);

            if (response.access_token) {
                secureStorage.setAccessToken(response.access_token);
                if (response.refresh_token) {
                    secureStorage.setRefreshToken(response.refresh_token);
                }
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            // При невдалому оновленні розлогінюємо користувача
            await logout();
            return false;
        }
        return false;
    }, []);

    // Перевірка автентифікації при завантаженні
    useEffect(() => {
        const initAuth = async () => {
            console.log('🚀 Початок ініціалізації автентифікації');
            try {
                const token = secureStorage.getAccessToken();
                console.log('🔍 Токен:', token ? 'Знайдено' : 'Відсутній');

                // Якщо є збережений токен, перевіряємо його валідність
                if (token) {
                    console.log('🔄 Знайдено збережений токен, перевірка валідності');
                    try {
                        const userInfo = await authService.getCurrentUser();
                        console.log('📦 Дані користувача отримані:', userInfo);
                        setUser(userInfo.user);
                        setPermissions(userInfo.permissions || []);
                        setIsAuthenticated(true);
                        console.log('✅ Автентифікація через збережений токен успішна');
                    } catch (error) {
                        console.log('❌ Збережений токен недійсний, очищення:', error.message);
                        secureStorage.clearAll();
                        setUser(null);
                        setPermissions([]);
                        setIsAuthenticated(false);
                    }
                } else {
                    // Немає токена - просто показуємо сторінку входу
                    console.log('ℹ️ Немає збереженого токена, очікування входу користувача');
                    setUser(null);
                    setPermissions([]);
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('❌ Помилка ініціалізації автентифікації:', error);
                secureStorage.clearAll();
                setUser(null);
                setPermissions([]);
                setIsAuthenticated(false);
            } finally {
                console.log('✅ Завершення ініціалізації, loading = false');
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    // Автоматичне оновлення токена
    useEffect(() => {
        if (!isAuthenticated) return;

        const interval = setInterval(async () => {
            await refreshToken();
        }, 14 * 60 * 1000); // Кожні 14 хвилин (токен діє 15 хвилин)

        return () => clearInterval(interval);
    }, [isAuthenticated, refreshToken]);

    // Автентифікація через сертифікат
    const handleCertificateValid = useCallback(async (certificateData) => {
        try {
            setLoading(true);
            setCertificateError(null);

            console.log('🔐 Початок автентифікації з даними сертифіката');

            const response = await authService.loginWithCertificate(certificateData);

            // Безпечне зберігання токенів
            secureStorage.setAccessToken(response.access_token);
            secureStorage.setRefreshToken(response.refresh_token);

            setUser(response.user);
            setPermissions(response.permissions || []);
            setIsAuthenticated(true);
            setShowCertificateModal(false);

            console.log('✅ Автентифікація успішна!');
        } catch (error) {
            console.error('Certificate login failed:', error);
            setCertificateError(error.message || 'Помилка автентифікації');
            secureStorage.clearAll();
        } finally {
            setLoading(false);
        }
    }, []);

    const handleCertificateInvalid = useCallback((reason) => {
        const errorMessage = reason === 'not_found'
            ? 'Користувача з таким сертифікатом не знайдено в базі даних'
            : reason === 'invalid'
            ? 'Недійсний або відсутній SSL сертифікат'
            : 'Помилка перевірки сертифіката';

        setCertificateError(errorMessage);

        // Для сертифікатів, що не знайдено в базі, дозволяємо закрити
        if (reason === 'not_found') {
            setTimeout(() => {
                setShowCertificateModal(false);
                setCertificateError(null);
            }, 5000);
        }
    }, []);

    const retryCertificateCheck = useCallback(() => {
        setCertificateError(null);
        setShowCertificateModal(true);
    }, []);

    const closeModal = useCallback(() => {
        setShowCertificateModal(false);
        setCertificateError(null);
    }, []);

    const login = useCallback(async (credentials) => {
        try {
            const result = await authService.login(credentials);
            secureStorage.setAccessToken(result.access_token);
            secureStorage.setRefreshToken(result.refresh_token);
            setUser(result.user);
            setPermissions(result.permissions || []);
            setIsAuthenticated(true);
            return result;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            const refreshToken = secureStorage.getRefreshToken();
            if (refreshToken) {
                await authService.logout(refreshToken);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Очищення всіх даних
            secureStorage.clearAll();
            setUser(null);
            setPermissions([]);
            setIsAuthenticated(false);
            setCertificateError(null);
            setShowCertificateModal(false);
        }
    }, []);

    const value = {
        user,
        permissions,
        loading,
        isAuthenticated,
        showCertificateModal,
        certificateError,
        login,
        logout,
        refreshToken,
        retryCertificateCheck,
        closeModal,
        handleCertificateValid,
        handleCertificateInvalid,
        hasPermission: (permission) => permissions.includes(permission),
        setShowCertificateModal
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};