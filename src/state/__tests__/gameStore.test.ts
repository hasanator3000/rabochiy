import { describe, it, expect, vi, beforeEach } from "vitest";
import { createGameStore } from "../gameStore";

vi.mock("../../lib/api", () => ({
  sendResult: vi.fn(),
}));

const { sendResult } = await import("../../lib/api");

describe("gameStore", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("reset очищает поле и переводит в playing", () => {
    const store = createGameStore();
    store.reset();
    expect(store.state.status).toBe("playing");
    expect(store.state.board.every((c) => c === null)).toBe(true);
  });

  it("makeMove завершает победой X и генерирует промокод", () => {
    const store = createGameStore();
    store.state.status = "playing";
    store.state.board = ["X", "X", null, null, null, null, null, null, null];
    store.makeMove(2);
    expect(store.state.status).toBe("win");
    expect(store.state.promoCode).toBeTruthy();
  });

  it("makeMove завершает ничьей", () => {
    const store = createGameStore();
    store.state.status = "playing";
    store.state.board = ["X", "O", "X", "X", "O", "O", "O", "X", null];
    store.makeMove(8);
    expect(store.state.status).toBe("draw");
  });

  it("submitWin отправляет payload и обрабатывает chat_not_found", async () => {
    const store = createGameStore();
    store.state.status = "win";
    store.state.promoCode = "ABCDE";
    (sendResult as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      reason: "chat_not_found",
      error: "chat_not_found",
    });
    await store.submitWin("user1");
    expect(store.state.error).toMatch(/Сначала нажмите/);
    (sendResult as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true });
    await store.submitWin("user1");
    expect(store.state.isSending).toBe(false);
  });

  it("submitLose отправляет статус lose", async () => {
    const store = createGameStore();
    (sendResult as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true });
    await store.submitLose("user1");
    expect(sendResult).toHaveBeenCalledWith({ status: "lose", username: "user1" });
  });
});

