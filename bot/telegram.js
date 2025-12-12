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
    console.warn('⚠️  TELEGRAM_BOT_TOKEN не установлен. Telegram бот не будет запущен.');
    return null;
  }

  try {
    bot = new Telegraf(token);
    console.log('🤖 Бот создан на Telegraf');

    // Регистрируем обработчики
    setupHandlers();

    // Запускаем бота
    // Запускаем бота с polling (более надежно для контейнеров)
    bot.launch();
    console.log('✅✅✅ TELEGRAM БОТ ЗАПУЩЕН! ✅✅✅');
    
    // Graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
    turn bot;
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
    console.log(`   User ID: ${userId}`);
    console.log(`   Username: ${username || 'не указан'}`);
    console.log(`   First Name: ${ctx.from.first_name || 'не указано'}`);
    
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
        console.log(`   username: @${username} -> chat_id: ${userId}`);
      } catch (dbError) {
        console.error(`⚠️  Ошибка сохранения связи в БД:`, dbError.message);
        console.error(`   Стек:`, dbError.stack);
        // Продолжаем выполнение, даже если не удалось сохранить
      }
    } else {
      console.warn(`⚠️  Username не указан, связь не сохранена`);
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
      console.log(`   Message ID: ${result.message_id}`);
      console.log(`   User ID: ${userId}`);
      if (username) {
        console.log(`   Теперь бот может отправлять сообщения этому пользователю по chat_id: ${userId}`);
      }
    } catch (error) {
      console.error(`❌❌❌ ОШИБКА ОТПРАВКИ ПРИВЕТСТВЕННОГО СООБЩЕНИЯ:`);
      console.error(`   User ID: ${userId}`);
      console.error(`   Ошибка: ${error.message}`);
      console.error(`   Стек:`, error.stack);
    }
  });

  // Команда /test для проверки кнопок
  bot.command('test', async (ctx) => {
    console.log(`🧪 Тестовая команда /test от ${ctx.from.id}`);
    await ctx.reply('🧪 Тест кнопок:\n\nНажмите кнопку ниже:', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Тест кнопка', callback_data: 'test_button' }
          ]
        ]
      }
    });
    console.log('✅ Тестовое сообщение отправлено');
  });

  // Обработчик callback_query - ВАЖНО: регистрируется ПЕРВЫМ
  console.log('📌 Регистрируем обработчик callback_query...');
  bot.on('callback_query', async (ctx) => {
    console.log('\n🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
    console.log('🔥🔥🔥 CALLBACK_QUERY ПОЛУЧЕН В TELEGRAF! 🔥🔥🔥');
    console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
    console.log('📥 Данные:', JSON.stringify(ctx.update.callback_query, null, 2));
    console.log('   Data:', ctx.callbackQuery.data);
    console.log('   From ID:', ctx.from.id);
    console.log('   Query ID:', ctx.callbackQuery.id);

    // Сразу отвечаем на callback
    try {
      await ctx.answerCbQuery('Обрабатываю...');
    } catch (e) {
      console.error('❌ Ошибка ответа на callback:', e.message);
    }

    const data = ctx.callbackQuery.data;
    const adminId = process.env.TELEGRAM_ADMIN_ID;
    const userId = ctx.from.id;

    // Проверяем права доступа
    if (adminId && String(userId) !== String(adminId)) {
      console.warn(`⚠️  Попытка использования кнопок не админом: ${userId}, ожидался: ${adminId}`);
      try {
        await ctx.answerCbQuery('У вас нет прав для этого действия', { show_alert: true });
      } catch (e) {}
      return;
    }

    if (!data) {
      console.warn(`⚠️  Пустой callback_data`);
      return;
    }

    try {
      // Тестовая кнопка
      if (data === 'test_button') {
        console.log(`🧪 Тестовая кнопка нажата!`);
        await ctx.answerCbQuery('Тестовая кнопка работает! ✅');
        await ctx.editMessageText('✅✅✅ КНОПКА РАБОТАЕТ! ✅✅✅\n\nCallback_query обрабатывается правильно!');
        return;
      }

      // Подтверждение заявки
      if (data.startsWith('confirm_')) {
        const bookingId = data.replace('confirm_', '').trim();
        console.log(`✅✅✅ ОБРАБОТКА ПОДТВЕРЖДЕНИЯ ЗАЯВКИ #${bookingId} ✅✅✅`);
        await handleBookingConfirmation(bookingId, ctx);
        return;
      }

      // Отклонение заявки
      if (data.startsWith('reject_')) {
        const bookingId = data.replace('reject_', '').trim();
        console.log(`❌ Обработка отклонения заявки #${bookingId}`);
        await handleBookingRejection(bookingId, ctx);
        return;
      }

      console.warn(`⚠️  Неизвестный callback_data: ${data}`);
      await ctx.answerCbQuery('Неизвестная команда');
    } catch (error) {
      console.error('❌ Ошибка обработки callback_query:', error);
      console.error('Стек ошибки:', error.stack);
      try {
        await ctx.answerCbQuery('Ошибка обработки запроса', { show_alert: true });
      } catch (e) {}
    }
  });

  // Обработчик сообщений (только для логирования, команды обрабатываются отдельно)
  bot.on('message', (ctx) => {
    // Пропускаем команды - они обрабатываются отдельными обработчиками
    if (ctx.message.text && ctx.message.text.startsWith('/')) {
      return; // Команды обрабатываются bot.command()
    }
    console.log(`📨 Сообщение от ${ctx.from.id}: ${ctx.message.text || 'без текста'}`);
  });

  // Обработчик ошибок
  bot.catch((err, ctx) => {
    console.error('❌ Ошибка в боте:', err);
    console.error('   Контекст:', ctx.update);
  });

  console.log('✅ Все обработчики зарегистрированы');
}

/**
 * Обрабатывает подтверждение заявки
 */
async function handleBookingConfirmation(bookingId, ctx) {
  try {
    const apiBaseUrl = process.env.API_URL || 'http://localhost:3000';
    const confirmUrl = `${apiBaseUrl}/api/bookings/${bookingId}/confirm`;

    console.log(`📡 Вызываем API endpoint: ${confirmUrl}`);

    const response = await fetch(confirmUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log(`✅✅✅ ЗАЯВКА ПОДТВЕРЖДЕНА ЧЕРЕЗ API! ✅✅✅`);

      // Получаем данные заявки для уведомлений
      const db = getDatabase();
      const get = promisify(db.get.bind(db));
      const booking = await get(`
        SELECT 
          b.id,
          b.date,
          b.time,
          b.name,
          b.telegram_id,
          s.name as service_name
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        WHERE b.id = ?
      `, [parseInt(bookingId, 10)]);

      // Отправляем уведомление пользователю
      if (booking && booking.telegram_id) {
        const userMessage =
          `✅ Ваша заявка подтверждена!\n\n` +
          `📅 Дата: ${booking.date}\n` +
          `🕐 Время: ${booking.time}\n` +
          `💼 Услуга: ${booking.service_name}\n\n` +
          `Ждем вас в студии!`;

        await bot.telegram.sendMessage(booking.telegram_id, userMessage);
      }

      // Обновляем сообщение админу
      await ctx.answerCbQuery('✅ Заявка подтверждена');

      if (booking) {
        await ctx.editMessageText(
          `✅ Заявка #${bookingId} подтверждена\n\n` +
          `👤 Клиент: ${booking.name}\n` +
          `📅 ${booking.date} в ${booking.time}\n` +
          `💼 ${booking.service_name}\n\n` +
          `🎨 Событие в календаре обновлено на зеленый цвет`
        );
      }
    } else {
      console.error(`❌ Ошибка подтверждения через API:`, result);
      await ctx.answerCbQuery('Ошибка подтверждения заявки', { show_alert: true });
    }
  } catch (error) {
    console.error(`❌ Ошибка вызова API endpoint:`, error.message);
    await ctx.answerCbQuery('Ошибка подтверждения заявки', { show_alert: true });
  }
}

/**
 * Обрабатывает отклонение заявки
 */
async function handleBookingRejection(bookingId, ctx) {
  const db = getDatabase();
  const get = promisify(db.get.bind(db));
  const run = promisify(db.run.bind(db));

  try {
    const booking = await get(`
      SELECT 
        b.id,
        b.date,
        b.time,
        b.name,
        b.telegram_id,
        b.calendar_event_id,
        s.name as service_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.id = ?
    `, [parseInt(bookingId, 10)]);

    if (!booking) {
      await ctx.answerCbQuery('Заявка не найдена');
      return;
    }

    // Удаляем событие из календаря
    if (booking.calendar_event_id) {
      try {
        await deleteCalendarEvent(booking.calendar_event_id);
        console.log(`✅ Событие ${booking.calendar_event_id} удалено из календаря`);
      } catch (error) {
        console.error('❌ Ошибка удаления события:', error);
      }
    }

    // Удаляем заявку из БД
    await run(`DELETE FROM bookings WHERE id = ?`, [parseInt(bookingId, 10)]);
    console.log(`✅ Заявка #${bookingId} удалена из БД`);

    // Отправляем уведомление пользователю
    if (booking.telegram_id) {
      const userMessage =
        `❌ К сожалению, ваша заявка была отклонена.\n\n` +
        `📅 Дата: ${booking.date}\n` +
        `🕐 Время: ${booking.time}\n` +
        `💼 Услуга: ${booking.service_name}\n\n` +
        `Пожалуйста, выберите другое время или свяжитесь с нами.`;

      await bot.telegram.sendMessage(booking.telegram_id, userMessage);
    }

    // Обновляем сообщение админу
    await ctx.answerCbQuery('Заявка отклонена и удалена');

    await ctx.editMessageText(
      `❌ Заявка #${bookingId} отклонена и удалена\n\n` +
      `👤 Клиент: ${booking.name}\n` +
      `📅 ${booking.date} в ${booking.time}`
    );
  } catch (error) {
    console.error('❌ Ошибка обработки отклонения:', error);
  }
}

/**
 * Отправляет закрепленное сообщение в канал
 * (Оставлено для совместимости, не используется в текущем проекте)
 */
export async function pinChannelMessage(channelId, messageText = null) {
  if (!bot) {
    throw new Error('Telegram бот не инициализирован');
  }

  const webAppUrl = process.env.TELEGRAM_WEB_APP_URL || 'https://example.com';
  const text = messageText ||
    '🎮 Игра крестики-нолики\n\n' +
    'Нажмите кнопку ниже, чтобы начать игру:';

  try {
    const sentMessage = await bot.telegram.sendMessage(channelId, text, {
      reply_markup: {
        inline_keyboard: [[
          { text: '🎮 Играть', web_app: { url: webAppUrl } }
        ]]
      }
    });

    await bot.telegram.pinChatMessage(channelId, sentMessage.message_id, {
      disable_notification: false
    });

    return {
      messageId: sentMessage.message_id,
      pinned: true
    };
  } catch (error) {
    // Fallback на URL кнопку
    const sentMessage = await bot.telegram.sendMessage(channelId, text, {
      reply_markup: {
        inline_keyboard: [[
          { text: '🎮 Играть', url: webAppUrl }
        ]]
      }
    });

    await bot.telegram.pinChatMessage(channelId, sentMessage.message_id, {
      disable_notification: false
    });

    return {
      messageId: sentMessage.message_id,
      pinned: true
    };
  }
}

/**
 * Отправляет промокод пользователю через Telegram
 * @param {string} username - username пользователя
 * @param {string} code - промокод для отправки
 * @param {string} status - статус игры ('win' или 'lose')
 */
export async function sendPromoCode(username, code, status = 'win') {
  if (!bot || !username) {
    console.warn('⚠️  sendPromoCode: bot не инициализирован или username отсутствует');
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
    console.warn('⚠️  sendPromoCode: неверный статус или отсутствует промокод');
    throw new Error('invalid_status_or_code');
  }

  // Очищаем username от @ и пробелов
  const cleanUsername = username.replace('@', '').trim();
  if (!cleanUsername) {
    console.warn('⚠️  sendPromoCode: пустой username');
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
      console.log(`   Username: @${cleanUsername}`);
      console.log(`   Chat ID: ${chatId}`);
      console.log(`   Будет использован chat_id для отправки сообщения`);
      isUsername = false;
    } else {
      // Не нашли в БД - пробуем отправить по username (может не сработать)
      console.log(`⚠️  chat_id не найден в БД для username @${cleanUsername}`);
      console.log(`   Проверяем все записи в таблице telegram_users...`);
      
      // Для отладки: показываем все записи
      try {
        const all = promisify(db.all.bind(db));
        const allUsers = await all(`SELECT username, chat_id FROM telegram_users`);
        console.log(`   Всего записей в telegram_users: ${allUsers?.length || 0}`);
        if (allUsers && allUsers.length > 0) {
          console.log(`   Записи в БД:`);
          allUsers.forEach(u => {
            console.log(`     - @${u.username} -> ${u.chat_id}`);
          });
        } else {
          console.log(`   ⚠️  Таблица telegram_users пуста!`);
          console.log(`   💡 Пользователь должен отправить /start боту`);
        }
      } catch (debugError) {
        console.error(`   Ошибка при проверке таблицы:`, debugError.message);
      }
      
      chatId = `@${cleanUsername}`;
      isUsername = true;
      console.log(`📤 Попытка отправки промокода пользователю по username: ${chatId}`);
      console.log(`⚠️  ВАЖНО: Сообщение может не дойти, если пользователь не писал боту /start`);
      console.log(`   Попросите пользователя написать боту /start для получения уведомлений`);
    }
  } catch (dbError) {
    console.error(`⚠️  Ошибка поиска chat_id в БД:`, dbError.message);
    console.error(`   Стек:`, dbError.stack);
    // Fallback на username
    chatId = `@${cleanUsername}`;
    isUsername = true;
    console.log(`📤 Попытка отправки промокода пользователю по username: ${chatId}`);
  }

  try {
    console.log(`📤 Отправка промокода пользователю ${chatId}`);
    console.log(`   Тип chatId: ${typeof chatId}, значение: ${chatId}`);
    console.log(`   Статус: ${status}`);
    if (code) {
      console.log(`   Промокод: ${code}`);
    }
    
    const result = await bot.telegram.sendMessage(chatId, message, {
      parse_mode: 'Markdown'
    });
    
    console.log(`✅✅✅ ПРОМОКОД УСПЕШНО ОТПРАВЛЕН ПОЛЬЗОВАТЕЛЮ! ✅✅✅`);
    console.log(`   Chat ID: ${chatId}`);
    console.log(`   Message ID: ${result.message_id}`);
  } catch (error) {
    console.error('❌❌❌ ОШИБКА ОТПРАВКИ ПРОМОКОДА ПОЛЬЗОВАТЕЛЮ:');
    console.error(`   Chat ID/Username: ${chatId}`);
    console.error(`   Тип: ${typeof chatId}`);
    console.error(`   Ошибка: ${error.message}`);
    console.error(`   Код ошибки: ${error.response?.error_code || 'неизвестен'}`);
    console.error(`   Описание: ${error.response?.description || 'нет описания'}`);
    
    // Детальная обработка ошибок
    if (error.message.includes('chat not found') || error.response?.description?.includes('chat not found')) {
      console.error(`⚠️  ЧАТ НЕ НАЙДЕН!`);
      if (isUsername) {
        console.error(`   Использовался username: ${chatId}`);
        console.error(`   Решение: Пользователь должен сначала написать боту /start`);
        console.error(`   После этого бот сможет отправлять сообщения по username`);
      } else {
        console.error(`   Использовался chat_id: ${chatId}`);
        console.error(`   Возможные причины:`);
        console.error(`   1. Chat ID неверный`);
        console.error(`   2. Пользователь не писал боту /start`);
      }
      throw new Error('chat_not_found');
    } else if (error.message.includes('bot was blocked') || error.response?.description?.includes('bot was blocked')) {
      console.error(`⚠️  БОТ ЗАБЛОКИРОВАН ПОЛЬЗОВАТЕЛЕМ!`);
      throw new Error('bot_was_blocked');
    } else if (error.message.includes('user is deactivated') || error.response?.description?.includes('user is deactivated')) {
      console.error(`⚠️  ПОЛЬЗОВАТЕЛЬ ДЕАКТИВИРОВАН!`);
      throw new Error('user_is_deactivated');
    } else {
      console.error(`⚠️  НЕИЗВЕСТНАЯ ОШИБКА!`);
      console.error(`   Полный ответ:`, JSON.stringify(error.response || {}, null, 2));
      throw error;
    }
  }
}

/**
 * Отправляет уведомление админу с кнопками подтверждения/отклонения
 * (Оставлено для совместимости, не используется в текущем проекте)
 */
export async function sendAdminNotification(bookingData) {
  if (!bot) {
    console.warn('⚠️  sendAdminNotification: bot не инициализирован');
    return;
  }

  const adminId = process.env.TELEGRAM_ADMIN_ID;
  if (!adminId) {
    console.warn('⚠️  TELEGRAM_ADMIN_ID не установлен');
    return;
  }

  const message =
    `📋 Новая заявка #${bookingData.id}\n\n` +
    `👤 Клиент: ${bookingData.name}\n` +
    `📞 Телефон: ${bookingData.phone}\n` +
    `${bookingData.username ? `💬 Telegram: @${bookingData.username}\n` : ''}` +
    `📅 Дата: ${bookingData.date}\n` +
    `🕐 Время: ${bookingData.time}\n` +
    `💼 Услуга: ${bookingData.serviceName}\n` +
    `⏱ Длительность: ${bookingData.duration} мин.\n\n` +
    `Статус: Ожидает подтверждения`;

  const bookingId = String(bookingData.id).trim();
  const callbackDataConfirm = `confirm_${bookingId}`;
  const callbackDataReject = `reject_${bookingId}`;

  console.log(`📤 Отправка уведомления админу ${adminId}`);
  console.log(`   Booking ID: ${bookingId}`);
  console.log(`   Callback данные: confirm="${callbackDataConfirm}", reject="${callbackDataReject}"`);

  // Проверяем длину callback_data (максимум 64 байта)
  if (callbackDataConfirm.length > 64 || callbackDataReject.length > 64) {
    console.error('❌❌❌ ОШИБКА: callback_data слишком длинный!');
    console.error(`   confirm: ${callbackDataConfirm.length} байт`);
    console.error(`   reject: ${callbackDataReject.length} байт`);
  }

  const keyboard = {
    inline_keyboard: [
      [
        { text: '✅ Подтвердить', callback_data: callbackDataConfirm },
        { text: '❌ Отклонить', callback_data: callbackDataReject }
      ]
    ]
  };

  try {
    const result = await bot.telegram.sendMessage(adminId, message, {
      reply_markup: keyboard
    });

    console.log(`✅✅✅ УВЕДОМЛЕНИЕ АДМИНУ ОТПРАВЛЕНО!`);
    console.log(`   Message ID: ${result.message_id}`);
  } catch (error) {
    console.error('❌❌❌ ОШИБКА ОТПРАВКИ УВЕДОМЛЕНИЯ АДМИНУ:');
    console.error('   Сообщение:', error.message);
    console.error('   Детали:', error);
  }
}

export default bot;

