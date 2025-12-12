import { getWinner, isDraw, pickAiMove } from "../lib/gameLogic";
import { generatePromoCode } from "../lib/promo";
import { sendResult } from "../lib/api";

export type CellValue = "X" | "O" | null;
export type GameStatus = "idle" | "playing" | "win" | "lose" | "draw";

export interface GameState {
  board: CellValue[];
  currentPlayer: "X" | "O";
  status: GameStatus;
  promoCode?: string;
  username?: string;
  isSending: boolean;
  error?: string;
  isSubmitted?: boolean;
}

type Subscriber = () => void;

/**
 * createGameStore: простая in-memory модель игры с методами переходов и реактивными подписками.
 */
export function createGameStore() {
  const state: GameState = {
    board: Array<CellValue>(9).fill(null),
    currentPlayer: "X",
    status: "idle",
    promoCode: undefined,
    username: undefined,
    isSending: false,
    error: undefined,
    isSubmitted: false,
  };

  const subscribers = new Set<Subscriber>();

  const notify = () => {
    subscribers.forEach((subscriber) => subscriber());
  };

  const setState = (next: Partial<GameState>) => {
    Object.assign(state, next);
    notify();
  };

  /**
   * subscribe: подписывается на изменения состояния игры.
   * @returns функция для отписки
   */
  const subscribe = (callback: Subscriber): (() => void) => {
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  };

  const reset = () => {
    setState({
      board: Array<CellValue>(9).fill(null),
      currentPlayer: "X",
      status: "playing",
      promoCode: undefined,
      error: undefined,
      isSubmitted: false,
    });
  };

  let isProcessingMove = false;

  const makeMove = async (index: number) => {
    // Защита от одновременных вызовов
    if (isProcessingMove) return;
    if (state.status !== "playing" || state.board[index]) return;
    
    isProcessingMove = true;
    
    try {
      const board = [...state.board];
      board[index] = state.currentPlayer;
      const winner = getWinner(board);
      if (winner === "X") {
        const promoCode = generatePromoCode();
        setState({ board, status: "win", promoCode, currentPlayer: "O", isSubmitted: false, error: undefined, isSending: false });
        return;
      }
      if (isDraw(board)) {
        setState({ board, status: "draw", currentPlayer: "O" });
        return;
      }
      
      // Обновляем состояние с ходом пользователя
      setState({ board, currentPlayer: "O" });
      
      // Задержка перед ходом компьютера
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Проверяем статус игры после задержки и используем актуальное состояние
      if (state.status !== "playing") return;
      
      // Используем актуальное состояние доски для выбора хода компьютера
      const currentBoard = [...state.board];
      const aiMove = pickAiMove(currentBoard);
      
      // Проверяем, что выбранная ячейка свободна (на случай, если игрок успел кликнуть)
      if (aiMove !== null && currentBoard[aiMove] === null) {
        currentBoard[aiMove] = "O";
        const aiWinner = getWinner(currentBoard);
        if (aiWinner === "O") {
          setState({ board: currentBoard, status: "lose", currentPlayer: "X", isSubmitted: false, error: undefined, isSending: false });
          return;
        }
        if (isDraw(currentBoard)) {
          setState({ board: currentBoard, status: "draw", currentPlayer: "X" });
          return;
        }
        setState({ board: currentBoard, currentPlayer: "X" });
      } else if (aiMove === null) {
        // Если компьютер не может сделать ход, проверяем ничью
        if (isDraw(currentBoard)) {
          setState({ board: currentBoard, status: "draw", currentPlayer: "X" });
        }
      }
    } finally {
      isProcessingMove = false;
    }
  };

  const submitWin = async (username: string) => {
    if (state.status !== "win" || !state.promoCode) return;
    setState({ isSending: true, error: undefined, username });
    const result = await sendResult({ status: "win", code: state.promoCode, username });
    if (!result.ok) {
      setState({
        isSending: false,
        error:
          result.reason === "chat_not_found"
            ? "Сначала нажмите /start в боте, чтобы он узнал ваш username."
            : result.error || "Не удалось отправить сообщение",
      });
      return;
    }
    // После успешной отправки показываем кнопку "Сыграть ещё"
    setState({ 
      isSending: false,
      isSubmitted: true,
      error: undefined,
    });
  };

  const submitLose = async (username?: string) => {
    setState({ isSending: true, error: undefined, username });
    const result = await sendResult({ status: "lose", username });
    if (!result.ok) {
      setState({
        isSending: false,
        error: result.error || "Не удалось отправить сообщение",
      });
      return;
    }
    // После успешной отправки показываем кнопку "Сыграть ещё"
    setState({ isSending: false, isSubmitted: true });
  };

  const skipLose = () => {
    // При отказе от отправки сразу показываем кнопку "Сыграть ещё"
    setState({ isSubmitted: true, error: undefined, isSending: false });
  };

  const skipWin = () => {
    // При отказе от отправки сразу показываем кнопку "Сыграть ещё"
    setState({ isSubmitted: true, error: undefined, isSending: false });
  };

  return {
    state,
    subscribe,
    reset,
    makeMove,
    submitWin,
    submitLose,
    skipLose,
    skipWin,
  };
}

