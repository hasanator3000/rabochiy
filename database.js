/**
 * PostgreSQL Database Module
 * File: database.js
 * Type: module
 * Description: PostgreSQL database connection and operations
 */

import pkg from 'pg';
const { Pool } = pkg;

let pool = null;

/**
 * Initialize PostgreSQL connection pool
 */
export async function initDatabase() {
  return new Promise((resolve, reject) => {
    try {
      // Use Railway's DATABASE_URL or local connection
      const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tst_bot';
      
      pool = new Pool({
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      pool.on('error', (err) => {
        console.error('Pool error:', err);
      });

      console.log('✅ PostgreSQL pool created successfully!');
      
      // Verify connection
      pool.query('SELECT NOW()', (err, result) => {
        if (err) {
          console.error('Database connection error:', err);
          reject(err);
        } else {
          console.log('✅ Database connection verified:', result.rows[0]);
          createTables().then(resolve).catch(reject);
        }
      });
    } catch (error) {
      console.error('Database initialization error:', error);
      reject(error);
    }
  });
}

/**
 * Create necessary tables if they don't exist
 */
async function createTables() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        chat_id BIGINT PRIMARY KEY,
        username VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create promo_codes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS promo_codes (
        id SERIAL PRIMARY KEY,
        chat_id BIGINT REFERENCES users(chat_id) ON DELETE CASCADE,
        code VARCHAR(255) UNIQUE,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tables created/verified successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

/**
 * Get database pool
 */
export function getDatabase() {
  if (!pool) {
    throw new Error('Database not initialized');
  }
  return pool;
}

/**
 * Insert or update user
 */
export async function saveUser(chatId, username) {
  try {
    const result = await pool.query(
      `INSERT INTO users (chat_id, username) VALUES ($1, $2)
       ON CONFLICT (chat_id) DO UPDATE SET username = $2
       RETURNING *`,
      [chatId, username]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
}

/**
 * Get user by chat_id
 */
export async function getUser(chatId) {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE chat_id = $1',
      [chatId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
}

/**
 * Insert promo code
 */
export async function insertPromoCode(chatId, code) {
  try {
    const result = await pool.query(
      `INSERT INTO promo_codes (chat_id, code) VALUES ($1, $2)
       ON CONFLICT (code) DO UPDATE SET chat_id = $1, used = FALSE
       RETURNING *`,
      [chatId, code]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error inserting promo code:', error);
    throw error;
  }
}

/**
 * Get unused promo code
 */
export async function getUnusedPromoCode(chatId) {
  try {
    const result = await pool.query(
      `SELECT * FROM promo_codes 
       WHERE chat_id = $1 AND used = FALSE 
       LIMIT 1`,
      [chatId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting promo code:', error);
    throw error;
  }
}

/**
 * Mark promo code as used
 */
export async function markPromoCodeAsUsed(codeId) {
  try {
    const result = await pool.query(
      `UPDATE promo_codes SET used = TRUE WHERE id = $1 RETURNING *`,
      [codeId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error marking promo code as used:', error);
    throw error;
  }
}

/**
 * Get all promo codes for a user
 */
export async function getUserPromoCodes(chatId) {
  try {
    const result = await pool.query(
      `SELECT * FROM promo_codes WHERE chat_id = $1 ORDER BY created_at DESC`,
      [chatId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting user promo codes:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  if (pool) {
    await pool.end();
    console.log('✅ Database connection closed');
  }
}
