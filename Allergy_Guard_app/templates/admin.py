"""AllergyGuard Admin
ติดตั้ง:  pip install flask
รัน:      python admin.py   แล้วเปิด http://localhost:5000
ตั้งค่า (ตัวแปร environment): ADMIN_USER, ADMIN_PASSWORD, SECRET_KEY, ADMIN_DB
"""
import hmac, json, os, sqlite3
from collections import Counter
from datetime import datetime
from functools import wraps

from flask import Flask, flash, g, get_flashed_messages, redirect, render_template_string, request, session, url_for
from werkzeug.security import generate_password_hash

DB = os.environ.get("ADMIN_DB", "admin.db")
ADMIN_USER = os.environ.get("ADMIN_USER", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin1234")  # ค่าทดสอบ — เปลี่ยนก่อนใช้งานจริง

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-only-change-me")
app.config.update(SESSION_COOKIE_SAMESITE="Lax", MAX_CONTENT_LENGTH=2 * 1024 * 1024)

RISK = {"hi": ("สูง", "#B91C1C"), "med": ("ปานกลาง", "#D97706"), "lo": ("ต่ำ", "#0D9373")}


# ---------- database ----------
def db():
    if "db" not in g:
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
        c.executescript(
            """CREATE TABLE IF NOT EXISTS users(email TEXT PRIMARY KEY, name TEXT, pw TEXT, data TEXT, created TEXT);
               CREATE TABLE IF NOT EXISTS recs(id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, kind TEXT, data TEXT);
               CREATE INDEX IF NOT EXISTS ix_recs ON recs(email, kind);"""
        )


def login_required(f):
    @wraps(f)
    def w(*a, **k):
        return f(*a, **k) if session.get("admin") else redirect(url_for("login"))
    return w


# ---------- templates ----------
BASE = """<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AllergyGuard Admin</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
<style>
:root{--t:#0D9373;--bg:#F4F7F6;--tx:#1F2937;--mu:#6B7280;--bd:#E5E7EB}
*{box-sizing:border-box}body{margin:0;font-family:Sarabun,sans-serif;background:var(--bg);color:var(--tx)}
nav{background:#fff;border-bottom:1px solid var(--bd);padding:12px 24px;display:flex;gap:18px;align-items:center;flex-wrap:wrap}
nav b{color:var(--t);font-size:18px;margin-right:auto}nav a{color:var(--tx);text-decoration:none;font-weight:600}
main{max-width:1100px;margin:24px auto;padding:0 16px}
.card{background:#fff;border:1px solid var(--bd);border-radius:14px;padding:18px;margin-bottom:18px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px}
.stat{background:#fff;border:1px solid var(--bd);border-radius:14px;padding:16px}
.stat small{color:var(--mu)}.stat div{font-size:30px;font-weight:700;color:var(--t)}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--bd);vertical-align:top}
th{color:var(--mu);font-weight:600}.tw{overflow-x:auto}
input,button{font:inherit;padding:8px 12px;border:1px solid var(--bd);border-radius:8px}
button,.btn{background:var(--t);color:#fff;border:0;cursor:pointer;font-weight:600;text-decoration:none;padding:8px 14px;border-radius:8px;display:inline-block}
.danger{background:#B91C1C}.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.msg{background:#ECFDF5;border:1px solid #A7F3D0;border-radius:8px;padding:10px 14px;margin-bottom:12px}
.badge{color:#fff;border-radius:999px;padding:2px 10px;font-size:12px}h1,h2{margin:.2em 0 .6em}
</style></head><body>
{% if session.admin %}<nav><b>🫁 AllergyGuard Admin</b><a href="{{ url_for('dashboard') }}">แดชบอร์ด</a>
<a href="{{ url_for('users') }}">ผู้ใช้</a><a href="{{ url_for('logout') }}">ออกจากระบบ</a></nav>{% endif %}
<main>{% for m in msgs %}<div class="msg">{{ m }}</div>{% endfor %}{{ inner|safe }}</main></body></html>"""


def page(body, **ctx):
    inner = render_template_string(body, **ctx)
    return render_template_string(BASE, inner=inner, msgs=get_flashed_messages())


LOGIN = """<div class="card" style="max-width:380px;margin:60px auto"><h1>เข้าสู่ระบบแอดมิน</h1>
<form method="post" class="row" style="flex-direction:column;align-items:stretch">
<input name="u" placeholder="ชื่อผู้ใช้" required><input name="p" type="password" placeholder="รหัสผ่าน" required>
<button>เข้าสู่ระบบ</button></form></div>"""

DASH = """<h1>แดชบอร์ด</h1>
<div class="grid"><div class="stat"><small>ผู้ใช้ทั้งหมด</small><div>{{ n_users }}</div></div>
<div class="stat"><small>ผลประเมินทั้งหมด</small><div>{{ n_assess }}</div></div>
<div class="stat"><small>บันทึกอาการ</small><div>{{ n_diary }}</div></div>
<div class="stat"><small>ความเสี่ยงสูง</small><div style="color:#B91C1C">{{ risk.get('hi', 0) }}</div></div></div>
<div class="card" style="margin-top:18px"><h2>ความเสี่ยงจากผลประเมิน</h2>
{% for k, (lb, c) in RISK.items() %}<span class="badge" style="background:{{ c }}">{{ lb }}: {{ risk.get(k, 0) }}</span> {% endfor %}</div>
<div class="card"><h2>ผู้ใช้ล่าสุด</h2><div class="tw"><table><tr><th>ชื่อ</th><th>อีเมล</th><th>เพิ่มเมื่อ</th></tr>
{% for r in recent %}<tr><td>{{ r.name }}</td><td><a href="{{ url_for('user_detail', email=r.email) }}">{{ r.email }}</a></td><td>{{ r.created }}</td></tr>
{% else %}<tr><td colspan="3">ยังไม่มีผู้ใช้ — เพิ่มหรือนำเข้าที่หน้า "ผู้ใช้"</td></tr>{% endfor %}</table></div></div>"""

USERS = """<h1>ผู้ใช้</h1>
<div class="card"><form class="row" method="get"><input name="q" value="{{ q }}" placeholder="ค้นหาชื่อหรืออีเมล">
<button>ค้นหา</button></form></div>
<div class="card"><div class="tw"><table><tr><th>ชื่อ</th><th>อีเมล</th><th>ผลประเมิน</th><th>บันทึก</th><th></th></tr>
{% for r in rows %}<tr><td>{{ r.name }}</td><td><a href="{{ url_for('user_detail', email=r.email) }}">{{ r.email }}</a></td>
<td>{{ r.na }}</td><td>{{ r.nd }}</td><td><form method="post" action="{{ url_for('user_delete', email=r.email) }}"
onsubmit="return confirm('ลบผู้ใช้นี้และข้อมูลทั้งหมด?')"><button class="danger">ลบ</button></form></td></tr>
{% else %}<tr><td colspan="5">ไม่พบผู้ใช้</td></tr>{% endfor %}</table></div></div>
<div class="card"><h2>เพิ่มผู้ใช้</h2><form method="post" action="{{ url_for('user_add') }}" class="row">
<input name="name" placeholder="ชื่อ-นามสกุล" required><input name="email" type="email" placeholder="อีเมล" required>
<input name="pw" type="password" placeholder="รหัสผ่าน (≥ 8 ตัว)" minlength="8" required><button>เพิ่ม</button></form></div>
<div class="card"><h2>นำเข้าข้อมูลจากแอป</h2>
<p style="color:var(--mu)">ในแอป ไปที่ <b>โปรไฟล์ → ส่งออกข้อมูล</b> จะได้ไฟล์ <code>allergyguard_data.json</code> แล้วอัปโหลดที่นี่
(นำเข้าซ้ำ = แทนที่ข้อมูลเดิมของผู้ใช้นั้น)</p>
<form method="post" action="{{ url_for('import_json') }}" enctype="multipart/form-data" class="row">
<input type="file" name="f" accept=".json,application/json" required><button>นำเข้า</button></form></div>"""

DETAIL = """<p><a href="{{ url_for('users') }}">← กลับ</a></p><h1>{{ u.name }}</h1>
<div class="card"><div class="tw"><table>{% for k, v in info %}<tr><th style="width:180px">{{ k }}</th><td>{{ v if v not in (None, '') else '-' }}</td></tr>{% endfor %}</table></div></div>
<div class="card"><h2>ประวัติการประเมิน ({{ assess|length }})</h2><div class="tw"><table>
<tr><th>วันที่</th><th>ประเภทหลัก</th><th>ความเสี่ยง</th><th>ความรุนแรง</th><th>อาการ</th></tr>
{% for a in assess %}{% set lb, c = RISK.get(a.get('r'), ('-', '#6B7280')) %}<tr><td>{{ a.get('dt') }}</td><td>{{ a.get('topT') }}</td>
<td><span class="badge" style="background:{{ c }}">{{ lb }}</span></td><td>{{ a.get('sev') }}/10</td><td>{{ a.get('syms', [])|join(', ') }}</td></tr>
{% else %}<tr><td colspan="5">ไม่มีข้อมูล</td></tr>{% endfor %}</table></div></div>
<div class="card"><h2>บันทึกอาการ ({{ diary|length }})</h2><div class="tw"><table>
<tr><th>วันที่</th><th>ระดับ</th><th>อาการ</th><th>หมายเหตุ</th></tr>
{% for d in diary %}<tr><td>{{ d.get('date') }}</td><td>{{ d.get('level') }}</td><td>{{ d.get('syms', [])|join(', ') }}</td><td>{{ d.get('note', '') }}</td></tr>
{% else %}<tr><td colspan="4">ไม่มีข้อมูล</td></tr>{% endfor %}</table></div></div>"""


# ---------- routes ----------
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        ok_u = hmac.compare_digest(request.form.get("u", ""), ADMIN_USER)
        ok_p = hmac.compare_digest(request.form.get("p", ""), ADMIN_PASSWORD)
        if ok_u and ok_p:
            session.clear()
            session["admin"] = True
            return redirect(url_for("dashboard"))
        flash("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
    return page(LOGIN)


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.route("/")
@login_required
def dashboard():
    c = db()
    risk = Counter(json.loads(r["data"]).get("r") for r in c.execute("SELECT data FROM recs WHERE kind='assess'"))
    count = lambda sql: c.execute(sql).fetchone()[0]
    return page(
        DASH, RISK=RISK, risk=risk,
        n_users=count("SELECT COUNT(*) FROM users"),
        n_assess=count("SELECT COUNT(*) FROM recs WHERE kind='assess'"),
        n_diary=count("SELECT COUNT(*) FROM recs WHERE kind='diary'"),
        recent=c.execute("SELECT name, email, created FROM users ORDER BY created DESC LIMIT 5").fetchall(),
    )


@app.route("/users")
@login_required
def users():
    q = request.args.get("q", "").strip()
    rows = db().execute(
        """SELECT u.name, u.email,
           (SELECT COUNT(*) FROM recs r WHERE r.email=u.email AND r.kind='assess') AS na,
           (SELECT COUNT(*) FROM recs r WHERE r.email=u.email AND r.kind='diary') AS nd
           FROM users u WHERE u.name LIKE ? OR u.email LIKE ? ORDER BY u.created DESC""",
        (f"%{q}%", f"%{q}%"),
    ).fetchall()
    return page(USERS, rows=rows, q=q)


@app.route("/users/<email>")
@login_required
def user_detail(email):
    c = db()
    u = c.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    if not u:
        flash("ไม่พบผู้ใช้")
        return redirect(url_for("users"))
    d = json.loads(u["data"] or "{}")
    labels = [("อีเมล", "email"), ("อายุ", "age"), ("เพศ", "sex"), ("น้ำหนัก (กก.)", "wt"), ("ส่วนสูง (ซม.)", "ht"),
              ("หมู่เลือด", "bld"), ("ประวัติครอบครัว", "fam"), ("สภาพแวดล้อม", "env"), ("อาชีพ", "job"),
              ("สัตว์เลี้ยง", "pet"), ("แพ้อาหาร", "fa"), ("แพ้ยา", "da"), ("โรคประจำตัว", "dis")]
    info = [(lb, u["email"] if k == "email" else d.get(k)) for lb, k in labels]
    get = lambda kind: [json.loads(r["data"]) for r in c.execute(
        "SELECT data FROM recs WHERE email=? AND kind=? ORDER BY id DESC", (email, kind))]
    return page(DETAIL, u=u, info=info, assess=get("assess"), diary=get("diary"), RISK=RISK)


@app.route("/users/add", methods=["POST"])
@login_required
def user_add():
    f = request.form
    email, name, pw = f.get("email", "").strip().lower(), f.get("name", "").strip(), f.get("pw", "")
    if not email or not name or len(pw) < 8:
        flash("กรอกข้อมูลไม่ครบ (รหัสผ่านอย่างน้อย 8 ตัว)")
    elif db().execute("SELECT 1 FROM users WHERE email=?", (email,)).fetchone():
        flash("อีเมลนี้มีผู้ใช้งานแล้ว")
    else:
        db().execute("INSERT INTO users VALUES(?,?,?,?,?)",
                     (email, name, generate_password_hash(pw), json.dumps({"name": name}), datetime.now().strftime("%Y-%m-%d %H:%M")))
        db().commit()
        flash("เพิ่มผู้ใช้แล้ว")
    return redirect(url_for("users"))


@app.route("/users/<email>/delete", methods=["POST"])
@login_required
def user_delete(email):
    db().execute("DELETE FROM recs WHERE email=?", (email,))
    db().execute("DELETE FROM users WHERE email=?", (email,))
    db().commit()
    flash("ลบผู้ใช้แล้ว")
    return redirect(url_for("users"))


@app.route("/import", methods=["POST"])
@login_required
def import_json():
    try:
        data = json.load(request.files["f"])
        u = data["user"]
        email = str(u["email"]).strip().lower()
        name = str(u.get("name") or email)
        u = {k: v for k, v in u.items() if k != "pass"}  # ไม่เก็บรหัสผ่านจากไฟล์ส่งออก
        assess = [x for x in data.get("assessments", []) if isinstance(x, dict)]
        diary = [x for x in data.get("diary", []) if isinstance(x, dict)]
    except (KeyError, TypeError, ValueError, AttributeError):
        flash("ไฟล์ไม่ถูกต้อง — ต้องเป็นไฟล์ที่ส่งออกจากแอป AllergyGuard")
        return redirect(url_for("users"))
    c = db()
    c.execute(
        """INSERT INTO users(email, name, pw, data, created) VALUES(?,?,NULL,?,?)
           ON CONFLICT(email) DO UPDATE SET name=excluded.name, data=excluded.data""",
        (email, name, json.dumps(u, ensure_ascii=False), datetime.now().strftime("%Y-%m-%d %H:%M")),
    )
    c.execute("DELETE FROM recs WHERE email=?", (email,))
    c.executemany("INSERT INTO recs(email, kind, data) VALUES(?,?,?)",
                  [(email, "assess", json.dumps(x, ensure_ascii=False)) for x in assess]
                  + [(email, "diary", json.dumps(x, ensure_ascii=False)) for x in diary])
    c.commit()
    flash(f"นำเข้าข้อมูลของ {name} แล้ว (ประเมิน {len(assess)}, บันทึก {len(diary)})")
    return redirect(url_for("user_detail", email=email))


if __name__ == "__main__":
    init_db()
    if ADMIN_PASSWORD == "admin1234":
        print("⚠️  ใช้รหัสผ่านทดสอบ admin / admin1234 — ตั้ง ADMIN_PASSWORD ก่อนใช้งานจริง")
    app.run(host="127.0.0.1", port=5000, debug=False)
