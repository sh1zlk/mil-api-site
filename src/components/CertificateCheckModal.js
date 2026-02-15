import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CertificateCheckModal = () => {
    const {
        showCertificateModal,
        certificateError,
        handleCertificateValid,
        handleCertificateInvalid,
        closeModal
    } = useAuth();

    const [checking, setChecking] = useState(false);
    const [certificateInfo, setCertificateInfo] = useState(null);

    // Автоматична перевірка сертифіката при відкритті модального вікна
    useEffect(() => {
        if (showCertificateModal && !checking && !certificateInfo) {
            checkCertificate();
        }
    }, [showCertificateModal]);

    const checkCertificate = async () => {
        setChecking(true);
        try {
            // В реальному додатку тут ми отримуємо дані сертифіката з nginx
            // Через заголовки, які передає nginx

            // Для розробки можемо симулювати отримання даних
            const mockCertificateData = await simulateCertificateCheck();
            setCertificateInfo(mockCertificateData);

            // Автоматично викликаємо обробник валідного сертифіката
            await handleCertificateValid(mockCertificateData);
        } catch (error) {
            console.error('Certificate check failed:', error);
            setCertificateInfo(null);
            handleCertificateInvalid(error.message);
        } finally {
            setChecking(false);
        }
    };

    // Симуляція перевірки сертифіката (для розробки)
    const simulateCertificateCheck = async () => {
        // Симулюємо затримку
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Симуляція даних сертифіката від nginx
        return {
            certificate_cn: 'admin@radiomonitoring.local',
            certificate_serial: '7149D5B4BB186BDD281C33B64D8E85852A6374AD',
            certificate_fingerprint: '50cc615219b5e4b9adb647ac16509ad7ae5cea82',
            ssl_dn: 'CN=admin@radiomonitoring.local,O=Radio Monitoring,C=UA',
            ssl_issuer: 'CN=Radio Monitoring CA,O=Radio Monitoring,C=UA',
            ssl_verify: 'SUCCESS'
        };
    };

    const handleRetry = () => {
        setCertificateInfo(null);
        setCertificateError(null);
        checkCertificate();
    };

    const handleClose = () => {
        // Закриваємо модальне вікно тільки якщо є помилка 'not_found'
        if (certificateError?.includes('не знайдено')) {
            closeModal();
        }
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
                        <div className="bg-blue-100 rounded-full p-3">
                            {checking ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            ) : certificateError ? (
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : certificateInfo ? (
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            )}
                        </div>
                    </div>

                    {/* Текст */}
                    <h3 className="text-lg font-semibold text-center mb-2">
                        {checking ? 'Перевірка сертифіката' :
                         certificateError ? 'Помилка автентифікації' :
                         'Автентифікація успішна'}
                    </h3>

                    <p className="text-gray-600 text-center mb-4">
                        {checking
                            ? 'Йде перевірка вашого SSL сертифіката...'
                            : certificateError
                            ? certificateError
                            : certificateInfo
                            ? `Вітаємо, ${certificateInfo.certificate_cn}!`
                            : 'Ініціалізація...'}
                    </p>

                    {/* Інформація про сертифікат */}
                    {certificateInfo && !certificateError && (
                        <div className="bg-gray-50 rounded p-3 mb-4">
                            <p className="text-sm text-gray-700">
                                <strong>Суб'єкт:</strong> {certificateInfo.ssl_dn}
                            </p>
                            <p className="text-sm text-gray-700">
                                <strong>Видавець:</strong> {certificateInfo.ssl_issuer}
                            </p>
                            <p className="text-sm text-gray-700">
                                <strong>Статус:</strong>
                                <span className="text-green-600 ml-1">✓ Перевірено</span>
                            </p>
                        </div>
                    )}

                    {/* Кнопки */}
                    <div className="flex justify-center space-x-3">
                        {checking ? (
                            <button
                                disabled
                                className="px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed"
                            >
                                Перевірка...
                            </button>
                        ) : certificateError ? (
                            <>
                                <button
                                    onClick={handleRetry}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                    Повторити
                                </button>
                                {certificateError?.includes('не знайдено') && (
                                    <button
                                        onClick={handleClose}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                                    >
                                        Закрити
                                    </button>
                                )}
                            </>
                        ) : certificateInfo ? (
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                                Продовжити
                            </button>
                        ) : (
                            <button
                                onClick={checkCertificate}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                                Перевірити сертифікат
                            </button>
                        )}
                    </div>

                    {/* Додаткова інформація */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                            {checking
                                ? 'Це може зайняти кілька секунд...'
                                : certificateError
                                ? 'Переконайтеся, що у вас встановлено правильний SSL сертифікат'
                                : 'Автентифікація через SSL сертифікат забезпечує високий рівень безпеки'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CertificateCheckModal;