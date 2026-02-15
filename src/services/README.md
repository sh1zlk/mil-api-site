# Система автентифікації на основі SSL сертифікатів

Ця система забезпечує безпечну автентифікацію користувачів через SSL/TLS сертифікати з використанням JWT токенів для сесій.

**🔧 Localhost розробка з автоматичним переключенням на mock дані!**

## Архітектура

### Компоненти

1. **AuthContext** (`src/contexts/AuthContext.js`) - управління станом автентифікації
2. **authService** (`src/services/authService.js`) - взаємодія з API автентифікації
3. **apiClient** (`src/services/apiClient.js`) - HTTP клієнт з автоматичним додаванням Bearer токенів
4. **unifiedApi** (`src/services/unifiedApi.js`) - універсальний API з автоматичним перемиканням mock/real
5. **mockApi** (`src/services/mockApi.js`) - повний набір mock даних для localhost розробки
6. **CertificateCheckModal** (`src/components/CertificateCheckModal.js`) - модальне вікно перевірки сертифіката
7. **ProtectedRoute** (`src/components/ProtectedRoute.js`) - захищені маршрути
8. **DevelopmentIndicator** (`src/components/DevelopmentIndicator.js`) - індикатор режиму розробки
9. **security** (`src/utils/security.js`) - утиліти безпеки
10. **environment** (`src/utils/environment.js`) - детектування середовища

## 🚀 Швидкий старт для Localhost розробки

### Автоматичний режим mock даних
Коли ви працюєте на `localhost`, система автоматично:
- Використовує mock дані для всіх API викликів
- Симулює автентифікацію через SSL сертифікат
- Надає реалістичні тестові дані
- Показує індикатор режиму розробки

### Приклад використання
```jsx
import unifiedApi from './services/unifiedApi';

// Автоматично працює з mock або real API
const observations = await unifiedApi.observations.list();
const users = await unifiedApi.users.list();
const posts = await unifiedApi.posts.list();
```

Детальніше про localhost розробку читайте в [LOCALHOST_DEVELOPMENT.md](../LOCALHOST_DEVELOPMENT.md)

### Процес автентифікації

### Production режим (real domain):
1. **SSL/TLS Handshake**: Nginx перевіряє клієнтський сертифікат
2. **Передача заголовків**: Nginx додає дані сертифіката в HTTP заголовки:
   - `X-SSL-Client-Verify`: SUCCESS/NONE
   - `X-SSL-Client-DN`: Distinguished Name сертифіката
   - `X-SSL-Client-Fingerprint`: Відбиток сертифіката
   - `X-SSL-Client-Serial`: Серійний номер
3. **Отримання даних**: Backend читає ці заголовки і формує дані сертифіката
4. **Автентифікація**: Frontend відправляє дані сертифіката на `POST /api/v1/auth/login`
5. **JWT токени**: Backend повертає access_token та refresh_token
6. **Сесія**: Frontend зберігає токени та використовує їх для API запитів

### Localhost режим (розробка):
1. **Mock дані**: Система автоматично використовує симульовані дані сертифіката
2. **Автентифікація**: Прямий виклик `POST /api/v1/auth/login` з mock даними
3. **JWT токени**: Mock API повертає симульовані токени
4. **Повний функціонал**: Доступні всі API ендпоінти з реалістичними даними

### Доступні API ендпоінти (згідно з OpenAPI):
- `POST /api/v1/auth/login` - автентифікація з сертифікатом
- `POST /api/v1/auth/refresh` - оновлення токена
- `POST /api/v1/auth/logout` - вихід
- `GET /api/v1/auth/me` - інформація про поточного користувача
- `GET /api/v1/auth/sessions` - активні сесії

⚠️ **Важливо:** Ендпоінт `/api/v1/auth/certificate-info` НЕ ІСНУЄ в API. Дані сертифіката передаються через nginx заголовки.

## Налаштування nginx

Ваша конфігурація nginx вже налаштована правильно:

```nginx
ssl_client_certificate /etc/nginx/ssl/rootCA.crt;
ssl_verify_client on;

location /api/ {
    proxy_set_header X-SSL-Client-Verify     $ssl_client_verify;
    proxy_set_header X-SSL-Client-DN         $ssl_client_s_dn;
    proxy_set_header X-SSL-Client-Fingerprint $ssl_client_fingerprint;
    proxy_set_header X-SSL-Client-Serial     $ssl_client_serial;
    # ... інші налаштування
}
```

## Інтеграція в додаток

### 1. Ініціалізація

В `src/index.js` або `src/App.js`:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import { initializeSecurity } from './utils/security';
import App from './App';

// Ініціалізація безпеки
initializeSecurity();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
    </React.StrictMode>
);
```

### 2. Використання в компонентах

```jsx
import React from 'react';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import CertificateCheckModal from './components/CertificateCheckModal';

function App() {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            {/* Модальне вікно перевірки сертифіката */}
            <CertificateCheckModal />

            {/* Захищені маршрути */}
            <ProtectedRoute>
                <Dashboard />
            </ProtectedRoute>

            {/* Захист за правами доступу */}
            <ProtectedRoute requiredPermission="manage_users">
                <UserManagement />
            </ProtectedRoute>
        </div>
    );
}
```

### 3. Використання API

```jsx
import { api } from './services/apiClient';

function Dashboard() {
    const [observations, setObservations] = React.useState([]);

    React.useEffect(() => {
        const loadData = async () => {
            try {
                const data = await api.observations.list();
                setObservations(data);
            } catch (error) {
                console.error('Error loading observations:', error);
            }
        };

        loadData();
    }, []);

    return (
        <div>
            <h1>Dashboard</h1>
            {/* Контент */}
        </div>
    );
}
```

## API ендпоінти

### Публічні ендпоінти (без токена)

- `POST /api/v1/auth/login` - автентифікація через сертифікат
- `POST /api/v1/auth/refresh` - оновлення токена
- `GET /api/v1/auth/certificate-info` - інформація про сертифікат

### Захищені ендпоінти (потребують Bearer токен)

- `GET /api/v1/auth/me` - інформація про поточного користувача
- `POST /api/v1/auth/logout` - вихід
- `GET /api/v1/auth/sessions` - активні сесії
- Всі інші API ендпоінти

## Безпека

### Зберігання токенів

- **Access Token**: зберігається в localStorage (15 хвилин)
- **Refresh Token**: зберігається в sessionStorage (7 днів)
- Автоматичне оновлення токенів кожні 14 хвилин

### Заходи безпеки

1. **HTTPS обов'язковий** для роботи з сертифікатами
2. **CSRF захист** через токени
3. **XSS захист** через санітизацію даних
4. **Vali