from fastapi import APIRouter
from .hospital_finder import find_nearest_hospital

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])

@router.get("/nearest")
def nearest(lat: float, lng: float):
    from .hospital_finder import find_nearest_hospitals
    return find_nearest_hospitals(lat, lng, radius_km=30)
