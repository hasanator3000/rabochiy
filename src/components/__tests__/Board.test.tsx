import { render, screen, fireEvent } from "@testing-library/react";
import Board from "../Board";

describe("Board", () => {
  it("рендерит 9 клеток и пробрасывает клики", () => {
    const board = Array(9).fill(null);
    const onCellClick = vi.fn();
    render(<Board board={board} onCellClick={onCellClick} />);
    const cells = screen.getAllByRole("button");
    expect(cells).toHaveLength(9);
    fireEvent.click(cells[0]);
    expect(onCellClick).toHaveBeenCalledWith(0);
  });
});

