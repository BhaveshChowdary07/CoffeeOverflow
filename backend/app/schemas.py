# from pydantic import BaseModel
# from typing import Optional
# import datetime

# # ---------- Auth / Users ----------

# class UserBase(BaseModel):
#     username: str
#     full_name: Optional[str] = None
#     role: str = "patient"

# class UserCreate(UserBase):
#     password: str

# class UserOut(UserBase):
#     id: int

#     class Config:
#         orm_mode = True

# class Token(BaseModel):
#     access_token: str
#     token_type: str

# class TokenData(BaseModel):
#     username: Optional[str] = None

# # ---------- Readings / Alerts ----------

# class ReadingCreate(BaseModel):
#     patient_id: int
#     heart_rate: float
#     spo2: float
#     bp_sys: float
#     bp_dia: float
#     temperature: float
#     timestamp: Optional[datetime.datetime]

# class AlertOut(BaseModel):
#     id: int
#     patient_id: int
#     timestamp: datetime.datetime
#     severity: str
#     message: str

#     class Config:
#         orm_mode = True
# backend/app/schemas.py

# # backend/app/schemas.py
# from pydantic import BaseModel, EmailStr
# from typing import List, Optional
# import datetime

# # ---------- Auth / Users ----------

# class UserBase(BaseModel):
#     username: str
#     full_name: Optional[str] = None
#     role: str = "patient"
#     email: Optional[EmailStr] = None


# class UserCreate(UserBase):
#     password: str


# class UserOut(UserBase):
#     id: int
#     created_at: Optional[datetime.datetime] = None

#     class Config:
#         orm_mode = True


# class Token(BaseModel):
#     access_token: str
#     token_type: str


# class TokenData(BaseModel):
#     username: Optional[str] = None


# # ---------- Readings / Alerts ----------

# class ReadingCreate(BaseModel):
#     patient_id: int
#     heart_rate: float
#     spo2: float
#     bp_sys: float
#     bp_dia: float
#     temperature: float
#     timestamp: Optional[datetime.datetime]


# class AlertOut(BaseModel):
#     id: int
#     patient_id: int
#     timestamp: datetime.datetime
#     severity: str
#     message: str

#     class Config:
#         orm_mode = True


# # ---------- Patients / Emergency Contacts ----------
# # ---------- Patients / Emergency Contacts ----------

# class PatientOut(BaseModel):
#     id: int
#     user_id: int
#     assigned_doctor_id: Optional[int]
#     emergency_contacts: List[str] = []

#     class Config:
#         orm_mode = True


# class PatientUpdateContacts(BaseModel):
#     emergency_contacts: List[str]  # up to 3


# # NEW: for doctor to see basic user info
# class PatientUserInfo(BaseModel):
#     username: str
#     full_name: Optional[str] = None
#     email: Optional[EmailStr] = None

#     class Config:
#         orm_mode = True


# class PatientWithUserOut(PatientOut):
#     user: Optional[PatientUserInfo] = None

# backend/app/schemas.py
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import datetime

# ---------- Auth / Users ----------

class UserBase(BaseModel):
    username: str
    full_name: Optional[str] = None
    role: str = "patient"
    email: Optional[EmailStr] = None


class UserCreate(UserBase):
    password: str


class UserOut(UserBase):
    id: int
    created_at: Optional[datetime.datetime] = None

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# ---------- Readings / Alerts ----------

class ReadingCreate(BaseModel):
    patient_id: int
    heart_rate: float
    spo2: float
    bp_sys: float
    bp_dia: float
    temperature: float
    timestamp: Optional[datetime.datetime]


class AlertOut(BaseModel):
    id: int
    patient_id: int
    timestamp: datetime.datetime
    severity: str
    message: str

    class Config:
        orm_mode = True


# ---------- Patients / Emergency Contacts ----------

class PatientOut(BaseModel):
    id: int
    user_id: int
    assigned_doctor_id: Optional[int]
    emergency_contacts: List[str] = []

    class Config:
        orm_mode = True


class PatientUpdateContacts(BaseModel):
    # body of PUT /patients/{id}/contacts
    emergency_contacts: List[str]  # up to 3


# This is what the doctor UI wants from /patients:
# patient info + nested user {username, full_name, email, ...}
class PatientWithUserOut(PatientOut):
    user: UserOut
