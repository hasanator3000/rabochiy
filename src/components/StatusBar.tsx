import styles from "./StatusBar.module.css";

export interface StatusBarProps {
  status: "idle" | "playing" | "win" | "lose" | "draw";
  currentPlayer: "X" | "O";
}

/**
 * StatusBar: показывает ход и состояние партии.
 */
function StatusBar({ status, currentPlayer }: StatusBarProps) {
  const statusText: Record<StatusBarProps["status"], string> = {
    idle: "Готово к игре",
    playing: `Ход: ${currentPlayer}`,
    win: "🎉 Победа!",
    lose: "😔 Проигрыш",
    draw: "🤝 Ничья",
  };
  return (
    <div className={styles.statusBar} data-status={status} aria-live="polite" role="status">
      {statusText[status]}
    </div>
  );
}

export default StatusBar;

