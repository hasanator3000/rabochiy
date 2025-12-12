import { vi, describe, it, expect } from "vitest";
import { createGameStore } from "../gameStore";

vi.mock("../../lib/api", () => ({
  sendResult: vi.fn().mockResolvedValue({ ok: true }),
}));

const { sendResult } = await import("../../lib/api");

describe("integration flow", () => {
  it("win flow: делает ход, получает win и отправляет результат", async () => {
    const store = createGameStore();
    store.state.status = "playing";
    store.state.board = ["X", "X", null, null, null, null, null, null, null];
    store.makeMove(2);
    expect(store.state.status).toBe("win");
    expect(store.state.promoCode).toBeTruthy();
    await store.submitWin("user1");
    expect(sendResult).toHaveBeenCalledWith({
      status: "win",
      code: store.state.promoCode,
      username: "user1",
    });
  });

  it("draw flow: доходит до ничьей", () => {
    const store = createGameStore();
    store.state.status = "playing";
    store.state.board = ["X", "O", "X", "X", "O", "O", "O", "X", null];
    store.makeMove(8);
    expect(store.state.status).toBe("draw");
  });
});

