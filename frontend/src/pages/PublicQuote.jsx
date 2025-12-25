import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const API = import.meta.env.VITE_API_BASE_URL || "/api";
const DEV = import.meta.env.DEV;

// Public page uses a fixed machine behind the scenes
const DEFAULT_PUBLIC_MACHINE_ID = "anycubic_kobra_s1_combo";

const toman = (v) => Number(v || 0).toLocaleString("fa-IR");

// Label helpers (fallback when backend doesn't provide title/name)
const TOKEN_MAP = {
  // polymers / families
  pla: "PLA",
  petg: "PETG",
  tpu: "TPU",
  abs: "ABS",
  asa: "ASA",

  // descriptors
  silk: "سیلک",
  matte: "مات",
  mate: "مات",
  fast: "سریع",
  transparent: "شفاف",
  plus: "پلاس",

  // common words
  wood: "چوب",
  pine: "کاج",
  olive: "زیتونی",
  lavender: "یاسی",
  copper: "مسی",
  coper: "مسی",
  gp: "ساده",
};

const COLOR_FA = {
  black: "مشکی",
  white: "سفید",
  gray: "خاکستری",
  grey: "خاکستری",
  red: "قرمز",
  orange: "نارنجی",
  blue: "آبی",
  green: "سبز",
  yellow: "زرد",
  purple: "بنفش",
  pink: "صورتی",
  brown: "قهوه‌ای",
  gold: "طلایی",
  silver: "نقره‌ای",
};

function prettifyKey(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";

  // Normalize separators so we can translate tokens like:
  // "pla_black", "Matte lavender", "petg-transparent", ...
  const normalized = s
    .replace(/^_+|_+$/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const parts = normalized
    .split(" ")
    .filter(Boolean)
    .map((p) => {
      const low = p.toLowerCase();

      // colors
      if (COLOR_FA[low]) return COLOR_FA[low];

      // known tokens (matte/silk/fast/transparent/plus/...)
      if (TOKEN_MAP[low]) return TOKEN_MAP[low];

      // numbers like 95a
      if (/^\d+[a-z]$/i.test(p)) return p.toUpperCase();

      // default: keep as-is
      return p;
    });

  return parts.join(" ");
}

function stripPrefix(id, groupKey) {
  const a = String(id || "");
  const g = String(groupKey || "");
  if (!a) return "";
  if (g && a.toLowerCase().startsWith((g + "_").toLowerCase())) return a.slice(g.length + 1);
  return a;
}


function CSelect({ value, onChange, options, placeholder = "انتخاب کنید", disabled = false }) {
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const [highlight, setHighlight] = useState(-1);

  const selected = useMemo(
    () => options.find((o) => String(o.value) === String(value)),
    [options, value]
  );

  const syncPos = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      top: Math.round(r.bottom + 8),
      left: Math.round(r.left),
      width: Math.round(r.width),
    });
  };

  useEffect(() => {
    if (!open) return;
    syncPos();

    const onResize = () => syncPos();
    const onScroll = () => syncPos();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);

    const onDown = (e) => {
      const t = e.target;
      if (btnRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);

    const onKey = (e) => {
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        btnRef.current?.focus();
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const max = options.length - 1;
        setHighlight((h) => {
          const base = h < 0 ? Math.max(0, options.findIndex((o) => String(o.value) === String(value))) : h;
          if (e.key === "ArrowDown") return base >= max ? 0 : base + 1;
          return base <= 0 ? max : base - 1;
        });
      } else if (e.key === "Enter") {
        if (highlight >= 0 && options[highlight]) {
          e.preventDefault();
          onChange(String(options[highlight].value));
          setOpen(false);
          btnRef.current?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);

    // initialize highlight
    const idx = options.findIndex((o) => String(o.value) === String(value));
    setHighlight(idx);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, options, value, onChange, highlight]);

  const toggle = () => {
    if (disabled) return;
    setOpen((v) => !v);
  };

  const pick = (v) => {
    onChange(String(v));
    setOpen(false);
    btnRef.current?.focus();
  };

  return (
    <>
      <button
        type="button"
        className={`cselect ${open ? "is-open" : ""}`}
        ref={btnRef}
        disabled={disabled}
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="cselect__value">{selected?.label || placeholder}</span>
      </button>

      {open &&
        createPortal(
          <>
            <div className="cselect__backdrop" onClick={() => setOpen(false)} />
            <div
              className="cselect__menu"
              ref={menuRef}
              style={{ top: pos.top, left: pos.left, width: pos.width }}
              role="listbox"
            >
              {options.map((o, i) => {
                const active = String(o.value) === String(value);
                const hi = i === highlight;
                return (
                  <button
                    key={String(o.value)}
                    type="button"
                    className={`cselect__opt ${active ? "is-active" : ""} ${hi ? "is-hi" : ""}`}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => pick(o.value)}
                    role="option"
                    aria-selected={active}
                  >
                    <span className="cselect__optLabel">{o.label}</span>
                    {active ? <span className="cselect__check">✓</span> : <span className="cselect__check cselect__check--off">✓</span>}
                  </button>
                );
              })}
            </div>
          </>,
          document.body
        )}
    </>
  );
}


export default function PublicQuote() {
  const [materialGroups, setMaterialGroups] = useState([]);
  const [groupId, setGroupId] = useState("");
  const [materialId, setMaterialId] = useState("");

  const [tab, setTab] = useState("upload"); // upload | manual

  // Upload
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState("normal"); // draft | normal | fine

  // Manual
  const [grams, setGrams] = useState("");
  const [minutes, setMinutes] = useState("");
  const [qty, setQty] = useState("1");

  // UI
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState("");
  const [total, setTotal] = useState(null);

  const token = localStorage.getItem("staff_token");

  function log(...args) {
    if (DEV) console.log("[PublicQuote]", ...args);
  }

  async function safeFetch(url, opts) {
    if (DEV) log("FETCH →", opts?.method || "GET", url);
    const res = await fetch(url, opts);
    if (DEV) log("RESP ←", res.status, res.statusText);
    return res;
  }

  const groups = useMemo(() => {
    // Public UI: only show 3 material families (PLA / PETG / TPU)
    // Backend may expose many groups (pla_fast, pla_silk, petg_transparent, ...).
    // We merge them into the 3 public families and dedupe options by id.
    const base = {
      pla: { group_id: "pla", title: "PLA", options: [] },
      petg: { group_id: "petg", title: "PETG", options: [] },
      tpu: { group_id: "tpu", title: "TPU", options: [] },
    };

    const seen = { pla: new Set(), petg: new Set(), tpu: new Set() };
    const addOpt = (key, opt) => {
      const id = String(opt?.id || "");
      if (!id || id.startsWith("+")) return;
      if (seen[key].has(id)) return;
      seen[key].add(id);
      base[key].options.push(opt);
    };

    for (const g of materialGroups || []) {
      const gid = String(g?.group_id || "").toLowerCase();
      if (!gid || gid.startsWith("+")) continue;

      const key =
        gid.includes("petg") ? "petg" :
        gid.includes("tpu") ? "tpu" :
        gid.includes("pla") ? "pla" : null;

      if (!key) continue;

      for (const opt of g?.options || []) addOpt(key, opt);
    }

    // Stable order, hide empty groups
    const out = ["pla", "petg", "tpu"].map((k) => base[k]).filter((g) => (g?.options || []).length);

    // Sort options for nicer UX (by prettified id without the family prefix)
    for (const g of out) {
      const prefix = String(g.group_id || "");
      g.options = (g.options || [])
        .slice()
        .sort((a, b) =>
          prettifyKey(stripPrefix(a?.id, prefix)).localeCompare(
            prettifyKey(stripPrefix(b?.id, prefix)),
            "fa"
          )
        );
    }

    return out;
  }, [materialGroups]);

  const currentGroup = useMemo(() => {
    return groups.find((g) => String(g?.group_id) === String(groupId)) || null;
  }, [groups, groupId]);

  const materialOptions = useMemo(() => {
    const opts = currentGroup?.options || [];
    return opts.filter((o) => {
      const id = String(o?.id || "");
      return id && !id.startsWith("+");
    });
  }, [currentGroup]);

  const groupSelectOptions = useMemo(
    () => groups.map((g) => ({ value: String(g?.group_id), label: groupLabel(g) })),
    [groups]
  );

  const materialSelectOptions = useMemo(
    () => (materialOptions || []).map((o) => ({ value: String(o?.id), label: materialLabel(o) })),
    // materialLabel depends on currentGroup/groupId
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [materialOptions, currentGroup, groupId]
  );

  const qualityOptions = useMemo(
    () => [
      { value: "draft", label: "Draft" },
      { value: "normal", label: "Normal" },
      { value: "fine", label: "Fine" },
    ],
    []
  );


  const canSubmit = useMemo(() => {
    if (!materialId) return false;
    if (tab === "upload") return !!file;
    const g = Number(grams || 0);
    const m = Number(minutes || 0);
    const q = Number(qty || 1);
    return Number.isFinite(g) && Number.isFinite(m) && Number.isFinite(q) && g > 0 && m > 0 && q > 0;
  }, [tab, materialId, file, grams, minutes, qty]);

  const loginHref = token ? "/staff" : "/staff/login";

  useEffect(() => {
    (async () => {
      setErr("");
      setTotal(null);
      setProgress(0);

      const mgRes = await safeFetch(`${API}/material-groups`);
      if (!mgRes.ok) throw new Error(await mgRes.text());
      const mg = await mgRes.json();

      const gs = mg?.material_groups || [];
      setMaterialGroups(gs);
      // Pick first available family (PLA -> PETG -> TPU)
      const base = { pla: [], petg: [], tpu: [] };
      const seen = { pla: new Set(), petg: new Set(), tpu: new Set() };

      for (const g of gs || []) {
        const gid = String(g?.group_id || "").toLowerCase();
        if (!gid || gid.startsWith("+")) continue;

        const key =
          gid.includes("petg") ? "petg" :
          gid.includes("tpu") ? "tpu" :
          gid.includes("pla") ? "pla" : null;

        if (!key) continue;

        for (const opt of g?.options || []) {
          const oid = String(opt?.id || "");
          if (!oid || oid.startsWith("+")) continue;
          if (seen[key].has(oid)) continue;
          seen[key].add(oid);
          base[key].push(opt);
        }
      }

      const firstKey = (["pla", "petg", "tpu"].find((k) => base[k].length) || "pla");
      setGroupId(firstKey);
      setMaterialId(base[firstKey]?.[0]?.id || "");
    })().catch((e) => {
      setErr(String(e?.message || e));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!currentGroup) return;
    if (!materialOptions.some((o) => String(o?.id) === String(materialId))) {
      setMaterialId(materialOptions?.[0]?.id || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  function groupLabel(g) {
    return g?.title || g?.name || prettifyKey(g?.group_id);
  }

  function materialLabel(o) {
    if (o?.title) return o.title;
    if (o?.name) return o.name;
    const raw = stripPrefix(o?.id, currentGroup?.group_id || groupId);
    return prettifyKey(raw || o?.id);
  }

  async function estimateFromApi(fileObj, matId, q) {
    const fd = new FormData();
    fd.append("file", fileObj);
    fd.append("material_id", matId);
    fd.append("quality", q);

    const res = await safeFetch(`${API}/estimate`, { method: "POST", body: fd });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  }

  async function quote({ gramsPerOne, minutesPerOne, qtyVal = 1 }) {
    const body = {
      material_id: materialId,
      machine_id: DEFAULT_PUBLIC_MACHINE_ID,
      qty: Number(qtyVal || 1),
      filament_grams: Number(gramsPerOne || 0),
      print_time_minutes: Number(minutesPerOne || 0),
      post_pro_hours: 0,
      extras: 0,
    };

    const res = await safeFetch(`${API}/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  }

  async function calcUpload() {
    setErr("");
    setTotal(null);
    setProgress(0);
    setLoading(true);
    try {
      setProgress(10);
      const est = await estimateFromApi(file, materialId, quality);
      setProgress(65);

      const g1 = Number(est?.estimated_grams || 0);
      const m1 = Number(est?.estimated_minutes || 0);

      if (!(g1 > 0) || !(m1 > 0)) {
        throw new Error("نتونستم وزن/زمان فایل رو تخمین بزنم. لطفاً فایل دیگه‌ای امتحان کنید.");
      }

      const data = await quote({ gramsPerOne: g1, minutesPerOne: m1, qtyVal: 1 });
      setTotal(data?.Total ?? null);
      setProgress(100);
    } catch (e) {
      setErr(String(e?.message || e));
      setProgress(0);
    } finally {
      setLoading(false);
    }
  }

  async function calcManual() {
    setErr("");
    setTotal(null);
    setProgress(0);
    setLoading(true);
    try {
      const g = Number(grams || 0);
      const m = Number(minutes || 0);
      const q = Number(qty || 1);

      if (!(g > 0) || !(m > 0) || !(q > 0)) {
        throw new Error("لطفاً وزن (گرم)، زمان (دقیقه) و تعداد را درست وارد کنید.");
      }

      setProgress(40);
      const data = await quote({ gramsPerOne: g, minutesPerOne: m, qtyVal: q });
      setTotal(data?.Total ?? null);
      setProgress(100);
    } catch (e) {
      setErr(String(e?.message || e));
      setProgress(0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="wrap">
        <header className="hero">
          <div className="hero__badgeRow">
            <span className="hero__badge">3DJAT · محاسبه‌گر قیمت</span>
            <a className="btn btn--ghost" href={loginHref}>
              ورود پرسنل
            </a>
          </div>

          <h1 className="hero__title">برآورد سریع قیمت چاپ سه‌بعدی</h1>
          <p className="hero__sub">برای دریافت قیمت حدودی، متریال را انتخاب کنید و فایل STL را آپلود کنید.</p>
        </header>

        <section className="panel">
          <div className="tabs">
            <button
              type="button"
              className={`tab ${tab === "upload" ? "tab--active" : ""}`}
              onClick={() => setTab("upload")}
            >
              آپلود STL
            </button>
            <button
              type="button"
              className={`tab ${tab === "manual" ? "tab--active" : ""}`}
              onClick={() => setTab("manual")}
            >
              دستی
            </button>
          </div>

          <div className="grid">
            <div className="field">
              <div className="label">دسته متریال</div>
              {/* Custom dropdown */}
              <CSelect
                value={groupId}
                onChange={setGroupId}
                options={groupSelectOptions}
                placeholder="انتخاب دسته"
              />
            </div>

            <div className="field">
              <div className="label">متریال</div>
              {/* Custom dropdown */}
              <CSelect
                value={materialId}
                onChange={setMaterialId}
                options={materialSelectOptions}
                placeholder="انتخاب متریال"
                disabled={!materialSelectOptions.length}
              />
            </div>

            {tab === "upload" ? (
              <>
                <div className="field">
                  <div className="label">کیفیت تخمینی</div>
                  {/* Custom dropdown */}
                  <CSelect
                    value={quality}
                    onChange={setQuality}
                    options={qualityOptions}
                    placeholder="کیفیت"
                  />
                </div>

                <div className="field field--full">
                  <div className="label">فایل STL</div>
                  <input
                    className="input"
                    type="file"
                    accept=".stl"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="field">
                  <div className="label">وزن (گرم)</div>
                  <input
                    className="input"
                    inputMode="decimal"
                    placeholder="مثلاً 120"
                    value={grams}
                    onChange={(e) => setGrams(e.target.value)}
                  />
                </div>

                <div className="field">
                  <div className="label">زمان چاپ (دقیقه)</div>
                  <input
                    className="input"
                    inputMode="decimal"
                    placeholder="مثلاً 360"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                  />
                </div>

                <div className="field">
                  <div className="label">تعداد</div>
                  <input
                    className="input"
                    inputMode="numeric"
                    placeholder="1"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                  />
                </div>

                <div className="field">
                  <div className="label">کیفیت</div>
                  {/* Custom dropdown */}
                  <CSelect
                    value={quality}
                    onChange={setQuality}
                    options={qualityOptions}
                    placeholder="کیفیت"
                  />
                </div>
              </>
            )}
          </div>

          <div className="progressRow">
            <span className="progressLabel">آماده</span>
            <span className="progressPct">{progress ? `${progress}%` : ""}</span>
          </div>
          <div className="progressBar">
            <div className="progressFill" style={{ width: `${progress || 0}%` }} />
          </div>

          <div className="actions">
            <button
              className="btn btn--primary"
              disabled={!canSubmit || loading}
              onClick={tab === "upload" ? calcUpload : calcManual}
            >
              {loading ? "در حال محاسبه..." : "محاسبه قیمت"}
            </button>

            <a className="btn btn--ghost" href="https://3djat.com" target="_blank" rel="noreferrer">
              بازگشت به سایت
            </a>
          </div>

          {err ? <div className="hint hint--err">{err}</div> : null}

          {total != null ? (
            <div className="card">
              <div className="card__title">قیمت حدودی</div>
              <div className="card__big">{toman(total)} تومان</div>
              <div className="card__sub">این مبلغ حدودی است. برای قیمت نهایی با تیم هماهنگ شود.</div>
            </div>
          ) : (
            <div className="hint">این قیمت حدودی است و برای برآورد سریع ارائه می‌شود.</div>
          )}
        </section>
      </div>
    </div>
  );
}
