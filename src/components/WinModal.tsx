import type React from "react";
import styles from "./Modal.module.css";

export interface WinModalProps {
  promoCode?: string;
  isSending: boolean;
  error?: string;
  isSubmitted?: boolean;
  onSubmit: (username: string) => void;
  onSkip: () => void;
  onReset: () => void;
}

/**
 * WinModal: ввод username и показ промокода.
 */
function WinModal({ promoCode, isSending, error, isSubmitted, onSubmit, onSkip, onReset }: WinModalProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") || "").trim().replace(/^@/, "");
    if (!username) return;
    onSubmit(username);
  };

  return (
    <div className={styles.modal}>
      <div className={styles.content}>
        <p>Ваш промокод:</p>
        <div className={styles.promoCode}>{promoCode || "XXXXX"}</div>
        {!isSubmitted ? (
          <>
            <p>Введите свой Telegram username (без @), чтобы бот отправил код.</p>
          </>
        ) : (
          <p>Промокод отправлен!</p>
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
              placeholder="username"
              disabled={isSending}
              required
              pattern="[a-zA-Z0-9_]{5,32}"
              title="Username должен содержать только буквы, цифры и подчеркивания (5-32 символа)"
            />
            <button type="submit" disabled={isSending} style={{ width: "100%" }}>
              {isSending ? "Отправляем..." : "Отправить"}
            </button>
          </form>
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

export default WinModal;

