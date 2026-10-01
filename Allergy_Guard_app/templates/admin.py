"""AllergyGuard - unified Flask backend + Admin dashboard.

Run locally:
  pip install -r requirements.txt
  python Allergy_Guard_app/templates/admin.py

Environment:
  ADMIN_USER=admin@example.com
  ADMIN_PASSWORD=change-me
  SECRET_KEY=change-me
  ADMIN_DB=allergyguard.db
"""

import hmac
import json
import os
import sqlite3
from datetime import datetime
from functools import wraps

from flask import (
    Flask,
    flash,
    g,
    get_flashed_messages,
    jsonify,
    redirect,
    render_template,
    render_template_string,
    request,
    session,
    url_for,
    send_from_directory,
)
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB = os.environ.get("ADMIN_DB", os.path.join(BASE_DIR, "allergyguard.db"))
ADMIN_USER = os.environ.get("ADMIN_USER", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin1234")
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-change-me")

app = Flask(
    __name__,
    template_folder=BASE_DIR,
    static_folder=BASE_DIR,
    static_url_path="",
)
app.secret_key = SECRET_KEY
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    MAX_CONTENT_LENGTH=2 * 1024 * 1024,
)

RISK = {
    "hi": ("สูง", "#B91C1C"),
    "med": ("ปานกลาง", "#D97706"),
    "lo": ("ต่ำ", "#0D9373"),
}


def db():
    if "db" not in g:
        os.makedirs(os.path.dirname(os.path.abspath(DB)), exist_ok=True)
        g.db = sqlite3.connect(DB)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(_):
    d = g.pop("db", None)
    if d:
        d.close()


def init_db():
    with sqlite3.connect(DB) as c:
        c.executescript("""
            CREATE TABLE IF NOT EXISTS users(
                email TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                pw TEXT NOT NULL,
                data TEXT NOT NULL DEFAULT '{}',
                created TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS recs(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                kind TEXT NOT NULL,
                data TEXT NOT NULL,
                created TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS ix_recs ON recs(email, kind);
            """)
        # Keep the demo account available for first run.
        if not c.execute(
            "SELECT 1 FROM users WHERE email=?", ("demo@allergy.com",)
        ).fetchone():
            demo = {
                "email": "demo@allergy.com",
                "name": "สมชาย ใจดี",
                "age": 32,
                "sex": "ชาย",
                "wt": 70,
                "ht": 170,
                "bld": "B",
                "fam": "1",
                "env": "urban",
                "job": "office",
                "pet": "0",
                "fa": "อาหารทะเล",
                "da": "",
                "dis": "",
            }
            c.execute(
                "INSERT INTO users(email,name,pw,data,created) VALUES(?,?,?,?,?)",
                (
                    demo["email"],
                    demo["name"],
                    generate_password_hash("demo1234"),
                    json.dumps(demo, ensure_ascii=False),
                    datetime.now().strftime("%Y-%m-%d %H:%M"),
                ),
            )
        c.commit()


def json_user(row):
    data = json.loads(row["data"] or "{}")
    data.update({"email": row["email"], "name": row["name"]})
    data.pop("pass", None)
    data.pop("password", None)
    return data


def clean_user(user):
    data = dict(user or {})
    data.pop("pass", None)
    data.pop("password", None)
    return data


def current_user():
    email = session.get("user_email")
    if not email:
        return None
    row = db().execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    return json_user(row) if row else None


def user_required_api(f):
    @wraps(f)
    def w(*args, **kwargs):
        if not current_user():
            return jsonify({"ok": False, "error": "ต้องเข้าสู่ระบบ"}), 401
        return f(*args, **kwargs)

    return w


def admin_required(f):
    @wraps(f)
    def w(*args, **kwargs):
        return (
            f(*args, **kwargs)
            if session.get("admin")
            else redirect(url_for("admin_login"))
        )

    return w


# ---------------- Public app routes ----------------
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/<path:filename>")
def frontend(filename):
    # HTML uses Jinja's template loader; JS/CSS/images must be served as raw files.
    if filename.startswith("admin") or filename.startswith("api/"):
        return redirect(url_for("admin_login"))
    if filename.endswith(".html"):
        return render_template(filename)
    return send_from_directory(BASE_DIR, filename)


@app.post("/api/auth/register")
def api_register():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("pass", ""))
    user = payload.get("user") or {}
    if not email or "@" not in email or len(password) < 8 or not user.get("name"):
        return jsonify({"ok": False, "error": "ข้อมูลสมัครสมาชิกไม่ครบ"}), 400
    if db().execute("SELECT 1 FROM users WHERE email=?", (email,)).fetchone():
        return jsonify({"ok": False, "error": "อีเมลนี้มีผู้ใช้งานแล้ว"}), 409
    user = clean_user(user)
    user["email"] = email
    user["name"] = str(user.get("name", "")).strip()
    c = db()
    c.execute(
        "INSERT INTO users(email,name,pw,data,created) VALUES(?,?,?,?,?)",
        (
            email,
            user["name"],
            generate_password_hash(password),
            json.dumps(user, ensure_ascii=False),
            datetime.now().strftime("%Y-%m-%d %H:%M"),
        ),
    )
    c.commit()
    session.clear()
    session["user_email"] = email
    return jsonify({"ok": True, "user": clean_user(user)})


@app.post("/api/auth/login")
def api_login():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("pass", ""))
    row = db().execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    if not row:
        return (
            jsonify({"ok": False, "error": "ไม่พบบัญชีนี้", "code": "USER_NOT_FOUND"}),
            404,
        )
    if not check_password_hash(row["pw"], password):
        return (
            jsonify(
                {
                    "ok": False,
                    "error": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
                    "code": "BAD_PASSWORD",
                }
            ),
            401,
        )
    session.clear()
    session["user_email"] = email
    return jsonify({"ok": True, "user": json_user(row)})


@app.post("/api/auth/logout")
def api_logout():
    session.pop("user_email", None)
    return jsonify({"ok": True})


@app.get("/api/me")
@user_required_api
def api_me():
    email = session["user_email"]
    row = db().execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    recs = (
        db()
        .execute("SELECT kind,data FROM recs WHERE email=? ORDER BY id DESC", (email,))
        .fetchall()
    )
    assessments, diary = [], []
    for r in recs:
        try:
            item = json.loads(r["data"])
        except (TypeError, ValueError):
            continue
        (
            assessments
            if r["kind"] == "assess"
            else diary if r["kind"] == "diary" else []
        ).append(item)
    return jsonify(
        {"ok": True, "user": json_user(row), "assessments": assessments, "diary": diary}
    )


@app.put("/api/me")
@user_required_api
def api_update_me():
    payload = request.get_json(silent=True) or {}
    user = clean_user(payload.get("user") or {})
    email = session["user_email"]
    row = db().execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    if not row:
        return jsonify({"ok": False, "error": "ไม่พบผู้ใช้"}), 404
    user["email"] = email
    name = str(user.get("name") or row["name"])
    user["name"] = name
    db().execute(
        "UPDATE users SET name=?, data=? WHERE email=?",
        (name, json.dumps(user, ensure_ascii=False), email),
    )
    db().commit()
    return jsonify({"ok": True, "user": user})


@app.put("/api/data")
@user_required_api
def api_save_data():
    payload = request.get_json(silent=True) or {}
    email = session["user_email"]
    row = db().execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    if not row:
        return jsonify({"ok": False, "error": "ไม่พบผู้ใช้"}), 404
    user = clean_user(payload.get("user") or json_user(row))
    user["email"] = email
    user["name"] = str(user.get("name") or row["name"])
    assessments = [x for x in (payload.get("assessments") or []) if isinstance(x, dict)]
    diary = [x for x in (payload.get("diary") or []) if isinstance(x, dict)]
    c = db()
    c.execute(
        "UPDATE users SET name=?, data=? WHERE email=?",
        (user["name"], json.dumps(user, ensure_ascii=False), email),
    )
    c.execute("DELETE FROM recs WHERE email=?", (email,))
    c.executemany(
        "INSERT INTO recs(email,kind,data) VALUES(?,?,?)",
        [(email, "assess", json.dumps(x, ensure_ascii=False)) for x in assessments]
        + [(email, "diary", json.dumps(x, ensure_ascii=False)) for x in diary],
    )
    c.commit()
    return jsonify({"ok": True})


# ---------------- Admin pages ----------------
BASE = """<!DOCTYPE html><html lang='th'><head><meta charset='UTF-8'>
<meta name='viewport' content='width=device-width,initial-scale=1'><title>AllergyGuard Admin</title>
<link href='https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap' rel='stylesheet'>
<style>
:root{--t:#0D9373;--bg:#F4F7F6;--tx:#1F2937;--mu:#6B7280;--bd:#E5E7EB}*{box-sizing:border-box}
body{margin:0;font-family:Sarabun,sans-serif;background:var(--bg);color:var(--tx)}nav{background:#fff;border-bottom:1px solid var(--bd);padding:12px 24px;display:flex;gap:18px;align-items:center;flex-wrap:wrap}
nav b{color:var(--t);font-size:18px;margin-right:auto}nav a{color:var(--tx);text-decoration:none;font-weight:600}main{max-width:1100px;margin:24px auto;padding:0 16px}
.card,.stat{background:#fff;border:1px solid var(--bd);border-radius:14px;padding:18px;margin-bottom:18px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px}.stat small{color:var(--mu)}.stat div{font-size:30px;font-weight:700;color:var(--t)}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--bd);vertical-align:top}th{color:var(--mu);font-weight:600}.tw{overflow-x:auto}
input,button{font:inherit;padding:8px 12px;border:1px solid var(--bd);border-radius:8px}button,.btn{background:var(--t);color:#fff;border:0;cursor:pointer;font-weight:600;text-decoration:none;padding:8px 14px;border-radius:8px;display:inline-block}.danger{background:#B91C1C}.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.msg{background:#ECFDF5;border:1px solid #A7F3D0;border-radius:8px;padding:10px 14px;margin-bottom:12px}.badge{color:#fff;border-radius:999px;padding:2px 10px;font-size:12px}h1,h2{margin:.2em 0 .6em}
</style></head><body>{% if session.admin %}<nav><b>🫁 AllergyGuard Admin</b><a href='{{ url_for("admin_dashboard") }}'>แดชบอร์ด</a><a href='{{ url_for("admin_users") }}'>ผู้ใช้</a><a href='{{ url_for("admin_logout") }}'>ออกจากระบบ</a></nav>{% endif %}<main>{% for m in msgs %}<div class='msg'>{{m}}</div>{% endfor %}{{inner|safe}}</main></body></html>"""

LOGIN = """<div class='card' style='max-width:380px;margin:60px auto'><h1>เข้าสู่ระบบแอดมิน</h1>
<form method='post' class='row' style='flex-direction:column;align-items:stretch'><input name='u' type='email' placeholder='อีเมลผู้ดูแล' required><input name='p' type='password' placeholder='รหัสผ่าน' required><button>เข้าสู่ระบบ</button></form></div>"""
DASH = """<h1>แดชบอร์ด</h1><div class='grid'><div class='stat'><small>ผู้ใช้ทั้งหมด</small><div>{{n_users}}</div></div><div class='stat'><small>ผลประเมินทั้งหมด</small><div>{{n_assess}}</div></div><div class='stat'><small>บันทึกอาการ</small><div>{{n_diary}}</div></div><div class='stat'><small>ความเสี่ยงสูง</small><div style='color:#B91C1C'>{{risk.get('hi',0)}}</div></div></div>
<div class='card'><h2>ความเสี่ยงจากผลประเมิน</h2>{% for k,(lb,c) in RISK.items() %}<span class='badge' style='background:{{c}}'>{{lb}}: {{risk.get(k,0)}}</span> {% endfor %}</div>
<div class='card'><h2>ผู้ใช้ล่าสุด</h2><div class='tw'><table><tr><th>ชื่อ</th><th>อีเมล</th><th>เพิ่มเมื่อ</th></tr>{% for r in recent %}<tr><td>{{r.name}}</td><td><a href='{{url_for("admin_user_detail",email=r.email)}}'>{{r.email}}</a></td><td>{{r.created}}</td></tr>{% else %}<tr><td colspan='3'>ยังไม่มีผู้ใช้</td></tr>{% endfor %}</table></div></div>"""
USERS = """<h1>ผู้ใช้</h1><div class='card'><form class='row' method='get'><input name='q' value='{{q}}' placeholder='ค้นหาชื่อหรืออีเมล'><button>ค้นหา</button></form></div>
<div class='card'><div class='tw'><table><tr><th>ชื่อ</th><th>อีเมล</th><th>ผลประเมิน</th><th>บันทึก</th><th></th></tr>{% for r in rows %}<tr><td>{{r.name}}</td><td><a href='{{url_for("admin_user_detail",email=r.email)}}'>{{r.email}}</a></td><td>{{r.na}}</td><td>{{r.nd}}</td><td><form method='post' action='{{url_for("admin_user_delete",email=r.email)}}' onsubmit=\"return confirm('ลบผู้ใช้นี้และข้อมูลทั้งหมด?')\"><button class='danger'>ลบ</button></form></td></tr>{% else %}<tr><td colspan='5'>ไม่พบผู้ใช้</td></tr>{% endfor %}</table></div></div>
<div class='card'><h2>เพิ่มผู้ใช้</h2><form method='post' action='{{url_for("admin_user_add")}}' class='row'><input name='name' placeholder='ชื่อ-นามสกุล' required><input name='email' type='email' placeholder='อีเมล' required><input name='pw' type='password' placeholder='รหัสผ่าน (≥ 8 ตัว)' minlength='8' required><button>เพิ่ม</button></form></div>
<div class='card'><h2>นำเข้าข้อมูลจากไฟล์</h2><p style='color:var(--mu)'>ใช้ไฟล์ allergyguard_data.json จากเมนูส่งออกข้อมูลในแอป</p><form method='post' action='{{url_for("admin_import")}}' enctype='multipart/form-data' class='row'><input type='file' name='f' accept='.json,application/json' required><button>นำเข้า</button></form></div>"""
DETAIL = """<p><a href='{{url_for("admin_users")}}'>← กลับ</a></p><h1>{{u.name}}</h1><div class='card'><div class='tw'><table>{% for k,v in info %}<tr><th style='width:180px'>{{k}}</th><td>{{v if v not in (None,'') else '-'}}</td></tr>{% endfor %}</table></div></div>
<div class='card'><h2>ประวัติการประเมิน ({{assess|length}})</h2><div class='tw'><table><tr><th>วันที่</th><th>ประเภทหลัก</th><th>ความเสี่ยง</th><th>ความรุนแรง</th><th>อาการ</th></tr>{% for a in assess %}{% set lb,c=RISK.get(a.get('r'),('-', '#6B7280')) %}<tr><td>{{a.get('dt')}}</td><td>{{a.get('topT')}}</td><td><span class='badge' style='background:{{c}}'>{{lb}}</span></td><td>{{a.get('sev')}}/10</td><td>{{a.get('syms',[])|join(', ')}}</td></tr>{% else %}<tr><td colspan='5'>ไม่มีข้อมูล</td></tr>{% endfor %}</table></div></div>
<div class='card'><h2>บันทึกอาการ ({{diary|length}})</h2><div class='tw'><table><tr><th>วันที่</th><th>ระดับ</th><th>อาการ</th><th>หมายเหตุ</th></tr>{% for d in diary %}<tr><td>{{d.get('date')}}</td><td>{{d.get('level')}}</td><td>{{d.get('syms',[])|join(', ')}}</td><td>{{d.get('note','')}}</td></tr>{% else %}<tr><td colspan='4'>ไม่มีข้อมูล</td></tr>{% endfor %}</table></div></div>"""


def admin_page(body, **ctx):
    inner = render_template_string(body, **ctx)
    return render_template_string(BASE, inner=inner, msgs=get_flashed_messages())


@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    if request.method == "POST":
        ok_u = hmac.compare_digest(request.form.get("u", ""), ADMIN_USER)
        ok_p = hmac.compare_digest(request.form.get("p", ""), ADMIN_PASSWORD)
        if ok_u and ok_p:
            session.clear()
            session["admin"] = True
            return redirect(url_for("admin_dashboard"))
        flash("อีเมลผู้ดูแลหรือรหัสผ่านไม่ถูกต้อง")
    return admin_page(LOGIN)


@app.route("/admin/logout")
def admin_logout():
    session.clear()
    return redirect(url_for("admin_login"))


@app.route("/admin")
@admin_required
def admin_dashboard():
    c = db()
    n_users = c.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    n_assess = c.execute("SELECT COUNT(*) FROM recs WHERE kind='assess'").fetchone()[0]
    n_diary = c.execute("SELECT COUNT(*) FROM recs WHERE kind='diary'").fetchone()[0]
    risk = {"hi": 0, "med": 0, "lo": 0}
    for r in c.execute("SELECT data FROM recs WHERE kind='assess'"):
        try:
            k = json.loads(r[0]).get("r")
            if k in risk:
                risk[k] += 1
        except Exception:
            pass
    recent = c.execute(
        "SELECT name,email,created FROM users ORDER BY created DESC LIMIT 8"
    ).fetchall()
    return admin_page(
        DASH,
        n_users=n_users,
        n_assess=n_assess,
        n_diary=n_diary,
        risk=risk,
        recent=recent,
        RISK=RISK,
    )


@app.route("/admin/users")
@admin_required
def admin_users():
    q = request.args.get("q", "").strip()
    rows = (
        db()
        .execute(
            """SELECT u.name,u.email,
        (SELECT COUNT(*) FROM recs r WHERE r.email=u.email AND r.kind='assess') na,
        (SELECT COUNT(*) FROM recs r WHERE r.email=u.email AND r.kind='diary') nd
        FROM users u WHERE u.name LIKE ? OR u.email LIKE ? ORDER BY u.created DESC""",
            (f"%{q}%", f"%{q}%"),
        )
        .fetchall()
    )
    return admin_page(USERS, rows=rows, q=q)


@app.route("/admin/users/<path:email>")
@admin_required
def admin_user_detail(email):
    c = db()
    row = c.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    if not row:
        flash("ไม่พบผู้ใช้")
        return redirect(url_for("admin_users"))
    u = json_user(row)
    labels = [
        ("อีเมล", "email"),
        ("อายุ", "age"),
        ("เพศ", "sex"),
        ("น้ำหนัก (กก.)", "wt"),
        ("ส่วนสูง (ซม.)", "ht"),
        ("หมู่เลือด", "bld"),
        ("ประวัติครอบครัว", "fam"),
        ("สภาพแวดล้อม", "env"),
        ("อาชีพ", "job"),
        ("สัตว์เลี้ยง", "pet"),
        ("แพ้อาหาร", "fa"),
        ("แพ้ยา", "da"),
        ("โรคประจำตัว", "dis"),
    ]
    info = [(lb, u.get(k)) for lb, k in labels]

    def get(kind):
        out = []
        for r in c.execute(
            "SELECT data FROM recs WHERE email=? AND kind=? ORDER BY id DESC",
            (email, kind),
        ):
            try:
                out.append(json.loads(r[0]))
            except Exception:
                pass
        return out

    return admin_page(
        DETAIL, u=u, info=info, assess=get("assess"), diary=get("diary"), RISK=RISK
    )


@app.post("/admin/users/add")
@admin_required
def admin_user_add():
    f = request.form
    email = f.get("email", "").strip().lower()
    name = f.get("name", "").strip()
    pw = f.get("pw", "")
    if not email or not name or len(pw) < 8:
        flash("กรอกข้อมูลไม่ครบ (รหัสผ่านอย่างน้อย 8 ตัว)")
    elif db().execute("SELECT 1 FROM users WHERE email=?", (email,)).fetchone():
        flash("อีเมลนี้มีผู้ใช้งานแล้ว")
    else:
        data = {"email": email, "name": name}
        db().execute(
            "INSERT INTO users VALUES(?,?,?,?,?)",
            (
                email,
                name,
                generate_password_hash(pw),
                json.dumps(data, ensure_ascii=False),
                datetime.now().strftime("%Y-%m-%d %H:%M"),
            ),
        )
        db().commit()
        flash("เพิ่มผู้ใช้แล้ว")
    return redirect(url_for("admin_users"))


@app.post("/admin/users/<path:email>/delete")
@admin_required
def admin_user_delete(email):
    c = db()
    c.execute("DELETE FROM recs WHERE email=?", (email,))
    c.execute("DELETE FROM users WHERE email=?", (email,))
    c.commit()
    flash("ลบผู้ใช้แล้ว")
    return redirect(url_for("admin_users"))


@app.post("/admin/import")
@admin_required
def admin_import():
    try:
        data = json.load(request.files["f"])
        u = dict(data["user"])
        email = str(u["email"]).strip().lower()
        name = str(u.get("name") or email)
        u.pop("pass", None)
        assessments = [x for x in data.get("assessments", []) if isinstance(x, dict)]
        diary = [x for x in data.get("diary", []) if isinstance(x, dict)]
    except Exception:
        flash("ไฟล์ไม่ถูกต้อง — ต้องเป็นไฟล์ที่ส่งออกจากแอป AllergyGuard")
        return redirect(url_for("admin_users"))
    c = db()
    existing = c.execute("SELECT 1 FROM users WHERE email=?", (email,)).fetchone()
    if existing:
        c.execute(
            "UPDATE users SET name=?,data=? WHERE email=?",
            (name, json.dumps(u, ensure_ascii=False), email),
        )
    else:
        c.execute(
            "INSERT INTO users(email,name,pw,data,created) VALUES(?,?,?,?,?)",
            (
                email,
                name,
                generate_password_hash(os.urandom(12).hex()),
                json.dumps(u, ensure_ascii=False),
                datetime.now().strftime("%Y-%m-%d %H:%M"),
            ),
        )
    c.execute("DELETE FROM recs WHERE email=?", (email,))
    c.executemany(
        "INSERT INTO recs(email,kind,data) VALUES(?,?,?)",
        [(email, "assess", json.dumps(x, ensure_ascii=False)) for x in assessments]
        + [(email, "diary", json.dumps(x, ensure_ascii=False)) for x in diary],
    )
    c.commit()
    flash(
        f"นำเข้าข้อมูลของ {name} แล้ว (ประเมิน {len(assessments)}, บันทึก {len(diary)})"
    )
    return redirect(url_for("admin_user_detail", email=email))


if __name__ == "__main__":
    init_db()
    if ADMIN_PASSWORD == "admin1234":
        print(
            "⚠️ ใช้รหัสผ่านทดสอบ admin / admin1234 — ตั้ง ADMIN_PASSWORD ก่อนใช้งานจริง"
        )
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), debug=False)
