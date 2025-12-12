# Архитектурный документ (AD) — структура и артефакты

## 1. Фронтенд (Vite/React/TS)
- `src/main.tsx` — bootstrap React.
- `src/App.tsx` — каркас страниц.
- `src/components/Board.tsx` — отрисовка 3×3, проксирует клики.
- `src/components/Cell.tsx` — кнопка ячейки.
- `src/components/StatusBar.tsx` — текущий ход/статус.
- `src/components/WinModal.tsx` — ввод username, показ промокода.
- `src/components/LoseModal.tsx`, `DrawModal.tsx` — итоговые состояния.
- `src/lib/gameLogic.ts` — функции: `getWinner(board)`, `isDraw(board)`, `pickAiMove(board)`.
- `src/lib/promo.ts` — `generatePromoCode(len=5)`.
- `src/lib/api.ts` — `sendResult({status, code?, username?})` → `POST /send`.
- Состояние в `src/state/gameStore.ts` (или хук): `board`, `currentPlayer`, `status`, `promoCode`, `username`, `isSending`, `error`, методы `makeMove`, `reset`, `submitWin(username)`.

## 2. Бэкенд (Node.js serverless/Express)
- `api/send.ts` (Vercel) или `server/index.ts` (Express).
- Валидация: `status in ['win','lose']`; при `win` требуются `code` и `username`.
- Логика: найти `chat_id` по username (map/KV); если нет — `chat_not_found`.
- Отправка: `sendMessage(chat_id, text)` через Telegram HTTP API.
- Защита: CORS по origin, rate-limit, simple auth header опц.

## 3. Бот (Telegraf)
- `bot/index.ts` — инициализация `Telegraf(process.env.BOT_TOKEN)`.
- Хэндлер `/start`: сохраняет `{username, chat_id}` в in-memory Map или KV.
- Экспорт утилиты `resolveChatId(username)` для бэкенда.
- Запуск: polling по умолчанию; webhook, если есть `WEBHOOK_URL`.
- Требование UX: пользователь должен нажать `/start` до победы, иначе `chat_not_found`.

## 4. Конфигурация
- `components.json` — реестры shadcn + React Bits для MCP.
- `.cursor/mcp.json` — сервер shadcn MCP с `SHADCN_REGISTRY=https://reactbits.dev/api/registry`.
- ENV: `BOT_TOKEN`, `ALLOWED_ORIGIN`, `WEBHOOK_URL?`, `PORT?`, опц. `KV_URL`/`REDIS_URL`.

## 5. Деплой
- Фронт: Vercel/Netlify статикой.
- Бэкенд `/send`: Vercel/Netlify Function или Render/Express.
- Бот: тот же рантайм; polling для дев, webhook для прод (HTTPS).

## 6. Тесты
- Юнит: `getWinner`, `isDraw`, `pickAiMove`, `generatePromoCode`.
- Интеграция: `sendResult` → мок Telegram, кейс `chat_not_found`.
- E2E: победа → ввод username → промокод → проверка запроса; ошибка, если бот не стартовали.

