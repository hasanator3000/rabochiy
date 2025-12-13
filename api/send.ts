import type { VercelRequest, VercelResponse } from "@vercel/node";

interface SendPayload {
  status: "win" | "lose";
  code?: string;
  username?: string;
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
 * handler: проксирует запросы на Railway API endpoint.
 * Vercel Functions не имеют доступа к файловой системе для SQLite,
 * поэтому все запросы перенаправляются на Railway сервер, где есть доступ к БД.
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

  // Получаем URL Railway API из переменных окружения
  const RAILWAY_API_URL = process.env.RAILWAY_API_URL;
  if (!RAILWAY_API_URL) {
    console.error("❌ RAILWAY_API_URL не установлен в переменных окружения");
    res.status(500).json({ 
      ok: false, 
      error: "railway_api_not_configured",
      message: "Railway API URL не настроен. Установите переменную окружения RAILWAY_API_URL в настройках Vercel."
    });
    return;
  }

  // Проксируем запрос на Railway API
  try {
    console.log(`📤 Проксирование запроса на Railway API: ${RAILWAY_API_URL}/api/send`);
    console.log(`   Payload:`, JSON.stringify(body));

    const railwayResponse = await fetch(`${RAILWAY_API_URL}/api/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseData = await railwayResponse.json().catch(() => ({
      ok: false,
      error: "invalid_response",
    }));

    if (!railwayResponse.ok) {
      console.error(`❌ Railway API error:`, responseData);
      res.status(railwayResponse.status).json(responseData);
      return;
    }

    console.log(`✅✅✅ Запрос успешно проксирован на Railway! ✅✅✅`);
    console.log(`   Response:`, responseData);
    res.status(200).json(responseData);
  } catch (error: any) {
    console.error("❌ Ошибка проксирования на Railway API:", error);
    res.status(500).json({
      ok: false,
      error: "railway_api_error",
      message: error.message || "Не удалось подключиться к Railway API",
    });
  }
}
