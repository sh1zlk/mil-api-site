import React, { useState, useEffect } from 'react';
import { Shield, Lock, AlertCircle, RefreshCw, X, Key, User, Check } from 'lucide-react';

const CertificateLoginModal = ({ isOpen, onClose, onCertificateValid, onCertificateInvalid, isLoading }) => {
    const [certificateStatus, setCertificateStatus] = useState('checking'); // checking, valid, invalid, not_found
    const [certificateData, setCertificateData] = useState(null);
    const [error, setError] = useState(null);
    const [isRetrying, setIsRetrying] = useState(false);

    useEffect(() => {
        if (isOpen) {
            checkCertificate();
        }
    }, [isOpen, onCertificateValid, onCertificateInvalid]);

    const checkCertificate = async () => {
        setCertificateStatus('checking');
        setError(null);

        try {
            // Імітація отримання SSL сертифіката
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Симуляція даних сертифіката
            const mockCertificateData = {
                ssl_verify: 'SUCCESS',
                ssl_dn: 'CN=client1',
                ssl_cn: 'client1',
                ssl_fingerprint: '50cc615219b5e4b9adb647ac16509ad7ae5cea82',
                ssl_serial: '7149D5B4BB186BDD281C33B64D8E85852A6374AD',
                ssl_issuer: 'CN=TestCert,O=Internet Widgits Pty Ltd,L=Kiyv,ST=Kiyv,C=UA'
            };

            setCertificateData(mockCertificateData);

            // Симуляція перевірки в базі даних
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Симуляція: 'client1' існує в базі
            if (mockCertificateData.ssl_cn === 'client1' || mockCertificateData.ssl_cn === 'admin@radiomonitoring.local') {
                console.log('🎯 Знайдено користувача:', mockCertificateData.ssl_cn);
                console.log('📋 Дані сертифіката:', mockCertificateData);

                setCertificateStatus('valid');
                if (onCertificateValid && typeof onCertificateValid === 'function') {
                    onCertificateValid(mockCertificateData);
                }
                // Автоматично закриваємо модальне вікно через 1 секунду
                setTimeout(() => {
                    console.log('🔒 Закриваємо модальне вікно...');
                    if (onClose && typeof onClose === 'function') {
                        onClose();
                    }
                }, 1000);
            } else {
                console.log('❌ Користувача не знайдено в базі:', mockCertificateData.ssl_cn);
                setCertificateStatus('not_found');
                if (onCertificateInvalid && typeof onCertificateInvalid === 'function') {
                    onCertificateInvalid(mockCertificateData, 'not_found');
                }
            }

        } catch (error) {
            console.error('Certificate check error:', error);
            setCertificateStatus('invalid');
            setError('Не вдалося отримати або перевірити SSL сертифікат');
            if (onCertificateInvalid && typeof onCertificateInvalid === 'function') {
                onCertificateInvalid(null, 'invalid');
            }
        }
    };

    const handleRetry = async () => {
        setIsRetrying(true);
        await checkCertificate();
        setIsRetrying(false);
    };

    const handleContinueWithoutCertificate = () => {
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-3">
                        <Shield className="w-8 h-8 text-blue-400" />
                        <h2 className="text-2xl font-bold text-white">Автентифікація</h2>
                    </div>
                    {!isLoading && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {certificateStatus === 'checking' && (
                        <div className="text-center space-y-4">
                            <div className="animate-spin">
                                <Shield className="w-16 h-16 text-blue-400 mx-auto" />
                            </div>
                            <div>
                                <p className="text-white font-medium text-lg">Перевірка SSL сертифіката...</p>
                                <p className="text-gray-400 text-sm mt-2">
                                    Будь ласка, зачекайте. Ми перевіряємо ваш SSL сертифікат для автентифікації.
                                </p>
                            </div>
                        </div>
                    )}

                    {certificateStatus === 'valid' && certificateData && (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 p-4 bg-green-900 bg-opacity-30 rounded-lg">
                                <Shield className="w-6 h-6 text-green-400 flex-shrink-0" />
                                <div>
                                    <p className="text-green-400 font-medium">Автентифікація успішна</p>
                                    <p className="text-gray-300 text-sm">Ваш SSL сертифікат перевірено</p>
                                </div>
                                <Check className="w-6 h-6 text-green-400 animate-pulse" />
                            </div>

                            <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                                <h3 className="text-white font-medium flex items-center space-x-2">
                                    <Key className="w-4 h-4 text-yellow-400" />
                                    <span>Інформація про сертифікат</span>
                                </h3>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-gray-400 text-xs">Власник (CN)</p>
                                        <p className="text-white font-mono text-sm">{certificateData.ssl_cn}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs">Серійний номер</p>
                                        <p className="text-white font-mono text-xs break-all">{certificateData.ssl_serial}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center space-y-2">
                                <p className="text-green-400 font-medium">Вхід виконано як: {certificateData.ssl_cn}</p>
                                <p className="text-gray-400 text-sm">Автоматичне закриття через 1.5 секунди...</p>
                            </div>
                        </div>
                    )}

                    {certificateStatus === 'not_found' && certificateData && (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 p-4 bg-yellow-900 bg-opacity-30 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                                <div>
                                    <p className="text-yellow-400 font-medium">Сертифікат не знайдено в базі</p>
                                    <p className="text-gray-300 text-sm">
                                        Ваш SSL сертифікат дійсний, але користувача з таким сертифікатом не зареєстровано в системі
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                                <h3 className="text-white font-medium flex items-center space-x-2">
                                    <User className="w-4 h-4 text-blue-400" />
                                    <span>Дані сертифіката</span>
                                </h3>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-gray-400 text-xs">Власник (CN)</p>
                                        <p className="text-white font-mono text-sm">{certificateData.ssl_cn}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs">Серійний номер</p>
                                        <p className="text-white font-mono text-xs break-all">{certificateData.ssl_serial}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4">
                                <p className="text-blue-400 text-sm">
                                    <strong>Що робити:</strong> Зв'яжіться з системним адміністратором для реєстрації вашого сертифіката в системі.
                                </p>
                            </div>
                        </div>
                    )}

                    {certificateStatus === 'invalid' && (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 p-4 bg-red-900 bg-opacity-30 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                                <div>
                                    <p className="text-red-400 font-medium">Помилка сертифіката</p>
                                    <p className="text-gray-300 text-sm">
                                        {error || 'Не вдалося перевірити SSL сертифікат'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center space-x-3 p-3 bg-red-900 bg-opacity-50 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-700">
                    {certificateStatus === 'invalid' && (
                        <button
                            onClick={handleRetry}
                            disabled={isRetrying || isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                            {isRetrying ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Перевірка...</span>
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" />
                                    <span>Повторити</span>
                                </>
                            )}
                        </button>
                    )}

                    {certificateStatus === 'not_found' && (
                        <button
                            onClick={handleContinueWithoutCertificate}
                            disabled={isLoading}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            Закрити
                        </button>
                    )}

                    {certificateStatus === 'checking' && (
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            Скасувати
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CertificateLoginModal;