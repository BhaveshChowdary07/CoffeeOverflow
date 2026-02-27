from fastapi import APIRouter
from .hospital_finder import find_nearest_hospitals, find_nearest_hospital

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])


@router.get("/nearest")
def nearest(lat: float, lng: float, radius_km: float = 30):
    """
    Returns hospitals within `radius_km` km (straight-line Haversine).
    Default radius = 30 km.
    """
    results = find_nearest_hospitals(lat, lng, radius_km=radius_km)
    return results
