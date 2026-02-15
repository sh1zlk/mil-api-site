import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Eye,
    Filter,
    Calendar,
    MapPin,
    Radio,
    RefreshCw,
    Search,
    X,
    ChevronDown,
    ChevronUp,
    Image,
    Video,
    Loader2,
    Tag,
    Clock,
    Play,
    Pause,
    Activity,
    Target
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { formatDateUA, normalizeApiDate, formatDuration } from '../../utils/dateUtils';
import { useToastContext } from '../../contexts/ToastContext';

const AllObservationsPage = () => {
    const navigate = useNavigate();
    const { showSuccess, showError, showWarning } = useToastContext();

    // Стан даних
    const [observations, setObservations] = useState([]);
    const [posts, setPosts] = useState([]);
    const [signalTypes, setSignalTypes] = useState([]);
    const [tags, setTags] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Стан фільтрів
    const [filters, setFilters] = useState({
        dateFrom: '',
        dateTo: '',
        postId: 'all',
        signalTypeId: 'all',
        status: 'all',
        confidenceLevel: 'all',
        frequencyFrom: '',
        frequencyTo: '',
        videoFrequencyFrom: '',
        videoFrequencyTo: '',
        tagIds: []
    });

    // Стан сортування
    const [sortConfig, setSortConfig] = useState({
        key: 'created_at',
        direction: 'desc'
    });

    // Стан пагінації
    const [pagination, setPagination] = useState({
        page: 1,
        page_size: 50,
        total: 0
    });

    // Стан для розгорнутих рядків
    const [expandedRows, setExpandedRows] = useState(new Set());

    // Стан для медіа файлів кожного спостереження
    const [mediaByObservation, setMediaByObservation] = useState({});
    const [loadingMedia, setLoadingMedia] = useState({});

    // Стан для перегляду медіа на весь екран
    const [fullscreenMedia, setFullscreenMedia] = useState(null);
    const [loadingFullscreen, setLoadingFullscreen] = useState(false);

    // Стан для dropdown тегів
    const [showTagDropdown, setShowTagDropdown] = useState(false);
    const [tagSearchQuery, setTagSearchQuery] = useState('');

    // Стан для автооновлення
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastRefreshTime, setLastRefreshTime] = useState(null);
    const AUTO_REFRESH_INTERVAL = 30000; // 30 секунд

    // Режим пагінації
    const [paginationMode, setPaginationMode] = useState('pages'); // 'pages' | 'infinite' | 'loadmore'
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerTarget = useRef(null);

    // Завантаження довідників
    const loadReferenceData = async () => {
        try {
            const [postsData, signalTypesData, tagsData, usersData] = await Promise.all([
                api.posts.list({ page: 1, page_size: 100 }),
                api.signalTypes.list({ page: 1, page_size: 100 }),
                api.tags.list({ page: 1, page_size: 200 }),
                api.users.list({ page: 1, page_size: 200 })
            ]);
            setPosts(postsData);
            setSignalTypes(signalTypesData);
            setTags(tagsData);
            setUsers(usersData);
        } catch (err) {
            console.error('Помилка завантаження довідників:', err);
        }
    };

    const loadObservations = useCallback(async (silent = false, append = false) => {
        try {
            if (!silent && !append) {
                setLoading(true);
            }
            if (append) {
                setIsLoadingMore(true);
            }

            const params = {
                page: pagination.page,
                page_size: pagination.page_size
            };

            // Сортування - передаємо на сервер
            if (sortConfig.key) {
                params.sort_by = sortConfig.key;
                params.sort_order = sortConfig.direction === 'asc' ? 'ascending' : 'descending';
            }

            // Фільтр по посту
            if (filters.postId !== 'all') {
                params.post_id = parseInt(filters.postId);
            }

            // Фільтр по типу сигналу
            if (filters.signalTypeId !== 'all') {
                params.signal_type_id = parseInt(filters.signalTypeId);
            }

            // Фільтр по статусу
            if (filters.status !== 'all') {
                params.status = filters.status;
            }

            // Фільтр по рівню впевненості
            if (filters.confidenceLevel !== 'all') {
                params.confidence_level = filters.confidenceLevel;
            }

            // Фільтр по частоті (від)
            if (filters.frequencyFrom) {
                params.frequency_center_from = parseFloat(filters.frequencyFrom);
            }

            // Фільтр по частоті (до)
            if (filters.frequencyTo) {
                params.frequency_center_to = parseFloat(filters.frequencyTo);
            }

            // Фільтр по відео частоті (від)
            if (filters.videoFrequencyFrom) {
                params.video_frequency_from = parseFloat(filters.videoFrequencyFrom);
            }

            // Фільтр по відео частоті (до)
            if (filters.videoFrequencyTo) {
                params.video_frequency_to = parseFloat(filters.videoFrequencyTo);
            }

            // Фільтр по тегах
            if (filters.tagIds && filters.tagIds.length > 0) {
                params.tag_ids = filters.tagIds.join(',');
            }

            // Фільтр по даті створення (від)
            if (filters.dateFrom) {
                // Конвертуємо дату в UTC для серверу
                const dateFrom = new Date(filters.dateFrom);
                dateFrom.setHours(0, 0, 0, 0);
                params.created_at_from = dateFrom.toISOString();
            }

            // Фільтр по даті створення (до)
            if (filters.dateTo) {
                // Конвертуємо дату в UTC для серверу
                const dateTo = new Date(filters.dateTo);
                dateTo.setHours(23, 59, 59, 999);
                params.created_at_to = dateTo.toISOString();
            }

            // Використовуємо Search API (повертає об'єкт з пагінацією)
            const searchResponse = await api.observations.search(params);

            console.log('🔍 Search API response:', searchResponse);
            if (searchResponse.items && searchResponse.items.length > 0) {
                console.log('📋 First observation from search:', searchResponse.items[0]);
                console.log('🏷️ Has tag_ids in search?', 'tag_ids' in searchResponse.items[0], searchResponse.items[0].tag_ids);
            }

            const newItems = searchResponse.items || [];

            if (append) {
                setObservations(prev => [...prev, ...newItems]);
            } else {
                setObservations(newItems);
            }

            setPagination(prev => ({
                ...prev,
                total: searchResponse.total || 0,
                page: searchResponse.page || 1,
                page_size: searchResponse.page_size || 50
            }));

            const totalPages = Math.ceil((searchResponse.total || 0) / (searchResponse.page_size || 50));
            setHasMore((searchResponse.page || 1) < totalPages);

            setLastRefreshTime(new Date());

        } catch (err) {
            console.error('Помилка завантаження спостережень:', err);
            showError(err);
        } finally {
            if (!silent && !append) {
                setLoading(false);
            }
            if (append) {
                setIsLoadingMore(false);
            }
        }
    }, [filters, pagination.page, pagination.page_size, sortConfig]);

    // Завантаження довідників при монтуванні
    useEffect(() => {
        loadReferenceData();
    }, []);

    // Завантаження спостережень при зміні фільтрів, пагінації або сортування
    useEffect(() => {
        if (paginationMode === 'pages') {
            // Звичайна пагінація - завантажуємо конкретну сторінку
            loadObservations();
        } else if (pagination.page === 1) {
            // Перша сторінка для infinite/loadmore
            loadObservations();
        } else {
            // Додаткові сторінки для infinite/loadmore
            loadObservations(false, true);
        }
    }, [loadObservations, paginationMode]);

    // Автооновлення спостережень
    useEffect(() => {
        if (!autoRefresh || paginationMode !== 'pages') return;

        const intervalId = setInterval(() => {
            loadObservations(true); // silent refresh - без індикатора завантаження
        }, AUTO_REFRESH_INTERVAL);

        return () => clearInterval(intervalId);
    }, [autoRefresh, loadObservations, AUTO_REFRESH_INTERVAL, paginationMode]);

    // Infinite Scroll - Intersection Observer
    useEffect(() => {
        if (paginationMode !== 'infinite') return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && !loading) {
                    // Завантажуємо наступну сторінку
                    setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [paginationMode, hasMore, isLoadingMore, loading]);

    // Функція для завантаження наступної порції (Load More)
    const loadMore = () => {
        if (hasMore && !isLoadingMore) {
            setPagination(prev => ({ ...prev, page: prev.page + 1 }));
        }
    };

    // Скидання пагінації при зміні режиму
    const changePaginationMode = (mode) => {
        setPaginationMode(mode);
        setPagination(prev => ({ ...prev, page: 1 }));
        setObservations([]);
        setHasMore(true);
    };

    // Обробники фільтрів
    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Скидаємо на першу сторінку
    };

    const clearFilters = () => {
        setFilters({
            dateFrom: '',
            dateTo: '',
            postId: 'all',
            signalTypeId: 'all',
            status: 'all',
            confidenceLevel: 'all',
            frequencyFrom: '',
            frequencyTo: '',
            videoFrequencyFrom: '',
            videoFrequencyTo: '',
            tagIds: []
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // Обробник сортування
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Завантаження медіа для спостереження
    const loadMediaForObservation = async (observationId) => {
        if (mediaByObservation[observationId] || loadingMedia[observationId]) {
            return; // Вже завантажено або завантажується
        }

        setLoadingMedia(prev => ({ ...prev, [observationId]: true }));

        try {
            const mediaFiles = await api.media.listForObservation(observationId);

            // Завантажуємо мініатюри для кожного файлу
            const mediaWithThumbnails = await Promise.all(
                mediaFiles.map(async (media) => {
                    try {
                        const thumbnailBlob = await api.media.getThumbnail(media.id);
                        const thumbnailUrl = URL.createObjectURL(thumbnailBlob);
                        return { ...media, thumbnailUrl };
                    } catch (err) {
                        console.error(`Помилка завантаження мініатюри для ${media.id}:`, err);
                        return { ...media, thumbnailUrl: null };
                    }
                })
            );

            setMediaByObservation(prev => ({
                ...prev,
                [observationId]: mediaWithThumbnails
            }));
        } catch (err) {
            console.error('Помилка завантаження медіа:', err);
            setMediaByObservation(prev => ({
                ...prev,
                [observationId]: []
            }));
        } finally {
            setLoadingMedia(prev => ({ ...prev, [observationId]: false }));
        }
    };

    // Розгортання рядка
    const toggleRowExpand = (id) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
                // Завантажуємо медіа при розгортанні
                loadMediaForObservation(id);
            }
            return newSet;
        });
    };

    // Відкрити медіа на весь екран
    const openFullscreen = async (media) => {
        // Показуємо модальне вікно з інформацією про файл і індикатором завантаження
        setFullscreenMedia({ ...media, fullUrl: null });
        setLoadingFullscreen(true);

        try {
            const blob = await api.media.download(media.id);
            const url = URL.createObjectURL(blob);
            setFullscreenMedia({ ...media, fullUrl: url });
        } catch (err) {
            console.error('Помилка завантаження медіа:', err);
            // Закриваємо модальне вікно при помилці
            setFullscreenMedia(null);
        } finally {
            setLoadingFullscreen(false);
        }
    };

    // Закрити повноекранний режим
    const closeFullscreen = () => {
        if (fullscreenMedia?.fullUrl) {
            URL.revokeObjectURL(fullscreenMedia.fullUrl);
        }
        setFullscreenMedia(null);
        setLoadingFullscreen(false);
    };

    // Отримання назви посту
    const getPostName = (postId) => {
        const post = posts.find(p => p.id === postId);
        return post ? `${post.name} (${post.code})` : `Пост #${postId}`;
    };

    // Отримання назви типу сигналу
    const getSignalTypeName = (signalTypeId) => {
        const signalType = signalTypes.find(st => st.id === signalTypeId);
        return signalType ? signalType.name : `Тип #${signalTypeId}`;
    };

    // Отримання тегу по ID
    const getTagById = (tagId) => {
        return tags.find(t => t.id === tagId);
    };

    // Отримання імені користувача по ID
    const getUsernameById = (userId) => {
        const user = users.find(u => u.id === userId);
        return user ? (user.username_alias || user.username) : `Користувач #${userId}`;
    };

    // Форматування дати з українським часовим поясом
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return formatDateUA(dateString);
    };

    // Іконка сортування
    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) {
            return <ChevronDown className="w-4 h-4 opacity-30" />;
        }
        return sortConfig.direction === 'asc'
            ? <ChevronUp className="w-4 h-4 text-green-400" />
            : <ChevronDown className="w-4 h-4 text-green-400" />;
    };

    // Статус badge
    const StatusBadge = ({ status }) => {
        const statusColors = {
            active: 'bg-green-500/20 text-green-400 border-green-500/30',
            inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
            disappeared: 'bg-red-500/20 text-red-400 border-red-500/30'
        };

        const statusLabels = {
            active: 'Активний',
            inactive: 'Неактивний',
            disappeared: 'Зник'
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs border ${statusColors[status] || statusColors.inactive}`}>
                {statusLabels[status] || status}
            </span>
        );
    };

    // Рівень впевненості badge
    const ConfidenceBadge = ({ level }) => {
        const levelColors = {
            high: 'bg-green-500/20 text-green-400',
            medium: 'bg-yellow-500/20 text-yellow-400',
            low: 'bg-red-500/20 text-red-400'
        };

        const levelLabels = {
            high: 'Високий',
            medium: 'Середній',
            low: 'Низький'
        };

        return (
            <span className={`px-2 py-1 rounded text-xs ${levelColors[level] || levelColors.medium}`}>
                {levelLabels[level] || level}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin')}
                            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <Eye className="w-8 h-8 text-green-400" />
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    Всі спостереження
                                </h1>
                                <p className="text-gray-400 text-sm">
                                    Перегляд спостережень від усіх постів
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Вибір режиму пагінації */}
                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-lg">
                            <span className="text-sm text-gray-400">Режим:</span>
                            <select
                                value={paginationMode}
                                onChange={(e) => changePaginationMode(e.target.value)}
                                className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:border-green-500"
                            >
                                <option value="pages">Сторінки</option>
                                <option value="loadmore">Завантажити ще</option>
                                <option value="infinite">Нескінченна прокрутка</option>
                            </select>
                        </div>

                        {/* Індикатор останнього оновлення */}
                        {lastRefreshTime && (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span>
                                    Оновлено: {lastRefreshTime.toLocaleTimeString('uk-UA', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })}
                                </span>
                            </div>
                        )}

                        {/* Кнопка автооновлення (тільки для режиму сторінок) */}
                        {paginationMode === 'pages' && (
                            <button
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                                    autoRefresh
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                                }`}
                                title={autoRefresh ? 'Автооновлення увімкнено' : 'Автооновлення вимкнено'}
                            >
                                {autoRefresh ? (
                                    <>
                                        <Pause className="w-4 h-4" />
                                        <span className="hidden sm:inline">Авто</span>
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4" />
                                        <span className="hidden sm:inline">Авто</span>
                                    </>
                                )}
                            </button>
                        )}

                        {/* Кнопка ручного оновлення */}
                        <button
                            onClick={() => loadObservations()}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Оновити</span>
                        </button>
                    </div>
                </div>

                {/* Фільтри */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-green-400" />
                        <h2 className="text-lg font-semibold text-white">Фільтри</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {/* Фільтр по даті (від) */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Дата від
                            </label>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                            />
                        </div>

                        {/* Фільтр по даті (до) */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Дата до
                            </label>
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                            />
                        </div>

                        {/* Фільтр по посту */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                Пост
                            </label>
                            <select
                                value={filters.postId}
                                onChange={(e) => handleFilterChange('postId', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                            >
                                <option value="all">Всі пости</option>
                                {posts.map(post => (
                                    <option key={post.id} value={post.id}>
                                        {post.name} ({post.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Фільтр по типу сигналу */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">
                                <Radio className="w-4 h-4 inline mr-1" />
                                Тип сигналу
                            </label>
                            <select
                                value={filters.signalTypeId}
                                onChange={(e) => handleFilterChange('signalTypeId', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                            >
                                <option value="all">Всі типи</option>
                                {signalTypes.map(type => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Фільтр по статусу */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">
                                <Activity className="w-4 h-4 inline mr-1" />
                                Статус
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                            >
                                <option value="all">Всі статуси</option>
                                <option value="active">Активний</option>
                                <option value="inactive">Неактивний</option>
                                <option value="disappeared">Зник</option>
                            </select>
                        </div>

                        {/* Фільтр по рівню впевненості */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">
                                <Target className="w-4 h-4 inline mr-1" />
                                Рівень впевненості
                            </label>
                            <select
                                value={filters.confidenceLevel}
                                onChange={(e) => handleFilterChange('confidenceLevel', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                            >
                                <option value="all">Всі рівні</option>
                                <option value="high">Високий</option>
                                <option value="medium">Середній</option>
                                <option value="low">Низький</option>
                            </select>
                        </div>

                        {/* Фільтр по частоті (від) */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">
                                <Radio className="w-4 h-4 inline mr-1" />
                                Частота від (МГц)
                            </label>
                            <input
                                type="number"
                                step="0.001"
                                min="0"
                                placeholder="Мін. частота"
                                value={filters.frequencyFrom}
                                onChange={(e) => handleFilterChange('frequencyFrom', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                            />
                        </div>

                        {/* Фільтр по частоті (до) */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">
                                <Radio className="w-4 h-4 inline mr-1" />
                                Частота до (МГц)
                            </label>
                            <input
                                type="number"
                                step="0.001"
                                min="0"
                                placeholder="Макс. частота"
                                value={filters.frequencyTo}
                                onChange={(e) => handleFilterChange('frequencyTo', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                            />
                        </div>

                        {/* Фільтр по відео частоті (від) */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">
                                <Video className="w-4 h-4 inline mr-1" />
                                Відео частота від (МГц)
                            </label>
                            <input
                                type="number"
                                step="0.001"
                                min="0"
                                placeholder="Мін. відео частота"
                                value={filters.videoFrequencyFrom}
                                onChange={(e) => handleFilterChange('videoFrequencyFrom', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                            />
                        </div>

                        {/* Фільтр по відео частоті (до) */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">
                                <Video className="w-4 h-4 inline mr-1" />
                                Відео частота до (МГц)
                            </label>
                            <input
                                type="number"
                                step="0.001"
                                min="0"
                                placeholder="Макс. відео частота"
                                value={filters.videoFrequencyTo}
                                onChange={(e) => handleFilterChange('videoFrequencyTo', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                            />
                        </div>

                        {/* Фільтр по тегах */}
                        <div className="lg:col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">
                                <Tag className="w-4 h-4 inline mr-1" />
                                Теги
                            </label>
                            <div className="relative">
                                {/* Поле вводу з вибраними тегами */}
                                <div
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus-within:border-green-500 cursor-pointer min-h-[42px] flex flex-wrap gap-1 items-center"
                                    onClick={() => setShowTagDropdown(!showTagDropdown)}
                                >
                                    {filters.tagIds.length > 0 ? (
                                        <>
                                            {filters.tagIds.map(tagId => {
                                                const tag = tags.find(t => t.id === tagId);
                                                return tag ? (
                                                    <span
                                                        key={tagId}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full"
                                                    >
                                                        {tag.name}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleFilterChange('tagIds', filters.tagIds.filter(id => id !== tagId));
                                                            }}
                                                            className="hover:bg-green-600 rounded-full p-0.5"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </span>
                                                ) : null;
                                            })}
                                        </>
                                    ) : (
                                        <span className="text-gray-400">Оберіть теги...</span>
                                    )}
                                </div>

                                {/* Випадаючий список */}
                                {showTagDropdown && (
                                    <>
                                        {/* Overlay для закриття */}
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => {
                                                setShowTagDropdown(false);
                                                setTagSearchQuery('');
                                            }}
                                        />
                                        <div className="absolute z-20 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
                                            {/* Пошук */}
                                            <div className="p-2 border-b border-gray-600">
                                                <div className="relative">
                                                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={tagSearchQuery}
                                                        onChange={(e) => setTagSearchQuery(e.target.value)}
                                                        placeholder="Пошук тегів..."
                                                        className="w-full pl-8 pr-3 py-1.5 bg-gray-600 border border-gray-500 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-500"
                                                        onClick={(e) => e.stopPropagation()}
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            {/* Список тегів */}
                                            <div className="max-h-48 overflow-y-auto">
                                                {tags
                                                    .filter(tag => tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()))
                                                    .map(tag => (
                                                        <button
                                                            key={tag.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newTagIds = filters.tagIds.includes(tag.id)
                                                                    ? filters.tagIds.filter(id => id !== tag.id)
                                                                    : [...filters.tagIds, tag.id];
                                                                handleFilterChange('tagIds', newTagIds);
                                                            }}
                                                            className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-600 transition-colors ${
                                                                filters.tagIds.includes(tag.id) ? 'bg-gray-600' : ''
                                                            }`}
                                                        >
                                                            <span className="text-white">{tag.name}</span>
                                                            {filters.tagIds.includes(tag.id) && (
                                                                <span className="text-green-400">✓</span>
                                                            )}
                                                        </button>
                                                    ))}
                                                {tags.filter(tag => tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())).length === 0 && (
                                                    <div className="px-3 py-4 text-center text-gray-400 text-sm">
                                                        Тегів не знайдено
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Кнопка очищення фільтрів */}
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Скинути фільтри
                        </button>
                    </div>
                </div>

                {/* Статистика */}
                <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>
                        Знайдено: <strong className="text-white">{pagination.total}</strong> спостережень
                        {pagination.total > pagination.page_size && (
                            <span className="ml-2">
                                (показано {((pagination.page - 1) * pagination.page_size) + 1}-{Math.min(pagination.page * pagination.page_size, pagination.total)})
                            </span>
                        )}
                    </span>
                    {(filters.dateFrom || filters.dateTo || filters.postId !== 'all' || filters.signalTypeId !== 'all' || filters.status !== 'all' || filters.confidenceLevel !== 'all' || filters.frequencyFrom || filters.frequencyTo || filters.videoFrequencyFrom || filters.videoFrequencyTo || filters.tagIds.length > 0) && (
                        <span className="text-green-400">(застосовані фільтри)</span>
                    )}
                </div>

                {/* Помилка */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-400">
                        {error}
                    </div>
                )}

                {/* Таблиця */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-700/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        <button
                                            onClick={() => handleSort('id')}
                                            className="flex items-center gap-1 hover:text-white transition-colors"
                                        >
                                            ID
                                            <SortIcon columnKey="id" />
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        <button
                                            onClick={() => handleSort('created_at')}
                                            className="flex items-center gap-1 hover:text-white transition-colors"
                                        >
                                            Дата створення
                                            <SortIcon columnKey="created_at" />
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Пост
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Тип сигналу
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Теги
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Частота
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Статус
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Впевненість
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Дії
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="px-4 py-8 text-center">
                                            <div className="flex items-center justify-center gap-2 text-gray-400">
                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                                Завантаження...
                                            </div>
                                        </td>
                                    </tr>
                                ) : observations.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="px-4 py-8 text-center text-gray-400">
                                            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            Спостережень не знайдено
                                        </td>
                                    </tr>
                                ) : (
                                    observations.map(obs => (
                                        <React.Fragment key={obs.id}>
                                            <tr className="hover:bg-gray-700/50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-white font-mono">
                                                    #{obs.id}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-300">
                                                    {formatDate(obs.created_at)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-300">
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4 text-green-400" />
                                                        {getPostName(obs.post_id)}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-300">
                                                    <div className="flex items-center gap-1">
                                                        <Radio className="w-4 h-4 text-blue-400" />
                                                        {getSignalTypeName(obs.signal_type_id)}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <div className="flex flex-wrap gap-1">
                                                        {obs.tag_ids && obs.tag_ids.length > 0 ? (
                                                            obs.tag_ids.map(tagId => {
                                                                const tag = getTagById(tagId);
                                                                return tag ? (
                                                                    <span
                                                                        key={tagId}
                                                                        className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs border border-blue-500/30"
                                                                    >
                                                                        {tag.name}
                                                                    </span>
                                                                ) : null;
                                                            })
                                                        ) : (
                                                            <span className="text-gray-500">-</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                                                    <div className="flex flex-col gap-1">
                                                        {/* Основна частота */}
                                                        <div>
                                                            {obs.frequency_min && obs.frequency_max
                                                                ? `${obs.frequency_min} - ${obs.frequency_max} МГц`
                                                                : '-'
                                                            }
                                                        </div>
                                                        {/* Відео частота */}
                                                        {obs.video_frequency_min && obs.video_frequency_max ? (
                                                            <div className="text-blue-400 text-xs">
                                                                відео: {obs.video_frequency_min} - {obs.video_frequency_max} МГц
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <StatusBadge status={obs.status} />
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <ConfidenceBadge level={obs.confidence_level} />
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <button
                                                        onClick={() => toggleRowExpand(obs.id)}
                                                        className="p-1.5 rounded hover:bg-gray-600 text-gray-400 hover:text-white transition-colors"
                                                        title="Деталі"
                                                    >
                                                        {expandedRows.has(obs.id)
                                                            ? <ChevronUp className="w-4 h-4" />
                                                            : <ChevronDown className="w-4 h-4" />
                                                        }
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Розгорнуті деталі */}
                                            {expandedRows.has(obs.id) && (
                                                <tr className="bg-gray-700/30">
                                                    <td colSpan="9" className="px-4 py-4">
                                                        <div className="space-y-3">
                                                            {/* Рядок 1: Користувач, Дата спостереження, Тривалість */}
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm pb-3 border-b border-gray-600">
                                                                <div>
                                                                    <span className="text-gray-400">Користувач:</span>
                                                                    <span className="ml-2 text-white font-medium">{getUsernameById(obs.user_id)}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-400">Дата спостереження:</span>
                                                                    <span className="ml-2 text-white font-medium">{formatDate(obs.observed_at)}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-400">Тривалість:</span>
                                                                    <span className="ml-2 text-white font-medium">
                                                                        {formatDuration(obs.duration_seconds)}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Рядок 2: Частота і Відео частота */}
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pb-3 border-b border-gray-600">
                                                                <div>
                                                                    <span className="text-gray-400">Частота:</span>
                                                                    <span className="ml-2 text-white font-mono">
                                                                        {obs.frequency_min && obs.frequency_max
                                                                            ? `${obs.frequency_min} - ${obs.frequency_max} МГц`
                                                                            : '-'}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-400">Відео частота:</span>
                                                                    <span className="ml-2 text-blue-300 font-mono">
                                                                        {obs.video_frequency_min && obs.video_frequency_max
                                                                            ? `${obs.video_frequency_min} - ${obs.video_frequency_max} МГц`
                                                                            : '-'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Рядок 3: Коментар */}
                                                            {obs.comment && (
                                                                <div className="text-sm pb-3 border-b border-gray-600">
                                                                    <span className="text-gray-400 block mb-2">Коментар:</span>
                                                                    <div className="text-white bg-gray-800 rounded p-3">
                                                                        <p className="whitespace-pre-wrap break-words">
                                                                            {obs.comment}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Блок 4: Медіа файли */}
                                                            <div className="text-sm">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <Image className="w-4 h-4 text-gray-400" />
                                                                    <span className="text-gray-400">Медіа файли:</span>
                                                                    {obs.media_ids && obs.media_ids.length > 0 && (
                                                                        <span className="text-green-400 text-xs">
                                                                            ({obs.media_ids.length} файл(ів))
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {loadingMedia[obs.id] ? (
                                                                    <div className="flex items-center gap-2 text-gray-400">
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                        Завантаження медіа...
                                                                    </div>
                                                                ) : mediaByObservation[obs.id]?.length > 0 ? (
                                                                    <div className="flex flex-wrap gap-3">
                                                                        {mediaByObservation[obs.id].map((media) => (
                                                                            <div
                                                                                key={media.id}
                                                                                className="relative group cursor-pointer"
                                                                                onClick={() => openFullscreen(media)}
                                                                            >
                                                                                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-800 border border-gray-600 hover:border-green-500 transition-colors">
                                                                                    {media.thumbnailUrl ? (
                                                                                        <img
                                                                                            src={media.thumbnailUrl}
                                                                                            alt={media.original_filename || 'Медіа'}
                                                                                            className="w-full h-full object-cover"
                                                                                        />
                                                                                    ) : (
                                                                                        <div className="w-full h-full flex items-center justify-center">
                                                                                            {media.media_type === 'video' ? (
                                                                                                <Video className="w-8 h-8 text-gray-500" />
                                                                                            ) : (
                                                                                                <Image className="w-8 h-8 text-gray-500" />
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                {media.media_type === 'video' && (
                                                                                    <div className="absolute top-1 right-1 bg-black/60 rounded px-1">
                                                                                        <Video className="w-3 h-3 text-white" />
                                                                                    </div>
                                                                                )}
                                                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                                                    <Eye className="w-6 h-6 text-white" />
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-500">Немає медіа файлів</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Load More кнопка */}
                {paginationMode === 'loadmore' && hasMore && observations.length > 0 && (
                    <div className="flex justify-center py-6">
                        <button
                            onClick={loadMore}
                            disabled={isLoadingMore}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                        >
                            {isLoadingMore ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Завантаження...
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-5 h-5" />
                                    Завантажити ще
                                    {pagination.total > 0 && (
                                        <span className="ml-1 text-sm opacity-80">
                                            ({observations.length} з {pagination.total})
                                        </span>
                                    )}
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Infinite Scroll індикатор */}
                {paginationMode === 'infinite' && (
                    <div ref={observerTarget} className="py-6">
                        {isLoadingMore && (
                            <div className="flex justify-center items-center gap-2 text-gray-400">
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                <span>Завантаження...</span>
                            </div>
                        )}
                        {!hasMore && observations.length > 0 && (
                            <div className="text-center text-gray-500 text-sm">
                                Всі спостереження завантажено ({observations.length} з {pagination.total})
                            </div>
                        )}
                    </div>
                )}

                {/* Звичайна пагінація */}
                {paginationMode === 'pages' && pagination.total > 0 && (
                    <div className="flex items-center justify-between text-sm text-gray-400">
                        <div>
                            Сторінка <strong className="text-white">{pagination.page}</strong> з{' '}
                            <strong className="text-white">{Math.ceil(pagination.total / pagination.page_size)}</strong>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Навігація по сторінках */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                                    disabled={pagination.page === 1}
                                    className="px-3 py-1 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                                >
                                    ««
                                </button>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                    disabled={pagination.page === 1}
                                    className="px-3 py-1 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                                >
                                    «
                                </button>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(Math.ceil(pagination.total / pagination.page_size), prev.page + 1) }))}
                                    disabled={pagination.page >= Math.ceil(pagination.total / pagination.page_size)}
                                    className="px-3 py-1 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                                >
                                    »
                                </button>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.ceil(pagination.total / pagination.page_size) }))}
                                    disabled={pagination.page >= Math.ceil(pagination.total / pagination.page_size)}
                                    className="px-3 py-1 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                                >
                                    »»
                                </button>
                            </div>

                            {/* Розмір сторінки */}
                            <div className="flex items-center gap-2">
                                <span>Записів на сторінці:</span>
                                <select
                                    value={pagination.page_size}
                                    onChange={(e) => setPagination(prev => ({ ...prev, page_size: parseInt(e.target.value), page: 1 }))}
                                    className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white"
                                >
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                    <option value="200">200</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Повноекранний перегляд медіа */}
            {fullscreenMedia && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={closeFullscreen}
                >
                    <button
                        onClick={closeFullscreen}
                        className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors z-10"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div
                        className="max-w-full max-h-full flex flex-col items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {loadingFullscreen ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 border-4 border-gray-600 border-t-green-500 rounded-full animate-spin" />
                                <div className="text-white text-lg">Завантаження медіа...</div>
                                {fullscreenMedia.original_filename && (
                                    <div className="text-gray-400 text-sm">
                                        {fullscreenMedia.original_filename}
                                    </div>
                                )}
                                {fullscreenMedia.media_type && (
                                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                                        {fullscreenMedia.media_type === 'video' ? (
                                            <>
                                                <Video className="w-4 h-4" />
                                                <span>Відео</span>
                                            </>
                                        ) : (
                                            <>
                                                <Image className="w-4 h-4" />
                                                <span>Зображення</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : fullscreenMedia.fullUrl ? (
                            <>
                                {fullscreenMedia.media_type === 'video' ? (
                                    <video
                                        src={fullscreenMedia.fullUrl}
                                        controls
                                        autoPlay
                                        className="max-w-full max-h-[90vh] rounded-lg"
                                    />
                                ) : (
                                    <img
                                        src={fullscreenMedia.fullUrl}
                                        alt={fullscreenMedia.original_filename || 'Медіа'}
                                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                                    />
                                )}

                                {fullscreenMedia.original_filename && (
                                    <div className="text-center mt-2 text-gray-400 text-sm">
                                        {fullscreenMedia.original_filename}
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllObservationsPage;
