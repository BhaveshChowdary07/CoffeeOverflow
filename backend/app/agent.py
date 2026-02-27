from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from . import models, schemas
from .db import get_db
from .auth import get_current_user
from .hospital_finder import find_nearest_hospitals
from datetime import datetime, timedelta
from pydantic import BaseModel
import random

router = APIRouter(prefix="/agent", tags=["Agent Chatbot"])

# ── Standard DB-backed hospital routes ───────────────────────────────────────

@router.get("/hospitals", response_model=List[schemas.HospitalOut])
def get_hospitals(db: Session = Depends(get_db)):
    return db.query(models.Hospital).all()


@router.get("/hospitals/{hospital_id}/specialties")
def get_specialties(hospital_id: int, db: Session = Depends(get_db)):
    h = db.query(models.Hospital).get(hospital_id)
    if not h:
        raise HTTPException(status_code=404, detail="Hospital not found")
    specs = db.query(models.HospitalDoctor.specialty).filter_by(hospital_id=hospital_id).distinct().all()
    return [s[0] for s in specs]


@router.get("/hospitals/{hospital_id}/availability")
def get_availability(hospital_id: int, specialty: str, db: Session = Depends(get_db)):
    now = datetime.now()
    slots = []
    for i in range(1, 4):  # next 3 days
        day = now + timedelta(days=i)
        for hour in [9, 10, 11, 14, 15, 16]:
            slots.append(day.replace(hour=hour, minute=0, second=0, microsecond=0).isoformat())
    return slots


# ── Live Google Places nearby hospitals for chatbot ───────────────────────────

@router.get("/nearby-hospitals")
def get_nearby_hospitals(
    lat: float = Query(...),
    lng: float = Query(...)
):
    """
    Returns real multispeciality hospitals near the given coordinates.
    Used by the chatbot to show live hospital options.
    """
    results = find_nearest_hospitals(lat, lng, radius_km=30)
    return results


# ── Fixed specialty list ──────────────────────────────────────────────────────

SPECIALTIES = [
    "Cardiology",
    "Oncology",
    "Orthopedics",
    "Neurology",
    "Pulmonology",
    "Gastroenterology",
    "Nephrology",
    "General Medicine",
]

@router.get("/specialties")
def all_specialties():
    return SPECIALTIES


# ── Time slot generator (no doctor required) ─────────────────────────────────

@router.get("/slots")
def get_slots(days_ahead: int = 3):
    """Generate available appointment slots for the next N days."""
    now = datetime.now()
    slots = []
    for i in range(1, days_ahead + 1):
        day = now + timedelta(days=i)
        for hour in [9, 10, 11, 14, 15, 16]:
            slots.append(day.replace(hour=hour, minute=0, second=0, microsecond=0).isoformat())
    return slots


# ── External (Google Maps hospital) booking ───────────────────────────────────

class ExternalBookingCreate(BaseModel):
    hospital_name: str
    hospital_address: str
    hospital_lat: Optional[float] = None
    hospital_lng: Optional[float] = None
    specialty: str
    appointment_time: str   # ISO string
    user_input: Optional[str] = None


@router.post("/book-external")
def book_external_appointment(
    payload: ExternalBookingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Book an appointment at a Google Places hospital (not in our DB catalog).
    Creates/finds a Hospital record, then creates the Appointment.
    """
    patient = db.query(models.Patient).filter_by(user_id=current_user.id).first()
    if not patient:
        raise HTTPException(status_code=400, detail="Only patients can book appointments")

    # Find or create hospital record
    hospital = db.query(models.Hospital).filter_by(name=payload.hospital_name).first()
    if not hospital:
        hospital = models.Hospital(
            name=payload.hospital_name,
            address=payload.hospital_address,
            city=payload.hospital_address.split(",")[-1].strip() if payload.hospital_address else "Hyderabad",
            lat=payload.hospital_lat,
            lng=payload.hospital_lng,
            is_multi_specialty=True,
        )
        db.add(hospital)
        db.commit()
        db.refresh(hospital)

    # Parse appointment time
    try:
        appt_time = datetime.fromisoformat(payload.appointment_time)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid appointment_time format. Use ISO 8601.")

    appt = models.Appointment(
        patient_id=patient.id,
        hospital_id=hospital.id,
        doctor_id=None,         # hospital will assign a doctor
        specialty=payload.specialty,
        appointment_time=appt_time,
        user_input=payload.user_input,
        status="scheduled",
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)

    return {
        "id": appt.id,
        "hospital": hospital.name,
        "specialty": appt.specialty,
        "appointment_time": appt.appointment_time.isoformat(),
        "status": appt.status,
    }


# ── Existing book endpoint (DB hospital) ────────────────────────────────────

@router.post("/book", response_model=schemas.AppointmentOut)
def book_appointment(
    payload: schemas.AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    patient = db.query(models.Patient).filter_by(user_id=current_user.id).first()
    if not patient:
        raise HTTPException(status_code=400, detail="Only patients can book appointments")

    # Try to find an available doctor
    doctor = db.query(models.HospitalDoctor).filter_by(
        hospital_id=payload.hospital_id,
        specialty=payload.specialty,
        is_available=True,
        in_emergency=False
    ).first()

    appt = models.Appointment(
        patient_id=patient.id,
        hospital_id=payload.hospital_id,
        doctor_id=doctor.id if doctor else None,
        specialty=payload.specialty,
        appointment_time=payload.appointment_time,
        user_input=payload.user_input,
        status="scheduled"
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return appt


# ── Appointments for current patient ─────────────────────────────────────────

@router.get("/appointments/me", response_model=List[schemas.AppointmentOut])
def get_my_appointments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    patient = db.query(models.Patient).filter_by(user_id=current_user.id).first()
    if not patient:
        return []
    return (
        db.query(models.Appointment)
        .filter_by(patient_id=patient.id)
        .order_by(models.Appointment.appointment_time.asc())
        .all()
    )


# ── Appointments for doctor (all their assigned patients) ────────────────────

@router.get("/appointments/doctor")
def get_doctor_appointments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Returns all appointments for patients assigned to this doctor.
    """
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access this endpoint")

    # Get all patients assigned to this doctor
    patients = db.query(models.Patient).filter_by(assigned_doctor_id=current_user.id).all()
    patient_ids = [p.id for p in patients]

    if not patient_ids:
        return []

    appts = (
        db.query(models.Appointment)
        .filter(models.Appointment.patient_id.in_(patient_ids))
        .order_by(models.Appointment.appointment_time.asc())
        .all()
    )

    result = []
    for a in appts:
        patient_obj = db.query(models.Patient).get(a.patient_id)
        user_obj = db.query(models.User).get(patient_obj.user_id) if patient_obj else None
        hospital_obj = db.query(models.Hospital).get(a.hospital_id)

        result.append({
            "id": a.id,
            "patient_id": a.patient_id,
            "patient_name": user_obj.full_name or user_obj.username if user_obj else f"Patient {a.patient_id}",
            "hospital": hospital_obj.name if hospital_obj else "Unknown",
            "specialty": a.specialty,
            "appointment_time": a.appointment_time.isoformat(),
            "status": a.status,
            "user_input": a.user_input,
        })

    return result


# ── Emergency shift ──────────────────────────────────────────────────────────

@router.post("/emergency-shift")
def trigger_emergency(doctor_id: int, db: Session = Depends(get_db)):
    doc = db.query(models.HospitalDoctor).get(doctor_id)
    if not doc:
        raise HTTPException(404, "Doctor not found")

    doc.in_emergency = True
    db.commit()

    appts = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == doctor_id,
        models.Appointment.appointment_time > datetime.now(),
        models.Appointment.status == "scheduled"
    ).all()

    shifted_count = 0
    for appt in appts:
        alt_doc = db.query(models.HospitalDoctor).filter(
            models.HospitalDoctor.hospital_id == appt.hospital_id,
            models.HospitalDoctor.specialty == appt.specialty,
            models.HospitalDoctor.id != doctor_id,
            models.HospitalDoctor.is_available == True,
            models.HospitalDoctor.in_emergency == False
        ).first()

        if alt_doc:
            appt.doctor_id = alt_doc.id
            appt.status = "shifted"
            shifted_count += 1

    db.commit()
    return {"status": "emergency triggered", "shifted_appointments": shifted_count}
