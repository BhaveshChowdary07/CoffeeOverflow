
from app.db import SessionLocal, engine
from app import models

def seed():
    db = SessionLocal()
    # Create tables if not exists (done by app anyway but just in case)
    models.Base.metadata.create_all(bind=engine)

    if db.query(models.Hospital).first():
        print("Hospitals already seeded.")
        db.close()
        return

    # Seed Hospitals
    hospitals = [
        models.Hospital(name="City Multispecialty Hospital", address="123 Health Ave", city="Hyderabad", lat=17.3850, lng=78.4867),
        models.Hospital(name="Global Care Medical Center", address="456 Wellness Rd", city="Hyderabad", lat=17.4000, lng=78.5000),
        models.Hospital(name="St. Mary's Orthopedic & Cardio", address="789 Recovery Blvd", city="Hyderabad", lat=17.4200, lng=78.4500),
    ]
    db.add_all(hospitals)
    db.commit()

    # Seed Doctors
    for h in hospitals:
        doctors = [
            models.HospitalDoctor(hospital_id=h.id, name=f"Dr. Cardiology at {h.name}", specialty="cardiology"),
            models.HospitalDoctor(hospital_id=h.id, name=f"Dr. Orthopedic at {h.name}", specialty="ortho"),
            models.HospitalDoctor(hospital_id=h.id, name=f"Dr. Oncology at {h.name}", specialty="oncho"),
        ]
        db.add_all(doctors)
    db.commit()
    print("Seed complete.")
    db.close()

if __name__ == "__main__":
    seed()
