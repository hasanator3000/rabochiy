import { render, screen, fireEvent } from "@testing-library/react";
import LoseModal from "../LoseModal";

describe("LoseModal", () => {
  it("отправляет username, если указан", () => {
    const onSubmit = vi.fn();
    render(<LoseModal isSending={false} error={undefined} onSubmit={onSubmit} />);
    const input = screen.getByPlaceholderText("username (опционально)");
    fireEvent.change(input, { target: { value: "user1" } });
    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);
    expect(onSubmit).toHaveBeenCalledWith("user1");
  });

  it("отправляет без username, если поле пустое", () => {
    const onSubmit = vi.fn();
    render(<LoseModal isSending={false} error={undefined} onSubmit={onSubmit} />);
    fireEvent.submit(document.querySelector("form") as HTMLFormElement);
    expect(onSubmit).toHaveBeenCalledWith(undefined);
  });

  it("показывает ошибку и состояние отправки", () => {
    render(<LoseModal isSending error="fail" onSubmit={vi.fn()} />);
    expect(screen.getByText("fail")).toBeInTheDocument();
    // Проверяем наличие текста "Отправляем" (может быть в кнопке и в loading div)
    const loadingElements = screen.getAllByText(/Отправляем/);
    expect(loadingElements.length).toBeGreaterThan(0);
  });
});

