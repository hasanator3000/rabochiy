/**
 * getWinner: возвращает 'X' | 'O' при найденной линии, иначе null.
 */
export function getWinner(board: Array<"X" | "O" | null>): "X" | "O" | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

/**
 * isDraw: проверяет, что все клетки заняты и нет победителя.
 */
export function isDraw(board: Array<"X" | "O" | null>): boolean {
  return board.every(Boolean) && !getWinner(board);
}

/**
 * findWinningMove: проверяет, может ли игрок выиграть следующим ходом.
 */
function findWinningMove(
  board: Array<"X" | "O" | null>,
  player: "X" | "O"
): number | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [a, b, c] of lines) {
    const values = [board[a], board[b], board[c]];
    const playerCount = values.filter((v) => v === player).length;
    const emptyCount = values.filter((v) => v === null).length;

    if (playerCount === 2 && emptyCount === 1) {
      // Найдена линия с двумя фигурами игрока и одной пустой клеткой
      if (board[a] === null) return a;
      if (board[b] === null) return b;
      if (board[c] === null) return c;
    }
  }
  return null;
}

/**
 * pickAiMove: выбирает индекс хода ИИ с приоритетной стратегией:
 * 1. Выигрыш (если можно выиграть)
 * 2. Блокировка (если игрок может выиграть)
 * 3. Центр (если свободен)
 * 4. Углы (если свободны)
 * 5. Случайный ход
 */
export function pickAiMove(board: Array<"X" | "O" | null>): number | null {
  const empty = board
    .map((cell, idx) => (cell === null ? idx : null))
    .filter((v): v is number => v !== null);
  if (empty.length === 0) return null;

  // 1. Попытка выиграть
  const winningMove = findWinningMove(board, "O");
  if (winningMove !== null) return winningMove;

  // 2. Блокировка выигрыша игрока
  const blockingMove = findWinningMove(board, "X");
  if (blockingMove !== null) return blockingMove;

  // 3. Центр (индекс 4)
  if (board[4] === null) return 4;

  // 4. Углы (приоритет: 0, 2, 6, 8)
  const corners = [0, 2, 6, 8];
  const availableCorners = corners.filter((idx) => board[idx] === null);
  if (availableCorners.length > 0) {
    return availableCorners[Math.floor(Math.random() * availableCorners.length)];
  }

  // 5. Случайный ход из оставшихся
  return empty[Math.floor(Math.random() * empty.length)];
}

