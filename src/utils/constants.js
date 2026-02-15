export const USER_ROLES = {
    ADMIN: 'admin',
    OPERATOR: 'operator',
    ANALYST: 'analyst'
};

export const PERMISSIONS = {
    VIEW_OBSERVATIONS: 'view_observations',
    MANAGE_OBSERVATIONS: 'manage_observations',
    VIEW_ANALYTICS: 'view_analytics',
    EXPORT_DATA: 'export_data',
    MANAGE_USERS: 'manage_users',
    MANAGE_POSTS: 'manage_posts',
    SYSTEM_ADMIN: 'system_admin'
};

export const BPLA_TYPES = [
    'FPV дрон',
    'Крило (БПЛА)',
    'Мультикоптер',
    'Гелікоптер',
    'Невідомий тип'
];

export const FREQUENCY_RANGES = [
    { min: 144, max: 148, name: 'VHF (144-148 МГц)' },
    { min: 430, max: 440, name: 'UHF (430-440 МГц)' },
    { min: 2400, max: 2450, name: '2.4 GHz' },
    { min: 5725, max: 5875, name: '5.8 GHz' }
];

export const FILE_UPLOAD = {
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
    ALLOWED_TYPES: ['image/*', 'video/*', 'audio/*']
};