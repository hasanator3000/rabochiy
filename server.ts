/**
 * Backend API сервер для игры крестики-нолики
 * File: server.js
 * Type: module
 * Description: Express сервер с API endpoints для отправки промокодов в Telegram
 */

import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './database.js';
import { initTelegramBot, sendPromoCode } from './bot/telegram.js';
import { appendFileSync } from 'fs';

const LOG_PATH = '/Users/a1/Desktop/projects/tst/.cursor/debug.log';
function logDebug(data) {
  try {
    const logEntry = JSON.stringify({...data, timestamp: Date.now()}) + '\n';
    appendFileSync(LOG_PATH, logEntry, 'utf8');
  } catch {}
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Настройка CORS для разрешения запросов с Vercel и других доменов
const corsOptions = {
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (например, из Postman, curl)
    if (!origin) return callback(null, true);
    
    // Разрешаем запросы с Vercel доменов
    const allowedOrigins = [
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/rabochiy-five\.vercel\.app$/,
      process.env.ALLOWED_ORIGIN,
    ].filter(Boolean);
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      }
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS: Запрос с неразрешенного origin: ${origin}`);
      callback(null, true); // Разрешаем все для упрощения, но можно изменить на false для безопасности
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Инициализация базы данных
// #region agent log
logDebug({location:'server.ts:24',message:'BEFORE initDatabase()',data:{},sessionId:'debug-session',runId:'run1',hypothesisId:'E'});
// #endregion
initDatabase().then(() => {
  // #region agent log
  logDebug({location:'server.ts:26',message:'initDatabase() SUCCESS',data:{},sessionId:'debug-session',runId:'run1',hypothesisId:'E'});
  // #endregion
  console.log('✅ База данных инициализирована');
}).catch(err => {
  // #region agent log
  logDebug({location:'server.ts:28',message:'initDatabase() ERROR',data:{errorMessage:err?.message},sessionId:'debug-session',runId:'run1',hypothesisId:'E'});
  // #endregion
  console.error('❌ Ошибка инициализации БД:', err);
});

// Инициализация Telegram бота
// #region agent log
logDebug({location:'server.ts:31',message:'BEFORE initTelegramBot()',data:{},sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
// #endregion
initTelegramBot();

// API endpoint для отправки промокода
app.post('/api/send', async (req, res) => {
  try {
    const { status, code, username } = req.body;

    // Валидация
    if (!status || (status === 'win' && (!code || !username))) {
      return res.status(400).json({
        ok: false,
        error: 'invalid_payload'
      });
    }

    if (status === 'win' && code && username) {
      try {
        // #region agent log
        logDebug({location:'server.ts:47',message:'API /send: BEFORE sendPromoCode',data:{username,code,status},sessionId:'debug-session',runId:'run1',hypothesisId:'F'});
        // #endregion
        console.log(`📤 Отправка промокода через sendPromoCode`);
        console.log(`   Username: ${username}`);
        console.log(`   Промокод: ${code}`);
        
        await sendPromoCode(username, code, 'win');
        // #region agent log
        logDebug({location:'server.ts:54',message:'API /send: sendPromoCode SUCCESS',data:{username},sessionId:'debug-session',runId:'run1',hypothesisId:'F'});
        // #endregion
        
        console.log(`✅ Промокод успешно отправлен`);
        return res.status(200).json({ ok: true });
      } catch (error) {
        console.error('❌ Ошибка отправки промокода:', error);
        
        if (error.message === 'chat_not_found') {
          return res.status(404).json({
            ok: false,
            error: 'chat_not_found',
            reason: 'chat_not_found'
          });
        }
        
        return res.status(500).json({
          ok: false,
          error: error.message || 'telegram_api_error'
        });
      }
    } else if (status === 'lose' && username) {
      // Для проигрыша тоже отправляем уведомление (опционально)
      try {
        console.log(`📤 Отправка уведомления о проигрыше`);
        console.log(`   Username: ${username}`);
        
        await sendPromoCode(username, '', 'lose');
        
        console.log(`✅ Уведомление о проигрыше успешно отправлено`);
      } catch (error) {
        console.error('❌ Ошибка отправки уведомления:', error);
        // Для проигрыша не критично, если не отправилось - не возвращаем ошибку
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('❌ Ошибка обработки запроса:', error);
    return res.status(500).json({
      ok: false,
      error: 'internal_error',
      message: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Ошибка middleware:', err);
  res.status(500).json({ 
    ok: false, 
    error: 'Внутренняя ошибка сервера',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
  console.log(`   API endpoint: http://localhost:${PORT}/api/send`);
});

