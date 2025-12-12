import styles from "./Modal.module.css";

export interface DrawModalProps {
  onReset: () => void;
}

/**
 * DrawModal: уведомление о ничьей.
 */
function DrawModal({ onReset }: DrawModalProps) {
  return (
    <div className={`${styles.modal} ${styles.modalCentered}`}>
      <div className={styles.title}>🤝 Ничья</div>
      <div className={styles.content}>
        <p>Отличная игра! Попробуйте ещё раз.</p>
      </div>
      <button onClick={onReset} style={{ marginTop: 16, width: "100%" }}>
        Сыграть ещё
      </button>
    </div>
  );
}

export default DrawModal;

