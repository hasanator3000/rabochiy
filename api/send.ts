import type { VercelRequest, VercelResponse } from "@vercel/node";
import { resolveChatId } from "../lib/chatMap";

interface SendPayload {
  status: "win" | "lose";
  code?: string;
  username?: string;
}

interface ApiResponse {
  ok: boolean;
  error?: string;
  reason?: string;
}

// Простой rate limiting (in-memory, для production лучше использовать Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 минута
const RATE_LIMIT_MAX = 10; // максимум 10 запросов в минуту

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

function getClientIP(req: VercelRequest): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    (req.headers["x-real-ip"] as string) ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

function setCorsHeaders(res: VercelResponse): void {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

/**
 * handler: серверный эндпоинт для отправки результата в Telegram.
 * Адаптирован под формат Vercel Functions.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Обработка CORS preflight
  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    res.status(200).end();
    return;
  }

  setCorsHeaders(res);

  // Проверка метода
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }

  // Rate limiting
  const clientIP = getClientIP(req);
  if (!checkRateLimit(clientIP)) {
    res.status(429).json({ ok: false, error: "Too Many Requests" });
    return;
  }

  // Валидация тела запроса
  const body = req.body as SendPayload | undefined;
  if (!body || !body.status) {
    res.status(400).json({ ok: false, error: "invalid_payload" });
    return;
  }

  if (body.status === "win" && (!body.code || !body.username)) {
    res.status(400).json({ ok: false, error: "invalid_payload" });
    return;
  }

  // Проверка токена бота
  const BOT_TOKEN = process.env.BOT_TOKEN;
  if (!BOT_TOKEN) {
    console.error("BOT_TOKEN is not set");
    res.status(500).json({ ok: false, error: "missing_bot_token" });
    return;
  }

  // Поиск chat_id по username
  const chatId = body.username ? resolveChatId(body.username) : undefined;
  
  if (body.status === "win") {
    if (!chatId) {
      console.error(`❌ chat_id не найден для username: ${body.username}`);
      console.error(`   Пользователь должен сначала написать боту /start`);
      res.status(404).json({
        ok: false,
        error: "chat_not_found",
        reason: "chat_not_found",
      });
      return;
    }

    // Формируем сообщение с промокодом
    const message =
      `🎉 Поздравляем с победой!\n\n` +
      `🎁 Ваш промокод:\n` +
      `\`${body.code}\`\n\n` +
      `Используйте его для получения скидки!`;

    try {
      console.log(`📤 Отправка промокода через Telegram API`);
      console.log(`   Username: ${body.username}`);
      console.log(`   Chat ID: ${chatId}`);
      console.log(`   Промокод: ${body.code}`);

      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "Markdown",
          }),
        }
      );

      if (!telegramResponse.ok) {
        const errorData = await telegramResponse.json().catch(() => ({}));
        console.error("❌ Telegram API error:", errorData);
        
        if (errorData.description?.includes("chat not found")) {
          res.status(404).json({
            ok: false,
            error: "chat_not_found",
            reason: "chat_not_found",
          });
          return;
        }
        
        res.status(500).json({
          ok: false,
          error: "telegram_api_error",
        });
        return;
      }

      const result = await telegramResponse.json();
      console.log(`✅✅✅ ПРОМОКОД УСПЕШНО ОТПРАВЛЕН! ✅✅✅`);
      console.log(`   Message ID: ${result.result?.message_id}`);
    } catch (error: any) {
      console.error("❌ Ошибка отправки промокода:", error);
      res.status(500).json({
        ok: false,
        error: "network_error",
      });
      return;
    }
  } else if (body.status === "lose" && body.username && chatId) {
    // Для проигрыша тоже отправляем уведомление (опционально)
    const message =
      `😔 К сожалению, вы проиграли.\n\n` +
      `Не расстраивайтесь! Попробуйте ещё раз и выиграйте промокод!`;

    try {
      console.log(`📤 Отправка уведомления о проигрыше`);
      console.log(`   Username: ${body.username}`);
      console.log(`   Chat ID: ${chatId}`);

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      });

      console.log(`✅ Уведомление о проигрыше успешно отправлено`);
    } catch (error: any) {
      console.error("❌ Ошибка отправки уведомления:", error);
      // Для проигрыша не критично, если не отправилось - не возвращаем ошибку
    }
  }

  // Успешный ответ
  res.status(200).json({ ok: true });
}
