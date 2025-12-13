/**
 * База данных SQLite для хранения связей username -> chat_id
 * File: database.js
 * Type: module
 * Description: Инициализация и работа с SQLite базой данных
 */

import sqlite3 from 'sqlite3';
import { mkdirSync } from 'fs';
import { promisify } from 'util';
import { dirname } from 'path';

import { fileURLToPath } from 'url';
let db = null;

/**
 * Инициализация базы данных
 */
export async function initDatabase() {
  return new Promise((resolve, reject) => {

      // Create data directory if it doesn't exist
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const dataDir = __dirname + '/data';
  mkdirSync(dataDir, { recursive: true });
const dbPath = dataDir + '/app.db';
      if (err) {
        console.error('Ошибка подключения к БД:', err);
        reject(err);
        return;
      }
      console.log('✅ Подключение к SQLite БД установлено:', dbPath);
      createTables().then(resolve).catch(reject);
    });
  });
}

/**
 * Создание таблиц
 */
async function createTables() {
  const run = promisify(db.run.bind(db));

  // Таблица для связи username -> chat_id (для отправки сообщений)
  await run(`
    CREATE TABLE IF NOT EXISTS telegram_users (
      username TEXT PRIMARY KEY,
      chat_id INTEGER NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Таблицы созданы');
}

/**
 * Получить экземпляр базы данных
 */
export function getDatabase() {
  if (!db) {
    throw new Error('База данных не инициализирована');
  }
  return db;
}

/**
 * Закрыть соединение с БД
 */
export function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Ошибка закрытия БД:', err);
      } else {
        console.log('Соединение с БД закрыто');
      }
    });
  }
}

