import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const SignalTypeModal = ({ isOpen, onClose, onSave, signalType, categories }) => {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        category_id: '',
        is_active: true
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (signalType) {
            setFormData({
                code: signalType.code || '',
                name: signalType.name || '',
                description: signalType.description || '',
                category_id: signalType.category_id || '',
                is_active: signalType.is_active !== undefined ? signalType.is_active : true
            });
        } else {
            setFormData({
                code: '',
                name: '',
                description: '',
                category_id: '',
                is_active: true
            });
        }
        setErrors({});
    }, [signalType, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.code.trim()) {
            newErrors.code = 'Код обов\'язковий';
        } else if (formData.code.length > 50) {
            newErrors.code = 'Код не може бути довшим за 50 символів';
        }
        if (!formData.name.trim()) {
            newErrors.name = 'Назва обов\'язкова';
        }
        if (!formData.category_id) {
            newErrors.category_id = 'Категорія обов\'язкова';
        }
        return newErrors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        const dataToSave = {
            ...formData,
            category_id: formData.category_id ? parseInt(formData.category_id, 10) : undefined
        };
        onSave(dataToSave);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-600 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-600">
                    <h3 className="text-xl font-bold text-white">
                        {signalType ? 'Редагування типу сигналу' : 'Новий тип сигналу'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Код *
                        </label>
                        <input
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={(e) => {
                                // Дозволяємо тільки латинські літери, цифри, підкреслення та дефіс
                                const value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
                                setFormData(prev => ({ ...prev, code: value }));
                                if (errors.code) {
                                    setErrors(prev => ({ ...prev, code: null }));
                                }
                            }}
                            maxLength={50}
                            className={`w-full px-3 py-2 bg-gray-700 border ${
                                errors.code ? 'border-red-500' : 'border-gray-600'
                            } rounded-lg text-white focus:outline-none focus:border-blue-500`}
                            placeholder="Наприклад: TARGET_HIGHLIGHT"
                        />
                        {errors.code && (
                            <p className="text-red-400 text-xs mt-1">{errors.code}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Назва *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 bg-gray-700 border ${
                                errors.name ? 'border-red-500' : 'border-gray-600'
                            } rounded-lg text-white focus:outline-none focus:border-blue-500`}
                            placeholder="Наприклад: Підсвічування цілі"
                        />
                        {errors.name && (
                            <p className="text-red-400 text-xs mt-1">{errors.name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Опис
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            placeholder="Опис типу сигналу"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Категорія *
                        </label>
                        <select
                            name="category_id"
                            value={formData.category_id}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 bg-gray-700 border ${
                                errors.category_id ? 'border-red-500' : 'border-gray-600'
                            } rounded-lg text-white focus:outline-none focus:border-blue-500`}
                        >
                            <option value="">Оберіть категорію</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        {errors.category_id && (
                            <p className="text-red-400 text-xs mt-1">{errors.category_id}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="is_active"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                            className="w-4 h-4 bg-gray-700 border-gray-600 rounded"
                        />
                        <label htmlFor="is_active" className="text-sm text-gray-300">
                            Активний
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-600">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                        >
                            Скасувати
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Зберегти
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignalTypeModal;
