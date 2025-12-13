/**
 * sendResult: отправляет результат партии на backend `/api/send`.
 */
export async function sendResult(payload: {
  status: "win" | "lose";
  code?: string;
  username?: string;
}): Promise<{ ok: boolean; error?: string; reason?: string }> {
const apiUrl = import.meta.env.VITE_API_URL || "https://rabochiy-production.up.railway.app";  const url = `${apiUrl}/send`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      return { ok: false, error: errorData.error || res.statusText, reason: errorData.reason };
    }

    return await res.json();
  } catch (error) {
    console.error("Failed to send result:", error);
    return { ok: false, error: "network_error" };
  }
}

