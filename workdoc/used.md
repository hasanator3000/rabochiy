# Used Entities

## Variables
(entries)

## Functions
### App
- File: src/App.tsx
- Type: function
- Description: Корневой React-компонент игры с управлением состоянием.

### Board
- File: src/components/Board.tsx
- Type: function
- Description: Рендерит сетку 3×3 и передает клики наружу.

### Cell
- File: src/components/Cell.tsx
- Type: function
- Description: Кнопка одной клетки игрового поля.

### StatusBar
- File: src/components/StatusBar.tsx
- Type: function
- Description: Показывает текущий ход и состояние партии.

### WinModal
- File: src/components/WinModal.tsx
- Type: function
- Description: Отображает промокод и собирает username для отправки.

### LoseModal
- File: src/components/LoseModal.tsx
- Type: function
- Description: Показывает проигрыш и опциональный ввод username.

### DrawModal
- File: src/components/DrawModal.tsx
- Type: function
- Description: Отображает состояние ничьей и кнопку перезапуска.

### sendResult
- File: src/lib/api.ts
- Type: function
- Description: Отправляет результат игры на backend `/send`.

### getWinner
- File: src/lib/gameLogic.ts
- Type: function
- Description: Находит победителя по текущему полю 3×3.

### isDraw
- File: src/lib/gameLogic.ts
- Type: function
- Description: Проверяет ничью, если нет победителя и нет пустых клеток.

### pickAiMove
- File: src/lib/gameLogic.ts
- Type: function
- Description: Выбирает следующий ход ИИ из доступных клеток.

### handler
- File: api/send.ts
- Type: function
- Description: Серверный обработчик `/send`, валидирует и шлет в Telegram (legacy Vercel Function).

## Modules
### server
- File: server.ts
- Type: module
- Description: Express сервер с API endpoints для отправки промокодов, инициализирует БД и бота.

### database
- File: database.js
- Type: module
- Description: SQLite база данных для хранения связей username -> chat_id в таблице telegram_users.

### bot/telegram
- File: bot/telegram.js
- Type: module
- Description: Telegram бот на Telegraf для отправки промокодов в игре крестики-нолики, использует БД для хранения связей username -> chat_id.

### services/calendar
- File: services/calendar.js
- Type: module
- Description: Заглушки для функций работы с календарем (обновление цвета, удаление событий).

### run-bot
- File: scripts/run-bot.js
- Type: module
- Description: Скрипт запуска Telegram бота, инициализирует БД и запускает бота.

### initTelegramBot
- File: bot/telegram.js
- Type: function
- Description: Инициализирует и запускает Telegram бота на Telegraf с обработчиками команд.

### setupHandlers
- File: bot/telegram.js
- Type: function
- Description: Настраивает все обработчики бота (команды /start, /test, callback_query, сообщения, ошибки).

### sendPromoCode
- File: bot/telegram.js
- Type: function
- Description: Отправляет промокод пользователю через Telegram, ищет chat_id в БД по username.

### handleBookingConfirmation
- File: bot/telegram.js
- Type: function
- Description: Обрабатывает подтверждение заявки через callback_query (оставлено для совместимости).

### handleBookingRejection
- File: bot/telegram.js
- Type: function
- Description: Обрабатывает отклонение заявки через callback_query (оставлено для совместимости).

### sendAdminNotification
- File: bot/telegram.js
- Type: function
- Description: Отправляет уведомление админу с кнопками подтверждения/отклонения (оставлено для совместимости).

### pinChannelMessage
- File: bot/telegram.js
- Type: function
- Description: Отправляет закрепленное сообщение в канал с кнопкой запуска игры (оставлено для совместимости).

### updateCalendarEventColor
- File: services/calendar.js
- Type: function
- Description: Обновляет цвет события в календаре (заглушка).

### deleteCalendarEvent
- File: services/calendar.js
- Type: function
- Description: Удаляет событие из календаря (заглушка).

## Classes
(entries)

## Stores / Contexts
### createGameStore
- File: src/state/gameStore.ts
- Type: store
- Description: In-memory состояние игры с методами ходов и отправкой результатов.

## Utils
### generatePromoCode
- File: src/lib/promo.ts
- Type: util
- Description: Генерирует псевдослучайный промокод из A–Z0–9 фиксированной длины.

