import { useMemo, useState, useEffect } from "react";
import Board from "./components/Board";
import StatusBar from "./components/StatusBar";
import WinModal from "./components/WinModal";
import LoseModal from "./components/LoseModal";
import DrawModal from "./components/DrawModal";
import { createGameStore } from "./state/gameStore";
import styles from "./App.module.css";

/**
 * App: корневой компонент игры.
 */
function App() {
  const store = useMemo(() => createGameStore(), []);
  const [, force] = useState(0);
  const rerender = () => force((x) => x + 1);

  // Подписка на изменения состояния игры
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      rerender();
    });
    return unsubscribe;
  }, [store]);

  const state = store.state;

  const handleCellClick = (index: number) => {
    store.makeMove(index);
  };

  const handleReset = () => {
    store.reset();
  };

  const handleStart = () => {
    store.reset();
  };

  const handleSubmitWin = async (username: string) => {
    await store.submitWin(username);
  };

  const handleSubmitLose = async (username?: string) => {
    await store.submitLose(username);
  };

  const handleSkipWin = () => {
    store.skipWin();
  };

  const handleSkipLose = () => {
    store.skipLose();
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Крестики‑нолики</h1>
        <p className={styles.subtitle}>Играйте против компьютера и получайте промокоды!</p>
      </header>

      {state.status === "idle" ? (
        <div className={styles.startScreen}>
          <h2>Добро пожаловать!</h2>
          <p>
            Сыграйте в классическую игру крестики-нолики против умного компьютера.
            При победе вы получите промокод, который будет отправлен в Telegram-бот.
          </p>
          <button className={styles.startButton} onClick={handleStart}>
            Начать игру
          </button>
        </div>
      ) : (
        <div className={styles.gameArea}>
          <StatusBar status={state.status} currentPlayer={state.currentPlayer} />
          <Board board={state.board} onCellClick={handleCellClick} />
          {state.status === "win" && (
            <WinModal
              promoCode={state.promoCode}
              isSending={state.isSending}
              error={state.error}
              isSubmitted={state.isSubmitted}
              onSubmit={handleSubmitWin}
              onSkip={handleSkipWin}
              onReset={handleReset}
            />
          )}
          {state.status === "lose" && (
            <LoseModal
              isSending={state.isSending}
              error={state.error}
              isSubmitted={state.isSubmitted}
              onSubmit={handleSubmitLose}
              onSkip={handleSkipLose}
              onReset={handleReset}
            />
          )}
          {state.status === "draw" && <DrawModal onReset={handleReset} />}
        </div>
      )}
    </div>
  );
}

export default App;

