import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import CertificateLoginModal from './components/auth/CertificateLoginModal';
import UserPage from './components/pages/UserPage';
import AdminPage from './components/pages/AdminPage';
import AnalyticsPage from './components/pages/AnalyticsPage';
import AllObservationsPage from './components/pages/AllObservationsPage';
import LoginPage from './components/pages/LoginPage';
import LandingPage from './components/pages/LandingPage';

// Компонент захисту адмін-роутів
function AdminRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user || !user.is_admin) {
        return <Navigate to="/" replace />;
    }

    return children;
}

function AppContent() {
    const { loading, showCertificateModal, certificateError, handleCertificateValid, handleCertificateInvalid, closeModal, user, permissions } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Перенаправлення адміністратора на /admin (хук повинен бути ДО умовних return)
    useEffect(() => {
        if (user && !loading && user.is_admin && location.pathname === '/') {
            navigate('/admin', { replace: true });
        }
    }, [user, loading, navigate, location.pathname]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-white text-lg">Завантаження системи...</p>
                </div>
            </div>
        );
    }

    // Якщо користувач не автентифікований - показуємо лендінг
    if (!user) {
        return <LandingPage />;
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <main>
                <Routes>
                    <Route path="/" element={<UserPage title="Головна сторінка" />} />
                    <Route path="/admin" element={
                        <AdminRoute>
                            <AdminPage title="Адмін панель" />
                        </AdminRoute>
                    } />
                    <Route path="/admin/observations" element={
                        <AdminRoute>
                            <AllObservationsPage title="Всі спостереження" />
                        </AdminRoute>
                    } />
                    <Route path="/analytics" element={<AnalyticsPage title="Аналітика" />} />
                </Routes>
            </main>

            {/* Certificate Login Modal */}
            <CertificateLoginModal
                isOpen={showCertificateModal}
                onClose={closeModal}
                onCertificateValid={handleCertificateValid}
                onCertificateInvalid={handleCertificateInvalid}
                isLoading={loading}
            />
        </div>
    );
}

function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <Router>
                    <AppContent />
                </Router>
            </AuthProvider>
        </ToastProvider>
    );
}

export default App;