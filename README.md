# EProject - ЕНТ Test Platform

Платформа для подготовки к ЕНТ (Единое национальное тестирование) с возможностью прохождения тестов по различным предметам.

## Возможности

- 📚 Тестирование по различным блокам предметов
- 📊 Аналитика и статистика результатов
- 🏆 Рейтинг пользователей
- 📱 Адаптивный дизайн для мобильных устройств
- 💾 Офлайн режим работы
- 📋 Экспорт результатов в PDF и Excel
- 🔔 Push уведомления

## Технологический стек

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- Vite
- React Query (TanStack Query)
- Wouter (роутинг)

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL + Drizzle ORM
- Passport.js (аутентификация)
- WebSocket для real-time обновлений

## Установка и запуск

### Локальная разработка

1. Клонирование репозитория:
```bash
git clone <repository-url>
cd EProject2
```

2. Установка зависимостей:
```bash
npm install
```

3. Создание файла окружения:
```bash
cp .env.example .env
```

4. Настройка переменных в `.env`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
SESSION_SECRET=your-secret-key-here
NODE_ENV=development
```

5. Применение миграций базы данных:
```bash
npm run db:push
```

6. Запуск в режиме разработки:
```bash
npm run dev
```

Приложение будет доступно на `http://localhost:5000`

### Production сборка

```bash
npm run build
npm start
```

## Деплой на Render

### Автоматический деплой

1. Создайте аккаунт на [Render.com](https://render.com)

2. Подключите ваш GitHub репозиторий

3. Render автоматически обнаружит `render.yaml` и создаст:
   - PostgreSQL базу данных
   - Web сервис

4. Установите переменные окружения в Render Dashboard:
   - `SESSION_SECRET` (можно генерировать автоматически)
   - `GOOGLE_CLOUD_CREDENTIALS` (опционально)
   - `GOOGLE_CLOUD_BUCKET_NAME` (опционально)

### Ручной деплой

1. Создайте новый Web Service на Render

2. Укажите настройки:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: `Node`

3. Создайте PostgreSQL базу данных на Render

4. Добавьте переменные окружения

## Структура проекта

```
├── client/                 # Frontend (React)
│   ├── src/
│   │   ├── components/     # React компоненты
│   │   ├── pages/          # Страницы приложения
│   │   ├── hooks/          # Кастомные хуки
│   │   └── lib/            # Утилиты и конфигурация
│   └── dist/               # Собранные файлы (production)
├── server/                 # Backend (Node.js)
│   ├── services/           # Бизнес-логика сервисов
│   ├── db.ts               # Конфигурация БД
│   ├── routes.ts           # API маршруты
│   └── index.ts            # Точка входа сервера
├── shared/                 # Общие типы и схемы
│   └── schema.ts           # Drizzle схемы БД
├── migrations/             # SQL миграции
└── render.yaml             # Конфигурация Render
```

## API Endpoints

### Аутентификация
- `POST /api/register` - Регистрация
- `POST /api/login` - Авторизация
- `POST /api/logout` - Выход
- `GET /api/user` - Текущий пользователь

### Тестирование
- `GET /api/blocks` - Список блоков тестов
- `GET /api/blocks/:id/variants` - Варианты блока
- `GET /api/test/:variantId` - Получение теста
- `POST /api/test/:variantId/submit` - Отправка результатов

### Аналитика
- `GET /api/analytics/overview` - Общая статистика
- `GET /api/rankings` - Рейтинг пользователей
- `GET /api/profile` - Профиль пользователя

## База данных

Проект использует PostgreSQL с Drizzle ORM. Схемы определены в `shared/schema.ts`:

- `users` - Пользователи
- `blocks` - Блоки тестов
- `variants` - Варианты тестов
- `subjects` - Предметы
- `questions` - Вопросы
- `answers` - Ответы
- `test_results` - Результаты тестов
- `user_rankings` - Рейтинги пользователей

## Переменные окружения

- `DATABASE_URL` - Строка подключения к PostgreSQL
- `SESSION_SECRET` - Секретный ключ для сессий
- `NODE_ENV` - Режим работы (development/production)
- `PORT` - Порт сервера (по умолчанию 5000)
- `GOOGLE_CLOUD_CREDENTIALS` - Путь к credentials для Google Cloud (опционально)
- `GOOGLE_CLOUD_BUCKET_NAME` - Название bucket для файлов (опционально)

## Разработка

### Доступные команды

- `npm run dev` - Запуск в режиме разработки
- `npm run build` - Сборка для production
- `npm run start` - Запуск production сервера
- `npm run check` - Проверка типов TypeScript
- `npm run db:push` - Применение изменений схемы БД

### Добавление новых тестов

1. Войдите как администратор
2. Используйте админ-панель для создания:
   - Блоков тестов
   - Вариантов внутри блоков
   - Предметов в вариантах
   - Вопросов и ответов

## Лицензия

MIT