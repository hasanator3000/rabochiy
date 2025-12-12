import { render, screen, fireEvent } from "@testing-library/react";
import Cell from "../Cell";

describe("Cell", () => {
  it("показывает значение X/O и дергает onClick", () => {
    const onClick = vi.fn();
    // Тестируем пустую клетку, так как заполненные disabled
    const { container } = render(<Cell value={null} onClick={onClick} />);
    const button = container.querySelector("button");
    expect(button).toHaveTextContent("");
    fireEvent.click(button!);
    expect(onClick).toHaveBeenCalled();
    
    // Проверяем отображение значения отдельно
    const { container: container2 } = render(<Cell value="X" onClick={onClick} />);
    const button2 = container2.querySelector("button");
    expect(button2).toHaveTextContent("X");
    expect(button2).toBeDisabled();
  });

  it("aria-pressed отражает заполненность", () => {
    const { rerender } = render(<Cell value={null} onClick={() => {}} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
    rerender(<Cell value="O" onClick={() => {}} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });
});

