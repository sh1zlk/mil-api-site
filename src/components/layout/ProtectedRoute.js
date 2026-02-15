import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, permissions = [] }) => {
    const { user, hasPermission } = useAuth();

    if (!user) {
        return <div className="text-white">Завантаження...</div>;
    }

    if (permissions.length > 0 && !permissions.some(permission => hasPermission(permission))) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white">Доступ заборонено</div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;