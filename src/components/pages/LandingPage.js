import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Radio, Lock, ArrowRight } from 'lucide-react';
import { publicApiClient } from '../../services/apiClient';
import { useToastContext } from '../../contexts/ToastContext';

const LandingPage = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToastContext();
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        try {
            setLoading(true);

            // Виконуємо автентифікацію
            const response = await publicApiClient.login();

            // Зберігаємо токени (вже зберігаються в publicApiClient.login)
            console.log('✅ Авторизація успішна:', response);

            // Отримуємо інформацію про користувача
            const userInfo = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/v1/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${response.access_token}`
                }
            });

            if (userInfo.ok) {
                const userData = await userInfo.json();
                console.log('👤 Дані користувача:', userData);

                // Перенаправляємо залежно від ролі (використовуємо window.location для перезавантаження контексту)
                if (userData.is_admin) {
                    console.log('🔑 Адміністратор - перенаправлення на /admin');
                    window.location.href = '/admin';
                } else {
                    console.log('👤 Звичайний користувач - перенаправлення на /');
                    window.location.href = '/';
                }
            } else {
                throw new Error('Не вдалося отримати дані користувача');
            }
        } catch (err) {
            console.error('❌ Помилка авторизації:', err);
            showError('Помилка авторизації. Перевірте сертифікат або спробуйте пізніше.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            {/* Animated background */}
            <div className="absolute inset-0 opacity-10">
                <div className="w-full h-full"
                     style={{
                         backgroundImage: `
                             linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
                         `,
                         backgroundSize: '50px 50px',
                         animation: 'grid-move 20s linear infinite'
                     }}>
                </div>
            </div>

            {/* Main content */}
            <div className="relative z-10 max-w-md w-full">
                <div className="bg-gray-800 border-2 border-gray-600 rounded-2xl p-8 shadow-2xl">
                    {/* Logo and title */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <div className="relative">
                                <Shield className="w-24 h-24 text-green-400 animate-pulse" />
                                <Radio className="w-12 h-12 text-green-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Система моніторингу
                        </h1>
                    </div>

                    {/* Login button */}
                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/50"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Авторизація...</span>
                            </>
                        ) : (
                            <>
                                <Lock className="w-5 h-5" />
                                <span>Авторизація</span>
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>

                    {/* Info */}
                    <div className="mt-6 pt-6 border-t border-gray-700">
                        <p className="text-gray-500 text-xs text-center">
                            Для доступу до системи необхідний дійсний PKI сертифікат
                        </p>
                    </div>
                </div>
            </div>

            {/* CSS for animation */}
            <style>{`
                @keyframes grid-move {
                    0% {
                        transform: translateY(0);
                    }
                    100% {
                        transform: translateY(50px);
                    }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;
