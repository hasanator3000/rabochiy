import { getWinner, isDraw, pickAiMove } from "../gameLogic";

describe("gameLogic", () => {
  it("getWinner находит победителя по линиям", () => {
    expect(getWinner(["X", "X", "X", null, null, null, null, null, null])).toBe("X");
    expect(getWinner([null, null, null, "O", "O", "O", null, null, null])).toBe("O");
    expect(getWinner(["X", null, null, null, "X", null, null, null, "X"])).toBe("X");
    expect(getWinner(Array(9).fill(null))).toBeNull();
  });

  it("isDraw учитывает отсутствие победителя и пустых клеток", () => {
    expect(isDraw(Array(9).fill(null))).toBe(false);
    expect(isDraw(["X", "O", "X", "O", "X", "O", "O", "X", "O"])).toBe(true);
    expect(isDraw(["X", "X", "X", "O", "O", "O", "O", "X", "X"])).toBe(false);
  });

  it("pickAiMove выбирает только пустые клетки", () => {
    const board = ["X", null, "O", null, null, "X", "O", null, null] as const;
    const move = pickAiMove([...board]);
    expect(move).not.toBeNull();
    if (move !== null) {
      expect(board[move]).toBeNull();
    }
    expect(pickAiMove(["X", "O", "X", "O", "X", "O", "O", "X", "O"])).toBeNull();
  });
});

