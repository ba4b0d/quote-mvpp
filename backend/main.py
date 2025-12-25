from __future__ import annotations

import os
import json
import io
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from threading import Lock
from typing import Any
from datetime import datetime, timedelta

import numpy as np
import trimesh
from dotenv import load_dotenv
from fastapi import (
    FastAPI,
    HTTPException,
    UploadFile,
    File,
    Form,
    Depends,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, ConfigDict
from passlib.context import CryptContext
from jose import jwt, JWTError

# ----------------------------
# ENV
# ----------------------------
load_dotenv()  # reads backend/.env if exists


def _csv_env_list(name: str, default: str = "") -> list[str]:
    raw = os.getenv(name, default) or ""
    return [x.strip() for x in raw.split(",") if x.strip()]


ALLOWED_ORIGINS = _csv_env_list(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173",
)

# Public default printer lock (customers)
PUBLIC_DEFAULT_MACHINE_ID = os.getenv("PUBLIC_DEFAULT_MACHINE_ID", "anycubic_kobra_s1_combo")

# ----------------------------
# JWT Auth (Staff)
# ----------------------------
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "CHANGE_ME")  # MUST override in .env
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))  # 7 days default
JWT_ALG = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer(auto_error=False)


def _parse_users_env(env_name: str) -> dict[str, str]:
    """
    USERS env format: user1:hash,user2:hash
    Example:
      STAFF_USERS=ba4b0d:$2b$12$...,negin:$2b$12$...
    """
    raw = os.getenv(env_name, "") or ""
    out: dict[str, str] = {}
    for part in raw.split(","):
        part = part.strip()
        if not part or ":" not in part:
            continue
        u, h = part.split(":", 1)
        u = u.strip()
        h = h.strip()
        if u and h:
            out[u] = h
    return out


# Staff users (can quote/estimate)
STAFF_USERS = _parse_users_env("STAFF_USERS")

# Admin users (can edit config). Optional; if empty, no one can access /admin.
ADMIN_USERS = _parse_users_env("ADMIN_USERS")


def create_access_token(username: str, role: str) -> str:
    exp = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {"sub": username, "role": role, "exp": exp}
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALG)


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    if creds is None:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = creds.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALG])
        username = payload.get("sub")
        role = payload.get("role")
        if not username or not role:
            raise HTTPException(
                status_code=401,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return {"username": str(username), "role": str(role)}
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_staff(user=Depends(get_current_user)) -> str:
    # staff OR admin can access staff routes
    if user.get("role") not in ("staff", "admin"):
        raise HTTPException(status_code=403, detail="Forbidden")
    return str(user["username"])


def get_current_admin(user=Depends(get_current_user)) -> str:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return str(user["username"])


# ----------------------------
# App
# ----------------------------
app = FastAPI(title="3DJAT Quote API", version="0.7.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=86400,
)

DATA_PATH = Path(__file__).parent / "data.json"
BACKUP_DIR = Path(__file__).parent / "backups"
AUDIT_LOG_PATH = BACKUP_DIR / "audit.jsonl"

CONFIG_LOCK = Lock()


def _atomic_write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)


def save_data(new_data: dict, actor: str) -> None:
    """Atomically save config with backup + audit log."""
    with CONFIG_LOCK:
        BACKUP_DIR.mkdir(parents=True, exist_ok=True)
        ts = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
        if DATA_PATH.exists():
            backup_path = BACKUP_DIR / f"data.{ts}.{actor}.json"
            backup_path.write_text(DATA_PATH.read_text(encoding="utf-8"), encoding="utf-8")

        _atomic_write_json(DATA_PATH, new_data)

        # Append audit record (best-effort)
        try:
            AUDIT_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
            rec = {"ts": ts, "actor": actor, "action": "save_config"}
            with AUDIT_LOG_PATH.open("a", encoding="utf-8") as f:
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")
        except Exception:
            pass


def load_data() -> dict:
    if not DATA_PATH.exists():
        raise RuntimeError(f"data.json not found at: {DATA_PATH}")
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))



def _normalize_bool(v, default: bool) -> bool:
    if isinstance(v, bool):
        return v
    if v is None:
        return default
    if isinstance(v, (int, float)):
        return bool(v)
    s = str(v).strip().lower()
    if s in ("1", "true", "yes", "on"):
        return True
    if s in ("0", "false", "no", "off"):
        return False
    return default


def _validate_admin_config(payload: AdminConfigPayload) -> dict:
    # Ensure unique IDs
    mat_ids = [m.id for m in payload.materials]
    if len(mat_ids) != len(set(mat_ids)):
        raise HTTPException(400, "Duplicate material id detected")

    mc_ids = [m.id for m in payload.machines]
    if len(mc_ids) != len(set(mc_ids)):
        raise HTTPException(400, "Duplicate machine id detected")

    # Normalize toggles for backward-compat (in case UI sends null/strings)
    mats_out = []
    for m in payload.materials:
        d = m.model_dump()
        d["is_public"] = _normalize_bool(d.get("is_public"), True)
        d["is_active"] = _normalize_bool(d.get("is_active"), True)
        mats_out.append(d)

    mcs_out = []
    for mc in payload.machines:
        d = mc.model_dump()
        d["is_active"] = _normalize_bool(d.get("is_active"), True)
        mcs_out.append(d)

    cfg = {
        "settings": dict(payload.settings),
        "materials": mats_out,
        "machines": mcs_out,
    }
    return cfg


# ----------------------------
# Models
# ----------------------------

class MaterialItem(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str
    name: str
    price_per_kg: float
    waste_pct: float = 0
    density_g_cm3: float | None = None
    color: str = ""
    notes: str = ""
    # Admin toggles
    is_public: bool = True
    is_active: bool = True
    title_fa: str | None = None


class MachineItem(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str
    name: str
    power_w: float
    purchase_price: float
    life_hours: float
    maintenance_pct: float = 0.0
    is_active: bool = True


class AdminConfigPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    settings: dict[str, Any]
    materials: list[MaterialItem]
    machines: list[MachineItem]

class QuoteRequest(BaseModel):
    material_id: str
    machine_id: str
    qty: int = Field(default=1, ge=1)
    filament_grams: float = Field(ge=0)  # per item
    print_time_minutes: float = Field(ge=0)  # per item
    post_pro_hours: float = Field(default=0, ge=0)  # per item
    extras: float = Field(default=0, ge=0)  # total order extras (toman)


class QuoteResponse(BaseModel):
    Matrial_t: float
    power_t: float
    downturn_t: float
    Maintenance_t: float
    Coloring_t: float
    overhead_t: float
    Extras: float
    Total: float


class EstimateResponse(BaseModel):
    volume_cm3: float
    bbox_mm: dict
    estimated_grams: float
    estimated_minutes: float
    warnings: list[str] = []


class LoginRequest(BaseModel):
    username: str
    password: str


# ----------------------------
# Mesh loaders (STL / 3MF)
# ----------------------------
def _mesh_from_trimesh_loaded(obj) -> trimesh.Trimesh:
    if isinstance(obj, trimesh.Scene):
        dumped = obj.dump()
        if not dumped:
            raise ValueError("Empty 3D scene")
        obj = trimesh.util.concatenate(tuple(dumped))
    if not isinstance(obj, trimesh.Trimesh):
        raise ValueError("Unsupported mesh type")
    return obj


def _load_mesh_from_stl_bytes(b: bytes) -> trimesh.Trimesh:
    loaded = trimesh.load(io.BytesIO(b), file_type="stl")
    return _mesh_from_trimesh_loaded(loaded)


def _load_mesh_from_3mf_bytes(b: bytes) -> trimesh.Trimesh:
    # Try 1: trimesh direct
    try:
        loaded = trimesh.load(io.BytesIO(b), file_type="3mf")
        return _mesh_from_trimesh_loaded(loaded)
    except Exception:
        pass

    # Try 2: minimal 3MF XML parse from the zip
    z = zipfile.ZipFile(io.BytesIO(b))
    model_path = None
    for p in z.namelist():
        pl = p.lower()
        if pl.endswith("3d/3dmodel.model") or pl.endswith("3dmodel.model"):
            model_path = p
            break
    if not model_path:
        raise ValueError("3MF model file not found (3D/3dmodel.model)")

    xml_bytes = z.read(model_path)
    root = ET.fromstring(xml_bytes)

    def strip_ns(tag: str) -> str:
        return tag.split("}", 1)[-1] if "}" in tag else tag

    vertices = []
    faces = []
    for elem in root.iter():
        t = strip_ns(elem.tag)
        if t == "vertex":
            x = float(elem.attrib.get("x", "0"))
            y = float(elem.attrib.get("y", "0"))
            z_ = float(elem.attrib.get("z", "0"))
            vertices.append((x, y, z_))
        elif t == "triangle":
            v1 = int(elem.attrib.get("v1", "0"))
            v2 = int(elem.attrib.get("v2", "0"))
            v3 = int(elem.attrib.get("v3", "0"))
            faces.append((v1, v2, v3))

    if not vertices or not faces:
        raise ValueError("3MF contains no mesh vertices/triangles")

    v = np.array(vertices, dtype=np.float64)
    f = np.array(faces, dtype=np.int64)
    mesh = trimesh.Trimesh(vertices=v, faces=f, process=True)
    return mesh


# ----------------------------
# Public Routes
# ----------------------------
@app.get("/health")
def health():
    return {"ok": True}


@app.get("/settings")
def get_settings():
    return load_data()["settings"]


@app.get("/materials")
def get_materials():
    return load_data()["materials"]


@app.get("/machines")
def get_machines():
    return load_data()["machines"]


@app.get("/material-groups")
def material_groups():
    data = load_data()
    mats = data["materials"]
    groups = {}
    for m in mats:
        name = (m.get("name") or "").strip()
        if not name:
            continue
        key = name.lower()
        if key not in groups:
            groups[key] = {
                "group_id": key.replace(" ", "_"),
                "group_name": name,
                "options": [],
            }
        groups[key]["options"].append(
            {
                "id": m["id"],
                "label": m.get("color", "") or m["id"],
                "price_per_kg": m.get("price_per_kg", 0),
                "waste_pct": m.get("waste_pct", 0),
                "density_g_cm3": m.get("density_g_cm3", None),
                "notes": m.get("notes", ""),
            }
        )

    out = list(groups.values())
    out.sort(key=lambda g: g["group_name"].lower())
    for g in out:
        g["options"].sort(key=lambda o: (o.get("label") or "").lower())

    return {"material_groups": out}


@app.post("/estimate", response_model=EstimateResponse)
async def estimate(
    file: UploadFile = File(...),
    material_id: str = Form(...),
    quality: str = Form("normal"),  # draft | normal | fine
):
    data = load_data()
    mats = {m["id"]: m for m in data["materials"]}
    if material_id not in mats:
        raise HTTPException(400, "Unknown material_id")

    mat = mats[material_id]
    density = float(mat.get("density_g_cm3", 1.24))  # PLA default
    warnings: list[str] = []

    b = await file.read()
    fname = (file.filename or "").lower().strip()
    try:
        if fname.endswith(".stl"):
            mesh = _load_mesh_from_stl_bytes(b)
        elif fname.endswith(".3mf"):
            mesh = _load_mesh_from_3mf_bytes(b)
        else:
            raise ValueError("Only .stl or .3mf supported")
    except Exception as e:
        raise HTTPException(400, f"Could not parse model: {e}")

    bounds = mesh.bounds
    dims = (bounds[1] - bounds[0]).tolist()
    bbox_mm = {"x": float(dims[0]), "y": float(dims[1]), "z": float(dims[2])}

    vol_mm3 = float(mesh.volume) if getattr(mesh, "is_watertight", False) else 0.0
    if vol_mm3 <= 0:
        try:
            vol_mm3 = float(mesh.convex_hull.volume)
            warnings.append("Mesh not watertight; used convex-hull volume (approx).")
        except Exception:
            raise HTTPException(400, "Mesh volume could not be estimated")

    volume_cm3 = vol_mm3 / 1000.0

    s = data["settings"]
    infill = float(s.get("estimate_infill_pct", 0.2))
    shell = float(s.get("estimate_shell_overhead", 0.18))
    support = float(s.get("estimate_support_overhead", 0.05))
    time_per_cm3 = float(s.get("estimate_time_min_per_cm3", 2.8))
    fixed_min = float(s.get("estimate_time_fixed_min", 12))
    q = (quality or "normal").lower().strip()

    q_mul = 1.0
    if q == "draft":
        q_mul = 0.75
    elif q == "fine":
        q_mul = 1.35

    volume_factor = min(1.0, max(0.05, infill + shell + support))
    printed_volume_cm3 = volume_cm3 * volume_factor
    mass_mul = float(s.get("estimate_mass_multiplier", 1.0))

    estimated_grams = printed_volume_cm3 * density * mass_mul
    estimated_minutes = (fixed_min + (volume_cm3 * time_per_cm3)) * q_mul

    return EstimateResponse(
        volume_cm3=round(volume_cm3, 2),
        bbox_mm={k: round(v, 2) for k, v in bbox_mm.items()},
        estimated_grams=round(estimated_grams, 1),
        estimated_minutes=round(estimated_minutes, 0),
        warnings=warnings,
    )


def _quote_calc(req: QuoteRequest) -> QuoteResponse:
    data = load_data()
    settings = data["settings"]
    mats = {m["id"]: m for m in data["materials"]}
    machines = {m["id"]: m for m in data["machines"]}

    if req.material_id not in mats:
        raise HTTPException(400, "Unknown material_id")
    if req.machine_id not in machines:
        raise HTTPException(400, "Unknown machine_id")

    mat = mats[req.material_id]
    mc = machines[req.machine_id]

    qty = int(req.qty)
    grams_per_item = float(req.filament_grams)
    minutes_per_item = float(req.print_time_minutes)
    hours_per_item = minutes_per_item / 60.0
    post_pro_hours_per_item = float(req.post_pro_hours)

    electricity_rate = float(settings["electricity_rate_per_kwh"])
    overhead_pct = float(settings["overhead_pct"])
    coloring_cost_per_hour = float(settings["coloring_cost_per_hour"])
    markup_pct = float(settings.get("markup_pct", 0))

    waste_pct = float(mat.get("waste_pct", 0))
    effective_grams = grams_per_item * (1.0 + waste_pct)
    price_per_kg = float(mat["price_per_kg"])

    Matrial_t = qty * (effective_grams / 1000.0) * price_per_kg

    power_w = float(mc["power_w"])
    power_t = qty * (power_w / 1000.0) * hours_per_item * electricity_rate

    price = float(mc["purchase_price"])
    life = float(mc["life_hours"])
    pct = float(mc.get("maintenance_pct", 0))

    rate_per_hour = (price / life) if life > 0 else 0.0
    downturn_t = qty * hours_per_item * rate_per_hour
    Maintenance_t = qty * hours_per_item * (rate_per_hour * pct)

    Coloring_t = qty * post_pro_hours_per_item * coloring_cost_per_hour

    base = Matrial_t + power_t + downturn_t + Maintenance_t + Coloring_t
    overhead_t = overhead_pct * base

    Extras = float(req.extras)
    subtotal = base + overhead_t + Extras
    Total = subtotal * (1.0 + markup_pct)

    def r0(x: float) -> float:
        return float(round(x, 0))

    return QuoteResponse(
        Matrial_t=r0(Matrial_t),
        power_t=r0(power_t),
        downturn_t=r0(downturn_t),
        Maintenance_t=r0(Maintenance_t),
        Coloring_t=r0(Coloring_t),
        overhead_t=r0(overhead_t),
        Extras=r0(Extras),
        Total=r0(Total),
    )


@app.post("/quote", response_model=QuoteResponse)
def quote(req: QuoteRequest):
    # Public همیشه پرینتر ثابت
    try:
        req2 = req.model_copy(update={"machine_id": PUBLIC_DEFAULT_MACHINE_ID})
    except AttributeError:
        req2 = req.copy(update={"machine_id": PUBLIC_DEFAULT_MACHINE_ID})
    return _quote_calc(req2)


# ----------------------------
# Auth Routes (Staff)
# ----------------------------
@app.post("/auth/login")
def auth_login(req: LoginRequest):
    # Admin first, then staff
    if ADMIN_USERS:
        stored_hash = ADMIN_USERS.get(req.username)
        if stored_hash and pwd_context.verify(req.password, stored_hash):
            token = create_access_token(req.username, role="admin")
            return {"access_token": token, "token_type": "bearer", "role": "admin"}

    users = STAFF_USERS
    if not users:
        raise HTTPException(500, "STAFF_USERS not configured")

    stored_hash = users.get(req.username)
    if not stored_hash or not pwd_context.verify(req.password, stored_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(req.username, role="staff")
    return {"access_token": token, "token_type": "bearer", "role": "staff"}


@app.get("/auth/me")
def auth_me(user=Depends(get_current_user)):
    return {"ok": True, "username": user["username"], "role": user["role"]}



# ----------------------------
# Admin Routes (Protected)
# ----------------------------
@app.get("/admin/config")
def admin_get_config(username: str = Depends(get_current_admin)):
    return load_data()


@app.put("/admin/config")
def admin_put_config(payload: AdminConfigPayload, username: str = Depends(get_current_admin)):
    cfg = _validate_admin_config(payload)
    save_data(cfg, actor=username)
    return {"ok": True}


@app.get("/admin/audit")
def admin_audit(username: str = Depends(get_current_admin)):
    if not AUDIT_LOG_PATH.exists():
        return {"entries": []}
    lines = AUDIT_LOG_PATH.read_text(encoding="utf-8").splitlines()[-200:]
    entries = []
    for ln in lines:
        try:
            entries.append(json.loads(ln))
        except Exception:
            continue
    return {"entries": entries}

# ----------------------------
# Staff Routes (Protected)
# ----------------------------
@app.post("/staff/quote", response_model=QuoteResponse)
def staff_quote(req: QuoteRequest, username: str = Depends(get_current_staff)):
    # Staff آزاد: همون machine_id انتخابی
    return _quote_calc(req)


@app.post("/staff/estimate", response_model=EstimateResponse)
async def staff_estimate(
    file: UploadFile = File(...),
    material_id: str = Form(...),
    quality: str = Form("normal"),
    username: str = Depends(get_current_staff),
):
    return await estimate(file=file, material_id=material_id, quality=quality)
