import type React from "react";
import styles from "./Modal.module.css";

export interface LoseModalProps {
  isSending: boolean;
  error?: string;
  isSubmitted?: boolean;
  onSubmit: (username?: string) => void;
  onSkip: () => void;
  onReset: () => void;
}

/**
 * LoseModal: сообщение о проигрыше + опциональный username.
 */
function LoseModal({ isSending, error, isSubmitted, onSubmit, onSkip, onReset }: LoseModalProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") || "").trim().replace(/^@/, "");
    onSubmit(username || undefined);
  };

  return (
    <div className={`${styles.modal} ${isSubmitted ? styles.modalCentered : ''}`}>
      <div className={styles.content}>
        {!isSubmitted && (
          <p>При желании укажите username, чтобы бот отправил уведомление.</p>
        )}
      </div>
      {!isSubmitted && (
        <>
          <div className={styles.warning}>
            ⚠️ Важно: Сначала нажмите /start в{" "}
            <a href="https://t.me/xotestassignmentbot" target="_blank" rel="noopener noreferrer" className={styles.botLink}>
              боте
            </a>
            , чтобы он узнал ваш username!
          </div>
          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              name="username"
              placeholder="username (опционально)"
              disabled={isSending}
              pattern="[a-zA-Z0-9_]{5,32}"
              title="Username должен содержать только буквы, цифры и подчеркивания (5-32 символа)"
            />
            <button type="submit" disabled={isSending} style={{ width: "100%" }}>
              {isSending ? "Отправляем..." : "Отправить"}
            </button>
          </form>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSkip();
            }}
            disabled={isSending}
            style={{
              width: "100%",
              marginTop: "8px",
              backgroundColor: "var(--color-beige)",
              color: "var(--color-text-dark)",
              opacity: isSending ? 0.6 : 1,
            }}
          >
            Пропустить
          </button>
          {error && <div className={styles.error}>{error}</div>}
          {isSending && <div className={styles.loading}>Отправляем...</div>}
        </>
      )}
      {isSubmitted && (
        <button onClick={onReset} style={{ marginTop: 16, width: "100%" }}>
          Сыграть ещё
        </button>
      )}
    </div>
  );
}

export default LoseModal;

