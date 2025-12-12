import { vi, describe, it, expect } from "vitest";
import { createGameStore } from "../state/gameStore";

vi.mock("../lib/api", () => ({
  sendResult: vi.fn(),
}));

const { sendResult } = await import("../lib/api");

describe("E2E-like flows", () => {
  it("победа + chat_not_found предупреждение", async () => {
    const store = createGameStore();
    store.state.status = "playing";
    store.state.board = ["X", "X", null, null, null, null, null, null, null];
    store.makeMove(2);
    expect(store.state.status).toBe("win");
    (sendResult as any).mockResolvedValueOnce({ ok: false, reason: "chat_not_found" });
    await store.submitWin("nouser");
    expect(store.state.error).toMatch(/Сначала нажмите/);
  });

  it("ничья → reset очищает поле", () => {
    const store = createGameStore();
    store.state.status = "playing";
    store.state.board = ["X", "O", "X", "X", "O", "O", "O", "X", null];
    store.makeMove(8);
    expect(store.state.status).toBe("draw");
    store.reset();
    expect(store.state.status).toBe("playing");
    expect(store.state.board.every((c) => c === null)).toBe(true);
  });
});

