// HTTP клієнт з автоматичним додаванням Bearer токена
import axios from 'axios';

// Базові налаштування API
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Визначаємо середовище
const isDevelopment = process.env.NODE_ENV === 'development' ||
                     window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1';

// Створюємо інстанс axios
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    // ❌ НЕ встановлюємо базовий Content-Type тут
    // Axios автоматично встановить правильний Content-Type:
    // - application/json для об'єктів
    // - multipart/form-data з boundary для FormData
    // Для розробки - без credentials (щоб уникнути CORS), для production - з credentials
    withCredentials: !isDevelopment
});

// Функція для отримання токена з безпечного сховища
const getAccessToken = () => {
    try {
        return localStorage.getItem('access_token');
    } catch (error) {
        console.error('Error getting access token:', error);
        return null;
    }
};

// Функція для оновлення токена
const refreshAccessToken = async () => {
    try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken
        }, {
            withCredentials: !isDevelopment
        });

        if (response.data.access_token) {
            localStorage.setItem('access_token', response.data.access_token);
            if (response.data.refresh_token) {
                localStorage.setItem('refresh_token', response.data.refresh_token);
            }
            // Зберігаємо нові поля з відповіді LoginResponse
            if (response.data.expires_in) {
                localStorage.setItem('token_expires_in', String(response.data.expires_in));
            }
            if (response.data.user_id) {
                localStorage.setItem('user_id', String(response.data.user_id));
            }
            if (response.data.username) {
                localStorage.setItem('username', response.data.username);
            }
            return response.data.access_token;
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
        // Очищуємо токени при невдалому оновленні
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        throw error;
    }
};

// Request interceptor - додаємо Bearer токен до кожного запиту
apiClient.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Встановлюємо Content-Type: application/json тільки якщо це НЕ FormData
        // Для FormData axios автоматично встановить multipart/form-data з boundary
        if (!(config.data instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
        }

        // Додаємо заголовки безпеки
        config.headers['X-Requested-With'] = 'XMLHttpRequest';

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - обробка помилок автентифікації
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Якщо помилка 401 (Unauthorized) і запит ще не повторювався
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Пробуємо оновити токен
                const newToken = await refreshAccessToken();

                if (newToken) {
                    // Повторюємо оригінальний запит з новим токеном
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // Якщо оновлення не вдалося, перенаправляємо на логін
                // Це може бути оброблено через AuthContext
                console.error('Token refresh failed completely:', refreshError);

                // Очищуємо токени
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');

                // Можна викликати глобальний callback для обробки виходу
                if (window.onAuthFailure) {
                    window.onAuthFailure();
                }

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Функції для роботи з API без токена (для автентифікації)
export const publicApiClient = {
    // Автоматичний вхід через /login (сертифікат передається автоматично через nginx)
    login: async () => {
        // Перевіряємо чи це localhost
        const isLocalhost = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';

        let requestData = null;

        // Якщо localhost - використовуємо тестові дані сертифіката
        if (isLocalhost) {
            requestData = {
                certificate_cn: "admin@radiomonitoring.local",
                certificate_serial: "ABC123DEF456",
                certificate_fingerprint: "12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78"
            };
        }

        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, requestData, {
            withCredentials: !isDevelopment
        });

        // Зберігаємо нові поля з відповіді LoginResponse
        const { access_token, refresh_token, expires_in, user_id, username } = response.data;

        if (access_token) {
            localStorage.setItem('access_token', access_token);
        }
        if (refresh_token) {
            localStorage.setItem('refresh_token', refresh_token);
        }
        if (expires_in) {
            localStorage.setItem('token_expires_in', String(expires_in));
        }
        if (user_id) {
            localStorage.setItem('user_id', String(user_id));
        }
        if (username) {
            localStorage.setItem('username', username);
        }

        return response.data;
    },

    // Логін через сертифікат
    loginWithCertificate: async (certificateData) => {
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, certificateData, {
            withCredentials: !isDevelopment
        });
        return response.data;
    },

    // Оновлення токена
    refreshToken: async (refreshToken) => {
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken
        }, {
            withCredentials: !isDevelopment
        });
        return response.data;
    }
};

// Функції для роботи з API з токеном
export const authenticatedApiClient = {
    // Отримання інформації про поточного користувача
    getCurrentUser: async () => {
        const response = await apiClient.get('/api/v1/auth/me');
        return response.data;
    },

    // Вихід
    logout: async (sessionId = null) => {
        const requestBody = {};
        if (sessionId) {
            requestBody.session_id = sessionId;
        }

        const response = await apiClient.post('/api/v1/auth/logout', requestBody);
        return response.data;
    },

    // Отримання сесій користувача
    getSessions: async () => {
        const response = await apiClient.get('/api/v1/auth/sessions');
        return response.data.sessions; // API повертає { sessions: [...] }
    }
};

// Загальні API функції
export const api = {
    // Health check
    health: async () => {
        const response = await apiClient.get('/health');
        return response.data;
    },

    // Користувачі
    users: {
        search: async (params = {}) => {
            const queryParams = {
                page: params.page || 1,
                page_size: params.page_size || 50
            };

            if (params.sort_by !== undefined) {
                queryParams.sort_by = params.sort_by;
            }
            if (params.sort_order !== undefined) {
                queryParams.sort_order = params.sort_order;
            }

            const response = await apiClient.get('/api/v1/search/users', { params: queryParams });
            return response.data; // SearchResponse
        },
        list: async (params = {}) => {
            const queryParams = {
                page: params.page || 1,
                page_size: params.page_size || 50
            };

            if (params.sort_by !== undefined) {
                queryParams.sort_by = params.sort_by;
            }
            if (params.sort_order !== undefined) {
                queryParams.sort_order = params.sort_order;
            }

            const response = await apiClient.get('/api/v1/users/', { params: queryParams });
            return response.data; // Повертає масив UserResponse
        },
        get: async (userId) => {
            const response = await apiClient.get(`/api/v1/users/${userId}`);
            return response.data;
        },
        create: async (userData) => {
            // userData має містити: certificate (File), username, username_alias, role_ids (array), post_id
            const formData = new FormData();

            // Валідація обов'язкових полів
            if (!userData.certificate) {
                throw new Error('Certificate is required');
            }
            if (!userData.username?.trim()) {
                throw new Error('Username is required');
            }
            if (!userData.username_alias?.trim()) {
                throw new Error('Username alias is required');
            }
            if (!Array.isArray(userData.role_ids) || userData.role_ids.length === 0) {
                throw new Error('At least one role is required');
            }

            formData.append('certificate', userData.certificate);
            formData.append('username', String(userData.username).trim());
            formData.append('username_alias', String(userData.username_alias).trim());
            formData.append('role_ids', JSON.stringify(userData.role_ids.map(id => Number(id))));

            if (userData.post_id != null) {
                formData.append('post_id', String(Number(userData.post_id)));
            }

            // Axios автоматично додасть правильний multipart/form-data з boundary
            const response = await apiClient.post('/api/v1/users/', formData);
            return response.data;
        },
        update: async (userId, userData) => {
            // userData може містити:
            // - certificate: File object (опціонально)
            // - username_alias: string (опціонально)
            // - post_id: number (опціонально)
            // - is_active: boolean (опціонально)
            // - role_ids: array (опціонально) - ЗАМІНЮЄ ВСІ РОЛІ
            //
            // ВАЖЛИВО: role_ids - це масив ID ролей, який ЗАМІНЮЄ
            // всі поточні ролі користувача (не додає, а замінює!)
            const formData = new FormData();

            // Додаємо тільки ті поля, що передані (всі опціональні)
            if (userData.certificate) {
                formData.append('certificate', userData.certificate);
            }
            if (userData.username_alias !== undefined) {
                formData.append('username_alias', String(userData.username_alias).trim());
            }
            if (userData.post_id !== undefined) {
                formData.append('post_id', String(Number(userData.post_id)));
            }
            if (userData.is_active !== undefined) {
                formData.append('is_active', String(Boolean(userData.is_active)));
            }
            if (userData.role_ids !== undefined) {
                formData.append('role_ids', JSON.stringify(userData.role_ids.map(id => Number(id))));
            }

            // Axios автоматично додасть правильний multipart/form-data з boundary
            const response = await apiClient.patch(`/api/v1/users/${userId}`, formData);
            return response.data;
        },
        // Ролі користувачів (READ-ONLY)
        roles: {
            // Отримати ролі користувача (READ-ONLY)
            list: async (userId) => {
                const response = await apiClient.get(`/api/v1/users/${userId}/roles`);
                return response.data;
            }
        }
    },

    // Спостереження
    observations: {
        /**
         * Пошук спостережень з фільтрами через /search ендпоінт
         * @param {Object} params - Параметри запиту
         * @param {number} params.page - Номер сторінки (default: 1)
         * @param {number} params.page_size - Кількість на сторінці (default: 50, max: 200)
         * @param {number} params.post_id - Фільтр по посту
         * @param {number} params.user_id - Фільтр по користувачу
         * @param {number} params.signal_type_id - Фільтр по типу сигналу
         * @param {string} params.status - Фільтр по статусу (active/inactive/disappeared)
         * @param {string} params.status_in - Кілька статусів через кому
         * @param {string} params.confidence_level - Рівень впевненості (low/medium/high)
         * @param {number} params.frequency_center_from - Мін. центральна частота
         * @param {number} params.frequency_center_to - Макс. центральна частота
         * @param {number} params.bandwidth_from - Мін. ширина смуги
         * @param {number} params.bandwidth_to - Макс. ширина смуги
         * @param {number} params.video_frequency_center_from - Мін. відео частота
         * @param {number} params.video_frequency_center_to - Макс. відео частота
         * @param {string} params.observed_at_from - Дата спостереження від (ISO)
         * @param {string} params.observed_at_to - Дата спостереження до (ISO)
         * @param {number} params.last_n_days - Останні N днів
         * @param {boolean} params.is_disappeared - Чи зник сигнал
         * @param {number} params.duration_from - Мін. тривалість (сек)
         * @param {number} params.duration_to - Макс. тривалість (сек)
         * @param {string} params.comment_contains - Пошук в коментарі
         * @param {string} params.tag_ids - ID тегів через кому
         * @param {boolean} params.include_deleted - Включити видалені
         * @param {string} params.sort_by - Поле для сортування
         * @param {string} params.sort_order - Напрямок (ascending/descending)
         * @returns {Promise<Object>} - SearchResponse { entity, items, total, page, page_size, total_pages }
         */
        search: async (params = {}) => {
            const queryParams = {
                page: params.page || 1,
                page_size: params.page_size || 50
            };

            // Фільтри по сутностях
            if (params.post_id !== undefined) queryParams.post_id = params.post_id;
            if (params.user_id !== undefined) queryParams.user_id = params.user_id;
            if (params.signal_type_id !== undefined) queryParams.signal_type_id = params.signal_type_id;

            // Фільтри по статусу
            if (params.status !== undefined) queryParams.status = params.status;
            if (params.status_in !== undefined) queryParams.status_in = params.status_in;
            if (params.confidence_level !== undefined) queryParams.confidence_level = params.confidence_level;

            // Фільтри по частотах (керування)
            if (params.frequency_center_from !== undefined) queryParams.frequency_center_from = params.frequency_center_from;
            if (params.frequency_center_to !== undefined) queryParams.frequency_center_to = params.frequency_center_to;
            if (params.bandwidth_from !== undefined) queryParams.bandwidth_from = params.bandwidth_from;
            if (params.bandwidth_to !== undefined) queryParams.bandwidth_to = params.bandwidth_to;

            // Фільтри по відео частотах
            if (params.video_frequency_center_from !== undefined) queryParams.video_frequency_center_from = params.video_frequency_center_from;
            if (params.video_frequency_center_to !== undefined) queryParams.video_frequency_center_to = params.video_frequency_center_to;

            // Фільтри по датах
            if (params.observed_at_from !== undefined) queryParams.observed_at_from = params.observed_at_from;
            if (params.observed_at_to !== undefined) queryParams.observed_at_to = params.observed_at_to;
            if (params.last_n_days !== undefined) queryParams.last_n_days = params.last_n_days;
            if (params.created_at_from !== undefined) queryParams.created_at_from = params.created_at_from;
            if (params.created_at_to !== undefined) queryParams.created_at_to = params.created_at_to;

            // Інші фільтри
            if (params.is_disappeared !== undefined) queryParams.is_disappeared = params.is_disappeared;
            if (params.disappeared_by !== undefined) queryParams.disappeared_by = params.disappeared_by;
            if (params.duration_from !== undefined) queryParams.duration_from = params.duration_from;
            if (params.duration_to !== undefined) queryParams.duration_to = params.duration_to;
            if (params.comment_contains !== undefined) queryParams.comment_contains = params.comment_contains;
            if (params.tag_ids !== undefined) queryParams.tag_ids = params.tag_ids;
            if (params.include_deleted !== undefined) queryParams.include_deleted = params.include_deleted;

            // Сортування
            if (params.sort_by !== undefined) queryParams.sort_by = params.sort_by;
            if (params.sort_order !== undefined) queryParams.sort_order = params.sort_order;

            const response = await apiClient.get('/api/v1/search/observations', {
                params: queryParams
            });
            return response.data; // SearchResponse { entity, items, total, page, page_size, total_pages }
        },

        /**
         * Отримати список спостережень з фільтрами (LEGACY - використовуйте search())
         * @deprecated Використовуйте observations.search() замість цього методу
         * @param {Object} params - Параметри запиту
         * @returns {Promise<Array>} - Масив ObservationWithMedia
         */
        list: async (params = {}) => {
            const queryParams = {
                page: params.page || 1,
                page_size: params.page_size || 50
            };

            // Фільтри по сутностях
            if (params.post_id !== undefined) queryParams.post_id = params.post_id;
            if (params.user_id !== undefined) queryParams.user_id = params.user_id;
            if (params.signal_type_id !== undefined) queryParams.signal_type_id = params.signal_type_id;

            // Фільтри по статусу
            if (params.status !== undefined) queryParams.status = params.status;
            if (params.status_in !== undefined) queryParams.status_in = params.status_in;
            if (params.confidence_level !== undefined) queryParams.confidence_level = params.confidence_level;

            // Фільтри по частотах (керування)
            if (params.frequency_center_from !== undefined) queryParams.frequency_center_from = params.frequency_center_from;
            if (params.frequency_center_to !== undefined) queryParams.frequency_center_to = params.frequency_center_to;
            if (params.bandwidth_from !== undefined) queryParams.bandwidth_from = params.bandwidth_from;
            if (params.bandwidth_to !== undefined) queryParams.bandwidth_to = params.bandwidth_to;

            // Фільтри по відео частотах
            if (params.video_frequency_center_from !== undefined) queryParams.video_frequency_center_from = params.video_frequency_center_from;
            if (params.video_frequency_center_to !== undefined) queryParams.video_frequency_center_to = params.video_frequency_center_to;

            // Фільтри по датах
            if (params.observed_at_from !== undefined) queryParams.observed_at_from = params.observed_at_from;
            if (params.observed_at_to !== undefined) queryParams.observed_at_to = params.observed_at_to;
            if (params.last_n_days !== undefined) queryParams.last_n_days = params.last_n_days;
            if (params.created_at_from !== undefined) queryParams.created_at_from = params.created_at_from;
            if (params.created_at_to !== undefined) queryParams.created_at_to = params.created_at_to;

            // Інші фільтри
            if (params.is_disappeared !== undefined) queryParams.is_disappeared = params.is_disappeared;
            if (params.disappeared_by !== undefined) queryParams.disappeared_by = params.disappeared_by;
            if (params.duration_from !== undefined) queryParams.duration_from = params.duration_from;
            if (params.duration_to !== undefined) queryParams.duration_to = params.duration_to;
            if (params.comment_contains !== undefined) queryParams.comment_contains = params.comment_contains;
            if (params.tag_ids !== undefined) queryParams.tag_ids = params.tag_ids;
            if (params.include_deleted !== undefined) queryParams.include_deleted = params.include_deleted;

            // Сортування
            if (params.sort_by !== undefined) queryParams.sort_by = params.sort_by;
            if (params.sort_order !== undefined) queryParams.sort_order = params.sort_order;

            const response = await apiClient.get('/api/v1/observations/list-all', {
                params: queryParams
            });
            return response.data; // ObservationWithMedia[] - включає media_ids
        },
        create: async (observationData) => {
            // Валідація згідно ObservationCreate
            if (!observationData.post_id || observationData.post_id <= 0) {
                throw new Error('post_id must be positive');
            }
            if (!observationData.signal_type_id || observationData.signal_type_id <= 0) {
                throw new Error('signal_type_id must be positive');
            }
            if (observationData.duration_seconds !== undefined &&
                observationData.duration_seconds !== null &&
                observationData.duration_seconds < 0) {
                throw new Error('duration_seconds must be >= 0');
            }

            // Обрізаємо коментар до 1000 символів
            const validatedData = {
                ...observationData
            };
            if (observationData.comment) {
                validatedData.comment = observationData.comment.substring(0, 1000);
            }

            const response = await apiClient.post('/api/v1/observations/create', validatedData);
            return response.data;
        },
        update: async (observationId, observationData) => {
            // Валідація згідно ObservationUpdate (всі поля optional)
            const validatedData = {};

            if (observationData.signal_type_id !== undefined) {
                if (observationData.signal_type_id <= 0) {
                    throw new Error('signal_type_id must be > 0');
                }
                validatedData.signal_type_id = observationData.signal_type_id;
            }

            if (observationData.duration_seconds !== undefined &&
                observationData.duration_seconds !== null &&
                observationData.duration_seconds < 0) {
                throw new Error('duration_seconds must be >= 0');
            }

            // Копіюємо поля, що оновлюються
            ['frequency_min', 'frequency_max', 'video_frequency_min', 'video_frequency_max',
             'observed_at', 'duration_seconds', 'confidence_level'].forEach(field => {
                if (observationData[field] !== undefined) {
                    validatedData[field] = observationData[field];
                }
            });

            // Обрізаємо коментар до 1000 символів
            if (observationData.comment !== undefined) {
                validatedData.comment = observationData.comment ? observationData.comment.substring(0, 1000) : null;
            }

            // Додаємо теги
            if (observationData.tag_ids !== undefined) {
                validatedData.tag_ids = observationData.tag_ids;
            }

            const response = await apiClient.put(`/api/v1/observations/${observationId}`, validatedData);
            return response.data;
        },
        markDisappeared: async (observationId, disappearedData) => {
            const response = await apiClient.post(`/api/v1/observations/${observationId}/disappeared`, disappearedData);
            return response.data;
        }
    },

    // Ролі
    roles: {
        // Список ролей з пагінацією
        list: async (params = {}) => {
            const queryParams = {
                page: params.page || 1,
                page_size: params.page_size || 50
            };

            if (params.sort_by !== undefined) {
                queryParams.sort_by = params.sort_by;
            }
            if (params.sort_order !== undefined) {
                queryParams.sort_order = params.sort_order;
            }

            const response = await apiClient.get('/api/v1/roles/', {
                params: queryParams
            });
            return response.data;
        },

        // Отримати роль за ID
        get: async (roleId) => {
            const response = await apiClient.get(`/api/v1/roles/${roleId}`);
            return response.data;
        },

        // Створити нову роль
        create: async (roleData) => {
            // roleData: { name, display_name, description?, permission_ids? }
            const response = await apiClient.post('/api/v1/roles/', roleData);
            return response.data;
        },

        // Оновити роль
        update: async (roleId, roleData) => {
            // roleData: { display_name?, description?, permission_ids? }
            const response = await apiClient.patch(`/api/v1/roles/${roleId}`,
                roleData
            );
            return response.data;
        },

        // Видалити роль
        delete: async (roleId) => {
            const response = await apiClient.delete(`/api/v1/roles/${roleId}`);
            return response.data;
        },

        // Отримати дозволи ролі
        permissions: {
            list: async (roleId) => {
                const response = await apiClient.get(
                    `/api/v1/roles/${roleId}/permissions`
                );
                return response.data;
            }
        },

        /**
         * Отримати всі доступні дозволи в системі (admin only)
         * @returns {Promise<Array>} - Масив PermissionResponse { id, name }
         */
        listAllPermissions: async () => {
            const response = await apiClient.get('/api/v1/roles/list-all-permissions');
            return response.data;
        }
    },

    // Пости
    posts: {
        search: async (params = {}) => {
            const queryParams = {
                page: params.page || 1,
                page_size: params.page_size || 50
            };

            if (params.sort_by !== undefined) {
                queryParams.sort_by = params.sort_by;
            }
            if (params.sort_order !== undefined) {
                queryParams.sort_order = params.sort_order;
            }

            const response = await apiClient.get('/api/v1/search/posts', { params: queryParams });
            return response.data; // SearchResponse
        },
        list: async (params = {}) => {
            const queryParams = {
                page: params.page || 1,
                page_size: params.page_size || 50
            };

            // Додаємо is_active тільки якщо явно вказано
            // true - тільки активні, false - тільки видалені, null/undefined - всі
            if (params.is_active !== undefined) {
                queryParams.is_active = params.is_active;
            }
            if (params.sort_by !== undefined) {
                queryParams.sort_by = params.sort_by;
            }
            if (params.sort_order !== undefined) {
                queryParams.sort_order = params.sort_order;
            }

            const response = await apiClient.get('/api/v1/posts/', { params: queryParams });
            return response.data;
        },
        get: async (postId) => {
            const response = await apiClient.get(`/api/v1/posts/${postId}`);
            return response.data;
        },
        create: async (postData) => {
            // Валідація згідно PostCreate
            if (!postData.name || postData.name.length === 0) {
                throw new Error('name is required');
            }
            if (!postData.code || postData.code.length === 0) {
                throw new Error('code is required');
            }

            const validatedData = {
                name: postData.name.substring(0, 255),
                code: postData.code.substring(0, 50)
            };

            if (postData.description) {
                validatedData.description = postData.description.substring(0, 1000);
            }
            if (postData.region) {
                validatedData.region = postData.region.substring(0, 255);
            }
            if (postData.city) {
                validatedData.city = postData.city.substring(0, 255);
            }

            const response = await apiClient.post('/api/v1/posts/', validatedData);
            return response.data;
        },
        update: async (postId, postData) => {
            // Валідація згідно PostUpdate (всі поля optional)
            const validatedData = {};

            if (postData.name !== undefined) {
                if (postData.name.length === 0) {
                    throw new Error('name cannot be empty');
                }
                validatedData.name = postData.name.substring(0, 255);
            }

            if (postData.description !== undefined) {
                validatedData.description = postData.description ? postData.description.substring(0, 1000) : null;
            }

            if (postData.region !== undefined) {
                validatedData.region = postData.region ? postData.region.substring(0, 255) : null;
            }

            if (postData.city !== undefined) {
                validatedData.city = postData.city ? postData.city.substring(0, 255) : null;
            }

            if (postData.is_active !== undefined) {
                validatedData.is_active = postData.is_active;
            }

            const response = await apiClient.put(`/api/v1/posts/${postId}`, validatedData);
            return response.data;
        }
    },

    // Медіа файли
    media: {
        list: async (params = {}) => {
            const queryParams = {
                page: params.page || 1,
                page_size: params.page_size || 50
            };

            // Додаємо optional параметри фільтрації
            if (params.observation_id !== undefined) {
                queryParams.observation_id = params.observation_id;
            }
            if (params.media_type !== undefined) {
                queryParams.media_type = params.media_type; // "image" | "video" | "audio"
            }
            if (params.sort_by !== undefined) {
                queryParams.sort_by = params.sort_by;
            }
            if (params.sort_order !== undefined) {
                queryParams.sort_order = params.sort_order;
            }

            const response = await apiClient.get('/api/v1/media/', { params: queryParams });
            return response.data; // MediaFileInfo[]
        },
        getInfo: async (mediaId) => {
            const response = await apiClient.get(`/api/v1/media/${mediaId}/info`);
            return response.data;
        },
        download: async (mediaId, params = {}) => {
            const queryParams = {
                validate_integrity: params.validate_integrity !== false,  // default: true
                stream: params.stream || false  // default: false
            };

            const response = await apiClient.get(`/api/v1/media/${mediaId}/download`, {
                params: queryParams,
                responseType: 'blob'
            });
            return response.data;
        },
        delete: async (mediaId) => {
            const response = await apiClient.delete(`/api/v1/media/${mediaId}`);
            return response.data;
        },
        statistics: async () => {
            const response = await apiClient.get('/api/v1/media/statistics');
            return response.data;
        },
        /**
         * Завантажити цілий файл за один запит
         * @param {number} observationId - ID спостереження
         * @param {string} mediaType - Тип медіа: 'image', 'video', 'audio'
         * @param {File} file - File object з input[type="file"]
         */
        uploadComplete: async (observationId, mediaType, file) => {
            console.log('📤 uploadComplete викликано з параметрами:', {
                observationId,
                mediaType,
                fileType: file?.constructor?.name,
                fileName: file?.name,
                fileSize: file?.size
            });

            const formData = new FormData();
            formData.append('observation_id', String(observationId));
            formData.append('media_type', mediaType);
            formData.append('file', file);

            // Логуємо що додали в FormData
            console.log('📋 FormData створено:');
            for (let [key, value] of formData.entries()) {
                console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
            }

            // ❌ НЕ встановлюємо Content-Type вручну для FormData
            // Axios автоматично додасть правильний multipart/form-data з boundary
            const response = await apiClient.post('/api/v1/media/upload', formData);
            console.log('✅ uploadComplete response:', response.data);
            return response.data;
        },

        /**
         * Отримати всі медіа файли для конкретного спостереження
         * @param {number} observationId - ID спостереження
         */
        listForObservation: async (observationId) => {
            // ВАЖЛИВО: Новий API використовує POST замість GET
            const response = await apiClient.post('/api/v1/media/list-all-attached', {
                observation_id: observationId
            });
            return response.data;
        },

        /**
         * Отримати мініатюру медіафайлу
         * @param {number} mediaId - ID медіафайлу
         * @returns {Promise<Blob>} - Зображення або статус 202 якщо генерується
         */
        getThumbnail: async (mediaId) => {
            const response = await apiClient.get(`/api/v1/media/${mediaId}/thumbnail`, {
                responseType: 'blob'
            });
            return response.data;
        },

        /**
         * Примусово регенерувати мініатюру (тільки для адмінів)
         * @param {number} mediaId - ID медіафайлу
         */
        regenerateThumbnail: async (mediaId) => {
            const response = await apiClient.post(`/api/v1/media/${mediaId}/thumbnail/regenerate`);
            return response.data;
        }
    },

    // Типи сигналів
    signalTypes: {
        search: async (params = {}) => {
            const queryParams = {
                page: params.page || 1,
                page_size: params.page_size || 50
            };

            if (params.sort_by !== undefined) {
                queryParams.sort_by = params.sort_by;
            }
            if (params.sort_order !== undefined) {
                queryParams.sort_order = params.sort_order;
            }

            const response = await apiClient.get('/api/v1/search/signal-types', { params: queryParams });
            return response.data; // SearchResponse
        },
        /**
         * Отримати список всіх типів сигналів
         * @param {Object} params - Параметри запиту
         * @param {number} params.page - Номер сторінки (default: 1)
         * @param {number} params.page_size - Кількість на сторінці (default: 50, max: 200)
         * @param {number} params.category_id - Фільтр за категорією (optional)
         * @param {boolean} params.is_active - Фільтр за активністю (optional)
         * @param {boolean} params.include_deleted - Включити видалені (default: false)
         * @param {string} params.sort_by - Поле для сортування (optional)
         * @param {string} params.sort_order - Напрямок сортування (optional)
         * @returns {Promise<Array>} - Масив SignalTypeResponse
         */
        list: async (params = {}) => {
            const queryParams = {
                page: params.page || 1,
                page_size: params.page_size || 50
            };

            // Додаємо опціональні параметри
            if (params.category_id !== undefined) {
                queryParams.category_id = params.category_id;
            }
            if (params.is_active !== undefined) {
                queryParams.is_active = params.is_active;
            }
            if (params.include_deleted !== undefined) {
                queryParams.include_deleted = params.include_deleted;
            }
            if (params.sort_by !== undefined) {
                queryParams.sort_by = params.sort_by;
            }
            if (params.sort_order !== undefined) {
                queryParams.sort_order = params.sort_order;
            }

            const response = await apiClient.get('/api/v1/signal-types/list-all', {
                params: queryParams
            });
            return response.data;
        },

        /**
         * Отримати тип сигналу за ID (з інформацією про категорію)
         * @param {number} signalTypeId - ID типу сигналу
         * @returns {Promise<Object>} - SignalTypeWithCategoryResponse
         */
        get: async (signalTypeId) => {
            const response = await apiClient.get(`/api/v1/signal-types/${signalTypeId}`);
            return response.data; // Включає category_name
        },

        /**
         * Створити новий тип сигналу
         * @param {Object} signalTypeData - Дані типу сигналу
         * @param {string} signalTypeData.code - Код типу (required, max 50)
         * @param {string} signalTypeData.name - Назва типу (required, max 255)
         * @param {number} signalTypeData.category_id - ID категорії (optional, must be > 0)
         * @param {string} signalTypeData.description - Опис (optional, max 1000)
         * @param {boolean} signalTypeData.is_active - Активний (optional, default: true)
         * @param {number} signalTypeData.sort_order - Порядок сортування (optional, default: 0, min: 0)
         * @returns {Promise<Object>} - SignalType
         */
        create: async (signalTypeData) => {
            // Валідація
            if (!signalTypeData.code || signalTypeData.code.length === 0) {
                throw new Error('code is required');
            }
            if (!signalTypeData.name || signalTypeData.name.length === 0) {
                throw new Error('name is required');
            }
            if (signalTypeData.category_id !== undefined && signalTypeData.category_id <= 0) {
                throw new Error('category_id must be > 0');
            }
            if (signalTypeData.sort_order !== undefined && signalTypeData.sort_order < 0) {
                throw new Error('sort_order must be >= 0');
            }

            const validatedData = {
                code: signalTypeData.code.substring(0, 50),
                name: signalTypeData.name.substring(0, 255),
                is_active: signalTypeData.is_active !== undefined ? signalTypeData.is_active : true,
                sort_order: signalTypeData.sort_order || 0
            };

            if (signalTypeData.category_id !== undefined) {
                validatedData.category_id = signalTypeData.category_id;
            }
            if (signalTypeData.description) {
                validatedData.description = signalTypeData.description.substring(0, 1000);
            }

            const response = await apiClient.post('/api/v1/signal-types/create', validatedData);
            return response.data;
        },

        /**
         * Оновити тип сигналу
         * @param {number} signalTypeId - ID типу сигналу
         * @param {Object} signalTypeData - Дані для оновлення (всі поля optional)
         * @param {string} signalTypeData.name - Назва типу (max 255)
         * @param {number} signalTypeData.category_id - ID категорії (must be > 0)
         * @param {string} signalTypeData.description - Опис (max 1000)
         * @param {boolean} signalTypeData.is_active - Активний
         * @param {number} signalTypeData.sort_order - Порядок сортування (min: 0)
         * @returns {Promise<Object>} - SignalType
         */
        update: async (signalTypeId, signalTypeData) => {
            const validatedData = {};

            if (signalTypeData.name !== undefined) {
                if (signalTypeData.name.length === 0) {
                    throw new Error('name cannot be empty');
                }
                validatedData.name = signalTypeData.name.substring(0, 255);
            }

            if (signalTypeData.category_id !== undefined) {
                if (signalTypeData.category_id <= 0) {
                    throw new Error('category_id must be > 0');
                }
                validatedData.category_id = signalTypeData.category_id;
            }

            if (signalTypeData.description !== undefined) {
                validatedData.description = signalTypeData.description ?
                    signalTypeData.description.substring(0, 1000) : null;
            }

            if (signalTypeData.is_active !== undefined) {
                validatedData.is_active = signalTypeData.is_active;
            }

            if (signalTypeData.sort_order !== undefined) {
                if (signalTypeData.sort_order < 0) {
                    throw new Error('sort_order must be >= 0');
                }
                validatedData.sort_order = signalTypeData.sort_order;
            }

            const response = await apiClient.put(`/api/v1/signal-types/${signalTypeId}`, validatedData);
            return response.data;
        },

        /**
         * Видалити тип сигналу (soft delete)
         * @param {number} signalTypeId - ID типу сигналу
         * @returns {Promise<Object>} - MessageResponse
         */
        delete: async (signalTypeId) => {
            const response = await apiClient.delete(`/api/v1/signal-types/${signalTypeId}`);
            return response.data;
        }
    },

    // Категорії сигналів
    categories: {
        /**
         * Отримати список всіх категорій
         * @param {Object} params - Параметри запиту
         * @param {number} params.page - Номер сторінки (default: 1)
         * @param {number} params.page_size - Кількість на сторінці (default: 50, max: 200)
         * @param {boolean} params.include_deleted - Включити видалені (default: false)
         * @param {string} params.sort_by - Поле для сортування (optional)
         * @param {string} params.sort_order - Напрямок сортування (optional)
         * @returns {Promise<Array>} - Масив CategoryResponse
         */
        list: async (params = {}) => {
            const queryParams = {
                page: params.page || 1,
                page_size: params.page_size || 50,
                include_deleted: params.include_deleted || false
            };

            if (params.sort_by !== undefined) {
                queryParams.sort_by = params.sort_by;
            }
            if (params.sort_order !== undefined) {
                queryParams.sort_order = params.sort_order;
            }

            const response = await apiClient.get('/api/v1/categories/list-all', {
                params: queryParams
            });
            return response.data;
        },

        /**
         * Отримати категорію за ID
         * @param {number} categoryId - ID категорії
         * @returns {Promise<Object>} - CategoryResponse
         */
        get: async (categoryId) => {
            const response = await apiClient.get(`/api/v1/categories/${categoryId}`);
            return response.data;
        },

        /**
         * Створити нову категорію
         * @param {Object} categoryData - Дані категорії
         * @param {string} categoryData.name - Назва категорії (required, max 255)
         * @param {string} categoryData.alias - Псевдонім категорії (required, max 255)
         * @returns {Promise<Object>} - Category
         */
        create: async (categoryData) => {
            // Валідація
            if (!categoryData.name || categoryData.name.length === 0) {
                throw new Error('name is required');
            }
            if (!categoryData.alias || categoryData.alias.length === 0) {
                throw new Error('alias is required');
            }

            const validatedData = {
                name: categoryData.name.substring(0, 255),
                alias: categoryData.alias.substring(0, 255)
            };

            const response = await apiClient.post('/api/v1/categories/create', validatedData);
            return response.data;
        },

        /**
         * Оновити категорію
         * @param {number} categoryId - ID категорії
         * @param {Object} categoryData - Дані для оновлення
         * @param {string} categoryData.name - Назва категорії (optional, max 255)
         * @param {string} categoryData.alias - Псевдонім категорії (optional, max 255)
         * @returns {Promise<Object>} - Category
         */
        update: async (categoryId, categoryData) => {
            const validatedData = {};

            if (categoryData.name !== undefined) {
                if (categoryData.name.length === 0) {
                    throw new Error('name cannot be empty');
                }
                validatedData.name = categoryData.name.substring(0, 255);
            }

            if (categoryData.alias !== undefined) {
                if (categoryData.alias.length === 0) {
                    throw new Error('alias cannot be empty');
                }
                validatedData.alias = categoryData.alias.substring(0, 255);
            }

            const response = await apiClient.put(`/api/v1/categories/${categoryId}`, validatedData);
            return response.data;
        },

        /**
         * Видалити категорію (soft delete)
         * @param {number} categoryId - ID категорії
         * @returns {Promise<Object>} - MessageResponse
         */
        delete: async (categoryId) => {
            const response = await apiClient.delete(`/api/v1/categories/${categoryId}`);
            return response.data;
        },

        /**
         * Отримати типи сигналів категорії
         * @param {number} categoryId - ID категорії
         * @param {Object} params - Параметри запиту
         * @param {number} params.skip - Скільки пропустити (default: 0)
         * @param {number} params.limit - Скільки завантажити (default: 100)
         * @param {boolean} params.include_inactive - Включити неактивні (default: false)
         * @returns {Promise<Array>} - Масив SignalTypeResponse
         */
        signalTypes: async (categoryId, params = {}) => {
            // Цей ендпоінт використовує skip/limit згідно API
            const queryParams = {
                skip: params.skip || 0,
                limit: params.limit || 100,
                include_inactive: params.include_inactive || false
            };

            const response = await apiClient.get(
                `/api/v1/categories/${categoryId}/signal-types`,
                { params: queryParams }
            );
            return response.data;
        }
    },

    // Теги
    tags: {
        search: async (params = {}) => {
            const queryParams = {
                page: params.page || 1,
                page_size: params.page_size || 50
            };

            if (params.sort_by !== undefined) {
                queryParams.sort_by = params.sort_by;
            }
            if (params.sort_order !== undefined) {
                queryParams.sort_order = params.sort_order;
            }

            const response = await apiClient.get('/api/v1/search/tags', { params: queryParams });
            return response.data; // SearchResponse
        },
        /**
         * Отримати список всіх тегів
         * @param {Object} params - Параметри запиту
         * @param {number} params.page - Номер сторінки (default: 1)
         * @param {number} params.page_size - Кількість на сторінці (default: 50, max: 200)
         * @param {string} params.name - Фільтр за точною назвою
         * @param {string} params.name_contains - Фільтр за частиною назви
         * @param {string} params.created_at_from - Дата створення від
         * @param {string} params.created_at_to - Дата створення до
         * @param {boolean} params.include_deleted - Включити видалені
         * @param {string} params.sort_by - Поле для сортування
         * @param {string} params.sort_order - Напрямок (ascending/descending)
         * @returns {Promise<Array>} - Масив TagResponse
         */
        list: async (params = {}) => {
            const queryParams = {
                page: params.page || 1,
                page_size: params.page_size || 50
            };

            // Фільтри
            if (params.name !== undefined) queryParams.name = params.name;
            if (params.name_contains !== undefined) queryParams.name_contains = params.name_contains;
            if (params.created_at_from !== undefined) queryParams.created_at_from = params.created_at_from;
            if (params.created_at_to !== undefined) queryParams.created_at_to = params.created_at_to;
            if (params.include_deleted !== undefined) queryParams.include_deleted = params.include_deleted;

            // Сортування
            if (params.sort_by !== undefined) queryParams.sort_by = params.sort_by;
            if (params.sort_order !== undefined) queryParams.sort_order = params.sort_order;

            const response = await apiClient.get('/api/v1/tags/list-all', {
                params: queryParams
            });
            return response.data;
        },

        /**
         * Отримати схему фільтрів для тегів
         * @returns {Promise<Object>} - EntitySchemaInfo
         */
        filterSchema: async () => {
            const response = await apiClient.get('/api/v1/tags/filter-schema');
            return response.data;
        },

        /**
         * Отримати тег за ID
         * @param {number} tagId - ID тегу
         * @returns {Promise<Object>} - TagResponse
         */
        get: async (tagId) => {
            const response = await apiClient.get(`/api/v1/tags/${tagId}`);
            return response.data;
        },

        /**
         * Створити новий тег
         * @param {Object} tagData - Дані тегу
         * @param {string} tagData.name - Назва тегу (required, max 255)
         * @returns {Promise<Object>} - TagResponse
         */
        create: async (tagData) => {
            if (!tagData.name || tagData.name.trim().length === 0) {
                throw new Error('name is required');
            }

            const validatedData = {
                name: tagData.name.trim().substring(0, 255)
            };

            const response = await apiClient.post('/api/v1/tags/create', validatedData);
            return response.data;
        },

        /**
         * Оновити тег
         * @param {number} tagId - ID тегу
         * @param {Object} tagData - Дані для оновлення
         * @param {string} tagData.name - Назва тегу (required, max 255)
         * @returns {Promise<Object>} - TagResponse
         */
        update: async (tagId, tagData) => {
            if (!tagData.name || tagData.name.trim().length === 0) {
                throw new Error('name cannot be empty');
            }

            const validatedData = {
                name: tagData.name.trim().substring(0, 255)
            };

            const response = await apiClient.put(`/api/v1/tags/${tagId}`, validatedData);
            return response.data;
        },

        /**
         * Видалити тег (soft delete)
         * @param {number} tagId - ID тегу
         * @returns {Promise<Object>} - MessageResponse
         */
        delete: async (tagId) => {
            const response = await apiClient.delete(`/api/v1/tags/${tagId}`);
            return response.data;
        }
    },

    // Авторизація
    auth: {
        me: async () => {
            const response = await apiClient.get('/api/v1/auth/me');
            return response.data;
        }
    }
};

// Інформація про режим роботи API
export const getApiMode = () => {
    return {
        isMock: false,
        isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        environment: process.env.NODE_ENV,
        apiBaseUrl: API_BASE_URL || window.location.origin
    };
};

export default apiClient;