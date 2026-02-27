import os
from twilio.rest import Client

client = Client(
    os.getenv("TWILIO_ACCOUNT_SID"),
    os.getenv("TWILIO_AUTH_TOKEN")
)

def call_number(phone, message):
    client.calls.create(
        to=phone,
        from_=os.getenv("TWILIO_PHONE_NUMBER"),
        twiml=f"""
        <Response>
          <Say voice="alice">{message}</Say>
        </Response>
        """
    )
