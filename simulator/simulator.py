import requests
import time
import random
import datetime
import sys

BACKEND = 'http://localhost:8000/readings'


def random_reading(patient_id: int):
    # baseline values
    hr = random.gauss(72, 7)
    spo2 = random.gauss(97, 1)
    bp_sys = random.gauss(120, 8)
    bp_dia = random.gauss(80, 6)
    temp = random.gauss(36.6, 0.3)

    # occasional anomalies
    if random.random() < 0.01:
        hr += random.choice([-40, 50])
    if random.random() < 0.01:
        spo2 -= random.uniform(8, 15)
    if random.random() < 0.01:
        bp_sys += random.uniform(60, 90)
    if random.random() < 0.01:
        temp += random.uniform(3.0, 4.0)

    return {
        "patient_id": patient_id,
        "heart_rate": round(hr, 1),
        "spo2": round(spo2, 1),
        "bp_sys": round(bp_sys, 1),
        "bp_dia": round(bp_dia, 1),
        "temperature": round(temp, 2),
        "timestamp": datetime.datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    # usage: python simulator.py 1   (or 2, 3, ...)
    if len(sys.argv) >= 2:
        patient_id = int(sys.argv[1])
    else:
        patient_id = 1

    print(f"Starting simulator for patient_id={patient_id}")
    while True:
        r = random_reading(patient_id)
        try:
            res = requests.post(BACKEND, json=r, timeout=3)
            print(f"sent p={patient_id}", r, "status", res.status_code)
        except Exception as e:
            print("error", e)
        time.sleep(random.uniform(1.0, 2.0))
