import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "../send";

const BOT_TOKEN = "TEST_TOKEN";

describe("api/send handler", () => {
  beforeEach(() => {
    process.env.BOT_TOKEN = BOT_TOKEN;
    // @ts-expect-error global fetch mock
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  it("возвращает 405 для не-POST", async () => {
    const { req, res, data } = createReqRes("GET");
    await handler(req, res);
    expect(data.statusCode).toBe(405);
  });

  it("валидирует payload и BOT_TOKEN", async () => {
    // Тест валидации payload (без BOT_TOKEN проверяется отдельно)
    const { req, res, data } = createReqRes("POST", {});
    await handler(req, res);
    expect(data.statusCode).toBe(400); // Невалидный payload
    
    // Тест отсутствия BOT_TOKEN
    const originalToken = process.env.BOT_TOKEN;
    delete process.env.BOT_TOKEN;
    const { req: req2, res: res2, data: data2 } = createReqRes("POST", { status: "lose" });
    await handler(req2, res2);
    expect(data2.statusCode).toBe(500);
    process.env.BOT_TOKEN = originalToken;
  });

  it("chat_not_found при неизвестном username", async () => {
    process.env.BOT_TOKEN = BOT_TOKEN;
    const { req, res, data } = createReqRes("POST", {
      status: "win",
      code: "ABC",
      username: "nope",
    });
    await handler(req, res);
    expect(data.statusCode).toBe(404);
    expect(JSON.parse(data.body).reason).toBe("chat_not_found");
  });

  it("успех для lose без username", async () => {
    const { req, res, data } = createReqRes("POST", { status: "lose" });
    await handler(req, res);
    expect(data.statusCode).toBe(200);
    expect(JSON.parse(data.body).ok).toBe(true);
  });
});

function createReq(method: string, body?: unknown): VercelRequest {
  const req = {
    method,
    body,
    headers: {},
    query: {},
    cookies: {},
    url: "/api/send",
  } as VercelRequest;
  return req;
}

function createReqRes(method: string, body?: unknown) {
  const req = createReq(method, body);
  const data: { statusCode: number; body: string } = { statusCode: 0, body: "" };
  const res = {
    status: (code: number) => {
      data.statusCode = code;
      return res;
    },
    json: (obj: unknown) => {
      data.body = JSON.stringify(obj);
      return res;
    },
    setHeader: () => res,
  } as unknown as VercelResponse;
  return { req, res, data };
}

