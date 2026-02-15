import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 2000 }) => {
    useEffect(() => {
        console.log('Toast mounted, setting timer for', duration, 'ms');
        const timer = setTimeout(() => {
            console.log('Toast timer expired, calling onClose');
            onClose();
        }, duration);

        return () => {
            console.log('Toast cleanup, clearing timer');
            clearTimeout(timer);
        };
    }, [onClose, duration]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-400" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-400" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
            default:
                return <CheckCircle className="w-5 h-5 text-green-400" />;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case 'success':
                return 'bg-green-600/20 border-green-500';
            case 'error':
                return 'bg-red-600/20 border-red-500';
            case 'warning':
                return 'bg-yellow-600/20 border-yellow-500';
            default:
                return 'bg-green-600/20 border-green-500';
        }
    };

    return (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full border rounded-lg p-4 shadow-lg backdrop-blur-sm ${getBgColor()} animate-in slide-in-from-top-2 duration-300`}>
            <div className="flex items-start gap-3">
                {getIcon()}
                <div className="flex-1 text-white text-sm">
                    {message}
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Toast;
