import { render, screen, fireEvent } from "@testing-library/react";
import WinModal from "../WinModal";

describe("WinModal", () => {
  it("показывает промокод и валидирует username", () => {
    const onSubmit = vi.fn();
    render(<WinModal promoCode="ABCDE" isSending={false} error={undefined} onSubmit={onSubmit} />);
    expect(screen.getByText(/ABCDE/)).toBeInTheDocument();
    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("вызывает onSubmit с введенным username", () => {
    const onSubmit = vi.fn();
    render(<WinModal promoCode="ABCDE" isSending={false} error={undefined} onSubmit={onSubmit} />);
    const input = screen.getByPlaceholderText("username");
    fireEvent.change(input, { target: { value: "testuser" } });
    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);
    expect(onSubmit).toHaveBeenCalledWith("testuser");
  });

  it("показывает ошибку и состояние отправки", () => {
    const { rerender } = render(
      <WinModal promoCode="ABCDE" isSending error="err" onSubmit={vi.fn()} />,
    );
    expect(screen.getByText("err")).toBeInTheDocument();
    // Проверяем наличие текста "Отправляем" (может быть в кнопке и в loading div)
    const loadingElements = screen.getAllByText(/Отправляем/);
    expect(loadingElements.length).toBeGreaterThan(0);
    rerender(<WinModal promoCode="ABCDE" isSending={false} error={undefined} onSubmit={vi.fn()} />);
  });
});

