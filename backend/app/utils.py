# import hashlib

# def sha256_hash_reading(reading_dict: dict) -> str:
#     # reading_dict should have stable keys
#     s = f"{reading_dict['patient_id']}|{reading_dict['heart_rate']}|{reading_dict['spo2']}|{reading_dict['bp_sys']}|{reading_dict['bp_dia']}|{reading_dict['temperature']}|{reading_dict.get('timestamp','')}"
#     return hashlib.sha256(s.encode()).hexdigest()
# backend/app/utils.py
import hashlib


def sha256_hash_reading(reading_dict: dict) -> str:
    """
    reading_dict should have keys:
    patient_id, heart_rate, spo2, bp_sys, bp_dia, temperature, timestamp (optional)
    """
    s = (
        f"{reading_dict['patient_id']}|"
        f"{reading_dict['heart_rate']}|"
        f"{reading_dict['spo2']}|"
        f"{reading_dict['bp_sys']}|"
        f"{reading_dict['bp_dia']}|"
        f"{reading_dict['temperature']}|"
        f"{reading_dict.get('timestamp', '')}"
    )
    return hashlib.sha256(s.encode()).hexdigest()


def notify_family_numbers(numbers, alert):
    """
    Demo: simply log — replace with HTTP requests to SMS/GSM gateway in real system
    """
    for n in numbers:
        try:
            print(
                f"[MOCK-SMS] To {n}: Alert for patient {alert.patient_id} - {alert.message}"
            )
        except Exception as e:
            print("notify failed", e)
def audit(db, user_id: int, action: str, details: str = ""):
    from .models import AuditLog
    log = AuditLog(
        user_id=user_id,
        action=action,
        details=details,
    )
    db.add(log)
    db.commit()
