import { CellValue } from "../state/gameStore";
import styles from "./Cell.module.css";

export interface CellProps {
  value: CellValue;
  onClick: () => void;
}

/**
 * Cell: кнопка поля 3×3.
 */
function Cell({ value, onClick }: CellProps) {
  return (
    <button
      onClick={onClick}
      className={styles.cell}
      aria-pressed={Boolean(value)}
      data-value={value || undefined}
      disabled={Boolean(value)}
    >
      {value || ""}
    </button>
  );
}

export default Cell;

