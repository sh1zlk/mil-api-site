import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, User, MapPin, Shield } from 'lucide-react';
import { api } from '../../services/apiClient';

const CertificateUploadModal = ({ isOpen, onClose, posts, roles, onUserCreated, isLoading }) => {
    const [certificateFile, setCertificateFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedPost, setSelectedPost] = useState('');
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [username, setUsername] = useState('');
    const [usernameAlias, setUsernameAlias] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    // Допустимі розширення файлів
    const ALLOWED_EXTENSIONS = ['.pem', '.crt', '.cer', '.der', '.p12', '.pfx'];

    const resetForm = () => {
        setCertificateFile(null);
        setError(null);
        setSelectedPost('');
        setSelectedRoles([]);
        setUsername('');
        setUsernameAlias('');
        setIsDragging(false);
    };

    const handleClose = () => {
        if (!isProcessing) {
            resetForm();
            onClose();
        }
    };

    // Валідація файлу
    const validateFile = (file) => {
        if (!file) return false;

        const fileName = file.name.toLowerCase();
        const isValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));

        if (!isValidExtension) {
            setError(`Невірний формат файлу. Дозволені: ${ALLOWED_EXTENSIONS.join(', ')}`);
            return false;
        }

        // Перевірка розміру (макс 100MB)
        if (file.size > 100 * 1024 * 1024) {
            setError('Файл занадто великий. Максимальний розмір: 100MB');
            return false;
        }

        return true;
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && validateFile(file)) {
            setCertificateFile(file);
            setError(null);
        }
    };

    // Drag and Drop handlers
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isProcessing) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Перевіряємо чи курсор дійсно покинув зону
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (isProcessing) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (validateFile(file)) {
                setCertificateFile(file);
                setError(null);
            }
        }
    };

    // Видалення файлу
    const handleRemoveFile = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCertificateFile(null);
    };

    const handleRoleToggle = (roleId) => {
        setSelectedRoles(prev =>
            prev.includes(roleId)
                ? prev.filter(id => id !== roleId)
                : [...prev, roleId]
        );
    };

    const handleCreateUser = async () => {
        // Валідація
        if (!certificateFile) {
            setError('Будь ласка, завантажте сертифікат');
            return;
        }

        if (!username.trim()) {
            setError('Будь ласка, вкажіть ім\'я користувача');
            return;
        }

        if (!usernameAlias.trim()) {
            setError('Будь ласка, вкажіть відображуване ім\'я');
            return;
        }

        if (selectedRoles.length === 0) {
            setError('Будь ласка, оберіть принаймні одну роль');
            return;
        }

        if (!selectedPost) {
            setError('Будь ласка, оберіть пост');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const userData = await api.users.create({
                certificate: certificateFile,
                username: username.trim(),
                username_alias: usernameAlias.trim(),
                role_ids: selectedRoles,
                post_id: parseInt(selectedPost, 10)
            });

            if (onUserCreated) {
                onUserCreated(userData);
            }

            resetForm();
            onClose();
        } catch (err) {
            if (err.message?.includes('Duplicate') || err.response?.data?.detail?.includes('Duplicate')) {
                setError('Користувач з цим сертифікатом вже існує');
            } else {
                const errorMessage = err.response?.data?.detail || err.message || 'Помилка сервера';
                setError(`Помилка: ${errorMessage}`);
            }
            console.error('User creation error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    if (!posts || !roles) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg p-6">
                    <AlertCircle className="w-6 h-6 text-red-400 mb-3" />
                    <p className="text-white">Помилка завантаження даних</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-3">
                        <Shield className="w-6 h-6 text-green-400" />
                        <h2 className="text-xl font-bold text-white">Створення користувача з SSL сертифіката</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isProcessing}
                        className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Завантаження сертифіката з Drag & Drop */}
                    <div className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                            <Shield className="w-4 h-4 text-green-400" />
                            <h3 className="text-white font-medium">Файл сертифіката *</h3>
                        </div>
                        <div
                            className={`
                                border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
                                ${isDragging
                                    ? 'border-green-400 bg-green-400 bg-opacity-10 scale-[1.02]'
                                    : certificateFile
                                        ? 'border-green-500 bg-green-500 bg-opacity-5'
                                        : 'border-gray-600 hover:border-gray-500'
                                }
                                ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                id="certificate-upload"
                                accept=".pem,.crt,.cer,.der,.p12,.pfx"
                                onChange={handleFileUpload}
                                className="hidden"
                                disabled={isProcessing}
                            />
                            <label
                                htmlFor="certificate-upload"
                                className={`flex flex-col items-center space-y-3 ${isProcessing ? '' : 'cursor-pointer'}`}
                            >
                                {isDragging ? (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-green-400 bg-opacity-20 flex items-center justify-center animate-pulse">
                                            <Upload className="w-8 h-8 text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-green-400 font-medium text-lg">Відпустіть файл тут</p>
                                            <p className="text-green-300 text-sm">для завантаження</p>
                                        </div>
                                    </>
                                ) : certificateFile ? (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center">
                                            <CheckCircle className="w-8 h-8 text-green-400" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-green-400 font-medium">{certificateFile.name}</p>
                                            <p className="text-gray-400 text-sm">
                                                {(certificateFile.size / 1024).toFixed(2)} KB
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveFile}
                                            className="mt-2 px-3 py-1 text-sm text-red-400 hover:text-red-300 hover:bg-red-400 hover:bg-opacity-10 rounded transition-colors flex items-center space-x-1"
                                        >
                                            <X className="w-4 h-4" />
                                            <span>Видалити</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center group-hover:bg-gray-500 transition-colors">
                                            <Upload className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">
                                                Перетягніть сертифікат сюди
                                            </p>
                                            <p className="text-gray-400 text-sm">
                                                або <span className="text-blue-400 hover:underline">натисніть для вибору</span>
                                            </p>
                                        </div>
                                        <p className="text-gray-500 text-xs">
                                            Формати: .pem, .crt, .cer, .der, .p12, .pfx (макс. 100MB)
                                        </p>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Дані користувача */}
                    <div className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                            <User className="w-4 h-4 text-blue-400" />
                            <h3 className="text-white font-medium">Дані користувача</h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-gray-400 text-xs mb-1">Ім'я користувача (username) *</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => {
                                        // Дозволяємо тільки латинські літери, цифри, підкреслення та дефіс
                                        const value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
                                        setUsername(value);
                                    }}
                                    className="w-full p-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-400 focus:outline-none"
                                    placeholder="user_name"
                                    minLength="3"
                                    maxLength="50"
                                    pattern="[a-zA-Z0-9_-]+"
                                />
                                <p className="text-gray-400 text-xs mt-1">3-50 символів (тільки латиниця, цифри, _ та -)</p>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs mb-1">Відображуване ім'я (alias) *</label>
                                <input
                                    type="text"
                                    value={usernameAlias}
                                    onChange={(e) => setUsernameAlias(e.target.value)}
                                    className="w-full p-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-400 focus:outline-none"
                                    placeholder="Іван Петренко"
                                    minLength="1"
                                    maxLength="255"
                                />
                                <p className="text-gray-400 text-xs mt-1">1-255 символів</p>
                            </div>
                        </div>
                    </div>

                    {/* Призначення на пост */}
                    <div className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                            <MapPin className="w-4 h-4 text-purple-400" />
                            <h3 className="text-white font-medium">Призначення на пост *</h3>
                        </div>
                        <select
                            className="w-full p-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-400 focus:outline-none"
                            value={selectedPost}
                            onChange={(e) => setSelectedPost(e.target.value)}
                        >
                            <option value="">Оберіть пост (обов'язково)</option>
                            {posts.map(post => (
                                <option key={post.id} value={post.id}>
                                    {post.name} ({post.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Ролі користувача */}
                    <div className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                            <Shield className="w-4 h-4 text-blue-400" />
                            <h3 className="text-white font-medium">Ролі користувача *</h3>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {roles.map(role => (
                                <label key={role.id} className="flex items-center space-x-2 p-2 hover:bg-gray-600 rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedRoles.includes(role.id)}
                                        onChange={() => handleRoleToggle(role.id)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-white">{role.display_name}</span>
                                </label>
                            ))}
                        </div>
                        {selectedRoles.length > 0 && (
                            <p className="text-gray-400 text-xs mt-2">
                                ✓ Обрано ролей: {selectedRoles.length}
                            </p>
                        )}
                    </div>

                    {/* Повідомлення про помилку */}
                    {error && (
                        <div className="flex items-center space-x-3 p-3 bg-red-900 bg-opacity-50 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}
                </div>

                {/* Кнопки дій */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-700">
                    <button
                        onClick={handleClose}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                        Закрити
                    </button>

                    <button
                        onClick={handleCreateUser}
                        disabled={isProcessing || isLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                        {isProcessing || isLoading ? (
                            <>
                                <div className="animate-spin">
                                    <User className="w-4 h-4" />
                                </div>
                                <span>Створення...</span>
                            </>
                        ) : (
                            <>
                                <User className="w-4 h-4" />
                                <span>Створити користувача</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CertificateUploadModal;