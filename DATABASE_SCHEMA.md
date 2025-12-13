# Схема базы данных

## Обзор

База данных PostgreSQL используется для хранения связей между Telegram username и chat_id, а также для управления заявками (bookings) и услугами (services).

---

## Таблица: `users`

### Назначение
Хранит информацию о пользователях Telegram для отправки промокодов и уведомлений.

### Структура

| Поле | Тип | Ограничения | Описание |
|------|-----|-------------|----------|
| `chat_id` | `BIGINT` | PRIMARY KEY, NOT NULL | Telegram chat_id пользователя |
| `username` | `VARCHAR(255)` | | Telegram username пользователя (без @) |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Время создания записи |

### Индексы

- **PRIMARY KEY:** `chat_id` (автоматически создается)

### SQL создания таблицы

```sql
CREATE TABLE IF NOT EXISTS users (
  chat_id BIGINT PRIMARY KEY,
  username VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Примеры использования

#### Сохранение пользователя при /start
```sql
INSERT INTO users (chat_id, username) 
VALUES ($1, $2)
ON CONFLICT (chat_id) 
DO UPDATE SET username = $2
RETURNING *;
```

#### Поиск chat_id по username
```sql
SELECT chat_id 
FROM users 
WHERE LOWER(username) = LOWER($1);
```

#### Получение пользователя по chat_id
```sql
SELECT * 
FROM users 
WHERE chat_id = $1;
```

#### Получение всех пользователей (для отладки)
```sql
SELECT username, chat_id 
FROM users;
```

---

## Таблица: `promo_codes`

### Назначение
Хранит промокоды, выданные пользователям при победе в игре.

### Структура

| Поле | Тип | Ограничения | Описание |
|------|-----|-------------|----------|
| `id` | `SERIAL` | PRIMARY KEY | Уникальный идентификатор промокода |
| `chat_id` | `BIGINT` | FOREIGN KEY → users.chat_id | Ссылка на пользователя |
| `code` | `VARCHAR(255)` | UNIQUE | Промокод (уникальный) |
| `used` | `BOOLEAN` | DEFAULT FALSE | Флаг использования промокода |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Время создания промокода |

### Связи

- **FOREIGN KEY:** `chat_id` → `users.chat_id` (ON DELETE CASCADE)

### SQL создания таблицы

```sql
CREATE TABLE IF NOT EXISTS promo_codes (
  id SERIAL PRIMARY KEY,
  chat_id BIGINT REFERENCES users(chat_id) ON DELETE CASCADE,
  code VARCHAR(255) UNIQUE,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Примеры использования

#### Вставка промокода
```sql
INSERT INTO promo_codes (chat_id, code) 
VALUES ($1, $2)
ON CONFLICT (code) 
DO UPDATE SET chat_id = $1, used = FALSE
RETURNING *;
```

#### Получение неиспользованного промокода
```sql
SELECT * 
FROM promo_codes 
WHERE chat_id = $1 AND used = FALSE 
LIMIT 1;
```

#### Получение всех промокодов пользователя
```sql
SELECT * 
FROM promo_codes 
WHERE chat_id = $1 
ORDER BY created_at DESC;
```

#### Отметить промокод как использованный
```sql
UPDATE promo_codes 
SET used = TRUE 
WHERE id = $1 
RETURNING *;
```

---

## Таблица: `bookings` (если используется)

### Назначение
Хранит заявки на услуги (используется в функциональности bookings, если она активна).

### Структура

| Поле | Тип | Ограничения | Описание |
|------|-----|-------------|----------|
| `id` | `INTEGER` или `SERIAL` | PRIMARY KEY | Уникальный идентификатор заявки |
| `date` | `DATE` или `TEXT` | NOT NULL | Дата заявки |
| `time` | `TIME` или `TEXT` | NOT NULL | Время заявки |
| `name` | `TEXT` | NOT NULL | Имя клиента |
| `telegram_id` | `BIGINT` | | Telegram chat_id клиента |
| `service_id` | `INTEGER` | FOREIGN KEY | Ссылка на услугу |
| `calendar_event_id` | `TEXT` | | ID события в календаре (если используется) |
| `status` | `TEXT` | | Статус заявки (опционально) |
| `created_at` | `TIMESTAMP` | DEFAULT CURRENT_TIMESTAMP | Время создания заявки |

### Связи

- **FOREIGN KEY:** `service_id` → `services.id`

### SQL создания таблицы (пример)

```sql
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  name TEXT NOT NULL,
  telegram_id BIGINT,
  service_id INTEGER REFERENCES services(id),
  calendar_event_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Таблица: `services` (если используется)

### Назначение
Хранит список доступных услуг (используется в функциональности bookings, если она активна).

### Структура

| Поле | Тип | Ограничения | Описание |
|------|-----|-------------|----------|
| `id` | `INTEGER` или `SERIAL` | PRIMARY KEY | Уникальный идентификатор услуги |
| `name` | `TEXT` | NOT NULL | Название услуги |
| `duration` | `INTEGER` | | Длительность услуги в минутах |
| `price` | `DECIMAL` | | Цена услуги |
| `description` | `TEXT` | | Описание услуги |

### SQL создания таблицы (пример)

```sql
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  duration INTEGER,
  price DECIMAL(10, 2),
  description TEXT
);
```

---

## Диаграмма связей

```
users (основная таблица)
├── chat_id (PK)
├── username
└── created_at

promo_codes
├── id (PK)
├── chat_id (FK → users.chat_id)
├── code (UNIQUE)
├── used
└── created_at

bookings (если используется)
├── id (PK)
├── date
├── time
├── name
├── telegram_id
├── service_id (FK → services.id)
├── calendar_event_id
├── status
└── created_at

services (если используется)
├── id (PK)
├── name
├── duration
├── price
└── description
```

---

## Текущая реализация

### Активно используется

✅ **`users`** - основная таблица для работы бота
- Создается автоматически при инициализации БД
- Используется для хранения связи username ↔ chat_id
- Сохраняется при команде `/start`

✅ **`promo_codes`** - таблица для хранения промокодов
- Создается автоматически при инициализации БД
- Используется для отслеживания выданных промокодов
- Связана с таблицей `users` через FOREIGN KEY

### Опционально используется

⚠️ **`bookings`** и **`services`** - используются только если функциональность bookings активна
- В текущей реализации игры крестики-нолики эти таблицы могут не существовать
- Код в `bot/telegram.js` содержит функции для работы с bookings, но они могут не использоваться

---

## Миграции и обновления

### Автоматическое создание таблиц

При инициализации БД (`initDatabase()`) автоматически создаются:
- ✅ Таблица `users` (PRIMARY KEY на chat_id)
- ✅ Таблица `promo_codes` (FOREIGN KEY на users.chat_id, UNIQUE на code)

### Обновление схемы

Если нужно добавить таблицы `bookings` и `services`, выполните:

```sql
-- Создание таблицы services
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  duration INTEGER,
  price DECIMAL(10, 2),
  description TEXT
);

-- Создание таблицы bookings
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  name TEXT NOT NULL,
  telegram_id BIGINT,
  service_id INTEGER REFERENCES services(id),
  calendar_event_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Типы данных PostgreSQL

### Используемые типы

- **TEXT** - для строк переменной длины (username, name, description)
- **BIGINT** - для больших целых чисел (chat_id, telegram_id)
- **INTEGER/SERIAL** - для целых чисел и автоинкремента (id)
- **TIMESTAMP** - для даты и времени (updated_at, created_at)
- **DATE** - для дат (date в bookings)
- **TIME** - для времени (time в bookings)
- **DECIMAL** - для денежных значений (price)

### Почему BIGINT для chat_id?

Telegram chat_id может быть очень большим числом (до 2^63-1), поэтому используется `BIGINT` вместо `INTEGER`.

---

## Безопасность

### Параметризованные запросы

Все запросы используют параметризованные запросы для защиты от SQL-инъекций:

```javascript
// ✅ Правильно
await query('SELECT * FROM telegram_users WHERE username = $1', [username]);

// ❌ Неправильно (уязвимо к SQL-инъекциям)
await query(`SELECT * FROM telegram_users WHERE username = '${username}'`);
```

### Индексы для производительности

- Индекс на `chat_id` ускоряет поиск по chat_id
- PRIMARY KEY на `username` автоматически создает индекс

---

## Резюме

**Основные таблицы:**
- `users` - для хранения пользователей (chat_id как PRIMARY KEY, username)
- `promo_codes` - для хранения выданных промокодов (связь с users через FOREIGN KEY)

**Опциональные таблицы (если используется функциональность bookings):**
- `services` - список услуг
- `bookings` - заявки на услуги

**Все таблицы создаются с помощью `CREATE TABLE IF NOT EXISTS`, что позволяет безопасно запускать инициализацию несколько раз.**

## Функции базы данных

### Доступные функции в `database.js`:

- `initDatabase()` - инициализация подключения и создание таблиц
- `getDatabase()` - получение пула подключений
- `saveUser(chatId, username)` - сохранение/обновление пользователя
- `getUser(chatId)` - получение пользователя по chat_id
- `insertPromoCode(chatId, code)` - вставка промокода
- `getUnusedPromoCode(chatId)` - получение неиспользованного промокода
- `markPromoCodeAsUsed(codeId)` - отметка промокода как использованного
- `getUserPromoCodes(chatId)` - получение всех промокодов пользователя
- `closeDatabase()` - закрытие соединения

