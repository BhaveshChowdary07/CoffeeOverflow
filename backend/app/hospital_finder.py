import requests
import os
import math
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance in kilometers between two points 
    on the earth (specified in decimal degrees)
    """
    # convert decimal degrees to radians 
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371 # Radius of earth in kilometers. Use 3956 for miles. Determines return value units.
    return c * r

def find_nearest_hospitals(lat, lng, radius_km=30):
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        "location": f"{lat},{lng}",
        "radius": 50000, # Max allowed radius is 50,000 meters for some types, but we will filter by distance
        "type": "hospital",
        "keyword": "multispeciality",
        "key": API_KEY
    }

    try:
        r = requests.get(url, params=params).json()
    except Exception as e:
        print(f"Error fetching from Google Maps: {e}")
        return []

    results = r.get("results", [])
    if not results:
        # Fallback without keyword if no multispeciality found? 
        # For now, let's keep it strict as per user request.
        return []

    processed_hospitals = []
    
    for h in results:
        h_lat = h["geometry"]["location"]["lat"]
        h_lng = h["geometry"]["location"]["lng"]
        
        # Calculate exact distance
        dist = haversine(lat, lng, h_lat, h_lng)
        
        # Apply filters:
        # 1. Distance check
        if dist > radius_km:
            continue
            
        # 2. Rating filters per user request
        rating = h.get("rating", 0)
        user_ratings_total = h.get("user_ratings_total", 0)
        
        if rating < 4 or user_ratings_total < 200:
            continue

        processed_hospitals.append({
            "name": h["name"],
            "address": h.get("vicinity", "Unknown"),
            "lat": h_lat,
            "lng": h_lng,
            "rating": rating,
            "user_ratings_total": user_ratings_total,
            "distance_km": round(dist, 2),
            "phone": "+914012345678" # Demo phone
        })

    # Sort by distance
    processed_hospitals.sort(key=lambda x: x["distance_km"])
    
    return processed_hospitals

# For backwards compatibility with original function name if needed
def find_nearest_hospital(lat, lng):
    hospitals = find_nearest_hospitals(lat, lng, radius_km=30)
    return hospitals[0] if hospitals else None
