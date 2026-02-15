import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 5000 }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const typeStyles = {
        success: {
            bg: 'bg-green-600/90',
            icon: CheckCircle,
            iconColor: 'text-green-200'
        },
        error: {
            bg: 'bg-red-600/90',
            icon: AlertCircle,
            iconColor: 'text-red-200'
        },
        warning: {
            bg: 'bg-yellow-600/90',
            icon: AlertTriangle,
            iconColor: 'text-yellow-200'
        },
        info: {
            bg: 'bg-blue-600/90',
            icon: Info,
            iconColor: 'text-blue-200'
        }
    };

    const style = typeStyles[type] || typeStyles.info;
    const Icon = style.icon;

    return (
        <div className={`${style.bg} backdrop-blur-sm rounded-lg shadow-lg p-4 flex items-start gap-3 min-w-[300px] max-w-md animate-slide-in`}>
            <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
            <p className="text-white text-sm flex-1 break-words">{message}</p>
            <button
                onClick={onClose}
                className="text-white/70 hover:text-white transition-colors flex-shrink-0"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export default Toast;
