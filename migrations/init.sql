-- Инициализация базы данных Supabase
-- Выполните этот SQL в Supabase Dashboard > SQL Editor

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

-- Добавление индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_test_items_created_at ON test_items(created_at);

-- Добавление тестовых данных
INSERT INTO test_items (title, description) VALUES
  ('Первая тестовая запись', 'Это первая запись в тестовой таблице'),
  ('Вторая тестовая запись', 'Это вторая запись с описанием'),
  ('Третья запись', 'Ещё одна тестовая запись для проверки'),
  ('Запись без описания', NULL),
  ('Последняя тестовая запись', 'Финальная запись в тестовом наборе данных')
ON CONFLICT DO NOTHING;

-- Проверка результата
SELECT 'Таблицы созданы успешно!' as status;
SELECT COUNT(*) as total_test_items FROM test_items;
