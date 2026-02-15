// Простий конфігураційний файл
export const IS_DEVELOPMENT = process.env.REACT_APP_IS_DEVELOPMENT === 'false' ? false : true;

// Змінна DEVELOP для контролю режиму розробки
export const DEVELOP = process.env.REACT_APP_DEVELOP === 'true' ? true : false;

// URL API залежно від режиму
export const API_URL = IS_DEVELOPMENT
  ? process.env.REACT_APP_API_URL || 'https://localhost:60800'
  : process.env.REACT_APP_API_URL || window.location.origin;

// Mock дані відключені - працюємо тільки з реальним API
export const USE_MOCK_DATA = false;

// Показувати debug інформацію
export const SHOW_DEBUG_INFO = IS_DEVELOPMENT && process.env.REACT_APP_SHOW_DEBUG_INFO !== 'false';