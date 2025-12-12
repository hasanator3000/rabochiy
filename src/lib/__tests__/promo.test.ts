import { generatePromoCode } from "../promo";

describe("promo", () => {
  it("генерирует код нужной длины и из допустимых символов", () => {
    const code = generatePromoCode(5);
    expect(code).toHaveLength(5);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  it("разные вызовы дают разные строки (частичный стох. тест)", () => {
    const c1 = generatePromoCode(5);
    const c2 = generatePromoCode(5);
    expect(c1).not.toBe(c2);
  });
});

