import Cell from "./Cell";
import { CellValue } from "../state/gameStore";
import styles from "./Board.module.css";

export interface BoardProps {
  board: CellValue[];
  onCellClick: (index: number) => void;
}

/**
 * Board: сетка 3×3, передаёт клики наружу.
 */
function Board({ board, onCellClick }: BoardProps) {
  return (
    <div className={styles.board}>
      {board.map((cell, idx) => (
        <Cell key={idx} value={cell} onClick={() => onCellClick(idx)} />
      ))}
    </div>
  );
}

export default Board;

