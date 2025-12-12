// Устанавливаем переменную окружения ДО импорта модуля
process.env.BOT_TOKEN = "TEST_TOKEN";

let lastInstance: any;

vi.mock("telegraf", () => {
  class MockTelegraf {
    token: string;
    handlers: Record<string, Function> = {};
    constructor(token: string) {
      this.token = token;
      lastInstance = this;
    }
    start(fn: Function) {
      this.handlers.start = fn;
    }
    catch(fn: Function) {
      // Mock catch handler
    }
    launch() {
      return Promise.resolve();
    }
    stop() {
      return Promise.resolve();
    }
    telegram = {
      setWebhook: vi.fn().mockResolvedValue(true),
    };
  }
  return { Telegraf: MockTelegraf };
});

// Используем динамический импорт после установки переменной окружения
let resolveChatId: (username: string) => number | undefined;
let startBot: () => void;

beforeAll(async () => {
  const botModule = await import("../index");
  resolveChatId = botModule.resolveChatId;
  startBot = botModule.startBot;
});

describe("bot", () => {
  it("сохраняет username→chat_id на /start", async () => {
    // start handler уже зарегистрирован при импорте модуля
    lastInstance.handlers.start?.({
      from: { username: "user1" },
      chat: { id: 123 },
      reply: vi.fn(),
    });
    expect(resolveChatId("user1")).toBe(123);
  });

  it("startBot запускает launch без исключений", () => {
    expect(() => startBot()).not.toThrow();
  });
});

