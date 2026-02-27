import asyncio
from .db import SessionLocal
from .call_service import call_number
from . import models, utils

async def escalate(alert_id: int):
    await asyncio.sleep(180)  # 3 minutes

    db = SessionLocal()
    try:
        alert = db.query(models.Alert).get(alert_id)
        if not alert or alert.acknowledged:
            return

        patient = db.query(models.Patient).get(alert.patient_id)
        if not patient:
            return

        # 📞 CALL FAMILY NUMBERS ONLY
        for phone in patient.get_contacts():
            if phone:
                call_number(
                    phone,
                    f"Emergency. Patient is critical at {patient.address}"
                )

        utils.audit(db, None, "ESCALATION", "FAMILY_CALLS_ONLY")

    finally:
        db.close()
