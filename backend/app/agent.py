from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas
from .db import get_db
from .auth import get_current_user
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/agent", tags=["Agent Chatbot"])

@router.get("/hospitals", response_model=List[schemas.HospitalOut])
def get_hospitals(db: Session = Depends(get_db)):
    # In a real app, we'd filter by city/location
    return db.query(models.Hospital).all()

@router.get("/hospitals/{hospital_id}/specialties")
def get_specialties(hospital_id: int, db: Session = Depends(get_db)):
    h = db.query(models.Hospital).get(hospital_id)
    if not h:
        raise HTTPException(status_code=404, detail="Hospital not found")
    
    # Get unique specialties from doctors at this hospital
    specs = db.query(models.HospitalDoctor.specialty).filter_by(hospital_id=hospital_id).distinct().all()
    return [s[0] for s in specs]

@router.get("/hospitals/{hospital_id}/availability")
def get_availability(hospital_id: int, specialty: str, db: Session = Depends(get_db)):
    # Simple logic: return some time slots for the next 2 days
    now = datetime.now()
    slots = []
    for i in range(1, 3): # next 2 days
        day = now + timedelta(days=i)
        for hour in [9, 10, 11, 14, 15, 16]:
            slots.append(day.replace(hour=hour, minute=0, second=0, microsecond=0))
    
    return slots

@router.post("/book", response_model=schemas.AppointmentOut)
def book_appointment(
    payload: schemas.AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    patient = db.query(models.Patient).filter_by(user_id=current_user.id).first()
    if not patient:
        raise HTTPException(status_code=400, detail="Only patients can book appointments")

    # Pick an available doctor for this specialty
    doctor = db.query(models.HospitalDoctor).filter_by(
        hospital_id=payload.hospital_id,
        specialty=payload.specialty,
        is_available=True,
        in_emergency=False
    ).first()

    if not doctor:
        # If no doctor available now, we still create it and hospital can assign later
        # but the user request implies we "assign a doc"
        raise HTTPException(status_code=400, detail="No available doctor for this specialty at the moment")

    appt = models.Appointment(
        patient_id=patient.id,
        hospital_id=payload.hospital_id,
        doctor_id=doctor.id,
        specialty=payload.specialty,
        appointment_time=payload.appointment_time,
        user_input=payload.user_input,
        status="scheduled"
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return appt

@router.get("/appointments/me", response_model=List[schemas.AppointmentOut])
def get_my_appointments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    patient = db.query(models.Patient).filter_by(user_id=current_user.id).first()
    if not patient:
        return []
    return db.query(models.Appointment).filter_by(patient_id=patient.id).order_by(models.Appointment.appointment_time.asc()).all()


@router.post("/emergency-shift")
def trigger_emergency(doctor_id: int, db: Session = Depends(get_db)):
    """
    Simulate a doctor entering an emergency.
    Auto-shifts their upcoming appointments.
    """
    doc = db.query(models.HospitalDoctor).get(doctor_id)
    if not doc:
        raise HTTPException(404, "Doctor not found")
    
    doc.in_emergency = True
    db.commit()

    # Find upcoming appointments for this doctor
    appts = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == doctor_id,
        models.Appointment.appointment_time > datetime.now(),
        models.Appointment.status == "scheduled"
    ).all()

    shifted_count = 0
    for appt in appts:
        # Try to find another doctor in the same hospital/specialty
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
