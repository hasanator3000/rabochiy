import { render, screen } from "@testing-library/react";
import StatusBar from "../StatusBar";

const cases: Array<Parameters<typeof StatusBar>[0]> = [
  { status: "idle", currentPlayer: "X" },
  { status: "playing", currentPlayer: "O" },
  { status: "win", currentPlayer: "X" },
  { status: "lose", currentPlayer: "O" },
  { status: "draw", currentPlayer: "X" },
];

describe("StatusBar", () => {
  it("отображает текст для каждого состояния", () => {
    cases.forEach((props) => {
      const { unmount, container } = render(<StatusBar {...props} />);
      // Проверяем наличие элемента
      const statusBar = screen.getByRole("status");
      expect(statusBar).toBeInTheDocument();
      
      // Проверяем, что текст присутствует (может содержать эмодзи)
      const text = statusBar.textContent || container.textContent || "";
      expect(text.trim().length).toBeGreaterThan(0);
      
      // Проверяем конкретные тексты для каждого состояния
      if (props.status === "idle") {
        expect(text).toContain("Готово");
      } else if (props.status === "playing") {
        expect(text).toContain("Ход");
      } else if (props.status === "win") {
        expect(text).toMatch(/Победа|🎉/);
      } else if (props.status === "lose") {
        expect(text).toMatch(/Проигрыш|😔/);
      } else if (props.status === "draw") {
        expect(text).toMatch(/Ничья|🤝/);
      }
      
      unmount();
    });
  });
});

