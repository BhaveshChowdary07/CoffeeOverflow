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
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="patient")  # doctor / patient
    hashed_password = Column(String, nullable=False)
    email = Column(String, nullable=True)
    theme = Column(String, default="dark")
    created_at = Column(DateTime, default=datetime.utcnow)

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


# ===================== PATIENT =====================
class Patient(Base):
    __tablename__ = "patients"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    assigned_doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    emergency_contacts = Column(Text, default="[]", nullable=False)

    # ✅ LIVE LOCATION
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)

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
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)
    heart_rate = Column(Float)
    spo2 = Column(Float)
    bp_sys = Column(Float)
    bp_dia = Column(Float)
    temperature = Column(Float)
    hash = Column(String(128))


# ===================== ALERT =====================
class Alert(Base):
    __tablename__ = "alerts"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)
    severity = Column(String)
    message = Column(Text)

    resolved = Column(Boolean, default=False)
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(Integer, nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    escalated = Column(Boolean, default=False)


# ===================== DOCTOR NOTES =====================
class DoctorNote(Base):
    __tablename__ = "doctor_notes"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer)
    doctor_id = Column(Integer)
    note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


# ===================== AUDIT LOG =====================
class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    action = Column(String)
    details = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
