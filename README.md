# Finance — персональный учёт финансов

Веб-приложение для учёта доходов, расходов, копилок и кредитов. Дашборд с графиками, детальная аналитика, режим скрытия сумм. Данные хранятся локально в SQLite.

## Возможности

### Операции
- Добавление доходов и расходов с категорией, датой и комментарием
- Список всех операций с поиском, фильтрами по категории и дате, сортировкой
- Редактирование и удаление записей

### Дашборд
- Карточки: доходы, расходы, накопления в копилках, **свободный остаток**, число операций
- Графики: расходы по категориям, по дням, динамика доходов и расходов по месяцам
- Последние операции и блок копилок (карточки целей в столбец)
- Рекомендации на основе статистики (рост категорий, копилки, кредиты)

### Копилки и кредиты
- **Копилка** — цель накопления с прогресс-баром и рекомендуемым взносом в месяц
- **Кредит** — учёт долга, ставка, расчёт рекомендуемого платежа (аннуитет)
- Пополнение копилки или платёж по кредиту через отдельный раздел (не через обычные расходы)
- Поле «Уже накоплено» при создании копилки — начальный баланс, не списывается из свободного остатка

### Аналитика
- Средний расход в день и в месяц
- Сравнение месяцев, накопленная статистика
- Топ категорий, рост и снижение трат
- Самые крупные покупки

### Интерфейс
- Светлая и тёмная тема
- **Скрыть суммы** — размытие всех денежных значений (удобно для демонстрации экрана)
- Адаптивная вёрстка (десктоп и мобильные)
- Выбор месяца на дашборде, глобальный поиск (Ctrl+K), быстрое добавление (FAB и клавиша N)
- Онбординг при первом запуске

### Бюджеты и автоматизация
- Лимиты расходов по категориям на месяц
- Повторяющиеся операции (автоматически в указанный день месяца)
- Напоминания о платежах по кредитам
- Подсказка в конце месяца по свободному остатку

### Данные
- Экспорт / импорт JSON (резервная копия)
- Импорт операций из банковского CSV
- Дублирование операций
- Архивация копилок и целей

## Логика расчётов

| Показатель | Формула |
|------------|---------|
| Расходы за месяц | Обычные траты **без** категорий «Копилка», «Накопления», «Сбережения», «Кредит» |
| Свободный остаток | Доходы − расходы − пополнения копилок − платежи по кредитам |
| Копилки за месяц | Переводы в категориях копилки + пополнения через раздел «Копилки» |
| Кредиты за месяц | Операции в категории «Кредит» + платежи через раздел «Копилки» |

Переводы в копилку и платежи по кредиту **не считаются расходами** в аналитике по категориям, но **уменьшают свободный остаток** — это деньги, которые уже не лежат «в кармане».

## Быстрый старт

**Требования:** Node.js 18+

```bash
# Установка зависимостей (корень + server + client)
npm run install:all

# Запуск backend (:3001) и frontend (:5173)
npm run dev
```

Откройте http://localhost:5173

База данных создаётся автоматически при первом запуске сервера: `server/data/finance.db`

### Сборка production-версии frontend

```bash
npm run build
```

Статика появится в `client/dist/`. Для production «в одном процессе»:

```bash
npm run build
SERVE_CLIENT=true npm run start --prefix server
```

Приложение будет доступно на http://localhost:3001 (API + UI).

## Все платформы

| Платформа | Способ запуска |
|-----------|----------------|
| **Браузер (PWA)** | `npm run dev` → «Установить приложение» в Chrome/Edge/Safari |
| **Windows / macOS / Linux** | Скачать установщик из [GitHub Releases](../../releases) или собрать локально (`npm run bundle:node && npm run tauri:build`) |
| **Docker** | `docker compose up --build` → http://localhost:3001 |
| **iOS / Android** | `npm run cap:sync` → `npm run cap:android` / `cap:ios` (нужны Android Studio / Xcode) |

### Установка одной командой

```bash
# Linux / macOS
./scripts/install.sh

# Windows
.\scripts\install.ps1
```

### Мобильный клиент

На телефоне frontend обращается к серверу по сети. Задайте при сборке клиента:

```env
VITE_API_URL=http://192.168.1.10:3001/api
VITE_API_TOKEN=your-token   # если включён API_TOKEN
```

### Docker

```bash
docker compose up --build -d
```

Данные сохраняются в volume `finance-data` (путь в контейнере: `/data/finance.db`).

Переменная `DB_PATH` задаёт путь к файлу SQLite на хосте или в контейнере.

## Скачать десктопное приложение (GitHub Releases)

При пуше тега `v*` (например `v1.1.6`) GitHub Actions собирает установщики для **Windows, macOS и Linux** и публикует их в **Releases**.

| Платформа | Файл |
|-----------|------|
| Windows 10/11 | `Finance_*_x64-setup.exe` |
| macOS Apple Silicon (M1+) | `Finance_*_aarch64.dmg` |
| macOS Intel | `Finance_*_x64.dmg` |
| Linux Debian/Ubuntu | `finance_*_amd64.deb` |
| Linux (универсально) | `Finance_*_amd64.AppImage` |

### Как выпустить версию

```bash
# Обновите version в package.json / tauri.conf.json при необходимости
git add .
git commit -m "Release v1.1.6"
git tag v1.1.6
git push origin main
git push origin v1.1.6
```

Через 15–30 минут на странице **Releases** появятся все артефакты (4 параллельных job в CI).

### Как скачать пользователю

1. Откройте вкладку **Releases** репозитория на GitHub
2. Выберите последнюю версию
3. Скачайте файл для своей ОС (см. таблицу выше)
4. Установите — приложение работает автономно

**Где хранятся данные:**
- Windows: `%APPDATA%\com.finance.app\`
- macOS: `~/Library/Application Support/com.finance.app/`
- Linux: `~/.local/share/com.finance.app/`

**macOS без подписи Apple:** если система пишет «приложение повреждено», откройте через ПКМ → «Открыть» или выполните в Terminal:
`xattr -cr /Applications/Finance.app`

### Локальная сборка (Windows / macOS / Linux)

Требуется [Rust](https://rustup.rs). На Linux дополнительно:

```bash
sudo apt-get install -y libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev patchelf
```

```bash
npm run install:all
npm run bundle:node          # portable Node в src-tauri/bundle-resources/bin/
npx tauri icon client/public/icon.svg
npm run tauri:build
```

Готовые файлы: `src-tauri/target/release/bundle/` (`nsis/`, `dmg/`, `deb/`, `appimage/`).

**Windows (PowerShell)** — то же самое, `npm run bundle:node` скачает `node.exe` автоматически.

## Конфигурация

Основной файл окружения — `.env` в корне проекта. Опционально можно переопределить значения в `server/.env`.

```env
# Порт API (по умолчанию 3001)
PORT=3001

# Путь к файлу базы данных (по умолчанию server/data/finance.db)
DB_PATH=

# Раздавать собранный frontend с сервера
SERVE_CLIENT=false

# Версия приложения (отображается в API и UI)
APP_VERSION=1.1.0

# Разрешённые origins для CORS (через запятую)
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173

# Опционально: защита API Bearer-токеном
API_TOKEN=your-secret-token

# То же для frontend (если включён API_TOKEN)
VITE_API_TOKEN=your-secret-token

# URL API для мобильного / удалённого клиента (по умолчанию /api — через proxy)
VITE_API_URL=
```

Без `API_TOKEN` API доступен без авторизации — подходит для локального использования.

Проверка сервера: `GET http://localhost:3001/api/health`

## Стек

| Часть | Технологии |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, MUI, Zustand, Recharts, Day.js, React Router |
| Backend | Node.js, Express, better-sqlite3, TypeScript |
| Данные | SQLite (файл на диске, WAL-режим) |

## Структура проекта

```
finance/
├── client/                 # Frontend (Vite + React)
│   └── src/
│       ├── app/            # Роутер, провайдеры, точка входа
│       ├── pages/          # Страницы приложения
│       ├── widgets/        # Дашборд, графики, layout
│       ├── features/       # Формы операций и копилок, таблицы
│       ├── store/          # Zustand (данные, тема, приватность)
│       ├── api/            # HTTP-клиент к backend
│       └── shared/         # UI-компоненты, форматирование
├── server/                 # Backend (Express)
│   └── src/
│       ├── routes/         # REST API
│       ├── services/       # Статистика, копилки, цели
│       ├── config/         # Категории, env
│       ├── db/             # Схема SQLite
│       ├── middleware/     # Auth, rate limit, ошибки
│       └── shared/         # Валидация, мапперы
├── package.json            # Скрипты dev/build для монорепо
└── .env                    # Переменные окружения
```

## API (основное)

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/transactions` | Все операции |
| POST | `/api/transactions` | Создать операцию |
| PUT | `/api/transactions/:id` | Обновить операцию |
| DELETE | `/api/transactions/:id` | Удалить операцию |
| GET | `/api/categories` | Категории доходов, расходов и переводов |
| GET | `/api/goals` | Копилки и кредиты |
| POST | `/api/goals` | Создать цель |
| PUT | `/api/goals/:id` | Изменить цель |
| DELETE | `/api/goals/:id` | Удалить цель |
| POST | `/api/goals/:id/contribute` | Пополнить копилку / платёж по кредиту |
| GET | `/api/analytics/dashboard?month=&year=` | Статистика для дашборда (месяц опционален) |
| GET | `/api/analytics/full` | Полная аналитика |
| GET | `/api/analytics/recommendations` | Рекомендации по статистике |
| GET | `/api/budgets/status` | Статус бюджетов |
| GET/POST | `/api/recurring` | Повторяющиеся операции |
| GET | `/api/data/export` | Экспорт JSON |
| POST | `/api/data/import` | Импорт JSON |
| POST | `/api/data/import-bank-csv` | Импорт CSV из банка |
| GET | `/api/search?q=` | Глобальный поиск |
| GET | `/api/version` | Версия приложения |
| GET | `/api/health` | Статус сервера |

## Категории операций

**Доходы:** Зарплата, Подработка, Подарки, Инвестиции, Другое

**Расходы:** Продукты, Кафе, Кофе, Транспорт, Автомобиль, Развлечения, Подписки, Здоровье, Одежда, Путешествия, Дом, Связь, Другое

**Переводы (не расходы, но влияют на остаток):**
- Копилка, Накопления, Сбережения — отложенные деньги
- Кредит — платёж по долгу

Список задаётся в `server/src/config/categories.ts`.

## Скрипты

| Команда | Действие |
|---------|----------|
| `npm run install:all` | Установить зависимости во всех пакетах |
| `npm run dev` | Backend + frontend в режиме разработки |
| `npm run dev:server` | Только backend |
| `npm run dev:client` | Только frontend |
| `npm run build` | Сборка frontend |
| `npm start` | Production: сервер + UI на :3001 |
| `npm test` | Тесты backend |
| `npm run docker:up` | Запуск в Docker |
| `npm run tauri:dev` | Десктоп (Tauri, dev) |
| `npm run tauri:build` | Сборка десктопного установщика (Tauri) |
| `npm run bundle:node` | Скачать portable Node для Tauri-бандла |
| `npm run cap:sync` | Синхронизация Capacitor (iOS/Android) |

## Лицензия

Private / personal use.
