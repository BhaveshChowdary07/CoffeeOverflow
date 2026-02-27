from sqlalchemy import (
    Column, Integer, String, Float,
    DateTime, Boolean, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from .db import Base
from datetime import datetime
import json


# ===================== USER =====================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String)
    role = Column(String, default="patient")  # doctor / patient
    hashed_password = Column(String, nullable=False)
    email = Column(String)
    theme = Column(String, default="dark")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient = relationship(
        "Patient",
        uselist=False,
        back_populates="user",
        foreign_keys="Patient.user_id",
    )

    patients_assigned = relationship(
        "Patient",
        back_populates="doctor",
        foreign_keys="Patient.assigned_doctor_id",
    )

    audit_logs = relationship("AuditLog", back_populates="user")


# ===================== PATIENT =====================
class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    assigned_doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    emergency_contacts = Column(Text, default="[]", nullable=False)

    lat = Column(Float)
    lng = Column(Float)

    # Relationships
    user = relationship(
        "User",
        back_populates="patient",
        foreign_keys=[user_id],
    )

    doctor = relationship(
        "User",
        back_populates="patients_assigned",
        foreign_keys=[assigned_doctor_id],
    )

    readings = relationship("Reading", back_populates="patient")
    alerts = relationship("Alert", back_populates="patient")
    doctor_notes = relationship("DoctorNote", back_populates="patient")

    def get_contacts(self):
        try:
            return json.loads(self.emergency_contacts)
        except Exception:
            return []

    def set_contacts(self, contacts):
        self.emergency_contacts = json.dumps(contacts)


# ===================== READING =====================
class Reading(Base):
    __tablename__ = "readings"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)

    heart_rate = Column(Float)
    spo2 = Column(Float)
    bp_sys = Column(Float)
    bp_dia = Column(Float)
    temperature = Column(Float)
    hash = Column(String(128))

    patient = relationship("Patient", back_populates="readings")


# ===================== ALERT =====================
class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)

    severity = Column(String)
    message = Column(Text)

    resolved = Column(Boolean, default=False)
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime)
    escalated = Column(Boolean, default=False)

    patient = relationship("Patient", back_populates="alerts")


# ===================== DOCTOR NOTES =====================
class DoctorNote(Base):
    __tablename__ = "doctor_notes"

    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_id = Column(Integer, ForeignKey("users.id"))

    note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="doctor_notes")


# ===================== AUDIT LOG =====================
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    action = Column(String)
    details = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")


# ===================== HOSPITAL =====================
class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String)
    city = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    is_multi_specialty = Column(Boolean, default=True)

    doctors = relationship("HospitalDoctor", back_populates="hospital")
    appointments = relationship("Appointment", back_populates="hospital")


# ===================== HOSPITAL DOCTOR =====================
class HospitalDoctor(Base):
    __tablename__ = "hospital_doctors"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    name = Column(String, nullable=False)
    specialty = Column(String)  # oncology, cardiology, orthopedics, etc.
    is_available = Column(Boolean, default=True)
    in_emergency = Column(Boolean, default=False)

    hospital = relationship("Hospital", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")


# ===================== APPOINTMENT =====================
class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    hospital_id = Column(Integer, ForeignKey("hospitals.id"))
    doctor_id = Column(Integer, ForeignKey("hospital_doctors.id"), nullable=True)
    specialty = Column(String)
    appointment_time = Column(DateTime)
    status = Column(String, default="scheduled")  # scheduled, completed, cancelled, shifted
    user_input = Column(Text)

    patient = relationship("Patient")
    hospital = relationship("Hospital", back_populates="appointments")
    doctor = relationship("HospitalDoctor", back_populates="appointments")