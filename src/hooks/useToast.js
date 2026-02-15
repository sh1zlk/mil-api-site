import { useState, useCallback } from 'react';

let toastId = 0;

const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = toastId++;
        setToasts(prev => [...prev, { id, message, type, duration }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const showSuccess = useCallback((message, duration) => {
        addToast(message, 'success', duration);
    }, [addToast]);

    const showError = useCallback((error, duration) => {
        // Уніфікована обробка помилок
        let message = 'Виникла помилка';

        if (typeof error === 'string') {
            message = error;
        } else if (error?.response?.data?.detail) {
            message = error.response.data.detail;
        } else if (error?.message) {
            message = error.message;
        } else if (error?.detail) {
            message = error.detail;
        }

        addToast(message, 'error', duration);
    }, [addToast]);

    const showWarning = useCallback((message, duration) => {
        addToast(message, 'warning', duration);
    }, [addToast]);

    const showInfo = useCallback((message, duration) => {
        addToast(message, 'info', duration);
    }, [addToast]);

    return {
        toasts,
        removeToast,
        showSuccess,
        showError,
        showWarning,
        showInfo
    };
};

export default useToast;
