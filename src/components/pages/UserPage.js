import React, { useState, useEffect, useCallback } from 'react';
import {
    Upload,
    X,
    Shield,
    Radio,
    Trash2,
    Edit3,
    Check,
    Target,
    Activity,
    Eye,
    Zap,
    Clock,
    FileText,
    AlertTriangle,
    MapPin,
    ChevronDown,
    ChevronUp,
    Image as ImageIcon,
    Video as VideoIcon,
    Music as MusicIcon,
    Download,
    Tag,
    Search
} from 'lucide-react';
import Toast from '../notification/Toast';
import { api } from '../../services/apiClient';
import { useToastContext } from '../../contexts/ToastContext';
import { formatDateUA, formatCurrentTimeUA, getUkrainianTimeForInput, getElapsedTime, calculateDuration, convertUkrainianToUTC, normalizeApiDate, getTodayStartUA, formatDuration } from '../../utils/dateUtils';

// Компонент для відображення мініатюри медіа
const ThumbnailImage = ({ mediaId, media, loadThumbnail }) => {
    const [thumbnailUrl, setThumbnailUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            setLoading(true);
            const url = await loadThumbnail(mediaId);

            if (mounted) {
                if (url) {
                    setThumbnailUrl(url);
                    setError(false);
                } else {
                    setError(true);
                }
                setLoading(false);
            }
        };

        load();

        return () => {
            mounted = false;
        };
    }, [mediaId, loadThumbnail]);

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <div className="w-6 h-6 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !thumbnailUrl) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                {media.media_type === 'video' ? (
                    <VideoIcon className="w-12 h-12 text-gray-500" />
                ) : media.media_type === 'audio' ? (
                    <MusicIcon className="w-12 h-12 text-gray-500" />
                ) : (
                    <ImageIcon className="w-12 h-12 text-gray-500" />
                )}
            </div>
        );
    }

    return (
        <img
            src={thumbnailUrl}
            alt={media.original_filename}
            className="w-full h-full object-cover"
        />
    );
};

// Компонент для відтворення медіа в модальному вікні
const MediaPlayer = ({ media, loadMediaFile, loadThumbnail, thumbnailUrls, onMediaClick }) => {
    const [fullMediaUrl, setFullMediaUrl] = useState(null);
    const [loadingFullMedia, setLoadingFullMedia] = useState(false);
    const [error, setError] = useState(false);
    const [showThumbnail, setShowThumbnail] = useState(true);

    // Отримуємо URL мініатюри з кешу (вона вже завантажена)
    const thumbnailUrl = thumbnailUrls[media.id];

    useEffect(() => {
        let mounted = true;

        const loadFullMedia = async () => {
            setLoadingFullMedia(true);
            const url = await loadMediaFile(media.id);

            if (mounted) {
                if (url) {
                    setFullMediaUrl(url);
                    setError(false);
                    // Коли повне медіа завантажилось, ховаємо мініатюру
                    setShowThumbnail(false);
                } else {
                    setError(true);
                }
                setLoadingFullMedia(false);
            }
        };

        loadFullMedia();

        return () => {
            mounted = false;
        };
    }, [media.id, loadMediaFile]);

    // Для зображень: показуємо мініатюру, потім замінюємо на повне
    if (media.media_type === 'image') {
        return (
            <div className="relative">
                {/* Мініатюра (показується поки завантажується повне зображення) */}
                {showThumbnail && thumbnailUrl && (
                    <div className="relative">
                        <img
                            src={thumbnailUrl}
                            alt={media.original_filename}
                            className="w-full h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ filter: loadingFullMedia ? 'blur(2px)' : 'none' }}
                            onClick={onMediaClick}
                            title="Клікніть, щоб відкрити в повному розмірі"
                        />
                        {loadingFullMedia && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <p className="text-white text-sm">Завантаження повного зображення...</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Повне зображення (показується коли завантажилось) */}
                {!showThumbnail && fullMediaUrl && (
                    <img
                        src={fullMediaUrl}
                        alt={media.original_filename}
                        className="w-full h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={onMediaClick}
                        title="Клікніть, щоб відкрити в повному розмірі"
                    />
                )}

                {/* Помилка */}
                {error && !thumbnailUrl && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <ImageIcon className="w-24 h-24 text-gray-500 mb-4" />
                        <p>Не вдалося завантажити зображення</p>
                    </div>
                )}
            </div>
        );
    }

    // Для відео: показуємо мініатюру поки завантажується
    if (media.media_type === 'video') {
        if (loadingFullMedia) {
            return (
                <div className="relative">
                    {thumbnailUrl ? (
                        <div className="relative">
                            <img
                                src={thumbnailUrl}
                                alt={media.original_filename}
                                className="w-full h-auto rounded"
                                style={{ filter: 'blur(2px)' }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <div className="flex flex-col items-center gap-3">
                                    <VideoIcon className="w-16 h-16 text-white/80" />
                                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <p className="text-white text-sm">Завантаження відео...</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-20">
                            <div className="flex flex-col items-center gap-4">
                                <VideoIcon className="w-16 h-16 text-gray-500" />
                                <div className="w-12 h-12 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                                <p className="text-gray-400">Завантаження відео...</p>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (fullMediaUrl) {
            return (
                <div className="relative w-full">
                    <video
                        src={fullMediaUrl}
                        controls
                        autoPlay
                        className="w-full h-auto rounded cursor-pointer"
                        onClick={onMediaClick}
                        title="Клікніть, щоб відкрити в повному розмірі"
                    >
                        Ваш браузер не підтримує відтворення відео.
                    </video>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <VideoIcon className="w-24 h-24 text-gray-500 mb-4" />
                <p>Не вдалося завантажити відео</p>
            </div>
        );
    }

    // Для аудіо: показуємо іконку і player
    if (media.media_type === 'audio') {
        if (loadingFullMedia) {
            return (
                <div className="flex flex-col items-center justify-center py-12">
                    <MusicIcon className="w-24 h-24 text-gray-500 mb-6" />
                    <div className="w-12 h-12 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400">Завантаження аудіо...</p>
                </div>
            );
        }

        if (fullMediaUrl) {
            return (
                <div className="flex flex-col items-center justify-center py-12">
                    <MusicIcon className="w-24 h-24 text-gray-500 mb-6" />
                    <audio src={fullMediaUrl} controls autoPlay className="w-full max-w-md">
                        Ваш браузер не підтримує відтворення аудіо.
                    </audio>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <MusicIcon className="w-24 h-24 text-gray-500 mb-4" />
                <p>Не вдалося завантажити аудіо</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <FileText className="w-24 h-24 text-gray-500 mb-4" />
            <p>Попередній перегляд недоступний</p>
        </div>
    );
};

// Компонент таймера для активних спостережень
const ActiveTimer = ({ observedAt }) => {
    const [timeString, setTimeString] = useState('');
    const [isUnderMinute, setIsUnderMinute] = useState(true);

    useEffect(() => {
        const updateTimer = () => {
            const { timeString: newTimeString, isUnderMinute: underMinute } = getElapsedTime(observedAt);
            setTimeString(newTimeString);
            return underMinute;
        };

        const underMinute = updateTimer();
        setIsUnderMinute(underMinute);

        // Встановлюємо інтервал: 1 секунда якщо < 1хв, інакше 1 хвилина
        const intervalMs = underMinute ? 1000 : 60000;
        const interval = setInterval(() => {
            const stillUnderMinute = updateTimer();
            setIsUnderMinute(stillUnderMinute);
        }, intervalMs);

        return () => clearInterval(interval);
    }, [observedAt, isUnderMinute]);

    return (
        <span className="text-orange-400 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeString}
        </span>
    );
};
const UserPage = () => {
    const { showSuccess, showError, showWarning, showInfo } = useToastContext();

    // API Base URL
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:60800';

    // Зберігаємо файли окремо від state, бо File objects не серіалізуються
    const filesMapRef = React.useRef(new Map());

    // Ref для синхронізації висоти форми з активними спостереженнями
    const formContainerRef = React.useRef(null);
    const [formHeight, setFormHeight] = useState(null);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

    // Отримання токену авторизації
    const getAuthToken = () => localStorage.getItem('access_token');

    // Хелпер функція для обробки частот (API повертає string, але ми працюємо з numbers)
    const parseFrequency = (freq) => {
        if (freq === null || freq === undefined || freq === '') return null;
        const num = parseFloat(freq);
        return isNaN(num) ? null : num;
    };

    // Форматування частоти для відображення
    const formatFrequency = (freq) => {
        const num = parseFrequency(freq);
        return num !== null ? num.toFixed(3) : 'N/A';
    };

    const statusText = {'active': 'Активний', 'disappeared': 'Неактивний'}
    const confidenceLevelText = {'low': 'Низький', 'medium': 'Середній', 'high': 'Високий'}
    // Стан форми реєстрації спостереження - відповідає ObservationCreate схемі
    const [formData, setFormData] = useState({
        post_id: null,
        signal_type_id: 1,
        frequency_min: '',
        frequency_max: '',
        video_frequency_min: '', // Додано для відео частоти
        video_frequency_max: '', // Додано для відео частоти
        observed_at: getUkrainianTimeForInput(), // для datetime-local input (український час)
        duration_seconds: '',
        signal_strength: '',
        modulation_type_id: null,
        comment: '',
        confidence_level: 'medium',
        tag_ids: [], // Теги для спостереження

        files: [] // Додано для файлів
    });

    // Стан для довідкових даних
    const [posts, setPosts] = useState([]);
    const [signalTypes, setSignalTypes] = useState([]);
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Стан активних елементів та записів
    const [editingElement, setEditingElement] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [activeElements, setActiveElements] = useState([]);
    const [userRecords, setUserRecords] = useState([]);
    const [editingRecord, setEditingRecord] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Стан для пагінації неактивних записів
    const [recordsOffset, setRecordsOffset] = useState(0);
    const [recordsLimit] = useState(50);
    const [hasMoreRecords, setHasMoreRecords] = useState(true);
    const [loadingMoreRecords, setLoadingMoreRecords] = useState(false);
    const [todayRecordsLoaded, setTodayRecordsLoaded] = useState(false); // Чи завантажені сьогоднішні записи
    const [showingTodayOnly, setShowingTodayOnly] = useState(true); // Показуємо тільки сьогоднішні
    const [uploadProgress, setUploadProgress] = useState({});
    const [currentUser, setCurrentUser] = useState(null);

    // Стани для медіа та розгорнутих спостережень
    const [expandedObservations, setExpandedObservations] = useState(new Set());
    const [observationMedia, setObservationMedia] = useState({});
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [loadingMedia, setLoadingMedia] = useState({});
    const [thumbnailUrls, setThumbnailUrls] = useState({}); // Кеш blob URLs для мініатюр
    const [mediaUrls, setMediaUrls] = useState({}); // Кеш blob URLs для повних медіа

    // Стани для drag & drop та модального вікна
    const [isDragging, setIsDragging] = useState(false);
    const [confirmDeleteModal, setConfirmDeleteModal] = useState({ show: false, observationId: null });

    // Стани для тегів
    const [availableTags, setAvailableTags] = useState([]);
    const [tagsLoading, setTagsLoading] = useState(false);
    const [tagSearchQuery, setTagSearchQuery] = useState('');
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [editTagSearchQuery, setEditTagSearchQuery] = useState('');
    const [showEditTagDropdown, setShowEditTagDropdown] = useState(false);
    const [recordsTagFilter, setRecordsTagFilter] = useState([]); // Фільтр по тегах для списку спостережень
    const [showRecordsTagDropdown, setShowRecordsTagDropdown] = useState(false);
    const [recordsTagSearchQuery, setRecordsTagSearchQuery] = useState('');

    // Стани для результатів пошуку по тегах
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState(null);

    // Автоматичний вхід при завантаженні, якщо немає токена
    const token = getAuthToken();
    useEffect(() => {
        if (!token && !loading) {
            testLogin();
        }
    }, [token, loading]);

    // Отримання даних поточного користувача
    const
        fetchCurrentUser = useCallback(async () => {
        try {
            const response = await apiRequest('/api/v1/auth/me');
            setCurrentUser(response);

            // Встановлюємо пост користувача як пост за замовчуванням
            console.log(response)
            if (!formData.post_id) {
                setFormData(prev => ({ ...prev, post_id: response.post_id }));
                console.log('[+] Встановлено пост користувача за замовчуванням:', response.post_id);
            }

            console.log('[+] Поточний користувач:', response);
        } catch (error) {
            console.error('Помилка отримання даних користувача:', error);
        }
    }, [formData.post_id]);

    // Функції для Toast
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const closeToast = useCallback(() => {
        setToast(null);
    }, []);


    const testLogin = async () => {
        setLoading(true);
        try {
            const loginData = {
                certificate_cn: "admin@radiomonitoring.local",
                certificate_serial: "ABC123DEF456",
                certificate_fingerprint: "12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78"
            };

            console.log('[+] Спроба автентифікації з PKI credentials:', loginData);

            const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            if (response.ok) {
                const responseText = await response.text();
                if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
                    throw new Error('Сервер повернув HTML сторінку замість JSON відповіді');
                }

                const result = JSON.parse(responseText);

                if (result.access_token) {
                    localStorage.setItem('access_token', result.access_token);
                    console.log('[+] Access token збережено');
                }

                if (result.refresh_token) {
                    localStorage.setItem('refresh_token', result.refresh_token);
                    console.log('[+] Refresh token збережено');
                }

                showToast(`Успішно авторизовано!\nКористувач: ${result.username || 'N/A'}\nID: ${result.user_id || 'N/A'}`, 'success');

                // Перезавантажуємо дані після авторизації
                await initializeData();

            } else {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
        } catch (error) {
            console.error('Помилка автентифікації:', error);

            // У випадку помилки створюємо фейковий токен для тестування UI
            const fakeToken = 'fake-user-token-' + Date.now();
            localStorage.setItem('access_token', fakeToken);

            showToast('API недоступний. Створено тестовий токен для роботи з UI.\n\nПомилка: ' + error.message, 'error');

            // Завантажуємо мок дані
            await initializeData();
        } finally {
            setLoading(false);
        }
    };

    // Функція для API запитів
    const apiRequest = async (endpoint, options = {}) => {
        const token = getAuthToken();
        const url = `${API_BASE_URL}${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('access_token');
                    return;
                }

                // Покращена обробка помилок з детальною інформацією
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = { detail: `HTTP ${response.status}: ${response.statusText}` };
                }

                // Логування детальної інформації про помилку
                console.error(`API Error Details:`, {
                    status: response.status,
                    statusText: response.statusText,
                    url: url,
                    errorData: errorData,
                    requestHeaders: defaultOptions.headers,
                    requestMethod: options.method || 'GET'
                });

                // Обробка валідаційних помилок (422)
                if (response.status === 422 && errorData.detail && Array.isArray(errorData.detail)) {
                    const validationErrors = errorData.detail.map(err =>
                        `${err.loc?.join(' → ') || 'Field'}: ${err.msg}`
                    ).join(', ');
                    throw new Error(`Validation Error: ${validationErrors}`);
                }

                throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return response;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    };

    // Завантаження постів
    const fetchPosts = useCallback(async () => {
        try {
            let data;

            if (currentUser && currentUser.post_id) {
                data = [await apiRequest(`/api/v1/posts/${currentUser.post_id}`)];
            } else {
                data = await apiRequest(`/api/v1/posts/?is_active=true`);
            }

            setPosts(data);

            if (!formData.post_id) {
                console.log(currentUser)
                if (currentUser && currentUser.post_id) {
                    setFormData(prev => ({...prev, post_id: currentUser.post_id}));
                } else {
                    console.error("Failed set post_id")
                }
            }

            // const data = await apiRequest('/api/v1/posts/?is_active=true');
            // setPosts(data);
            //
            // if (data.length > 0 && !formData.post_id) {
            //     setFormData(prev => ({ ...prev, post_id: data[0].id }));
            // }
            // console.log(formData)
        } catch (error) {
            console.error('Помилка завантаження постів:', error);
        }
    }, [formData.post_id, currentUser]);

    // Завантаження типів сигналів з API
    const fetchSignalTypes = useCallback(async () => {
        try {
            const types = await api.signalTypes.list({ page: 1, page_size: 100 });
            setSignalTypes(types);
        } catch (error) {
            console.error('Помилка завантаження типів сигналів:', error);
            setSignalTypes([]);
        }
    }, []);

    // Завантаження тегів з API (через search endpoint, доступний для всіх користувачів)
    const fetchTags = useCallback(async () => {
        setTagsLoading(true);
        try {
            const response = await apiRequest('/api/v1/search/tags?page=1&page_size=200');
            const tags = response.items || response || [];
            setAvailableTags(tags);
            console.log('[+] Теги завантажено:', tags.length);
        } catch (error) {
            console.error('Помилка завантаження тегів:', error);
            setAvailableTags([]);
        } finally {
            setTagsLoading(false);
        }
    }, []);

    // Пошук спостережень по тегах через API
    const searchObservationsByTags = useCallback(async () => {
        if (recordsTagFilter.length === 0) {
            setSearchResults([]);
            return;
        }

        setSearchLoading(true);
        setSearchError(null);

        try {
            const params = new URLSearchParams({
                tag_ids: recordsTagFilter.join(','),
                page: 1,
                page_size: 100,
                sort_by: 'created_at',
                sort_order: 'descending'
            });

            const response = await apiRequest(`/api/v1/search/observations?${params.toString()}`);
            const results = response.items || response || [];

            setSearchResults(results);
            console.log('[+] Знайдено спостережень по тегах:', results.length);
        } catch (error) {
            console.error('Помилка пошуку по тегах:', error);
            setSearchError('Помилка пошуку спостережень');
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    }, [recordsTagFilter]);

    // Завантаження користувачів
    const fetchUsers = useCallback(async () => {
        setUsersLoading(true);
        try {
            // Додаємо невелику затримку для уникнення race conditions
            await new Promise(resolve => setTimeout(resolve, 500));

            const data = await apiRequest('/api/v1/users/?size=100');
            setUsers(data);
        } catch (error) {
            console.error('Помилка завантаження користувачів:', error);
            // Mock дані користувачів
            setUsers([
                { id: 1, username: 'operator1', username_alias: 'Оператор 1' },
                { id: 2, username: 'admin', username_alias: 'Адміністратор' },
                { id: 3, username: 'analyst1', username_alias: 'Аналітик 1' }
            ]);
        } finally {
            setUsersLoading(false);
        }
    }, []);

    // Завантаження активних спостережень
    const fetchActiveElements = useCallback(async () => {
        if (!formData.post_id) return;

        try {
            const data = await apiRequest(`/api/v1/observations/list-all?post_id=${formData.post_id}&status=active`);
            // Сортуємо від нових до старих (нормалізуємо дати з API як UTC)
            const sortedData = data.sort((a, b) => {
                const dateA = normalizeApiDate(a.observed_at || a.created_at);
                const dateB = normalizeApiDate(b.observed_at || b.created_at);
                return dateB - dateA; // Від нового до старого
            });
            setActiveElements(sortedData);
            console.log(sortedData)
        } catch (error) {
            console.error('Помилка завантаження активних елементів:', error);
        }
    }, [formData.post_id]);

    // Хелпер для отримання початку сьогоднішнього дня (український час)
    const getTodayStart = useCallback(() => {
        return getTodayStartUA();
    }, []);

    // Хелпер для сортування записів по даті створення (найновіші зверху)
    const sortByCreatedAt = useCallback((records) => {
        return [...records].sort((a, b) => {
            const dateA = normalizeApiDate(a.created_at || a.observed_at || 0);
            const dateB = normalizeApiDate(b.created_at || b.observed_at || 0);
            return dateB - dateA; // Від найновішого до найстаршого
        });
    }, []);

    // Завантаження власних записів (неактивні) - тільки сьогоднішні
    const fetchTodayRecords = useCallback(async () => {
        try {
            if (!currentUser || !currentUser.post_id) {
                console.warn('Cannot fetch today records: currentUser or post_id is missing', currentUser);
                setUserRecords([]);
                setHasMoreRecords(false);
                return;
            }

            // Завантажуємо всі записи для фільтрації сьогоднішніх
            const params = new URLSearchParams({
                post_id: currentUser.post_id,
                status: 'disappeared',
                page: 1,
                page_size: 200 // max allowed per API
            });

            const data = await apiRequest(`/api/v1/observations/list-all?${params.toString()}`);
            const today = getTodayStart();

            // Фільтруємо тільки закриті сьогодні (нормалізуємо дати з API)
            const todayRecords = data.filter(record => {
                const disappearedAt = record.disappeared_at ? normalizeApiDate(record.disappeared_at) : null;
                return disappearedAt && disappearedAt >= today;
            });

            // Сортуємо по даті створення (найновіші зверху)
            const sortedData = sortByCreatedAt(todayRecords);

            setUserRecords(sortedData);
            setTodayRecordsLoaded(true);
            setShowingTodayOnly(true);
            // Є ще записи якщо загальна кількість більша за сьогоднішні
            setHasMoreRecords(data.length > todayRecords.length);

            console.log(`[+] Завантажено ${sortedData.length} сьогоднішніх записів (всього: ${data.length})`);
        } catch (error) {
            console.error('Помилка завантаження сьогоднішніх записів:', error);
            setUserRecords([]);
            setHasMoreRecords(false);
        }
    }, [currentUser, getTodayStart, sortByCreatedAt]);

    // Завантаження всіх записів (включаючи минулі дні) з пагінацією
    const fetchUserRecords = useCallback(async (offset = 0, append = false) => {
        try {
            if (!currentUser || !currentUser.post_id) {
                console.warn('Cannot fetch user records: currentUser or post_id is missing', currentUser);
                setUserRecords([]);
                setHasMoreRecords(false);
                return;
            }

            // Конвертуємо offset в page: offset=0 → page=1, offset=50 → page=2
            const page = Math.floor(offset / recordsLimit) + 1;
            const params = new URLSearchParams({
                post_id: currentUser.post_id,
                status: 'disappeared',
                page: page,
                page_size: recordsLimit
            });

            const data = await apiRequest(`/api/v1/observations/list-all?${params.toString()}`);
            const today = getTodayStart();

            // Розділяємо на сьогоднішні та минулі (нормалізуємо дати з API)
            const todayRecords = [];
            const pastRecords = [];

            data.forEach(record => {
                const disappearedAt = record.disappeared_at ? normalizeApiDate(record.disappeared_at) : null;
                if (disappearedAt && disappearedAt >= today) {
                    todayRecords.push(record);
                } else {
                    pastRecords.push(record);
                }
            });

            // Сортуємо обидва масиви по даті створення
            const sortedTodayRecords = sortByCreatedAt(todayRecords);
            const sortedPastRecords = sortByCreatedAt(pastRecords);

            // Об'єднуємо: спочатку сьогоднішні, потім минулі
            const sortedData = [...sortedTodayRecords, ...sortedPastRecords];

            if (append) {
                setUserRecords(prev => {
                    // При append додаємо нові записи до існуючих
                    const existingIds = new Set(prev.map(r => r.id));
                    const newRecords = sortedData.filter(r => !existingIds.has(r.id));

                    // Розділяємо існуючі записи (нормалізуємо дати)
                    const existingToday = prev.filter(r => {
                        const d = r.disappeared_at ? normalizeApiDate(r.disappeared_at) : null;
                        return d && d >= today;
                    });
                    const existingPast = prev.filter(r => {
                        const d = r.disappeared_at ? normalizeApiDate(r.disappeared_at) : null;
                        return !d || d < today;
                    });

                    // Розділяємо нові записи (нормалізуємо дати)
                    const newToday = newRecords.filter(r => {
                        const d = r.disappeared_at ? normalizeApiDate(r.disappeared_at) : null;
                        return d && d >= today;
                    });
                    const newPast = newRecords.filter(r => {
                        const d = r.disappeared_at ? normalizeApiDate(r.disappeared_at) : null;
                        return !d || d < today;
                    });

                    // Об'єднуємо і сортуємо по даті створення
                    const allToday = sortByCreatedAt([...existingToday, ...newToday]);
                    const allPast = sortByCreatedAt([...existingPast, ...newPast]);

                    return [...allToday, ...allPast];
                });
            } else {
                setUserRecords(sortedData);
            }

            setShowingTodayOnly(false);
            setHasMoreRecords(data.length === recordsLimit);

            console.log(`[+] Завантажено ${data.length} записів (offset: ${offset}, today: ${todayRecords.length}, past: ${pastRecords.length})`);
        } catch (error) {
            console.error('Помилка завантаження записів:', error);
            if (!append) {
                setUserRecords([]);
            }
            setHasMoreRecords(false);
        }
    }, [currentUser, recordsLimit, getTodayStart, sortByCreatedAt]);

    // Завантаження наступної порції записів (або перехід від сьогоднішніх до всіх)
    const loadMoreRecords = async () => {
        if (loadingMoreRecords || !hasMoreRecords) {
            return;
        }

        setLoadingMoreRecords(true);

        try {
            if (showingTodayOnly) {
                // Переходимо від сьогоднішніх до завантаження всіх записів
                await fetchUserRecords(0, false);
                setRecordsOffset(0);
            } else {
                // Продовжуємо пагінацію
                const newOffset = recordsOffset + recordsLimit;
                setRecordsOffset(newOffset);
                await fetchUserRecords(newOffset, true);
            }
        } catch (error) {
            console.error('Помилка завантаження додаткових записів:', error);
        } finally {
            setLoadingMoreRecords(false);
        }
    };

    // Блокування недопустимих символів у полях частот (-, e, E, +)
    const handleFrequencyKeyDown = (e) => {
        if (['-', 'e', 'E', '+'].includes(e.key)) {
            e.preventDefault();
        }
    };

    // Валідація введення частоти - тільки позитивні числа
    const handleFrequencyChange = (e, setter, field) => {
        const value = e.target.value;
        // Дозволяємо тільки цифри та одну крапку
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setter(prev => ({ ...prev, [field]: value }));
        }
    };

    // Обробка завантаження файлів
    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files);

        for (const file of files) {
            const fileId = Date.now() + Math.random();

            // Перевірка типу файлу
            const allowedTypes = ['image/', 'video/'];
            const isAllowed = allowedTypes.some(type => file.type.startsWith(type));

            if (!isAllowed) {
                showToast(`Файл ${file.name} має непідтримуваний формат. Підтримуються: зображення, відео, аудіо.`, 'warning');
                continue;
            }

            // Перевірка розміру (макс 100MB для демонстрації)
            if (file.size > 100 * 1024 * 1024) {
                showToast(`Файл ${file.name} занадто великий. Максимальний розмір: 100MB`, 'warning');
                continue;
            }

            // Зберігаємо File object в ref (не серіалізується)
            filesMapRef.current.set(fileId, file);

            // В state зберігаємо тільки метадані
            const fileData = {
                id: fileId,
                name: file.name,
                size: file.size,
                type: file.type,
                uploadProgress: 0
            };

            setFormData(prev => ({
                ...prev,
                files: [...prev.files, fileData]
            }));

            // Симуляція завантаження
            simulateFileUpload(fileId);
        }
    };

    // Симуляція прогресу завантаження
    const simulateFileUpload = async (fileId) => {
        for (let progress = 0; progress <= 100; progress += 10) {
            setUploadProgress(prev => ({
                ...prev,
                [fileId]: progress
            }));
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    };

    // Видалення файлу
    const removeFile = (fileId) => {
        // Видаляємо з Map
        filesMapRef.current.delete(fileId);

        // Видаляємо з state
        setFormData(prev => ({
            ...prev,
            files: prev.files.filter(file => file.id !== fileId)
        }));
        setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
        });
    };

    // Обробники drag & drop
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);

        for (const file of files) {
            const fileId = Date.now() + Math.random();

            // Перевірка типу файлу
            const allowedTypes = ['image/', 'video/'];
            const isAllowed = allowedTypes.some(type => file.type.startsWith(type));

            if (!isAllowed) {
                showToast(`Файл ${file.name} має непідтримуваний формат. Підтримуються: зображення, відео, аудіо.`, 'warning');
                continue;
            }

            // Перевірка розміру (макс 100MB)
            if (file.size > 100 * 1024 * 1024) {
                showToast(`Файл ${file.name} занадто великий. Максимальний розмір: 100MB`, 'warning');
                continue;
            }

            // Зберігаємо File object в ref
            filesMapRef.current.set(fileId, file);

            // В state зберігаємо тільки метадані
            const fileData = {
                id: fileId,
                name: file.name,
                size: file.size,
                type: file.type,
                uploadProgress: 0
            };

            setFormData(prev => ({
                ...prev,
                files: [...prev.files, fileData]
            }));

            // Симуляція завантаження
            simulateFileUpload(fileId);
        }
    };

    // Ініціалізація даних
    const initializeData = async () => {
        setLoading(true);
        try {
            // Очищуємо стан
            setPosts([]);
            setSignalTypes([]);
            setUsers([]);
            setActiveElements([]);
            setUserRecords([]);

            // 1️⃣ СПОЧАТКУ отримуємо поточного користувача
            let currentUserData = null;
            try {
                currentUserData = await apiRequest('/api/v1/auth/me');
                setCurrentUser(currentUserData);
                console.log('[+] Поточний користувач:', currentUserData);
            } catch (err) {
                console.error('Failed to fetch current user:', err);
                setCurrentUser(null);
            }

            // 2️⃣ ТІЛЬКИ потім завантажуємо пости (використовуємо currentUserData, а не currentUser)
            if (currentUserData && currentUserData.post_id) {
                try {
                    const postData = await apiRequest(`/api/v1/posts/${currentUserData.post_id}`);
                    setPosts([postData]);
                    setFormData(prev => ({ ...prev, post_id: currentUserData.post_id }));
                    console.log('[+] Пост завантажено:', postData.id);
                } catch (err) {
                    console.error('Failed to fetch posts:', err);
                    setPosts([]);
                }
            }

            // 3️⃣ Паралельно завантажуємо довідкові дані
            await Promise.all([
                (async () => {
                    try {
                        const types = await api.signalTypes.list({ page: 1, page_size: 100 });
                        setSignalTypes(types);
                    } catch (err) {
                        console.error('Failed to fetch signal types:', err);
                        setSignalTypes([]);
                    }
                })(),
                (async () => {
                    try {
                        // Використовуємо search endpoint який доступний для звичайних користувачів
                        const response = await apiRequest('/api/v1/search/tags?page=1&page_size=200');
                        const tags = response.items || response || [];
                        setAvailableTags(tags);
                        console.log('[+] Теги завантажено:', tags.length);
                    } catch (err) {
                        console.error('Failed to fetch tags:', err);
                        setAvailableTags([]);
                    }
                })(),
                (async () => {
                    try {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        const usersData = await apiRequest('/api/v1/users/?size=100');
                        setUsers(usersData);
                    } catch (err) {
                        console.error('Failed to fetch users:', err);
                        setUsers([]);
                    }
                })(),
            ]);

            // 4️⃣ НАПРИКІНЦІ завантажуємо записи користувача (спочатку тільки сьогоднішні)
            if (currentUserData && currentUserData.post_id) {
                try {
                    const params = new URLSearchParams({
                        post_id: currentUserData.post_id,
                        status: 'disappeared',
                        page: 1,
                        page_size: 200 // max allowed per API
                    });

                    const recordsData = await apiRequest(`/api/v1/observations/list-all?${params.toString()}`);

                    // Фільтруємо тільки закриті сьогодні (український час)
                    const today = getTodayStartUA();

                    const todayRecords = recordsData.filter(record => {
                        const disappearedAt = record.disappeared_at ? normalizeApiDate(record.disappeared_at) : null;
                        return disappearedAt && disappearedAt >= today;
                    });

                    // Сортуємо по даті створення (найновіші зверху, нормалізуємо дати)
                    const sortedRecords = [...todayRecords].sort((a, b) => {
                        const dateA = normalizeApiDate(a.created_at || a.observed_at || 0);
                        const dateB = normalizeApiDate(b.created_at || b.observed_at || 0);
                        return dateB - dateA;
                    });

                    setUserRecords(sortedRecords);
                    setTodayRecordsLoaded(true);
                    setShowingTodayOnly(true);
                    // Є ще записи якщо загальна кількість більша за сьогоднішні
                    // Або якщо сьогоднішніх немає, але є інші записи
                    setHasMoreRecords(recordsData.length > todayRecords.length || (todayRecords.length === 0 && recordsData.length > 0));
                    setRecordsOffset(0);
                    console.log(`[+] Завантажено ${sortedRecords.length} сьогоднішніх записів (всього: ${recordsData.length})`);
                } catch (err) {
                    console.error('Failed to fetch user records:', err);
                    setUserRecords([]);
                    setHasMoreRecords(false);
                    setTodayRecordsLoaded(false);
                    setShowingTodayOnly(true);
                }
            }

        } catch (error) {
            console.error('Initialization error:', error);
            setError('Помилка ініціалізації даних: ' + error.message);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        // Перевіряємо чи є токен, якщо немає - показуємо кнопку логіну
        const token = getAuthToken();
        if (!token) {
            setLoading(false);
            return;
        }

        initializeData();
    }, []);

    // Завантаження активних елементів при зміні поста
    useEffect(() => {
        if (formData.post_id) {
            fetchActiveElements();
        }
    }, [formData.post_id, fetchActiveElements]);

    // Автооновлення кожну хвилину
    useEffect(() => {
        const interval = setInterval(fetchActiveElements, 30000);
        return () => clearInterval(interval);
    }, [fetchActiveElements]);

    // Оновлення часу кожну секунду
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date()); }, 1000);
    return () => clearInterval(interval);
    }, []);

    // Синхронізація висоти "Активних спостережень" з висотою форми
    useEffect(() => {
        const updateFormHeight = () => {
            if (formContainerRef.current) {
                const height = formContainerRef.current.offsetHeight;
                if (height > 0) {
                    setFormHeight(height);
                }
            }
            setIsDesktop(window.innerWidth >= 1024);
        };

        // Початкове вимірювання з затримкою щоб форма встигла відрендеритись
        updateFormHeight();

        // Додаткові вимірювання для гарантії правильної висоти після повного рендеру
        const timer1 = setTimeout(updateFormHeight, 100);
        const timer2 = setTimeout(updateFormHeight, 300);
        const timer3 = setTimeout(updateFormHeight, 500);

        // Використовуємо ResizeObserver для відстеження змін розміру
        const resizeObserver = new ResizeObserver(updateFormHeight);
        if (formContainerRef.current) {
            resizeObserver.observe(formContainerRef.current);
        }

        // Також слухаємо зміну розміру вікна
        window.addEventListener('resize', updateFormHeight);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            resizeObserver.disconnect();
            window.removeEventListener('resize', updateFormHeight);
        };
    }, []);

    // Оновлення висоти форми після завантаження даних
    useEffect(() => {
        if (formContainerRef.current && !loading) {
            const timer = setTimeout(() => {
                const height = formContainerRef.current?.offsetHeight;
                if (height && height > 0) {
                    setFormHeight(height);
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [loading, posts, signalTypes, availableTags]);

    // Пошук спостережень по тегах при зміні фільтра
    useEffect(() => {
        searchObservationsByTags();
    }, [recordsTagFilter, searchObservationsByTags]);

    // Автооновлення observed_at відключено - це поле має встановлюватися лише при створенні
    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         setFormData(prev => ({
    //             ...prev,
    //             observed_at: getUkrainianTimeForInput()
    //         }));
    //     }, 5000); // оновлювати кожні 5 секунд
    //     return () => clearInterval(interval);
    // }, []);


    // Створення нового спостереження
    const handleSubmit = async () => {
        // Валідація
        console.log(formData)
        if (!formData.post_id) {
            showToast('Оберіть пост', 'warning');
            return;
        }

        if (!formData.signal_type_id) {
            showToast('Оберіть тип сигналу', 'warning');
            return;
        }

        // Перевірка: потрібна або частота, або відео частота, або обидві
        const hasFrequency = formData.frequency_min && formData.frequency_max;
        const hasVideoFrequency = formData.video_frequency_min && formData.video_frequency_max;

        if (!hasFrequency && !hasVideoFrequency) {
            showToast('Вкажіть діапазон частот або діапазон відео частот (або обидва)', 'error');
            return;
        }

        // Валідація звичайних частот (якщо задані)
        if (hasFrequency) {
            if (parseFloat(formData.frequency_min) >= parseFloat(formData.frequency_max)) {
                showToast('Мінімальна частота повинна бути менше максимальної', 'warning');
                return;
            }
        }

        // Валідація відео частот (якщо задані)
        if (hasVideoFrequency) {
            if (parseFloat(formData.video_frequency_min) >= parseFloat(formData.video_frequency_max)) {
                showToast('Мінімальна відео частота повинна бути менше максимальної', 'warning');
                return;
            }
        }

        // Перевірка неповних діапазонів
        if ((formData.frequency_min && !formData.frequency_max) || (!formData.frequency_min && formData.frequency_max)) {
            showToast('Заповніть обидва поля діапазону частот', 'warning');
            return;
        }

        if ((formData.video_frequency_min && !formData.video_frequency_max) || (!formData.video_frequency_min && formData.video_frequency_max)) {
            showToast('Заповніть обидва поля діапазону відео частот', 'warning');
            return;
        }

        setIsSubmitting(true);

        try {
            // Підготовка даних згідно з ObservationCreate схемою
            // observed_at конвертується з українського часу в UTC для сервера
            const observationData = {
                post_id: parseInt(formData.post_id),
                signal_type_id: parseInt(formData.signal_type_id),
                frequency_min: formData.frequency_min ? parseFloat(formData.frequency_min) : null,
                frequency_max: formData.frequency_max ? parseFloat(formData.frequency_max) : null,
                video_frequency_min: formData.video_frequency_min ? parseFloat(formData.video_frequency_min) : null,
                video_frequency_max: formData.video_frequency_max ? parseFloat(formData.video_frequency_max) : null,
                observed_at: convertUkrainianToUTC(getUkrainianTimeForInput()),
                duration_seconds: formData.duration_seconds ? parseInt(formData.duration_seconds) : null,
                signal_strength: formData.signal_strength ? parseFloat(formData.signal_strength) : null,
                modulation_type_id: formData.modulation_type_id ? parseInt(formData.modulation_type_id) : null,
                comment: formData.comment.trim() || null,
                confidence_level: formData.confidence_level,
                tag_ids: formData.tag_ids.length > 0 ? formData.tag_ids : null
            };

            // Спробуємо відправити до реального API
            try {
                const response = await apiRequest('/api/v1/observations/create', {
                    method: 'POST',
                    body: JSON.stringify(observationData)
                });
                console.log('Спостереження створено через API:', response);
                console.log('response.id:', response.id);
                console.log('formData.files.length:', formData.files.length);

                // Завантаження медіа файлів
                if (formData.files.length > 0) {
                    if (!response.id) {
                        console.error('❌ response.id відсутній! Не можу завантажити файли.');
                        showToast('Помилка: не отримано ID спостереження для завантаження файлів', 'error');
                    } else {
                        console.log(`📤 Початок завантаження ${formData.files.length} файлів на сервер...`);

                        for (const fileData of formData.files) {
                            try {
                                console.log(`📁 Завантаження файлу: ${fileData.name} (${(fileData.size / 1024 / 1024).toFixed(2)}MB)`);

                                // Отримуємо реальний File object з Map
                                const actualFile = filesMapRef.current.get(fileData.id);
                                if (!actualFile) {
                                    console.error(`❌ File object не знайдено для ${fileData.name}`);
                                    showToast(`Помилка: файл ${fileData.name} втрачено`, 'error');
                                    continue;
                                }

                                console.log(`📄 File object отримано:`, {
                                    name: actualFile.name,
                                    size: actualFile.size,
                                    type: actualFile.type,
                                    isFile: actualFile instanceof File
                                });

                                // Визначаємо тип медіа на основі MIME type
                                let mediaType = 'image';
                                if (fileData.type.startsWith('video/')) {
                                    mediaType = 'video';
                                } else if (fileData.type.startsWith('audio/')) {
                                    mediaType = 'audio';
                                }

                                console.log(`📋 Тип медіа: ${mediaType}, MIME: ${fileData.type}`);

                                // Перевіряємо розмір файлу (макс 100MB)
                                const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

                                if (fileData.size > MAX_FILE_SIZE) {
                                    console.warn(`⚠️ Файл ${fileData.name} занадто великий (${(fileData.size / 1024 / 1024).toFixed(2)}MB), максимум 100MB`);
                                    showToast(`Файл ${fileData.name} занадто великий. Максимальний розмір: 100MB`, 'error');
                                } else {
                                    console.log(`🚀 Завантаження файлу (${(fileData.size / 1024 / 1024).toFixed(2)}MB)`);

                                    const uploadResult = await api.media.uploadComplete(
                                        response.id,      // observation_id
                                        mediaType,        // 'image', 'video', 'audio'
                                        actualFile        // Реальний File object з Map
                                    );
                                    console.log(`✅ Файл ${fileData.name} завантажено успішно:`, uploadResult);
                                    showToast(`Файл ${fileData.name} завантажено`, 'success');
                                }
                            } catch (uploadError) {
                                console.error(`❌ Помилка завантаження ${fileData.name}:`, uploadError);
                                console.error('Деталі помилки:', uploadError.response?.data || uploadError.message);
                                showToast(`Не вдалося завантажити ${fileData.name}: ${uploadError.message}`, 'error');
                            }
                        }
                        console.log('✅ Завершено обробку всіх файлів');
                    }
                } else {
                    console.log('ℹ️ Файли для завантаження відсутні');
                }

            } catch (apiError) {
                // Якщо API недоступний, емулюємо успішне створення
                console.log('API недоступний, емулюємо створення спостереження:', observationData);

                const newRecord = {
                    ...observationData,
                    id: Date.now(),
                    user_id: 1,
                    status: 'active',
                    created_at: observationData.observed_at, // Використовуємо той же час що й observed_at
                    updated_at: observationData.observed_at,
                    disappeared_at: null,
                    disappeared_by: null,
                    files: formData.files.map(f => ({ name: f.name, size: f.size, type: f.type }))
                };

                setUserRecords(prev => [newRecord, ...prev]);
            }

            showToast('Спостереження успішно зареєстровано!', 'success');

            // Очищення форми
            setFormData({
                post_id: formData.post_id,
                signal_type_id: 1,
                frequency_min: '',
                frequency_max: '',
                video_frequency_min: '',
                video_frequency_max: '',
                observed_at: getUkrainianTimeForInput(),
                duration_seconds: '',
                signal_strength: '',
                modulation_type_id: null,
                comment: '',
                confidence_level: 'medium',
                tag_ids: [],
                files: []
            });
            setTagSearchQuery('');
            setUploadProgress({});
            // Очищаємо Map з файлами
            filesMapRef.current.clear();

            // Оновлення списків
            fetchActiveElements();
            setRecordsOffset(0); // Скидаємо offset при оновленні
            fetchUserRecords(0, false);

        } catch (error) {
            showToast('Помилка при створенні спостереження: ' + error.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Перевірка доступності API сервера
    const checkServerHealth = async () => {
        try {
            const response = await apiRequest('/health', { method: 'GET' });
            console.log('Server health check passed:', response);
            return true;
        } catch (error) {
            console.error('Server health check failed:', error);
            // Якщо health endpoint не існує, спробуємо простіший запит
            try {
                const fallbackResponse = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
                    method: 'HEAD',  // HEAD request для мінімального навантаження
                    headers: {
                        'Authorization': `Bearer ${getAuthToken()}`
                    }
                });
                console.log('Fallback connectivity test:', fallbackResponse.status);
                return fallbackResponse.status < 500; // 4xx допустимо, але 5xx - ні
            } catch (fallbackError) {
                console.error('Fallback connectivity test failed:', fallbackError);
                return false;
            }
        }
    };

    // Позначення як зниклого
    const markAsDisappeared = async (observationId) => {
        try {
            console.log('Starting markAsDisappeared for observation ID:', observationId);
            console.log('Current API_BASE_URL:', API_BASE_URL);
            console.log('Auth token present:', !!getAuthToken());

            // Валідація observation ID
            if (!observationId || isNaN(parseInt(observationId))) {
                throw new Error(`Invalid observation ID: ${observationId}`);
            }

            // Знаходимо спостереження щоб перевірити його час
            const element = activeElements.find(el => el.id === observationId);
            if (!element) {
                throw new Error(`Observation with ID ${observationId} not found in active elements`);
            }

            // Нормалізуємо час спостереження з API (UTC)
            const observedTime = element ? normalizeApiDate(element.observed_at) : new Date();
            const currentTime = new Date();

            // Використовуємо максимум між поточним часом і часом спостереження + 1 секунда
            const disappearedTime = new Date(Math.max(currentTime.getTime(), observedTime.getTime() + 1000));

            // toISOString() автоматично повертає UTC
            const disappearedData = {
                disappeared_at: disappearedTime.toISOString()
            };

            try {
                console.log('Sending markAsDisappeared request:', {
                    observationId,
                    disappearedData,
                    endpoint: `/api/v1/observations/${observationId}/disappeared`,
                    apiBaseUrl: API_BASE_URL
                });

                // Try direct fetch first to bypass any wrapper issues
                const directUrl = `${API_BASE_URL}/api/v1/observations/${observationId}/disappeared`;
                const token = getAuthToken();

                console.log('Making direct fetch to:', directUrl);
                console.log('Request body:', JSON.stringify(disappearedData));

                const directResponse = await fetch(directUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token && { 'Authorization': `Bearer ${token}` })
                    },
                    body: JSON.stringify(disappearedData)
                });

                if (!directResponse.ok) {
                    const errorText = await directResponse.text();
                    console.error('Direct fetch error:', {
                        status: directResponse.status,
                        statusText: directResponse.statusText,
                        body: errorText
                    });
                    throw new Error(`HTTP ${directResponse.status}: ${errorText}`);
                }

                const response = await directResponse.json();
                console.log('Спостереження позначено як зникле через API:', response);

                showToast('Спостереження позначено як зникле!', 'success');

                // Видаляємо з активних спостережень
                setActiveElements(prev => prev.filter(el => el.id !== observationId));

                // Додаємо закрите спостереження на правильне місце в списку записів
                // Використовуємо дані з response або element з оновленим disappeared_at
                const closedObservation = {
                    ...element,
                    status: 'disappeared',
                    disappeared_at: disappearedTime.toISOString(),
                    ...(response && typeof response === 'object' ? response : {})
                };

                setUserRecords(prev => {
                    const today = getTodayStart();
                    const closedAt = normalizeApiDate(closedObservation.disappeared_at);
                    const isClosedToday = closedAt >= today;

                    if (isClosedToday) {
                        // Спостереження закрито сьогодні - додаємо і сортуємо по даті створення
                        const todayRecords = prev.filter(r => {
                            const d = r.disappeared_at ? normalizeApiDate(r.disappeared_at) : null;
                            return d && d >= today;
                        });
                        const pastRecords = prev.filter(r => {
                            const d = r.disappeared_at ? normalizeApiDate(r.disappeared_at) : null;
                            return !d || d < today;
                        });

                        // Додаємо нове і сортуємо по даті створення (найновіші зверху, нормалізуємо дати)
                        const updatedToday = [closedObservation, ...todayRecords].sort((a, b) => {
                            const dateA = normalizeApiDate(a.created_at || a.observed_at || 0);
                            const dateB = normalizeApiDate(b.created_at || b.observed_at || 0);
                            return dateB - dateA; // Найновіші зверху
                        });

                        return [...updatedToday, ...pastRecords];
                    } else {
                        // Якщо чомусь не сьогодні (малоймовірно) - додаємо в минулі
                        return [closedObservation, ...prev];
                    }
                });

                console.log('[+] Спостереження додано до списку записів:', closedObservation.id);

            } catch (apiError) {
                console.error('API Error:', apiError);
            }

        } catch (error) {
            console.error('Помилка при позначенні як зниклого:', error);
            showToast('Помилка при позначенні як зниклого: ' + error.message, 'error');
        }
    };

    // Функція для перемикання розгортання спостереження
    const toggleObservationExpand = async (observationId) => {
        const newExpanded = new Set(expandedObservations);

        if (newExpanded.has(observationId)) {
            // Згортаємо
            newExpanded.delete(observationId);
        } else {
            // Розгортаємо і завантажуємо медіа
            newExpanded.add(observationId);

            // Якщо медіа ще не завантажено, завантажуємо
            if (!observationMedia[observationId]) {
                await loadObservationMedia(observationId);
            }
        }

        setExpandedObservations(newExpanded);
    };

    // Функція для завантаження медіа для спостереження
    const loadObservationMedia = async (observationId) => {
        setLoadingMedia(prev => ({ ...prev, [observationId]: true }));

        try {
            const mediaList = await api.media.listForObservation(observationId);
            console.log(`Завантажено медіа для спостереження ${observationId}:`, mediaList);

            setObservationMedia(prev => ({
                ...prev,
                [observationId]: mediaList
            }));
        } catch (error) {
            console.error(`Помилка завантаження медіа для спостереження ${observationId}:`, error);
            showToast('Помилка завантаження медіа', 'error');
        } finally {
            setLoadingMedia(prev => ({ ...prev, [observationId]: false }));
        }
    };

    // Функція для завантаження мініатюри як blob
    const loadThumbnail = useCallback(async (mediaId) => {
        // Перевіряємо кеш
        if (thumbnailUrls[mediaId]) {
            return thumbnailUrls[mediaId];
        }

        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/api/v1/media/${mediaId}/thumbnail`, {
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            // Зберігаємо в кеш
            setThumbnailUrls(prev => ({ ...prev, [mediaId]: blobUrl }));

            return blobUrl;
        } catch (error) {
            console.error(`Помилка завантаження мініатюри ${mediaId}:`, error);
            return null;
        }
    }, [thumbnailUrls]);

    // Функція для завантаження повного медіа як blob
    const loadMediaFile = useCallback(async (mediaId) => {
        // Перевіряємо кеш
        if (mediaUrls[mediaId]) {
            return mediaUrls[mediaId];
        }

        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/api/v1/media/${mediaId}/download`, {
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            // Зберігаємо в кеш
            setMediaUrls(prev => ({ ...prev, [mediaId]: blobUrl }));

            return blobUrl;
        } catch (error) {
            console.error(`Помилка завантаження медіа ${mediaId}:`, error);
            return null;
        }
    }, [mediaUrls]);

    // Функція для завантаження файлу
    const downloadMediaFile = async (media) => {
        try {
            const url = await loadMediaFile(media.id);
            if (!url) {
                showToast('Помилка завантаження файлу', 'error');
                return;
            }

            // Створюємо тимчасове посилання для завантаження
            const link = document.createElement('a');
            link.href = url;
            link.download = media.original_filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Помилка завантаження файлу:', error);
            showToast('Помилка завантаження файлу', 'error');
        }
    };

    // Функція для відкриття медіа в новій вкладці
    const openMediaInNewTab = async (media) => {
        try {
            const url = await loadMediaFile(media.id);
            if (!url) {
                showToast('Помилка завантаження файлу', 'error');
                return;
            }
            window.open(url, '_blank');
        } catch (error) {
            console.error('Помилка відкриття файлу:', error);
            showToast('Помилка відкриття файлу', 'error');
        }
    };

    // Функція для відкриття медіа файлу в модальному вікні
    const openMediaModal = (media) => {
        setSelectedMedia(media);
    };

    // Функція для закриття модального вікна
    const closeMediaModal = () => {
        setSelectedMedia(null);
    };

    // Стан для підтвердження видалення медіа
    const [confirmDeleteMedia, setConfirmDeleteMedia] = useState({ show: false, mediaId: null, observationId: null });

    // Функція для видалення медіа файлу
    const handleDeleteMedia = async (mediaId, observationId) => {
        try {
            await api.media.delete(mediaId);
            showToast('Медіа файл видалено', 'success');

            // Оновлюємо локальний стан - видаляємо медіа зі списку
            setObservationMedia(prev => ({
                ...prev,
                [observationId]: (prev[observationId] || []).filter(m => m.id !== mediaId)
            }));

            // Очищаємо URL мініатюри з кешу
            if (thumbnailUrls[mediaId]) {
                URL.revokeObjectURL(thumbnailUrls[mediaId]);
                setThumbnailUrls(prev => {
                    const newUrls = { ...prev };
                    delete newUrls[mediaId];
                    return newUrls;
                });
            }

            // Очищаємо URL повного медіа з кешу
            if (mediaUrls[mediaId]) {
                URL.revokeObjectURL(mediaUrls[mediaId]);
                setMediaUrls(prev => {
                    const newUrls = { ...prev };
                    delete newUrls[mediaId];
                    return newUrls;
                });
            }

            // Оновлюємо media_ids в активних елементах
            setActiveElements(prev => prev.map(el =>
                el.id === observationId
                    ? { ...el, media_ids: (el.media_ids || []).filter(id => id !== mediaId) }
                    : el
            ));

            // Оновлюємо media_ids в записах
            setUserRecords(prev => prev.map(rec =>
                rec.id === observationId
                    ? { ...rec, media_ids: (rec.media_ids || []).filter(id => id !== mediaId) }
                    : rec
            ));

            setConfirmDeleteMedia({ show: false, mediaId: null, observationId: null });
        } catch (error) {
            console.error('Помилка видалення медіа:', error);
            showToast('Помилка видалення медіа: ' + error.message, 'error');
        }
    };

    // Закриття модального вікна по Escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && selectedMedia) {
                closeMediaModal();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [selectedMedia]);

    // Очищення blob URLs при розмонтуванні компонента
    useEffect(() => {
        return () => {
            // Очищаємо всі thumbnail URLs
            Object.values(thumbnailUrls).forEach(url => {
                if (url) URL.revokeObjectURL(url);
            });

            // Очищаємо всі media URLs
            Object.values(mediaUrls).forEach(url => {
                if (url) URL.revokeObjectURL(url);
            });
        };
    }, []);

    const startEditing = (element) => {
        setEditingElement(element.id);
        setEditFormData({
            frequency_min: element.frequency_min,
            frequency_max: element.frequency_max,
            video_frequency_min: element.video_frequency_min || '',
            video_frequency_max: element.video_frequency_max || '',
            confidence_level: element.confidence_level || 'medium',
            comment: element.comment || '',
            duration_seconds: element.duration_seconds || '',
            tag_ids: element.tag_ids || []
        });
        setEditTagSearchQuery('');
    };

    const cancelEditing = () => {
        setEditingElement(null);
        setEditFormData({});
        setEditTagSearchQuery('');
        setShowEditTagDropdown(false);
    };

    const saveEditing = async (elementId) => {
        try {
            // Перевірка: потрібна або частота, або відео частота, або обидві
            const hasFrequency = editFormData.frequency_min && editFormData.frequency_max;
            const hasVideoFrequency = editFormData.video_frequency_min && editFormData.video_frequency_max;

            if (!hasFrequency && !hasVideoFrequency) {
                showToast('Вкажіть діапазон частот або діапазон відео частот (або обидва)', 'error');
                return;
            }

            // Валідація звичайних частот (якщо задані)
            if (hasFrequency) {
                if (parseFloat(editFormData.frequency_min) >= parseFloat(editFormData.frequency_max)) {
                    showToast('Мінімальна частота повинна бути менше максимальної', 'error');
                    return;
                }
            }

            // Валідація відео частот (якщо задані)
            if (hasVideoFrequency) {
                if (parseFloat(editFormData.video_frequency_min) >= parseFloat(editFormData.video_frequency_max)) {
                    showToast('Мінімальна відео частота повинна бути менше максимальної', 'error');
                    return;
                }
            }

            // Перевірка неповних діапазонів
            if ((editFormData.frequency_min && !editFormData.frequency_max) || (!editFormData.frequency_min && editFormData.frequency_max)) {
                showToast('Заповніть обидва поля діапазону частот', 'warning');
                return;
            }

            if ((editFormData.video_frequency_min && !editFormData.video_frequency_max) || (!editFormData.video_frequency_min && editFormData.video_frequency_max)) {
                showToast('Заповніть обидва поля діапазону відео частот', 'warning');
                return;
            }

            // Підготовка даних згідно з ObservationUpdate схемою
            // Відправляємо null для очищених полів
            const updateData = {
                confidence_level: editFormData.confidence_level || null
            };

            // Звичайні частоти - відправляємо null якщо очищені
            if (hasFrequency) {
                updateData.frequency_min = parseFloat(editFormData.frequency_min);
                updateData.frequency_max = parseFloat(editFormData.frequency_max);
            } else {
                // Якщо поля очищені - явно відправляємо null
                updateData.frequency_min = null;
                updateData.frequency_max = null;
            }

            // Відео частоти - відправляємо null якщо очищені
            if (hasVideoFrequency) {
                updateData.video_frequency_min = parseFloat(editFormData.video_frequency_min);
                updateData.video_frequency_max = parseFloat(editFormData.video_frequency_max);
            } else {
                // Якщо поля очищені - явно відправляємо null
                updateData.video_frequency_min = null;
                updateData.video_frequency_max = null;
            }

            // Коментар - відправляємо null якщо очищений
            updateData.comment = editFormData.comment?.trim() || null;

            // Тривалість - відправляємо null якщо очищена
            updateData.duration_seconds = editFormData.duration_seconds ? parseInt(editFormData.duration_seconds) : null;

            // Теги - відправляємо null якщо немає
            updateData.tag_ids = editFormData.tag_ids?.length > 0 ? editFormData.tag_ids : null;

            try {
                // Використовуємо новий PUT endpoint згідно з OpenAPI
                const response = await apiRequest(`/api/v1/observations/${elementId}`, {
                    method: 'PUT',
                    body: JSON.stringify(updateData)
                });

                console.log('Спостереження оновлено через API:', response);
                showToast('Спостереження оновлено!', 'success');

                setEditingElement(null);
                setEditFormData({});

                // Оновлюємо список активних спостережень
                if (formData.post_id) {
                    fetchActiveElements();
                }

            } catch (apiError) {
                console.log('API недоступний, емулюємо оновлення локально:', updateData);

                // Емуляція для локального тестування
                setActiveElements(prev => prev.map(el =>
                    el.id === elementId ? { ...el, ...updateData, updated_at: new Date().toISOString() } : el
                ));

                showToast('Спостереження оновлено (локально)!', 'success');
                setEditingElement(null);
                setEditFormData({});
            }

        } catch (error) {
            console.error('Помилка при оновленні спостереження:', error);
            showToast('Помилка при оновленні: ' + error.message, 'error');
        }
    };



    // Допоміжні функції
    const getSignalTypeName = (id) => {
        if (!Array.isArray(signalTypes) || !id) return 'Невідомий тип';
        const type = signalTypes.find(t => t.id === id);
        return type ? type.name : 'Невідомий тип';
    };

    const getPostName = (id) => {
        if (!Array.isArray(posts) || !id) return 'Невідомий пост';
        const post = posts.find(p => p.id === id);
        return post ? post.name : 'Невідомий пост';
    };

    const getUsernameById = (userId) => {
        if (!users || users.length === 0) {
            return `Користувач ${userId}`;
        }
        const user = users.find(u => u.id === userId);
        return user ? user.username_alias : `Користувач ${userId}`;
    };

    // Використовуємо formatDateUA з утиліти для форматування дат з українським часовим поясом
    const formatDate = formatDateUA;

    const getTypeColor = (signalTypeId) => {
        const colors = {
            1: 'bg-red-500/20 border-red-500 text-red-300',
            2: 'bg-orange-500/20 border-orange-500 text-orange-300',
            3: 'bg-yellow-500/20 border-yellow-500 text-yellow-300',
            4: 'bg-purple-500/20 border-purple-500 text-purple-300'
        };
        return colors[signalTypeId] || 'bg-gray-500/20 border-gray-500 text-gray-300';
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Якщо немає токену - показуємо екран завантаження
    if (!token && !loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 w-full max-w-md mx-4">
                    <div className="text-center mb-6">
                        <Shield className="w-16 h-16 text-green-400 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Система моніторингу
                        </h1>
                        <p className="text-gray-400">
                            Виконується вхід до системи...
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-300 mb-2">API адреса:</p>
                            <p className="text-xs text-gray-400 break-all">{API_BASE_URL}</p>
                        </div>

                        <div className="flex items-center justify-center py-4">
                            <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-3 text-green-400">Автентифікація...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white">Завантаження...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-white mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Перезавантажити
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 p-6">
            {/* Tactical background */}
            <div className="absolute inset-0 opacity-5">
                <div className="w-full h-full"
                     style={{
                         backgroundImage: `
                 linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
               `,
                         backgroundSize: '40px 40px'
                     }}>
                </div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <Shield className="w-10 h-10 text-green-400" />
                        <div>
                            <h1 className="text-3xl font-bold text-white">
                                Система моніторингу радіосигналів
                            </h1>
                            <div className="flex items-center justify-center gap-4 mt-2">
                                <span className={`px-2 py-1 text-xs rounded ${token ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                    {token ? 'Авторизовано' : 'Не авторизовано'}
                                </span>
                                {currentUser && (
                                    <>
                                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                                            {currentUser.username_alias || currentUser.username}
                                        </span>
                                    </>
                                )}
                                <button
                                    onClick={() => {
                                        localStorage.removeItem('access_token');
                                        localStorage.removeItem('refresh_token');
                                        window.location.reload();
                                    }}
                                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                >
                                    Вийти
                                </button>
                            </div>
                        </div>
                        <Target className="w-10 h-10 text-green-400" />
                    </div>
                    <div className="flex justify-center gap-6 text-sm text-gray-400">
                        <span>Статус: Активний</span>
                        <span>Час: {currentTime.toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })}</span>
                        {formData.post_id && (
                            <span>Пост: {getPostName(formData.post_id)}</span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8">
                    {/* Форма реєстрації спостереження - на мобільних буде другою */}
                    <div ref={formContainerRef} className="bg-gray-800 flex flex-col border border-gray-600 rounded-lg p-6 order-2 lg:order-1">
                        <h2 className="text-xl font-bold text-green-400 mb-6 flex items-center gap-2">
                            <Radio className="w-6 h-6" />
                            Форма реєстрації спостереження
                        </h2>


                        <div className="space-y-4">
                            {/* Тип сигналу */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Тип сигналу *
                                </label>
                                <select
                                    value={formData.signal_type_id || 1}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        signal_type_id: parseInt(e.target.value) || 1
                                    }))}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    required
                                >
                                    {Array.isArray(signalTypes) && signalTypes.length > 0 ? (
                                        signalTypes.map(type => (
                                            <option key={type.id} value={type.id} className="bg-gray-700">
                                                {type.name}
                                            </option>
                                        ))
                                    ) : (
                                        <option value={1}>Завантаження типів сигналів...</option>
                                    )}
                                </select>
                            </div>

                            {/* Діапазон частот */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Діапазон частот (МГц) *
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0"
                                        placeholder="Від (МГц)"
                                        value={formData.frequency_min}
                                        max={formData.frequency_max || undefined}
                                        onKeyDown={handleFrequencyKeyDown}
                                        onChange={(e) => handleFrequencyChange(e, setFormData, 'frequency_min')}
                                        className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        required
                                    />
                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0"
                                        placeholder="До (МГц)"
                                        value={formData.frequency_max}
                                        onKeyDown={handleFrequencyKeyDown}
                                        onChange={(e) => handleFrequencyChange(e, setFormData, 'frequency_max')}
                                        className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        required
                                    />
                                </div>
                                {formData.frequency_min && formData.frequency_max && (
                                    <div className={`mt-2 text-sm ${parseFloat(formData.frequency_max) < parseFloat(formData.frequency_min) ? 'text-red-400' : 'text-gray-400'}`}>
                                        Ширина діапазону: {(parseFloat(formData.frequency_max) - parseFloat(formData.frequency_min)).toFixed(3)} МГц
                                    </div>
                                )}
                            </div>

                            {/* Відео частота */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Відео частота (МГц)
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0"
                                        placeholder="Від (МГц)"
                                        value={formData.video_frequency_min}
                                        max={formData.video_frequency_max || undefined}
                                        onKeyDown={handleFrequencyKeyDown}
                                        onChange={(e) => handleFrequencyChange(e, setFormData, 'video_frequency_min')}
                                        className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0"
                                        placeholder="До (МГц)"
                                        value={formData.video_frequency_max}
                                        onKeyDown={handleFrequencyKeyDown}
                                        onChange={(e) => handleFrequencyChange(e, setFormData, 'video_frequency_max')}
                                        className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                {formData.video_frequency_min && formData.video_frequency_max && (
                                    <div className={`mt-2 text-sm ${parseFloat(formData.video_frequency_max) < parseFloat(formData.video_frequency_min) ? 'text-red-400' : 'text-gray-400'}`}>
                                        Ширина відео діапазону: {(parseFloat(formData.video_frequency_max) - parseFloat(formData.video_frequency_min)).toFixed(3)} МГц
                                    </div>
                                )}
                            </div>

                            {/*/!* Час спостереження та додаткові параметри *!/*/}
                            {/*<div className="grid grid-cols-2 gap-3">*/}
                            {/*    <div>*/}
                            {/*        <label className="block text-sm font-medium text-gray-300 mb-2">*/}
                            {/*            Час спостереження **/}
                            {/*        </label>*/}
                            {/*        <input*/}
                            {/*            type="datetime-local"*/}
                            {/*            value={formData.observed_at}*/}
                            {/*            onChange={(e) => setFormData(prev => ({ ...prev, observed_at: e.target.value }))}*/}
                            {/*            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"*/}
                            {/*            required*/}
                            {/*        />*/}
                            {/*    </div>*/}
                            {/*    <div>*/}
                            {/*        <label className="block text-sm font-medium text-gray-300 mb-2">*/}
                            {/*            Тривалість (сек)*/}
                            {/*        </label>*/}
                            {/*        <input*/}
                            {/*            type="number"*/}
                            {/*            min="0"*/}
                            {/*            placeholder="Секунди"*/}
                            {/*            value={formData.duration_seconds}*/}
                            {/*            onChange={(e) => setFormData(prev => ({ ...prev, duration_seconds: e.target.value }))}*/}
                            {/*            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500"*/}
                            {/*        />*/}
                            {/*    </div>*/}
                            {/*</div>*/}

                            {/* Сила сигналу та рівень впевненості */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Рівень впевненості
                                    </label>
                                    <select
                                        value={formData.confidence_level}
                                        onChange={(e) => setFormData(prev => ({ ...prev, confidence_level: e.target.value }))}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value="low" className="bg-gray-700">Низький</option>
                                        <option value="medium" className="bg-gray-700">Середній</option>
                                        <option value="high" className="bg-gray-700">Високий</option>
                                    </select>
                                </div>
                            </div>

                            {/* Теги */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    <Tag className="w-4 h-4 inline mr-1" />
                                    Теги
                                </label>

                                {/* Вибрані теги */}
                                {formData.tag_ids.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.tag_ids.map(tagId => {
                                            const tag = availableTags.find(t => t.id === tagId);
                                            return tag ? (
                                                <span
                                                    key={tagId}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-600/30 border border-green-500/50 text-green-300 text-xs rounded-full"
                                                >
                                                    {tag.name}
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({
                                                            ...prev,
                                                            tag_ids: prev.tag_ids.filter(id => id !== tagId)
                                                        }))}
                                                        className="hover:text-red-300"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                )}

                                {/* Пошук та додавання тегів */}
                                <div className="relative">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={tagSearchQuery}
                                                onChange={(e) => setTagSearchQuery(e.target.value)}
                                                onFocus={() => setShowTagDropdown(true)}
                                                placeholder="Пошук тегу..."
                                                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Dropdown зі списком тегів */}
                                    {showTagDropdown && (
                                        <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {availableTags
                                                .filter(tag =>
                                                    !formData.tag_ids.includes(tag.id) &&
                                                    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
                                                )
                                                .slice(0, 10)
                                                .map(tag => (
                                                    <button
                                                        key={tag.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                tag_ids: [...prev.tag_ids, tag.id]
                                                            }));
                                                            setTagSearchQuery('');
                                                            setShowTagDropdown(false);
                                                        }}
                                                        className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-600 flex items-center gap-2"
                                                    >
                                                        <Tag className="w-3 h-3 text-gray-400" />
                                                        {tag.name}
                                                    </button>
                                                ))
                                            }
                                            {availableTags.filter(tag =>
                                                !formData.tag_ids.includes(tag.id) &&
                                                tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
                                            ).length === 0 && (
                                                <div className="px-3 py-2 text-sm text-gray-400">
                                                    {tagSearchQuery ? 'Тегів не знайдено' : 'Немає доступних тегів'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Закриття dropdown при кліку назовні */}
                                {showTagDropdown && (
                                    <div
                                        className="fixed inset-0 z-0"
                                        onClick={() => setShowTagDropdown(false)}
                                    />
                                )}
                            </div>

                            {/* Завантаження файлів */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Прикріпити файли (фото/відео)
                                </label>
                                <div
                                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                        isDragging
                                            ? 'border-green-400 bg-green-500/10'
                                            : 'border-gray-600 hover:border-green-500'
                                    }`}
                                    onDragEnter={handleDragEnter}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-400 mb-2">
                                        {isDragging ? 'Відпустіть файли тут' : 'Перетягніть файли сюди або клацніть для вибору'}
                                    </p>
                                    <p className="text-xs text-gray-500 mb-3">
                                        Підтримувані формати: JPG, PNG, MP4, AVI, MOV, WAV, MP3
                                    </p>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,video/*,audio/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 transition-colors"
                                    >
                                        Обрати файли
                                    </label>
                                </div>

                                {/* Список завантажених файлів */}
                                {formData.files.length > 0 && (
                                    <div className="mt-4 space-y-3">
                                        {formData.files.map((file) => (
                                            <div key={file.id} className="bg-gray-700 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex-1">
                                                        <p className="text-white text-sm font-medium">{file.name}</p>
                                                        <p className="text-gray-400 text-xs">
                                                            {formatFileSize(file.size)} • {file.type}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFile(file.id)}
                                                        className="text-red-400 hover:text-red-300 p-1"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Прогрес-бар */}
                                                {uploadProgress[file.id] !== undefined && uploadProgress[file.id] < 100 && (
                                                    <div className="w-full bg-gray-600 rounded-full h-2">
                                                        <div
                                                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${uploadProgress[file.id] || 0}%` }}
                                                        ></div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Коментар */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Коментар ({formData.comment.length}/1000 символів)
                                </label>
                                <textarea
                                    value={formData.comment}
                                    onChange={(e) => {
                                        if (e.target.value.length <= 1000) {
                                            setFormData(prev => ({ ...prev, comment: e.target.value }));
                                        }
                                    }}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                    placeholder="Детальний опис спостереження..."
                                />
                            </div>

                            {/* Кнопка відправки */}
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Створення спостереження...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-5 h-5" />
                                        Створити спостереження
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Активні спостереження - на мобільних буде першою, висота = висота форми */}
                    <div
                        className="bg-gray-800 flex flex-col border border-gray-600 rounded-lg p-6 order-1 lg:order-2 overflow-hidden"
                        style={isDesktop && formHeight ? {
                            height: `${formHeight}px`,
                            minHeight: `${formHeight}px`,
                            maxHeight: `${formHeight}px`
                        } : {
                            maxHeight: '500px'
                        }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-orange-400 flex items-center gap-2">
                                <Activity className="w-6 h-6" />
                                Активні спостереження
                            </h2>
                        </div>

                        <div className="space-y-4 overflow-y-auto flex-1 min-h-0">
                            {!activeElements || activeElements.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                                    Активних спостережень не знайдено
                                </div>
                            ) : (
                                Array.isArray(activeElements) && activeElements.map(element => (
                                    <div key={element.id} className={`border rounded-lg p-4 ${getTypeColor(element.signal_type_id)}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="text-white font-medium">{getSignalTypeName(element.signal_type_id)}</p>
                                                <p className="text-gray-300 text-sm">{getPostName(element.post_id)}</p>
                                                <p className="text-blue-400 text-xs">
                                                    Створено: {users && users.length > 0 ? getUsernameById(element.user_id) : (
                                                    <span className="inline-flex items-center gap-1">
                                                    <span className="w-3 h-3 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin inline-block"></span>
                                                    Завантаження...
                                                </span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                {editingElement === element.id ? (
                                                    <>
                                                        <button
                                                            onClick={() => saveEditing(element.id)}
                                                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors flex items-center gap-1"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                            Зберегти
                                                        </button>
                                                        <button
                                                            onClick={cancelEditing}
                                                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
                                                        >
                                                            Скасувати
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => startEditing(element)}
                                                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors flex items-center gap-1"
                                                        >
                                                            <Edit3 className="w-3 h-3" />
                                                            Редагувати
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDeleteModal({ show: true, observationId: element.id })}
                                                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                                                        >
                                                            Зник
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {editingElement === element.id ? (
                                            // Форма редагування
                                            <div className="space-y-3">
                                                {/* Основні частоти */}
                                                <div>
                                                    <label className="block text-xs text-gray-300 mb-1">Основні частоти (МГц)</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input
                                                            type="number"
                                                            step="0.001"
                                                            min="0"
                                                            placeholder="Від"
                                                            value={editFormData.frequency_min || ''}
                                                            max={editFormData.frequency_max || undefined}
                                                            onKeyDown={handleFrequencyKeyDown}
                                                            onChange={(e) => handleFrequencyChange(e, setEditFormData, 'frequency_min')}
                                                            className="w-full px-2 py-1 text-xs bg-gray-600 border border-gray-500 rounded text-white"
                                                        />
                                                        <input
                                                            type="number"
                                                            step="0.001"
                                                            min="0"
                                                            placeholder="До"
                                                            value={editFormData.frequency_max || ''}
                                                            onKeyDown={handleFrequencyKeyDown}
                                                            onChange={(e) => handleFrequencyChange(e, setEditFormData, 'frequency_max')}
                                                            className="w-full px-2 py-1 text-xs bg-gray-600 border border-gray-500 rounded text-white"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Відео частоти */}
                                                <div>
                                                    <label className="block text-xs text-gray-300 mb-1">Відео частоти (МГц)</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input
                                                            type="number"
                                                            step="0.001"
                                                            min="0"
                                                            placeholder="Від"
                                                            value={editFormData.video_frequency_min || ''}
                                                            max={editFormData.video_frequency_max || undefined}
                                                            onKeyDown={handleFrequencyKeyDown}
                                                            onChange={(e) => handleFrequencyChange(e, setEditFormData, 'video_frequency_min')}
                                                            className="w-full px-2 py-1 text-xs bg-gray-600 border border-gray-500 rounded text-white"
                                                        />
                                                        <input
                                                            type="number"
                                                            step="0.001"
                                                            min="0"
                                                            placeholder="До"
                                                            value={editFormData.video_frequency_max || ''}
                                                            onKeyDown={handleFrequencyKeyDown}
                                                            onChange={(e) => handleFrequencyChange(e, setEditFormData, 'video_frequency_max')}
                                                            className="w-full px-2 py-1 text-xs bg-gray-600 border border-gray-500 rounded text-white"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Тривалість та рівень впевненості */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs text-gray-300 mb-1">Рівень впевненості</label>
                                                        <select
                                                            value={editFormData.confidence_level || 'medium'}
                                                            onChange={(e) => setEditFormData(prev => ({ ...prev, confidence_level: e.target.value }))}
                                                            className="w-full px-2 py-1 text-xs bg-gray-600 border border-gray-500 rounded text-white"
                                                        >
                                                            <option value="low">Низький</option>
                                                            <option value="medium">Середній</option>
                                                            <option value="high">Високий</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Теги в редагуванні */}
                                                <div className="relative">
                                                    <label className="block text-xs text-gray-300 mb-1">
                                                        <Tag className="w-3 h-3 inline mr-1" />
                                                        Теги
                                                    </label>

                                                    {/* Вибрані теги */}
                                                    {editFormData.tag_ids && editFormData.tag_ids.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mb-2">
                                                            {editFormData.tag_ids.map(tagId => {
                                                                const tag = availableTags.find(t => t.id === tagId);
                                                                return tag ? (
                                                                    <span
                                                                        key={tagId}
                                                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-600/30 border border-green-500/50 text-green-300 text-xs rounded-full"
                                                                    >
                                                                        {tag.name}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setEditFormData(prev => ({
                                                                                ...prev,
                                                                                tag_ids: prev.tag_ids.filter(id => id !== tagId)
                                                                            }))}
                                                                            className="hover:text-red-300"
                                                                        >
                                                                            <X className="w-2.5 h-2.5" />
                                                                        </button>
                                                                    </span>
                                                                ) : null;
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Пошук тегів */}
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={editTagSearchQuery}
                                                            onChange={(e) => setEditTagSearchQuery(e.target.value)}
                                                            onFocus={() => setShowEditTagDropdown(true)}
                                                            placeholder="Пошук тегу..."
                                                            className="w-full px-2 py-1 text-xs bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400"
                                                        />

                                                        {showEditTagDropdown && (
                                                            <div className="absolute z-20 w-full mt-1 bg-gray-700 border border-gray-500 rounded shadow-lg max-h-32 overflow-y-auto">
                                                                {availableTags
                                                                    .filter(tag =>
                                                                        !(editFormData.tag_ids || []).includes(tag.id) &&
                                                                        tag.name.toLowerCase().includes(editTagSearchQuery.toLowerCase())
                                                                    )
                                                                    .slice(0, 8)
                                                                    .map(tag => (
                                                                        <button
                                                                            key={tag.id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setEditFormData(prev => ({
                                                                                    ...prev,
                                                                                    tag_ids: [...(prev.tag_ids || []), tag.id]
                                                                                }));
                                                                                setEditTagSearchQuery('');
                                                                                setShowEditTagDropdown(false);
                                                                            }}
                                                                            className="w-full px-2 py-1 text-left text-xs text-gray-200 hover:bg-gray-600"
                                                                        >
                                                                            {tag.name}
                                                                        </button>
                                                                    ))
                                                                }
                                                                {availableTags.filter(tag =>
                                                                    !(editFormData.tag_ids || []).includes(tag.id) &&
                                                                    tag.name.toLowerCase().includes(editTagSearchQuery.toLowerCase())
                                                                ).length === 0 && (
                                                                    <div className="px-2 py-1 text-xs text-gray-400">
                                                                        Тегів не знайдено
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {showEditTagDropdown && (
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setShowEditTagDropdown(false)}
                                                        />
                                                    )}
                                                </div>

                                                {/* Коментар */}
                                                <div>
                                                    <label className="block text-xs text-gray-300 mb-1">Коментар</label>
                                                    <textarea
                                                        placeholder="Додаткова інформація..."
                                                        value={editFormData.comment || ''}
                                                        onChange={(e) => setEditFormData(prev => ({ ...prev, comment: e.target.value }))}
                                                        rows="2"
                                                        className="w-full px-2 py-1 text-xs bg-gray-600 border border-gray-500 rounded text-white resize-none"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            // Звичайне відображення
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-300">Частота:</span>
                                                        <p className="text-white font-medium">
                                                            {element.frequency_min && element.frequency_max
                                                                ? `${element.frequency_min} - ${element.frequency_max} МГц`
                                                                : <span className="text-gray-500">Не вказано</span>
                                                            }
                                                        </p>
                                                    </div>
                                                    {element.video_frequency_min && element.video_frequency_max && (
                                                        <div>
                                                            <span className="text-gray-300">Відео частота:</span>
                                                            <p className="text-blue-300 font-medium">
                                                                {element.video_frequency_min} - {element.video_frequency_max} МГц
                                                            </p>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="text-gray-300">Час створення:</span>
                                                        <p className="text-white font-medium">
                                                            {formatDate(element.observed_at)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-300">Час активності:</span>
                                                        <p className="text-white font-medium">
                                                            <ActiveTimer observedAt={element.observed_at} />
                                                        </p>
                                                    </div>
                                                </div>

                                                {element.comment && (
                                                    <div className="mt-3 text-sm">
                                                        <span className="text-gray-300">Коментар:</span>
                                                        <p className="text-gray-200 break-words whitespace-pre-wrap">{element.comment}</p>
                                                    </div>
                                                )}

                                                {/* Теги активного спостереження */}
                                                {element.tag_ids && element.tag_ids.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-1">
                                                        {element.tag_ids.map(tagId => {
                                                            const tag = availableTags.find(t => t.id === tagId);
                                                            return tag ? (
                                                                <span
                                                                    key={tagId}
                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-600 text-gray-300 text-xs rounded-full"
                                                                >
                                                                    <Tag className="w-3 h-3" />
                                                                    {tag.name}
                                                                </span>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                )}

                                                {/* Кнопка для розгортання медіа */}
                                                {element.media_ids && element.media_ids.length > 0 && (
                                                    <div className="mt-4">
                                                        <button
                                                            onClick={() => toggleObservationExpand(element.id)}
                                                            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                                                        >
                                                            {expandedObservations.has(element.id) ? (
                                                                <>
                                                                    <ChevronUp className="w-4 h-4" />
                                                                    <span className="text-sm">Сховати медіа ({element.media_ids.length})</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ChevronDown className="w-4 h-4" />
                                                                    <span className="text-sm">Показати медіа ({element.media_ids.length})</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* Секція з мініатюрами медіа */}
                                        {!editingElement && expandedObservations.has(element.id) && (
                                            <div className="mt-4 border-t border-gray-600 pt-4">
                                                {loadingMedia[element.id] ? (
                                                    <div className="flex items-center justify-center py-8">
                                                        <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                                                        <span className="ml-3 text-gray-400">Завантаження медіа...</span>
                                                    </div>
                                                ) : observationMedia[element.id] && observationMedia[element.id].length > 0 ? (
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-300 mb-3">
                                                            Медіа файли ({observationMedia[element.id].length})
                                                        </h4>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                            {observationMedia[element.id].map(media => (
                                                                <div
                                                                    key={media.id}
                                                                    className="relative group cursor-pointer bg-gray-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                                                                >
                                                                    {/* Мініатюра */}
                                                                    <div
                                                                        className="aspect-square relative"
                                                                        onClick={() => openMediaModal(media)}
                                                                    >
                                                                        <ThumbnailImage
                                                                            mediaId={media.id}
                                                                            media={media}
                                                                            loadThumbnail={loadThumbnail}
                                                                        />
                                                                    </div>

                                                                    {/* Кнопка видалення */}
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setConfirmDeleteMedia({ show: true, mediaId: media.id, observationId: element.id });
                                                                        }}
                                                                        className="absolute top-1 right-1 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                                        title="Видалити медіа"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>

                                                                    {/* Інформація про файл */}
                                                                    <div
                                                                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2"
                                                                        onClick={() => openMediaModal(media)}
                                                                    >
                                                                        <p className="text-xs text-white truncate">
                                                                            {media.original_filename}
                                                                        </p>
                                                                        <p className="text-xs text-gray-400">
                                                                            {(media.file_size / 1024 / 1024).toFixed(2)} MB
                                                                        </p>
                                                                    </div>

                                                                    {/* Overlay при hover */}
                                                                    <div
                                                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none"
                                                                    >
                                                                        <Eye className="w-8 h-8 text-white" />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-6 text-gray-400">
                                                        <FileText className="w-10 h-10 mx-auto mb-2 text-gray-500" />
                                                        <p className="text-sm">Медіа файли відсутні</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Мої спостереження - на мобільних буде третьою */}
                    <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 order-3 lg:col-span-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                            <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
                                <Eye className="w-6 h-6" />
                                Спостереження посту
                            </h2>

                            {/* Фільтр по тегах */}
                            <div className="relative flex-1 max-w-md">
                                <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={recordsTagSearchQuery}
                                            onChange={(e) => setRecordsTagSearchQuery(e.target.value)}
                                            onFocus={() => setShowRecordsTagDropdown(true)}
                                            placeholder="Фільтр по тегах..."
                                            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />

                                        {showRecordsTagDropdown && (
                                            <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                {availableTags
                                                    .filter(tag =>
                                                        !recordsTagFilter.includes(tag.id) &&
                                                        tag.name.toLowerCase().includes(recordsTagSearchQuery.toLowerCase())
                                                    )
                                                    .slice(0, 10)
                                                    .map(tag => (
                                                        <button
                                                            key={tag.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setRecordsTagFilter(prev => [...prev, tag.id]);
                                                                setRecordsTagSearchQuery('');
                                                                setShowRecordsTagDropdown(false);
                                                            }}
                                                            className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-600 flex items-center gap-2"
                                                        >
                                                            <Tag className="w-3 h-3 text-gray-400" />
                                                            {tag.name}
                                                        </button>
                                                    ))
                                                }
                                                {availableTags.filter(tag =>
                                                    !recordsTagFilter.includes(tag.id) &&
                                                    tag.name.toLowerCase().includes(recordsTagSearchQuery.toLowerCase())
                                                ).length === 0 && (
                                                    <div className="px-3 py-2 text-sm text-gray-400">
                                                        Тегів не знайдено
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Вибрані теги для фільтрації */}
                                {recordsTagFilter.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {recordsTagFilter.map(tagId => {
                                            const tag = availableTags.find(t => t.id === tagId);
                                            return tag ? (
                                                <span
                                                    key={tagId}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600/30 border border-blue-500/50 text-blue-300 text-xs rounded-full"
                                                >
                                                    {tag.name}
                                                    <button
                                                        type="button"
                                                        onClick={() => setRecordsTagFilter(prev => prev.filter(id => id !== tagId))}
                                                        className="hover:text-red-300"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ) : null;
                                        })}
                                        <button
                                            type="button"
                                            onClick={() => setRecordsTagFilter([])}
                                            className="text-xs text-gray-400 hover:text-white ml-2"
                                        >
                                            Очистити
                                        </button>
                                    </div>
                                )}

                                {showRecordsTagDropdown && (
                                    <div
                                        className="fixed inset-0 z-0"
                                        onClick={() => setShowRecordsTagDropdown(false)}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Показуємо searchResults якщо є активні теги, інакше userRecords */}
                            {(() => {
                                const displayRecords = recordsTagFilter.length > 0 ? searchResults : userRecords;
                                const isLoading = recordsTagFilter.length > 0 ? searchLoading : false;

                                if (isLoading) {
                                    return (
                                        <div className="text-center py-8 text-gray-400">
                                            <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
                                            <p>Пошук спостережень...</p>
                                        </div>
                                    );
                                }

                                if (!Array.isArray(displayRecords) || displayRecords.length === 0) {
                                    return (
                                        <div className="text-center py-8 text-gray-400">
                                            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                                            {recordsTagFilter.length > 0
                                                ? 'Спостережень з такими тегами не знайдено'
                                                : (showingTodayOnly ? 'Сьогодні немає закритих спостережень' : 'У вас поки немає спостережень')
                                            }
                                        </div>
                                    );
                                }

                                return displayRecords.map(record => (
                                <div key={record.id} className="bg-gray-700 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-white font-medium">{getSignalTypeName(record.signal_type_id)}</p>
                                            <p className="text-gray-400 text-sm">{formatDate(record.created_at)}</p>
                                            <p className="text-gray-500 text-xs">{getPostName(record.post_id)}</p>
                                            <p className="text-blue-400 text-xs">
                                                Створено: {users && users.length > 0 ? getUsernameById(record.user_id) : `Користувач ${record.user_id}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-3">
                                        <div>
                                            <span className="text-gray-400">Частота:</span>
                                            <p className="text-white font-mono">
                                                {record.frequency_min && record.frequency_max
                                                    ? `${record.frequency_min} - ${record.frequency_max} МГц`
                                                    : <span className="text-gray-500">Не вказано</span>
                                                }
                                            </p>
                                        </div>
                                        {record.video_frequency_min && record.video_frequency_max && (
                                            <div>
                                                <span className="text-gray-400">Відео частота:</span>
                                                <p className="text-blue-300 font-mono">
                                                    {record.video_frequency_min} - {record.video_frequency_max} МГц
                                                </p>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-gray-400">Статус:</span>
                                            <p className="text-white capitalize">{statusText[record.status]}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Час активності:</span>
                                            <p className="text-white">{calculateDuration(record.observed_at, record.disappeared_at)}</p>
                                        </div>
                                        {record.signal_strength && (
                                            <div>
                                                <span className="text-gray-400">Сила:</span>
                                                <p className="text-white">{record.signal_strength} дБм</p>
                                            </div>
                                        )}
                                    </div>

                                    {record.comment && (
                                        <div className="text-sm">
                                            <span className="text-gray-400">Коментар:</span>
                                            <p className="text-gray-200 mt-1 bg-gray-600 p-3 rounded break-words whitespace-pre-wrap">
                                                {record.comment}
                                            </p>
                                        </div>
                                    )}

                                    {/* Теги спостереження */}
                                    {record.tag_ids && record.tag_ids.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {record.tag_ids.map(tagId => {
                                                const tag = availableTags.find(t => t.id === tagId);
                                                return tag ? (
                                                    <span
                                                        key={tagId}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-600 text-gray-300 text-xs rounded-full cursor-pointer hover:bg-blue-600/30 hover:text-blue-300 transition-colors"
                                                        onClick={() => {
                                                            if (!recordsTagFilter.includes(tagId)) {
                                                                setRecordsTagFilter(prev => [...prev, tagId]);
                                                            }
                                                        }}
                                                        title="Клікніть для фільтрації"
                                                    >
                                                        <Tag className="w-3 h-3" />
                                                        {tag.name}
                                                    </span>
                                                ) : null;
                                            })}
                                        </div>
                                    )}

                                    {/* Кнопка для розгортання медіа */}
                                    {record.media_ids && record.media_ids.length > 0 && (
                                        <div className="mt-4">
                                            <button
                                                onClick={() => toggleObservationExpand(record.id)}
                                                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                                            >
                                                {expandedObservations.has(record.id) ? (
                                                    <>
                                                        <ChevronUp className="w-4 h-4" />
                                                        <span className="text-sm">Сховати медіа ({record.media_ids.length})</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronDown className="w-4 h-4" />
                                                        <span className="text-sm">Показати медіа ({record.media_ids.length})</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* Секція з мініатюрами медіа */}
                                    {expandedObservations.has(record.id) && (
                                        <div className="mt-4 border-t border-gray-600 pt-4">
                                            {loadingMedia[record.id] ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                                                    <span className="ml-3 text-gray-400">Завантаження медіа...</span>
                                                </div>
                                            ) : observationMedia[record.id] && observationMedia[record.id].length > 0 ? (
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-300 mb-3">
                                                        Медіа файли ({observationMedia[record.id].length})
                                                    </h4>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                        {observationMedia[record.id].map(media => (
                                                            <div
                                                                key={media.id}
                                                                className="relative group cursor-pointer bg-gray-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                                                            >
                                                                {/* Мініатюра */}
                                                                <div
                                                                    className="aspect-square relative"
                                                                    onClick={() => openMediaModal(media)}
                                                                >
                                                                    <ThumbnailImage
                                                                        mediaId={media.id}
                                                                        media={media}
                                                                        loadThumbnail={loadThumbnail}
                                                                    />
                                                                </div>

                                                                {/* Інформація про файл */}
                                                                <div
                                                                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2"
                                                                    onClick={() => openMediaModal(media)}
                                                                >
                                                                    <p className="text-xs text-white truncate">
                                                                        {media.original_filename}
                                                                    </p>
                                                                    <p className="text-xs text-gray-400">
                                                                        {(media.file_size / 1024 / 1024).toFixed(2)} MB
                                                                    </p>
                                                                </div>

                                                                {/* Overlay при hover */}
                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                                    <Eye className="w-8 h-8 text-white" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 text-gray-400">
                                                    <FileText className="w-10 h-10 mx-auto mb-2 text-gray-500" />
                                                    <p className="text-sm">Медіа файли відсутні</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                ));
                            })()}

                            {/* Кнопка "Ще" для завантаження додаткових записів */}
                            {hasMoreRecords && (
                                <div className="mt-6 text-center">
                                    <button
                                        onClick={loadMoreRecords}
                                        disabled={loadingMoreRecords}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                                    >
                                        {loadingMoreRecords ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Завантаження...</span>
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="w-4 h-4" />
                                                <span>{showingTodayOnly ? 'Показати за минулі дні' : 'Ще'}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Модальне вікно для перегляду медіа */}
            {selectedMedia && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={closeMediaModal}
                >
                    <div
                        className="relative bg-gray-800 rounded-lg overflow-hidden flex flex-col"
                        style={{
                            width: 'min(50vw, 50vh)',
                            height: 'min(50vw, 50vh)',
                            maxWidth: '800px',
                            maxHeight: '800px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Заголовок */}
                        <div className="flex items-center justify-between p-3 bg-gray-900 border-b border-gray-700 flex-shrink-0">
                            <div className="flex-1 min-w-0 mr-2">
                                <h3 className="text-sm font-semibold text-white truncate">
                                    {selectedMedia.original_filename}
                                </h3>
                                <p className="text-xs text-gray-400">
                                    {selectedMedia.media_type.toUpperCase()} • {(selectedMedia.file_size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                            <button
                                onClick={closeMediaModal}
                                className="p-2 hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Контент */}
                        <div className="flex-1 min-h-0 overflow-auto p-4 flex items-center justify-center">
                            <MediaPlayer
                                media={selectedMedia}
                                loadMediaFile={loadMediaFile}
                                loadThumbnail={loadThumbnail}
                                thumbnailUrls={thumbnailUrls}
                                onMediaClick={() => openMediaInNewTab(selectedMedia)}
                            />
                        </div>

                        {/* Кнопки дій */}
                        <div className="p-3 bg-gray-900 border-t border-gray-700 flex-shrink-0">
                            <div className="flex gap-2 justify-center">
                                <button
                                    onClick={() => openMediaInNewTab(selectedMedia)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors text-sm"
                                >
                                    <Eye className="w-4 h-4" />
                                    Відкрити повний розмір
                                </button>
                                <button
                                    onClick={() => downloadMediaFile(selectedMedia)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    Завантажити
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальне вікно підтвердження видалення спостереження */}
            {confirmDeleteModal.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg border border-gray-600 p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-white mb-4">Підтвердження</h3>
                        <p className="text-gray-300 mb-6">
                            Ви впевнені, що хочете позначити це спостереження як зникле? Ця дія не може бути скасована.
                        </p>
                        <div className="flex gap-3 justify-end" style={{"justify-content": "center"}} >
                            <button
                                onClick={() => setConfirmDeleteModal({ show: false, observationId: null })}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                            >
                                Скасувати
                            </button>
                            <button
                                onClick={() => {
                                    markAsDisappeared(confirmDeleteModal.observationId);
                                    setConfirmDeleteModal({ show: false, observationId: null });
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                            >
                                Підтвердити
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальне вікно підтвердження видалення медіа */}
            {confirmDeleteMedia.show && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg border border-gray-600 p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-white mb-4">Видалення медіа</h3>
                        <p className="text-gray-300 mb-6">
                            Ви впевнені, що хочете видалити цей медіа файл? Ця дія не може бути скасована.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setConfirmDeleteMedia({ show: false, mediaId: null, observationId: null })}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                            >
                                Скасувати
                            </button>
                            <button
                                onClick={() => handleDeleteMedia(confirmDeleteMedia.mediaId, confirmDeleteMedia.observationId)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                            >
                                Видалити
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast notifications */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={closeToast}
                    duration={3000}
                />
            )}

        </div>
    );
};

export default UserPage;