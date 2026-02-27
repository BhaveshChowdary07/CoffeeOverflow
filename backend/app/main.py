# # backend/app/main.py

# from fastapi import (
#     FastAPI, Depends, WebSocket, WebSocketDisconnect,
#     HTTPException, status
# )
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
# from fastapi.responses import StreamingResponse
# from sqlalchemy.orm import Session
# from datetime import datetime, timezone
# from jose import JWTError, jwt
# from dotenv import load_dotenv
# import os, io, pdfkit, pytz
# import asyncio
# from .utils_twilio import call_family



# from .db import SessionLocal, engine, Base
# from . import models, schemas, utils, ml_detector
# from .ws_manager import manager
# from .auth import (
#     verify_password, get_password_hash,
#     create_access_token, SECRET_KEY, ALGORITHM,
#     create_reset_token, RESET_EXPIRE_MINUTES,
# )
# from .utils_email import send_email


# WKHTMLTOPDF_PATH = r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe"

# pdf_config = pdfkit.configuration(
#     wkhtmltopdf=WKHTMLTOPDF_PATH
# )





# # ---------------- INIT ----------------
# load_dotenv()
# Base.metadata.create_all(bind=engine)

# app = FastAPI(title="MediWatch Remote Monitoring")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:5173",
#         "http://127.0.0.1:5173"
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# # ---------------- TIME HELPERS ----------------
# IST = pytz.timezone("Asia/Kolkata")

# def ist_str(dt: datetime) -> str:
#     if dt.tzinfo is None:
#         dt = dt.replace(tzinfo=timezone.utc)
#     return dt.astimezone(IST).strftime("%d-%b-%Y %I:%M:%S %p IST")

# # ---------------- DB DEP ----------------
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# # ---------------- AUTH HELPERS ----------------
# def get_user_by_username(db: Session, username: str):
#     return db.query(models.User).filter(models.User.username == username).first()

# async def get_current_user(
#     token: str = Depends(oauth2_scheme),
#     db: Session = Depends(get_db),
# ):
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         username = payload.get("sub")
#         if not username:
#             raise JWTError()
#     except JWTError:
#         raise HTTPException(status_code=401, detail="Invalid token")

#     user = get_user_by_username(db, username)
#     if not user:
#         raise HTTPException(status_code=401, detail="User not found")
#     return user

# # ---------------- AUTH ----------------
# @app.post("/auth/register", response_model=schemas.UserOut)
# def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
#     if get_user_by_username(db, user_in.username):
#         raise HTTPException(400, "Username already exists")

#     user = models.User(
#         username=user_in.username,
#         email=user_in.email,
#         full_name=user_in.full_name,
#         role=user_in.role,
#         hashed_password=get_password_hash(user_in.password),
#     )
#     db.add(user); db.commit(); db.refresh(user)

#     if user.role == "patient":
#         db.add(models.Patient(user_id=user.id))
#         db.commit()

#     return user

# @app.post("/auth/login", response_model=schemas.Token)
# def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
#     user = get_user_by_username(db, form.username)
#     if not user or not verify_password(form.password, user.hashed_password):
#         raise HTTPException(401, "Invalid credentials")

#     token = create_access_token({
#         "sub": user.username,
#         "role": user.role,
#         "user_id": user.id
#     })
#     return {"access_token": token, "token_type": "bearer"}

# @app.get("/users/me", response_model=schemas.UserOut)
# def me(current_user: models.User = Depends(get_current_user)):
#     return current_user

# # ---------------- FORGOT PASSWORD ----------------
# @app.post("/auth/forgot")
# def forgot(payload: dict, db: Session = Depends(get_db)):
#     email = payload.get("email")
#     if not email:
#         raise HTTPException(400, "email required")

#     user = db.query(models.User).filter(models.User.email == email).first()
#     if not user:
#         return {"status": "ok"}

#     token = create_reset_token(user.username)
#     reset_link = f"http://localhost:5173/reset-password?token={token}"

#     send_email(
#         user.email,
#         "MediWatch Password Reset",
#         f"Reset link:\n{reset_link}\nValid for {RESET_EXPIRE_MINUTES} minutes"
#     )
#     return {"status": "ok"}

# @app.post("/auth/reset")
# def reset(payload: dict, db: Session = Depends(get_db)):
#     token = payload.get("token")
#     new_password = payload.get("new_password")

#     try:
#         data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         username = data.get("sub")
#     except JWTError:
#         raise HTTPException(400, "Invalid token")

#     user = get_user_by_username(db, username)
#     if not user:
#         raise HTTPException(404, "User not found")

#     user.hashed_password = get_password_hash(new_password)
#     db.commit()
#     return {"status": "ok"}



# async def escalate_if_not_ack(alert_id: int):
#     await asyncio.sleep(180)  # ⏱ 3 minutes

#     db = SessionLocal()
#     alert = db.query(models.Alert).get(alert_id)

#     if not alert or alert.acknowledged or alert.escalated:
#         db.close()
#         return

#     patient = db.query(models.Patient).get(alert.patient_id)
#     user = db.query(models.User).get(patient.user_id)

#     # 📍 Google Maps link
#     location_url = None
#     if patient.lat and patient.lng:
#         location_url = f"https://www.google.com/maps?q={patient.lat},{patient.lng}"

#     # 📞 CALL FAMILY
#     call_family(
#         patient.get_contacts(),
#         user.full_name or user.username
#     )

#     # 📧 SEND LOCATION EMAIL
#     if user.email and location_url:
#         send_email(
#             user.email,
#             "MediWatch Emergency – Live Location",
#             f"Patient live location:\n{location_url}"
#         )

#     alert.escalated = True
#     db.commit()
#     db.close()


# # ---------------- READINGS ----------------
# @app.post("/readings")
# async def receive_reading(r: dict, db: Session = Depends(get_db)):
#     r["timestamp"] = r.get("timestamp") or datetime.now(timezone.utc).isoformat()
#     hashv = utils.sha256_hash_reading(r)

#     reading = models.Reading(
#         patient_id=r["patient_id"],
#         heart_rate=r["heart_rate"],
#         spo2=r["spo2"],
#         bp_sys=r["bp_sys"],
#         bp_dia=r["bp_dia"],
#         temperature=r["temperature"],
#         hash=hashv,
#     )
#     db.add(reading); db.commit(); db.refresh(reading)

#     issues = ml_detector.threshold_check(r)
#     severity = "critical" if issues else None
#     message = "; ".join(issues) if issues else ""

#     if severity:
#         alert = models.Alert(
#             patient_id=r["patient_id"],
#             severity=severity,
#             message=message,
#         )
#         db.add(alert); db.commit(); db.refresh(alert)

#         patient = db.query(models.Patient).filter_by(id=r["patient_id"]).first()
#         user = db.query(models.User).filter_by(id=patient.user_id).first()

#         # EMAIL
#         if user and user.email:
#             send_email(
#                 user.email,
#                 f"MediWatch Alert – {severity.upper()}",
#                 f"Severity: {severity.upper()}\n"
#                 f"Message: {message}\n"
#                 f"Timestamp (IST): {ist_str(alert.timestamp)}\n"
#                 f"Patient ID: {alert.patient_id}"
#             )

#         # SMS (mock)
#         utils.notify_family_numbers(patient.get_contacts(), alert)

#         await manager.broadcast_json({
#             "type": "alert",
#             "alert": {
#                  "id": alert.id,  
#                 "patient_id": alert.patient_id,
#                 "severity": alert.severity,
#                 "message": alert.message
#             }
#         })
#         asyncio.create_task(escalate_if_not_ack(alert.id))

#     await manager.broadcast_json({
#         "type": "reading",
#         "reading": {
#             **r,
#             "timestamp": r["timestamp"]
#         }
#     })

#     return {"status": "ok"}

# # ---------------- WS ----------------
# @app.websocket("/ws")
# async def ws(ws: WebSocket):
#     await manager.connect(ws)
#     try:
#         while True:
#             await ws.receive_text()
#             await ws.send_text("pong")
#     except WebSocketDisconnect:
#         manager.disconnect(ws)

# # ---------------- PATIENTS ----------------
# @app.get("/patients")
# def list_patients(
#     db: Session = Depends(get_db),
#     current_user: models.User = Depends(get_current_user)
# ):
#     if current_user.role == "doctor":
#         patients = db.query(models.Patient).all()
#     else:
#         patients = db.query(models.Patient).filter_by(user_id=current_user.id).all()

#     out = []
#     for p in patients:
#         u = db.query(models.User).get(p.user_id)
#         out.append({
#             "id": p.id,
#             "user_id": p.user_id,
#             "assigned_doctor_id": p.assigned_doctor_id,
#             "emergency_contacts": p.get_contacts(),
#             "user": {
#                 "username": u.username,
#                 "full_name": u.full_name,
#                 "email": u.email
#             }
#         })
#     return out

# # contacts
# @app.post("/patients/{patient_id}/location")
# def update_location(
#     patient_id: int,
#     payload: dict,
#     db: Session = Depends(get_db),
#     current_user: models.User = Depends(get_current_user),
# ):
#     p = db.query(models.Patient).get(patient_id)
#     if not p:
#         raise HTTPException(404)

#     if p.user_id != current_user.id:
#         raise HTTPException(403)

#     p.lat = payload.get("lat")
#     p.lng = payload.get("lng")
#     db.commit()

#     return {"status": "location saved"}


# # ---------------- PDF ----------------
# @app.get("/reports/pdf")
# def pdf(
#     limit: int = 50,
#     db: Session = Depends(get_db),
#     current_user: models.User = Depends(get_current_user),
# ):
#     readings = (
#         db.query(models.Reading)
#         .order_by(models.Reading.timestamp.desc())
#         .limit(limit)
#         .all()
#     )

#     if not readings:
#         raise HTTPException(status_code=404, detail="No readings found")

#     rows = ""
#     for r in readings:
#         rows += f"""
#         <tr>
#             <td>{r.patient_id}</td>
#             <td>{ist_str(r.timestamp)}</td>
#             <td>{r.heart_rate}</td>
#             <td>{r.spo2}</td>
#             <td>{r.bp_sys}/{r.bp_dia}</td>
#             <td>{r.temperature}</td>
#         </tr>
#         """

#     html = f"""
#     <!DOCTYPE html>
#     <html>
#     <head>
#         <meta charset="utf-8">
#         <title>MediWatch Report</title>
#         <style>
#             body {{
#                 font-family: Arial, sans-serif;
#                 font-size: 12px;
#             }}
#             h1 {{
#                 text-align: center;
#             }}
#             table {{
#                 width: 100%;
#                 border-collapse: collapse;
#             }}
#             th, td {{
#                 border: 1px solid #333;
#                 padding: 6px;
#                 text-align: center;
#             }}
#             th {{
#                 background-color: #f0f0f0;
#             }}
#         </style>
#     </head>
#     <body>
#         <h1>MediWatch – Patient Report</h1>
#         <p><strong>User:</strong> {current_user.username}</p>
#         <p><strong>Generated (IST):</strong> {ist_str(datetime.utcnow())}</p>

#         <table>
#             <tr>
#                 <th>Patient</th>
#                 <th>Timestamp (IST)</th>
#                 <th>HR</th>
#                 <th>SpO₂</th>
#                 <th>BP</th>
#                 <th>Temp</th>
#             </tr>
#             {rows}
#         </table>
#     </body>
#     </html>
#     """

#     try:
#         pdf_bytes = pdfkit.from_string(
#             html,
#             False,
#             configuration=pdf_config
#         )
#     except Exception as e:
#         print("PDF generation error:", e)
#         raise HTTPException(status_code=500, detail="PDF generation failed")

#     return StreamingResponse(
#         io.BytesIO(pdf_bytes),
#         media_type="application/pdf",
#         headers={
#             "Content-Disposition": "attachment; filename=mediwatch_report.pdf"
#         },
#     )


# @app.post("/alerts/{alert_id}/ack")
# def acknowledge_alert(
#     alert_id: int,
#     db: Session = Depends(get_db),
#     current_user: models.User = Depends(get_current_user),
# ):
#     if current_user.role != "doctor":
#         raise HTTPException(403)

#     alert = db.query(models.Alert).get(alert_id)
#     if not alert:
#         raise HTTPException(404)

#     alert.acknowledged = True
#     alert.acknowledged_by = current_user.id
#     alert.acknowledged_at = datetime.now(timezone.utc)

#     utils.audit(db, current_user.id, "ALERT_ACK", f"alert_id={alert_id}")

#     db.commit()
#     return {"status": "acknowledged"}
# @app.post("/patients/{patient_id}/notes")
# def add_note(
#     patient_id: int,
#     payload: dict,
#     db: Session = Depends(get_db),
#     current_user: models.User = Depends(get_current_user),
# ):
#     if current_user.role != "doctor":
#         raise HTTPException(403)

#     note = models.DoctorNote(
#         patient_id=patient_id,
#         doctor_id=current_user.id,
#         note=payload.get("note", ""),
#     )
#     db.add(note)
#     utils.audit(db, current_user.id, "ADD_NOTE", f"patient_id={patient_id}")
#     db.commit()

#     return {"status": "saved"}


# @app.get("/patients/{patient_id}/notes")
# def list_notes(patient_id: int, db: Session = Depends(get_db)):
#     return (
#         db.query(models.DoctorNote)
#         .filter_by(patient_id=patient_id)
#         .order_by(models.DoctorNote.created_at.desc())
#         .all()
#     )
# @app.get("/patients/{patient_id}/history")
# def patient_history(
#     patient_id: int,
#     db: Session = Depends(get_db),
#     current_user: models.User = Depends(get_current_user),
# ):
#     return {
#         "alerts": db.query(models.Alert).filter_by(patient_id=patient_id).all(),
#         "notes": db.query(models.DoctorNote).filter_by(patient_id=patient_id).all(),
#         "readings": db.query(models.Reading)
#             .filter_by(patient_id=patient_id)
#             .order_by(models.Reading.timestamp.desc())
#             .limit(100)
#             .all(),
#     }
# @app.post("/users/theme")
# def update_theme(
#     payload: dict,
#     db: Session = Depends(get_db),
#     current_user: models.User = Depends(get_current_user),
# ):
#     current_user.theme = payload.get("theme", "dark")
#     utils.audit(db, current_user.id, "THEME_CHANGE", current_user.theme)
#     db.commit()
#     return {"status": "ok"}


from fastapi import (
    FastAPI, Depends, WebSocket, WebSocketDisconnect,
    HTTPException, Request
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from jose import JWTError, jwt
from dotenv import load_dotenv
import io, pdfkit, pytz, asyncio

from .db import SessionLocal, engine, Base, get_db
from . import models, schemas, utils, ml_detector
from .ws_manager import manager
from .auth import (
    verify_password, get_password_hash,
    create_access_token, create_token_pair, decode_refresh_token,
    SECRET_KEY, ALGORITHM,
    create_reset_token, RESET_EXPIRE_MINUTES,
    oauth2_scheme, get_current_user, get_user_by_username
)
from .utils_email import send_email
from .utils_twilio import call_family

# ---------------- INIT ----------------
load_dotenv()
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MediWatch Remote Monitoring")

from .hospitals import router as hospital_router
from .agent import router as agent_router
app.include_router(hospital_router)
app.include_router(agent_router)


# ---------------- OPTIONS FIX ----------------
@app.options("/{path:path}")
async def options_handler(path: str, request: Request):
    return Response(status_code=200)

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- SECURITY ----------------

# ---------------- PDF CONFIG ----------------
WKHTMLTOPDF_PATH = r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe"
pdf_config = pdfkit.configuration(wkhtmltopdf=WKHTMLTOPDF_PATH)

# ---------------- TIME ----------------
IST = pytz.timezone("Asia/Kolkata")

def ist_str(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(IST).strftime("%d-%b-%Y %I:%M:%S %p IST")

# ---------------- AUTH ----------------
@app.post("/auth/register", response_model=schemas.UserOut)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    if get_user_by_username(db, user_in.username):
        raise HTTPException(400, "Username already exists")

    user = models.User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        role=user_in.role,
        hashed_password=get_password_hash(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if user.role == "patient":
        db.add(models.Patient(user_id=user.id))
        db.commit()

    return user

@app.post("/auth/login", response_model=schemas.Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_user_by_username(db, form.username)
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return create_token_pair(user)


@app.post("/auth/refresh", response_model=schemas.Token)
def refresh_tokens(payload: dict, db: Session = Depends(get_db)):
    """
    Exchange a valid refresh token for a new access + refresh token pair.
    Body: { "refresh_token": "<token>" }
    """
    raw = payload.get("refresh_token")
    if not raw:
        raise HTTPException(status_code=422, detail="refresh_token is required")

    data = decode_refresh_token(raw)  # raises 401 if invalid/expired
    user = get_user_by_username(db, data.get("sub"))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return create_token_pair(user)


@app.get("/users/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user

# ---------------- FORGOT PASSWORD ----------------
@app.post("/auth/forgot")
def forgot(payload: dict, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(email=payload.get("email")).first()
    if not user:
        return {"status": "ok"}

    token = create_reset_token(user.username)
    link = f"http://localhost:5173/reset-password?token={token}"

    send_email(user.email, "MediWatch Password Reset", f"Reset link:\n{link}")
    return {"status": "ok"}

@app.post("/auth/reset")
def reset(payload: dict, db: Session = Depends(get_db)):
    try:
        data = jwt.decode(payload["token"], SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(400, "Invalid token")

    user = get_user_by_username(db, data["sub"])
    user.hashed_password = get_password_hash(payload["new_password"])
    db.commit()
    return {"status": "ok"}

# ---------------- ESCALATION ----------------
# async def escalate_if_not_ack(alert_id: int):
#     print("⏳ Escalation timer started for alert", alert_id)

#     await asyncio.sleep(10)  # 🔴 TEMP: 10 seconds for testing

#     db = SessionLocal()
#     alert = db.query(models.Alert).get(alert_id)

#     if not alert:
#         print("❌ Alert not found")
#         db.close()
#         return

#     if alert.acknowledged:
#         print("✅ Alert acknowledged, stopping escalation")
#         db.close()
#         return

#     if alert.escalated:
#         print("⚠️ Alert already escalated")
#         db.close()
#         return

#     patient = db.query(models.Patient).get(alert.patient_id)
#     user = db.query(models.User).get(patient.user_id)

#     print("🚨 ESCALATING ALERT", alert_id)
#     print("📞 Emergency contacts:", patient.get_contacts())

#     call_family(patient.get_contacts(), user.full_name or user.username)

#     alert.escalated = True
#     db.commit()
#     db.close()

async def escalate_if_not_ack(alert_id: int):
    print(f"⏳ [Escalation] Timer started for alert {alert_id}")

    await asyncio.sleep(30)  # ⏱ Reduced to 30s for faster debugging (was 180)

    db = SessionLocal()
    try:
        alert = db.query(models.Alert).get(alert_id)

        if not alert:
            print(f"❌ [Escalation] Alert {alert_id} not found in DB")
            return

        print(f"🔍 [Escalation] Checking alert {alert_id}: ack={alert.acknowledged}, esc={alert.escalated}")

        if alert.acknowledged:
            print(f"✅ [Escalation] Alert {alert_id} already acknowledged, stopping")
            return

        if alert.escalated:
            print(f"⚠️ [Escalation] Alert {alert_id} already escalated, stopping")
            return

        patient = db.query(models.Patient).get(alert.patient_id)
        if not patient:
            print(f"❌ [Escalation] Patient for alert {alert_id} not found")
            return

        user = db.query(models.User).get(patient.user_id)
        if not user:
            print(f"❌ [Escalation] User for alert {alert_id} not found")
            return

        contacts = patient.get_contacts()
        print(f"🚨 [Escalation] ESCALATING alert {alert_id}. Contacts: {contacts}")

        if not contacts:
            print(f"⚠️ [Escalation] No contacts found for patient {patient.id}")
        else:
            # 📞 AUTO CALL FAMILY
            call_family(contacts, user.full_name or user.username)

        # 📧 SEND LOCATION EMAIL
        location_url = None
        if patient.lat and patient.lng:
            location_url = f"https://www.google.com/maps?q={patient.lat},{patient.lng}"

        if user.email and location_url:
            send_email(
                user.email,
                "🚨 MediWatch Emergency – Patient Live Location",
                f"CRITICAL HEALTH EMERGENCY\n\nPatient: {user.full_name or user.username}\nLive Location: {location_url}"
            )
            print("📧 [Escalation] Emergency location email sent")

        alert.escalated = True
        db.commit()
        print(f"📈 [Escalation] Alert {alert_id} marked as escalated in DB")

    except Exception as e:
        print(f"💥 [Escalation] CRITICAL ERROR: {e}")
    finally:
        db.close()


# ---------------- READINGS ----------------
@app.post("/readings")
async def receive_reading(r: dict, db: Session = Depends(get_db)):
    r["timestamp"] = r.get("timestamp") or datetime.now(timezone.utc).isoformat()

    reading = models.Reading(
        patient_id=r["patient_id"],
        heart_rate=r["heart_rate"],
        spo2=r["spo2"],
        bp_sys=r["bp_sys"],
        bp_dia=r["bp_dia"],
        temperature=r["temperature"],
        hash=utils.sha256_hash_reading(r),
    )
    db.add(reading)
    db.commit()

    issues = ml_detector.threshold_check(r)
    if issues:
        alert = models.Alert(
            patient_id=r["patient_id"],
            severity="critical",
            message="; ".join(issues),
        )
        db.add(alert)
        db.commit()

        # 🔥 FETCH PATIENT + USER
        patient = db.query(models.Patient).get(alert.patient_id)
        user = db.query(models.User).get(patient.user_id)

        # 🔥 IMMEDIATE ALERT EMAIL (THIS WAS MISSING)
        if user and user.email:
            send_email(
                user.email,
                "🚨 MediWatch Critical Alert",
                f"""
CRITICAL HEALTH ALERT

Patient: {user.full_name or user.username}
Issues Detected:
{alert.message}

Time (IST): {ist_str(alert.timestamp)}
Patient ID: {alert.patient_id}

Please check the MediWatch dashboard immediately.
"""
            )

        # 🔥 REAL-TIME ALERT TO DOCTOR UI
        await manager.broadcast_json({
            "type": "alert",
            "alert": {
                "id": alert.id,
                "patient_id": alert.patient_id,
                "severity": alert.severity,
                "message": alert.message
            }
        })

        # 🔥 START 3-MIN ESCALATION TIMER
        asyncio.create_task(escalate_if_not_ack(alert.id))

    # 🔥 ALWAYS SEND READING
    await manager.broadcast_json({
        "type": "reading",
        "reading": r
    })

    return {"status": "ok"}

# ---------------- WEBSOCKET ----------------
@app.websocket("/ws")
async def ws(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
            await ws.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(ws)

# ---------------- PATIENTS ----------------
@app.get("/patients")
def list_patients(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    patients = db.query(models.Patient).all() if current_user.role == "doctor" \
        else db.query(models.Patient).filter_by(user_id=current_user.id).all()

    return [{
    "id": p.id,
    "user": {
        "username": p.user.username,
        "full_name": p.user.full_name,
        "email": p.user.email
    },
    "emergency_contacts": p.get_contacts(),
    "lat": p.lat,          # ✅ ADD
    "lng": p.lng           # ✅ ADD
} for p in patients]


# ---------------- ALERT ACK ----------------
@app.post("/alerts/{alert_id}/ack")
def ack(alert_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "doctor":
        raise HTTPException(403)

    alert = db.query(models.Alert).get(alert_id)
    alert.acknowledged = True
    alert.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "acknowledged"}


# ---------------- CONTACTS ----------------
@app.put("/patients/{patient_id}/contacts")
def update_contacts(patient_id: int, payload: dict, db: Session = Depends(get_db),
                    current_user: models.User = Depends(get_current_user)):
    patient = db.query(models.Patient).get(patient_id)
    if patient.user_id != current_user.id:
        raise HTTPException(403)

    patient.set_contacts(payload.get("emergency_contacts", [])[:3])
    db.commit()
    return {"status": "updated"}
@app.get("/reports/pdf")
def generate_pdf(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    readings = (
        db.query(models.Reading)
        .order_by(models.Reading.timestamp.desc())
        .limit(limit)
        .all()
    )

    if not readings:
        raise HTTPException(status_code=404, detail="No readings found")

    rows = ""
    for r in readings:
        rows += f"""
        <tr>
            <td>{r.patient_id}</td>
            <td>{ist_str(r.timestamp)}</td>
            <td>{r.heart_rate}</td>
            <td>{r.spo2}</td>
            <td>{r.bp_sys}/{r.bp_dia}</td>
            <td>{r.temperature}</td>
        </tr>
        """

    html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial; font-size: 12px; }}
            table {{ width: 100%; border-collapse: collapse; }}
            th, td {{ border: 1px solid #333; padding: 6px; text-align: center; }}
            th {{ background: #f0f0f0; }}
        </style>
    </head>
    <body>
        <h2>MediWatch – Patient Report</h2>
        <p>User: {current_user.username}</p>
        <p>Generated: {ist_str(datetime.utcnow())}</p>
        <table>
            <tr>
                <th>Patient</th>
                <th>Time</th>
                <th>HR</th>
                <th>SpO₂</th>
                <th>BP</th>
                <th>Temp</th>
            </tr>
            {rows}
        </table>
    </body>
    </html>
    """

    pdf_bytes = pdfkit.from_string(
        html,
        False,
        configuration=pdf_config
    )

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=mediwatch_report.pdf"
        },
    )
# ✅ GET FIRST
@app.get("/patients/{patient_id}/notes")
def list_notes(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.DoctorNote)
        .filter_by(patient_id=patient_id)
        .order_by(models.DoctorNote.created_at.desc())
        .all()
    )


# ✅ POST SECOND
@app.post("/patients/{patient_id}/notes")
def add_note(
    patient_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != "doctor":
        raise HTTPException(403)

    note = models.DoctorNote(
        patient_id=patient_id,
        doctor_id=current_user.id,
        note=payload.get("note", ""),
    )
    db.add(note)
    db.commit()

    return {"status": "saved"}
# ---------------- PATIENT LOCATION ----------------
@app.post("/patients/{patient_id}/location")
def update_patient_location(
    patient_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    patient = db.query(models.Patient).get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Only the patient themselves can update their location
    if patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    patient.lat = payload.get("lat")
    patient.lng = payload.get("lng")

    db.commit()
    return {"status": "location updated"}
