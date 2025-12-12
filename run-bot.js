/**
 * Скрипт запуска Telegram бота
 * File: run-bot.js
 * Type: module
 * Description: Инициализирует БД и запускает Telegram бота
 */

import dotenv from 'dotenv';
import { initDatabase } from './database.js';
import { initTelegramBot } from './bot/telegram.js';

// Загружаем переменные окружения
dotenv.config();

async function main() {
  try {
    console.log('🚀 Запуск Telegram бота...\n');

    // Инициализация базы данных
    console.log('📦 Инициализация базы данных...');
    await initDatabase();
    console.log('✅ База данных инициализирована\n');

    // Инициализация бота
    console.log('🤖 Инициализация Telegram бота...');
    const bot = initTelegramBot();

    if (!bot) {
      console.error('❌ Не удалось инициализировать бота');
      console.error('💡 Убедитесь, что установлена переменная окружения TELEGRAM_BOT_TOKEN');
      process.exit(1);
    }

    console.log('\n✅ Бот запущен и готов к работе!');
    console.log('💡 Нажмите Ctrl+C для остановки\n');

    // Держим процесс запущенным
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Остановка бота...');
      if (bot) {
        bot.stop('SIGINT');
      }
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n\n🛑 Остановка бота...');
      if (bot) {
        bot.stop('SIGTERM');
      }
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Ошибка при запуске:', error);
    process.exit(1);
  }
}

main();

