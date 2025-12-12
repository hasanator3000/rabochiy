import { render, screen, fireEvent } from "@testing-library/react";
import DrawModal from "../DrawModal";

describe("DrawModal", () => {
  it("дергает onReset", () => {
    const onReset = vi.fn();
    render(<DrawModal onReset={onReset} />);
    fireEvent.click(screen.getByText("Сыграть ещё"));
    expect(onReset).toHaveBeenCalled();
  });
});

