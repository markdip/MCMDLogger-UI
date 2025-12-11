const { ipcRenderer, shell } = require('electron');
const path = require('path');

// State
let isRunning = false;
let commandHistory = [];
let historyIndex = -1;
let currentLang = localStorage.getItem('mcmdgui-lang') || 'en';

// Translations
const translations = {
    en: {
        // Navigation
        'nav.connection': 'Connection',
        'nav.serverSetup': 'Server Setup',
        'nav.control': 'Control',
        'nav.console': 'Console',
        'nav.players': 'Players',
        'nav.quickCommands': 'Quick Commands',
        'nav.advanced': 'Advanced',
        'nav.scripts': 'Scripts',
        'nav.mappings': 'Version Mappings',

        // Status
        'status.offline': 'Offline',
        'status.running': 'Running',

        // Connection
        'connection.title': 'Server Connection',
        'connection.subtitle': 'Configure your MITM proxy settings to intercept Minecraft traffic',
        'connection.proxyConfig': 'Proxy Configuration',
        'connection.localPort': 'Local Port',
        'connection.portHint': 'Port for the fake server (default: 25565)',
        'connection.targetServer': 'Target Server',
        'connection.targetHint': 'Target Minecraft server address (host:port)',
        'connection.startProxy': 'Start Proxy',
        'connection.stop': 'Stop',
        'connection.howItWorks': 'How It Works',
        'connection.step1Title': 'Start the Proxy',
        'connection.step1Desc': 'Enter your local port and target server, then click Start',
        'connection.step2Title': 'Connect Players',
        'connection.step2Desc': 'Have players connect to localhost:[your port]',
        'connection.step3Title': 'Intercept Traffic',
        'connection.step3Desc': 'Monitor and modify packets in real-time',

        // Console
        'console.title': 'Console',
        'console.subtitle': 'View output and send commands to MCmdLogger',
        'console.welcome': 'Welcome to MCmdLogger GUI Console',
        'console.welcomeHint': 'Start the proxy to see output here',
        'console.inputPlaceholder': 'Enter command...',

        // Players
        'players.title': 'Connected Players',
        'players.subtitle': 'Manage and interact with connected players',
        'players.noPlayers': 'No Players Connected',
        'players.noPlayersHint': 'Players will appear here when they connect to your proxy',
        'players.quickActions': 'Quick Actions',
        'players.listPlayers': 'List Players',

        // Commands
        'commands.title': 'Quick Commands',
        'commands.subtitle': 'Execute common MCmdLogger commands with one click',
        'commands.help': 'Help',
        'commands.helpDesc': 'Show all available commands',
        'commands.list': 'List',
        'commands.listDesc': 'Show connected players',
        'commands.vermapsInfo': 'Version Mappings Info',
        'commands.vermapsInfoDesc': 'Show current mappings info',
        'commands.buildPrismarine': 'Build Prismarine Mappings',
        'commands.buildPrismarineDesc': 'Update version mappings',
        'commands.customCommand': 'Custom Command',
        'commands.customPlaceholder': 'Enter any command...',
        'commands.execute': 'Execute',

        // Scripts
        'scripts.title': 'Scripts',
        'scripts.subtitle': 'Manage JavaScript scripts for advanced attack scenarios',
        'scripts.location': 'Script Location',
        'scripts.locationDesc': 'Scripts are loaded from the scripts/ directory next to MCmdLogger executable',
        'scripts.openFolder': 'Open Scripts Folder',
        'scripts.example': 'Example Script',

        // Mappings
        'mappings.title': 'Version Mappings',
        'mappings.subtitle': 'Manage Minecraft protocol version mappings',
        'mappings.current': 'Current Mappings',
        'mappings.currentDesc': 'MCmdLogger uses version mappings to parse and generate Minecraft packets.',
        'mappings.checkInfo': 'Check Mappings Info',
        'mappings.update': 'Update Mappings',
        'mappings.buildPrismarine': 'Build from PrismarineJS',
        'mappings.fromGit': 'From Git Repository',
        'mappings.repoUrl': 'Repository URL',
        'mappings.branch': 'Branch (optional)',
        'mappings.build': 'Build',
        'mappings.fromLocal': 'From Local Folder',
        'mappings.localPath': 'Path to mappings folder',

        // New: Navigation
        'nav.documentation': 'Documentation',
        'nav.cmdref': 'Commands Reference',
        'nav.scriptsguide': 'Scripts Guide',
        'nav.scriptstore': 'Script Store',
        'nav.integrations': 'Integrations',

        // New: Commands Reference
        'cmdref.title': 'Commands Reference',
        'cmdref.subtitle': 'Complete documentation of all MCmdLogger commands',
        'cmdref.helpDesc': 'Shows all available commands with descriptions',
        'cmdref.listDesc': 'Lists all connected players with their info',
        'cmdref.kickDesc': 'Disconnects a player from the proxy',
        'cmdref.vermapsInfoDesc': 'Shows information about loaded version mappings',
        'cmdref.vermapsBuildDesc': 'Downloads and builds mappings from PrismarineJS',
        'cmdref.vermapsGitDesc': 'Builds mappings from a Git repository',
        'cmdref.tryIt': 'Try it',

        // New: Scripts Guide
        'scriptsguide.title': 'Scripts Guide',
        'scriptsguide.subtitle': 'Learn how to write scripts for MCmdLogger',
        'scriptsguide.intro': 'Scripts extend MCmdLogger functionality. Create .js files in the scripts folder:',
        'scriptsguide.openFolder': 'Open Scripts Folder',
        'scriptsguide.namingTitle': '⚠️ Command Naming Convention',
        'scriptsguide.namingDesc': 'Custom command names must follow this pattern:',
        'scriptsguide.namingAllowed': 'Only lowercase letters (a-z), numbers (0-9), and underscores (_) are allowed.',
        'scriptsguide.namingValid': 'Valid:',
        'scriptsguide.namingInvalid': 'Invalid:',
        'scriptsguide.hooksTitle': '🪝 Hooks',
        'scriptsguide.hooksDesc': 'Hooks are the main way to interact with MCmdLogger. They allow you to react to events.',
        'scriptsguide.playerJoinHook': 'Called when a player connects to the proxy:',
        'scriptsguide.commandHook': 'Register custom console commands:',
        'scriptsguide.eventsTitle': '📡 Events',
        'scriptsguide.eventsDesc': 'Events let you react to specific actions:',
        'scriptsguide.chatEvent': 'Intercept chat messages:',
        'scriptsguide.packetEvent': 'Listen to raw packets:',

        // New: Script Store
        'scriptstore.title': 'Script Store',
        'scriptstore.subtitle': 'Download ready-to-use scripts',
        'scriptstore.installed': 'Installed Scripts',
        'scriptstore.install': 'Install',
        'scriptstore.delete': 'Delete',
        'scriptstore.noScripts': 'No scripts installed',

        // New: Integrations
        'integrations.title': 'Integrations',
        'integrations.subtitle': 'Connect Discord and Telegram bots for notifications and remote control',
        'integrations.botToken': 'Bot Token',
        'integrations.channelId': 'Channel ID',
        'integrations.channelPlaceholder': 'Channel ID for notifications',
        'integrations.orWebhook': 'or use Webhook',
        'integrations.webhookUrl': 'Webhook URL',
        'integrations.chatId': 'Chat ID',
        'integrations.chatIdPlaceholder': 'Your chat ID',
        'integrations.notificationSettings': 'Notification Settings',
        'integrations.testConnection': 'Test Connection',
        'integrations.connect': 'Connect',
        'integrations.saveSettings': 'Save Settings',
        'integrations.testNotification': 'Send Test Notification',
        'integrations.notifyJoinLeave': 'Player Join/Leave',
        'integrations.notifyPasswords': 'Password Captures',
        'integrations.notifyErrors': 'Errors & Crashes',
        'integrations.notifyCustom': 'Custom Script Events',
        'integrations.remoteTitle': '🎮 Remote Control via Bots',
        'integrations.remoteDesc': 'Once connected, you can control MCmdLogger from Discord/Telegram:',
        'integrations.cmdHelp': 'Execute any MCmdLogger command',
        'integrations.statusHelp': 'Check if MCmdLogger is running',
        'integrations.playersHelp': 'List connected players',

        // New: Script Editor
        'nav.scripteditor': 'Script Editor',
        'scripteditor.title': 'Script Editor',
        'scripteditor.subtitle': 'Edit and configure your installed scripts',
        'scripteditor.installedScripts': 'Installed Scripts',
        'scripteditor.noScripts': 'No scripts installed',
        'scripteditor.openFolder': 'Open Folder',
        'scripteditor.settings': 'Settings',
        'scripteditor.saveSettings': 'Save Settings',
        'scripteditor.reload': 'Reload',
        'scripteditor.save': 'Save',
        'scripteditor.selectScript': 'Select a script to edit',
        'scripteditor.selectScriptHint': 'Choose a script from the list on the left to view and edit its code and settings',

        // New: Deployment
        'nav.deployment': 'Deployment',
        'deployment.title': 'Deployment Guide',
        'deployment.subtitle': 'Learn how to deploy MCmdLogger for 24/7 operation',
        'deployment.vpsTitle': '🖥️ VPS Deployment (24/7)',
        'deployment.vpsDesc': 'For running MCmdLogger continuously, you need a Virtual Private Server (VPS).',
        'deployment.domainTitle': '🌍 Custom Domain Setup',
        'deployment.domainDesc': 'Make your fake server look more legitimate with a custom domain.',
        'deployment.buyDomain': 'Step 1: Buy a Domain',
        'deployment.subdomainTitle': 'Step 2: Setup Subdomain (play.server.net)',
        'deployment.subdomainDesc': 'To create a subdomain like play.yourserver.com, you need to configure DNS records:',
        'deployment.afterSetup': 'After setup, players can connect using: play.yourdomain.com',
        'deployment.proTip': 'Choose a domain similar to the target server. For example:',
        'deployment.ngrokPrice': '💰 $8/month',
        // Version compatibility
        'deployment.versionTitle': 'Version Compatibility',
        'deployment.versionDesc': 'This documentation is for MCmdLogger version 3.10+. Older versions (v9 and earlier) may have different features:',
        'deployment.v9Feature': 'v9 and earlier: May have built-in ngrok integration',
        'deployment.v10Feature': 'v10+: External tunneling required (ngrok, playit)',
        'deployment.recommend': 'We recommend using the latest version from',
        // Tunneling table
        'deployment.tunnelingTitle': '🌐 Tunneling Services',
        'deployment.tunnelingDesc': 'To make your MCmdLogger proxy accessible from the internet, you need a tunneling service:',
        'deployment.feature': 'Feature',
        'deployment.freePlan': 'Free Plan',
        'deployment.ngrokFree': '✅ Limited (1 tunnel)',
        'deployment.playitFree': '✅ Generous',
        'deployment.customDomain': 'Custom Domain',
        'deployment.notAvailable': '❌ Not available',
        'deployment.minecraftTcp': 'Minecraft TCP',
        'deployment.fullSupport': '✅ Full support',
        'deployment.setupDifficulty': 'Setup Difficulty',
        'deployment.medium': '⭐⭐ Medium',
        'deployment.easy': '⭐ Easy',
        'deployment.registration': 'Registration',
        'deployment.required': 'Required',
        'deployment.recommendation': 'Recommendation',
        'deployment.bestDomains': '🏆 Best for custom domains',
        'deployment.bestBeginners': '🏆 Best for beginners',
        'deployment.openNgrok': 'Open ngrok.com',
        'deployment.openPlayit': 'Open playit.gg',

        // Errors
        'error.noTarget': 'Error: Please enter a target server address',
        'error.notRunning': 'Error: Server is not running',
        'error.noGitUrl': 'Error: Please enter a Git repository URL',
        'error.noLocalPath': 'Error: Please enter a local path'
    },
    ru: {
        // Navigation
        'nav.connection': 'Подключение',
        'nav.serverSetup': 'Настройка сервера',
        'nav.control': 'Управление',
        'nav.console': 'Консоль',
        'nav.players': 'Игроки',
        'nav.quickCommands': 'Быстрые команды',
        'nav.advanced': 'Дополнительно',
        'nav.scripts': 'Скрипты',
        'nav.mappings': 'Версии протокола',

        // Status
        'status.offline': 'Оффлайн',
        'status.running': 'Работает',

        // Connection
        'connection.title': 'Подключение к серверу',
        'connection.subtitle': 'Настройте MITM-прокси для перехвата трафика Minecraft',
        'connection.proxyConfig': 'Настройка прокси',
        'connection.localPort': 'Локальный порт',
        'connection.portHint': 'Порт для фейкового сервера (по умолчанию: 25565)',
        'connection.targetServer': 'Целевой сервер',
        'connection.targetHint': 'Адрес целевого Minecraft сервера (хост:порт)',
        'connection.startProxy': 'Запустить прокси',
        'connection.stop': 'Остановить',
        'connection.howItWorks': 'Как это работает',
        'connection.step1Title': 'Запустите прокси',
        'connection.step1Desc': 'Введите порт и целевой сервер, затем нажмите Запустить',
        'connection.step2Title': 'Подключите игроков',
        'connection.step2Desc': 'Игроки подключаются к localhost:[ваш порт]',
        'connection.step3Title': 'Перехватывайте трафик',
        'connection.step3Desc': 'Отслеживайте и изменяйте пакеты в реальном времени',

        // Console
        'console.title': 'Консоль',
        'console.subtitle': 'Просмотр вывода и отправка команд в MCmdLogger',
        'console.welcome': 'Добро пожаловать в MCmdLogger GUI',
        'console.welcomeHint': 'Запустите прокси для отображения вывода',
        'console.inputPlaceholder': 'Введите команду...',

        // Players
        'players.title': 'Подключённые игроки',
        'players.subtitle': 'Управление подключёнными игроками',
        'players.noPlayers': 'Нет подключённых игроков',
        'players.noPlayersHint': 'Игроки появятся здесь при подключении к прокси',
        'players.quickActions': 'Быстрые действия',
        'players.listPlayers': 'Список игроков',

        // Commands
        'commands.title': 'Быстрые команды',
        'commands.subtitle': 'Выполняйте команды MCmdLogger одним кликом',
        'commands.help': 'Помощь',
        'commands.helpDesc': 'Показать все доступные команды',
        'commands.list': 'Список',
        'commands.listDesc': 'Показать подключённых игроков',
        'commands.vermapsInfo': 'Инфо о версиях',
        'commands.vermapsInfoDesc': 'Показать информацию о маппингах',
        'commands.buildPrismarine': 'Обновить маппинги',
        'commands.buildPrismarineDesc': 'Обновить версии протокола',
        'commands.customCommand': 'Своя команда',
        'commands.customPlaceholder': 'Введите любую команду...',
        'commands.execute': 'Выполнить',

        // Scripts
        'scripts.title': 'Скрипты',
        'scripts.subtitle': 'Управление JavaScript скриптами',
        'scripts.location': 'Расположение скриптов',
        'scripts.locationDesc': 'Скрипты загружаются из папки scripts/ рядом с MCmdLogger',
        'scripts.openFolder': 'Открыть папку скриптов',
        'scripts.example': 'Пример скрипта',

        // Mappings
        'mappings.title': 'Версии протокола',
        'mappings.subtitle': 'Управление маппингами версий Minecraft',
        'mappings.current': 'Текущие маппинги',
        'mappings.currentDesc': 'MCmdLogger использует маппинги для парсинга пакетов Minecraft.',
        'mappings.checkInfo': 'Проверить информацию',
        'mappings.update': 'Обновить маппинги',
        'mappings.buildPrismarine': 'Собрать из PrismarineJS',
        'mappings.fromGit': 'Из Git репозитория',
        'mappings.repoUrl': 'URL репозитория',
        'mappings.branch': 'Ветка (опционально)',
        'mappings.build': 'Собрать',
        'mappings.fromLocal': 'Из локальной папки',
        'mappings.localPath': 'Путь к папке маппингов',

        // New: Navigation
        'nav.documentation': 'Документация',
        'nav.cmdref': 'Справка по командам',
        'nav.scriptsguide': 'Руководство по скриптам',
        'nav.scriptstore': 'Магазин скриптов',
        'nav.integrations': 'Интеграции',

        // New: Commands Reference
        'cmdref.title': 'Справка по командам',
        'cmdref.subtitle': 'Полная документация всех команд MCmdLogger',
        'cmdref.helpDesc': 'Показывает все доступные команды с описаниями',
        'cmdref.listDesc': 'Показывает всех подключённых игроков',
        'cmdref.kickDesc': 'Отключает игрока от прокси',
        'cmdref.vermapsInfoDesc': 'Показывает информацию о загруженных маппингах',
        'cmdref.vermapsBuildDesc': 'Скачивает и собирает маппинги из PrismarineJS',
        'cmdref.vermapsGitDesc': 'Собирает маппинги из Git репозитория',
        'cmdref.tryIt': 'Попробовать',

        // New: Scripts Guide
        'scriptsguide.title': 'Руководство по скриптам',
        'scriptsguide.subtitle': 'Узнайте как писать скрипты для MCmdLogger',
        'scriptsguide.intro': 'Скрипты расширяют функциональность MCmdLogger. Создайте .js файлы в папке scripts:',
        'scriptsguide.openFolder': 'Открыть папку скриптов',
        'scriptsguide.namingTitle': '⚠️ Правила именования команд',
        'scriptsguide.namingDesc': 'Имена команд должны соответствовать шаблону:',
        'scriptsguide.namingAllowed': 'Разрешены только строчные буквы (a-z), цифры (0-9) и подчёркивания (_).',
        'scriptsguide.namingValid': 'Правильно:',
        'scriptsguide.namingInvalid': 'Неправильно:',
        'scriptsguide.hooksTitle': '🪝 Хуки',
        'scriptsguide.hooksDesc': 'Хуки - основной способ взаимодействия с MCmdLogger. Они позволяют реагировать на события.',
        'scriptsguide.playerJoinHook': 'Вызывается при подключении игрока к прокси:',
        'scriptsguide.commandHook': 'Регистрация своих консольных команд:',
        'scriptsguide.eventsTitle': '📡 События',
        'scriptsguide.eventsDesc': 'События позволяют реагировать на определённые действия:',
        'scriptsguide.chatEvent': 'Перехват сообщений чата:',
        'scriptsguide.packetEvent': 'Прослушивание raw пакетов:',

        // New: Script Store
        'scriptstore.title': 'Магазин скриптов',
        'scriptstore.subtitle': 'Скачивайте готовые скрипты',
        'scriptstore.installed': 'Установленные скрипты',
        'scriptstore.install': 'Установить',
        'scriptstore.delete': 'Удалить',
        'scriptstore.noScripts': 'Нет установленных скриптов',

        // New: Integrations
        'integrations.title': 'Интеграции',
        'integrations.subtitle': 'Подключите Discord и Telegram ботов для уведомлений и удалённого управления',
        'integrations.botToken': 'Токен бота',
        'integrations.channelId': 'ID канала',
        'integrations.channelPlaceholder': 'ID канала для уведомлений',
        'integrations.orWebhook': 'или используйте Webhook',
        'integrations.webhookUrl': 'URL вебхука',
        'integrations.chatId': 'ID чата',
        'integrations.chatIdPlaceholder': 'Ваш chat ID',
        'integrations.notificationSettings': 'Настройки уведомлений',
        'integrations.testConnection': 'Проверить подключение',
        'integrations.connect': 'Подключить',
        'integrations.saveSettings': 'Сохранить настройки',
        'integrations.testNotification': 'Отправить тестовое уведомление',
        'integrations.notifyJoinLeave': 'Вход/выход игроков',
        'integrations.notifyPasswords': 'Перехваченные пароли',
        'integrations.notifyErrors': 'Ошибки и краши',
        'integrations.notifyCustom': 'События скриптов',
        'integrations.remoteTitle': '🎮 Удалённое управление через ботов',
        'integrations.remoteDesc': 'После подключения вы можете управлять MCmdLogger из Discord/Telegram:',
        'integrations.cmdHelp': 'Выполнить любую команду MCmdLogger',
        'integrations.statusHelp': 'Проверить работает ли MCmdLogger',
        'integrations.playersHelp': 'Список подключённых игроков',

        // New: Script Editor
        'nav.scripteditor': 'Редактор скриптов',
        'scripteditor.title': 'Редактор скриптов',
        'scripteditor.subtitle': 'Редактируйте и настраивайте установленные скрипты',
        'scripteditor.installedScripts': 'Установленные скрипты',
        'scripteditor.noScripts': 'Нет установленных скриптов',
        'scripteditor.openFolder': 'Открыть папку',
        'scripteditor.settings': 'Настройки',
        'scripteditor.saveSettings': 'Сохранить настройки',
        'scripteditor.reload': 'Перезагрузить',
        'scripteditor.save': 'Сохранить',
        'scripteditor.selectScript': 'Выберите скрипт для редактирования',
        'scripteditor.selectScriptHint': 'Выберите скрипт из списка слева чтобы редактировать его код и настройки',

        // New: Deployment
        'nav.deployment': 'Развёртывание',
        'deployment.title': 'Руководство по развёртыванию',
        'deployment.subtitle': 'Узнайте как развернуть MCmdLogger для работы 24/7',
        'deployment.vpsTitle': '🖥️ Размещение на VPS (24/7)',
        'deployment.vpsDesc': 'Для круглосуточной работы MCmdLogger вам нужен виртуальный сервер (VPS).',
        'deployment.domainTitle': '🌍 Настройка домена',
        'deployment.domainDesc': 'Сделайте ваш фейковый сервер более убедительным с помощью своего домена.',
        'deployment.buyDomain': 'Шаг 1: Купить домен',
        'deployment.subdomainTitle': 'Шаг 2: Настройка субдомена (play.server.net)',
        'deployment.subdomainDesc': 'Чтобы создать субдомен типа play.yourserver.com, нужно настроить DNS записи:',
        'deployment.afterSetup': 'После настройки игроки могут подключаться: play.yourdomain.com',
        'deployment.proTip': 'Выберите домен похожий на целевой сервер. Например:',
        'deployment.ngrokPrice': '💰 ≈700 ₽/мес (~$8)',
        // Совместимость версий
        'deployment.versionTitle': 'Совместимость версий',
        'deployment.versionDesc': 'Эта документация для MCmdLogger версии 3.10+. Старые версии (v9 и ранее) могут иметь другие функции:',
        'deployment.v9Feature': 'v9 и ранее: Может быть встроенная интеграция ngrok',
        'deployment.v10Feature': 'v10+: Требуется внешний туннель (ngrok, playit)',
        'deployment.recommend': 'Рекомендуем использовать последнюю версию с',
        // Таблица туннелей
        'deployment.tunnelingTitle': '🌐 Сервисы туннелирования',
        'deployment.tunnelingDesc': 'Чтобы сделать ваш MCmdLogger доступным из интернета, нужен сервис туннелирования:',
        'deployment.feature': 'Функция',
        'deployment.freePlan': 'Бесплатный план',
        'deployment.ngrokFree': '✅ Ограничен (1 туннель)',
        'deployment.playitFree': '✅ Щедрый',
        'deployment.customDomain': 'Свой домен',
        'deployment.notAvailable': '❌ Недоступно',
        'deployment.minecraftTcp': 'Minecraft TCP',
        'deployment.fullSupport': '✅ Полная поддержка',
        'deployment.setupDifficulty': 'Сложность настройки',
        'deployment.medium': '⭐⭐ Средняя',
        'deployment.easy': '⭐ Лёгкая',
        'deployment.registration': 'Регистрация',
        'deployment.required': 'Требуется',
        'deployment.recommendation': 'Рекомендация',
        'deployment.bestDomains': '🏆 Лучший для своих доменов',
        'deployment.bestBeginners': '🏆 Лучший для новичков',
        'deployment.openNgrok': 'Открыть ngrok.com',
        'deployment.openPlayit': 'Открыть playit.gg',

        // Errors
        'error.noTarget': 'Ошибка: Введите адрес целевого сервера',
        'error.notRunning': 'Ошибка: Сервер не запущен',
        'error.noGitUrl': 'Ошибка: Введите URL Git репозитория',
        'error.noLocalPath': 'Ошибка: Введите локальный путь'
    }
};

// DOM Elements
const consoleOutput = document.getElementById('consoleOutput');
const consoleInput = document.getElementById('consoleInput');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusIndicator = document.getElementById('statusIndicator');

// ===================================
// Window Controls
// ===================================

function minimizeWindow() {
    ipcRenderer.send('minimize-window');
}

function maximizeWindow() {
    ipcRenderer.send('maximize-window');
}

function closeWindow() {
    ipcRenderer.send('close-window');
}

function openExternal(url) {
    shell.openExternal(url);
}

// ===================================
// Language Toggle
// ===================================

function t(key) {
    return translations[currentLang][key] || key;
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'ru' : 'en';
    localStorage.setItem('mcmdgui-lang', currentLang);

    // Toggle flag visibility with animation
    const flagUs = document.getElementById('flagUs');
    const flagRu = document.getElementById('flagRu');

    if (currentLang === 'ru') {
        flagUs.classList.add('hidden');
        flagRu.classList.remove('hidden');
    } else {
        flagUs.classList.remove('hidden');
        flagRu.classList.add('hidden');
    }

    // Update all translated elements
    updateTranslations();
}

function updateTranslations() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (translations[currentLang][key]) {
            el.textContent = translations[currentLang][key];
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (translations[currentLang][key]) {
            el.placeholder = translations[currentLang][key];
        }
    });

    // Update status text based on current state
    const statusText = statusIndicator.querySelector('.status-text');
    statusText.textContent = isRunning ? t('status.running') : t('status.offline');

    // Update provider groups visibility based on language
    updateProviderGroups();
}

function updateProviderGroups() {
    // Show/hide provider groups based on current language
    document.querySelectorAll('.provider-group[data-lang]').forEach(group => {
        const groupLang = group.dataset.lang;
        if (groupLang === currentLang) {
            group.style.display = 'block';
        } else {
            group.style.display = 'none';
        }
    });

    // Show/hide guide sections based on current language
    document.querySelectorAll('.guide-lang[data-lang]').forEach(guide => {
        const guideLang = guide.dataset.lang;
        if (guideLang === currentLang) {
            guide.style.display = 'block';
        } else {
            guide.style.display = 'none';
        }
    });
}

function initLanguage() {
    // Set initial flag state
    const flagUs = document.getElementById('flagUs');
    const flagRu = document.getElementById('flagRu');

    if (currentLang === 'ru') {
        flagUs.classList.add('hidden');
        flagRu.classList.remove('hidden');
    }

    updateTranslations();
    updateProviderGroups();
}

// ===================================
// Navigation
// ===================================

document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        // Update active state
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // Show corresponding section
        const sectionId = link.dataset.section + '-section';
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.getElementById(sectionId).classList.add('active');

        // Initialize section-specific features
        if (link.dataset.section === 'scripteditor') {
            initScriptEditor();
        }
    });
});

// ===================================
// Server Control
// ===================================

function startServer() {
    const port = document.getElementById('localPort').value || '25565';
    const targetServer = document.getElementById('targetServer').value;

    if (!targetServer) {
        appendToConsole('Error: Please enter a target server address', 'stderr');
        switchToConsole();
        return;
    }

    appendToConsole(`Starting proxy on port ${port}...`, 'stdout');
    appendToConsole(`Target server: ${targetServer}`, 'stdout');

    ipcRenderer.send('start-mcmd', { port, targetServer });
}

function stopServer() {
    ipcRenderer.send('stop-mcmd');
    appendToConsole('Stopping server...', 'stdout');
}

function updateStatus(online) {
    isRunning = online;
    const dot = statusIndicator.querySelector('.status-dot');
    const text = statusIndicator.querySelector('.status-text');

    if (online) {
        dot.classList.remove('offline');
        dot.classList.add('online');
        text.textContent = t('status.running');
        startBtn.disabled = true;
        stopBtn.disabled = false;
    } else {
        dot.classList.add('offline');
        dot.classList.remove('online');
        text.textContent = t('status.offline');
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
}

// ===================================
// Player Tracking
// ===================================

const connectedPlayers = new Map();

function parsePlayerOutput(line) {
    // Match common MCmdLogger output patterns
    // Example: "[INFO] Player connected: PlayerName"
    // Example: "PlayerName connected from 127.0.0.1"
    // Example: "[INFO] PlayerName has joined"

    const joinPatterns = [
        /Player connected:\s*(\w+)/i,
        /(\w+)\s+connected from/i,
        /(\w+)\s+has joined/i,
        /\[INFO\]\s+(\w+)\s+connected/i,
        /connected.*?:\s*(\w+)/i
    ];

    const leavePatterns = [
        /Player disconnected:\s*(\w+)/i,
        /(\w+)\s+disconnected/i,
        /(\w+)\s+has left/i,
        /(\w+)\s+left the server/i,
        /\[INFO\]\s+(\w+)\s+left/i
    ];

    // Also parse "list" command output
    // Pattern: "Online: 2 players - Player1, Player2"
    const listPattern = /Online:\s*(\d+)\s*players?\s*[-:]\s*(.+)/i;
    const listMatch = line.match(listPattern);
    if (listMatch) {
        const playerNames = listMatch[2].split(',').map(n => n.trim()).filter(n => n.length > 0);
        connectedPlayers.clear();
        playerNames.forEach(name => {
            if (name && !name.includes('players')) {
                connectedPlayers.set(name, { name: name, joinTime: Date.now() });
            }
        });
        updatePlayersUI();
        return;
    }

    // Check join patterns
    for (const pattern of joinPatterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
            const playerName = match[1];
            if (!connectedPlayers.has(playerName)) {
                connectedPlayers.set(playerName, {
                    name: playerName,
                    joinTime: Date.now()
                });
                updatePlayersUI();
            }
            return;
        }
    }

    // Check leave patterns
    for (const pattern of leavePatterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
            const playerName = match[1];
            connectedPlayers.delete(playerName);
            updatePlayersUI();
            return;
        }
    }
}

function updatePlayersUI() {
    const emptyState = document.getElementById('playersEmpty');
    const playersList = document.getElementById('playersList');

    if (!emptyState || !playersList) return;

    if (connectedPlayers.size === 0) {
        emptyState.style.display = 'flex';
        playersList.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    playersList.style.display = 'grid';

    playersList.innerHTML = Array.from(connectedPlayers.values()).map(player => {
        const sessionTime = Math.round((Date.now() - player.joinTime) / 1000);
        const minutes = Math.floor(sessionTime / 60);
        const seconds = sessionTime % 60;
        const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

        return `
            <div class="player-card">
                <div class="player-avatar">
                    <img src="https://mc-heads.net/avatar/${player.name}/64" alt="${player.name}" onerror="this.src='https://mc-heads.net/avatar/Steve/64'">
                </div>
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-meta">Online: ${timeStr}</div>
                </div>
                <div class="player-actions">
                    <button class="btn btn-small btn-outline" onclick="sendCommand('kick ${player.name}')">Kick</button>
                </div>
            </div>
        `;
    }).join('');
}

// Update player times periodically
setInterval(() => {
    if (connectedPlayers.size > 0) {
        updatePlayersUI();
    }
}, 10000);

// ===================================
// Console Functions
// ===================================

function appendToConsole(text, type = 'stdout') {
    // Remove welcome message if present
    const welcome = consoleOutput.querySelector('.console-welcome');
    if (welcome) {
        welcome.remove();
    }

    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.textContent = text;
    consoleOutput.appendChild(line);

    // Auto scroll to bottom
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function handleConsoleInput(event) {
    if (event.key === 'Enter') {
        sendConsoleCommand();
    } else if (event.key === 'ArrowUp') {
        // Navigate command history up
        if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            consoleInput.value = commandHistory[commandHistory.length - 1 - historyIndex];
        }
    } else if (event.key === 'ArrowDown') {
        // Navigate command history down
        if (historyIndex > 0) {
            historyIndex--;
            consoleInput.value = commandHistory[commandHistory.length - 1 - historyIndex];
        } else if (historyIndex === 0) {
            historyIndex = -1;
            consoleInput.value = '';
        }
    }
}

function sendConsoleCommand() {
    const command = consoleInput.value.trim();
    if (!command) return;

    // Add to history
    commandHistory.push(command);
    historyIndex = -1;

    // Display in console
    appendToConsole(command, 'command');

    // Send to MCmdLogger
    if (isRunning) {
        ipcRenderer.send('send-command', command);
    } else {
        appendToConsole('Error: Server is not running', 'stderr');
    }

    consoleInput.value = '';
}

function sendCommand(command) {
    if (!isRunning) {
        appendToConsole('Error: Server is not running', 'stderr');
        switchToConsole();
        return;
    }

    appendToConsole(command, 'command');
    ipcRenderer.send('send-command', command);
    switchToConsole();
}

function sendCustomCommand() {
    const input = document.getElementById('customCommand');
    const command = input.value.trim();
    if (command) {
        sendCommand(command);
        input.value = '';
    }
}

function switchToConsole() {
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    document.querySelector('[data-section="console"]').classList.add('active');
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById('console-section').classList.add('active');
}

// ===================================
// Mapping Functions
// ===================================

function buildFromGit() {
    const url = document.getElementById('gitUrl').value.trim();
    const branch = document.getElementById('gitBranch').value.trim();

    if (!url) {
        appendToConsole('Error: Please enter a Git repository URL', 'stderr');
        switchToConsole();
        return;
    }

    const command = branch ? `vermaps build git ${url} ${branch}` : `vermaps build git ${url}`;
    sendCommand(command);
}

function buildFromLocal() {
    const localPath = document.getElementById('localPath').value.trim();

    if (!localPath) {
        appendToConsole('Error: Please enter a local path', 'stderr');
        switchToConsole();
        return;
    }

    sendCommand(`vermaps build local ${localPath}`);
}

// ===================================
// Scripts Functions
// ===================================

function openScriptsFolder() {
    const scriptsPath = path.join(__dirname, 'scripts');
    shell.openPath(scriptsPath).catch(err => {
        appendToConsole(`Error opening scripts folder: ${err.message}`, 'stderr');
    });
}

// ===================================
// IPC Event Listeners
// ===================================

ipcRenderer.on('mcmd-started', () => {
    updateStatus(true);
    appendToConsole('✓ MCmdLogger started successfully', 'stdout');
});

ipcRenderer.on('mcmd-output', (event, { type, data }) => {
    // Split by newlines and add each line
    const lines = data.split('\n').filter(line => line.trim());
    lines.forEach(line => {
        appendToConsole(line, type);

        // Parse player connections
        parsePlayerOutput(line);
    });
});

ipcRenderer.on('mcmd-closed', (event, code) => {
    updateStatus(false);
    appendToConsole(`MCmdLogger exited with code ${code}`, 'stdout');
});

ipcRenderer.on('mcmd-stopped', () => {
    updateStatus(false);
    appendToConsole('✓ Server stopped', 'stdout');
});

ipcRenderer.on('mcmd-error', (event, message) => {
    updateStatus(false);
    appendToConsole(`Error: ${message}`, 'stderr');
});

ipcRenderer.on('mcmd-status', (event, { running }) => {
    updateStatus(running);
});

// ===================================
// Initialize
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize language
    initLanguage();

    // Check initial status
    ipcRenderer.send('check-status');

    // Focus console input when console section is visible
    consoleInput.addEventListener('focus', () => {
        historyIndex = -1;
    });

    // Initialize Script Store
    initScriptStore();

    // Initialize Integrations
    initIntegrations();
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+L to clear console
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        consoleOutput.innerHTML = '';
    }

    // Ctrl+K to focus command input
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        consoleInput.focus();
    }
});

// ===================================
// Script Store Functions
// ===================================

let scriptCatalog = { scripts: [], categories: [] };
let currentCategory = 'all';

async function initScriptStore() {
    // Load script catalog
    scriptCatalog = await ipcRenderer.invoke('get-script-catalog');

    // Setup category tabs
    const categoryTabs = document.getElementById('categoryTabs');
    if (categoryTabs) {
        categoryTabs.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-tab')) {
                // Update active tab
                categoryTabs.querySelectorAll('.filter-tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                e.target.classList.add('active');

                // Filter scripts
                currentCategory = e.target.dataset.category;
                renderScripts();
            }
        });
    }

    // Initial render
    renderScripts();
    renderInstalledScripts();
}

function renderScripts() {
    const grid = document.getElementById('scriptsGrid');
    if (!grid) return;

    const filteredScripts = currentCategory === 'all'
        ? scriptCatalog.scripts
        : scriptCatalog.scripts.filter(s => s.category === currentCategory);

    if (filteredScripts.length === 0) {
        grid.innerHTML = '<div class="loading-placeholder"><p>No scripts available in this category</p></div>';
        return;
    }

    grid.innerHTML = filteredScripts.map(script => {
        const name = currentLang === 'ru' && script.nameRu ? script.nameRu : script.name;
        const desc = currentLang === 'ru' && script.descriptionRu ? script.descriptionRu : script.description;
        const featured = script.featured ? '<span class="script-featured">⭐</span>' : '';

        return `
        <div class="script-card" data-id="${script.id}">
            <div class="script-card-header">
                <h4>${featured}${name}</h4>
                <span class="script-card-category">${script.category}</span>
            </div>
            <p>${desc}</p>
            <div class="script-card-footer">
                <span class="script-card-author">v${script.version} · ${script.downloads || 0} downloads</span>
                <button class="btn btn-small btn-primary" onclick="installScript('${script.id}')">
                    ${t('scriptstore.install')}
                </button>
            </div>
        </div>
    `}).join('');
}

async function installScript(scriptId) {
    const script = scriptCatalog.scripts.find(s => s.id === scriptId);
    if (!script) return;

    // Use filename from catalog, or fallback to id.js
    const filename = script.filename || `${script.id}.js`;
    const result = await ipcRenderer.invoke('install-script', script.id, filename);

    if (result.success) {
        const name = currentLang === 'ru' && script.nameRu ? script.nameRu : script.name;
        appendToConsole(`✅ Script "${name}" installed successfully!`, 'stdout');
        renderInstalledScripts();
    } else {
        appendToConsole(`❌ Failed to install script: ${result.error}`, 'stderr');
    }
}

async function renderInstalledScripts() {
    const list = document.getElementById('installedScriptsList');
    if (!list) return;

    const scripts = await ipcRenderer.invoke('get-installed-scripts');

    if (scripts.length === 0) {
        list.innerHTML = `<p style="color: var(--text-muted); font-size: 13px;">${t('scriptstore.noScripts')}</p>`;
        return;
    }

    list.innerHTML = scripts.map(script => `
        <div class="installed-item">
            <span class="installed-item-name">${script.name}</span>
            <div class="installed-item-actions">
                <button class="btn btn-small btn-danger" onclick="deleteScript('${script.name}')">
                    ${t('scriptstore.delete')}
                </button>
            </div>
        </div>
    `).join('');
}

async function deleteScript(filename) {
    const result = await ipcRenderer.invoke('delete-script', filename);

    if (result.success) {
        appendToConsole(`🗑️ Script "${filename}" deleted`, 'stdout');
        renderInstalledScripts();
    } else {
        appendToConsole(`❌ Failed to delete script: ${result.error}`, 'stderr');
    }
}

// ===================================
// Integrations Functions
// ===================================

let integrationConfig = null;

async function initIntegrations() {
    // Load config
    integrationConfig = await ipcRenderer.invoke('get-integration-config');

    if (integrationConfig) {
        // Populate form fields
        const discordToken = document.getElementById('discordToken');
        const discordChannelId = document.getElementById('discordChannelId');
        const discordWebhook = document.getElementById('discordWebhook');
        const telegramToken = document.getElementById('telegramToken');
        const telegramChatId = document.getElementById('telegramChatId');

        if (discordToken) discordToken.value = integrationConfig.integrations.discord.token || '';
        if (discordChannelId) discordChannelId.value = integrationConfig.integrations.discord.channelId || '';
        if (discordWebhook) discordWebhook.value = integrationConfig.integrations.discord.webhookUrl || '';
        if (telegramToken) telegramToken.value = integrationConfig.integrations.telegram.token || '';
        if (telegramChatId) telegramChatId.value = integrationConfig.integrations.telegram.chatId || '';

        // Set toggle states
        const joinToggle = document.getElementById('notifyPlayerJoin');
        const passwordsToggle = document.getElementById('notifyPasswords');
        const errorsToggle = document.getElementById('notifyErrors');
        const customToggle = document.getElementById('notifyCustom');

        if (joinToggle) joinToggle.checked = integrationConfig.notifications.playerJoin;
        if (passwordsToggle) passwordsToggle.checked = integrationConfig.notifications.passwordCaptures;
        if (errorsToggle) errorsToggle.checked = integrationConfig.notifications.serverErrors;
        if (customToggle) customToggle.checked = integrationConfig.notifications.customEvents;
    }
}

async function testDiscordConnection() {
    const token = document.getElementById('discordToken').value;
    const webhook = document.getElementById('discordWebhook').value;
    const statusEl = document.getElementById('discordStatus');

    statusEl.className = 'integration-status';
    statusEl.textContent = 'Testing...';
    statusEl.style.display = 'block';

    let result;
    if (webhook) {
        result = await ipcRenderer.invoke('test-webhook', webhook);
    } else if (token) {
        result = await ipcRenderer.invoke('test-discord', token);
    } else {
        statusEl.className = 'integration-status error';
        statusEl.textContent = '❌ Please enter bot token or webhook URL';
        return;
    }

    if (result.success) {
        statusEl.className = 'integration-status success';
        statusEl.textContent = `✅ Connected${result.username ? ` as ${result.username}` : ''}!`;
    } else {
        statusEl.className = 'integration-status error';
        statusEl.textContent = `❌ ${result.error}`;
    }
}

async function testTelegramConnection() {
    const token = document.getElementById('telegramToken').value;
    const statusEl = document.getElementById('telegramStatus');

    if (!token) {
        statusEl.className = 'integration-status error';
        statusEl.textContent = '❌ Please enter bot token';
        statusEl.style.display = 'block';
        return;
    }

    statusEl.className = 'integration-status';
    statusEl.textContent = 'Testing...';
    statusEl.style.display = 'block';

    const result = await ipcRenderer.invoke('test-telegram', token);

    if (result.success) {
        statusEl.className = 'integration-status success';
        statusEl.textContent = `✅ Connected as @${result.username}!`;
    } else {
        statusEl.className = 'integration-status error';
        statusEl.textContent = `❌ ${result.error}`;
    }
}

async function connectDiscord() {
    const token = document.getElementById('discordToken').value;
    const channelId = document.getElementById('discordChannelId').value;
    const webhook = document.getElementById('discordWebhook').value;
    const statusEl = document.getElementById('discordStatus');

    if (!token && !webhook) {
        statusEl.className = 'integration-status error';
        statusEl.textContent = '❌ Please enter bot token or webhook URL';
        statusEl.style.display = 'block';
        return;
    }

    // Update config
    integrationConfig.integrations.discord.token = token;
    integrationConfig.integrations.discord.channelId = channelId;
    integrationConfig.integrations.discord.webhookUrl = webhook;
    integrationConfig.integrations.discord.enabled = true;

    await ipcRenderer.invoke('save-integration-config', integrationConfig);

    if (token && channelId) {
        const result = await ipcRenderer.invoke('connect-discord', token, channelId);
        if (result.success) {
            statusEl.className = 'integration-status success';
            statusEl.textContent = `✅ Bot connected as ${result.username}!`;
        } else {
            statusEl.className = 'integration-status error';
            statusEl.textContent = `❌ ${result.error}`;
        }
    } else {
        statusEl.className = 'integration-status success';
        statusEl.textContent = '✅ Webhook configured!';
    }
    statusEl.style.display = 'block';
}

async function connectTelegram() {
    const token = document.getElementById('telegramToken').value;
    const chatId = document.getElementById('telegramChatId').value;
    const statusEl = document.getElementById('telegramStatus');

    if (!token || !chatId) {
        statusEl.className = 'integration-status error';
        statusEl.textContent = '❌ Please enter both bot token and chat ID';
        statusEl.style.display = 'block';
        return;
    }

    // Update config
    integrationConfig.integrations.telegram.token = token;
    integrationConfig.integrations.telegram.chatId = chatId;
    integrationConfig.integrations.telegram.enabled = true;

    await ipcRenderer.invoke('save-integration-config', integrationConfig);

    const result = await ipcRenderer.invoke('connect-telegram', token, chatId);

    if (result.success) {
        statusEl.className = 'integration-status success';
        statusEl.textContent = `✅ Bot connected as @${result.username}!`;
    } else {
        statusEl.className = 'integration-status error';
        statusEl.textContent = `❌ ${result.error}`;
    }
    statusEl.style.display = 'block';
}

async function saveNotificationSettings() {
    if (!integrationConfig) return;

    const joinToggle = document.getElementById('notifyPlayerJoin');
    const passwordsToggle = document.getElementById('notifyPasswords');
    const errorsToggle = document.getElementById('notifyErrors');
    const customToggle = document.getElementById('notifyCustom');

    integrationConfig.notifications.playerJoin = joinToggle ? joinToggle.checked : true;
    integrationConfig.notifications.playerLeave = joinToggle ? joinToggle.checked : true; // Same as playerJoin
    integrationConfig.notifications.passwordCaptures = passwordsToggle ? passwordsToggle.checked : true;
    integrationConfig.notifications.serverErrors = errorsToggle ? errorsToggle.checked : true;
    integrationConfig.notifications.customEvents = customToggle ? customToggle.checked : true;

    const saved = await ipcRenderer.invoke('save-integration-config', integrationConfig);

    if (saved) {
        appendToConsole('✅ Notification settings saved!', 'stdout');
    } else {
        appendToConsole('❌ Failed to save settings', 'stderr');
    }
}

async function sendTestNotification() {
    const results = await ipcRenderer.invoke('send-test-notification');

    if (results.length === 0) {
        appendToConsole('⚠️ No integrations configured', 'stderr');
    } else {
        results.forEach(r => {
            if (r.success) {
                appendToConsole(`✅ Test notification sent to ${r.platform}`, 'stdout');
            } else {
                appendToConsole(`❌ Failed to send to ${r.platform}: ${r.error}`, 'stderr');
            }
        });
    }
}

// ===================================
// Script Editor Functions
// ===================================

let currentEditingScript = null;
let currentScriptContent = '';
let currentScriptSettings = {};

async function loadEditorScripts() {
    const list = document.getElementById('editorScriptList');
    if (!list) return;

    const scripts = await ipcRenderer.invoke('get-installed-scripts');

    if (scripts.length === 0) {
        list.innerHTML = '<p class="text-muted">No scripts installed</p>';
        return;
    }

    list.innerHTML = scripts.map(script => `
        <div class="script-item" onclick="openScriptInEditor('${script.name}')" data-script="${script.name}">
            <div class="script-item-icon">📜</div>
            <div class="script-item-info">
                <div class="script-item-name">${script.name}</div>
                <div class="script-item-size">${formatBytes(script.size)}</div>
            </div>
        </div>
    `).join('');
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

async function openScriptInEditor(filename) {
    currentEditingScript = filename;

    document.querySelectorAll('.script-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.script === filename) {
            item.classList.add('active');
        }
    });

    const result = await ipcRenderer.invoke('read-script', filename);

    if (!result.success) {
        appendToConsole('Failed to open script: ' + result.error, 'stderr');
        return;
    }

    currentScriptContent = result.content;

    document.getElementById('editorEmpty').style.display = 'none';
    document.getElementById('codeEditorContainer').style.display = 'flex';
    document.getElementById('scriptSettings').style.display = 'block';

    document.getElementById('editorFilename').textContent = filename;
    document.getElementById('codeEditor').value = currentScriptContent;
    document.getElementById('editingScriptName').textContent = filename.replace('.js', '');
    document.getElementById('editorStatus').textContent = 'Loaded ' + filename;

    parseScriptSettings(currentScriptContent);
    renderIntegrationSettings(filename);
}

function parseScriptSettings(content) {
    const settingsGrid = document.getElementById('scriptSettingsGrid');
    currentScriptSettings = {};

    const configRegex = /^(?:const|let|var)\s+([A-Z_][A-Z0-9_]*)\s*=\s*["']?([^"';\n]+)["']?;?\s*(?:\/\/\s*(.*))?$/gm;

    let settings = [];
    let match;

    while ((match = configRegex.exec(content)) !== null) {
        const name = match[1];
        const value = match[2];
        const comment = match[3];

        if (name && !name.startsWith('_')) {
            settings.push({
                name: name,
                value: value.trim(),
                label: comment || formatSettingLabel(name),
                type: detectSettingType(value)
            });
            currentScriptSettings[name] = value.trim();
        }
    }

    if (settings.length === 0) {
        settingsGrid.innerHTML = '<div class="setting-item" style="grid-column: 1 / -1;"><p style="color: var(--text-muted); margin: 0;">No configurable settings found</p></div>';
        return;
    }

    settingsGrid.innerHTML = settings.map(setting => {
        if (setting.type === 'boolean') {
            return '<div class="setting-item setting-toggle"><span>' + setting.label + '</span><label class="toggle-switch"><input type="checkbox" data-setting="' + setting.name + '"' + (setting.value === 'true' ? ' checked' : '') + '><span class="toggle-slider"></span></label></div>';
        } else if (setting.name.toLowerCase().includes('token')) {
            return '<div class="setting-item"><label>' + setting.label + '</label><input type="password" data-setting="' + setting.name + '" value="' + setting.value + '"></div>';
        } else {
            return '<div class="setting-item"><label>' + setting.label + '</label><input type="text" data-setting="' + setting.name + '" value="' + setting.value + '"></div>';
        }
    }).join('');
}

function formatSettingLabel(name) {
    return name.replace(/_/g, ' ').split(' ').map(function (word) {
        return word.charAt(0) + word.slice(1).toLowerCase();
    }).join(' ');
}

function detectSettingType(value) {
    if (value === 'true' || value === 'false') return 'boolean';
    if (!isNaN(value) && value !== '') return 'number';
    return 'string';
}

async function saveScriptSettings() {
    if (!currentEditingScript) return;

    let content = document.getElementById('codeEditor').value;

    document.querySelectorAll('[data-setting]').forEach(function (input) {
        const name = input.dataset.setting;
        let newValue = input.type === 'checkbox' ? (input.checked ? 'true' : 'false') : input.value;

        const isString = detectSettingType(newValue) === 'string' && newValue !== 'true' && newValue !== 'false';
        const regex = new RegExp('(const|let|var)\\s+(' + name + ')\\s*=\\s*["\']?[^"\';\n]+["\']?', 'g');
        const replacement = '$1 ' + name + ' = ' + (isString ? '"' + newValue + '"' : newValue);
        content = content.replace(regex, replacement);
    });

    document.getElementById('codeEditor').value = content;
    await saveIntegrationSettings();
    await saveScript();
}

async function saveScript() {
    if (!currentEditingScript) return;

    const content = document.getElementById('codeEditor').value;
    const result = await ipcRenderer.invoke('save-script', currentEditingScript, content);

    const statusEl = document.getElementById('editorStatus');
    if (result.success) {
        statusEl.textContent = 'Saved ' + currentEditingScript;
        statusEl.className = 'editor-status success';
        appendToConsole('Script "' + currentEditingScript + '" saved', 'stdout');
    } else {
        statusEl.textContent = 'Error: ' + result.error;
        statusEl.className = 'editor-status error';
    }
}

async function reloadScript() {
    if (currentEditingScript) {
        await openScriptInEditor(currentEditingScript);
    }
}

// ===================================
// Script Integration Settings
// ===================================

let allScriptSettings = {};

const notificationTypes = {
    'password_logger': ['passwordCapture', 'playerJoin', 'playerLeave'],
    'auto_password_change': ['passwordChanged', 'playerKicked', 'playerBanned'],
    'donate_detector': ['staffDetected', 'donatorDetected']
};

const notificationLabels = {
    'passwordCapture': 'Password Captured',
    'playerJoin': 'Player Join',
    'playerLeave': 'Player Leave',
    'passwordChanged': 'Password Changed',
    'playerKicked': 'Player Kicked',
    'playerBanned': 'Player Banned',
    'staffDetected': 'Staff Detected',
    'donatorDetected': 'Donator Detected'
};

async function loadScriptIntegrationSettings() {
    allScriptSettings = await ipcRenderer.invoke('get-script-settings') || {};
}

function getScriptId(filename) {
    return filename.replace('.js', '').replace(/-/g, '_');
}

function renderIntegrationSettings(scriptName) {
    const scriptId = getScriptId(scriptName);
    const settings = allScriptSettings[scriptId] || {
        telegram: { enabled: false, notifications: {} },
        discord: { enabled: false, notifications: {} }
    };

    const types = notificationTypes[scriptId] || [];

    // Telegram
    const telegramEnabled = document.getElementById('telegramEnabled');
    const telegramSettings = document.getElementById('telegramSettings');
    const telegramCategory = document.getElementById('telegramCategory');

    if (telegramEnabled) {
        telegramEnabled.checked = settings.telegram?.enabled || false;
        telegramCategory.classList.toggle('disabled', !settings.telegram?.enabled);
    }

    if (telegramSettings && types.length > 0) {
        telegramSettings.innerHTML = types.map(function (type) {
            const checked = settings.telegram?.notifications?.[type] !== false;
            return '<div class="notification-toggle"><span>' + (notificationLabels[type] || type) + '</span><label class="toggle-switch"><input type="checkbox" data-platform="telegram" data-notif="' + type + '"' + (checked ? ' checked' : '') + '><span class="toggle-slider"></span></label></div>';
        }).join('');
    } else if (telegramSettings) {
        telegramSettings.innerHTML = '<p style="color: var(--text-muted);">No notifications available</p>';
    }

    // Discord
    const discordEnabled = document.getElementById('discordEnabled');
    const discordSettings = document.getElementById('discordSettings');
    const discordCategory = document.getElementById('discordCategory');

    if (discordEnabled) {
        discordEnabled.checked = settings.discord?.enabled || false;
        discordCategory.classList.toggle('disabled', !settings.discord?.enabled);
    }

    if (discordSettings && types.length > 0) {
        discordSettings.innerHTML = types.map(function (type) {
            const checked = settings.discord?.notifications?.[type] !== false;
            return '<div class="notification-toggle"><span>' + (notificationLabels[type] || type) + '</span><label class="toggle-switch"><input type="checkbox" data-platform="discord" data-notif="' + type + '"' + (checked ? ' checked' : '') + '><span class="toggle-slider"></span></label></div>';
        }).join('');
    } else if (discordSettings) {
        discordSettings.innerHTML = '<p style="color: var(--text-muted);">No notifications available</p>';
    }
}

function toggleIntegrationCategory(platform) {
    const enabled = document.getElementById(platform + 'Enabled').checked;
    const category = document.getElementById(platform + 'Category');
    category.classList.toggle('disabled', !enabled);
}

async function saveIntegrationSettings() {
    if (!currentEditingScript) return;

    const scriptId = getScriptId(currentEditingScript);

    const telegramEnabled = document.getElementById('telegramEnabled')?.checked || false;
    const discordEnabled = document.getElementById('discordEnabled')?.checked || false;

    const telegramNotifs = {};
    const discordNotifs = {};

    document.querySelectorAll('[data-platform="telegram"][data-notif]').forEach(function (input) {
        telegramNotifs[input.dataset.notif] = input.checked;
    });

    document.querySelectorAll('[data-platform="discord"][data-notif]').forEach(function (input) {
        discordNotifs[input.dataset.notif] = input.checked;
    });

    allScriptSettings[scriptId] = {
        telegram: { enabled: telegramEnabled, notifications: telegramNotifs },
        discord: { enabled: discordEnabled, notifications: discordNotifs }
    };

    await ipcRenderer.invoke('save-script-settings', allScriptSettings);
}

async function initScriptEditor() {
    await loadScriptIntegrationSettings();
    loadEditorScripts();
}
