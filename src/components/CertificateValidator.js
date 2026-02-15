import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMockData } from '../utils/environment';

const CertificateValidator = () => {
    const { handleCertificateValid, handleCertificateInvalid, showCertificateModal } = useAuth();
    const [isValidating, setIsValidating] = useState(false);
    const [certificateData, setCertificateData] = useState(null);
    const [error, setError] = useState(null);

    const isMock = useMockData();

    useEffect(() => {
        if (showCertificateModal && !isValidating && !certificateData) {
            validateCertificate();
        }
    }, [showCertificateModal]);

    const validateCertificate = async () => {
        setIsValidating(true);
        setError(null);

        try {
            if (isMock) {
                // Для localhost використовуємо mock дані
                await simulateCertificateValidation();
            } else {
                // Для production - пробуємо пряму автентифікацію
                // Backend має отримати дані сертифіката з nginx заголовків
                await tryDirectLogin();
            }
        } catch (err) {
            console.error('Certificate validation failed:', err);
            setError(err.message);
            handleCertificateInvalid('validation_failed');
        } finally {
            setIsValidating(false);
        }
    };

    const simulateCertificateValidation = async () => {
        // Симулюємо затримку перевірки
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Симуляція даних сертифіката
        const mockCertificateData = {
            certificate_cn: 'admin@radiomonitoring.local',
            certificate_serial: '7149D5B4BB186BDD281C33B64D8E85852A6374AD',
            certificate_fingerprint: '50cc615219b5e4b9adb647ac16509ad7ae5cea82',
            ssl_dn: 'CN=admin@radiomonitoring.local,O=Radio Monitoring,C=UA',
            ssl_issuer: 'CN=Radio Monitoring CA,O=Radio Monitoring,C=UA',
            ssl_verify: 'SUCCESS'
        };

        setCertificateData(mockCertificateData);
        await handleCertificateValid(mockCertificateData);
    };

    const tryDirectLogin = async () => {
        // Для production ми не можемо отримати дані сертифіката напряму
        // Тому спробуємо залогінитись з порожніми даними -
        // backend має отримати дані з nginx заголовків

        const testData = {
            certificate_cn: 'unknown',
            certificate_serial: 'unknown',
            certificate_fingerprint: 'unknown'
        };

        try {
            await handleCertificateValid(testData);
        } catch (error) {
            throw new Error('Certificate authentication failed - please ensure you have a valid SSL certificate installed and your nginx is properly configured');
        }
    };

    const retryValidation = () => {
        setCertificateData(null);
        setError(null);
        validateCertificate();
    };

    if (!showCertificateModal) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                    {/* Заголовок */}
                    <div className="flex items-center justify-center mb-4">
                        <div className={`rounded-full p-3 ${
                            isValidating ? 'bg-blue-100' :
                            error ? 'bg-red-100' :
                            certificateData ? 'bg-green-100' : 'bg-yellow-100'
                        }`}>
                            {isValidating ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            ) : error ? (
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : certificateData ? (
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            )}
                        </div>
                    </div>

                    {/* Текст */}
                    <h3 className="text-lg font-semibold text-center mb-2">
                        {isValidating ? 'Перевірка сертифіката' :
                         error ? 'Помилка автентифікації' :
                         certificateData ? 'Автентифікація успішна' :
                         'Перевірка SSL сертифіката'}
                    </h3>

                    <p className="text-gray-600 text-center mb-4">
                        {isValidating
                            ? 'Йде перевірка вашого SSL сертифіката...'
                            : error
                            ? error
                            : certificateData
                            ? `Вітаємо, ${certificateData.certificate_cn}!`
                            : 'Система перевіряє наявність SSL сертифіката'}
                    </p>

                    {/* Інформація про сертифікат */}
                    {certificateData && !error && (
                        <div className="bg-gray-50 rounded p-3 mb-4">
                            <p className="text-sm text-gray-700">
                                <strong>Суб'єкт:</strong> {certificateData.ssl_dn}
                            </p>
                            <p className="text-sm text-gray-700">
                                <strong>Статус:</strong>
                                <span className="text-green-600 ml-1">✓ Перевірено</span>
                            </p>
                            {isMock && (
                                <p className="text-sm text-yellow-600 mt-2">
                                    🔧 Mock режим - симуляція сертифіката
                                </p>
                            )}
                        </div>
                    )}

                    {/* Помилка */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                            <p className="text-sm text-red-700">{error}</p>
                            {isMock && (
                                <p className="text-xs text-red-600 mt-2">
                                    Це симуляція помилки для localhost розробки
                                </p>
                            )}
                        </div>
                    )}

                    {/* Кнопки */}
                    <div className="flex justify-center space-x-3">
                        {isValidating ? (
                            <button
                                disabled
                                className="px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed"
                            >
                                Перевірка...
                            </button>
                        ) : error ? (
                            <button
                                onClick={retryValidation}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                                Повторити
                            </button>
                        ) : certificateData ? (
                            <button
                                onClick={() => {
                                    // Модальне вікно закриється автоматично через AuthContext
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                                Продовжити
                            </button>
                        ) : (
                            <button
                                onClick={validateCertificate}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                                Перевірити сертифікат
                            </button>
                        )}
                    </div>

                    {/* Додаткова інформація */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                            {isValidating
                                ? 'Це може зайняти кілька секунд...'
                                : error
                                ? 'Переконайтеся, що у вас встановлено правильний SSL сертифікат'
                                : certificateData
                                ? 'Автентифікація через SSL сертифікат забезпечує високий рівень безпеки'
                                : isMock
                                ? '🔧 Localhost режим - використовуються симульовані дані'
                                : 'Перевірка SSL сертифіката для безпечної автентифікації'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CertificateValidator;