import React, { useState, useEffect, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { BarChart3, Filter, TrendingUp, Radio, Target, Download } from 'lucide-react';
import { api } from '../../services/apiClient';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import 'jspdf-autotable';

// Реєструємо компоненти Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

const AnalyticsPage = () => {
    // Рефи для графіків
    const pieChartRef = useRef(null);
    const barChartRef = useRef(null);
    const statsRef = useRef(null);

    // Фільтри
    const [filters, setFilters] = useState({
        frequencyFrom: '',
        frequencyTo: '',
        isVideoFrequency: false,
        isControlFrequency: false,
        signalTypeId: 'all', // 'all' або конкретний ID
        postId: 'all',       // ✅ ДОДАНО
        status: 'all'        // ✅ ДОДАНО
    });

    // Дані
    const [observations, setObservations] = useState([]);
    const [signalTypes, setSignalTypes] = useState([]);
    const [posts, setPosts] = useState([]);  // ✅ ДОДАНО
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Статистика
    const [stats, setStats] = useState({
        byType: {},
        byFrequency: {},
        total: 0
    });

    // Завантаження типів сигналів та постів
    useEffect(() => {
        loadSignalTypes();
        loadPosts();
    }, []);

    const loadSignalTypes = async () => {
        try {
            // Завантажуємо реальні типи сигналів з API
            const data = await api.signalTypes.list({ page: 1, page_size: 100 });
            setSignalTypes(data);
        } catch (error) {
            console.error('Помилка завантаження типів:', error);
            setSignalTypes([]);
        }
    };

    const loadPosts = async () => {
        try {
            const data = await api.posts.list({ page: 1, page_size: 100, is_active: true });
            setPosts(data);
        } catch (error) {
            console.error('Помилка завантаження постів:', error);
            setPosts([]);
        }
    };

    // Завантаження даних з фільтрацією (серверна фільтрація)
    const loadData = async () => {
        try {
            setLoading(true);

            // Параметри для API запиту - всі фільтри передаються на сервер
            const params = {
                page: 1,
                page_size: 200,
                sort_by: 'observed_at',
                sort_order: 'descending'
            };

            // Фільтр по посту
            if (filters.postId !== 'all') {
                params.post_id = parseInt(filters.postId);
            }

            // Фільтр по статусу
            if (filters.status !== 'all') {
                params.status = filters.status;
            }

            // Фільтр по типу сигналу
            if (filters.signalTypeId !== 'all') {
                params.signal_type_id = parseInt(filters.signalTypeId);
            }

            // Фільтри по частотах - передаємо на сервер
            if (filters.isVideoFrequency) {
                // Фільтруємо по відео частоті
                if (filters.frequencyFrom) {
                    params.video_frequency_center_from = parseFloat(filters.frequencyFrom);
                }
                if (filters.frequencyTo) {
                    params.video_frequency_center_to = parseFloat(filters.frequencyTo);
                }
            } else if (filters.isControlFrequency || filters.frequencyFrom || filters.frequencyTo) {
                // Фільтруємо по частоті керування (або за замовчуванням)
                if (filters.frequencyFrom) {
                    params.frequency_center_from = parseFloat(filters.frequencyFrom);
                }
                if (filters.frequencyTo) {
                    params.frequency_center_to = parseFloat(filters.frequencyTo);
                }
            }

            // Завантажуємо спостереження з серверними фільтрами
            const data = await api.observations.list(params);

            setObservations(data);
            calculateStatistics(data);
        } catch (error) {
            console.error('Помилка завантаження даних:', error);
        } finally {
            setLoading(false);
        }
    };

    // Розрахунок статистики
    const calculateStatistics = (data) => {
        // Статистика по типах
        const byType = {};
        data.forEach(obs => {
            const typeId = obs.signal_type_id;
            byType[typeId] = (byType[typeId] || 0) + 1;
        });

        // Статистика по частотах (діапазони по 10 МГц)
        const byFrequency = {};
        data.forEach(obs => {
            let freq;

            if (filters.isVideoFrequency && obs.video_frequency_min) {
                freq = parseFloat(obs.video_frequency_min);
            } else {
                freq = parseFloat(obs.frequency_min);
            }

            if (freq) {
                const range = Math.floor(freq / 10) * 10;
                const label = `${range}-${range + 10} МГц`;
                byFrequency[label] = (byFrequency[label] || 0) + 1;
            }
        });

        setStats({
            byType,
            byFrequency,
            total: data.length
        });
    };

    // Експорт в PDF
    const exportToPDF = async () => {
        try {
            setExporting(true);

            // Створюємо PDF (A4 формат)
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            let yPosition = 15;

            // Створюємо тимчасовий контейнер для заголовка
            const createTextElement = (text, fontSize, isBold = false) => {
                const div = document.createElement('div');
                div.style.cssText = `
                    font-family: Arial, sans-serif;
                    font-size: ${fontSize}px;
                    font-weight: ${isBold ? 'bold' : 'normal'};
                    color: #000;
                    padding: 10px;
                    background: white;
                    width: ${pageWidth * 3.78}px;
                `;
                div.textContent = text;
                document.body.appendChild(div);
                return div;
            };

            // Заголовок
            const titleDiv = createTextElement('Аналітика та статистика', 24, true);
            titleDiv.style.textAlign = 'center';
            const titleCanvas = await html2canvas(titleDiv, { scale: 2, backgroundColor: '#fff' });
            pdf.addImage(titleCanvas.toDataURL('image/png'), 'PNG', 0, yPosition, pageWidth, 15);
            document.body.removeChild(titleDiv);
            yPosition += 18;

            // Дата
            const dateDiv = createTextElement(`Дата створення: ${new Date().toLocaleString('uk-UA')}`, 12);
            dateDiv.style.textAlign = 'center';
            const dateCanvas = await html2canvas(dateDiv, { scale: 2, backgroundColor: '#fff' });
            pdf.addImage(dateCanvas.toDataURL('image/png'), 'PNG', 0, yPosition, pageWidth, 8);
            document.body.removeChild(dateDiv);
            yPosition += 12;

            // Фільтри
            const filterLines = [];
            if (filters.frequencyFrom || filters.frequencyTo) {
                const freqLabel = filters.isVideoFrequency ? 'Відео частота' : 'Частота керування';
                filterLines.push(`${freqLabel}: ${filters.frequencyFrom || '0'} - ${filters.frequencyTo || 'max'} МГц`);
            }
            if (filters.signalTypeId !== 'all') {
                const type = signalTypes.find(t => t.id === parseInt(filters.signalTypeId));
                filterLines.push(`Тип БПЛА: ${type ? type.name : filters.signalTypeId}`);
            }
            if (filters.postId !== 'all') {
                const post = posts.find(p => p.id === parseInt(filters.postId));
                filterLines.push(`Пост: ${post ? `${post.name} (${post.code})` : filters.postId}`);
            }
            if (filters.status !== 'all') {
                const statusLabel = filters.status === 'active' ? 'Активні' : 'Зниклі';
                filterLines.push(`Статус: ${statusLabel}`);
            }

            const filtersText = filterLines.length > 0
                ? 'Застосовані фільтри:\n' + filterLines.map(f => `• ${f}`).join('\n')
                : 'Застосовані фільтри:\nФільтри не застосовані';

            const filtersDiv = createTextElement(filtersText, 12, true);
            filtersDiv.style.whiteSpace = 'pre-line';
            const filtersCanvas = await html2canvas(filtersDiv, { scale: 2, backgroundColor: '#fff' });
            const filtersHeight = (filtersCanvas.height / filtersCanvas.width) * pageWidth;
            pdf.addImage(filtersCanvas.toDataURL('image/png'), 'PNG', 0, yPosition, pageWidth, filtersHeight);
            document.body.removeChild(filtersDiv);
            yPosition += filtersHeight + 5;

            // Загальна статистика
            let statsText = 'Загальна статистика:\n';
            statsText += `Всього спостережень: ${stats.total}\n`;
            statsText += `Типів БПЛА: ${Object.keys(stats.byType).length}\n`;

            if (Object.keys(stats.byType).length > 0) {
                const maxTypeId = Object.keys(stats.byType).reduce((a, b) =>
                    stats.byType[a] > stats.byType[b] ? a : b
                );
                const type = signalTypes.find(t => t.id === parseInt(maxTypeId));
                const typeName = type ? type.name : `Тип ${maxTypeId}`;
                statsText += `Найпоширеніший тип: ${typeName} (${stats.byType[maxTypeId]} спостережень)`;
            }

            const statsDiv = createTextElement(statsText, 12, true);
            statsDiv.style.whiteSpace = 'pre-line';
            const statsCanvas = await html2canvas(statsDiv, { scale: 2, backgroundColor: '#fff' });
            const statsHeight = (statsCanvas.height / statsCanvas.width) * pageWidth;
            pdf.addImage(statsCanvas.toDataURL('image/png'), 'PNG', 0, yPosition, pageWidth, statsHeight);
            document.body.removeChild(statsDiv);
            yPosition += statsHeight + 5;

            // Додаємо графіки
            if (pieChartRef.current && Object.keys(stats.byType).length > 0) {
                if (yPosition + 80 > pageHeight - 20) {
                    pdf.addPage();
                    yPosition = 15;
                }

                const chartTitleDiv = createTextElement('Розподіл по типах БПЛА', 14, true);
                const chartTitleCanvas = await html2canvas(chartTitleDiv, { scale: 2, backgroundColor: '#fff' });
                pdf.addImage(chartTitleCanvas.toDataURL('image/png'), 'PNG', 0, yPosition, pageWidth, 8);
                document.body.removeChild(chartTitleDiv);
                yPosition += 10;

                const pieCanvas = await html2canvas(pieChartRef.current, {
                    backgroundColor: '#1f2937',
                    scale: 2
                });
                const pieImage = pieCanvas.toDataURL('image/png');
                pdf.addImage(pieImage, 'PNG', 15, yPosition, 90, 70);
                yPosition += 75;
            }

            if (barChartRef.current && Object.keys(stats.byFrequency).length > 0) {
                if (yPosition + 80 > pageHeight - 20) {
                    pdf.addPage();
                    yPosition = 15;
                }

                const chartTitleDiv = createTextElement('Розподіл по частотах', 14, true);
                const chartTitleCanvas = await html2canvas(chartTitleDiv, { scale: 2, backgroundColor: '#fff' });
                pdf.addImage(chartTitleCanvas.toDataURL('image/png'), 'PNG', 0, yPosition, pageWidth, 8);
                document.body.removeChild(chartTitleDiv);
                yPosition += 10;

                const barCanvas = await html2canvas(barChartRef.current, {
                    backgroundColor: '#1f2937',
                    scale: 2
                });
                const barImage = barCanvas.toDataURL('image/png');
                pdf.addImage(barImage, 'PNG', 15, yPosition, 180, 70);
                yPosition += 75;
            }

            // Додаємо таблицю детальної статистики
            if (Object.keys(stats.byType).length > 0) {
                if (yPosition + 40 > pageHeight - 20) {
                    pdf.addPage();
                    yPosition = 15;
                }

                const tableTitleDiv = createTextElement('Детальна статистика', 14, true);
                const tableTitleCanvas = await html2canvas(tableTitleDiv, { scale: 2, backgroundColor: '#fff' });
                pdf.addImage(tableTitleCanvas.toDataURL('image/png'), 'PNG', 0, yPosition, pageWidth, 8);
                document.body.removeChild(tableTitleDiv);
                yPosition += 10;

                const sortedTypes = Object.entries(stats.byType).sort((a, b) => b[1] - a[1]);
                const tableData = sortedTypes.map(([typeId, count]) => {
                    const type = signalTypes.find(t => t.id === parseInt(typeId));
                    const typeName = type ? type.name : `Тип ${typeId}`;
                    const percentage = ((count / stats.total) * 100).toFixed(1);
                    return [typeName, count.toString(), `${percentage}%`];
                });

                // Використовуємо autoTable для таблиці
                pdf.autoTable({
                    startY: yPosition,
                    head: [['Тип БПЛА', 'Кількість', 'Відсоток']],
                    body: tableData,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [34, 197, 94],
                        textColor: [255, 255, 255],
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    styles: {
                        font: 'helvetica',
                        fontSize: 10,
                        cellPadding: 3,
                        overflow: 'linebreak',
                        cellWidth: 'auto'
                    },
                    columnStyles: {
                        0: { cellWidth: 'auto', halign: 'left' },
                        1: { cellWidth: 30, halign: 'center' },
                        2: { cellWidth: 30, halign: 'center' }
                    },
                    margin: { left: 15, right: 15 },
                    didDrawCell: (data) => {
                        // Додаємо власний рендеринг тексту через canvas для підтримки UTF-8
                        if (data.section === 'body' && data.column.index === 0) {
                            const text = data.cell.text[0];
                            if (text && /[А-Яа-яЁёІіЇїЄєҐґ]/.test(text)) {
                                // Текст містить кирилицю - малюємо його через canvas
                                data.cell.text = [''];
                            }
                        }
                    }
                });
            }

            // Зберігаємо PDF
            const fileName = `analytics_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);

        } catch (error) {
            console.error('Помилка експорту в PDF:', error);
            alert('Помилка при створенні PDF файлу');
        } finally {
            setExporting(false);
        }
    };

    // Дані для графіка по типах (Pie Chart)
    const typeChartData = {
        labels: Object.keys(stats.byType).map(typeId => {
            const type = signalTypes.find(t => t.id === parseInt(typeId));
            return type ? type.name : `Тип ${typeId}`;
        }),
        datasets: [{
            label: 'Кількість спостережень',
            data: Object.values(stats.byType),
            backgroundColor: [
                'rgba(34, 197, 94, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(234, 179, 8, 0.8)',
                'rgba(239, 68, 68, 0.8)',
                'rgba(168, 85, 247, 0.8)',
                'rgba(236, 72, 153, 0.8)',
            ],
            borderColor: [
                'rgb(34, 197, 94)',
                'rgb(59, 130, 246)',
                'rgb(234, 179, 8)',
                'rgb(239, 68, 68)',
                'rgb(168, 85, 247)',
                'rgb(236, 72, 153)',
            ],
            borderWidth: 2
        }]
    };

    // Дані для графіка по частотах (Bar Chart)
    const frequencyChartData = {
        labels: Object.keys(stats.byFrequency),
        datasets: [{
            label: 'Кількість спостережень',
            data: Object.values(stats.byFrequency),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 2
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#fff',
                    font: { size: 12 }
                }
            }
        },
        scales: {
            y: {
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(75, 85, 99, 0.3)' }
            },
            x: {
                ticks: { color: '#9ca3af' },
                grid: { color: 'rgba(75, 85, 99, 0.3)' }
            }
        }
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    color: '#fff',
                    font: { size: 12 }
                }
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <BarChart3 className="w-10 h-10 text-green-400" />
                        <h1 className="text-3xl font-bold text-white">
                            Аналітика та статистика
                        </h1>
                        <TrendingUp className="w-10 h-10 text-green-400" />
                    </div>
                    <p className="text-gray-400">
                        Аналіз спостережень за типами БПЛА та частотами
                    </p>
                </div>

                {/* Фільтри */}
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-green-400" />
                        <h2 className="text-xl font-bold text-white">Фільтри</h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Діапазон частот */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Частота від (МГц)
                            </label>
                            <input
                                type="number"
                                step="0.001"
                                value={filters.frequencyFrom}
                                onChange={(e) => setFilters(prev => ({ ...prev, frequencyFrom: e.target.value }))}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-green-500"
                                placeholder="0.0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Частота до (МГц)
                            </label>
                            <input
                                type="number"
                                step="0.001"
                                value={filters.frequencyTo}
                                onChange={(e) => setFilters(prev => ({ ...prev, frequencyTo: e.target.value }))}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-green-500"
                                placeholder="6000.0"
                            />
                        </div>

                        {/* Тип сигналу */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Тип БПЛА
                            </label>
                            <select
                                value={filters.signalTypeId}
                                onChange={(e) => setFilters(prev => ({ ...prev, signalTypeId: e.target.value }))}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-green-500"
                            >
                                <option value="all">Всі типи</option>
                                {signalTypes.map(type => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Пост та Статус */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Пост
                            </label>
                            <select
                                value={filters.postId}
                                onChange={(e) => setFilters(prev => ({ ...prev, postId: e.target.value }))}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-green-500"
                            >
                                <option value="all">Всі пости</option>
                                {posts.map(post => (
                                    <option key={post.id} value={post.id}>
                                        {post.name} ({post.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Статус
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-green-500"
                            >
                                <option value="all">Всі статуси</option>
                                <option value="active">Активні</option>
                                <option value="disappeared">Зниклі</option>
                            </select>
                        </div>
                    </div>

                    {/* Чекбокси */}
                    <div className="mt-4 flex gap-6">
                        <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.isVideoFrequency}
                                onChange={(e) => setFilters(prev => ({ ...prev, isVideoFrequency: e.target.checked }))}
                                className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                            />
                            <span>Частота відео</span>
                        </label>

                        <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.isControlFrequency}
                                onChange={(e) => setFilters(prev => ({ ...prev, isControlFrequency: e.target.checked }))}
                                className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                            />
                            <span>Частота керування</span>
                        </label>
                    </div>

                    {/* Кнопки */}
                    <div className="mt-6 flex flex-wrap gap-4">
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="flex-1 md:flex-initial px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Завантаження...</span>
                                </>
                            ) : (
                                <>
                                    <Target className="w-5 h-5" />
                                    <span>Побудувати графіки</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={exportToPDF}
                            disabled={exporting || stats.total === 0}
                            className="flex-1 md:flex-initial px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {exporting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Експорт...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    <span>Експорт в PDF</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Статистика */}
                {stats.total > 0 && (
                    <>
                        {/* Загальна інформація */}
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                                <div className="text-gray-400 text-sm mb-1">Всього спостережень</div>
                                <div className="text-3xl font-bold text-white">{stats.total}</div>
                            </div>
                            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                                <div className="text-gray-400 text-sm mb-1">Типів БПЛА</div>
                                <div className="text-3xl font-bold text-green-400">
                                    {Object.keys(stats.byType).length}
                                </div>
                            </div>
                            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                                <div className="text-gray-400 text-sm mb-1">Найпоширеніший тип</div>
                                <div className="text-lg font-bold text-white">
                                    {Object.keys(stats.byType).length > 0 ? (
                                        (() => {
                                            const maxTypeId = Object.keys(stats.byType).reduce((a, b) =>
                                                stats.byType[a] > stats.byType[b] ? a : b
                                            );
                                            const type = signalTypes.find(t => t.id === parseInt(maxTypeId));
                                            return type ? type.name : `Тип ${maxTypeId}`;
                                        })()
                                    ) : 'N/A'}
                                    <div className="text-sm text-gray-400 mt-1">
                                        {Object.keys(stats.byType).length > 0 &&
                                            `${stats.byType[Object.keys(stats.byType).reduce((a, b) =>
                                                stats.byType[a] > stats.byType[b] ? a : b
                                            )]} спостережень`
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Графіки */}
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Графік по типах */}
                            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Radio className="w-5 h-5 text-green-400" />
                                    Розподіл по типах БПЛА
                                </h3>
                                <div ref={pieChartRef} style={{ height: '400px' }}>
                                    {Object.keys(stats.byType).length > 0 ? (
                                        <Pie data={typeChartData} options={pieOptions} />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">
                                            Немає даних
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Графік по частотах */}
                            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-green-400" />
                                    Розподіл по частотах
                                </h3>
                                <div ref={barChartRef} style={{ height: '400px' }}>
                                    {Object.keys(stats.byFrequency).length > 0 ? (
                                        <Bar data={frequencyChartData} options={chartOptions} />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">
                                            Немає даних
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Таблиця деталей */}
                        <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Детальна статистика</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-600">
                                            <th className="text-left p-3 text-gray-300">Тип БПЛА</th>
                                            <th className="text-right p-3 text-gray-300">Кількість</th>
                                            <th className="text-right p-3 text-gray-300">Відсоток</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(stats.byType)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([typeId, count]) => {
                                                const type = signalTypes.find(t => t.id === parseInt(typeId));
                                                const percentage = ((count / stats.total) * 100).toFixed(1);
                                                return (
                                                    <tr key={typeId} className="border-b border-gray-700 hover:bg-gray-700/50">
                                                        <td className="p-3 text-white">
                                                            {type ? type.name : `Тип ${typeId}`}
                                                        </td>
                                                        <td className="p-3 text-right text-white font-medium">
                                                            {count}
                                                        </td>
                                                        <td className="p-3 text-right text-green-400 font-medium">
                                                            {percentage}%
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* Заглушка якщо немає даних */}
                {stats.total === 0 && !loading && (
                    <div className="bg-gray-800 border border-gray-600 rounded-lg p-12 text-center">
                        <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-400 mb-2">
                            Немає даних для відображення
                        </h3>
                        <p className="text-gray-500">
                            Натисніть "Побудувати графіки" щоб завантажити дані
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsPage;
