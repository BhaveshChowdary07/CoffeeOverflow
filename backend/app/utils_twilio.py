from twilio.rest import Client
import os

ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
FROM_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

client = Client(ACCOUNT_SID, AUTH_TOKEN)

def call_family(numbers, patient_name):
    print("📞 Twilio call initiated")
    print("FROM:", FROM_NUMBER)
    print("TO LIST:", numbers)

    for num in numbers:
        try:
            call = client.calls.create(
                to=num,
                from_=FROM_NUMBER,
                twiml=f"""
<Response>
  <Say voice="alice">
    Emergency alert from MediWatch.
    Patient {patient_name} is in critical condition.
    Please seek immediate medical help.
  </Say>
</Response>
"""
            )
            print("✅ Calling", num, "SID:", call.sid)

        except Exception as e:
            print("❌ Twilio call failed:", e)
