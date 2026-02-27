from fastapi import APIRouter
from .hospital_finder import find_nearest_hospital

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])

@router.get("/nearest")
def nearest(lat: float, lng: float):
    return find_nearest_hospital(lat, lng)
