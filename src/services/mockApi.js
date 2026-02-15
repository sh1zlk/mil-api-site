// Mock API клієнт для розробки на localhost
import { useMockData } from '../utils/environment';

const mockUsers = [
    {
        id: 1,
        username: 'admin@radiomonitoring.local',
        username_alias: 'Адміністратор системи',
        email: 'admin@radiomonitoring.local',
        role: 'admin',
        is_active: true,
        post_id: 1,
        permissions: ['view_observations', 'manage_observations', 'view_analytics', 'system_admin', 'manage_users', 'manage_posts'],
        created_at: '2024-01-01T00:00:00Z',
        last_login_at: new Date().toISOString()
    },
    {
        id: 2,
        username: 'operator1@radiomonitoring.local',
        username_alias: 'Оператор 1',
        email: 'operator1@radiomonitoring.local',
        role: 'operator',
        is_active: true,
        post_id: 1,
        permissions: ['view_observations', 'manage_observations', 'view_analytics'],
        created_at: '2024-01-01T00:00:00Z',
        last_login_at: new Date().toISOString()
    },
    {
        id: 3,
        username: 'operator2@radiomonitoring.local',
        username_alias: 'Оператор 2',
        email: 'operator2@radiomonitoring.local',
        role: 'operator',
        is_active: true,
        post_id: 2,
        permissions: ['view_observations', 'manage_observations'],
        created_at: '2024-01-01T00:00:00Z',
        last_login_at: new Date().toISOString()
    }
];

const mockPosts = [
    {
        id: 1,
        name: 'Пост спостереження №1 - Київ',
        code: 'KIEV-001',
        description: 'Центральний пост моніторингу в м. Київ',
        region: 'Київська область',
        is_active: true,
        connection_status: 'online',
        last_connection_at: new Date().toISOString(),
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        name: 'Пост спостереження №2 - Львів',
        code: 'LVIV-001',
        description: 'Західний пост моніторингу в м. Львів',
        region: 'Львівська область',
        is_active: true,
        connection_status: 'online',
        last_connection_at: new Date().toISOString(),
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString()
    }
];

const mockCategories = [
    {
        id: 1,
        name: 'Цивільні сигнали',
        alias: 'CIVIL',
        is_deleted: false
    },
    {
        id: 2,
        name: 'Військові сигнали',
        alias: 'MILITARY',
        is_deleted: false
    },
    {
        id: 3,
        name: 'Комерційні сигнали',
        alias: 'COMMERCIAL',
        is_deleted: false
    }
];

const mockSignalTypes = [
    {
        id: 1,
        code: 'FM',
        name: 'FM Broadcasting',
        category_id: 1,
        description: 'FM радіомовлення',
        is_active: true,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false
    },
    {
        id: 2,
        code: 'AM',
        name: 'Amateur Radio',
        category_id: 1,
        description: 'Аматорське радіо',
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false
    }
];

// Теги
let mockTags = [
    {
        id: 1,
        name: 'Важливо',
        is_deleted: false,
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        name: 'Терміново',
        is_deleted: false,
        created_at: new Date().toISOString()
    },
    {
        id: 3,
        name: 'Перевірено',
        is_deleted: false,
        created_at: new Date().toISOString()
    },
    {
        id: 4,
        name: 'Підозрілий сигнал',
        is_deleted: false,
        created_at: new Date().toISOString()
    },
    {
        id: 5,
        name: 'Потребує аналізу',
        is_deleted: false,
        created_at: new Date().toISOString()
    }
];

const mockObservations = [
    {
        id: 1,
        user_id: 1,
        post_id: 1,
        signal_type_id: 1,
        frequency_min: '87.500',
        frequency_max: '108.000',
        frequency_center: '98.500',
        bandwidth: '20.500',
        observed_at: new Date().toISOString(),
        duration_seconds: 3600,
        comment: 'Тестове спостереження FM діапазону',
        status: 'active',
        confidence_level: 'high',
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        media_ids: [1, 2]  // ❗ ДОДАНО
    },
    {
        id: 2,
        user_id: 2,
        post_id: 1,
        signal_type_id: 2,
        frequency_min: '144.000',
        frequency_max: '146.000',
        frequency_center: '145.000',
        bandwidth: '2.000',
        video_frequency_min: null,
        video_frequency_max: null,
        observed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        duration_seconds: 1800,
        comment: 'Активність в аматорському діапазоні',
        status: 'active',
        confidence_level: 'medium',
        is_deleted: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        media_ids: [3]  // ❗ ДОДАНО
    }
];

// Симуляція затримки мережі
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Симуляція помилок
const simulateError = (errorRate = 0.05) => {
    if (Math.random() < errorRate) {
        throw new Error('Simulated network error');
    }
};

export const mockPublicApi = {
    // Отримання інформації про сертифікат
    getCertificateInfo: async () => {
        await delay(300);
        simulateError(0.02);

        // Симуляція даних сертифіката від nginx
        return {
            certificate_cn: 'admin@radiomonitoring.local',
            certificate_serial: '7149D5B4BB186BDD281C33B64D8E85852A6374AD',
            certificate_fingerprint: '50cc615219b5e4b9adb647ac16509ad7ae5cea82',
            ssl_dn: 'CN=admin@radiomonitoring.local,O=Radio Monitoring,C=UA',
            ssl_issuer: 'CN=Radio Monitoring CA,O=Radio Monitoring,C=UA',
            ssl_verify: 'SUCCESS'
        };
    },

    // Логін через сертифікат
    loginWithCertificate: async (certificateData) => {
        await delay(800);
        simulateError(0.03);

        const { certificate_cn } = certificateData;
        const user = mockUsers.find(u => u.username === certificate_cn);

        if (!user) {
            const error = new Error('User not found');
            error.response = { status: 401 };
            throw error;
        }

        return {
            access_token: `mock_access_token_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            refresh_token: `mock_refresh_token_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            token_type: 'bearer',
            expires_in: 900, // 15 хвилин
            user_id: user.id,
            username: user.username,
            permissions: user.permissions
        };
    },

    // Оновлення токена
    refreshToken: async (refreshToken) => {
        await delay(400);
        simulateError(0.02);

        if (!refreshToken || !refreshToken.startsWith('mock_refresh_token_')) {
            const error = new Error('Invalid refresh token');
            error.response = { status: 401 };
            throw error;
        }

        return {
            access_token: `mock_access_token_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            refresh_token: `mock_refresh_token_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            token_type: 'bearer',
            expires_in: 900
        };
    }
};

export const mockAuthenticatedApi = {
    // Отримання поточного користувача
    getCurrentUser: async () => {
        await delay(200);
        simulateError(0.01);

        return mockUsers[0]; // Повертаємо адміністратора для localhost
    },

    // Вихід
    logout: async (refreshToken) => {
        await delay(300);
        simulateError(0.01);

        return { success: true };
    },

    // Отримання сесій
    getSessions: async () => {
        await delay(300);
        simulateError(0.01);

        // ✅ ВИПРАВЛЕНО: повертаємо об'єкт з масивом sessions
        return {
            sessions: [
                {
                    id: 'session_1',
                    ip_address: '127.0.0.1',
                    user_agent: navigator.userAgent,
                    created_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 900000).toISOString(),
                    last_activity_at: new Date().toISOString()
                }
            ]
        };
    },

    // Користувачі
    users: {
        list: async (params = {}) => {
            await delay(400);
            simulateError(0.02);

            const { page = 1, size = 20 } = params;
            const start = (page - 1) * size;
            const end = start + size;

            return {
                data: mockUsers.slice(start, end),
                total: mockUsers.length,
                page,
                size,
                pages: Math.ceil(mockUsers.length / size)
            };
        },

        get: async (userId) => {
            await delay(200);
            simulateError(0.02);

            const user = mockUsers.find(u => u.id === userId);
            if (!user) {
                const error = new Error('User not found');
                error.response = { status: 404 };
                throw error;
            }
            return user;
        },

        create: async (userData) => {
            await delay(600);
            simulateError(0.05);

            const newUser = {
                id: mockUsers.length + 1,
                ...userData,
                created_at: new Date().toISOString(),
                is_active: true,
                last_login_at: null
            };
            mockUsers.push(newUser);
            return newUser;
        },

        update: async (userId, userData) => {
            await delay(500);
            simulateError(0.03);

            const userIndex = mockUsers.findIndex(u => u.id === userId);
            if (userIndex === -1) {
                const error = new Error('User not found');
                error.response = { status: 404 };
                throw error;
            }

            mockUsers[userIndex] = {
                ...mockUsers[userIndex],
                ...userData,
                updated_at: new Date().toISOString()
            };
            return mockUsers[userIndex];
        },

        roles: {
            list: async (userId) => {
                await delay(300);
                // Повертаємо мок ролі для користувача
                return [
                    { id: 1, name: 'admin', display_name: 'Адміністратор' },
                    { id: 2, name: 'operator', display_name: 'Оператор' }
                ];
            },
            assign: async (userId, roleId) => {
                await delay(300);
                return { id: roleId, name: 'new_role', display_name: 'Нова роль' };
            },
            remove: async (userId, roleId) => {
                await delay(300);
                return { success: true };
            },
            replace: async (userId, roleIds) => {
                await delay(300);
                return roleIds.map(id => ({ id, name: `role_${id}`, display_name: `Роль ${id}` }));
            },
            bulkDelete: async (userId, roleIds) => {
                await delay(300);
                return { success: true };
            }
        }
    },

    // Спостереження
    observations: {
        list: async (params = {}) => {
            await delay(300);
            simulateError(0.02);

            const { skip = 0, limit = 100, post_id, status } = params;
            let filtered = [...mockObservations];

            if (post_id) {
                filtered = filtered.filter(o => o.post_id === post_id);
            }
            if (status) {
                filtered = filtered.filter(o => o.status === status);
            }

            const start = parseInt(skip);
            const end = start + parseInt(limit);

            return {
                data: filtered.slice(start, end),
                total: filtered.length,
                skip,
                limit
            };
        },

        get: async (observationId) => {
            await delay(200);
            simulateError(0.02);

            const observation = mockObservations.find(o => o.id === observationId);
            if (!observation) {
                const error = new Error('Observation not found');
                error.response = { status: 404 };
                throw error;
            }
            return observation;
        },

        create: async (observationData) => {
            await delay(500);
            simulateError(0.03);

            const newObservation = {
                id: mockObservations.length + 1,
                user_id: 1, // Поточний користувач
                ...observationData,
                status: 'active',
                confidence_level: observationData.confidence_level || 'medium',
                is_deleted: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            mockObservations.push(newObservation);
            return newObservation;
        },

        update: async (observationId, observationData) => {
            await delay(400);
            simulateError(0.03);

            const observationIndex = mockObservations.findIndex(o => o.id === observationId);
            if (observationIndex === -1) {
                const error = new Error('Observation not found');
                error.response = { status: 404 };
                throw error;
            }

            mockObservations[observationIndex] = {
                ...mockObservations[observationIndex],
                ...observationData,
                updated_at: new Date().toISOString()
            };
            return mockObservations[observationIndex];
        },

        markDisappeared: async (observationId, disappearedData) => {
            await delay(300);
            simulateError(0.02);

            const observationIndex = mockObservations.findIndex(o => o.id === observationId);
            if (observationIndex === -1) {
                const error = new Error('Observation not found');
                error.response = { status: 404 };
                throw error;
            }

            mockObservations[observationIndex] = {
                ...mockObservations[observationIndex],
                status: 'disappeared',
                disappeared_at: disappearedData.disappeared_at,
                disappeared_by: 1,
                updated_at: new Date().toISOString()
            };
            return { success: true };
        }
    },

    // Пости
    posts: {
        list: async (params = {}) => {
            await delay(300);
            simulateError(0.01);

            const { skip = 0, limit = 100, is_active } = params;
            let filtered = [...mockPosts];

            if (is_active !== undefined) {
                filtered = filtered.filter(p => p.is_active === is_active);
            }

            const start = parseInt(skip);
            const end = start + parseInt(limit);

            return {
                data: filtered.slice(start, end),
                total: filtered.length,
                skip,
                limit
            };
        },

        get: async (postId) => {
            await delay(200);
            simulateError(0.01);

            const post = mockPosts.find(p => p.id === postId);
            if (!post) {
                const error = new Error('Post not found');
                error.response = { status: 404 };
                throw error;
            }
            return post;
        },

        create: async (postData) => {
            await delay(500);
            simulateError(0.03);

            const newPost = {
                id: mockPosts.length + 1,
                ...postData,
                is_active: true,
                connection_status: 'offline',
                last_connection_at: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            mockPosts.push(newPost);
            return newPost;
        }
    },

    // Health check
    health: async () => {
        await delay(100);
        simulateError(0.01);

        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0-mock',
            environment: 'development',
            timezone: 'UTC',
            database: {
                status: 'connected',
                latency: 5
            },
            services: {
                auth: { status: 'healthy' },
                observations: { status: 'healthy' },
                media: { status: 'healthy' }
            }
        };
    }
};

// Higher-order функція для створення API клієнта з автоматичним переключенням
export const createMockApiClient = () => {
    if (!useMockData()) {
        return null;
    }

    console.log('🔧 Using Mock API (localhost mode)');

    return {
        public: mockPublicApi,
        authenticated: mockAuthenticatedApi,
        health: mockAuthenticatedApi.health,
        users: mockAuthenticatedApi.users,
        observations: mockAuthenticatedApi.observations,
        posts: mockAuthenticatedApi.posts,
        // Signal Types
        signalTypes: {
            list: async (params = {}) => {
                await delay(300);
                let filtered = [...mockSignalTypes];

                if (params.category_id !== undefined) {
                    filtered = filtered.filter(st => st.category_id === params.category_id);
                }
                if (!params.include_inactive) {
                    filtered = filtered.filter(st => st.is_active);
                }
                if (!params.include_deleted) {
                    filtered = filtered.filter(st => !st.is_deleted);
                }

                return filtered;
            },
            get: async (signalTypeId) => {
                await delay(200);
                const signalType = mockSignalTypes.find(st => st.id === signalTypeId);
                if (!signalType) throw new Error('Signal type not found');

                // Додаємо category_name
                const category = mockCategories.find(c => c.id === signalType.category_id);
                return {
                    ...signalType,
                    category_name: category?.name || null
                };
            },
            create: async (signalTypeData) => {
                await delay(500);
                const newType = {
                    id: mockSignalTypes.length + 1,
                    ...signalTypeData,
                    is_active: signalTypeData.is_active !== false,
                    sort_order: signalTypeData.sort_order || 0,
                    is_deleted: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                mockSignalTypes.push(newType);
                return newType;
            },
            update: async (signalTypeId, signalTypeData) => {
                await delay(400);
                const index = mockSignalTypes.findIndex(st => st.id === signalTypeId);
                if (index === -1) throw new Error('Signal type not found');
                mockSignalTypes[index] = {
                    ...mockSignalTypes[index],
                    ...signalTypeData,
                    updated_at: new Date().toISOString()
                };
                return mockSignalTypes[index];
            },
            delete: async (signalTypeId) => {
                await delay(300);
                const index = mockSignalTypes.findIndex(st => st.id === signalTypeId);
                if (index === -1) throw new Error('Signal type not found');
                mockSignalTypes[index].is_deleted = true;
                return { message: 'Signal type deleted' };
            }
        },

        // Categories
        categories: {
            list: async (params = {}) => {
                await delay(300);
                return mockCategories.filter(c =>
                    params.include_deleted ? true : !c.is_deleted
                );
            },
            get: async (categoryId) => {
                await delay(200);
                const category = mockCategories.find(c => c.id === categoryId);
                if (!category) throw new Error('Category not found');
                return category;
            },
            create: async (categoryData) => {
                await delay(500);
                const newCategory = {
                    id: mockCategories.length + 1,
                    ...categoryData,
                    is_deleted: false
                };
                mockCategories.push(newCategory);
                return newCategory;
            },
            update: async (categoryId, categoryData) => {
                await delay(400);
                const index = mockCategories.findIndex(c => c.id === categoryId);
                if (index === -1) throw new Error('Category not found');
                mockCategories[index] = { ...mockCategories[index], ...categoryData };
                return mockCategories[index];
            },
            delete: async (categoryId) => {
                await delay(300);
                const index = mockCategories.findIndex(c => c.id === categoryId);
                if (index === -1) throw new Error('Category not found');
                mockCategories[index].is_deleted = true;
                return { message: 'Category deleted' };
            },
            signalTypes: async (categoryId, params = {}) => {
                await delay(300);
                let filtered = mockSignalTypes.filter(st => st.category_id === categoryId);
                if (!params.include_inactive) {
                    filtered = filtered.filter(st => st.is_active);
                }
                return filtered;
            }
        },

        // Roles
        roles: {
            listAllPermissions: async () => {
                await delay(200);
                return [
                    { id: 1, name: 'USER_VIEW' },
                    { id: 2, name: 'USER_MANAGE' },
                    { id: 3, name: 'OBSERVATION_VIEW' },
                    { id: 4, name: 'OBSERVATION_MANAGE' },
                    { id: 5, name: 'POST_VIEW' },
                    { id: 6, name: 'POST_MANAGE' },
                    { id: 7, name: 'ROLE_VIEW' },
                    { id: 8, name: 'ROLE_MANAGE' },
                    { id: 9, name: 'ANALYTICS_VIEW' },
                    { id: 10, name: 'SYSTEM_ADMIN' }
                ];
            }
        },

        // Теги
        tags: {
            list: async (params = {}) => {
                await delay(300);
                let filtered = [...mockTags];

                // Фільтрація за назвою
                if (params.name_contains) {
                    const search = params.name_contains.toLowerCase();
                    filtered = filtered.filter(tag =>
                        tag.name.toLowerCase().includes(search)
                    );
                }
                if (params.name) {
                    filtered = filtered.filter(tag => tag.name === params.name);
                }

                // Фільтрація видалених
                if (!params.include_deleted) {
                    filtered = filtered.filter(tag => !tag.is_deleted);
                }

                // Сортування
                if (params.sort_by === 'name') {
                    filtered.sort((a, b) => {
                        const cmp = a.name.localeCompare(b.name);
                        return params.sort_order === 'descending' ? -cmp : cmp;
                    });
                }

                return filtered;
            },
            filterSchema: async () => {
                await delay(100);
                return {
                    sortable_fields: ['id', 'name', 'created_at'],
                    filter_params: [
                        { name: 'name', type: 'string', description: 'Exact name match' },
                        { name: 'name_contains', type: 'string', description: 'Name contains' },
                        { name: 'include_deleted', type: 'boolean', description: 'Include deleted tags' }
                    ]
                };
            },
            get: async (tagId) => {
                await delay(200);
                const tag = mockTags.find(t => t.id === tagId);
                if (!tag) {
                    const error = new Error('Tag not found');
                    error.response = { status: 404 };
                    throw error;
                }
                return tag;
            },
            create: async (tagData) => {
                await delay(400);
                // Перевірка на дублікат
                const exists = mockTags.some(t =>
                    t.name.toLowerCase() === tagData.name.toLowerCase() && !t.is_deleted
                );
                if (exists) {
                    const error = new Error('Tag already exists');
                    error.response = { status: 409 };
                    throw error;
                }

                const newTag = {
                    id: mockTags.length > 0 ? Math.max(...mockTags.map(t => t.id)) + 1 : 1,
                    name: tagData.name,
                    is_deleted: false,
                    created_at: new Date().toISOString()
                };
                mockTags.push(newTag);
                console.log('[MockAPI] Тег створено:', newTag);
                return newTag;
            },
            update: async (tagId, tagData) => {
                await delay(300);
                const index = mockTags.findIndex(t => t.id === tagId);
                if (index === -1) {
                    const error = new Error('Tag not found');
                    error.response = { status: 404 };
                    throw error;
                }

                // Перевірка на дублікат (крім поточного)
                const exists = mockTags.some(t =>
                    t.id !== tagId &&
                    t.name.toLowerCase() === tagData.name.toLowerCase() &&
                    !t.is_deleted
                );
                if (exists) {
                    const error = new Error('Tag with this name already exists');
                    error.response = { status: 409 };
                    throw error;
                }

                mockTags[index] = {
                    ...mockTags[index],
                    name: tagData.name,
                    updated_at: new Date().toISOString()
                };
                console.log('[MockAPI] Тег оновлено:', mockTags[index]);
                return mockTags[index];
            },
            delete: async (tagId) => {
                await delay(300);
                const index = mockTags.findIndex(t => t.id === tagId);
                if (index === -1) {
                    const error = new Error('Tag not found');
                    error.response = { status: 404 };
                    throw error;
                }

                // Soft delete
                mockTags[index].is_deleted = true;
                mockTags[index].deleted_at = new Date().toISOString();
                console.log('[MockAPI] Тег видалено:', tagId);
                return { message: 'Tag deleted successfully' };
            }
        },

        media: {
            list: async () => {
                await delay(200);
                return [];
            },
            getInfo: async (mediaId) => {
                await delay(200);
                return {
                    id: mediaId,
                    original_filename: 'test.jpg',
                    upload_complete: true,
                    file_size: 1024000,
                    mime_type: 'image/jpeg',
                    media_type: 'image',
                    uploaded_at: new Date().toISOString()
                };
            },
            download: async () => {
                await delay(300);
                return new Blob();
            },
            delete: async () => {
                await delay(200);
                return { success: true };
            },
            statistics: async () => {
                await delay(200);
                return {
                    total_files: 10,
                    used_storage: '100 MB',
                    available_storage: '900 MB'
                };
            },
            uploadComplete: async (observationId, mediaType, file) => {
                await delay(500);
                return {
                    id: Math.floor(Math.random() * 1000),
                    original_filename: file.name,
                    stored_filename: `${Date.now()}_${file.name}`,
                    file_size: file.size,
                    mime_type: file.type,
                    media_type: mediaType,
                    upload_complete: true,
                    uploaded_at: new Date().toISOString()
                };
            },
            listForObservation: async (observationId) => {
                await delay(200);
                return [];
            },
            getThumbnail: async (mediaId) => {
                await delay(200);
                // Повертаємо порожній blob для мініатюри
                return new Blob();
            },
            regenerateThumbnail: async (mediaId) => {
                await delay(300);
                return { success: true, message: 'Thumbnail regenerated' };
            }
        }
    };
};

export default createMockApiClient;