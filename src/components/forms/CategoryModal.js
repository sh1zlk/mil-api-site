import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const CategoryModal = ({ isOpen, onClose, onSave, category }) => {
    const [formData, setFormData] = useState({
        name: '',
        alias: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name || '',
                alias: category.alias || ''
            });
        } else {
            setFormData({
                name: '',
                alias: ''
            });
        }
        setErrors({});
    }, [category, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Назва обов\'язкова';
        } else if (formData.name.length > 255) {
            newErrors.name = 'Назва не може бути довшою за 255 символів';
        }
        if (!formData.alias.trim()) {
            newErrors.alias = 'Псевдонім обов\'язковий';
        } else if (formData.alias.length > 255) {
            newErrors.alias = 'Псевдонім не може бути довшим за 255 символів';
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
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-600 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-600">
                    <h3 className="text-xl font-bold text-white">
                        {category ? 'Редагування категорії' : 'Нова категорія'}
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
                            Назва *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            maxLength={255}
                            className={`w-full px-3 py-2 bg-gray-700 border ${
                                errors.name ? 'border-red-500' : 'border-gray-600'
                            } rounded-lg text-white focus:outline-none focus:border-blue-500`}
                            placeholder="Наприклад: Радіолокаційні сигнали"
                        />
                        {errors.name && (
                            <p className="text-red-400 text-xs mt-1">{errors.name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Псевдонім (alias) *
                        </label>
                        <input
                            type="text"
                            name="alias"
                            value={formData.alias}
                            onChange={(e) => {
                                // Дозволяємо тільки латинські літери, цифри, підкреслення та дефіс
                                const value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
                                setFormData(prev => ({ ...prev, alias: value }));
                                if (errors.alias) {
                                    setErrors(prev => ({ ...prev, alias: null }));
                                }
                            }}
                            maxLength={255}
                            className={`w-full px-3 py-2 bg-gray-700 border ${
                                errors.alias ? 'border-red-500' : 'border-gray-600'
                            } rounded-lg text-white focus:outline-none focus:border-blue-500`}
                            placeholder="Наприклад: RADAR"
                        />
                        {errors.alias && (
                            <p className="text-red-400 text-xs mt-1">{errors.alias}</p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                            Унікальний ідентифікатор для системи (латиницею)
                        </p>
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

export default CategoryModal;
