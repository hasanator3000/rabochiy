/**
 * Shared in-memory map для хранения связи username → chat_id.
 * Используется как ботом, так и API endpoint.
 */
export const usernameToChatId = new Map<string, number>();

/**
 * resolveChatId: возвращает chat_id по username, если известен.
 */
export function resolveChatId(username: string): number | undefined {
  return usernameToChatId.get(username);
}

/**
 * setChatId: сохраняет связь username → chat_id.
 */
export function setChatId(username: string, chatId: number): void {
  usernameToChatId.set(username, chatId);
}

