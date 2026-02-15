import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, MapPin, Settings, Plus, Edit3, Trash2, Save, X, Key, Eye, EyeOff, CheckCircle, Upload, FileText, Power, Radio, Folder, Tag, Check } from 'lucide-react';
import CertificateUploadModal from '../forms/CertificateUploadModal';
import SignalTypeModal from '../forms/SignalTypeModal';
import CategoryModal from '../forms/CategoryModal';
import { ukraineRegions, citiesByRegion } from '../common/ukraineData';
import { api } from '../../services/apiClient';
import { formatDateUA, formatDateOnlyUA } from '../../utils/dateUtils';
import { useToastContext } from '../../contexts/ToastContext';

const AdminPage = () => {
    const navigate = useNavigate();
    const { showSuccess, showError, showWarning, showInfo } = useToastContext();

    const ukraineData = {
        "Київська область": ["Київ", "Вишгород", "Ірпінь", "Буча", "Бровари", "Бориспіль", "Узлісся", "Васильків", "Обухів", "Переяслав", "Забара", "Макарів", "Рокитне", "Вишневе", "Гостомель", "Берегомет", "Миротинці", "Піддубці", "Юнаківка", "Клавдієво-Тарасове"],
        "Харківська область": ["Харків", "Лозова", "Ізюм", "Чугуїв", "Куп'янськ", "Люботин", "Первомайськ", "Мерефа", "Недригайлів", "Золочів", "Краснокутськ", "Близнюки", "Старий Оскіл", "Коханівка", "Кочеток", "Шевченкове", "Зміїв", "Борова", "Сахновщина", "Верхній Салтів"],
        "Донецька область": ["Донецьк", "Маріуполь", "Краматорськ", "Слов'янськ", "Горлівка", "Дружківка", "Костянтинівка", "Артемівськ", "Макіївка", "Єнакієво", "Ясинувата", "Авдіївка", "Торецьк", "Кальміус", "Іванівськ", "Красна Лука", "Миколаївка", "Докучаївськ", "Веселе", "Петровське"],
        "Львівська область": ["Львів", "Дрогобич", "Самбір", "Стрий", "Червоноград", "Мостиська", "Радехів", "Турка", "Николаїв", "Старий Самбір", "Немирів", "Миколаїв", "Кульпарків", "Борислав", "Трускавець", "Сокаль", "Іванічі", "Грибівці", "Ходорів", "Комарно"],
        "Одеська область": ["Одеса", "Ізмаїл", "Білгород-Дністровський", "Аккермань", "Вилкове", "Килія", "Ренія", "Кілійськ", "Любашівка", "Подільськ", "Сарата", "Середино-Буд", "Знаменка", "Іванівка", "Раскова", "Комунарське", "Першотравневе", "Теплівка", "Артем", "Вознесенськ"],
        "Дніпропетровська область": ["Дніпро", "Кривий Ріг", "Павлоград", "Першоградськ", "Кам'янське", "Днипродзержинськ", "Синельникове", "Вільногірськ", "Орджонікідзе", "Петропавлівськ", "Амур-Нижньодніпровськ", "Верхньодніпровськ", "Томаківка", "Роздільна", "Межирічанськ", "Слов'яногірськ", "Спартак", "Краснозаводськ", "Криворіжськ", "Жовтневе"],
        "Запорізька область": ["Запоріжжя", "Мелітополь", "Енергодар", "Токмак", "Приморськ", "Геніческ", "Вільнозаводське", "Кам'янськ-Запорізький", "Новомиколаївка", "Бартоломіївка", "Роздільна", "Якимівка", "Акімівка", "Роксолани", "Каховка", "Сокур", "Новоіванівка", "Чумаки", "Ялта", "Плавні"],
        "Полтавська область": ["Полтава", "Кременчук", "Лубни", "Миргород", "Коростень", "Карлівка", "Глобино", "Охтирка", "Гадяч", "Хорол", "Зіньків", "Семенівка", "Кувалинки", "Диканька", "Дікісон", "Шишаки", "Андріївка", "Копійки", "Опішні", "Пирятин"],
        "Вінницька область": ["Вінниця", "Козятин", "Барановка", "Жмеринка", "Гайворон", "Теплик", "Муровані Курилівці", "Немирівці", "Крижопіль", "Синельникове", "Калинівка", "Тиврів", "Ямпіль", "Літинськ", "Чечельник", "Красилів", "Хмельницький", "Іванівці", "Озерівці", "Медведівці"],
        "Хмельницька область": ["Хмельницький", "Кам'янець-Подільський", "Старокостянтинів", "Нова Ушиця", "Шепетівка", "Ізяслав", "Красилів", "Летичів", "Деражня", "Дунаївці", "Славута", "Прилуки", "Вовчинець", "Волочиськ", "Струсів", "Джуринівка", "Вишнівець", "Чемеринці", "Мізоч", "Варваківка"],
        "Миколаївська область": ["Миколаїв", "Новоодеський", "Первомайськ", "Баштанка", "Вознесенськ", "Арабатська Стрілка", "Голопристанськ", "Чорноморськ", "Снігурівка", "Кривоозір'я", "Братськ", "Єланець", "Казанка", "Мирівськ", "Мелітополь", "Висунськ", "Кубань", "Раскова", "Очаків", "Южне"],
        "Луганська область": ["Луганськ", "Сєвєродонецьк", "Лисичанськ", "Рубіжне", "Старобільськ", "Кремінна", "Сватове", "Попасна", "Новоайдар", "Молодогвардійськ", "Антрацит", "Счастя", "Меловое", "Красна Лука", "Чернухине", "Охота", "Ніжнє-Голубе", "Брянцево", "Дяківка", "Перегородькі"],
        "Сумська область": ["Суми", "Конотоп", "Охтирка", "Глухів", "Шостка", "Середина-Буда", "Красна Полина", "Недригайлів", "Путивль", "Тростянець", "Липівськ", "Ромни", "Лебедин", "Дніпро-Лугськ", "Трилісків", "Мар'янівка", "Велика Писарівка", "Биківня", "Салтанівка", "Титівка"],
        "Чернігівська область": ["Чернігів", "Прилуки", "Ніжин", "Мена", "Батурин", "Ичня", "Коропи", "Нижин", "Щорськ", "Варва", "Семенівка", "Логойськ", "Сновськ", "Стародуб", "Талалаївка", "Клещівка", "Репки", "Борзна", "Бахмач", "Городня"],
        "Чернівецька область": ["Чернівці", "Кіцмань", "Сокирянці", "Сторожинець", "Хотин", "Вижниця", "Герца", "Новоселиця", "Дністровськ", "Путила", "Кельменці", "Мизоч", "Костопіл", "Кінчеба", "Кутилівці", "Козловиця", "Первомайськ", "Секурені", "Нагоряни", "Апшеронськ"],
        "Тернопільська область": ["Тернопіль", "Крем'янець", "Бережани", "Бучач", "Монастириськ", "Чортків", "Козельниця", "Кульмів", "Лановець", "Зборів", "Микулинці", "Носівка", "Ланівці", "Мільятин", "Нивра", "Нова Синява", "Почаїв", "Слобідка-Романівка", "Строївка", "Добромилівка"],
        "Івано-Франківська область": ["Івано-Франківськ", "Коломия", "Яремче", "Калуш", "Болехів", "Рогатин", "Снятин", "Верховина", "Надвірна", "Вижниця", "Фаскал", "Ясіня", "Буркут", "Татарів", "Угринів", "Отиня", "Долина", "Отинія", "Мильніки", "Ступка"],
        "Закарпатська область": ["Ужгород", "Мукачево", "Берегово", "Хуст", "Свалява", "Іршава", "Перечин", "Рахів", "Синевир", "Волове", "Турія", "Королево", "Сільвайш", "Água de Déva", "Дільтос", "Оноківці", "Вислок", "Вільок", "Лумшори", "Верхнім"],
        "Житомирська область": ["Житомир", "Бердичів", "Новоград-Волинський", "Коростень", "Овруч", "Козелець", "Чудин", "Ємільчино", "Малин", "Джурин", "Хорошків", "Костопіль", "Ковалівка", "Андріївка", "Бориспіль", "Святославка", "Гронь", "Гребля", "Лучка", "Мізоч"],
        "Кіровоградська область": ["Кіровоград", "Олександрія", "Гайворон", "Новомиргород", "Маловисківськ", "Петрівщина", "Знаменка", "Крипопіль", "Новопавлівськ", "Розумівка", "Новоукраїнськ", "Світловодськ", "Фанчиковщина", "Устинівка", "Гора", "Єрмолівщина", "Мар'янівка", "Божедарівка", "Кар'янівка", "Капітанівка"]
    };

    // Стан активної вкладки
    const [activeTab, setActiveTab] = useState('users');

    // Стани даних
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [posts, setPosts] = useState([]);
    const [signalTypes, setSignalTypes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);

    // Стани модальних вікон
    const [showUserModal, setShowUserModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showPostModal, setShowPostModal] = useState(false);
    const [showSSLModal, setShowSSLModal] = useState(false);
    const [showCertificateUploadModal, setShowCertificateUploadModal] = useState(false);
    const [showSignalTypeModal, setShowSignalTypeModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    // Стани редагування
    const [editingUser, setEditingUser] = useState(null);
    const [editingRole, setEditingRole] = useState(null);
    const [editingPost, setEditingPost] = useState(null);
    const [currentSSLUser, setCurrentSSLUser] = useState(null);
    const [editingSignalType, setEditingSignalType] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);

    // Стани для тегів
    const [newTagName, setNewTagName] = useState('');
    const [editingTag, setEditingTag] = useState(null);
    const [editingTagName, setEditingTagName] = useState('');
    const [showDeleteTagModal, setShowDeleteTagModal] = useState(false);
    const [tagToDelete, setTagToDelete] = useState(null);

    // Стан для SSL сертифікату
    const [sslCertData, setSSLCertData] = useState({
        certificate: null,
        cn: '',
        serial: '',
        fingerprint: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState({});
    const [citySearch, setCitySearch] = useState('');
    const [showCityDropdown, setShowCityDropdown] = useState(false);

    // Доступні дозволи для ролей (завантажуються з API)
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [postFilter, setPostFilter] = useState('active'); // 'active' | 'inactive' | 'all'
    const [userFilter, setUserFilter] = useState('active'); // 'active' | 'inactive' | 'all'
    const [currentUser, setCurrentUser] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Оновлення часу кожну секунду
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Отримання поточного користувача
    const fetchCurrentUser = useCallback(async () => {
        try {
            const response = await api.auth.me();
            setCurrentUser(response);
            console.log('[+] Поточний користувач:', response);
        } catch (error) {
            console.error('Помилка отримання поточного користувача:', error);
            setCurrentUser(null);
        }
    }, []);

    // Обробка помилок API
    const handleApiError = (error, context) => {
        console.error(`API Error in ${context}:`, error);
        showError(error);
    };


    // Завантаження користувачів з API
    const fetchUsers = useCallback(async () => {
        try {
            const apiUsers = await api.users.list({ size: 100 });

            // Для кожного користувача завантажуємо його ролі
            const formattedUsersPromises = apiUsers.map(async (user) => {
                let userRoles = [];
                try {
                    userRoles = await api.users.roles.list(user.id);
                } catch (roleError) {
                    console.error(`Помилка завантаження ролей для користувача ${user.id}:`, roleError);
                }

                return {
                    id: user.id,
                    username: user.username,
                    username_alias: user.username_alias,
                    roles: userRoles, // Зберігаємо всі ролі користувача
                    role_names: userRoles.map(r => r.display_name).join(', ') || 'Немає ролей',
                    post_id: user.post_id,
                    is_active: user.is_active,
                    last_login: user.last_login_at ? formatDateUA(user.last_login_at) : 'Ніколи',
                    created_at: formatDateOnlyUA(user.created_at),
                    ssl_cert_issued: true,
                    cert_expires_at: 'Н/Д'
                };
            });

            const formattedUsers = await Promise.all(formattedUsersPromises);

            setUsers(formattedUsers);
            console.log(`Завантажено ${formattedUsers.length} користувачів з API`);

            return formattedUsers;
        } catch (error) {
            console.error('Помилка завантаження користувачів:', error);
            handleApiError(error, 'завантаження користувачів');
            return [];
        }
    }, []);

    // Завантаження постів з API
    // Завантаження доступних permissions з API
    const fetchPermissions = useCallback(async () => {
        try {
            const permissions = await api.roles.listAllPermissions();
            setAvailablePermissions(permissions);
            console.log(`[+] Завантажено ${permissions.length} дозволів з API`);
        } catch (error) {
            console.error('Помилка завантаження дозволів:', error);
            // Fallback на базові дозволи
            setAvailablePermissions([
                { id: 1, name: 'USER_VIEW', display_name: 'Перегляд користувачів', description: '' },
                { id: 2, name: 'USER_MANAGE', display_name: 'Управління користувачами', description: '' },
                { id: 3, name: 'OBSERVATION_VIEW', display_name: 'Перегляд спостережень', description: '' },
                { id: 4, name: 'OBSERVATION_MANAGE', display_name: 'Управління спостереженнями', description: '' }
            ]);
        }
    }, []);

    const fetchPosts = useCallback(async (usersData = []) => {
        try {
            // Додаємо фільтр is_active
            const params = { page: 1, page_size: 100 };
            if (postFilter === 'active') {
                params.is_active = true;
            } else if (postFilter === 'inactive') {
                params.is_active = false;
            }
            // Якщо 'all' - не передаємо параметр

            const apiPosts = await api.posts.list(params);

            const formattedPosts = apiPosts.map(post => {
                const operatorsCount = usersData.filter(user => user.post_id === post.id).length;
                return {
                    id: post.id,
                    name: post.name,
                    code: post.code,
                    description: post.description || '',
                    region: post.region || '',
                    city: post.city || '',
                    is_active: post.is_active,
                    operators_count: operatorsCount
                };
            });

            setPosts(formattedPosts);
            console.log(`[+] Завантажено ${formattedPosts.length} постів з API (фільтр: ${postFilter})`);

        } catch (error) {
            console.error('Помилка завантаження постів:', error);
            handleApiError(error, 'завантаження постів');
        }
    }, [postFilter]);


    // Завантаження ролей з API
    const fetchRoles = useCallback(async () => {
        try {
            const data = await api.roles.list({ size: 100 });

            // Конвертуємо API дані в формат для UI і завантажуємо permissions
            const formattedRoles = await Promise.all(data.map(async (role) => {
                try {
                    // Завантажуємо permissions для кожної ролі
                    const permissions = await api.roles.permissions.list(role.id);
                    return {
                        id: role.id,
                        name: role.name,
                        display_name: role.display_name,
                        description: role.description || '',
                        created_at: role.created_at,
                        updated_at: role.updated_at,
                        // Зберігаємо тільки ID (числа) для таблиці і форми
                        permissions: permissions.map(p => p.id) // [1, 2, 3]
                    };
                } catch (error) {
                    console.error(`Помилка завантаження permissions для ролі ${role.id}:`, error);
                    // Якщо не вдалося завантажити permissions - повертаємо роль без них
                    return {
                        id: role.id,
                        name: role.name,
                        display_name: role.display_name,
                        description: role.description || '',
                        created_at: role.created_at,
                        updated_at: role.updated_at,
                        permissions: []
                    };
                }
            }));

            setRoles(formattedRoles);
            console.log(`[+] Завантажено ${formattedRoles.length} ролей з API`);
        } catch (error) {
            console.error('Помилка завантаження ролей:', error);
            handleApiError(error, 'завантаження ролей');
        }
    }, []);

    // Завантаження категорій сигналів
    const fetchCategories = useCallback(async () => {
        try {
            const data = await api.categories.list({ size: 100 });
            setCategories(data);
            console.log(`[+] Завантажено ${data.length} категорій з API`);
        } catch (error) {
            console.error('Помилка завантаження категорій:', error);
            handleApiError(error, 'завантаження категорій');
        }
    }, []);

    // Завантаження типів сигналів
    const fetchSignalTypes = useCallback(async () => {
        try {
            const data = await api.signalTypes.list({ size: 100 });
            setSignalTypes(data);
            console.log(`[+] Завантажено ${data.length} типів сигналів з API`);
        } catch (error) {
            console.error('Помилка завантаження типів сигналів:', error);
            handleApiError(error, 'завантаження типів сигналів');
        }
    }, []);

    // Створення/оновлення типу сигналу
    const handleSaveSignalType = async (formData) => {
        try {
            setIsLoading(true);
            if (editingSignalType) {
                // Оновлення існуючого типу
                await api.signalTypes.update(editingSignalType.id, formData);
                console.log('[+] Тип сигналу оновлено');
            } else {
                // Створення нового типу
                await api.signalTypes.create(formData);
                console.log('[+] Тип сигналу створено');
            }
            await fetchSignalTypes();
            setShowSignalTypeModal(false);
            setEditingSignalType(null);
        } catch (error) {
            console.error('Помилка збереження типу сигналу:', error);
            handleApiError(error, 'збереження типу сигналу');
        } finally {
            setIsLoading(false);
        }
    };

    // Відкриття модалки для створення нового типу сигналу
    const handleCreateSignalType = () => {
        setEditingSignalType(null);
        setShowSignalTypeModal(true);
    };

    // Відкриття модалки для редагування типу сигналу
    const handleEditSignalType = (signalType) => {
        setEditingSignalType(signalType);
        setShowSignalTypeModal(true);
    };

    // Видалення типу сигналу
    const handleDeleteSignalType = async (signalTypeId) => {
        if (!window.confirm('Ви впевнені, що хочете видалити цей тип сигналу?')) {
            return;
        }
        try {
            setIsLoading(true);
            await api.signalTypes.delete(signalTypeId);
            console.log('[+] Тип сигналу видалено');
            await fetchSignalTypes();
        } catch (error) {
            console.error('Помилка видалення типу сигналу:', error);
            handleApiError(error, 'видалення типу сигналу');
        } finally {
            setIsLoading(false);
        }
    };

    // Створення/оновлення категорії
    const handleSaveCategory = async (formData) => {
        try {
            setIsLoading(true);
            if (editingCategory) {
                // Оновлення існуючої категорії
                await api.categories.update(editingCategory.id, formData);
                console.log('[+] Категорію оновлено');
            } else {
                // Створення нової категорії
                await api.categories.create(formData);
                console.log('[+] Категорію створено');
            }
            await fetchCategories();
            setShowCategoryModal(false);
            setEditingCategory(null);
        } catch (error) {
            console.error('Помилка збереження категорії:', error);
            handleApiError(error, 'збереження категорії');
        } finally {
            setIsLoading(false);
        }
    };

    // Відкриття модалки для створення нової категорії
    const handleCreateCategory = () => {
        setEditingCategory(null);
        setShowCategoryModal(true);
    };

    // Відкриття модалки для редагування категорії
    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setShowCategoryModal(true);
    };

    // Видалення категорії
    const handleDeleteCategory = async (categoryId) => {
        if (!window.confirm('Ви впевнені, що хочете видалити цю категорію? Всі типи сигналів в цій категорії втратять прив\'язку.')) {
            return;
        }
        try {
            setIsLoading(true);
            await api.categories.delete(categoryId);
            console.log('[+] Категорію видалено');
            await fetchCategories();
        } catch (error) {
            console.error('Помилка видалення категорії:', error);
            handleApiError(error, 'видалення категорії');
        } finally {
            setIsLoading(false);
        }
    };

    // ============= ТЕГИ (API) =============

    // Стани для тегів
    const [tagsLoading, setTagsLoading] = useState(false);
    const [tagError, setTagError] = useState(null);
    const [tagFilter, setTagFilter] = useState(''); // Фільтр за назвою

    // Завантаження тегів з API
    const fetchTags = useCallback(async () => {
        setTagsLoading(true);
        setTagError(null);
        try {
            const params = {
                page: 1,
                page_size: 100,
                sort_by: 'name',
                sort_order: 'ascending'
            };

            // Додаємо фільтр якщо є
            if (tagFilter.trim()) {
                params.name_contains = tagFilter.trim();
            }

            const apiTags = await api.tags.list(params);
            setTags(apiTags);
            console.log(`[API] Завантажено ${apiTags.length} тегів`);
        } catch (error) {
            console.error('Помилка завантаження тегів:', error);
            setTagError('Не вдалося завантажити теги');
            handleApiError(error, 'завантаження тегів');
        } finally {
            setTagsLoading(false);
        }
    }, [tagFilter]);

    // Створення нового тегу через API
    const handleCreateTag = async () => {
        if (!newTagName.trim()) {
            return;
        }

        setTagsLoading(true);
        try {
            const newTag = await api.tags.create({ name: newTagName.trim() });
            console.log('[API] Тег створено:', newTag);

            // Оновлюємо список тегів
            await fetchTags();
            setNewTagName('');
        } catch (error) {
            console.error('Помилка створення тегу:', error);

            // Перевіряємо на дублікат
            if (error.response?.status === 400 || error.response?.status === 409) {
                setTagError('Тег з такою назвою вже існує');
            } else {
                setTagError('Не вдалося створити тег');
            }
            handleApiError(error, 'створення тегу');
        } finally {
            setTagsLoading(false);
        }
    };

    // Початок редагування тегу
    const handleStartEditTag = (tag) => {
        setEditingTag(tag);
        setEditingTagName(tag.name);
        setTagError(null);
    };

    // Збереження редагування тегу через API
    const handleSaveEditTag = async () => {
        if (!editingTagName.trim() || !editingTag) {
            return;
        }

        // Якщо назва не змінилась - просто закриваємо
        if (editingTagName.trim() === editingTag.name) {
            setEditingTag(null);
            setEditingTagName('');
            return;
        }

        setTagsLoading(true);
        try {
            await api.tags.update(editingTag.id, { name: editingTagName.trim() });
            console.log('[API] Тег оновлено:', editingTag.id);

            // Оновлюємо список тегів
            await fetchTags();
            setEditingTag(null);
            setEditingTagName('');
        } catch (error) {
            console.error('Помилка оновлення тегу:', error);

            if (error.response?.status === 400 || error.response?.status === 409) {
                setTagError('Тег з такою назвою вже існує');
            } else if (error.response?.status === 404) {
                setTagError('Тег не знайдено');
                await fetchTags(); // Оновлюємо список
            } else {
                setTagError('Не вдалося оновити тег');
            }
            handleApiError(error, 'оновлення тегу');
        } finally {
            setTagsLoading(false);
        }
    };

    // Скасування редагування тегу
    const handleCancelEditTag = () => {
        setEditingTag(null);
        setEditingTagName('');
        setTagError(null);
    };

    // Показати модальне вікно підтвердження видалення
    const handleShowDeleteTagModal = (tag) => {
        setTagToDelete(tag);
        setShowDeleteTagModal(true);
        setTagError(null);
    };

    // Підтвердити видалення тегу через API
    const handleConfirmDeleteTag = async () => {
        if (!tagToDelete) return;

        setTagsLoading(true);
        try {
            await api.tags.delete(tagToDelete.id);
            console.log('[API] Тег видалено:', tagToDelete.id);

            // Оновлюємо список тегів
            await fetchTags();
            setShowDeleteTagModal(false);
            setTagToDelete(null);
        } catch (error) {
            console.error('Помилка видалення тегу:', error);

            if (error.response?.status === 404) {
                setTagError('Тег не знайдено');
                await fetchTags();
            } else if (error.response?.status === 409) {
                setTagError('Неможливо видалити тег, який використовується');
            } else {
                setTagError('Не вдалося видалити тег');
            }
            handleApiError(error, 'видалення тегу');
            setShowDeleteTagModal(false);
            setTagToDelete(null);
        } finally {
            setTagsLoading(false);
        }
    };

    // Скасувати видалення тегу
    const handleCancelDeleteTag = () => {
        setShowDeleteTagModal(false);
        setTagToDelete(null);
        setTagError(null);
    };

    // ============= КІНЕЦЬ ТЕГІВ =============

    // Завантаження всіх даних
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1️⃣ Завантажуємо користувачів і отримуємо їх прямо як результат
            const usersData = await fetchUsers();

            // 2️⃣ Передаємо список користувачів у fetchPosts та завантажуємо інше
            await Promise.all([
                fetchPosts(usersData),
                fetchRoles(),
                fetchPermissions(),  // ✅ Додано завантаження permissions
                fetchCategories(),   // Завантаження категорій
                fetchSignalTypes(),  // Завантаження типів сигналів
                fetchCurrentUser(),  // Завантаження поточного користувача
                fetchTags()          // ✅ Завантаження тегів з API
            ]);
        } catch (error) {
            handleApiError(error, 'завантаження даних');
        } finally {
            setIsLoading(false);
        }
    }, [fetchUsers, fetchPosts, fetchRoles, fetchPermissions, fetchCategories, fetchSignalTypes, fetchTags, fetchCurrentUser]);


    useEffect(() => {
        fetchData();
    }, []);

    // Перезавантаження постів при зміні фільтру
    useEffect(() => {
        if (users.length > 0) {
            fetchPosts(users);
        }
    }, [postFilter]);

    const handleEditUser = (user) => {
        console.log('🖊️ Редагування користувача:', user);

        // Витягуємо ID ролей з об'єкта користувача
        const roleIds = user.roles ? user.roles.map(r => r.id) : [];

        // ✅ Зберігаємо оригінальні дані ПРИ ВІДКРИТТІ модалі
        setEditingUser({
            ...user,
            role_ids: roleIds, // Масив ID ролей
            _originalData: {
                username_alias: user.username_alias,
                post_id: user.post_id,
                role_ids: roleIds, // Зберігаємо як масив
                is_active: user.is_active
            }
        });
        setCitySearch('');
        setShowCityDropdown(false);
        setShowUserModal(true);
    };
    const handleSaveUser = async () => {
        try {
            setIsLoading(true);
            setCitySearch('');
            setShowCityDropdown(false);

            if (!editingUser?.id) {
                alert('Помилка: користувач не вибраний');
                setIsLoading(false);
                return;
            }

            // ✅ Порівнюємо з збереженими оригінальними даними
            const originalData = editingUser._originalData;
            console.log('🔍 Original data:', originalData);
            console.log('🔍 Current data:', {
                username_alias: editingUser.username_alias,
                post_id: editingUser.post_id,
                role_ids: editingUser.role_ids,
                is_active: editingUser.is_active
            });

            const userData = {};

            if (editingUser.username_alias !== originalData?.username_alias) {
                userData.username_alias = editingUser.username_alias;
                console.log('✏️ username_alias змінився:', originalData?.username_alias, '→', editingUser.username_alias);
            }

            // ✅ ВАЖЛИВО: post_id може бути null, тому порівнюємо правильно
            const newPostId = editingUser.post_id;
            const oldPostId = originalData?.post_id;

            if (newPostId !== oldPostId) {
                userData.post_id = newPostId;
                console.log('✏️ post_id змінився:', oldPostId, '→', newPostId);
            }

            // Порівнюємо масиви ролей
            const newRoleIds = editingUser.role_ids || [];
            const oldRoleIds = originalData?.role_ids || [];
            const rolesChanged = JSON.stringify(newRoleIds.sort()) !== JSON.stringify(oldRoleIds.sort());

            if (rolesChanged) {
                userData.role_ids = newRoleIds;
                console.log('✏️ role_ids змінився:', oldRoleIds, '→', newRoleIds);
            }

            if (editingUser.is_active !== originalData?.is_active) {
                userData.is_active = editingUser.is_active;
                console.log('✏️ is_active змінився:', originalData?.is_active, '→', editingUser.is_active);
            }

            console.log('📋 Всі зміни:', userData);
            console.log('📊 Кількість змін:', Object.keys(userData).length);

            if (Object.keys(userData).length === 0) {
                console.log('⚠️ Немає змін для збереження');
                setIsLoading(false);
                setShowUserModal(false);
                return;
            }

            console.log('📤 Запит:', {
                url: `PATCH /api/v1/users/${editingUser.id}`,
                data: userData
            });

            // Використовуємо api.users.update
            const result = await api.users.update(editingUser.id, userData);
            console.log('✅ Успіх! Результат:', result);

            await fetchUsers();

            setShowUserModal(false);
            setEditingUser(null);
        } catch (error) {
            console.error('❌ Помилка:', error);
            handleApiError(error, 'збереження користувача');
        } finally {
            setIsLoading(false);
        }
    };
    // SSL сертифікати
    const handleOpenSSLModal = (user) => {
        setCurrentSSLUser(user);
        setCitySearch('');
        setShowCityDropdown(false);
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
        setSSLCertData({
            certificate: null,
            cn: `CN_${user.username.toUpperCase()}_${timestamp}`,
            serial: `SERIAL_${user.username.toUpperCase()}_${timestamp}`,
            fingerprint: `FINGERPRINT_${user.username.toUpperCase()}_${timestamp}`
        });
        setShowSSLModal(true);
    };

    // Обробник створення користувача з сертифіката
    // userData - це вже створений користувач (результат API з CertificateUploadModal)
    const handleCreateUserFromCertificate = async (createdUser) => {
        try {
            setUsers(prev => [...prev, createdUser]);
            alert(`Користувач ${createdUser.username} успішно створений з SSL сертифіката!`);
            await fetchUsers();
        } catch (error) {
            console.error('Error updating user list:', error);
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSSLCertData(prev => ({ ...prev, certificate: file }));
        }
    };

    const handleIssueSSLCert = async () => {
        if (!sslCertData.certificate) {
            alert('Будь ласка, завантажте файл сертифікату');
            return;
        }

        try {
            setIsLoading(true);

            const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];

            // Підготовка даних користувача
            const userData = {
                certificate: sslCertData.certificate,
                username: `${currentSSLUser.username}_${timestamp}`,
                username_alias: currentSSLUser.username_alias || `${currentSSLUser.username.charAt(0).toUpperCase() + currentSSLUser.username.slice(1)} User`,
                role_ids: [1],
                post_id: currentSSLUser.post_id || null
            };

            const result = await api.users.create(userData);

            alert(`SSL сертифікат успішно видано! Створено користувача з ID: ${result.id}`);

            // Перезавантажуємо користувачів
            await fetchUsers();

            setShowSSLModal(false);
            setCurrentSSLUser(null);
            setSSLCertData({
                certificate: null,
                cn: '',
                serial: '',
                fingerprint: ''
            });

        } catch (error) {
            handleApiError(error, 'видачі сертифікату');
        } finally {
            setIsLoading(false);
        }
    };

    // CRUD Пости
    const handleCreatePost = () => {
        setEditingPost({
            id: null,
            name: '',
            code: '',
            description: '',
            region: '',
            city: '',
            is_active: true
        });
        setCitySearch('');
        setShowCityDropdown(false);
        setShowPostModal(true);
    };
    const handleEditPost = (post) => {
        console.log('📝 Редагування поста, дані з API:', post);

        // Нові дані з API: використовуємо region та city як є
        // API повертає:
        // - region: регіон України або null
        // - city: назва міста або null
        let region = post.region || '';
        let city = post.city || '';

        console.log('🔍 Після парсингу:', { region, city });

        // Backwards compatibility: ТІЛЬКИ якщо region містить назву МІСТА (не регіону)
        // Перевіряємо чи region є в списку регіонів України
        const isRegionValid = Object.keys(ukraineData).includes(region);

        if (!city && region && !isRegionValid) {
            // region не є назвою регіону => це старий формат де region містить місто
            console.log('⚙️ Backwards compatibility: region містить місто, шукаємо регіон');
            const cityFromApi = region;
            let foundRegion = '';

            for (const [reg, cities] of Object.entries(ukraineData)) {
                if (cities.includes(cityFromApi)) {
                    foundRegion = reg;
                    break;
                }
            }

            region = foundRegion;
            city = cityFromApi;
            console.log('✅ Знайдено:', { region, city });
        } else {
            console.log('✅ Використовуємо дані з API як є:', { region, city });
        }

        const editData = {
            ...post,
            region: region,  // Регіон України
            city: city       // Місто
        };

        console.log('💾 Встановлюємо editingPost:', editData);

        setEditingPost(editData);
        setCitySearch('');
        setShowCityDropdown(false);
        setShowPostModal(true);
    };

    const handleSavePost = async () => {
        try {
            if (!editingPost.name || !editingPost.code || !editingPost.region || !editingPost.city) {
                showWarning('Будь ласка, заповніть всі обов\'язкові поля: назву, код, регіон та місто');
                return;
            }

            // Валідація довжини полів згідно API
            if (editingPost.name.length < 1 || editingPost.name.length > 255) {
                showWarning('Назва поста має бути від 1 до 255 символів');
                return;
            }
            if (editingPost.code.length < 1 || editingPost.code.length > 50) {
                showWarning('Код поста має бути від 1 до 50 символів');
                return;
            }
            if (editingPost.description && editingPost.description.length > 1000) {
                showWarning('Опис має бути максимум 1000 символів');
                return;
            }
            if (editingPost.city && editingPost.city.length > 255) {
                showWarning('Регіон/місто має бути максимум 255 символів');
                return;
            }

            setIsLoading(true);

            // Debug: що відправляємо
            console.log('📝 Дані для збереження поста:', {
                id: editingPost.id,
                name: editingPost.name,
                region: editingPost.region,
                city: editingPost.city,
                description: editingPost.description
            });

            if (editingPost.id) {
                // Оновлення існуючого поста через api.posts.update (з валідацією)
                const updateData = {
                    name: editingPost.name,
                    description: editingPost.description || null,
                    region: editingPost.region,  // Регіон України
                    city: editingPost.city,      // Місто
                    is_active: editingPost.is_active
                };
                console.log('📤 UPDATE запит:', updateData);
                await api.posts.update(editingPost.id, updateData);
            } else {
                // Створення нового поста через api.posts.create (з валідацією)
                const createData = {
                    name: editingPost.name,
                    code: editingPost.code,
                    description: editingPost.description || null,
                    region: editingPost.region,  // Регіон України
                    city: editingPost.city       // Місто
                };
                console.log('📤 CREATE запит:', createData);
                await api.posts.create(createData);
            }

            await fetchPosts();
            setShowPostModal(false);
            setEditingPost(null);
            showSuccess('Пост успішно збережено');
        } catch (error) {
            handleApiError(error, 'збереження поста');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTogglePostStatus = async (post) => {
        const newStatus = !post.is_active;
        const action = newStatus ? 'активувати' : 'деактивувати';

        if (window.confirm(`Ви впевнені, що хочете ${action} пост "${post.name}"?`)) {
            try {
                setIsLoading(true);
                await api.posts.update(post.id, { is_active: newStatus });
                await fetchPosts(users);
            } catch (error) {
                handleApiError(error, `зміни статусу поста`);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Функції для міст
    const getCitiesForRegion = (region, searchText) => {
        if (!region) return [];
        const cities = ukraineData[region] || [];
        if (!searchText) return cities;
        return cities.filter(city =>
            city.toLowerCase().includes(searchText.toLowerCase())
        );
    };

    const filteredCities = editingPost ? getCitiesForRegion(editingPost.region, editingPost.city) : [];
    const regions = Object.keys(ukraineData).sort();

    const handleRegionChange = (region) => {
        console.log('🗺️ Змінено регіон:', region);
        setEditingPost(prev => ({
            ...prev,
            region,
            city: ''
        }));
    };

    const handleCitySelect = (city) => {
        console.log('🏙️ Вибрано місто:', city);
        setEditingPost(prev => {
            const updated = {
                ...prev,
                city
            };
            console.log('✅ Оновлений editingPost:', updated);
            return updated;
        });
        setShowCityDropdown(false);
    };
    // CRUD Ролі (залишається mock)
    const handleCreateRole = () => {
        setEditingRole({
            id: null,
            name: '',
            display_name: '',
            permissions: []
        });
        setShowRoleModal(true);
    };

    const handleEditRole = async (role) => {
        try {
            // Завантажуємо permissions для цієї ролі з API
            const permissions = await api.roles.permissions.list(role.id);

            // Зберігаємо тільки ID permissions (числа!)
            setEditingRole({
                ...role,
                permissions: permissions.map(p => p.id) // масив чисел: [1, 2, 3]
            });
            setShowRoleModal(true);
        } catch (error) {
            console.error('Помилка завантаження permissions:', error);
            // Якщо не вдалося завантажити - відкриваємо з порожнім масивом
            setEditingRole({
                ...role,
                permissions: []
            });
            setShowRoleModal(true);
        }
    };

    const handleSaveRole = async () => {
        try {
            setIsLoading(true);

            if (!editingRole.name || !editingRole.display_name) {
                showWarning('Заповніть обов\'язкові поля');
                return;
            }

            // Валідація довжини полів згідно API
            if (editingRole.name.length < 1 || editingRole.name.length > 100) {
                showWarning('Назва ролі має бути від 1 до 100 символів');
                return;
            }
            if (editingRole.display_name.length < 1 || editingRole.display_name.length > 255) {
                showWarning('Відображувана назва має бути від 1 до 255 символів');
                return;
            }
            if (editingRole.description && editingRole.description.length > 500) {
                showWarning('Опис має бути максимум 500 символів');
                return;
            }

            if (editingRole.id) {
                // Оновлення існуючої ролі через api.roles.update (з валідацією)
                const updateData = {
                    display_name: editingRole.display_name,
                    description: editingRole.description || null,
                    permission_ids: editingRole.permissions || []
                };
                await api.roles.update(editingRole.id, updateData);
            } else {
                // Створення нової ролі через api.roles.create (з валідацією)
                const createData = {
                    name: editingRole.name,
                    display_name: editingRole.display_name,
                    description: editingRole.description || null,
                    permission_ids: editingRole.permissions || []
                };
                await api.roles.create(createData);
            }

            await fetchRoles();
            setShowRoleModal(false);
            setEditingRole(null);
            showSuccess('Роль успішно збережено');
        } catch (error) {
            handleApiError(error, 'збереження ролі');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteRole = async (roleId) => {
        if (window.confirm('Ви впевнені, що хочете видалити цю роль?')) {
            try {
                setIsLoading(true);
                await api.roles.delete(roleId);
                await fetchRoles();
            } catch (error) {
                handleApiError(error, 'видалення ролі');
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Допоміжні функції
    const getRoleName = (roleId) => {
        return roles.find(role => role.id === roleId)?.display_name || 'Невідома роль';
    };

    const getPostName = (postId) => {
        return posts.find(post => post.id === postId)?.name || 'Невідомий пост';
    };

    const togglePasswordVisibility = (userId) => {
        setShowPasswords(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }));
    };

    const tabs = [
        { id: 'users', name: 'Користувачі', icon: Users },
        { id: 'roles', name: 'Ролі', icon: Shield },
        { id: 'posts', name: 'Пости', icon: MapPin },
        { id: 'categories', name: 'Категорії', icon: Folder },
        { id: 'signalTypes', name: 'Типи сигналів', icon: Radio },
        { id: 'tags', name: 'Теги', icon: Tag }
    ];

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

            <div className="relative z-10 max-w-7xl mx-auto">

                {/* Login status */}

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <Shield className="w-10 h-10 text-red-400" />
                        <div>
                            <h1 className="text-3xl font-bold text-white">
                                Адміністративна панель
                            </h1>
                            <p className="text-gray-400">Управління користувачами, ролями та постами</p>
                        </div>
                        <Settings className="w-10 h-10 text-red-400" />
                    </div>
                    <div className="flex justify-center gap-6 text-sm text-gray-400">
                        <span>Час: {currentTime.toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })}</span>
                        {currentUser && (
                            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                                {currentUser.username_alias || currentUser.username}
                            </span>
                        )}
                        {/*<span>Користувачів онлайн: {users.filter(u => u.is_active).length}</span>*/}
                        {/*<span>Постів активних: {posts.filter(p => p.is_active).length}</span>*/}
                        <button
                            onClick={() => navigate('/admin/observations')}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-1"
                        >
                            <Eye className="w-4 h-4" />
                            Всі спостереження
                        </button>
                        <button
                            onClick={() => {
                                localStorage.removeItem('access_token');
                                localStorage.removeItem('refresh_token');
                                window.location.reload();
                            }}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                            Вийти
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="mb-8">
                    <div className="flex justify-center gap-2">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-red-600 text-white'
                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {tab.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
                    {/* Користувачі */}
                    {activeTab === 'users' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Users className="w-6 h-6 text-blue-400" />
                                    Користувачі
                                </h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={fetchUsers}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            'Оновити'
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowCertificateUploadModal(true)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Створити користувача
                                    </button>
                                </div>
                            </div>

                            {/* Фільтр статусу користувачів */}
                            <div className="mb-4 flex items-center gap-4 bg-gray-700 p-3 rounded-lg">
                                <span className="text-white font-medium">Статус:</span>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-white cursor-pointer">
                                        <input
                                            type="radio"
                                            name="userFilter"
                                            value="active"
                                            checked={userFilter === 'active'}
                                            onChange={(e) => setUserFilter(e.target.value)}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span>Активні</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-white cursor-pointer">
                                        <input
                                            type="radio"
                                            name="userFilter"
                                            value="inactive"
                                            checked={userFilter === 'inactive'}
                                            onChange={(e) => setUserFilter(e.target.value)}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span>Неактивні</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-white cursor-pointer">
                                        <input
                                            type="radio"
                                            name="userFilter"
                                            value="all"
                                            checked={userFilter === 'all'}
                                            onChange={(e) => setUserFilter(e.target.value)}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span>Всі</span>
                                    </label>
                                </div>
                                <span className="text-gray-400 text-sm ml-auto">
                                    Знайдено: {userFilter === 'active' ? users.filter(u => u.is_active).length : userFilter === 'inactive' ? users.filter(u => !u.is_active).length : users.length}
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                    <tr className="border-b border-gray-600">
                                        <th className="text-left p-3 text-gray-300">Користувач</th>
                                        <th className="text-left p-3 text-gray-300">Ролі</th>
                                        <th className="text-left p-3 text-gray-300">Пост</th>
                                        <th className="text-left p-3 text-gray-300">Статус</th>
                                        <th className="text-left p-3 text-gray-300">Дії</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {/* Відфільтровані користувачі */}
                                    {users
                                        .filter(u => userFilter === 'all' ? true : userFilter === 'active' ? u.is_active : !u.is_active)
                                        .map((user, index) => (
                                        <tr key={user.id} className={`border-b border-gray-700 hover:bg-gray-700/50 ${!user.is_active ? 'opacity-60' : ''}`}>
                                            <td className="p-3">
                                                <div className="font-medium text-white">{user.username}</div>
                                                <div className="text-xs text-gray-400">{user.username_alias}</div>
                                                <div className="text-xs text-gray-400">ID: {user.id}</div>
                                                <div className="text-xs text-gray-400">Створено: {user.created_at}</div>
                                            </td>
                                            <td className="p-3">
                                                {user.role_names ? (
                                                    <div className="text-sm text-gray-300">
                                                        {user.role_names}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-gray-500 italic">Немає ролей</div>
                                                )}
                                            </td>
                                            <td className="p-3 text-gray-300">{getPostName(user.post_id)}</td>
                                            <td className="p-3">
                                                <span className={user.is_active ? 'text-green-400' : 'text-red-400'}>
                                                    {user.is_active ? 'Активний' : 'Неактивний'}
                                                </span>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    Вхід: {user.last_login}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handleEditUser(user)}
                                                        className="p-1 text-blue-400 hover:text-blue-300"
                                                        title="Редагувати"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Ролі */}
                    {activeTab === 'roles' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Shield className="w-6 h-6 text-purple-400" />
                                    Ролі
                                </h2>
                                <button
                                    onClick={handleCreateRole}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Додати роль
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {roles.map(role => (
                                    <div key={role.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">{role.display_name}</h3>
                                                <p className="text-sm text-gray-400">Код: {role.name}</p>
                                                {role.users_count !== undefined && (
                                                    <p className="text-sm text-gray-400">Користувачів: {role.users_count}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleEditRole(role)}
                                                    className="p-1 text-blue-400 hover:text-blue-300"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRole(role.id)}
                                                    className="p-1 text-red-400 hover:text-red-300"
                                                    title="Видалити роль"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {role.description && (
                                            <div className="mt-2">
                                                <span className="text-sm text-gray-400 block mb-1">Опис:</span>
                                                <p className="text-sm text-gray-300">{role.description}</p>
                                            </div>
                                        )}

                                        {role.permissions && role.permissions.length > 0 && (
                                            <div className="mt-2">
                                                <span className="text-sm text-gray-400 block mb-2">Дозволи:</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {role.permissions.slice(0, 3).map(permissionId => {
                                                        const perm = availablePermissions.find(p => p.id === permissionId);
                                                        return (
                                                            <span key={permissionId} className="px-2 py-1 bg-gray-600 text-xs rounded text-gray-200" title={perm?.description || ''}>
                                                                {perm?.display_name || perm?.name || permissionId}
                                                            </span>
                                                        );
                                                    })}
                                                    {role.permissions.length > 3 && (
                                                        <span className="px-2 py-1 bg-gray-600 text-xs rounded text-gray-200">
                                                            +{role.permissions.length - 3} ще
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Пости */}
                    {activeTab === 'posts' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <MapPin className="w-6 h-6 text-green-400" />
                                    Пости
                                </h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => fetchPosts(users)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            'Оновити'
                                        )}
                                    </button>
                                    <button
                                        onClick={handleCreatePost}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Додати пост
                                    </button>
                                </div>
                            </div>

                            {/* Фільтр статусу постів */}
                            <div className="mb-4 flex items-center gap-4 bg-gray-700 p-3 rounded-lg">
                                <span className="text-white font-medium">Статус:</span>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-white cursor-pointer">
                                        <input
                                            type="radio"
                                            name="postFilter"
                                            value="active"
                                            checked={postFilter === 'active'}
                                            onChange={(e) => setPostFilter(e.target.value)}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span>Активні</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-white cursor-pointer">
                                        <input
                                            type="radio"
                                            name="postFilter"
                                            value="inactive"
                                            checked={postFilter === 'inactive'}
                                            onChange={(e) => setPostFilter(e.target.value)}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span>Неактивні</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-white cursor-pointer">
                                        <input
                                            type="radio"
                                            name="postFilter"
                                            value="all"
                                            checked={postFilter === 'all'}
                                            onChange={(e) => setPostFilter(e.target.value)}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span>Всі</span>
                                    </label>
                                </div>
                                <span className="text-gray-400 text-sm ml-auto">
                                    Знайдено: {posts.length}
                                </span>
                            </div>

                            {/* Активні пости */}
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                {posts.map(post => (
                                    <div key={post.id} className={`bg-gray-700 rounded-lg p-4 border border-gray-600 ${!post.is_active ? 'opacity-60' : ''}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">{post.name}</h3>
                                                <p className="text-sm text-gray-400">Код: {post.code}</p>
                                                {post.region && <p className="text-sm text-gray-400">Регіон: {post.region}</p>}
                                                {post.city && <p className="text-sm text-gray-400">Місто: {post.city}</p>}
                                                <p className="text-sm text-gray-400">ID: {post.id}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEditPost(post)}
                                                    className="p-1 text-blue-400 hover:text-blue-300"
                                                    title="Редагувати"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleTogglePostStatus(post)}
                                                    className={`p-1 ${post.is_active ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-gray-300'}`}
                                                    title={post.is_active ? 'Деактивувати пост' : 'Активувати пост'}
                                                >
                                                    <Power className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Операторів:</span>
                                                <span className="text-white">{post.operators_count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Статус:</span>
                                                <span className={post.is_active ? 'text-green-400' : 'text-red-400'}>
                                                    {post.is_active ? 'Активний' : 'Неактивний'}
                                                </span>
                                            </div>
                                        </div>

                                        {post.description && (
                                            <div className="mt-3 pt-3 border-t border-gray-600">
                                                <p className="text-sm text-gray-300">{post.description}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Типи сигналів */}
                    {activeTab === 'signalTypes' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Radio className="w-6 h-6 text-purple-400" />
                                    Типи сигналів
                                </h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={fetchSignalTypes}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            'Оновити'
                                        )}
                                    </button>
                                    <button
                                        onClick={handleCreateSignalType}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Додати тип сигналу
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                    <tr className="border-b border-gray-600">
                                        <th className="text-left p-3 text-gray-300">ID</th>
                                        <th className="text-left p-3 text-gray-300">Назва</th>
                                        <th className="text-left p-3 text-gray-300">Опис</th>
                                        <th className="text-left p-3 text-gray-300">Категорія</th>
                                        <th className="text-left p-3 text-gray-300">Статус</th>
                                        <th className="text-left p-3 text-gray-300">Створено</th>
                                        <th className="text-left p-3 text-gray-300">Дії</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {signalTypes.map((signalType) => {
                                        const category = categories.find(c => c.id === signalType.category_id);
                                        return (
                                            <tr key={signalType.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                                <td className="p-3 text-gray-300">{signalType.id}</td>
                                                <td className="p-3">
                                                    <div className="font-medium text-white">{signalType.name}</div>
                                                </td>
                                                <td className="p-3 text-gray-300">
                                                    {signalType.description || '-'}
                                                </td>
                                                <td className="p-3 text-gray-300">
                                                    {category ? category.name : '-'}
                                                </td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 text-xs rounded ${
                                                        signalType.is_active ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                                                    }`}>
                                                        {signalType.is_active ? 'Активний' : 'Неактивний'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-gray-400 text-xs">
                                                    {signalType.created_at ? formatDateOnlyUA(signalType.created_at) : '-'}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => handleEditSignalType(signalType)}
                                                            className="p-1 text-blue-400 hover:text-blue-300"
                                                            title="Редагувати"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSignalType(signalType.id)}
                                                            className="p-1 text-red-400 hover:text-red-300"
                                                            title="Видалити"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {signalTypes.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="p-8 text-center text-gray-400">
                                                Немає типів сигналів. Створіть перший!
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Категорії */}
                    {activeTab === 'categories' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Folder className="w-6 h-6 text-yellow-400" />
                                    Категорії сигналів
                                </h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={fetchCategories}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            'Оновити'
                                        )}
                                    </button>
                                    <button
                                        onClick={handleCreateCategory}
                                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Додати категорію
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                    <tr className="border-b border-gray-600">
                                        <th className="text-left p-3 text-gray-300">ID</th>
                                        <th className="text-left p-3 text-gray-300">Назва</th>
                                        <th className="text-left p-3 text-gray-300">Псевдонім (alias)</th>
                                        <th className="text-left p-3 text-gray-300">Типів сигналів</th>
                                        <th className="text-left p-3 text-gray-300">Дії</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {categories.map((category) => {
                                        const signalTypesCount = signalTypes.filter(st => st.category_id === category.id).length;
                                        return (
                                            <tr key={category.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                                <td className="p-3 text-gray-300">{category.id}</td>
                                                <td className="p-3">
                                                    <div className="font-medium text-white">{category.name}</div>
                                                </td>
                                                <td className="p-3 text-gray-300">
                                                    <span className="px-2 py-1 bg-gray-700 rounded text-xs font-mono">
                                                        {category.alias}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-gray-300">
                                                    <span className={`px-2 py-1 text-xs rounded ${
                                                        signalTypesCount > 0 ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
                                                    }`}>
                                                        {signalTypesCount}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => handleEditCategory(category)}
                                                            className="p-1 text-blue-400 hover:text-blue-300"
                                                            title="Редагувати"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCategory(category.id)}
                                                            className="p-1 text-red-400 hover:text-red-300"
                                                            title="Видалити"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {categories.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="p-8 text-center text-gray-400">
                                                Немає категорій. Створіть першу!
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Теги */}
                    {activeTab === 'tags' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Tag className="w-6 h-6 text-purple-400" />
                                    Теги
                                    {tagsLoading && (
                                        <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                                    )}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-400">
                                        Всього: {tags.length}
                                    </span>
                                    <button
                                        onClick={fetchTags}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                                        disabled={tagsLoading}
                                    >
                                        {tagsLoading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            'Оновити'
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Повідомлення про помилку */}
                            {tagError && (
                                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 flex items-center justify-between">
                                    <span>{tagError}</span>
                                    <button
                                        onClick={() => setTagError(null)}
                                        className="p-1 hover:text-red-300"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Додавання нового тегу */}
                            <div className="mb-4 p-4 bg-gray-700/50 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-300 mb-3">Створити новий тег</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newTagName}
                                        onChange={(e) => setNewTagName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newTagName.trim() && !tagsLoading) {
                                                handleCreateTag();
                                            }
                                        }}
                                        placeholder="Введіть назву тегу..."
                                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                                        disabled={tagsLoading}
                                    />
                                    <button
                                        onClick={handleCreateTag}
                                        disabled={!newTagName.trim() || tagsLoading}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {tagsLoading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Plus className="w-4 h-4" />
                                        )}
                                        Додати тег
                                    </button>
                                </div>
                            </div>

                            {/* Пошук/фільтр тегів */}
                            <div className="mb-4 flex gap-2">
                                <input
                                    type="text"
                                    value={tagFilter}
                                    onChange={(e) => setTagFilter(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            fetchTags();
                                        }
                                    }}
                                    placeholder="Пошук за назвою..."
                                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                />
                                {tagFilter && (
                                    <button
                                        onClick={() => {
                                            setTagFilter('');
                                            // Через setTimeout щоб state оновився перед fetch
                                            setTimeout(() => fetchTags(), 0);
                                        }}
                                        className="px-3 py-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500"
                                        title="Очистити фільтр"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={fetchTags}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                                    disabled={tagsLoading}
                                >
                                    Шукати
                                </button>
                            </div>

                            {/* Таблиця тегів */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                    <tr className="border-b border-gray-600">
                                        <th className="text-left p-3 text-gray-300 w-20">ID</th>
                                        <th className="text-left p-3 text-gray-300">Назва</th>
                                        <th className="text-left p-3 text-gray-300 w-24">Дії</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {tags.map((tag) => (
                                        <tr key={tag.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                            <td className="p-3 text-gray-400 font-mono text-xs">{tag.id}</td>
                                            <td className="p-3">
                                                {editingTag?.id === tag.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={editingTagName}
                                                            onChange={(e) => setEditingTagName(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && !tagsLoading) handleSaveEditTag();
                                                                if (e.key === 'Escape') handleCancelEditTag();
                                                            }}
                                                            className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:border-purple-500 flex-1"
                                                            autoFocus
                                                            disabled={tagsLoading}
                                                        />
                                                        <button
                                                            onClick={handleSaveEditTag}
                                                            disabled={!editingTagName.trim() || tagsLoading}
                                                            className="p-1 text-green-400 hover:text-green-300 disabled:opacity-50"
                                                            title="Зберегти (Enter)"
                                                        >
                                                            {tagsLoading ? (
                                                                <div className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" />
                                                            ) : (
                                                                <Save className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEditTag}
                                                            className="p-1 text-gray-400 hover:text-gray-300"
                                                            title="Скасувати (Escape)"
                                                            disabled={tagsLoading}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-1 bg-purple-600/30 text-purple-300 rounded text-sm">
                                                            {tag.name}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {editingTag?.id !== tag.id && (
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => handleStartEditTag(tag)}
                                                            className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded"
                                                            title="Редагувати"
                                                            disabled={tagsLoading}
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleShowDeleteTagModal(tag)}
                                                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded"
                                                            title="Видалити"
                                                            disabled={tagsLoading}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {tags.length === 0 && !tagsLoading && (
                                        <tr>
                                            <td colSpan="3" className="p-8 text-center text-gray-400">
                                                {tagFilter ? (
                                                    <>Тегів за запитом "{tagFilter}" не знайдено</>
                                                ) : (
                                                    <>Немає тегів. Створіть перший!</>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                    {tagsLoading && tags.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="p-8 text-center text-gray-400">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-5 h-5 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                                                    Завантаження тегів...
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Модальне вікно підтвердження видалення тегу */}
                {showDeleteTagModal && tagToDelete && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Trash2 className="w-5 h-5 text-red-400" />
                                    Видалення тегу
                                </h3>
                                <button
                                    onClick={handleCancelDeleteTag}
                                    className="text-gray-400 hover:text-white"
                                    disabled={tagsLoading}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-gray-300 mb-4">
                                Ви впевнені, що хочете видалити тег <span className="font-bold text-white">"{tagToDelete.name}"</span>?
                            </p>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={handleCancelDeleteTag}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50"
                                    disabled={tagsLoading}
                                >
                                    Скасувати
                                </button>
                                <button
                                    onClick={handleConfirmDeleteTag}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50"
                                    disabled={tagsLoading}
                                >
                                    {tagsLoading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                    {tagsLoading ? 'Видалення...' : 'Видалити'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* SSL Certificate Modal */}
{/*                {showSSLModal && (*/}
{/*                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">*/}
{/*                        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4">*/}
{/*                            <div className="flex items-center justify-between mb-4">*/}
{/*                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">*/}
{/*                                    <Key className="w-5 h-5 text-green-400" />*/}
{/*                                    Створення користувача з SSL сертифікатом*/}
{/*                                </h3>*/}
{/*                                <button*/}
{/*                                    onClick={() => setShowSSLModal(false)}*/}
{/*                                    className="text-gray-400 hover:text-white"*/}
{/*                                >*/}
{/*                                    <X className="w-5 h-5" />*/}
{/*                                </button>*/}
{/*                            </div>*/}

{/*                            {currentSSLUser && (*/}
{/*                                <div className="mb-4 p-3 bg-gray-700 rounded-lg">*/}
{/*                                    <h4 className="text-white font-medium">Базовий користувач: {currentSSLUser.username}</h4>*/}
{/*                                    <p className="text-gray-400 text-sm">ID: {currentSSLUser.id}</p>*/}
{/*                                    <p className="text-gray-400 text-sm">Пост: {getPostName(currentSSLUser.post_id)}</p>*/}
{/*                                </div>*/}
{/*                            )}*/}

{/*                            <div className="space-y-4">*/}
{/*                                /!* File Upload *!/*/}
{/*                                <div>*/}
{/*                                    <label className="block text-sm font-medium text-gray-300 mb-2">*/}
{/*                                        Файл сертифікату **/}
{/*                                    </label>*/}
{/*                                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors">*/}
{/*                                        <input*/}
{/*                                            type="file"*/}
{/*                                            id="certificate-upload"*/}
{/*                                            onChange={handleFileUpload}*/}
{/*                                            accept=".crt,.pem,.cert,.cer,.p7b,.p7c,.pfx,.p12"*/}
{/*                                            className="hidden"*/}
{/*                                        />*/}
{/*                                        <label*/}
{/*                                            htmlFor="certificate-upload"*/}
{/*                                            className="flex flex-col items-center justify-center cursor-pointer"*/}
{/*                                        >*/}
{/*                                            {sslCertData.certificate ? (*/}
{/*                                                <div className="text-center">*/}
{/*                                                    <FileText className="w-8 h-8 text-green-400 mx-auto mb-2" />*/}
{/*                                                    <p className="text-green-400 font-medium">{sslCertData.certificate.name}</p>*/}
{/*                                                    <p className="text-gray-400 text-sm">Розмір: {(sslCertData.certificate.size / 1024).toFixed(2)} KB</p>*/}
{/*                                                </div>*/}
{/*                                            ) : (*/}
{/*                                                <div className="text-center">*/}
{/*                                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />*/}
{/*                                                    <p className="text-gray-300">Клікніть для завантаження файлу</p>*/}
{/*                                                    <p className="text-gray-400 text-sm">Підтримувані формати: .crt, .pem, .cert, .cer, .p7b, .p7c, .pfx, .p12</p>*/}
{/*                                                </div>*/}
{/*                                            )}*/}
{/*                                        </label>*/}
{/*                                    </div>*/}
{/*                                </div>*/}

{/*                                /!* Certificate Details *!/*/}
{/*                                <div className="grid grid-cols-1 gap-4">*/}
{/*                                    <div>*/}
{/*                                        <label className="block text-sm font-medium text-gray-300 mb-1">*/}
{/*                                            Common Name (CN)*/}
{/*                                        </label>*/}
{/*                                        <input*/}
{/*                                            type="text"*/}
{/*                                            value={sslCertData.cn}*/}
{/*                                            onChange={(e) => setSSLCertData(prev => ({ ...prev, cn: e.target.value }))}*/}
{/*                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"*/}
{/*                                            placeholder="CN_USERNAME_TIMESTAMP"*/}
{/*                                        />*/}
{/*                                    </div>*/}

{/*                                    <div>*/}
{/*                                        <label className="block text-sm font-medium text-gray-300 mb-1">*/}
{/*                                            Serial Number*/}
{/*                                        </label>*/}
{/*                                        <input*/}
{/*                                            type="text"*/}
{/*                                            value={sslCertData.serial}*/}
{/*                                            onChange={(e) => setSSLCertData(prev => ({ ...prev, serial: e.target.value }))}*/}
{/*                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"*/}
{/*                                            placeholder="SERIAL_USERNAME_TIMESTAMP"*/}
{/*                                        />*/}
{/*                                    </div>*/}

{/*                                    <div>*/}
{/*                                        <label className="block text-sm font-medium text-gray-300 mb-1">*/}
{/*                                            Fingerprint*/}
{/*                                        </label>*/}
{/*                                        <input*/}
{/*                                            type="text"*/}
{/*                                            value={sslCertData.fingerprint}*/}
{/*                                            onChange={(e) => setSSLCertData(prev => ({ ...prev, fingerprint: e.target.value }))}*/}
{/*                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"*/}
{/*                                            placeholder="FINGERPRINT_USERNAME_TIMESTAMP"*/}
{/*                                        />*/}
{/*                                    </div>*/}
{/*                                </div>*/}

{/*                                /!* API Data Preview *!/*/}
{/*                                <div className="bg-gray-900 border border-gray-600 rounded p-3">*/}
{/*                                    <h5 className="text-sm font-medium text-gray-300 mb-2">Дані для API:</h5>*/}
{/*                                    <pre className="text-xs text-gray-400 overflow-x-auto">*/}
{/*{currentSSLUser && JSON.stringify({*/}
{/*    username: `${currentSSLUser.username}_${new Date().toISOString().replace(/[-:T]/g, '').split('.')[0]}`,*/}
{/*    username_alias: currentSSLUser.username_alias || `${currentSSLUser.username.charAt(0).toUpperCase() + currentSSLUser.username.slice(1)} User`,*/}
{/*    pki_certificate_cn: sslCertData.cn,*/}
{/*    pki_certificate_serial: sslCertData.serial,*/}
{/*    pki_certificate_fingerprint: sslCertData.fingerprint,*/}
{/*    post_id: currentSSLUser.post_id*/}
{/*}, null, 2)}*/}
{/*                                    </pre>*/}
{/*                                </div>*/}
{/*                            </div>*/}

{/*                            <div className="flex gap-3 mt-6">*/}
{/*                                <button*/}
{/*                                    onClick={handleIssueSSLCert}*/}
{/*                                    disabled={isLoading || !sslCertData.certificate}*/}
{/*                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"*/}
{/*                                >*/}
{/*                                    {isLoading ? (*/}
{/*                                        <>*/}
{/*                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />*/}
{/*                                            Створення користувача...*/}
{/*                                        </>*/}
{/*                                    ) : (*/}
{/*                                        <>*/}
{/*                                            <Key className="w-4 h-4" />*/}
{/*                                            Створити користувача*/}
{/*                                        </>*/}
{/*                                    )}*/}
{/*                                </button>*/}
{/*                                <button*/}
{/*                                    onClick={() => setShowSSLModal(false)}*/}
{/*                                    disabled={isLoading}*/}
{/*                                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"*/}
{/*                                >*/}
{/*                                    Скасувати*/}
{/*                                </button>*/}
{/*                            </div>*/}
{/*                        </div>*/}
{/*                    </div>*/}
{/*                )}*/}


                {/* Post Modal */}
                {showPostModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">
                                    {editingPost?.id ? 'Редагувати пост' : 'Новий пост'}
                                </h3>
                                <button
                                    onClick={() => setShowPostModal(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Назва поста */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Назва поста *
                                    </label>
                                    <input
                                        type="text"
                                        value={editingPost?.name || ''}
                                        onChange={(e) => setEditingPost(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                        required
                                    />
                                </div>

                                {/* Код поста */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Код поста *
                                    </label>
                                    <input
                                        type="text"
                                        value={editingPost?.code || ''}
                                        onChange={(e) => {
                                            // Дозволяємо тільки латинські літери, цифри, підкреслення та дефіс
                                            const value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
                                            setEditingPost(prev => ({ ...prev, code: value }));
                                        }}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                        placeholder="POST_001"
                                        required
                                    />
                                </div>

                                {/* Регіон */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Регіон України *
                                    </label>
                                    <select
                                        value={editingPost?.region || ''}
                                        onChange={(e) => handleRegionChange(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                        required
                                    >
                                        <option value="">Оберіть регіон</option>
                                        {regions.map(region => (
                                            <option key={region} value={region}>
                                                {region}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Місто з пошуком */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Місто *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder={editingPost?.region ? 'Пошук міста або введіть вручну...' : 'Спочатку оберіть регіон'}
                                            disabled={!editingPost?.region}
                                            value={editingPost?.city || ''}
                                            onChange={(e) => {
                                                // Оновлюємо editingPost.city напряму
                                                setEditingPost(prev => ({ ...prev, city: e.target.value }));
                                                // Також показуємо dropdown при введенні
                                                if (e.target.value) {
                                                    setShowCityDropdown(true);
                                                }
                                            }}
                                            onFocus={() => setShowCityDropdown(true)}
                                            onBlur={() => {
                                                // Закриваємо dropdown з невеликою затримкою, щоб клік по елементу встиг спрацювати
                                                setTimeout(() => setShowCityDropdown(false), 200);
                                            }}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                            required
                                        />

                                        {/* Dropdown міст */}
                                        {showCityDropdown && editingPost?.region && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded shadow-lg z-20 max-h-48 overflow-y-auto">
                                                {filteredCities.length > 0 ? (
                                                    filteredCities.map(city => (
                                                        <button
                                                            key={city}
                                                            type="button"
                                                            onClick={() => handleCitySelect(city)}
                                                            className={`w-full text-left px-3 py-2 hover:bg-gray-600 transition-colors ${
                                                                editingPost?.city === city ? 'bg-blue-600 text-white' : 'text-gray-200'
                                                            }`}
                                                        >
                                                            {city}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-2 text-gray-400 text-sm">
                                                        Міст не знайдено
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Опис */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Опис
                                    </label>
                                    <textarea
                                        value={editingPost?.description || ''}
                                        onChange={(e) => setEditingPost(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                        rows={3}
                                        placeholder="Опис поста моніторингу"
                                    />
                                </div>

                                {/* Статус активності (тільки при редагуванні) */}
                                {editingPost?.id && (
                                    <div>
                                        <label className="flex items-center gap-2 text-sm text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={editingPost?.is_active !== false}
                                                onChange={(e) => setEditingPost(prev => ({ ...prev, is_active: e.target.checked }))}
                                                className="rounded"
                                            />
                                            Активний пост
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleSavePost}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    {editingPost?.id ? 'Недоступно' : 'Створити пост'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPostModal(false);
                                        setEditingPost(null);
                                        setCitySearch('');
                                        setShowCityDropdown(false);
                                    }}
                                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                    Скасувати
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* User Modal */}
                {showUserModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">
                                    Редагувати користувача
                                </h3>
                                <button
                                    onClick={() => setShowUserModal(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Ім'я користувача
                                    </label>
                                    <input
                                        type="text"
                                        value={editingUser?.username || ''}
                                        disabled
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Відображуване ім'я
                                    </label>
                                    <input
                                        type="text"
                                        value={editingUser?.username_alias || ''}
                                        onChange={(e) => setEditingUser(prev => ({ ...prev, username_alias: e.target.value }))}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Ролі (можна обрати декілька)
                                    </label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-gray-700 border border-gray-600 rounded">
                                        {roles.map(role => {
                                            const isSelected = editingUser?.role_ids?.includes(role.id) || false;
                                            return (
                                                <label key={role.id} className="flex items-center gap-2 text-sm text-gray-300 hover:bg-gray-600 p-2 rounded cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            setEditingUser(prev => {
                                                                const currentRoles = prev.role_ids || [];
                                                                const newRoles = e.target.checked
                                                                    ? [...currentRoles, role.id]
                                                                    : currentRoles.filter(id => id !== role.id);
                                                                return {
                                                                    ...prev,
                                                                    role_ids: newRoles
                                                                };
                                                            });
                                                        }}
                                                        className="rounded"
                                                    />
                                                    <span className="font-medium">{role.display_name}</span>
                                                    {role.description && (
                                                        <span className="text-xs text-gray-400">- {role.description}</span>
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>
                                    {editingUser?.role_ids && editingUser.role_ids.length > 0 && (
                                        <div className="mt-2 text-xs text-gray-400">
                                            Обрано ролей: {editingUser.role_ids.length}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Пост
                                    </label>
                                    <select
                                        value={editingUser?.post_id ?? ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setEditingUser(prev => ({
                                                ...prev,
                                                // ✅ post_id як число або null
                                                post_id: value === '' ? null : parseInt(value, 10)
                                            }));
                                        }}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                    >
                                        <option value="">Оберіть пост</option>
                                        {posts.map(post => (
                                            <option key={post.id} value={post.id}>
                                                {post.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={editingUser?.is_active || false}
                                            onChange={(e) => setEditingUser(prev => ({ ...prev, is_active: e.target.checked }))}
                                            className="rounded"
                                        />
                                        Активний користувач
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleSaveUser}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Збереження...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Зберегти
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowUserModal(false)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                    Скасувати
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Role Modal */}
                {showRoleModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">
                                    {editingRole?.id ? 'Редагувати роль' : 'Нова роль'}
                                </h3>
                                <button
                                    onClick={() => setShowRoleModal(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Системна назва *
                                    </label>
                                    <input
                                        type="text"
                                        value={editingRole?.name || ''}
                                        onChange={(e) => {
                                            // Дозволяємо тільки латинські літери, цифри, підкреслення та дефіс
                                            const value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
                                            setEditingRole(prev => ({ ...prev, name: value }));
                                        }}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                        placeholder="operator"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Відображувана назва *
                                    </label>
                                    <input
                                        type="text"
                                        value={editingRole?.display_name || ''}
                                        onChange={(e) => setEditingRole(prev => ({ ...prev, display_name: e.target.value }))}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                                        placeholder="Оператор"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Дозволи
                                    </label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-600 rounded p-3">
                                        {availablePermissions.map(permission => (
                                            <label key={permission.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 p-1 rounded" title={permission.description || ''}>
                                                <input
                                                    type="checkbox"
                                                    checked={editingRole?.permissions?.includes(permission.id) || false}
                                                    onChange={(e) => {
                                                        setEditingRole(prev => ({
                                                            ...prev,
                                                            permissions: e.target.checked
                                                                ? [...(prev.permissions || []), permission.id]
                                                                : (prev.permissions || []).filter(p => p !== permission.id)
                                                        }));
                                                    }}
                                                    className="rounded"
                                                />
                                                <span className="text-sm text-gray-300">{permission.display_name || permission.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleSaveRole}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Зберегти
                                </button>
                                <button
                                    onClick={() => setShowRoleModal(false)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                    Скасувати
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Certificate Upload Modal */}
            <CertificateUploadModal
                isOpen={showCertificateUploadModal}
                onClose={() => setShowCertificateUploadModal(false)}
                posts={posts}
                roles={roles}
                onUserCreated={handleCreateUserFromCertificate}
                isLoading={isLoading}
            />

            {/* Signal Type Modal */}
            <SignalTypeModal
                isOpen={showSignalTypeModal}
                onClose={() => {
                    setShowSignalTypeModal(false);
                    setEditingSignalType(null);
                }}
                onSave={handleSaveSignalType}
                signalType={editingSignalType}
                categories={categories}
            />

            {/* Category Modal */}
            <CategoryModal
                isOpen={showCategoryModal}
                onClose={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                }}
                onSave={handleSaveCategory}
                category={editingCategory}
            />
        </div>
    );
};

export default AdminPage;