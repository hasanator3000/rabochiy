const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * generatePromoCode: создает псевдослучайный код нужной длины.
 */
export function generatePromoCode(length = 5): string {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

