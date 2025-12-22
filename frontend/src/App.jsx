import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function App() {
  const [materialGroups, setMaterialGroups] = useState([]);
  const [machines, setMachines] = useState([]);

  const [groupId, setGroupId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [machineId, setMachineId] = useState("");

  const [qty, setQty] = useState(1);
  const [grams, setGrams] = useState("");
  const [minutes, setMinutes] = useState("");
  const [postProHours, setPostProHours] = useState("0");
  const [extras, setExtras] = useState("0");

  const [quality, setQuality] = useState("normal"); // draft | normal | fine

  const [total, setTotal] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [estimating, setEstimating] = useState(false);

  // Load data
  useEffect(() => {
    (async () => {
      setErr("");

      const [mg, mc] = await Promise.all([
        fetch(`${API}/material-groups`).then((r) => r.json()),
        fetch(`${API}/machines`).then((r) => r.json()),
      ]);

      const groups = mg.material_groups || [];
      setMaterialGroups(groups);
      setMachines(mc || []);

      const firstGroup = groups[0];
      const firstOption = firstGroup?.options?.[0];
      setGroupId(firstGroup?.group_id || "");
      setMaterialId(firstOption?.id || "");
      setMachineId(mc?.[0]?.id || "");
    })().catch((e) => setErr(String(e)));
  }, []);

  const selectedGroup = useMemo(
    () => materialGroups.find((g) => g.group_id === groupId),
    [materialGroups, groupId]
  );

  // When group changes, auto-pick first option
  useEffect(() => {
    if (!selectedGroup) return;
    const first = selectedGroup.options?.[0];
    if (first?.id) setMaterialId(first.id);
  }, [groupId]); // eslint-disable-line react-hooks/exhaustive-deps

  const canCalc = useMemo(() => {
    return (
      materialId &&
      machineId &&
      Number(qty) >= 1 &&
      Number(grams) >= 0 &&
      Number(minutes) >= 0
    );
  }, [materialId, machineId, qty, grams, minutes]);

  const toman = (v) => Number(v || 0).toLocaleString("fa-IR");

  async function calc() {
    setErr("");
    setTotal(null);
    setLoading(true);

    try {
      const body = {
        material_id: materialId,
        machine_id: machineId,
        qty: Number(qty || 1),
        filament_grams: Number(grams || 0),
        print_time_minutes: Number(minutes || 0),
        post_pro_hours: Number(postProHours || 0),
        extras: Number(extras || 0),
      };

      const res = await fetch(`${API}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setTotal(data?.Total ?? null);
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  // NEW: Estimate from STL/3MF
  async function estimateFromFile(file) {
    if (!file) return;
    if (!materialId) {
      setErr("اول متریال را انتخاب کن.");
      return;
    }

    setErr("");
    setEstimating(true);
    setTotal(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("material_id", materialId);
      fd.append("quality", quality);

      // اگر route شما /estimate نیست، اینجا را عوض کن:
      const res = await fetch(`${API}/estimate`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      // پر کردن اتومات فیلدها
      if (data?.estimated_grams !== undefined && data?.estimated_grams !== null) {
        setGrams(String(data.estimated_grams));
      }
      if (data?.estimated_minutes !== undefined && data?.estimated_minutes !== null) {
        setMinutes(String(data.estimated_minutes));
      }

      // اگر warning داشتی، برای MVP فقط تو console
      if (data?.warnings?.length) {
        // eslint-disable-next-line no-console
        console.warn("estimate warnings:", data.warnings);
      }
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setEstimating(false);
    }
  }

  return (
    <div className="page" dir="rtl" lang="fa">
      <div className="wrap">
        <header className="hero">
          <div className="hero__badge">3DJAT • محاسبه‌گر قیمت</div>
          <h1 className="hero__title">برآورد سریع قیمت چاپ سه‌بعدی</h1>
          <p className="hero__sub">
            وزن و زمان پرینت را وارد کنید، متریال و دستگاه را انتخاب کنید و فقط «جمع کل»
            را دریافت کنید.
          </p>
        </header>

        {err && (
          <div className="alert">
            <div className="alert__title">خطا</div>
            <div className="alert__text">{err}</div>
          </div>
        )}

        <section className="panel">
          <div className="panel__inner">
            <div className="grid">
              <div className="field">
                <label className="label">دسته متریال</label>
                <select
                  className="select"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                >
                  {materialGroups.map((g) => (
                    <option key={g.group_id} value={g.group_id}>
                      {g.group_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label">رنگ / واریانت</label>
                <select
                  className="select"
                  value={materialId}
                  onChange={(e) => setMaterialId(e.target.value)}
                >
                  {(selectedGroup?.options || []).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label || o.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label">پرینتر</label>
                <select
                  className="select"
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                >
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label">تعداد (Qty)</label>
                <input
                  className="input"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  inputMode="numeric"
                />
              </div>

              {/* NEW: Upload section */}
              <div className="field">
                <label className="label">آپلود فایل برای تخمین (STL/3MF)</label>
                <input
                  className="input"
                  type="file"
                  accept=".stl,.3mf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) estimateFromFile(f);
                    e.target.value = "";
                  }}
                />
              </div>

              <div className="field">
                <label className="label">کیفیت تخمین</label>
                <select
                  className="select"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                >
                  <option value="draft">Draft (سریع)</option>
                  <option value="normal">Normal</option>
                  <option value="fine">Fine (کیفیت)</option>
                </select>
              </div>

              <div className="field">
                <label className="label">وزن فیلامنت (گرم) — برای هر عدد</label>
                <input
                  className="input"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  inputMode="decimal"
                  placeholder="مثلاً 120"
                />
                {estimating ? (
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                    در حال تخمین…
                  </div>
                ) : null}
              </div>

              <div className="field">
                <label className="label">زمان پرینت (دقیقه) — برای هر عدد</label>
                <input
                  className="input"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  inputMode="decimal"
                  placeholder="مثلاً 180"
                />
              </div>

              <div className="field">
                <label className="label">زمان پست‌پروسس (ساعت) — برای هر عدد</label>
                <input
                  className="input"
                  value={postProHours}
                  onChange={(e) => setPostProHours(e.target.value)}
                  inputMode="decimal"
                  placeholder="مثلاً 0.5"
                />
              </div>

              <div className="field">
                <label className="label">اکسترا (تومان) — کل سفارش</label>
                <input
                  className="input"
                  value={extras}
                  onChange={(e) => setExtras(e.target.value)}
                  inputMode="decimal"
                  placeholder="مثلاً 50000"
                />
              </div>
            </div>

            <div className="actions">
              <button
                className="btn btn--ghost"
                onClick={() => setTotal(null)}
                type="button"
              >
                پاک کردن نتیجه
              </button>

              <button
                className="btn btn--primary"
                disabled={!canCalc || loading}
                onClick={calc}
                type="button"
              >
                {loading ? "در حال محاسبه…" : "محاسبه قیمت"}
              </button>
            </div>
          </div>
        </section>

        {total !== null && (
          <section className="card totalCard">
            <div className="totalCenter">
              <div className="totalCenter__label">قیمت حدودی (تومان)</div>
              <div className="totalCenter__value">{toman(total)}</div>
              <div className="totalCenter__hint">جمع کل</div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
