/**
 * Bot starter
 * Запускает Telegram бот для игры крестики-нолики
 */
import { initTelegramBot } from './telegram.js';

console.log('🚀 Запуск Telegram бота...');

try {
  const bot = initTelegramBot();
  if (bot) {
    console.log('✅ Telegram бот инициализирован и запущен!');
  } else {
    console.warn('⚠️ Бот не был инициализирован (возможно, отсутствует TELEGRAM_BOT_TOKEN)');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Ошибка при запуске бота:', error.message);
  process.exit(1);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('⏹️ Получен сигнал SIGINT, завершаем работу...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('⏹️ Получен сигнал SIGTERM, завершаем работу...');
  process.exit(0);
});

console.log('✅✅✅ БОТ УСПЕШНО ЗАПУЩЕН! ✅✅✅');
