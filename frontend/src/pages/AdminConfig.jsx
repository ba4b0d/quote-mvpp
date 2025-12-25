import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE_URL || "/api";

const SETTINGS_SCHEMA = [
  { key: "electricity_rate_per_kwh", label: "نرخ برق (ریال / kWh)", type: "number", step: "1" },
  { key: "overhead_pct", label: "Overhead (درصد)", type: "number", step: "0.01" },
  { key: "markup_pct", label: "Markup (مثلاً 2 یعنی +200٪)", type: "number", step: "0.01" },
  { key: "coloring_cost_per_hour", label: "هزینه پست‌پروسس/رنگ (ریال/ساعت)", type: "number", step: "1" },
  { key: "estimate_infill_pct", label: "Estimate: infill %", type: "number", step: "0.01" },
  { key: "estimate_shell_overhead", label: "Estimate: shell overhead", type: "number", step: "0.01" },
  { key: "estimate_support_overhead", label: "Estimate: support overhead", type: "number", step: "0.01" },
  { key: "estimate_time_min_per_cm3", label: "Estimate: min/cm³", type: "number", step: "0.1" },
  { key: "estimate_time_fixed_min", label: "Estimate: زمان ثابت (دقیقه)", type: "number", step: "1" },
  { key: "estimate_mass_multiplier", label: "Estimate: ضریب جرم", type: "number", step: "0.01" },
];

const MATERIAL_FIELDS = [
  { key: "id", label: "ID", type: "text", placeholder: "pla_black" },
  { key: "name", label: "متریال", type: "text", placeholder: "PLA" },
  { key: "color", label: "رنگ", type: "text", placeholder: "Black / مشکی" },
  { key: "price_per_kg", label: "قیمت / کیلو", type: "number", step: "1" },
  { key: "waste_pct", label: "ضایعات (0-1)", type: "number", step: "0.01" },
  { key: "density_g_cm3", label: "چگالی (g/cm³)", type: "number", step: "0.01" },
  { key: "notes", label: "یادداشت", type: "text", placeholder: "" },
];

const MACHINE_FIELDS = [
  { key: "id", label: "ID", type: "text", placeholder: "kobra_s1" },
  { key: "name", label: "نام پرینتر", type: "text", placeholder: "Anycubic Kobra S1 combo" },
  { key: "power_w", label: "توان (W)", type: "number", step: "1" },
  { key: "purchase_price", label: "قیمت خرید", type: "number", step: "1" },
  { key: "life_hours", label: "عمر (ساعت)", type: "number", step: "1" },
  { key: "maintenance_pct", label: "نگهداری (0-1)", type: "number", step: "0.01" },
];

function safeParseNumber(val) {
  // Keep empty as empty string to allow editing
  if (val === "" || val === null || val === undefined) return "";
  const n = Number(val);
  return Number.isFinite(n) ? n : "";
}

function toNumberOrKeep(v) {
  if (v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function AdminConfig() {
  const nav = useNavigate();
  const token = localStorage.getItem("staff_token");
  const role = localStorage.getItem("staff_role");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [cfg, setCfg] = useState(null);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  async function loadConfig() {
    setErr("");
    setOk("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/config`, { headers });
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();

      // Normalize to avoid uncontrolled inputs
      const settings = j.settings || {};
      SETTINGS_SCHEMA.forEach((s) => {
        if (settings[s.key] === undefined) settings[s.key] = (s.type === "number" ? 0 : "");
      });

      const materials = Array.isArray(j.materials) ? j.materials : [];
      const machines = Array.isArray(j.machines) ? j.machines : [];

      setCfg({
        ...j,
        settings,
        materials: materials.map((m) => ({
          ...m,
          price_per_kg: safeParseNumber(m.price_per_kg),
          waste_pct: safeParseNumber(m.waste_pct),
          density_g_cm3: safeParseNumber(m.density_g_cm3),
          // optional flags (safe even if backend ignores)
          is_public: m.is_public ?? false,
          is_active: m.is_active ?? true,
        })),
        machines: machines.map((mc) => ({
          ...mc,
          power_w: safeParseNumber(mc.power_w),
          purchase_price: safeParseNumber(mc.purchase_price),
          life_hours: safeParseNumber(mc.life_hours),
          maintenance_pct: safeParseNumber(mc.maintenance_pct),
          is_active: mc.is_active ?? true,
        })),
      });
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    if (!cfg) return;
    setErr("");
    setOk("");
    setSaving(true);
    try {
      // Prepare payload with numbers
      const payload = {
        ...cfg,
        settings: { ...cfg.settings },
        materials: (cfg.materials || []).map((m) => ({
          ...m,
          price_per_kg: toNumberOrKeep(m.price_per_kg),
          waste_pct: toNumberOrKeep(m.waste_pct),
          density_g_cm3: toNumberOrKeep(m.density_g_cm3),
        })),
        machines: (cfg.machines || []).map((mc) => ({
          ...mc,
          power_w: toNumberOrKeep(mc.power_w),
          purchase_price: toNumberOrKeep(mc.purchase_price),
          life_hours: toNumberOrKeep(mc.life_hours),
          maintenance_pct: toNumberOrKeep(mc.maintenance_pct),
        })),
      };

      const res = await fetch(`${API}/admin/config`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      setOk("✅ ذخیره شد (بکاپ هم ساخته شد).");
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  }

  function updateSetting(key, value) {
    setCfg((prev) => ({
      ...prev,
      settings: { ...(prev?.settings || {}), [key]: value },
    }));
  }

  function updateMaterial(idx, key, value) {
    setCfg((prev) => {
      const next = { ...prev };
      const arr = [...(next.materials || [])];
      arr[idx] = { ...arr[idx], [key]: value };
      next.materials = arr;
      return next;
    });
  }

  function addMaterial() {
    setCfg((prev) => ({
      ...prev,
      materials: [
        ...(prev?.materials || []),
        {
          id: "",
          name: "",
          color: "",
          price_per_kg: "",
          waste_pct: 0.05,
          density_g_cm3: 1.24,
          notes: "",
          is_public: false,
          is_active: true,
        },
      ],
    }));
  }

  function removeMaterial(idx) {
    if (!confirm("این متریال حذف شود؟")) return;
    setCfg((prev) => {
      const next = { ...prev };
      next.materials = (next.materials || []).filter((_, i) => i !== idx);
      return next;
    });
  }

  function updateMachine(idx, key, value) {
    setCfg((prev) => {
      const next = { ...prev };
      const arr = [...(next.machines || [])];
      arr[idx] = { ...arr[idx], [key]: value };
      next.machines = arr;
      return next;
    });
  }

  function addMachine() {
    setCfg((prev) => ({
      ...prev,
      machines: [
        ...(prev?.machines || []),
        {
          id: "",
          name: "",
          power_w: "",
          purchase_price: "",
          life_hours: "",
          maintenance_pct: 0.1,
          is_active: true,
        },
      ],
    }));
  }

  function removeMachine(idx) {
    if (!confirm("این پرینتر حذف شود؟")) return;
    setCfg((prev) => {
      const next = { ...prev };
      next.machines = (next.machines || []).filter((_, i) => i !== idx);
      return next;
    });
  }

  useEffect(() => {
    if (!token) nav("/staff/login", { replace: true });
    else if (role !== "admin") nav("/staff", { replace: true });
    else loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page" dir="rtl" lang="fa">
      <div className="wrap">
        <header className="hero">
          <div className="hero__badgeRow">
            <button className="btn btn--ghost" onClick={() => nav("/staff", { replace: true })}>Staff</button>
            <button className="btn btn--ghost" onClick={() => nav("/", { replace: true })}>Public</button>
            <div className="hero__badge">پنل ادمین</div>
          </div>

          <h1 className="hero__title">مدیریت کانفیگ</h1>
          <p className="hero__sub">قیمت‌ها و متریال‌ها را راحت و بدون JSON خام ادیت کن.</p>
        </header>

        {err && (
          <div className="alert">
            <div className="alert__title">خطا</div>
            <div className="alert__text">{err}</div>
          </div>
        )}
        {ok && (
          <div className="alert" style={{ borderColor: "rgba(79,125,99,.35)" }}>
            <div className="alert__title">موفق</div>
            <div className="alert__text">{ok}</div>
          </div>
        )}

        <section className="panel">
          <div className="panel__inner">
            <div className="actions" style={{ justifyContent: "flex-end", marginBottom: 10 }}>
              <button className="btn btn--ghost" onClick={loadConfig} disabled={loading}>
                {loading ? "در حال لود…" : "بازخوانی"}
              </button>

              <button className="btn btn--primary" onClick={saveConfig} disabled={saving || !cfg}>
                {saving ? "در حال ذخیره…" : "ذخیره تغییرات"}
              </button>
            </div>

            {!cfg ? (
              <div className="hint">کانفیگ لود نشده.</div>
            ) : (
              <>
                {/* SETTINGS */}
                <div className="card" style={{ marginBottom: 14 }}>
                  <div className="card__title" style={{ fontWeight: 800 }}>تنظیمات</div>
                  <div className="grid" style={{ marginTop: 10 }}>
                    {SETTINGS_SCHEMA.map((s) => (
                      <div className="field" key={s.key}>
                        <label className="label">{s.label}</label>
                        <input
                          className="input"
                          type={s.type}
                          step={s.step}
                          value={cfg.settings?.[s.key] ?? ""}
                          onChange={(e) => updateSetting(s.key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* MATERIALS */}
                <div className="card" style={{ marginBottom: 14 }}>
                  <div className="card__title" style={{ fontWeight: 800, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <span>متریال‌ها</span>
                    <button className="btn btn--ghost" type="button" onClick={addMaterial}>+ افزودن متریال</button>
                  </div>

                  <div style={{ marginTop: 10, display: "grid", gap: 12 }}>
                    {(cfg.materials || []).map((m, idx) => (
                      <div key={idx} className="panel" style={{ background: "rgba(255,255,255,.06)" }}>
                        <div className="panel__inner">
                          <div className="actions" style={{ justifyContent: "space-between", marginBottom: 10 }}>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <label className="hint" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                <input
                                  type="checkbox"
                                  checked={!!m.is_active}
                                  onChange={(e) => updateMaterial(idx, "is_active", e.target.checked)}
                                />
                                فعال
                              </label>
                              <label className="hint" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                <input
                                  type="checkbox"
                                  checked={!!m.is_public}
                                  onChange={(e) => updateMaterial(idx, "is_public", e.target.checked)}
                                />
                                نمایش در Public
                              </label>
                            </div>

                            <button className="btn btn--ghost" type="button" onClick={() => removeMaterial(idx)}>
                              حذف
                            </button>
                          </div>

                          <div className="grid">
                            {MATERIAL_FIELDS.map((f) => (
                              <div className="field" key={f.key}>
                                <label className="label">{f.label}</label>
                                <input
                                  className="input"
                                  type={f.type}
                                  step={f.step}
                                  placeholder={f.placeholder}
                                  value={m?.[f.key] ?? ""}
                                  onChange={(e) => updateMaterial(idx, f.key, e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hint" style={{ marginTop: 10 }}>
                    نکته: اگر Public را فقط PLA/PETG/TPU می‌خواهی، کافیست فقط همین‌ها را “نمایش در Public” کنی.
                  </div>
                </div>

                {/* MACHINES */}
                <div className="card">
                  <div className="card__title" style={{ fontWeight: 800, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <span>پرینترها</span>
                    <button className="btn btn--ghost" type="button" onClick={addMachine}>+ افزودن پرینتر</button>
                  </div>

                  <div style={{ marginTop: 10, display: "grid", gap: 12 }}>
                    {(cfg.machines || []).map((mc, idx) => (
                      <div key={idx} className="panel" style={{ background: "rgba(255,255,255,.06)" }}>
                        <div className="panel__inner">
                          <div className="actions" style={{ justifyContent: "space-between", marginBottom: 10 }}>
                            <label className="hint" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                              <input
                                type="checkbox"
                                checked={!!mc.is_active}
                                onChange={(e) => updateMachine(idx, "is_active", e.target.checked)}
                              />
                              فعال
                            </label>

                            <button className="btn btn--ghost" type="button" onClick={() => removeMachine(idx)}>
                              حذف
                            </button>
                          </div>

                          <div className="grid">
                            {MACHINE_FIELDS.map((f) => (
                              <div className="field" key={f.key}>
                                <label className="label">{f.label}</label>
                                <input
                                  className="input"
                                  type={f.type}
                                  step={f.step}
                                  placeholder={f.placeholder}
                                  value={mc?.[f.key] ?? ""}
                                  onChange={(e) => updateMachine(idx, f.key, e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <div className="hint" style={{ marginTop: 10 }}>
          اگر بعداً خواستی، می‌تونیم “قیمت‌گذاری Rule-based” و “ایمپورت/اکسپورت Excel” هم اضافه کنیم.
        </div>
      </div>
    </div>
  );
}
