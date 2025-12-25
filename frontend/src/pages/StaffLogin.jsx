import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE_URL || "/api";

export default function StaffLogin() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error(await res.text());

      const j = await res.json();

      // token + role
      localStorage.setItem("staff_token", j.access_token);
      localStorage.setItem("staff_role", j.role || "staff");
      if (j.username) localStorage.setItem("staff_username", j.username);

      // go to admin if admin
      const target = (j.role === "admin") ? "/admin" : "/staff";
      nav(target, { replace: true });
    } catch (e2) {
      setErr(String(e2?.message || e2));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page" dir="rtl" lang="fa">
      <div className="wrap">
        <header className="hero">
          <div className="hero__badge">3DJAT • ورود کارکنان</div>
          <h1 className="hero__title">ورود داخلی</h1>
          <p className="hero__sub">برای دسترسی به پنل داخلی وارد شوید.</p>
        </header>

        {err && (
          <div className="alert">
            <div className="alert__title">خطا</div>
            <div className="alert__text">{err}</div>
          </div>
        )}

        <section className="panel">
          <div className="panel__inner">
            <form onSubmit={onSubmit} className="grid">
              <div className="field field--full">
                <label className="label">نام کاربری</label>
                <input
                  className="input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>

              <div className="field field--full">
                <label className="label">رمز عبور</label>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <div className="actions" style={{ gridColumn: "1 / -1" }}>
                <button className="btn btn--primary" disabled={loading} type="submit">
                  {loading ? "در حال ورود…" : "ورود"}
                </button>

                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("staff_token");
                    localStorage.removeItem("staff_role");
                    localStorage.removeItem("staff_username");
                    nav("/", { replace: true });
                  }}
                >
                  بازگشت
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
