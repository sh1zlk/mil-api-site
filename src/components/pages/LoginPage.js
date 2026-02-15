import React, { useState } from 'react';
import { Shield, Lock, CheckCircle, User, Key, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { formatDateOnlyUA } from '../../utils/dateUtils';
import { useToastContext } from '../../contexts/ToastContext';

const LoginPage = () => {
    const { showSuccess, showError, showWarning } = useToastContext();
    const [credentials, setCredentials] = useState({
        username: '',
        password: ''
    });
    const [selectedCert, setSelectedCert] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLogging, setIsLogging] = useState(false);
    const [loginMethod, setLoginMethod] = useState('certificate'); // 'certificate' или 'password'

    // Симуляція доступних SSL сертифікатів
    const getAuthToken = () => localStorage.getItem('access_token');
    console.log(getAuthToken())
    const availableCertificates = [
        {
            id: 'admin_cert',
            cn: 'admin.central.domain.mil',
            serial: '1A2B3C4D5E6F7890',
            role: 'Системний адміністратор',
            expires: formatDateOnlyUA(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
            status: 'valid'
        },
        {
            id: 'operator_cert',
            cn: 'operator1.post1.domain.mil',
            serial: '2B3C4D5E6F7A8901',
            role: 'Оператор поста',
            expires: formatDateOnlyUA(new Date(Date.now() + 300 * 24 * 60 * 60 * 1000)),
            status: 'valid'
        },
        {
            id: 'analyst_cert',
            cn: 'analyst1.central.domain.mil',
            serial: '3C4D5E6F7A8B9012',
            role: 'Аналітик даних',
            expires: formatDateOnlyUA(new Date(Date.now() + 250 * 24 * 60 * 60 * 1000)),
            status: 'valid'
        },
        {
            id: 'expired_cert',
            cn: 'operator2.post2.domain.mil',
            serial: '4D5E6F7A8B9C0123',
            role: 'Оператор (застарілий)',
            expires: formatDateOnlyUA(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
            status: 'expired'
        }
    ];

    const handleCertificateLogin = async () => {
        if (!selectedCert) {
            showWarning('Оберіть SSL сертифікат для входу');
            return;
        }

        const certificate = availableCertificates.find(cert => cert.id === selectedCert);

        if (certificate.status === 'expired') {
            showError('Сертифікат прострочений. Зверніться до адміністратора для оновлення.');
            return;
        }

        setIsLogging(true);

        try {
            // Симуляція перевірки сертифікату
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Тут буде справжня логіка входу
            showSuccess(`Успішний вхід через PKI сертифікат: ${certificate.cn}`);

            // Перенаправлення на головну сторінку
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } catch (error) {
            showError(error);
        } finally {
            setIsLogging(false);
        }
    };

    const handlePasswordLogin = async () => {
        if (!credentials.username || !credentials.password) {
            showWarning('Введіть ім\'я користувача та пароль');
            return;
        }

        setIsLogging(true);

        try {
            // Симуляція перевірки облікових даних
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Тут буде справжня логіка входу
            showSuccess(`Успішний вхід: ${credentials.username}`);

            // Перенаправлення на головну сторінку
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } catch (error) {
            showError(error);
        } finally {
            setIsLogging(false);
        }
    };

    const getCertificateStatusColor = (status) => {
        switch (status) {
            case 'valid':
                return 'border-green-500 bg-green-600 hover:bg-green-700';
            case 'expired':
                return 'border-red-500 bg-red-600 hover:bg-red-700 opacity-75';
            default:
                return 'border-gray-500 bg-gray-600 hover:bg-gray-700';
        }
    };

    const getCertificateIcon = (status) => {
        switch (status) {
            case 'valid':
                return <CheckCircle className="w-5 h-5 text-green-300" />;
            case 'expired':
                return <AlertTriangle className="w-5 h-5 text-red-300" />;
            default:
                return <Lock className="w-5 h-5 text-gray-300" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            {/* Tactical background */}
            <div className="absolute inset-0 opacity-5">
                <div className="w-full h-full"
                     style={{
                         backgroundImage: `
                 linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
               `,
                         backgroundSize: '40px 40px'
                     }}>
                </div>
            </div>

            <div className="relative z-10 max-w-lg w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <Shield className="w-16 h-16 text-green-400" />
                        <div className="text-left">
                            <h1 className="text-3xl font-bold text-white">Система моніторингу</h1>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Вхід в систему</h2>
                </div>

                {/* Login Method Selection */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setLoginMethod('certificate')}
                            className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                                loginMethod === 'certificate'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            <Lock className="w-4 h-4" />
                            PKI Сертифікат
                        </button>
                    </div>

                    {/* PKI Certificate Login */}
                    {loginMethod === 'certificate' && (
                        <div className="space-y-4">
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Key className="w-5 h-5 text-green-400" />
                                    <span className="text-white font-medium">Доступні SSL сертифікати:</span>
                                </div>
                                <p className="text-sm text-gray-400 mb-4">
                                    Оберіть сертифікат для автентифікації у системі
                                </p>
                            </div>

                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {availableCertificates.map(cert => (
                                    <div
                                        key={cert.id}
                                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                            selectedCert === cert.id
                                                ? 'border-green-500 bg-green-500/10'
                                                : cert.status === 'expired'
                                                    ? 'border-red-500/50 bg-red-500/5'
                                                    : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                                        }`}
                                        onClick={() => cert.status === 'valid' && setSelectedCert(cert.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            {getCertificateIcon(cert.status)}
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-medium text-white">{cert.cn}</h4>
                                                    <span className={`px-2 py-1 text-xs rounded ${
                                                        cert.status === 'valid' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                                                    }`}>
                            {cert.status === 'valid' ? 'Дійсний' : 'Прострочений'}
                          </span>
                                                </div>
                                                <p className="text-sm text-gray-400 mb-2">{cert.role}</p>
                                                <div className="flex justify-between text-xs text-gray-500">
                                                    <span>Серійний: {cert.serial}</span>
                                                    <span>Діє до: {cert.expires}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleCertificateLogin}
                                disabled={!selectedCert || isLogging}
                                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLogging ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Перевірка сертифікату...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-5 h-5" />
                                        Увійти через PKI
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Password Login */}
                    {loginMethod === 'password' && (
                        <div className="space-y-4">
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <User className="w-5 h-5 text-blue-400" />
                                    <span className="text-white font-medium">Аутентифікація за логіном:</span>
                                </div>
                                <p className="text-sm text-gray-400">
                                    Введіть ваші облікові дані для входу
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Ім'я користувача
                                </label>
                                <input
                                    type="text"
                                    value={credentials.username}
                                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="operator1"
                                    autoComplete="username"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Пароль
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={credentials.password}
                                        onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handlePasswordLogin}
                                disabled={!credentials.username || !credentials.password || isLogging}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLogging ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Перевірка облікових даних...
                                    </>
                                ) : (
                                    <>
                                        <User className="w-5 h-5" />
                                        Увійти в систему
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>


            </div>
        </div>
    );
};

export default LoginPage;