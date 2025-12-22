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

  const [total, setTotal] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

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

              <div className="field">
                <label className="label">وزن فیلامنت (گرم) — برای هر عدد</label>
                <input
                  className="input"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  inputMode="decimal"
                  placeholder="مثلاً 120"
                />
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
