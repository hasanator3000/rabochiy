/**
 * Bot starter
 * Запускает Telegram бот для игры крестики-нолики
 */
import { initTelegramBot } from './telegram.js';
import { initDatabase } from '../database.js';

console.log('🚀 Запуск Telegram Бота...');

// Инициализируем БД
await initDatabase();
console.log('✅ База данных инициализирована');

// Инициализируем и запускаем бота
const bot = initTelegramBot();

if (!bot) {
  console.error('❌ Ошибка: Бот не был инициализирован');
  process.exit(1);
}

console.log('✅ Telegram бот запущен и готов к работе!');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал SIGINT, завершаем работу...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал SIGTERM, завершаем работу...');
  process.exit(0);
});

// Обработка необработанных ошибок
process.on('uncaughtException', (error) => {
  console.error('❌ Необработанное исключение:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Необработанное отклонение Promise:', reason);
});

console.log('🎯 Бот полностью инициализирован и работает!');
