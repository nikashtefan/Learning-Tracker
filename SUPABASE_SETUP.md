# Настройка Supabase

## Переменные окружения

Проект настроен для работы с Supabase. Необходимые переменные окружения уже добавлены в Replit Secrets:

- `SUPABASE_URL` - URL вашего Supabase проекта
- `SUPABASE_ANON_KEY` - публичный API ключ
- `DATABASE_URL` - строка подключения к PostgreSQL

## Миграции базы данных

### Важно: Сетевые ограничения Replit

Из-за сетевых ограничений Replit не может подключиться напрямую к Supabase PostgreSQL для выполнения миграций. Есть два способа решения:

### Способ 1: Через Supabase Dashboard (Рекомендуется)

1. Откройте ваш Supabase проект
2. Перейдите в SQL Editor
3. Выполните следующий SQL для создания таблиц:

\`\`\`sql
-- Создание таблицы users (если ещё не создана)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

-- Создание таблицы test_items
CREATE TABLE IF NOT EXISTS test_items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Добавление тестовых данных
INSERT INTO test_items (title, description) VALUES
  ('Первая тестовая запись', 'Это первая запись в тестовой таблице'),
  ('Вторая тестовая запись', 'Это вторая запись с описанием'),
  ('Третья запись', 'Ещё одна тестовая запись для проверки'),
  ('Запись без описания', NULL),
  ('Последняя тестовая запись', 'Финальная запись в тестовом наборе данных');
\`\`\`

### Способ 2: Локально через Drizzle Kit

Если у вас есть доступ к сети, которая может подключиться к Supabase:

\`\`\`bash
# Установите зависимости
npm install

# Сгенерируйте миграции
npm run db:generate

# Примените миграции
npm run db:push
\`\`\`

### Способ 3: Через API endpoint

После создания таблиц вручную, вы можете наполнить базу данных тестовыми данными через API:

\`\`\`bash
curl -X POST https://your-repl-url.replit.dev/api/seed
\`\`\`

Или откройте в браузере и выполните:
\`\`\`javascript
fetch('/api/seed', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
\`\`\`

## API Endpoints

Проект предоставляет следующие API endpoints для работы с тестовыми данными:

- `GET /api/test-items` - получить все записи
- `GET /api/test-items/:id` - получить запись по ID
- `POST /api/test-items` - создать новую запись
- `POST /api/seed` - наполнить БД тестовыми данными

## Структура проекта

- `shared/schema.ts` - схема базы данных (Drizzle ORM)
- `server/db.ts` - подключение к базе данных
- `server/storage.ts` - интерфейс для работы с БД
- `server/routes.ts` - API endpoints
- `server/supabase.ts` - клиент Supabase для авторизации
- `script/seed.ts` - скрипт для наполнения БД (работает только локально из-за сетевых ограничений)

## Авторизация

Для авторизации используйте Supabase клиент, который работает через REST API и не требует прямого подключения к PostgreSQL.

## Разработка

Сервер автоматически перезапускается при изменениях в коде. API доступен на `http://localhost:5000/api`.
