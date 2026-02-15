import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredPermission = null }) => {
    const { isAuthenticated, loading, user, hasPermission } = useAuth();

    // Показуємо завантаження, поки перевіряється автентифікація
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Перевірка автентифікації...</p>
                </div>
            </div>
        );
    }

    // Якщо користувач не автентифікований, перенаправляємо на сторінку автентифікації
    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    // Якщо потрібна специфічна дозвол і її немає
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
                    <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Доступ заборонено</h2>
                    <p className="text-gray-600 mb-4">
                        У вас немає необхідних прав для доступу до цієї сторінки.
                    </p>
                    <p className="text-sm text-gray-500">
                        Потрібна дозвіл: <code className="bg-gray-100 px-2 py-1 rounded">{requiredPermission}</code>
                    </p>
                </div>
            </div>
        );
    }

    // Якщо всі перевірки пройдені, показуємо дочірній компонент
    return children;
};

export default ProtectedRoute;