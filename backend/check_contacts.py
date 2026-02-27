
from app.db import SessionLocal
from app import models
import json

db = SessionLocal()
patient = db.query(models.Patient).get(1)
if patient:
    print(f"Patient ID: {patient.id}")
    print(f"Contacts: {patient.emergency_contacts}")
    print(f"Parsed Contacts: {patient.get_contacts()}")
else:
    print("Patient 1 not found")
db.close()
