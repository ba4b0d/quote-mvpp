import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL || "http://192.168.100.21:8000";
console.log("API BASE =", API);

// ---------- Helpers ----------
const toman = (v) => Number(v || 0).toLocaleString("fa-IR");

function fmtDurationFromMinutes(min) {
  const m = Math.max(0, Math.round(Number(min || 0)));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h <= 0) return `${r} دقیقه`;
  return `${h} ساعت و ${r} دقیقه`;
}

// ---------- App ----------
export default function App() {
  const [tab, setTab] = useState("manual"); // manual | upload

  const [materialGroups, setMaterialGroups] = useState([]);
  const [machines, setMachines] = useState([]);

  const [groupId, setGroupId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [machineId, setMachineId] = useState("");

  // manual inputs
  const [qty, setQty] = useState(1);
  const [grams, setGrams] = useState("");
  const [minutes, setMinutes] = useState("");
  const [postProHours, setPostProHours] = useState("0");
  const [extras, setExtras] = useState("0");

  // upload inputs (حدودی با /estimate)
  const [upQty, setUpQty] = useState(1);
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState("normal"); // draft|normal|fine
  const [progress, setProgress] = useState(0);

  const [estGrams, setEstGrams] = useState(null);     // per one
  const [estMinutes, setEstMinutes] = useState(null); // per one

  const [total, setTotal] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------- Debug Panel (راه 2) ----------
  const [debugOpen, setDebugOpen] = useState(true);
  const [debugLines, setDebugLines] = useState([]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";

  const log = (msg) => {
    setDebugLines((p) => {
      const line = `${new Date().toLocaleTimeString()}  ${msg}`;
      return [line, ...p].slice(0, 80);
    });
  };

  async function safeFetch(url, opts) {
    log(`FETCH → ${opts?.method || "GET"} ${url}`);
    try {
      const res = await fetch(url, opts);
      log(`RESP  ← ${res.status} ${res.statusText} (${url})`);
      return res;
    } catch (e) {
      log(`FETCH FAIL: ${String(e?.message || e)} (${url})`);
      throw e;
    }
  }
  // ----------------------------------------

  // Load dropdown data
  useEffect(() => {
    (async () => {
      setErr("");
      log(`API_BASE = ${API}`);
      log(`ORIGIN  = ${origin}`);

      // health ping
      try {
        const h = await safeFetch(`${API}/health`);
        const hj = await h.json().catch(() => ({}));
        log(`HEALTH OK: ${JSON.stringify(hj)}`);
      } catch (e) {
        log(`HEALTH FAIL: ${String(e?.message || e)}`);
      }

      const [mgRes, mcRes] = await Promise.all([
        safeFetch(`${API}/material-groups`),
        safeFetch(`${API}/machines`),
      ]);

      if (!mgRes.ok) throw new Error(await mgRes.text());
      if (!mcRes.ok) throw new Error(await mcRes.text());

      const mg = await mgRes.json();
      const mc = await mcRes.json();

      const groups = mg.material_groups || [];
      setMaterialGroups(groups);
      setMachines(mc || []);

      const firstGroup = groups[0];
      const firstOption = firstGroup?.options?.[0];

      setGroupId(firstGroup?.group_id || "");
      setMaterialId(firstOption?.id || "");
      setMachineId((mc?.[0]?.id) || "");
    })().catch((e) => {
      setErr(String(e?.message || e));
      log(`INIT ERROR: ${String(e?.message || e)}`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedGroup = useMemo(
    () => materialGroups.find((g) => g.group_id === groupId),
    [materialGroups, groupId]
  );

  useEffect(() => {
    if (!selectedGroup) return;
    const first = selectedGroup.options?.[0];
    if (first?.id) setMaterialId(first.id);
  }, [groupId]); // eslint-disable-line react-hooks/exhaustive-deps

  const canManualCalc = useMemo(() => {
    return (
      materialId &&
      machineId &&
      Number(qty) >= 1 &&
      Number(grams) >= 0 &&
      Number(minutes) >= 0
    );
  }, [materialId, machineId, qty, grams, minutes]);

  const canUploadCalc = useMemo(() => {
    return materialId && machineId && Number(upQty) >= 1 && !!file;
  }, [materialId, machineId, upQty, file]);

  async function quote({ q, gramsPerOne, minutesPerOne, postHours, extraT }) {
    const body = {
      material_id: materialId,
      machine_id: machineId,
      qty: Number(q || 1),
      filament_grams: Number(gramsPerOne || 0),
      print_time_minutes: Number(minutesPerOne || 0),
      post_pro_hours: Number(postHours || 0),
      extras: Number(extraT || 0),
    };

    log(`QUOTE BODY: ${JSON.stringify(body)}`);

    const res = await safeFetch(`${API}/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  }

  // /estimate (multipart) -> { estimated_grams, estimated_minutes, ... }
  async function estimateFromApi(fileObj, materialId, quality) {
    const fd = new FormData();
    fd.append("file", fileObj);
    fd.append("material_id", materialId);
    fd.append("quality", quality);

    // مهم: Content-Type رو دستی ست نکن
    const res = await safeFetch(`${API}/estimate`, {
      method: "POST",
      body: fd,
    });

    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  }

  async function calcManual() {
    setErr("");
    setTotal(null);
    setLoading(true);

    try {
      const data = await quote({
        q: qty,
        gramsPerOne: grams,
        minutesPerOne: minutes,
        postHours: postProHours,
        extraT: extras,
      });

      setTotal(data?.Total ?? null);
      log(`MANUAL OK Total=${data?.Total}`);
    } catch (e) {
      setErr(e?.message || String(e));
      log(`MANUAL FAIL: ${String(e?.message || e)}`);
    } finally {
      setLoading(false);
    }
  }

  async function estimateAndCalcUpload() {
    setErr("");
    setTotal(null);
    setEstGrams(null);
    setEstMinutes(null);
    setProgress(0);
    setLoading(true);

    try {
      setProgress(10);

      const est = await estimateFromApi(file, materialId, quality);
      setProgress(65);

      const g1 = Number(est?.estimated_grams || 0);     // per one
      const m1 = Number(est?.estimated_minutes || 0);   // per one

      setEstGrams(g1);
      setEstMinutes(m1);
      log(`EST OK grams=${g1} min=${m1}`);

      const data = await quote({
        q: upQty,
        gramsPerOne: g1,
        minutesPerOne: m1,
        postHours: 0,
        extraT: 0,
      });

      setTotal(data?.Total ?? null);
      setProgress(100);
      log(`UPLOAD OK Total=${data?.Total}`);
    } catch (e) {
      setErr(e?.message || String(e));
      log(`UPLOAD FAIL: ${String(e?.message || e)}`);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page" dir="rtl" lang="fa">
      <div className="wrap">
        <header className="hero">
          <div className="hero__badge">3DJAT • محاسبه‌گر قیمت</div>
          <h1 className="hero__title">برآورد سریع قیمت چاپ سه‌بعدی</h1>
          <p className="hero__sub">
            دستی (دقیق‌تر) یا آپلود STL (حدودی). در آپلود، تخمین زمان/وزن از بک‌اند
            گرفته می‌شود تا با Swagger یکی باشد.
          </p>
        </header>

        {/* Debug Panel */}
        <section className="card" style={{ marginBottom: 14 }}>
          <div style={{ padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div style={{ fontWeight: 900 }}>دیباگ (روی گوشی)</div>
              <button className="btn btn--ghost" type="button" onClick={() => setDebugOpen((s) => !s)}>
                {debugOpen ? "بستن" : "باز کردن"}
              </button>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85, lineHeight: 1.8 }}>
              <div><b>API_BASE:</b> {API}</div>
              <div><b>ORIGIN:</b> {origin}</div>
              <div><b>User-Agent:</b> {ua}</div>
            </div>

            {debugOpen && (
              <>
                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn btn--ghost" type="button" onClick={() => setDebugLines([])}>
                    پاک کردن لاگ
                  </button>
                  <button
                    className="btn btn--primary"
                    type="button"
                    onClick={async () => {
                      setErr("");
                      try {
                        const res = await safeFetch(`${API}/health`);
                        const j = await res.json().catch(() => ({}));
                        log(`PING OK: ${JSON.stringify(j)}`);
                      } catch (e) {
                        setErr(e?.message || String(e));
                      }
                    }}
                  >
                    Ping /health
                  </button>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    maxHeight: 220,
                    overflow: "auto",
                    background: "#111",
                    color: "#d7ffd7",
                    borderRadius: 12,
                    padding: 10,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    fontSize: 12,
                    direction: "ltr",
                    textAlign: "left",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {debugLines.length ? debugLines.join("\n") : "No logs yet..."}
                </div>
              </>
            )}
          </div>
        </section>

        {err && (
          <div className="alert">
            <div className="alert__title">خطا</div>
            <div className="alert__text">{err}</div>
          </div>
        )}

        <section className="panel">
          <div className="panel__inner">
            <div className="tabs">
              <button
                className={`tab ${tab === "manual" ? "tab--active" : ""}`}
                onClick={() => {
                  setTab("manual");
                  setTotal(null);
                  setErr("");
                }}
                type="button"
              >
                دستی <span className="pill pill--solid">دقیق‌تر</span>
              </button>

              <button
                className={`tab ${tab === "upload" ? "tab--active" : ""}`}
                onClick={() => {
                  setTab("upload");
                  setTotal(null);
                  setErr("");
                }}
                type="button"
              >
                آپلود STL <span className="pill">حدودی</span>
              </button>
            </div>

            <div className="grid">
              <div className="field">
                <label className="label">دسته متریال</label>
                <select className="select" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                  {materialGroups.map((g) => (
                    <option key={g.group_id} value={g.group_id}>
                      {g.group_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label">رنگ / واریانت</label>
                <select className="select" value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
                  {(selectedGroup?.options || []).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label || o.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label">پرینتر</label>
                <select className="select" value={machineId} onChange={(e) => setMachineId(e.target.value)}>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {tab === "manual" ? (
                <>
                  <div className="field">
                    <label className="label">تعداد (Qty)</label>
                    <input className="input" value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" />
                  </div>

                  <div className="field">
                    <label className="label">وزن فیلامنت (گرم) — برای هر عدد</label>
                    <input className="input" value={grams} onChange={(e) => setGrams(e.target.value)} inputMode="decimal" />
                  </div>

                  <div className="field">
                    <label className="label">زمان پرینت (دقیقه) — برای هر عدد</label>
                    <input className="input" value={minutes} onChange={(e) => setMinutes(e.target.value)} inputMode="decimal" />
                  </div>

                  <div className="field">
                    <label className="label">پست‌پروسس (ساعت) — برای هر عدد</label>
                    <input className="input" value={postProHours} onChange={(e) => setPostProHours(e.target.value)} inputMode="decimal" />
                  </div>

                  <div className="field">
                    <label className="label">اکسترا (تومان) — کل سفارش</label>
                    <input className="input" value={extras} onChange={(e) => setExtras(e.target.value)} inputMode="decimal" />
                  </div>
                </>
              ) : (
                <>
                  <div className="field">
                    <label className="label">تعداد (Qty)</label>
                    <input className="input" value={upQty} onChange={(e) => setUpQty(e.target.value)} inputMode="numeric" />
                    <div className="hint">
                      در تب آپلود فقط «متریال + تعداد + فایل». زمان/وزن از /estimate می‌آید.
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">کیفیت تخمینی</label>
                    <select className="select" value={quality} onChange={(e) => setQuality(e.target.value)}>
                      <option value="draft">Draft (سریع‌تر)</option>
                      <option value="normal">Normal</option>
                      <option value="fine">Fine (کندتر)</option>
                    </select>
                  </div>

                  <div className="field field--full">
                    <label className="label">فایل STL</label>
                    <input
                      className="input"
                      type="file"
                      accept=".stl"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />

                    <div className="progressRow" style={{ marginTop: 10 }}>
                      <div className="progressLabel">{loading ? "در حال پردازش…" : "آماده"}</div>
                      <div className="progressPct">{progress ? `${progress}%` : ""}</div>
                    </div>

                    <div className="progressBar">
                      <div className="progressFill" style={{ width: `${progress}%` }} />
                    </div>

                    <div className="hint">
                      این خروجی «حدودی» است و ممکن است با اسلایسر واقعی فرق داشته باشد.
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="actions">
              <button
                className="btn btn--ghost"
                onClick={() => {
                  setTotal(null);
                  setErr("");
                  setProgress(0);
                  setEstGrams(null);
                  setEstMinutes(null);
                }}
                type="button"
              >
                پاک کردن نتیجه
              </button>

              {tab === "manual" ? (
                <button className="btn btn--primary" disabled={!canManualCalc || loading} onClick={calcManual} type="button">
                  {loading ? "در حال محاسبه…" : "محاسبه قیمت"}
                </button>
              ) : (
                <button className="btn btn--primary" disabled={!canUploadCalc || loading} onClick={estimateAndCalcUpload} type="button">
                  {loading ? "در حال تخمین…" : "آپلود و محاسبه"}
                </button>
              )}
            </div>
          </div>
        </section>

        {total !== null && (
          <section className="card totalCard">
            <div className="totalCenter">
              <div className="totalCenter__label">
                قیمت {tab === "upload" ? "حدودی" : ""} (تومان)
                {tab === "upload" && (
                  <span className="pill" style={{ marginRight: 8 }}>
                    حدودی
                  </span>
                )}
              </div>

              <div className="totalCenter__value">{toman(total)}</div>

              {tab === "upload" && estMinutes != null && estGrams != null && (
                <div className="totalCenter__hint" style={{ marginTop: 10 }}>
                  زمان حدودی کل: {fmtDurationFromMinutes(estMinutes * Number(upQty || 1))} •
                  فیلامنت حدودی کل: {toman(estGrams * Number(upQty || 1))} گرم
                </div>
              )}

              <div className="totalCenter__hint">جمع کل</div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
