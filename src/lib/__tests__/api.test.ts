import { sendResult } from "../api";

describe("api.sendResult", () => {
  it("возвращает ok при успешном ответе", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    } as Response);
    const res = await sendResult({ status: "lose" });
    expect(res.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/send",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("возвращает ошибку при неуспешном статусе", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    const res = await sendResult({ status: "win", code: "ABC", username: "u" });
    expect(res.ok).toBe(false);
    expect(res.error).toBe("network_error");
  });
});

