/**
 * Telegram Bot на Telegraf
 * File: bot/telegram.js
 * Type: module
 * Description: Telegram бот на Telegraf для отправки промокодов в игре крестики-нолики
 */
import { Telegraf } from 'telegraf';
import { getDatabase } from '../database.js';
import { promisify } from 'util';
import { updateCalendarEventColor, deleteCalendarEvent } from '../services/calendar.js';

let bot = null;

/**
 * Инициализирует и запускает Telegram бота
 */
export function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN не установлен. Telegram бот не будет запущен.');
    return null;
  }
  
  try {
    bot = new Telegraf(token);
    console.log('🤖 Бот создан на Telegraf');
    
    // Регистрируем обработчики
    setupHandlers();
    
    // Запускаем бота
    bot.launch();
    console.log('✅✅✅ TELEGRAM БОТ ЗАПУЩЕН! ✅✅✅');
    
    // Graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
    
    return bot;
  } catch (error) {
    console.error('❌ Ошибка инициализации Telegram бота:', error.message);
    return null;
  }
}

/**
 * Настраивает все обработчики бота
 */
function setupHandlers() {
  console.log('📌 Настройка обработчиков бота...');
  
  // Команда /start
  bot.command('start', async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username;
    console.log(`\n📨📨📨 КОМАНДА /start ПОЛУЧЕНА! 📨📨📨`);
    console.log(` User ID: ${userId}`);
    console.log(` Username: ${username || 'не указан'}`);
    console.log(` First Name: ${ctx.from.first_name || 'не указано'}`);
    
    // Сохраняем связь username -> chat_id в БД для последующей отправки сообщений
    if (username) {
      try {
        const db = getDatabase();
        const run = promisify(db.run.bind(db));
        
        // Создаем или обновляем запись пользователя
        await run(`
          INSERT OR REPLACE INTO telegram_users (username, chat_id, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `, [username, userId]);
        
        console.log(`💾💾💾 СВЯЗЬ СОХРАНЕНА В БД! 💾💾💾`);
        console.log(` username: @${username} -> chat_id: ${userId}`);
      } catch (dbError) {
        console.error(`⚠️ Ошибка сохранения связи в БД:`, dbError.message);
        console.error(` Стек:`, dbError.stack);
      }
    } else {
      console.warn(`⚠️ Username не указан, связь не сохранена`);
    }
    
    try {
      const webAppUrl = process.env.TELEGRAM_WEB_APP_URL || 'https://example.com';
      console.log(`📤 Отправка приветственного сообщения пользователю ${userId}...`);
      
      const result = await ctx.reply(
        '👋 Добро пожаловать в игру крестики-нолики!\n\n' +
        'Нажмите кнопку ниже, чтобы начать игру:',
        {
          reply_markup: {
            keyboard: [[
              { text: '🎮 Играть', web_app: { url: webAppUrl } }
            ]],
            resize_keyboard: true
          }
        }
      );
      
      console.log(`✅✅✅ ПРИВЕТСТВЕННОЕ СООБЩЕНИЕ ОТПРАВЛЕНО! ✅✅✅`);
      console.log(` Message ID: ${result.message_id}`);
      console.log(` User ID: ${userId}`);
      if (username) {
        console.log(` Теперь бот может отправлять сообщения этому пользователю по chat_id: ${userId}`);
      }
    } catch (error) {
      console.error(`❌❌❌ ОШИБКА ОТПРАВКИ ПРИВЕТСТВЕННОГО СООБЩЕНИЯ:`);
      console.error(` User ID: ${userId}`);
      console.error(` Ошибка: ${error.message}`);
      console.error(` Стек:`, error.stack);
    }
  });
  
  console.log('✅ Все обработчики зарегистрированы');
}

/**
 * Отправляет промокод пользователю через Telegram
 * @param {string} username - username пользователя
 * @param {string} code - промокод для отправки
 * @param {string} status - статус игры ('win' или 'lose')
 */
export async function sendPromoCode(username, code, status = 'win') {
  if (!bot || !username) {
    console.warn('⚠️ sendPromoCode: bot не инициализирован или username отсутствует');
    throw new Error('bot_not_initialized_or_username_missing');
  }
  
  // Формируем сообщение в зависимости от статуса
  let message;
  if (status === 'win' && code) {
    message =
      `🎉 Поздравляем с победой!\n\n` +
      `🎁 Ваш промокод:\n` +
      `\`${code}\`\n\n` +
      `Используйте его для получения скидки!`;
  } else if (status === 'lose') {
    message =
      `😔 К сожалению, вы проиграли.\n\n` +
      `Не расстраивайтесь! Попробуйте ещё раз и выиграйте промокод!`;
  } else {
    console.warn('⚠️ sendPromoCode: неверный статус или отсутствует промокод');
    throw new Error('invalid_status_or_code');
  }
  
  // Очищаем username от @ и пробелов
  const cleanUsername = username.replace('@', '').trim();
  if (!cleanUsername) {
    console.warn('⚠️ sendPromoCode: пустой username');
    throw new Error('empty_username');
  }
  
  // Пытаемся найти chat_id по username в БД
  let chatId;
  let isUsername = false;
  
  try {
    const db = getDatabase();
    const get = promisify(db.get.bind(db));
    
    console.log(`🔍 Поиск chat_id в БД для username: @${cleanUsername}`);
    // Регистронезависимый поиск username
    const userRecord = await get(`
      SELECT chat_id FROM telegram_users WHERE LOWER(username) = LOWER(?)
    `, [cleanUsername]);
    
    if (userRecord && userRecord.chat_id) {
      // Нашли chat_id в БД - используем его!
      chatId = userRecord.chat_id;
      console.log(`✅✅✅ НАЙДЕН CHAT_ID В БД! ✅✅✅`);
      console.log(` Username: @${cleanUsername}`);
      console.log(` Chat ID: ${chatId}`);
      console.log(` Будет использован chat_id для отправки сообщения`);
      isUsername = false;
    } else {
      // Не нашли в БД - пробуем отправить по username (может не сработать)
      console.log(`⚠️ chat_id не найден в БД для username @${cleanUsername}`);
      console.log(` Проверяем все записи в таблице telegram_users...`);
      
      // Для отладки: показываем все записи
      try {
        const all = promisify(db.all.bind(db));
        const allUsers = await all(`SELECT username, chat_id FROM telegram_users`);
        console.log(` Всего записей в telegram_users: ${allUsers?.length || 0}`);
        if (allUsers && allUsers.length > 0) {
          console.log(` Записи в БД:`);
          allUsers.forEach(u => {
            console.log(` - @${u.username} -> ${u.chat_id}`);
          });
        } else {
          console.log(` ⚠️ Таблица telegram_users пуста!`);
          console.log(` 💡 Пользователь должен отправить /start боту`);
        }
      } catch (debugError) {
        console.error(` Ошибка при проверке таблицы:`, debugError.message);
      }
      
      chatId = `@${cleanUsername}`;
      isUsername = true;
      console.log(`📤 Попытка отправки промокода пользователю по username: ${chatId}`);
      console.log(`⚠️ ВАЖНО: Сообщение может не дойти, если пользователь не писал боту /start`);
      console.log(` Попросите пользователя написать боту /start для получения уведомлений`);
    }
  } catch (dbError) {
    console.error(`⚠️ Ошибка поиска chat_id в БД:`, dbError.message);
    console.error(` Стек:`, dbError.stack);
    // Fallback на username
    chatId = `@${cleanUsername}`;
    isUsername = true;
    console.log(`📤 Попытка отправки промокода пользователю по username: ${chatId}`);
  }
  
  try {
    console.log(`📤 Отправка промокода пользователю ${chatId}`);
    console.log(` Тип chatId: ${typeof chatId}, значение: ${chatId}`);
    console.log(` Статус: ${status}`);
    if (code) {
      console.log(` Промокод: ${code}`);
    }
    
    const result = await bot.telegram.sendMessage(chatId, message, {
      parse_mode: 'Markdown'
    });
    
    console.log(`✅✅✅ ПРОМОКОД УСПЕШНО ОТПРАВЛЕН ПОЛЬЗОВАТЕЛЮ! ✅✅✅`);
    console.log(` Chat ID: ${chatId}`);
    console.log(` Message ID: ${result.message_id}`);
  } catch (error) {
    console.error('❌❌❌ ОШИБКА ОТПРАВКИ ПРОМОКОДА ПОЛЬЗОВАТЕЛЮ:');
    console.error(` Chat ID/Username: ${chatId}`);
    console.error(` Тип: ${typeof chatId}`);
    console.error(` Ошибка: ${error.message}`);
    console.error(` Код ошибки: ${error.response?.error_code || 'неизвестен'}`);
    console.error(` Описание: ${error.response?.description || 'нет описания'}`);
    
    // Детальная обработка ошибок
    if (error.message.includes('chat not found') || error.response?.description?.includes('chat not found')) {
      console.error(`⚠️ ЧАТ НЕ НАЙДЕН!`);
      if (isUsername) {
        console.error(` Использовался username: ${chatId}`);
        console.error(` Решение: Пользователь должен сначала написать боту /start`);
        console.error(` После этого бот сможет отправлять сообщения по username`);
      } else {
        console.error(` Использовался chat_id: ${chatId}`);
        console.error(` Возможные причины:`);
        console.error(` 1. Chat ID неверный`);
        console.error(` 2. Пользователь не писал боту /start`);
      }
      throw new Error('chat_not_found');
    } else if (error.message.includes('bot was blocked') || error.response?.description?.includes('bot was blocked')) {
      console.error(`⚠️ БОТ ЗАБЛОКИРОВАН ПОЛЬЗОВАТЕЛЕМ!`);
      throw new Error('bot_was_blocked');
    } else if (error.message.includes('user is deactivated') || error.response?.description?.includes('user is deactivated')) {
      console.error(`⚠️ ПОЛЬЗОВАТЕЛЬ ДЕАКТИВИРОВАН!`);
      throw new Error('user_is_deactivated');
    } else {
      console.error(`⚠️ НЕИЗВЕСТНАЯ ОШИБКА!`);
      console.error(` Полный ответ:`, JSON.stringify(error.response || {}, null, 2));
      throw error;
    }
  }
}

export default bot;
