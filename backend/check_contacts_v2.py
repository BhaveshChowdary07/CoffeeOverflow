
import os
from dotenv import load_dotenv
load_dotenv()

from app.db import SessionLocal
from app import models

db = SessionLocal()
try:
    p = db.query(models.Patient).filter_by(id=1).first()
    if p:
        print(f"PATIENT_ID_1_FOUND")
        print(f"CONTACT_DATA:{p.emergency_contacts}")
    else:
        print("PATIENT_ID_1_NOT_FOUND")
finally:
    db.close()
